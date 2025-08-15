# Family Sharing Firebase Integration Guide

## Overview
This guide details how to implement family sharing functionality using Firebase for the SproutBook app, allowing view-only accounts and family sharing features.

## Firebase Setup Requirements

### 1. Firestore Collections Structure

#### Users Collection
```
collection: users
├── userId (string)
├── email (string)
├── accountType (string: "full" | "view-only")
├── subscriptionStatus (string: "active" | "inactive" | "trial")
├── parentUserId (string, nullable) - for view-only accounts
├── invitedBy (string, nullable) - userId of inviter
├── createdAt (timestamp)
├── updatedAt (timestamp)
├── profile (object)
│   ├── displayName (string)
│   ├── photoURL (string)
│   └── preferences (object)
└── permissions (object)
    ├── canEdit (boolean)
    ├── canShare (boolean)
    └── canInvite (boolean)
```

#### Invitations Collection
```
collection: invitations
├── invitationId (string)
├── senderUserId (string)
├── recipientEmail (string)
├── recipientPhone (string, nullable)
├── invitationType (string: "family_view" | "upgrade")
├── status (string: "pending" | "accepted" | "declined" | "expired")
├── token (string) - unique invitation token
├── expiresAt (timestamp)
├── createdAt (timestamp)
├── acceptedAt (timestamp, nullable)
└── permissions (object)
    ├── accessLevel (string: "view_only")
    ├── childrenAccess (array of childIds)
    └── features (array of strings)
```

#### SharedAccess Collection
```
collection: sharedAccess
├── accessId (string)
├── ownerUserId (string)
├── viewerUserId (string)
├── children (array of childIds)
├── permissions (object)
│   ├── canViewRecaps (boolean)
│   ├── canComment (boolean)
│   ├── canLike (boolean)
│   └── canSearch (boolean)
├── createdAt (timestamp)
├── updatedAt (timestamp)
└── status (string: "active" | "revoked")
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
    
    function hasViewAccess(childId) {
      return exists(/databases/$(database)/documents/sharedAccess/
        $(request.auth.uid) + '_' + childId);
    }
    
    function isFullAccount() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.accountType == 'full';
    }
    
    // Users collection rules
    match /users/{userId} {
      allow read: if isAuthenticated() && 
        (isOwner(userId) || hasViewAccess(userId));
      allow write: if isAuthenticated() && isOwner(userId);
    }
    
    // Invitations collection rules
    match /invitations/{invitationId} {
      allow read: if isAuthenticated() && 
        (resource.data.senderUserId == request.auth.uid || 
         resource.data.recipientEmail == request.auth.token.email);
      allow create: if isAuthenticated() && isFullAccount();
      allow update: if isAuthenticated() && 
        (resource.data.senderUserId == request.auth.uid || 
         (resource.data.recipientEmail == request.auth.token.email && 
          request.resource.data.status in ['accepted', 'declined']));
    }
    
    // SharedAccess collection rules
    match /sharedAccess/{accessId} {
      allow read: if isAuthenticated() && 
        (resource.data.ownerUserId == request.auth.uid || 
         resource.data.viewerUserId == request.auth.uid);
      allow create: if isAuthenticated() && isFullAccount();
      allow update: if isAuthenticated() && 
        resource.data.ownerUserId == request.auth.uid;
    }
  }
}
```

### 3. Firebase Functions Setup

#### Cloud Functions for Invitation Management

Create `functions/inviteFamilyMember.js`:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');

exports.sendFamilyInvitation = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { recipientEmail, recipientPhone, children, permissions } = data;
  const senderUserId = context.auth.uid;

  // Check if sender has full account
  const senderDoc = await admin.firestore().collection('users').doc(senderUserId).get();
  if (!senderDoc.exists || senderDoc.data().accountType !== 'full') {
    throw new functions.https.HttpsError('permission-denied', 'Only full account holders can invite family members');
  }

  // Generate unique invitation token
  const token = admin.firestore().collection('_').doc().id;
  const invitationId = `${senderUserId}_${Date.now()}`;

  const invitation = {
    invitationId,
    senderUserId,
    recipientEmail,
    recipientPhone,
    invitationType: 'family_view',
    status: 'pending',
    token,
    expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7 days
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    permissions: {
      accessLevel: 'view_only',
      childrenAccess: children || [],
      features: ['view_recaps', 'comment', 'like', 'search', 'filter']
    }
  };

  await admin.firestore().collection('invitations').doc(invitationId).set(invitation);

  // Send email/SMS via external service
  await sendInvitationEmail(recipientEmail, token, senderDoc.data().profile.displayName);

  return { invitationId, token };
});

