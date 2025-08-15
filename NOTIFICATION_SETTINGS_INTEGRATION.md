# Notification Settings Integration Guide
## SproutBook - Adding Notifications to Existing Settings

### 🎯 **Overview**
Your existing Settings screen already has the perfect structure! Just add "Notification Settings" as a new menu item and create the notification preferences screen.

### 📁 **Existing Settings Location**
```
src/features/settings/screens/SettingsScreen.tsx
```

### 🔧 **Integration Steps**

#### **Step 1: Add Notification Option to Settings**
Update your existing settings options array:

```typescript
// In src/features/settings/screens/SettingsScreen.tsx
const settingsOptions: SettingsOption[] = [
  { icon: require('../../../assets/images/tabler_mood-kid_icon.png'), text: 'Child Profiles' },
  { icon: require('../../../assets/images/link_icon.png'), text: 'Partner access' },
  { icon: require('../../../assets/images/refer_icon.png'), text: 'Refer a friend' },
  { icon: require('../../../assets/images/settings_icon.png'), text: 'Account settings' },
  { icon: require('../../../assets/images/gift_icon.png'), text: 'Gift a free year' },
  { icon: require('../../../assets/images/people_icon.png'), text: 'Family sharing' },
  { icon: require('../../../assets/images/bell_icon.png'), text: 'Notifications' }, // ADD THIS
  { icon: 'log-out', text: 'Logout' },
];
```

#### **Step 2: Add Navigation Logic**
Add the new navigation case to your existing handler:

```typescript
// In SettingsScreen.tsx, update the onPress handler
<TouchableOpacity key={index} style={styles.optionRow} onPress={() => {
    if (option.text === 'Child Profiles') {
      router.push('/child-profiles');
    } else if (option.text === 'Account settings') {
      router.push('/account-settings');
    } else if (option.text === 'Partner access') {
      router.push('/partner-access');
    } else if (option.text === 'Refer a friend') {
      router.push('/refer-a-friend');
    } else if (option.text === 'Family sharing') {
      router.push('/family-sharing');
    } else if (option.text === 'Notifications') { // ADD THIS
      router.push('/settings/notifications');
    } else if (option.text === 'Logout') {
      signOut();
    }
  }}>
```

#### **Step 3: Create Notification Settings Screen**
Create: `src/app/(main)/settings/notifications.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAuth } from 'firebase/auth';
import ScreenHeader from '../../../components/ui/ScreenHeader';
import NotificationService from '../../../services/notifications/NotificationService';
import { Colors } from '../../../theme/colors';

export default function NotificationSettingsScreen() {
  const insets = useSafeAreaInsets();
  const [preferences, setPreferences] = useState({
    dailyReminders: { enabled: true, time: '09:00' },
    recapAlerts: { enabled: true },
    familyEngagement: { enabled: true },
    pushNotifications: { enabled: true }
  });
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const auth = getAuth();
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!userId) return;
    
    // Check notification permissions
    const permission = await NotificationService.requestPermissions();
    setHasPermission(permission);
    
    // Load user preferences
    const prefs = await NotificationService.getNotificationPreferences(userId);
    if (prefs) setPreferences(prefs);
    
    setIsLoading(false);
  };

  const updatePreference = async (key: string, value: any) => {
    if (!userId) return;
    
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);
    await NotificationService.updateNotificationPreferences(userId, newPrefs);
  };

  const handlePermissionToggle = async (enabled: boolean) => {
    if (enabled) {
      const granted = await NotificationService.requestPermissions();
      setHasPermission(granted);
      if (granted && userId) {
        const token = await NotificationService.getPushToken();
        if (token) {
          await NotificationService.saveTokenToFirestore(userId, token);
        }
      }
    } else {
      setHasPermission(false);
      if (userId) {
        await NotificationService.removeTokenFromFirestore(userId);
      }
    }
  };

  const testNotification = async () => {
    if (!hasPermission) {
      alert('Please enable notifications first');
      return;
    }
    
    // Schedule a test notification in 5 seconds
    await NotificationService.scheduleDailyReminder(new Date().getHours(), new Date().getMinutes() + 1);
    alert('Test notification scheduled for 1 minute from now');
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScreenHeader title="Notification Settings" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Notification Settings" />
      
      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Push Notifications Toggle */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Push Notifications</Text>
          <View style={styles.settingRow}>
            <Text style={styles.settingText}>Enable Notifications</Text>
            <Switch 
              value={hasPermission}
              onValueChange={handlePermissionToggle}
              trackColor={{ false: Colors.grey, true: Colors.primary }}
            />
          </View>
        </View>

        {/* Notification Types */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Types</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingText}>Daily Journal Reminders</Text>
            <Switch 
              value={preferences.dailyReminders.enabled}
              onValueChange={(value) => 
                updatePreference('dailyReminders', { ...preferences.dailyReminders, enabled: value })
              }
              disabled={!hasPermission}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingText}>Weekly Recap Alerts</Text>
            <Switch 
              value={preferences.recapAlerts.enabled}
              onValueChange={(value) => 
                updatePreference('recapAlerts', { enabled: value })
              }
              disabled={!hasPermission}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingText}>Family Sharing Updates</Text>
            <Switch 
              value={preferences.familyEngagement.enabled}
              onValueChange={(value) => 
                updatePreference('familyEngagement', { enabled: value })
              }
              disabled={!hasPermission}
            />
          </View>
        </View>

        {/* Test Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Testing</Text>
          <TouchableOpacity 
            style={[styles.button, !hasPermission && styles.buttonDisabled]} 
            onPress={testNotification}
            disabled={!hasPermission}
          >
            <Text style={styles.buttonText}>Test Notification</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    padding: 20,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: Colors.grey,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.darkGrey,
    marginBottom: 15,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGrey,
  },
  settingText: {
    fontSize: 16,
    color: Colors.darkGrey,
  },
  button: {
    backgroundColor: Colors.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: Colors.grey,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
```

#### **Step 4: Add Bell Icon Asset**
Create or add a bell icon to your assets:
- Add `bell_icon.png` to `src/assets/images/`
- Use any bell icon that matches your design style

#### **Step 5: Update Navigation**
Your existing `(main)/_layout.tsx` should automatically handle the new route since you're using Expo Router's file-based routing.

### 🎯 **Usage Examples**

#### **Daily Reminders Setup**
```typescript
// Call when user enables daily reminders
await NotificationService.scheduleDailyReminder(9, 0); // 9:00 AM daily
```

#### **Check Current Settings**
```typescript
const currentPrefs = await NotificationService.getNotificationPreferences(userId);
console.log('Current settings:', currentPrefs);
```

### 🧪 **Testing Steps**
1. **Add the notification option** to your SettingsScreen
2. **Create the notifications screen** file
3. **Test on real device** (simulator won't work)
4. **Verify permissions** are requested correctly
5. **Test notification scheduling** with the test button

### ✅ **Complete Integration Checklist**
- [ ] Add "Notifications" to settingsOptions array
- [ ] Add navigation case for "Notifications"
- [ ] Create notifications.tsx file
- [ ] Add bell icon asset
- [ ] Test on physical device
- [ ] Verify Firebase Cloud Messaging is enabled
