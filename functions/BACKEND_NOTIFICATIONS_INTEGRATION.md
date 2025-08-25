# Backend Notifications Integration Guide

## Overview
This guide explains how to integrate the frontend notification system with Firebase Cloud Functions backend for push notifications and scheduled reminders.

## Current State
- ✅ Frontend notification system implemented
- ❌ Backend notification functions missing
- ❌ Device token management not implemented
- ❌ Scheduled reminders not set up

## Required Backend Components

### 1. Device Token Management
**Location**: `functions/services/notificationService.js`
- Store device tokens per user
- Handle token registration/removal
- Support multiple devices per user

### 2. Push Notification Functions
**Location**: `functions/index.js` (add new functions)
- `sendPushNotification(userId, notification)`
- `sendReminderNotification(userId, reminderType, childId)`
- `scheduleDailyReminders()`
- `scheduleWeeklyReminders()`
- `scheduleMonthlyReminders()`

### 3. Scheduled Functions
**Location**: `functions/scheduled/notifications.js`
- Daily journal reminders
- Weekly recap reminders
- Monthly recap reminders
- Birthday reminders
- Milestone reminders

### 4. Notification Templates
**Location**: `functions/templates/notifications.js`
- Daily reminder: "Time to capture today's memories!"
- Weekly recap: "Your weekly recap is ready!"
- Monthly recap: "Your monthly recap is ready!"
- Milestone: "New milestone reached!"

## Implementation Steps

### Step 1: Create Notification Service
```bash
# Create service file
touch functions/services/notificationService.js
```

### Step 2: Add Cloud Functions
```bash
# Add to functions/index.js
# - registerDeviceToken
# - removeDeviceToken
# - sendNotification
# - scheduled reminder functions
```

### Step 3: Create Scheduled Functions
```bash
# Create scheduled directory
mkdir functions/scheduled
touch functions/scheduled/notifications.js
```

### Step 4: Update Firestore Rules
Add rules for:
- Device tokens collection
- Notification preferences
- User notification settings

## Database Structure

### Users Collection
```
users/{userId}/
  ├── devices/{deviceToken}
  │   ├── token: string
  │   ├── platform: string
  │   ├── createdAt: timestamp
  │   └── lastUsed: timestamp
  └── notificationPreferences/
      ├── dailyReminders: boolean
      ├── weeklyReminders: boolean
      ├── monthlyReminders: boolean
      └── quietHours: object
```

### Notifications Collection
```
users/{userId}/notifications/{notificationId}
  ├── title: string
  ├── body: string
  ├── type: string
  ├── read: boolean
  ├── createdAt: timestamp
  └── data: object
```

## API Endpoints

### Register Device Token
```javascript
// Client side
const registerDevice = async (token) => {
  const registerDeviceToken = httpsCallable(functions, 'registerDeviceToken');
  await registerDeviceToken({ token, platform: Platform.OS });
};
```

### Send Test Notification
```javascript
// Already exists: sendTestNotification
```

## Environment Setup

### Required Environment Variables
```bash
# Add to functions/.env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
```

### Install Dependencies
```bash
cd functions
npm install firebase-admin firebase-functions
```

## Testing

### Test Device Registration
```bash
firebase functions:shell
> registerDeviceToken({token: "test-token", platform: "ios"})
```

### Test Push Notification
```bash
firebase functions:shell
> sendPushNotification({userId: "test-user", notification: {title: "Test", body: "Hello"}})
```

## Integration Checklist

- [x] Create notificationService.js
- [x] Add device token functions
- [x] Add scheduled reminder functions
- [x] Update Firestore rules
- [ ] Test device registration
- [ ] Test push notifications
- [ ] Test scheduled reminders
- [ ] Update frontend to use backend

## Next Steps After Implementation
1. Deploy functions: `firebase deploy --only functions`
2. Update frontend to register device tokens
3. Test end-to-end notification flow
4. Monitor function logs for errors
