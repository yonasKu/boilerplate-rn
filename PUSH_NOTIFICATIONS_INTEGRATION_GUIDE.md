# Push Notifications Integration Guide
## SproutBook - Using Existing NotificationService

### 🎯 **Overview**
Your `NotificationService.ts` is already fully coded and ready to use! This guide shows you how to integrate it into your app.

### 📁 **Existing Service Location**
```
src/services/notifications/NotificationService.ts
```

### 🔧 **Integration Steps**

#### **Step 1: Firebase Setup (Required First)**
1. **Enable Cloud Messaging API** in Firebase Console
2. **iOS Setup** (requires Apple Developer account - $99/year):
   - Create APNs Authentication Key (.p8 file)
   - Upload to Firebase Console → Cloud Messaging → iOS App
3. **Android Setup** (already configured):
   - Firebase Console → Cloud Messaging → Android App → Server Key

#### **Step 2: Update Firebase Config**
Add messaging import to your existing config:
```typescript
// src/lib/firebase/firebaseConfig.ts
import { getMessaging } from 'firebase/messaging';

// Add this export
export const messaging = getMessaging(app);
```

#### **Step 3: Add Push Token to User Login**
Update your LoginScreen to save push tokens:
```typescript
// src/features/auth/screens/LoginScreen.tsx
import NotificationService from '../../services/notifications/NotificationService';

// Add after successful login
const setupNotifications = async () => {
  const hasPermission = await NotificationService.requestPermissions();
  if (hasPermission) {
    const token = await NotificationService.getPushToken();
    if (token && auth.currentUser) {
      await NotificationService.saveTokenToFirestore(auth.currentUser.uid, token);
    }
  }
};

// Call in useEffect after login success
useEffect(() => {
  if (auth.currentUser) {
    setupNotifications();
  }
}, [auth.currentUser]);
```

#### **Step 4: Create Notification Settings Screen**
Create: `src/features/settings/screens/NotificationSettingsScreen.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, TouchableOpacity } from 'react-native';
import { getAuth } from 'firebase/auth';
import NotificationService from '../../../services/notifications/NotificationService';

export default function NotificationSettingsScreen() {
  const [preferences, setPreferences] = useState({
    dailyReminders: { enabled: true, time: '09:00' },
    recapAlerts: { enabled: true },
    familyEngagement: { enabled: true }
  });

  const auth = getAuth();
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    if (!userId) return;
    const prefs = await NotificationService.getNotificationPreferences(userId);
    if (prefs) setPreferences(prefs);
  };

  const updatePreference = async (key: string, value: any) => {
    if (!userId) return;
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);
    await NotificationService.updateNotificationPreferences(userId, newPrefs);
  };

  const scheduleDailyReminder = async () => {
    if (!userId) return;
    await NotificationService.scheduleDailyReminder(9, 0);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notification Settings</Text>
      
      <View style={styles.setting}>
        <Text>Daily Journal Reminders</Text>
        <Switch 
          value={preferences.dailyReminders.enabled}
          onValueChange={(value) => 
            updatePreference('dailyReminders', { ...preferences.dailyReminders, enabled: value })
          }
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={scheduleDailyReminder}>
        <Text>Test Daily Reminder</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  setting: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15 },
  button: { backgroundColor: '#5D9275', padding: 15, borderRadius: 8, marginTop: 20 }
});
```

#### **Step 5: Add to Settings Navigation**
Add notification settings to your settings screen:
```typescript
// In your settings screen
<TouchableOpacity 
  style={styles.menuItem}
  onPress={() => router.push('/settings/notifications')}
>
  <Text>Notification Settings</Text>
</TouchableOpacity>
```

#### **Step 6: Update Logout Logic**
Clean up push token on logout:
```typescript
// In your logout handler
const handleLogout = async () => {
  const userId = auth.currentUser?.uid;
  if (userId) {
    await NotificationService.removeTokenFromFirestore(userId);
  }
  await auth.signOut();
};
```

### 📱 **Testing Checklist**

#### **Android Testing (Free)**
```bash
# Test on real Android device
expo run:android

# Check permissions
Settings → Apps → SproutBook → Notifications
```

#### **iOS Testing (Requires Developer Account)**
```bash
# Test on real iPhone
expo run:ios

# Check permissions
Settings → Notifications → SproutBook
```

### 🔍 **Available Methods**

| Method | Purpose |
|--------|---------|
| `requestPermissions()` | Ask user for notification permission |
| `getPushToken()` | Get device push token |
| `saveTokenToFirestore()` | Save token to user document |
| `scheduleDailyReminder()` | Schedule daily journal reminders |
| `getNotificationPreferences()` | Get user preferences |
| `updateNotificationPreferences()` | Update user preferences |
| `removeTokenFromFirestore()` | Clean up on logout |

### 🚨 **Important Notes**

1. **Physical device required** - simulators don't support push notifications
2. **Permissions first** - always request permissions before getting token
3. **iOS requires developer account** - $99/year for APNs key
4. **Test thoroughly** - notifications behave differently on iOS vs Android
5. **Token management** - tokens can change, update regularly

### 🎯 **Next Steps**
1. Complete Firebase Cloud Messaging setup in console
2. Add notification settings to your settings screen
3. Test on real device
4. Add scheduled notifications for daily reminders
5. Implement family sharing notifications
