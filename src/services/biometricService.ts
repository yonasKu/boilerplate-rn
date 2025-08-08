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
  getBiometricType: () => Promise<string>;
  clearStoredCredentials: () => Promise<void>;
}

export const biometricService = {
  /**
   * Check if biometric authentication is available on the device
   */
  async isAvailable() {
    try {
      const result = await LocalAuthentication.hasHardwareAsync();
      return result;
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      return false;
    }
  },

  /**
   * Check if user has enrolled biometrics (Face ID/Touch ID)
   */
  async hasEnrolledBiometrics() {
    try {
      const result = await LocalAuthentication.isEnrolledAsync();
      return result;
    } catch (error) {
      console.error('Error checking biometric enrollment:', error);
      return false;
    }
  },

  /**
   * Get the type of biometric authentication available with fallback
   */
  async getBiometricType() {
    try {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        return 'Face ID';
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        return 'Touch ID';
      } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        return 'Iris Recognition';
      }
      
      return 'Biometric';
    } catch (error) {
      console.error('Error getting biometric type:', error);
      return 'Biometric';
    }
  },

  /**
   * Perform biometric authentication with comprehensive error handling
   */
  async authenticate(promptMessage = 'Use your biometric authentication to login') {
    try {
      // Check if biometric is available
      const available = await this.isAvailable();
      if (!available) {
        throw new Error('Biometric authentication is not available on this device');
      }

      // Check if biometrics are enrolled
      const enrolled = await this.hasEnrolledBiometrics();
      if (!enrolled) {
        throw new Error('No biometrics enrolled. Please set up Face ID/Touch ID in device settings');
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        fallbackLabel: 'Use passcode',
        cancelLabel: 'Cancel',
      });

      if (!result.success) {
        // Provide specific error messages based on the failure
        if (result.error) {
          switch (result.error) {
            case 'user_cancel':
              throw new Error('Biometric authentication was cancelled');
            case 'system_cancel':
              throw new Error('System cancelled biometric authentication');
            case 'not_enrolled':
              throw new Error('No biometrics enrolled on this device');
            case 'not_available':
              throw new Error('Biometric authentication is not available');
            default:
              throw new Error(`Biometric authentication failed: ${result.error}`);
          }
        }
        throw new Error('Biometric authentication failed');
      }

      return true;
    } catch (error) {
      console.error('Biometric authentication error:', error);
      throw error; // Re-throw to allow caller to handle
    }
  },

  /**
   * Enable biometric authentication and store credentials securely with error handling
   */
  async enableBiometric(email: string, password: string) {
    try {
      if (!email || !password) {
        throw new Error('Email and password are required to enable biometric login');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Invalid email format');
      }

      // First, authenticate with biometrics to confirm identity
      const authenticated = await this.authenticate('Confirm your identity to enable biometric login');
      
      if (!authenticated) {
        throw new Error('Biometric authentication failed');
      }

      // Store credentials securely with additional validation
      const credentials = JSON.stringify({ email: email.trim(), password });
      await SecureStore.setItemAsync(USER_CREDENTIALS_KEY, credentials);
      
      // Mark biometric as enabled
      await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
      
      console.log('Biometric authentication enabled successfully');
    } catch (error) {
      console.error('Error enabling biometric:', error);
      throw error;
    }
  },

  /**
   * Disable biometric authentication and remove stored credentials with cleanup
   */
  async disableBiometric() {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(USER_CREDENTIALS_KEY),
        AsyncStorage.removeItem(BIOMETRIC_ENABLED_KEY)
      ]);
      console.log('Biometric authentication disabled successfully');
    } catch (error) {
      console.error('Error disabling biometric:', error);
      throw error;
    }
  },

  /**
   * Check if biometric authentication is enabled with validation
   */
  async isBiometricEnabled() {
    try {
      const enabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
      const hasCredentials = await this.getStoredCredentials();
      
      // Only return true if both flag and credentials exist
      return enabled === 'true' && hasCredentials !== null;
    } catch (error) {
      console.error('Error checking biometric status:', error);
      return false;
    }
  },

  /**
   * Get stored credentials for biometric login with validation
   */
  async getStoredCredentials() {
    try {
      const credentials = await SecureStore.getItemAsync(USER_CREDENTIALS_KEY);
      if (!credentials) {
        return null;
      }

      const parsed = JSON.parse(credentials);
      
      // Validate credentials structure
      if (!parsed || typeof parsed !== 'object') {
        console.warn('Invalid credentials format stored');
        await this.clearStoredCredentials();
        return null;
      }

      if (!parsed.email || !parsed.password) {
        console.warn('Incomplete credentials stored');
        await this.clearStoredCredentials();
        return null;
      }

      return parsed;
    } catch (error) {
      console.error('Error retrieving credentials:', error);
      // If there's an error parsing, clear corrupted credentials
      await this.clearStoredCredentials();
      return null;
    }
  },

  /**
   * Clear stored credentials (for error recovery)
   */
  async clearStoredCredentials() {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(USER_CREDENTIALS_KEY),
        AsyncStorage.removeItem(BIOMETRIC_ENABLED_KEY)
      ]);
    } catch (error) {
      console.error('Error clearing credentials:', error);
    }
  },
};

export default biometricService;
