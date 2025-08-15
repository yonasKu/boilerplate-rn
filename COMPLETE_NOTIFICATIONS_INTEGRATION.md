# Complete Push Notifications Integration
## SproutBook - Unified Setup & Settings Integration

### 🎯 **One-Stop Guide**
This guide combines both setup approaches into a single implementation path using your existing NotificationService and Settings screen.

### 📋 **Quick Start Checklist**

#### **Phase 1: Firebase Setup (Required First)**
1. **Firebase Console** → Project Settings → Cloud Messaging
2. **Enable Cloud Messaging API**
3. **Android**: Already configured (Expo handles automatically)
4. **iOS**: Requires Apple Developer account ($99/year)
   - Create APNs Authentication Key (.p8 file)
   - Upload to Firebase → Cloud Messaging → iOS App

#### **Phase 2: Code Integration (Copy-Paste Ready)**

##### **Step 1: Install Dependencies**
```bash
expo install expo-notifications expo-device expo-permissions
```

##### **Step 2: Update AccountSettingsScreen for Push Notifications**
Update your existing `src/features/settings/screens/AccountSettingsScreen.tsx` to add push notification functionality:

```typescript
// Add to existing imports
import NotificationService from '../../../services/notifications/NotificationService';

// Update the AccountSettingsScreen component
const AccountSettingsScreen = () => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  // Update existing reminders state to include push notifications
  const [reminders, setReminders] = useState({
    dailyEntries: true,
    comments: false,
    likes: true,
    weeklyRecaps: true,
    monthlyRecaps: true,
    pushNotifications: false, // Add this
  });

  const [hasPushPermission, setHasPushPermission] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const profile = await getUserProfile(user.uid);
        setUserProfile(profile);
        
        // Load push notification preferences
        const permission = await NotificationService.requestPermissions();
        setHasPushPermission(permission);
        
        const prefs = await NotificationService.getNotificationPreferences(user.uid);
        if (prefs) {
          setReminders(prev => ({ ...prev, pushNotifications: prefs.pushNotifications?.enabled || false }));
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [user]);

  const handlePushNotificationToggle = async (enabled: boolean) => {
    if (!user?.uid) return;
    
    if (enabled) {
      const granted = await NotificationService.requestPermissions();
      setHasPushPermission(granted);
      
      if (granted) {
        const token = await NotificationService.getPushToken();
        if (token) {
          await NotificationService.saveTokenToFirestore(user.uid, token);
        }
      }
    } else {
      setHasPushPermission(false);
      await NotificationService.removeTokenFromFirestore(user.uid);
    }
    
    setReminders(prev => ({ ...prev, pushNotifications: enabled }));
    await NotificationService.updateNotificationPreferences(user.uid, {
      pushNotifications: { enabled }
    });
  };
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
    
    const permission = await NotificationService.requestPermissions();
    setHasPermission(permission);
    
    const prefs = await NotificationService.getNotificationPreferences(userId);
    if (prefs) setPreferences(prefs);
    
    setIsLoading(false);
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

  const toggleReminder = async (type: string, enabled: boolean) => {
    if (!userId || !hasPermission) return;
    
    const newPrefs = { ...preferences, [type]: { enabled } };
    setPreferences(newPrefs);
    await NotificationService.updateNotificationPreferences(userId, newPrefs);
    
    if (type === 'dailyReminders' && enabled) {
      await NotificationService.scheduleDailyReminder(9, 0);
    }
  };

  const testNotification = async () => {
    if (!hasPermission) {
      alert('Please enable notifications first');
      return;
    }
    
    await NotificationService.scheduleDailyReminder(
      new Date().getHours(), 
      new Date().getMinutes() + 1
    );
    alert('Test notification scheduled for 1 minute from now');
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScreenHeader title="Notification Settings" />

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]} >
      <ScreenHeader title="Account settings" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        
        {/* Existing Security section */}
        <AccordionSection title="Security" defaultExpanded={true}>
          <InfoRow label="Email" value={user?.email || 'user@gmail.com'} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Password</Text>
            <TouchableOpacity style={styles.passwordContainer} onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
              <Text style={styles.rowValue}>{isPasswordVisible ? 'password123' : '••••••••'}</Text>
              <Feather name={isPasswordVisible ? 'eye' : 'eye-off'} size={20} color={Colors.mediumGrey} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </View>
        </AccordionSection>

        {/* Updated Notifications section with push notifications */}
        <AccordionSection title="Notifications" defaultExpanded={true}>
          <ReminderRow 
            label="Push Notifications" 
            value={reminders.pushNotifications} 
            onValueChange={handlePushNotificationToggle} 
          />
          <ReminderRow 
            label="Daily Entries" 
            value={reminders.dailyEntries} 
            onValueChange={() => handleReminderChange('dailyEntries')} 
          />
          <ReminderRow 
            label="Comments" 
            value={reminders.comments} 
            onValueChange={() => handleReminderChange('comments')} 
          />
          <ReminderRow 
            label="Likes" 
            value={reminders.likes} 
            onValueChange={() => handleReminderChange('likes')} 
          />
          <ReminderRow 
            label="Weekly Recaps" 
            value={reminders.weeklyRecaps} 
            onValueChange={() => handleReminderChange('weeklyRecaps')} 
          />
          <ReminderRow 
            label="Monthly Recaps" 
            value={reminders.monthlyRecaps} 
            onValueChange={() => handleReminderChange('monthlyRecaps')} 
            isLast={true} 
          />
          
          {/* Test notification button */}
          <TouchableOpacity 
            style={styles.testButton} 
            onPress={async () => {
              if (!user?.uid) return;
              await NotificationService.scheduleDailyReminder(user.uid);
            }}
          >
            <Text style={styles.testButtonText}>Send Test Notification</Text>
          </TouchableOpacity>
        </AccordionSection>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  content: { padding: 20 },
  loadingText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: Colors.grey },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: Colors.darkGrey, marginBottom: 15 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.lightGrey },
  settingText: { fontSize: 16, color: Colors.darkGrey },
  button: { backgroundColor: Colors.primary, padding: 15, borderRadius: 8, alignItems: 'center' },
  buttonDisabled: { backgroundColor: Colors.grey },
  buttonText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
  testButton: {
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    marginHorizontal: 16,
  },
  testButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
});
      const hasPermission = await NotificationService.requestPermissions();
      if (hasPermission) {
        const token = await NotificationService.getPushToken();
        if (token) {
          await NotificationService.saveTokenToFirestore(auth.currentUser.uid, token);
        }
      }
    }
  };
  
  setupNotifications();
}, [auth.currentUser]);
```