exports.acceptFamilyInvitation = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { token } = data;
  const viewerUserId = context.auth.uid;

  const invitationQuery = await admin.firestore()
    .collection('invitations')
    .where('token', '==', token)
    .where('status', '==', 'pending')
    .limit(1)
    .get();

  if (invitationQuery.empty) {
    throw new functions.https.HttpsError('not-found', 'Invalid or expired invitation');
  }

  const invitation = invitationQuery.docs[0];
  const invitationData = invitation.data();

  // Create shared access records
  const batch = admin.firestore().batch();

  invitationData.permissions.childrenAccess.forEach(childId => {
    const accessId = `${invitationData.senderUserId}_${viewerUserId}_${childId}`;
    const sharedAccess = {
      accessId,
      ownerUserId: invitationData.senderUserId,
      viewerUserId,
      children: [childId],
      permissions: {
        canViewRecaps: true,
        canComment: true,
        canLike: true,
        canSearch: true
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'active'
    };

    batch.set(admin.firestore().collection('sharedAccess').doc(accessId), sharedAccess);
  });

  // Update invitation status
  batch.update(invitation.ref, {
    status: 'accepted',
    acceptedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // Update viewer user account type
  batch.update(admin.firestore().collection('users').doc(viewerUserId), {
    accountType: 'view-only',
    parentUserId: invitationData.senderUserId,
    invitedBy: invitationData.senderUserId,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  await batch.commit();

  return { success: true };
});

async function sendInvitationEmail(email, token, senderName) {
  // Implementation depends on email service (SendGrid, etc.)
  // This would send an email with the invitation link
}
```

### 4. Client-Side Implementation

#### Invitation Service
Create `src/services/familySharingService.ts`:

```typescript
import { firebase } from '../lib/firebase';
import { httpsCallable } from 'firebase/functions';

export interface FamilyInvitation {
  recipientEmail: string;
  recipientPhone?: string;
  children: string[];
  permissions: {
    canViewRecaps: boolean;
    canComment: boolean;
    canLike: boolean;
    canSearch: boolean;
  };
}

export interface SharedAccess {
  accessId: string;
  ownerUserId: string;
  viewerUserId: string;
  children: string[];
  permissions: any;
  status: string;
}

export class FamilySharingService {
  private functions = firebase.functions();

  async sendInvitation(invitation: FamilyInvitation): Promise<string> {
    const sendInvitation = httpsCallable(this.functions, 'sendFamilyInvitation');
    const result = await sendInvitation(invitation);
    return result.data.invitationId;
  }

  async acceptInvitation(token: string): Promise<void> {
    const acceptInvitation = httpsCallable(this.functions, 'acceptFamilyInvitation');
    await acceptInvitation({ token });
  }

  async getSharedChildren(): Promise<SharedAccess[]> {
    const user = firebase.auth().currentUser;
    if (!user) throw new Error('User not authenticated');

    const snapshot = await firebase.firestore()
      .collection('sharedAccess')
      .where('viewerUserId', '==', user.uid)
      .where('status', '==', 'active')
      .get();

    return snapshot.docs.map(doc => ({
      accessId: doc.id,
      ...doc.data()
    } as SharedAccess));
  }

  async revokeAccess(accessId: string): Promise<void> {
    await firebase.firestore()
      .collection('sharedAccess')
      .doc(accessId)
      .update({ status: 'revoked', updatedAt: new Date() });
  }

  async upgradeToFullAccount(): Promise<void> {
    const user = firebase.auth().currentUser;
    if (!user) throw new Error('User not authenticated');

    await firebase.firestore()
      .collection('users')
      .doc(user.uid)
      .update({
        accountType: 'full',
        updatedAt: new Date()
      });
  }
}
```

### 5. UI Components Structure

#### Invitation Flow Components
1. **SendInvitationScreen** - Form to invite family members
2. **InvitationListScreen** - View sent/received invitations
3. **AcceptInvitationScreen** - Handle invitation acceptance
4. **FamilySettingsScreen** - Manage family sharing settings

#### View-Only Account Features
1. **SharedTimelineScreen** - View-only timeline access
2. **SharedRecapsScreen** - View recaps with comment/like
3. **UpgradePromptScreen** - Prompt to upgrade to full account

### 6. Deep Linking Setup

#### Configure deep links for invitation acceptance
Add to `app.json`:
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
            "pathPrefix": "/invite"
          }
        ],
        "category": ["BROWSABLE", "DEFAULT"]
      }
    ]
  }
}
```

### 7. Testing Checklist

- [ ] Send invitation via email
- [ ] Send invitation via SMS
- [ ] Accept invitation and create view-only account
- [ ] View shared recaps and journal entries
- [ ] Add comments and likes as viewer
- [ ] Search and filter shared content
- [ ] Upgrade view-only to full account
- [ ] Revoke family member access
- [ ] Handle invitation expiration
- [ ] Test notification system

### 8. Migration Strategy

For existing users:
1. Update all existing user documents with `accountType: "full"`
2. Set default permissions for existing accounts
3. Create migration script for Firebase Functions

```javascript
// Migration function
exports.migrateExistingUsers = functions.https.onRequest(async (req, res) => {
  const usersSnapshot = await admin.firestore().collection('users').get();
  
  const batch = admin.firestore().batch();
  usersSnapshot.docs.forEach(doc => {
    batch.update(doc.ref, {
      accountType: 'full',
      permissions: {
        canEdit: true,
        canShare: true,
        canInvite: true
      }
    });
  });
  
  await batch.commit();
  res.send('Migration completed');
});
```

## Next Steps
1. Set up Firebase Functions project
2. Deploy security rules
3. Implement invitation service
4. Create UI components
5. Test invitation flow
6. Add notification system
7. Implement upgrade flow
