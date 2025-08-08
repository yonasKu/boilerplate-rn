# Biometric Authentication Integration Guide

## Overview
This guide provides step-by-step instructions for integrating Face ID/Touch ID biometric authentication into the SproutBook React Native app using Expo's ecosystem.

## Prerequisites
- Expo SDK 49+
- React Native 0.72+
- Existing Firebase authentication setup
- Node.js 16+

## Step 1: Install Required Dependencies

```bash
# Install biometric authentication package
npx expo install expo-local-authentication

# Install secure storage for credentials
npx expo install expo-secure-store

# Install async storage for settings (if not already installed)
npx expo install @react-native-async-storage/async-storage
```

## Step 2: Create Biometric Service

Create a new file: `src/services/biometricService.ts`

```typescript
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
const USER_CREDENTIALS_KEY = 'user_credentials';

export interface BiometricService {
  isAvailable: () => Promise<boolean>;
  hasEnrolledBiometrics: () => Promise<boolean>;
  authenticate: (promptMessage?: string) => Promise<boolean>;
  enableBiometric: (email: string, password: string) => Promise<void>;
  disableBiometric: () => Promise<void>;
  isBiometricEnabled: () => Promise<boolean>;
  getStoredCredentials: () => Promise<{ email: string; password: string } | null>;
  getBiometricType: () => Promise<LocalAuthentication.AuthenticationType | null>;
}

export const biometricService: BiometricService = {
  /**
   * Check if biometric authentication is available on the device
   */
  async isAvailable() {
    const result = await LocalAuthentication.hasHardwareAsync();
    return result;
  },

  /**
   * Check if user has enrolled biometrics (Face ID/Touch ID)
   */
  async hasEnrolledBiometrics() {
    const result = await LocalAuthentication.isEnrolledAsync();
    return result;
  },

  /**
   * Get the type of biometric authentication available
   */
  async getBiometricType() {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (types.length > 0) {
      return types[0];
    }
    return null;
  },

  /**
   * Perform biometric authentication
   */
  async authenticate(promptMessage = 'Use your biometric authentication to login') {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        fallbackLabel: 'Use passcode',
        cancelLabel: 'Cancel',
      });
      return result.success;
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return false;
    }
  },

  /**
   * Enable biometric authentication and store credentials securely
   */
  async enableBiometric(email: string, password: string) {
    try {
      // First, authenticate with biometrics to confirm identity
      const authenticated = await this.authenticate('Confirm your identity to enable biometric login');
      
      if (!authenticated) {
        throw new Error('Biometric authentication failed');
      }

      // Store credentials securely
      const credentials = JSON.stringify({ email, password });
      await SecureStore.setItemAsync(USER_CREDENTIALS_KEY, credentials);
      
      // Mark biometric as enabled
      await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
    } catch (error) {
      console.error('Error enabling biometric:', error);
      throw error;
    }
  },

  /**
   * Disable biometric authentication and remove stored credentials
   */
  async disableBiometric() {
    try {
      await SecureStore.deleteItemAsync(USER_CREDENTIALS_KEY);
      await AsyncStorage.removeItem(BIOMETRIC_ENABLED_KEY);
    } catch (error) {
      console.error('Error disabling biometric:', error);
      throw error;
    }
  },

  /**
   * Check if biometric authentication is enabled
   */
  async isBiometricEnabled() {
    const enabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
    return enabled === 'true';
  },

  /**
   * Get stored credentials for biometric login
   */
  async getStoredCredentials() {
    try {
      const credentials = await SecureStore.getItemAsync(USER_CREDENTIALS_KEY);
      return credentials ? JSON.parse(credentials) : null;
    } catch (error) {
      console.error('Error retrieving credentials:', error);
      return null;
    }
  },
};
```

## Step 3: Update LoginScreen Component

Update the existing LoginScreen to integrate biometric authentication:

