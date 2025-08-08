import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { signInWithEmail, useGoogleSignIn, resetPassword } from '@/lib/firebase/auth';
import { biometricService } from '@/services/biometricService';

export const useLogin = () => {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [isSendingReset, setIsSendingReset] = useState(false);
    const [biometricAvailable, setBiometricAvailable] = useState(false);
    const [biometricEnabled, setBiometricEnabled] = useState(false);
    const [biometricType, setBiometricType] = useState<string>('Face ID');
    const { promptAsync: promptGoogleSignIn } = useGoogleSignIn();

    useEffect(() => {
        checkBiometricAvailability();
    }, []);

    const checkBiometricAvailability = async () => {
        try {
            const available = await biometricService.isAvailable();
            const enrolled = await biometricService.hasEnrolledBiometrics();
            const enabled = await biometricService.isBiometricEnabled();
            
            if (available && enrolled) {
                setBiometricAvailable(true);
                setBiometricEnabled(enabled);
                
                const type = await biometricService.getBiometricType();
                setBiometricType(type);
            }
        } catch (error) {
            console.error('Error checking biometric availability:', error);
        }
    };

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Login Failed', 'Please enter both email and password.');
            return;
        }

        setIsLoading(true);
        try {
            await signInWithEmail(email, password);
            
            // Check if we should prompt for biometric setup
            const available = await biometricService.isAvailable();
            const enrolled = await biometricService.hasEnrolledBiometrics();
            const alreadyEnabled = await biometricService.isBiometricEnabled();
            
            if (available && enrolled && !alreadyEnabled) {
                Alert.alert(
                    'Enable Biometric Login',
                    'Would you like to enable biometric login for faster access next time?',
                    [
                        {
                            text: 'Enable',
                            onPress: async () => {
                                try {
                                    await biometricService.enableBiometric(email, password);
                                    setBiometricEnabled(true);
                                    Alert.alert('Success', 'Biometric login enabled successfully!');
                                } catch (error: any) {
                                    let errorMessage = 'Failed to enable biometric login.';
                                    if (error.message.includes('not available')) {
                                        errorMessage = 'Biometric authentication is not available on this device.';
                                    } else if (error.message.includes('not enrolled')) {
                                        errorMessage = 'No biometrics enrolled. Please set up Face ID/Touch ID in device settings.';
                                    } else if (error.message) {
                                        errorMessage = error.message;
                                    }
                                    Alert.alert('Error', errorMessage);
                                }
                            }
                        },
                        {
                            text: 'Not Now',
                            style: 'cancel'
                        }
                    ]
                );
            }
            
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
            let errorMessage = 'Login failed. Please check your credentials.';
            if (error.code === 'auth/user-not-found') {
                errorMessage = 'No user found with this email address.';
            } else if (error.code === 'auth/wrong-password') {
                errorMessage = 'Invalid password. Please try again.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email format.';
            } else if (error.code === 'auth/user-disabled') {
                errorMessage = 'This account has been disabled.';
            } else if (error.code === 'auth/network-request-failed') {
                errorMessage = 'Network error. Please check your internet connection.';
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = 'Too many failed attempts. Please try again later.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            Alert.alert('Login Failed', errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = () => {
        setResetEmail(email); // Pre-fill with current email if entered
        setShowResetModal(true);
    };

    const handleSendResetEmail = async () => {
        if (!resetEmail.trim()) {
            Alert.alert('Error', 'Please enter your email address');
            return;
        }

        setIsSendingReset(true);
        try {
            await resetPassword(resetEmail.trim());
            setShowResetModal(false);
            Alert.alert(
                'Password Reset Email Sent! 📧',
                `We've sent a password reset email to: ${resetEmail}\n\n` +
                'Please check your inbox and click the link to create a new password.\n\n' +
                'The reset link will expire in 1 hour.',
                [{ text: 'OK', style: 'default' }]
            );
            setResetEmail('');
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to send reset email');
        } finally {
            setIsSendingReset(false);
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            await promptGoogleSignIn();

            // Check onboarding status after Google login
            const { checkOnboardingStatus } = await import('../../../services/userService');
            const { getAuth } = await import('firebase/auth');
            const auth = getAuth();

            // Small delay to ensure auth state is updated
            setTimeout(async () => {
                const status = await checkOnboardingStatus(auth.currentUser?.uid || '');
                console.log('Post-Google-login onboarding status:', status);
                console.log('User UID:', auth.currentUser?.uid);

                // Debug: Check children separately
                const { getUserChildren } = await import('../../../services/userService');
                const children = await getUserChildren(auth.currentUser?.uid || '');
                console.log('Children found:', children.length);
                console.log('Children data:', children);

                if (!status.hasProfile) {
                    console.log('Redirecting to add-profile after Google login...');
                    router.replace('/(auth)/add-profile');
                } else if (!status.hasChild) {
                    console.log('Redirecting to add-child-details after Google login...');
                    router.replace('/(auth)/add-child-details');
                } else {
                    console.log('Onboarding complete, redirecting to main app...');
                    router.replace('/(main)/(tabs)/journal');
                }
            }, 1000);
        } catch (error) {
            console.error('Google Sign-In Error:', error);
            Alert.alert('Sign-In Error', 'An unexpected error occurred. Please try again.');
        }
    };

    const handleBiometricLogin = async () => {
        try {
            // Check if biometric is available and enabled
            const available = await biometricService.isAvailable();
            const enrolled = await biometricService.hasEnrolledBiometrics();
            
            if (!available) {
                Alert.alert(
                    'Biometric Login',
                    'Biometric authentication is not available on this device. Please use email and password.',
                    [{ text: 'OK', style: 'default' }]
                );
                return;
            }
            
            if (!enrolled) {
                Alert.alert(
                    'Biometric Login',
                    'No biometrics enrolled. Please set up Face ID/Touch ID in device settings.',
                    [
                        { text: 'OK', style: 'default' },
                        { text: 'Settings', onPress: () => {
                            Alert.alert('Device Settings', 'Go to Settings > Face ID & Passcode (iOS) or Settings > Security (Android) to set up biometrics.');
                        }}
                    ]
                );
                return;
            }

            if (!biometricEnabled) {
                Alert.alert(
                    'Biometric Login',
                    'Biometric login is not enabled. Please login with email and password first.',
                    [
                        { text: 'OK', style: 'default' },
                        { text: 'Learn More', onPress: () => {
                            Alert.alert('How to Enable', 'After logging in with email and password, you\'ll be prompted to enable biometric login for faster access next time.');
                        }}
                    ]
                );
                return;
            }

            const credentials = await biometricService.getStoredCredentials();
            if (!credentials) {
                Alert.alert(
                    'Biometric Login',
                    'Stored credentials are missing or corrupted. Please login with email and password.',
                    [
                        { text: 'OK', style: 'default' },
                        { text: 'Clear & Retry', onPress: async () => {
                            await biometricService.clearStoredCredentials();
                            Alert.alert('Cleared', 'Please login with email and password to set up biometric login again.');
                        }}
                    ]
                );
                return;
            }

            try {
                const success = await biometricService.authenticate(`Login with ${biometricType}`);
                if (success) {
                    setIsLoading(true);
                    try {
                        await signInWithEmail(credentials.email, credentials.password);
                        
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
                        
                        // Handle Firebase authentication errors with specific messages
                        let errorMessage = 'Login failed with stored credentials.';
                        let shouldDisableBiometric = false;
                        
                        if (error.code === 'auth/user-not-found') {
                            errorMessage = 'User account not found. The account may have been deleted.';
                            shouldDisableBiometric = true;
                        } else if (error.code === 'auth/wrong-password') {
                            errorMessage = 'Password has been changed. Please login with your new password.';
                            shouldDisableBiometric = true;
                        } else if (error.code === 'auth/user-disabled') {
                            errorMessage = 'This account has been disabled.';
                            shouldDisableBiometric = true;
                        } else if (error.code === 'auth/network-request-failed') {
                            errorMessage = 'Network error. Please check your internet connection.';
                        } else if (error.code === 'auth/too-many-requests') {
                            errorMessage = 'Too many failed attempts. Please try again later.';
                        } else if (error.message) {
                            errorMessage = error.message;
                        }
                        
                        Alert.alert('Login Failed', errorMessage, [
                            { text: 'OK', style: 'default' },
                            ...(shouldDisableBiometric ? [{
                                text: 'Disable Biometric',
                                onPress: async () => {
                                    await biometricService.disableBiometric();
                                    setBiometricEnabled(false);
                                    Alert.alert('Disabled', 'Biometric login has been disabled. Please login with email and password.');
                                }
                            }] : [])
                        ]);
                    } finally {
                        setIsLoading(false);
                    }
                }
            } catch (error: any) {
                // Handle biometric authentication errors with specific messages
                let errorMessage = 'Unable to authenticate with biometrics.';
                
                if (error.message.includes('not available')) {
                    errorMessage = 'Biometric authentication is not available on this device.';
                } else if (error.message.includes('not enrolled')) {
                    errorMessage = 'No biometrics enrolled. Please set up Face ID/Touch ID in device settings.';
                } else if (error.message.includes('cancelled')) {
                    errorMessage = 'Biometric authentication was cancelled.';
                } else if (error.message.includes('not found')) {
                    errorMessage = 'Biometric authentication not found on this device.';
                } else if (error.message) {
                    errorMessage = error.message;
                }

                Alert.alert('Biometric Login Failed', errorMessage, [
                    { text: 'OK', style: 'default' },
                    { text: 'Use Password', style: 'cancel' }
                ]);
            }
        } catch (error) {
            console.error('Biometric login error:', error);
            Alert.alert('Biometric Login Failed', 'An unexpected error occurred. Please use email and password.');
        }
    };

    return {
        // State
        email,
        setEmail,
        password,
        setPassword,
        rememberMe,
        setRememberMe,
        isPasswordVisible,
        setIsPasswordVisible,
        isLoading,
        showResetModal,
        setShowResetModal,
        resetEmail,
        setResetEmail,
        isSendingReset,
        biometricAvailable,
        biometricEnabled,
        biometricType,
        
        // Functions
        handleLogin,
        handleForgotPassword,
        handleSendResetEmail,
        handleGoogleSignIn,
        handleBiometricLogin,
        checkBiometricAvailability
    };
};