##### **Step 5: Update Logout Cleanup**
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

### 🧪 **Testing Protocol**

#### **Pre-Testing Setup**
1. **Physical device required** (simulator won't work)
2. **Firebase Cloud Messaging enabled** in console
3. **iOS**: Apple Developer account + APNs key uploaded
4. **Android**: Already configured via Firebase

#### **Test Commands**
```bash
# Android
expo run:android

# iOS (requires developer account)
expo run:ios
```

#### **Test Checklist**
- [ ] Settings screen shows "Notifications" option
- [ ] Notification settings screen loads
- [ ] Permission request works
- [ ] Toggle switches function
- [ ] Test notification schedules
- [ ] Token saves to Firestore on login
- [ ] Token removes on logout

### 🚨 **Critical Notes**

1. **iOS requires $99/year** Apple Developer account for push notifications
2. **Test on real device** - simulators don't support notifications
3. **Permissions first** - always request before getting token
4. **Token management** - tokens can change, update regularly
5. **Firebase setup** - Cloud Messaging must be enabled in console

### 🎯 **Final Implementation Order**
1. **Complete Firebase setup** (Cloud Messaging + iOS APNs if needed)
2. **Add notification option** to SettingsScreen
3. **Create notifications.tsx** file
4. **Add bell icon** asset
5. **Test on physical device**
6. **Deploy and monitor**
