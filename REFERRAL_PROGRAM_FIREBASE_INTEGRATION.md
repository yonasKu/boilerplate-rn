# Referral Program Firebase Integration Guide

## Overview
This guide details how to implement a referral program for the SproutBook app using Firebase, allowing users to share unique promo codes and receive benefits for successful referrals.

## Firebase Setup Requirements

### 1. Firestore Collections Structure

#### Users Collection (Extended)
```
collection: users
├── userId (string)
├── email (string)
├── referralCode (string) - Unique 6-8 character code
├── referralStats (object)
│   ├── totalReferrals (number)
│   ├── successfulReferrals (number)
│   └── lastReferralDate (timestamp)
├── referredBy (string, nullable) - referral code used during signup
├── createdAt (timestamp)
└── updatedAt (timestamp)
```

#### Referrals Collection
```
collection: referrals
├── referralId (string)
├── referrerUserId (string) - User who shared the code
├── referredUserId (string) - User who used the code
├── referralCode (string) - The actual code used
├── status (string: "pending" | "completed" | "expired")
├── rewardType (string: "extended_trial" | "discount")
├── rewardValue (object)
│   ├── trialExtensionDays (number) - 30 days for v1
│   └── discountAmount (number, nullable) - Future use
├── createdAt (timestamp)
├── completedAt (timestamp, nullable)
└── metadata (object)
    ├── source (string: "sms" | "email" | "link" | "manual")
    └── shareDate (timestamp)
```

#### PromoCodes Collection (Optional for future discount codes)
```
collection: promoCodes
├── code (string) - Unique promo code
├── type (string: "referral" | "promotional")
├── discountPercent (number)
├── validFrom (timestamp)
├── validUntil (timestamp)
├── maxUses (number)
├── currentUses (number)
├── createdBy (string) - admin or system
└── isActive (boolean)
```

### 2. Firebase Security Rules

#### Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    // Users collection - extended for referrals
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && isOwner(userId) &&
        // Allow updating referral stats and referredBy
        request.resource.data.keys().hasOnly([
          'referralStats', 'referredBy', 'updatedAt'
        ]);
      allow create: if true; // Allow signup with referral code
    }
    
    // Referrals collection
    match /referrals/{referralId} {
      allow read: if isAuthenticated() && 
        (resource.data.referrerUserId == request.auth.uid || 
         resource.data.referredUserId == request.auth.uid);
      allow create: if isAuthenticated() && 
        request.resource.data.referredUserId == request.auth.uid && // Only referred user can create
        request.resource.data.status == 'pending';
      allow update: if isAuthenticated() && 
        (resource.data.referrerUserId == request.auth.uid || 
         resource.data.referredUserId == request.auth.uid) &&
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status', 'completedAt']);
    }
    
    // Promo codes (read-only for users)
    match /promoCodes/{code} {
      allow read: if isAuthenticated() && 
        resource.data.isActive == true &&
        resource.data.validFrom <= request.time &&
        resource.data.validUntil >= request.time &&
        resource.data.currentUses < resource.data.maxUses;
      allow write: if false; // Only admins via admin SDK
    }
  }
}
```

### 3. Firebase Functions Setup

#### Cloud Functions for Referral Management

Create `functions/referralProgram.js`:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Generate unique referral code
exports.generateReferralCode = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;
  const userRef = admin.firestore().collection('users').doc(userId);
  
  // Check if user already has a referral code
  const userDoc = await userRef.get();
  if (userDoc.exists && userDoc.data().referralCode) {
    return { referralCode: userDoc.data().referralCode };
  }

  // Generate unique 6-character code
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let referralCode = '';
  let isUnique = false;
  
  while (!isUnique) {
    referralCode = '';
    for (let i = 0; i < 6; i++) {
      referralCode += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    // Check if code already exists
    const existingCode = await admin.firestore()
      .collection('users')
      .where('referralCode', '==', referralCode)
      .limit(1)
      .get();
    
    isUnique = existingCode.empty;
  }

  // Save referral code to user document
  await userRef.update({
    referralCode: referralCode,
    referralStats: {
      totalReferrals: 0,
      successfulReferrals: 0,
      lastReferralDate: null
    },
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return { referralCode };
});

// Process referral when new user signs up
exports.processReferral = functions.https.onCall(async (data, context) => {
  const { referralCode, referredUserId } = data;

  if (!referralCode || !referredUserId) {
    throw new functions.https.HttpsError('invalid-argument', 'Referral code and referred user ID are required');
  }

  // Find referrer by referral code
  const referrerQuery = await admin.firestore()
    .collection('users')
    .where('referralCode', '==', referralCode.toUpperCase())
    .limit(1)
    .get();

  if (referrerQuery.empty) {
    throw new functions.https.HttpsError('not-found', 'Invalid referral code');
  }

  const referrerDoc = referrerQuery.docs[0];
  const referrerUserId = referrerDoc.id;

  // Check if this referral already exists
  const existingReferral = await admin.firestore()
    .collection('referrals')
    .where('referrerUserId', '==', referrerUserId)
    .where('referredUserId', '==', referredUserId)
    .limit(1)
    .get();

  if (!existingReferral.empty) {
    throw new functions.https.HttpsError('already-exists', 'Referral already processed');
  }

  // Create referral record
  const referralId = `${referrerUserId}_${referredUserId}`;
  await admin.firestore().collection('referrals').doc(referralId).set({
    referralId,
    referrerUserId,
    referredUserId,
    referralCode: referralCode.toUpperCase(),
    status: 'completed',
    rewardType: 'extended_trial',
    rewardValue: {
      trialExtensionDays: 30
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    completedAt: admin.firestore.FieldValue.serverTimestamp(),
    metadata: {
      source: 'manual', // Will be updated based on share method
      shareDate: admin.firestore.FieldValue.serverTimestamp()
    }
  });

  // Update referrer's stats
  await referrerDoc.ref.update({
    'referralStats.totalReferrals': admin.firestore.FieldValue.increment(1),
    'referralStats.successfulReferrals': admin.firestore.FieldValue.increment(1),
    'referralStats.lastReferralDate': admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // Update referred user's trial period
  const referredUserRef = admin.firestore().collection('users').doc(referredUserId);
  const referredUserDoc = await referredUserRef.get();
  
  if (referredUserDoc.exists) {
    const userData = referredUserDoc.data();
    const currentTrialEnd = userData.subscription?.trialEndDate?.toDate() || new Date();
    const newTrialEnd = new Date(currentTrialEnd.getTime() + (30 * 24 * 60 * 60 * 1000)); // Add 30 days
    
    await referredUserRef.update({
      referredBy: referralCode.toUpperCase(),
      'subscription.trialEndDate': admin.firestore.Timestamp.fromDate(newTrialEnd),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  return { success: true, referrerUserId };
});

// Get user referral stats
exports.getReferralStats = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;
  const userDoc = await admin.firestore().collection('users').doc(userId).get();
  
  if (!userDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'User not found');
  }

  const userData = userDoc.data();
  
  // Get recent referrals
  const recentReferrals = await admin.firestore()
    .collection('referrals')
    .where('referrerUserId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(10)
    .get();

  const referrals = recentReferrals.docs.map(doc => doc.data());

  return {
    referralCode: userData.referralCode,
    referralStats: userData.referralStats || { totalReferrals: 0, successfulReferrals: 0 },
    recentReferrals: referrals
  };
});
```

### 4. Client-Side Implementation

#### Referral Service
Create `src/services/referralService.ts`:

```typescript
import { firebase } from '../lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export interface ReferralStats {
  referralCode: string;
  referralStats: {
    totalReferrals: number;
    successfulReferrals: number;
    lastReferralDate: Date | null;
  };
  recentReferrals: any[];
}

export interface ShareReferralOptions {
  method: 'sms' | 'email' | 'link';
  referralCode: string;
}

export class ReferralService {
  private functions = firebase.functions();
  private db = firebase.firestore();

  async generateReferralCode(): Promise<string> {
    const generateCode = httpsCallable(this.functions, 'generateReferralCode');
    const result = await generateCode();
    return result.data.referralCode;
  }

  async getReferralStats(): Promise<ReferralStats> {
    const getStats = httpsCallable(this.functions, 'getReferralStats');
    const result = await getStats();
    return result.data as ReferralStats;
  }

  async processReferral(referralCode: string, referredUserId: string): Promise<void> {
    const processRef = httpsCallable(this.functions, 'processReferral');
    await processRef({ referralCode, referredUserId });
  }

  async shareReferral(options: ShareReferralOptions): Promise<void> {
    const { method, referralCode } = options;
    const shareUrl = `https://sproutbook.app/signup?ref=${referralCode}`;
    const message = `Join SproutBook and get 30 days free! Use my code: ${referralCode} ${shareUrl}`;

    switch (method) {
      case 'sms':
        // Use expo-sms or similar
        break;
      case 'email':
        // Use expo-mail-composer or similar
        break;
      case 'link':
        // Use expo-clipboard
        break;
    }
  }

  async getUserReferralCode(userId: string): Promise<string | null> {
    const userDoc = await this.db.collection('users').doc(userId).get();
    return userDoc.exists ? userDoc.data()?.referralCode : null;
  }
}
```

### 5. UI Components

#### Referral Settings Screen
Create `src/features/settings/screens/ReferralScreen.tsx`:

```typescript
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Share } from 'react-native';
import { ReferralService } from '../../../services/referralService';
import { useAuth } from '../../../context/AuthContext';