```typescript
// Add these imports at the top
import { useFocusEffect } from '@react-navigation/native';
import { biometricService } from '@/services/biometricService';

// Add these state variables
const [biometricAvailable, setBiometricAvailable] = useState(false);
const [biometricEnabled, setBiometricEnabled] = useState(false);
const [biometricType, setBiometricType] = useState<string>('Face ID');

// Add biometric check on screen focus
useFocusEffect(
  React.useCallback(() => {
    checkBiometricAvailability();
  }, [])
);

// Add biometric availability check function
const checkBiometricAvailability = async () => {
  try {
    const available = await biometricService.isAvailable();
    const enrolled = await biometricService.hasEnrolledBiometrics();
    const enabled = await biometricService.isBiometricEnabled();
    
    if (available && enrolled) {
      setBiometricAvailable(true);
      setBiometricEnabled(enabled);
      
      // Get biometric type for display
      const type = await biometricService.getBiometricType();
      if (type === LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION) {
        setBiometricType('Face ID');
      } else if (type === LocalAuthentication.AuthenticationType.FINGERPRINT) {
        setBiometricType('Touch ID');
      } else {
        setBiometricType('Biometric');
      }
    }
  } catch (error) {
    console.error('Error checking biometric availability:', error);
  }
};

// Update handleLogin to optionally enable biometric
const handleLogin = async () => {
  if (!email || !password) {
    Alert.alert('Login Failed', 'Please enter both email and password.');
    return;
  }

  setIsLoading(true);
  try {
    await signInWithEmail(email, password);

    // After successful login, offer to enable biometric
    if (biometricAvailable && !biometricEnabled) {
      Alert.alert(
        'Enable Biometric Login?',
        `Would you like to use ${biometricType} for faster login next time?`,
        [
          { text: 'Not Now', style: 'cancel' },
          {
            text: 'Enable',
            onPress: async () => {
              try {
                await biometricService.enableBiometric(email, password);
                setBiometricEnabled(true);
                Alert.alert('Success', `${biometricType} login enabled!`);
              } catch (error) {
                Alert.alert('Error', 'Could not enable biometric login.');
              }
            },
          },
        ]
      );
    }

    // Continue with navigation...
  } catch (error) {
    // Handle error...
  }
};

// Add biometric login handler
const handleBiometricLogin = async () => {
  if (!biometricEnabled) {
    Alert.alert('Biometric Login', 'Biometric login is not enabled. Please log in with email and password first.');
    return;
  }

  try {
    const authenticated = await biometricService.authenticate(`Login with ${biometricType}`);
    
    if (authenticated) {
      const credentials = await biometricService.getStoredCredentials();
      
      if (credentials) {
        setIsLoading(true);
        try {
          await signInWithEmail(credentials.email, credentials.password);
          
          // Continue with navigation...
          const { checkOnboardingStatus } = await import('../../../services/userService');
          const { getAuth } = await import('firebase/auth');
          const auth = getAuth();

          const status = await checkOnboardingStatus(auth.currentUser?.uid || '');

          if (!status.hasProfile) {
            router.replace('/(auth)/add-profile');
          } else if (!status.hasChild) {
            router.replace('/(auth)/add-child-details');
          } else {
            router.replace('/(main)/(tabs)/journal');
          }
        } catch (error: any) {
          console.error('Biometric login error:', error);
          Alert.alert('Login Failed', 'Could not authenticate with biometrics. Please try again.');
        } finally {
          setIsLoading(false);
        }
      }
    }
  } catch (error) {
    console.error('Biometric authentication error:', error);
    Alert.alert('Authentication Failed', 'Could not verify your identity.');
  }
};

// Update the Face ID button to be functional
<TouchableOpacity 
  style={[styles.faceIdButton, !biometricEnabled && styles.disabledFaceIdButton]} 
  onPress={handleBiometricLogin}
  disabled={!biometricEnabled}
>
  <Image 
    source={require('../../../assets/images/iconoir_face-id.png')} 
    style={[styles.faceIdIcon, !biometricEnabled && styles.disabledFaceIdIcon]} 
  />
</TouchableOpacity>
```

## Step 4: Add Settings Option for Biometric Management

Create a component to manage biometric settings:

