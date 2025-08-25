# Child Collection Schema Documentation

## Overview
This document outlines the Firestore schema for the `children` collection and its relationship with the `users` collection in the SproutBook app.

## Collection Structure

### 1. Users Collection (`users`)
```
collection: users
├── uid (string) - Firebase Auth UID as document ID
├── name (string) - User's full name
├── email (string) - User's email address
├── lifestage (string) - "Soon to be parent" or "Parent"
├── subscription (object) - Subscription details
│   ├── plan (string) - "basic", "premium", etc.
│   ├── status (string) - "trial", "active", "cancelled"
│   ├── startDate (timestamp) - Subscription start date
│   ├── trialEndDate (timestamp) - Trial period end date
├── children (array) - Array of child references (optional)
├── onboarded (boolean) - True when onboarding is complete
├── createdAt (timestamp) - Account creation date
└── updatedAt (timestamp) - Last update timestamp
```

### 2. Children Collection (`children`)
```
collection: children
├── childId (string) - Auto-generated document ID
├── parentId (string) - Reference to users.uid (foreign key)
├── name (string) - Child's name
├── dateOfBirth (timestamp) - Child's date of birth
├── gender (string) - "Boy", "Girl", "Don't know yet", "prefer_not_to_say"
├── avatar (string) - URL to child's avatar image (optional)
├── createdAt (timestamp) - Record creation date
└── updatedAt (timestamp) - Last update timestamp
```

## Data Relationships

### User → Children Relationship
- **One-to-Many**: One user (parent) can have multiple children
- **Reference Method**: User document contains an array of child document IDs
- **Query Pattern**: 
  ```javascript
  // Get all children for a user
  const children = await getDocs(
    query(collection(db, 'children'), where('parentId', '==', user.uid))
  );
  ```

## Firestore Rules Required

### Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can read/write their own children
    match /children/{childId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.parentId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.parentId;
    }
  }
}
```

## Add Child Flow Implementation

### 1. Firestore Rules Setup
- Ensure Firestore rules allow authenticated users to read/write their own children
- Rules must be deployed to Firebase Console

### 2. Service Functions Required
```typescript
// services/childService.ts
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase/firebaseConfig';

export interface Child {
  parentId: string;
  name: string;
  dateOfBirth: Date;
  gender: 'Boy' | 'Girl' | "Don't know yet" | 'prefer_not_to_say';
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const addChild = async (child: Omit<Child, 'createdAt' | 'updatedAt'>) => {
  const now = new Date();
  const childData = {
    ...child,
    createdAt: now,
    updatedAt: now
  };
  
  const docRef = await addDoc(collection(db, 'children'), childData);
  return docRef.id;
};

export const getUserChildren = async (parentId: string) => {
  const q = query(collection(db, 'children'), where('parentId', '==', parentId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};
```

### 3. User Document Update
When adding a child, also update the user's children array:
```typescript
export const updateUserChildrenArray = async (userId: string, childId: string) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    children: arrayUnion(childId),
    updatedAt: new Date()
  });
};
```

## Error Resolution Steps

### 1. Fix Firestore Permissions
1. Go to Firebase Console → Firestore Database → Rules
2. Update rules with the security rules above
3. Click "Publish" to deploy new rules

### 2. Verify Collection Structure
1. Check that `children` collection exists in Firestore
2. Ensure documents have correct `parentId` field matching user.uid
3. Verify field names match the schema exactly

### 3. Test Data Flow
1. Add a child through the app
2. Verify child appears in Firestore `children` collection
3. Check that user's `children` array is updated
4. Confirm no permission errors in console

## Implementation Checklist

- [ ] Update Firestore rules with proper permissions
- [ ] Create `children` collection if it doesn't exist
- [ ] Implement `childService.ts` with add/get functions
- [ ] Update AddChildScreen to use new service functions
- [ ] Test the complete flow from AddProfileScreen → AddChildScreen → Main App