const ReferralScreen = () => {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState('');
  const [referralStats, setReferralStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const referralService = new ReferralService();

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    try {
      setLoading(true);
      const stats = await referralService.getReferralStats();
      setReferralCode(stats.referralCode);
      setReferralStats(stats.referralStats);
    } catch (error) {
      console.error('Error loading referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (method: 'sms' | 'email' | 'link') => {
    const shareUrl = `https://sproutbook.app/signup?ref=${referralCode}`;
    const message = `Join SproutBook and get 30 days free! Use my code: ${referralCode}\n${shareUrl}`;

    try {
      if (method === 'link') {
        await Share.share({
          message,
          url: shareUrl,
        });
      } else {
        // Handle SMS/Email sharing
        await referralService.shareReferral({ method, referralCode });
      }
    } catch (error) {
      console.error('Error sharing referral:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Refer & Earn</Text>
        <Text style={styles.subtitle}>Share SproutBook with friends and give them 30 days free!</Text>
      </View>

      <View style={styles.codeSection}>
        <Text style={styles.codeLabel}>Your Referral Code</Text>
        <View style={styles.codeContainer}>
          <Text style={styles.code}>{referralCode || 'Loading...'}</Text>
          <TouchableOpacity onPress={() => handleShare('link')}>
            <Text style={styles.copyButton}>Copy</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsSection}>
        <Text style={styles.statsTitle}>Your Referrals</Text>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Total Referrals</Text>
          <Text style={styles.statValue}>{referralStats?.successfulReferrals || 0}</Text>
        </View>
      </View>

      <View style={styles.shareSection}>
        <Text style={styles.shareTitle}>Share Your Code</Text>
        <TouchableOpacity style={styles.shareButton} onPress={() => handleShare('sms')}>
          <Text style={styles.shareButtonText}>Share via SMS</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareButton} onPress={() => handleShare('email')}>
          <Text style={styles.shareButtonText}>Share via Email</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareButton} onPress={() => handleShare('link')}>
          <Text style={styles.shareButtonText}>Copy Link</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};
```

### 6. Signup Flow Integration

#### Update Signup Process
Modify `signUpWithEmail` in `auth.ts`:

```typescript
export const signUpWithEmail = async (
  email: string, 
  password: string, 
  firstName: string, 
  lastName: string,
  referralCode?: string // Add optional referral code
) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Send verification email
  await sendEmailVerification(user);
  
  // Create user profile in Firestore
  const fullName = `${firstName} ${lastName}`.trim();
  const now = new Date();
  let trialEndDate = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000); // 10 days default
  
  // Apply referral bonus if code provided
  if (referralCode) {
    trialEndDate = new Date(trialEndDate.getTime() + 30 * 24 * 60 * 60 * 1000); // Add 30 days
  }
  
  try {
    const { doc, setDoc } = await import('firebase/firestore');
    const { db } = await import('./firebaseConfig');
    
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      name: fullName,
      email: email,
      lifestage: null,
      referralCode: null, // Will be generated after signup
      referralStats: {
        totalReferrals: 0,
        successfulReferrals: 0,
        lastReferralDate: null
      },
      referredBy: referralCode?.toUpperCase() || null,
      subscription: {
        plan: 'free',
        status: 'trial',
        startDate: now,
        trialEndDate: trialEndDate
      },
      children: [],
      createdAt: now,
      updatedAt: now,
      onboarded: false
    });
    
    // Process referral if code provided
    if (referralCode) {
      const processReferral = httpsCallable(functions, 'processReferral');
      await processReferral({ referralCode, referredUserId: user.uid });
    }
    
    console.log('User profile created successfully');
  } catch (error) {
    console.error('Error creating user profile:', error);
  }
  
  return userCredential;
};
```

### 7. Deep Linking for Referrals

#### Configure app.json
```json
{
  "expo": {
    "scheme": "sproutbook",
    "intentFilters": [
      {
        "action": "VIEW",
        "autoVerify": true,
        "data": [
          {
            "scheme": "https",
            "host": "sproutbook.app",
            "pathPrefix": "/signup"
          }
        ],
        "category": ["BROWSABLE", "DEFAULT"]
      }
    ]
  }
}
```

### 8. Testing Checklist

- [ ] Generate unique referral codes for users
- [ ] Share codes via SMS, email, and link
- [ ] Sign up with valid referral code
- [ ] Verify 30-day trial extension applied
- [ ] Track referral statistics
- [ ] Handle invalid/expired referral codes
- [ ] Test deep link referral URLs
- [ ] Verify referral tracking accuracy
- [ ] Test edge cases (duplicate referrals, etc.)

### 9. Migration Strategy

For existing users:
1. **Generate codes** for all existing users
2. **Initialize referral stats** with zeros
3. **Set referredBy** to null for existing users

```javascript
// Migration function
exports.migrateExistingUsersForReferrals = functions.https.onRequest(async (req, res) => {
  const usersSnapshot = await admin.firestore().collection('users').get();
  
  const batch = admin.firestore().batch();
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  
  for (const doc of usersSnapshot.docs) {
    const userData = doc.data();
    if (!userData.referralCode) {
      // Generate unique code
      let referralCode = '';
      let isUnique = false;
      
      while (!isUnique) {
        referralCode = '';
        for (let i = 0; i < 6; i++) {
          referralCode += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        
        const existing = await admin.firestore()
          .collection('users')
          .where('referralCode', '==', referralCode)
          .limit(1)
          .get();
        
        isUnique = existing.empty;
      }
      
      batch.update(doc.ref, {
        referralCode: referralCode,
        referralStats: {
          totalReferrals: 0,
          successfulReferrals: 0,
          lastReferralDate: null
        },
        referredBy: null
      });
    }
  }
  
  await batch.commit();
  res.send('Referral migration completed');
});
```

## Next Steps
1. Set up Firebase Functions project
2. Deploy security rules
3. Create referral service
4. Build referral UI components
5. Test referral flow
6. Add analytics tracking
7. Deploy migration script for existing users
