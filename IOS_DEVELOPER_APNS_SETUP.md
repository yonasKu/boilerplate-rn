# iOS Developer Account - APNs Key Setup Guide
## SproutBook - Step-by-Step iOS Push Notifications

### 🎯 **Complete iOS Setup with Developer Account**

#### **Prerequisites Checklist**
- [ ] Apple Developer Account ($99/year) - **Required**
- [ ] Real iPhone/iPad for testing - **Required**
- [ ] Xcode installed (for device testing)

---

### **Step 1: Create APNs Authentication Key (.p8 file)**

#### **1.1 Access Apple Developer Portal**
```
1. Go to: https://developer.apple.com/account
2. Sign in with your Apple Developer account
3. Navigate: Certificates, Identifiers & Profiles
4. Click: "Keys" tab
```

#### **1.2 Create the Key**
```
1. Click: "+" (Create a Key)
2. Key Name: "SproutBookAPNs"
3. Services: Check "Apple Push Notifications service (APNs)"
4. Click: Continue
5. Click: Register
6. Click: Download
7. Save: AuthKey_XXXXXXXXXX.p8 file
```

#### **1.3 Get Required IDs**
```
Key ID: ABC123DEFG (from filename after AuthKey_)
Team ID: 1234567890 (from Apple Developer account → Membership)
```

---

### **Step 2: Upload to Firebase Console**

#### **2.1 Navigate to Firebase**
```
1. Go to: https://console.firebase.google.com
2. Select your SproutBook project
3. Project Settings → Cloud Messaging
```

#### **2.2 Upload APNs Key**
```
1. Find your iOS app in the list
2. Click: "Upload APNs Authentication Key"
3. Upload: Your .p8 file
4. Enter: Key ID (from filename)
5. Enter: Team ID (from Apple Developer)
6. Click: Upload
```

---

### **Step 3: App Identifier - SIMPLIFIED for Expo**

#### **3.1 Check Your Bundle ID (Expo Handles This)**
**Expo automatically manages App IDs and provisioning profiles**

**What you need to verify:**
- **Bundle ID:** Must match your app's bundle identifier
- **Format:** `com.yourcompany.sproutbook` (or whatever you set in app.json)

**Expo handles:**
- ✅ App ID creation
- ✅ Provisioning profile generation
- ✅ Push notifications capability
- ✅ Device registration

#### **3.2 Bundle ID Check**
```bash
# Check your bundle ID
expo config --type introspect
# Look for: "bundleIdentifier" in ios section
```

#### **3.3 If Bundle ID Doesn't Exist**
```json
// Add to app.json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.yourcompany.sproutbook"
    }
  }
}
```

### **Step 3: Simplified iOS Setup**

#### **3.1 Bundle ID Verification**
**Expo automatically creates App IDs and handles provisioning**

**What you need:**
- **Bundle ID:** `com.yourcompany.sproutbook` (or your choice)
- **This MUST match** in both Apple Developer and Firebase

**Expo handles:**
- ✅ App ID creation
- ✅ Provisioning profiles
- ✅ Push notifications capability
- ✅ Device testing setup

#### **3.2 Bundle ID Setup**
```json
// In app.json (if not already set)
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.yourcompany.sproutbook"
    }
  }
}
```

#### **3.3 Verification Commands**
```bash
# Check current bundle ID
expo config --type introspect | grep bundleIdentifier

# Ensure it matches in Firebase
# Firebase Console → Project Settings → iOS app → Bundle ID
```

---

### **Step 4: Testing on iOS Device**

#### **4.1 Device Setup**
```bash
# Connect iPhone to Mac
# Trust computer on iPhone
# Open Xcode
# Select your device as target

# Run on device
expo run:ios --device
```

#### **4.2 Test Push Notifications**
```bash
# Send test notification
expo push:ios:show

# Verify in Firebase Console
# Cloud Messaging → Send test message
```

---

### **Step 5: Common Issues & Solutions**

#### **Problem: "No valid APNs authentication key"**
**Solution:** Re-upload .p8 file with correct Key ID and Team ID

#### **Problem: "Device token not registered"**
**Solution:** Test on real device, not simulator

#### **Problem: "Bundle identifier mismatch"**
**Solution:** Ensure bundle ID matches exactly in Apple Developer and Firebase

---

### **Step 6: Verification Checklist**

#### **Apple Developer Portal**
- [ ] APNs key created and downloaded (.p8 file)
- [ ] Key ID noted (from filename)
- [ ] Team ID noted (from account)

#### **Firebase Console**
- [ ] APNs key uploaded successfully
- [ ] Key ID and Team ID entered correctly
- [ ] iOS app bundle ID matches Apple Developer

#### **Device Testing**
- [ ] Real iPhone connected
- [ ] App installed via Xcode/expo
- [ ] Push notifications permission granted
- [ ] Test notification received successfully

---

### **Quick Reference Commands**

```bash
# Test on iOS device
expo run:ios --device

# Check push token
expo push:ios:show

# Reset notifications
npx expo notifications:reset

# View logs
expo logs --ios
```

### **Support Resources**
- **Apple Developer:** developer.apple.com/account
- **Firebase Docs:** firebase.google.com/docs/cloud-messaging/ios/client
- **Expo Docs:** docs.expo.dev/push-notifications/overview/
