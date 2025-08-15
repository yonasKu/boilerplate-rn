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
      setBiometricType(type);
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
        Alert.alert('Success', `${biometricType} login enabled successfully!`);
      } catch (error: any) {
        let errorMessage = 'Failed to enable biometric login.';
        if (error.message.includes('not available')) {
          errorMessage = 'Biometric authentication is not available on this device.';
        } else if (error.message.includes('not enrolled')) {
          errorMessage = 'No biometrics enrolled. Please set up Face ID/Touch ID in device settings.';
        } else if (error.message.includes('cancelled')) {
          errorMessage = 'Biometric setup was cancelled.';
        } else if (error.message) {
          errorMessage = error.message;
        }
        Alert.alert('Error', errorMessage);
      }
    } else if (!value) {
      try {
        await biometricService.disableBiometric();
        setIsEnabled(false);
        Alert.alert('Success', `${biometricType} login disabled successfully!`);
      } catch (error: any) {
        let errorMessage = 'Failed to disable biometric login.';
        if (error.message) {
          errorMessage = error.message;
        }
        Alert.alert('Error', errorMessage);
      }
    } else if (value && (!email || !password)) {
      Alert.alert(
        'Cannot Enable Biometric Login',
        'Email and password are required to enable biometric login. Please ensure you are logged in and try again.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  if (!isAvailable) {
    return (
      <View style={styles.container}>
        <Text style={styles.unavailableText}>
          Biometric authentication is not available on this device. Please use email and password to login.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.textContainer}>
          <Text style={styles.label}>
            Enable {biometricType} Login
          </Text>
          <Text style={styles.description}>
            {isAvailable 
              ? (isEnabled ? 'Currently enabled' : 'Currently disabled')
              : 'Not available on this device'
            }
          </Text>
        </View>
        <Switch
          value={isEnabled}
          onValueChange={toggleBiometric}
          disabled={!isAvailable}
          trackColor={{ false: '#767577', true: '#007AFF' }}
          thumbColor={isEnabled ? '#fff' : '#f4f3f4'}
        />
      </View>
      {!isAvailable && (
        <Text style={styles.unavailableText}>
          Biometric authentication is not available on this device. Please use email and password to login.
        </Text>
      )}
      {isAvailable && !isEnabled && (
        <Text style={styles.hintText}>
          Enable this option to login faster with {biometricType.toLowerCase()} instead of typing your password.
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  unavailableText: {
    marginTop: 12,
    fontSize: 14,
    color: '#ff3b30',
    fontStyle: 'italic',
  },
  hintText: {
    marginTop: 12,
    fontSize: 13,
    color: '#007AFF',
    fontStyle: 'italic',
  },
});
