# Firebase Security Rules for SproutBook

## 🔐 Complete Security Rules

### **Copy and Paste These Rules into Firebase Console:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ========== USERS COLLECTION ==========
    match /users/{userId} {
      // Users can read their own document
      allow read: if request.auth != null && request.auth.uid == userId;
      
      // Users can create their own document during signup
      allow create: if request.auth != null && request.auth.uid == userId
        && request.resource.data.keys().hasAll(['uid', 'email', 'name', 'subscription', 'lifestage', 'children', 'createdAt', 'onboarded'])
        && request.resource.data.uid == userId
        && request.resource.data.email == request.auth.token.email
        && request.resource.data.subscription is map
        && request.resource.data.children is list
        && request.resource.data.onboarded == false;
      
      // Users can update their own document
      allow update: if request.auth != null && request.auth.uid == userId
        && request.resource.data.uid == userId
        && request.resource.data.email == resource.data.email; // Email cannot be changed
    }
    
    // ========== CHILDREN COLLECTION ==========
    match /children/{childId} {
      // Users can read children documents they own
      allow read: if request.auth != null && 
        (request.auth.uid == resource.data.parentId || 
         request.auth.uid in get(/databases/$(database)/documents/users/$(request.auth.uid)).data.children);
      
      // Users can create children documents for themselves
      allow create: if request.auth != null && 
        request.resource.data.parentId == request.auth.uid
        && request.resource.data.keys().hasAll(['parentId', 'name', 'dateOfBirth', 'gender', 'createdAt'])
        && request.resource.data.parentId == request.auth.uid
        && request.resource.data.name is string
        && request.resource.data.name.size() > 0
        && request.resource.data.dateOfBirth is string
        && request.resource.data.gender is string
        && (request.resource.data.gender in ['male', 'female', 'other'])
        && request.resource.data.createdAt is timestamp;
      
      // Users can update children documents they own
      allow update: if request.auth != null && 
        request.auth.uid == resource.data.parentId
        && request.resource.data.parentId == resource.data.parentId; // Parent ID cannot be changed
      
      // Users can delete children documents they own
      allow delete: if request.auth != null && 
        request.auth.uid == resource.data.parentId;
    }
  }
}
```

## 📋 How to Deploy These Rules

### **Method 1: Firebase Console (Recommended)**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your SproutBook project
3. Navigate to **Firestore Database** → **Rules** tab
4. Replace existing rules with the code above
5. Click **Publish** to apply changes

### **Method 2: Firebase CLI**
```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy rules from your project directory
firebase deploy --only firestore:rules
```

## 🔍 Rule Breakdown

### **Users Collection Rules**
- ✅ **Read**: Users can only read their own profile
- ✅ **Create**: Only authenticated users can create their own profile
- ✅ **Update**: Users can only update their own profile
- ❌ **Delete**: Users cannot delete profiles (intentional)

### **Children Collection Rules**
- ✅ **Read**: Users can read children they own
- ✅ **Create**: Users can only create children for themselves
- ✅ **Update**: Users can only update their own children's data
- ✅ **Delete**: Users can delete their own children's data

## 🚨 Common Issues & Solutions

### **Permission Denied Errors**
- **Cause**: Rules not deployed or incorrect authentication
- **Solution**: Ensure rules are published and user is authenticated

### **Missing Fields Validation**
- **Cause**: Required fields not provided in create/update
- **Solution**: Check that all required fields are included in requests

### **Type Mismatches**
- **Cause**: Data types don't match rules (e.g., string vs timestamp)
- **Solution**: Ensure data types match exactly as specified in rules

## 🔄 Testing Your Rules

### **Test in Firebase Console**
1. Go to **Firestore Database** → **Rules** tab
2. Use the **Rules Playground** to test scenarios
3. Test with authenticated vs unauthenticated requests

### **Test with Your App**
```javascript
// Test user profile creation
await setDoc(doc(db, 'users', user.uid), {
  uid: user.uid,
  email: user.email,
  name: 'Test User',
  subscription: { plan: 'basic', status: 'trial', startDate: new Date() },
  lifestage: null,
  children: [],
  createdAt: new Date(),
  onboarded: false,
});

// Test child creation
await addDoc(collection(db, 'children'), {
  parentId: user.uid,
  name: 'Test Child',
  dateOfBirth: '2020-01-01',
  gender: 'male',
  createdAt: new Date(),
});
```

## 🎯 Next Steps

1. **Deploy the rules** using one of the methods above
2. **Test the complete flow** from signup to child creation
3. **Verify permissions** work correctly for all operations
4. **Monitor Firebase Console** for any security rule violations

## 📞 Troubleshooting

If you encounter issues:
1. Check **Firebase Console** → **Firestore Database** → **Rules** tab for errors
2. Verify your **Firebase Authentication** is properly configured
3. Ensure your **Firestore indexes** are set up correctly
4. Check **Firebase Console** → **Monitoring** for detailed logs
