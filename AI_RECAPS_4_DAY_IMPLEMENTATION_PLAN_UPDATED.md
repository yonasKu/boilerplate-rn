# AI Recaps 4-Day Implementation Plan - AUTOMATED

## Overview
Complete implementation of **automatically generated** weekly and monthly memory recaps using **scheduled Firebase Cloud Functions** - no user selection required. Recaps appear automatically every Monday and 1st of each month.

## Day 1: Foundation Setup (Automated Backend)

### Morning (4 hours)
#### Environment Configuration
```bash
# Install backend dependencies
npm install firebase-functions@latest firebase-admin@latest
npm install openai@latest          # For OpenAI
npm install @google/generative-ai  # For Gemini
```

#### Configuration Files
```typescript
// src/config/ai.config.ts
export const AI_CONFIG = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4-turbo-preview',
    maxTokens: 1000,
    temperature: 0.7
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: 'gemini-pro',
    maxOutputTokens: 1000,
    temperature:  0.7
  }
};
```

#### Environment Variables Setup
```bash
# .env.local (OpenAI)
OPENAI_API_KEY=sk-your-key-here

# .env.local (Gemini)
GEMINI_API_KEY=your-gemini-key-here

# Firebase Functions config
firebase functions:config:set openai.key="your-key"
firebase functions:config:set gemini.key="your-key"
```

### Afternoon (4 hours)
#### Firestore Collections Setup
```typescript
// Firestore schema for automated recaps
interface Recap {
  id: string;
  userId: string;
  childId: string;
  type: 'weekly' | 'monthly';
  period: {
    start: Date;
    end: Date;
    displayName: string;
  };
  aiGenerated: {
    title: string;
    summary: string;
    keyMoments: string[];
    sentiment: string;
    photos: string[];
  };
  status: 'generated' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}
```

### Evening (4 hours)
#### Backend Services Implementation
```typescript
// functions/services/recapGenerator.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');

class AutomatedRecapService {
  async generateWeeklyRecap(userId, childId, weekRange) {
    // Fetch journal entries for week
    const entries = await this.fetchJournalEntries(userId, childId, weekRange);
    
    if (entries.length < 3) return null; // Minimum threshold
    
    // Generate AI content
    const aiResponse = await this.callAIProvider(entries, 'weekly');
    
    // Save to Firestore
    return await this.saveRecap(userId, childId, 'weekly', weekRange, aiResponse);
  }
  
  async generateMonthlyRecap(userId, childId, monthRange) {
    const entries = await this.fetchJournalEntries(userId, childId, monthRange);
    
    if (entries.length < 5) return null; // Higher threshold for monthly
    
    const aiResponse = await this.callAIProvider(entries, 'monthly');
    return await this.saveRecap(userId, childId, 'monthly', monthRange, aiResponse);
  }
}
```

