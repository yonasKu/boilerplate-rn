# Recap Notification Integration Guide

## Current Status
**✅ READY TO IMPLEMENT** - All services are available and working:
- ✅ `NotificationService` is fully implemented in `services/notificationService.js`
- ✅ `recapGenerator.js` is working correctly with children collection fix
- ✅ OpenAI integration is working with Firebase secrets
- ✅ Weekly recaps are generating successfully

## Missing Integration
The `recapGenerator.js` service saves recaps to Firestore but **does not send notifications** to users when recaps are completed. Need to add NotificationService integration.

## Required Changes

### 1. Add NotificationService to RecapGenerator
```javascript
// In services/recapGenerator.js
const { NotificationService } = require('./notificationService');

// In constructor
this.notificationService = new NotificationService();
```

### 2. Send Notification After Recap Generation
Add notification calls after successful recap creation:

```javascript
// After successful recap generation in generateWeeklyRecap, generateMonthlyRecap, generateYearlyRecap

// Send push notification
await this.notificationService.sendPushNotification(userId, {
  title: `${type.charAt(0).toUpperCase() + type.slice(1)} Recap Ready!`,
  body: `Your ${type} recap for ${childName} is ready to view!`,
  data: {
    recapId: docRef.id,
    type: type,
    childId: childId,
    timestamp: new Date().toISOString()
  }
});

// Optional: Add to notifications collection for history
await this.db.collection('notifications').add({
  userId: userId,
  childId: childId,
  type: 'recap_ready',
  recapType: type,
  recapId: docRef.id,
  title: `${type.charAt(0).toUpperCase() + type.slice(1)} Recap Ready`,
  message: `Your ${type} recap is ready`,
  read: false,
  createdAt: new Date()
});
```

### 3. Add Notification Helper Method
```javascript
async sendRecapNotification(userId, childId, type, recapId, childName) {
  try {
    await this.notificationService.sendPushNotification(userId, {
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Recap Ready!`,
      body: `Your ${type} recap for ${childName} is ready to view!`,
      data: {
        recapId: recapId,
        type: type,
        childId: childId,
        timestamp: new Date().toISOString()
      }
    });
    
    // Add to notifications collection
    await this.db.collection('notifications').add({
      userId: userId,
      childId: childId,
      type: 'recap_ready',
      recapType: type,
      recapId: recapId,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Recap Ready`,
      message: `Your ${type} recap for ${childName} is ready`,
      read: false,
      createdAt: new Date()
    });
    
    console.log(`Notification sent for ${type} recap ${recapId}`);
  } catch (error) {
    console.error(`Failed to send notification for ${type} recap:`, error);
  }
}
```

## Implementation Steps

### Step 1: Update RecapGenerator Constructor
```javascript
const { NotificationService } = require('./notificationService');

constructor() {
  this.journalAggregator = new JournalAggregator();
  this.openAIService = new OpenAIService();
  this.notificationService = new NotificationService(); // Add this
  this.db = require('../firebaseAdmin').db;
}
```

### Step 2: Update Recap Methods
Add notification calls after successful recap creation in:
- `generateWeeklyRecap` (lines ~70-80)
- `generateMonthlyRecap` (lines ~120-130)
- `generateYearlyRecap` (lines ~170-180)

Example update for generateWeeklyRecap:
```javascript
// After: const docRef = await this.db.collection('recaps').add(recap);
// Add:
await this.sendRecapNotification(userId, childId, 'weekly', docRef.id, journalData.childName);
```

### Step 3: Update generateAllRecaps
Add notification for bulk generation (lines ~330-340):
```javascript
if (result.success) {
  results.successfulRecaps++;
  results.details.push({ userId, childId, status: 'success', recapId: result.id });
  
  // Add notification - use children collection for child name
  const childDoc = await this.db.collection('children').doc(childId).get();
  const childName = childDoc.data()?.name || 'Your child';
  await this.sendRecapNotification(userId, childId, type, result.id, childName);
}
```

## Notification Collection Structure

```
collection: notifications
├── userId (string) - User ID
├── childId (string) - Child ID  
├── type (string) - 'recap_ready'
├── recapType (string) - 'weekly' | 'monthly' | 'yearly'
├── recapId (string) - ID of generated recap
├── title (string) - Notification title
├── message (string) - Notification message
├── read (boolean) - Read status
├── createdAt (timestamp) - Creation time
└── data (object) - Additional payload data
```

## Testing

1. Generate a recap manually
2. Check notifications collection for new entries
3. Verify push notifications are received on device
4. Test with multiple users and children

## Security Rules
Add Firestore rules for notifications collection:
```javascript
match /notifications/{notificationId} {
  allow read: if request.auth != null && request.auth.uid == resource.data.userId;
  allow write: if request.auth != null && request.auth.uid == resource.data.userId;
}
```
