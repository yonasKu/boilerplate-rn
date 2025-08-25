# Push Notifications & Reminder Testing Guide

## Overview
This guide provides step-by-step instructions to verify that push notifications and reminder toasts are working correctly in the SproutBook app.

## Prerequisites
- Physical device (iOS/Android) - notifications don't work reliably on simulators
- Firebase project with proper configuration
- App installed and signed in with a test account

## 1. Push Notification Testing

### A. Device Registration Check
1. **Open the app on your device**
2. **Check device token registration:**
   - Look in console logs for: `Push token registered: <token>`
   - Or check Firebase Console → Project Settings → Cloud Messaging → Device tokens

### B. Test Notification Delivery
1. **Via Firebase Console:**
   - Go to Firebase Console → Engage → Cloud Messaging
   - Click "Send your first message"
   - Target your app package name
   - Send test notification
   - Check if notification appears on device

2. **Via API (for developers):**
   ```bash
   curl -X POST https://fcm.googleapis.com/fcm/send \
     -H "Authorization: key=<YOUR_SERVER_KEY>" \
     -H "Content-Type: application/json" \
     -d '{
       "to": "<DEVICE_TOKEN>",
       "notification": {
         "title": "Test Notification",
         "body": "This is a test message"
       }
     }'
   ```

### C. In-App Notification Testing
1. **Trigger a journal reminder:**
   - Create a new journal entry
   - Set a reminder for 5 minutes from now
   - Close the app
   - Wait for notification

2. **Check notification types:**
   - **Daily reminders**: Should appear based on user settings
   - **Journal reminders**: Should appear at scheduled times
   - **Weekly recap notifications**: Should trigger on recap generation

## 2. Reminder Toast Testing

### A. In-App Toast Verification
1. **Create journal entry with reminder:**
   - Navigate to journal → new entry
   - Add content and set reminder
   - Save entry
   - Check for toast: "Reminder set for [time]"

2. **Test different reminder types:**
   - **Immediate reminder**: Set for 1 minute from now
   - **Daily reminder**: Set for tomorrow at same time
   - **Weekly reminder**: Set for next week

### B. Toast Visibility Check
1. **Toast should appear:**
   - When setting reminders
   - When reminders are triggered in-app
   - When reminders are cancelled

2. **Toast messages to verify:**
   - "Reminder set for [time]"
   - "Reminder updated"
   - "Reminder cancelled"
   - "It's time to journal!"

## 3. Debugging Common Issues

### A. Push Notification Issues
1. **Check permissions:**
   - iOS: Settings → Notifications → SproutBook → Allow Notifications
   - Android: Settings → Apps → SproutBook → Notifications → Allow

2. **Verify Firebase configuration:**
   - Check `google-services.json` (Android) or `GoogleService-Info.plist` (iOS)
   - Verify bundle ID/package name matches Firebase project

3. **Check device token:**
   ```javascript
   // Add this temporarily in your notification service
   console.log('Device Token:', token);
   ```

### B. Toast Issues
1. **Check Toast component:**
   - Verify Toast component is imported correctly
   - Check if Toast.show() is being called
   - Look for console errors

2. **Test toast visibility:**
   ```javascript
   // Temporary test button
   <TouchableOpacity onPress={() => Toast.show('Test toast')}>
     <Text>Test Toast</Text>
   </TouchableOpacity>
   ```

## 4. Testing Checklist

### Push Notifications
- [ ] Device registers for push notifications
- [ ] Test notification received from Firebase Console
- [ ] Journal reminders trigger notifications
- [ ] Daily reminders work as scheduled
- [ ] Weekly recap notifications appear

### Reminder Toasts
- [ ] Toast appears when setting reminders
- [ ] Toast appears when reminders trigger in-app
- [ ] Toast messages are appropriate and helpful
- [ ] Toast styling is consistent

### Cross-Platform Testing
- [ ] iOS notifications work
- [ ] Android notifications work
- [ ] Background notifications work
- [ ] Foreground notifications work

## 5. Quick Verification Commands

### Check current notification status
```javascript
// Run in app console or add temporarily
import { checkNotifications } from 'react-native-permissions';
checkNotifications().then(status => console.log(status));
```

### Test toast immediately
```javascript
// Add temporarily to test toast
import Toast from 'react-native-toast-message';
Toast.show({
  type: 'success',
  text1: 'Test Toast',
  text2: 'Toast is working!'
});
```

## 6. Troubleshooting Log

Create a simple test log to track your verification:

```
Date: [Current Date]
Device: [iOS/Android] [Model]
OS Version: [iOS/Android version]

Test Results:
- Push token registered: [Yes/No]
- Firebase test notification received: [Yes/No]
- Journal reminder notification: [Yes/No]
- Daily reminder notification: [Yes/No]
- Toast messages working: [Yes/No]

Issues Found:
- [List any issues encountered]

Notes:
- [Additional notes]
```

## 7. Next Steps

If any tests fail:
1. Check Firebase project configuration
2. Verify app permissions
3. Review console logs for errors
4. Test on different devices
5. Check network connectivity

For persistent issues, check:
- Firebase Cloud Messaging setup
- Device notification settings
- App background refresh settings
- Network connectivity
- Firebase project quotas