### Night (4 hours)
#### Firestore Security Rules
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Recaps collection
    match /recaps/{recapId} {
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
      allow write: if false; // Only cloud functions can write
    }
    
    // Journal entries for recap generation
    match /journalEntries/{entryId} {
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
      allow write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

## Day 2: Scheduled Functions (Automated Backend)

### Morning (4 hours)
#### Weekly Scheduled Function
```javascript
// functions/recaps/weeklyAutoGenerator.js
exports.scheduledWeeklyRecaps = functions.pubsub
  .schedule('0 9 * * 1')  // Every Monday 9:00 AM
  .timeZone('America/New_York')
  .onRun(async (context) => {
    
    console.log('Starting weekly recap generation...');
    
    const lastWeek = getPreviousWeekRange();
    const users = await getActiveUsers();
    
    const promises = [];
    for (const user of users) {
      const children = await getUserChildren(user.id);
      for (const child of children) {
        promises.push(generateWeeklyRecap(user.id, child.id, lastWeek));
      }
    }
    
    await Promise.all(promises);
    console.log('Weekly recap generation completed');
  });
```

### Afternoon (4 hours)
#### Monthly Scheduled Function
```javascript
// functions/recaps/monthlyAutoGenerator.js
exports.scheduledMonthlyRecaps = functions.pubsub
  .schedule('0 9 1 * *')  // 1st of every month 9:00 AM
  .timeZone('America/New_York')
  .onRun(async (context) => {
    
    const lastMonth = getPreviousMonthRange();
    const users = await getActiveUsers();
    
    const promises = [];
    for (const user of users) {
      const children = await getUserChildren(user.id);
      for (const child of children) {
        promises.push(generateMonthlyRecap(user.id, child.id, lastMonth));
      }
    }
    
    await Promise.all(promises);
    console.log('Monthly recap generation completed');
  });
```

### Evening (4 hours)
#### Helper Functions
```javascript
// functions/utils/dateHelpers.js
function getPreviousWeekRange() {
  const now = new Date();
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startOfWeek = new Date(lastWeek);
  startOfWeek.setDate(lastWeek.getDate() - lastWeek.getDay());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  
  return { start: startOfWeek, end: endOfWeek };
}

function getPreviousMonthRange() {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  
  return { start: lastMonth, end: endOfMonth };
}
```

### Night (4 hours)
#### Error Handling & Logging
```javascript
// functions/utils/errorHandler.js
class RecapErrorHandler {
  async handleGenerationError(error, userId, childId, type) {
    console.error(`Failed to generate ${type} recap for user ${userId}, child ${childId}:`, error);
    
    // Log to Firestore for monitoring
    await admin.firestore()
      .collection('recapErrors')
      .add({
        userId,
        childId,
        type,
        error: error.message,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
  }
}
```

## Day 3: React Native Auto-Update UI

### Morning (4 hours)
#### Real-Time Recap Listener
```typescript
// src/hooks/useAutoRecaps.ts
import { useEffect, useState } from 'react';
import { onSnapshot, query, collection, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebaseConfig';

export const useAutoRecaps = (userId: string, childId: string) => {
  const [recaps, setRecaps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !childId) return;

    const q = query(
      collection(db, 'recaps'),
      where('userId', '==', userId),
      where('childId', '==', childId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const newRecaps = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setRecaps(newRecaps);
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to recaps:', error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [userId, childId]);

  return { recaps, loading };
};
```

### Afternoon (4 hours)
#### Updated Recaps Screen
```typescript
// src/features/recaps/screens/RecapsScreen.tsx
import React from 'react';
import { View, StyleSheet, StatusBar, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useChildContext } from '@/context/ChildContext';
import { useAutoRecaps } from '@/hooks/useAutoRecaps';
import { RecapCard } from '@/features/recaps/components/RecapCard';

const RecapsScreen = () => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { selectedChild } = useChildContext();
  
  // Automatically displays recaps as they're generated
  const { recaps, loading } = useAutoRecaps(user?.uid, selectedChild?.id);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <Text style={styles.title}>Memory Recaps</Text>
      <Text style={styles.subtitle}>
        Weekly and monthly recaps appear automatically
      </Text>
      
      <FlatList
        data={recaps}
        renderItem={({ item }) => <RecapCard recap={item} />}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Recaps will appear here automatically every week and month
            </Text>
          </View>
        }
      />
    </View>
  );
};
```

### Evening (4 hours)
#### Enhanced Recap Card
```typescript
// src/features/recaps/components/RecapCard.tsx
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

const RecapCard = ({ recap }) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{recap.aiGenerated.title}</Text>
        <Text style={styles.period}>{recap.period.displayName}</Text>
      </View>
      
      <Text style={styles.summary}>{recap.aiGenerated.summary}</Text>
      
      <View style={styles.keyMoments}>
        {recap.aiGenerated.keyMoments.map((moment, index) => (
          <View key={index} style={styles.moment}>
            <Text style={styles.momentText}>• {moment}</Text>
          </View>
        ))}
      </View>
      
      <View style={styles.sentiment}>
        <Text style={styles.sentimentText}>
          Overall mood: {recap.aiGenerated.sentiment}
        </Text>
      </View>
    </View>
  );
};
```

### Night (4 hours)
#### Push Notifications Setup
```typescript
// functions/notifications/recapNotifications.js
async function sendRecapNotification(userId, childId, type, recap) {
  const userDoc = await admin.firestore().collection('users').doc(userId).get();
  const childDoc = await admin.firestore().collection('children').doc(childId).get();
  
  const message = {
    notification: {
      title: `${childDoc.data().name}'s ${type} recap is ready!`,
      body: `Tap to view beautiful memories from the past ${type}`
    },
    data: {
      recapId: recap.id,
      type: type,
      childId: childId
    }
  };
  
  if (userDoc.data().pushToken) {
    await admin.messaging().send({
      ...message,
      token: userDoc.data().pushToken
    });
  }
}
```

## Day 4: Testing & Deployment

### Morning (4 hours)
#### Testing Strategy
- **Unit Tests**: Test scheduled function logic
- **Integration Tests**: Test automatic generation flow
- **End-to-End**: Test complete scheduled workflow
- **Performance**: Test with multiple users and children

### Testing Checklist
- [ ] Verify scheduled function execution
- [ ] Test automatic weekly generation
- [ ] Test automatic monthly generation
- [ ] Handle empty journal entries gracefully
- [ ] Verify Firestore document creation
- [ ] Test real-time UI updates

### Afternoon (4 hours)
#### Deployment Commands
```bash
# Deploy scheduled functions
firebase deploy --only functions:scheduledWeeklyRecaps,scheduledMonthlyRecaps

# Test locally
firebase emulators:start --only functions

# Deploy to production
firebase deploy --only functions

# Monitor function execution
firebase functions:log --name scheduledWeeklyRecaps
```

### Evening (3 hours)
#### Monitoring Setup
```bash
# Set up function logging
firebase functions:log --name scheduledWeeklyRecaps

# Configure alerts
firebase alerts:create --event-type functions/schedule

# Test in production
firebase functions:shell
```

### Night (1 hour)
#### Final Verification
- [ ] Test automatic generation in production
- [ ] Verify real-time updates in app
- [ ] Check push notifications
- [ ] Monitor costs and usage

## Complete Architecture Summary

### **Automated System - No User Interaction**
- **Weekly**: Every Monday 9:00 AM automatically
- **Monthly**: 1st of every month 9:00 AM automatically
- **Process**: Firebase Cloud Functions → AI Processing → Firestore → App Display
- **User Experience**: Recaps appear automatically without any action

### **Key Benefits**
- **Zero user interaction** required
- **Secure backend processing** with API key protection
- **Cost controlled** through Firebase usage limits
- **Real-time updates** in React Native app
- **Push notifications** for new recaps
- **Comprehensive monitoring** and error handling

### **Deployment Summary**
```bash
# Complete deployment in 4 days
firebase deploy --only functions
firebase deploy --only firestore:rules
```

This creates a **fully automated system** where users simply open their app and see their weekly/monthly recaps - no buttons, no selections, just beautiful memories!
