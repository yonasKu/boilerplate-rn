# Push Notifications Setup Guide
## SproutBook - Expo + Firebase Implementation

### 🎯 **What You Need to Do Right Now**

#### **Step 1: Install Required Packages (Based on Your Actual Setup)**
```bash
# Based on your package.json (Expo 53.0.20 + Firebase 9.23.0)
npm install expo-notifications@~0.29.11
npm install expo-device@~7.0.2
# Your Firebase 9.23.0 is already compatible - no need to upgrade
```

#### **Step 2: Update app.json**
```json
// Add to your existing app.json (keeping your current structure)
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/images/notification-icon.png",
          "color": "#5D9275"
        }
      ]
    ]
  }
}
```

#### **Step 3: iOS Developer Account Setup (APNs Key Creation)**

**Prerequisites:** Apple Developer Account ($99/year) - **Required for iOS**

**Step 3.1: Create APNs Authentication Key (.p8 file)**
1. **Go to:** https://developer.apple.com/account
2. **Sign in** with your Apple Developer account
3. **Navigate:** Certificates, Identifiers & Profiles → Keys
4. **Click:** "+" (Create a Key)
5. **Fill out:**
   - **Key Name:** "SproutBookAPNs"
   - **Services:** Check "Apple Push Notifications service (APNs)" ✅ **SELECT THIS**
   - **Key Type:** APNs Authentication Key (this is the only option)
6. **Click:** Continue → Register → Download
7. **Save:** The `.p8` file (looks like: `AuthKey_XXXXXXXXXX.p8`)

**Step 3.2: Get Your Key ID and Team ID**
- **Key ID:** From the downloaded filename (after `AuthKey_`) - 10 characters
- **Team ID:** From your Apple Developer account → Membership → Team ID (10 characters)

**Example:**
- **Key ID:** ABC123DEFG (from AuthKey_ABC123DEFG.p8)
- **Team ID:** 1234567890 (from Apple Developer account)

**Step 3.3: Upload to Firebase**
1. **Firebase Console:** https://console.firebase.google.com
2. **Your Project** → **Project Settings** → **Cloud Messaging**
3. **iOS App** → **Upload APNs Authentication Key"
4. **Environment Selection:**
   - **Sandbox:** Choose this for **development/testing**
   - **Production:** Choose this for **App Store deployment**
5. **Enter:**
   - **APNs Auth Key:** Upload your `.p8` file
   - **Key ID:** ABC123DEFG (from filename)
   - **Team ID:** 1234567890 (from Apple Developer account)

**When to Choose Each:**
- **Sandbox:** When testing with development builds (expo run:ios)
- **Production:** When ready for App Store submission

**Configuration Summary:**
- **Service:** Apple Push Notifications service (APNs)
- **Key Type:** Authentication Key (.p8)
- **Environment:** 
   - **Sandbox** for development/testing
   - **Production** for App Store
- ✅ **Bundle ID:** Must match your app's bundle identifier

#### **Step 4: Android Setup (Much Simpler)**
1. **Firebase Console** → **Project Settings** → **Cloud Messaging**
2. **Android App** → **Server Key** (starts with `AAAA...`)
3. **Copy:** This key - **Expo handles the rest automatically**

#### **Step 5: Enable Cloud Messaging API** 

#### **Step 4: Create Notification Service File**

Create this file: `src/services/notifications/NotificationService.ts`

```typescript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export class NotificationService {
  static async requestPermissions() {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }

  static async getPushToken() {
    const token = await Notifications.getExpoPushTokenAsync();
    return token.data;
  }

  static async saveTokenToFirestore(userId: string, token: string) {
    const db = getFirestore();
    await setDoc(doc(db, 'users', userId), {
      pushToken: token,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  }

  static async scheduleDailyReminder(hour: number, minute: number) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Daily Journal Reminder',
        body: 'Time to capture today\'s memories!',
        data: { screen: '/journal' }
      },
      trigger: {
        hour,
        minute,
        repeats: true
      }
    });
  }
}
```

#### **Step 5: Update LoginScreen.tsx**

Add this to your existing LoginScreen:

```typescript
// In LoginScreen.tsx, add this useEffect
useEffect(() => {
  const setupNotifications = async () => {
    const hasPermission = await NotificationService.requestPermissions();
    if (hasPermission) {
      const token = await NotificationService.getPushToken();
      // Save token when user logs in
      const auth = getAuth();
      if (auth.currentUser) {
        await NotificationService.saveTokenToFirestore(auth.currentUser.uid, token);
      }
    }
  };
  
  setupNotifications();
}, []);
```

#### **Step 6: Create Notification Preferences**

Create: `src/features/settings/NotificationPreferences.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export default function NotificationPreferences() {
  const [preferences, setPreferences] = useState({
    dailyReminders: { enabled: true, time: '09:00' },
    recapAlerts: { enabled: true },
    familyEngagement: { enabled: true }
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notification Preferences</Text>
      
      <View style={styles.setting}>
        <Text>Daily Reminders</Text>
        <Switch 
          value={preferences.dailyReminders.enabled}
          onValueChange={(value) => updatePreference('dailyReminders', value)}
        />
      </View>
    </View>
  );
}
```

#### **Step 7: Test Notifications (With Your Current Setup)**
```bash
# Test with your current setup
expo start

# Test on real device (simulator won't work)
expo run:ios
expo run:android

# Check if notifications are working
expo push:android:show
```

#### **Step 8: Firebase Cloud Functions (Optional)**

Create: `functions/index.js` (if using Firebase Functions)

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.sendDailyReminders = functions.pubsub
  .schedule('0 9 * * *')
  .timeZone('America/New_York')
  .onRun(async (context) => {
    const users = await admin.firestore()
      .collection('users')
      .where('notificationPreferences.dailyReminders.enabled', '==', true)
      .get();
    
    const notifications = [];
    users.forEach(doc => {
      const user = doc.data();
      if (user.pushToken) {
        notifications.push({
          token: user.pushToken,
          notification: {
            title: 'Daily Journal Reminder',
            body: 'Time to capture today\'s memories!'
          }
        });
      }
    });
    
    return admin.messaging().sendAll(notifications);
  });
```

### 🚨 **Important Notes**

1. **You're using Expo** - so use `expo-notifications` NOT `@react-native-firebase`
2. **Firebase is already configured** - just need to enable Cloud Messaging
3. **No native code changes needed** - works with Expo Go
4. **Test on real device** - notifications don't work on simulator

### 📱 **Testing Commands**

#### **Android Testing (Free)**
```bash
# Test with your current setup
expo start
expo run:android
```

#### **iOS Testing (Requires Developer Account)**
```bash
# Test on real iPhone (simulator won't work)
expo run:ios
# Requires Apple Developer account and physical device
```

### 🔧 **Troubleshooting**

If notifications don't work:
1. **Check permissions** - Settings → Notifications → SproutBook
2. **Test on real device** - not simulator
3. **Check Firebase console** - Cloud Messaging status
4. **Verify token** - console.log the push token

### ✅ **Next Steps**
1. Run `npm install expo-notifications expo-device`
2. Update `app.json` with notification config
3. Create the service files above
4. Test on real device
5. Configure Firebase Cloud Messaging in console