```typescript
// src/components/BiometricSettings.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, Alert } from 'react-native';
import { biometricService } from '@/services/biometricService';

interface BiometricSettingsProps {
  email?: string;
  password?: string;
}

export const BiometricSettings: React.FC<BiometricSettingsProps> = ({ email, password }) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('Biometric');

  useEffect(() => {
    checkAvailability();
    checkStatus();
  }, []);

  const checkAvailability = async () => {
    const available = await biometricService.isAvailable();
    const enrolled = await biometricService.hasEnrolledBiometrics();
    setIsAvailable(available && enrolled);

    if (available && enrolled) {
      const type = await biometricService.getBiometricType();
      if (type === 1) setBiometricType('Face ID');
      else if (type === 2) setBiometricType('Touch ID');
    }
  };

  const checkStatus = async () => {
    const enabled = await biometricService.isBiometricEnabled();
    setIsEnabled(enabled);
  };

  const toggleBiometric = async (value: boolean) => {
    if (value && email && password) {
      try {
        await biometricService.enableBiometric(email, password);
        setIsEnabled(true);
        Alert.alert('Success', `${biometricType} login enabled!`);
      } catch (error) {
        Alert.alert('Error', 'Could not enable biometric login.');
      }
    } else if (!value) {
      try {
        await biometricService.disableBiometric();
        setIsEnabled(false);
        Alert.alert('Success', `${biometricType} login disabled!`);
      } catch (error) {
        Alert.alert('Error', 'Could not disable biometric login.');
      }
    } else if (value && (!email || !password)) {
      Alert.alert('Error', 'Please log in first to enable biometric authentication.');
    }
  };

  if (!isAvailable) {
    return (
      <View style={styles.container}>
        <Text style={styles.unavailableText}>
          {biometricType} is not available on this device or not enrolled.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>Use {biometricType} for Login</Text>
        <Switch
          value={isEnabled}
          onValueChange={toggleBiometric}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={isEnabled ? '#f5dd4b' : '#f4f3f4'}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  label: {
    fontSize: 16,
    color: '#333',
  },
  unavailableText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
});
```

## Step 5: Platform-Specific Configuration

### iOS Configuration (app.json)
```json
{
  "ios": {
    "infoPlist": {
      "NSFaceIDUsageDescription": "This app uses Face ID for secure login"
    }
  }
}
```

### Android Configuration (no additional setup required)

## Step 6: Security Best Practices

### 1. Credential Encryption
The credentials are stored using Expo SecureStore, which provides:
- Hardware-backed encryption when available
- Keychain (iOS) / Keystore (Android) integration
- Automatic encryption/decryption

### 2. Biometric Authentication Flow
```
1. User enables biometric → Authenticate with biometrics
2. Store credentials securely → Only after successful biometric auth
3. Subsequent logins → Biometric authentication → Retrieve credentials → Login
4. Disable biometric → Remove stored credentials
```

### 3. Error Handling
- Network failures
- Biometric authentication failures
- Credential retrieval failures
- Fallback to email/password

## Step 7: Testing Checklist

### Device Testing
- [ ] Test on iOS device with Face ID
- [ ] Test on iOS device with Touch ID
- [ ] Test on Android device with fingerprint
- [ ] Test on Android device with face unlock
- [ ] Test fallback scenarios

### Edge Cases
- [ ] Test biometric authentication failure
- [ ] Test credential corruption
- [ ] Test network disconnection during biometric login
- [ ] Test app update scenarios
- [ ] Test device migration (new device)

### Security Testing
- [ ] Verify credentials are encrypted
- [ ] Verify biometric data is not stored
- [ ] Verify proper authentication flow
- [ ] Test disable/enable scenarios

## Step 8: User Experience Guidelines

### First-Time Setup
1. After successful email/password login
2. Show biometric enable prompt
3. Explain security benefits
4. Provide clear opt-out option

### Settings Management
1. Add biometric toggle in settings
2. Provide clear status indicators
3. Show biometric type (Face ID/Touch ID)
4. Provide disable option

### Error Messages
- Clear, non-technical language
- Actionable guidance
- Appropriate fallback options

## Troubleshooting

### Common Issues
1. **"Biometric not available"**
   - Check device compatibility
   - Verify biometric enrollment
   - Restart app/device

2. **"Authentication failed"**
   - Check biometric sensor
   - Clean device sensors
   - Restart authentication flow

3. **"Credentials not found"**
   - Verify biometric was enabled
   - Check app reinstall scenarios
   - Ensure proper storage permissions

### Debug Mode
Add debug logging during development:

```typescript
const DEBUG = __DEV__;

if (DEBUG) {
  console.log('Biometric available:', await biometricService.isAvailable());
  console.log('Biometric enrolled:', await biometricService.hasEnrolledBiometrics());
  console.log('Biometric enabled:', await biometricService.isBiometricEnabled());
}
```

## Migration Guide

### From Existing App
1. Install new dependencies
2. Add biometric service
3. Update LoginScreen
4. Test thoroughly
5. Gradual rollout

### Data Migration
- Existing users: prompt to enable biometric
- New users: offer during first login
- No breaking changes to existing auth flow

## Support and Maintenance

### Regular Updates
- Monitor biometric API changes
- Update dependencies regularly
- Test with new OS versions
- Security audits

### User Support
- Clear documentation
- In-app help
- Support contact information
- FAQ section

This guide provides a complete implementation for integrating biometric authentication into your SproutBook app while maintaining security best practices and providing excellent user experience.
