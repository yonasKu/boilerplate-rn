import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { signInWithEmail, useGoogleSignIn, resetPassword } from '@/lib/firebase/auth';
import { biometricService } from '@/services/biometricService';
import { AppleAuthService } from '@/features/auth/services/appleAuthService';
import { NotificationService } from '@/services/notifications/NotificationService';
import { FamilyService } from '@/services/familyService';

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
    const [appleSignInAvailable, setAppleSignInAvailable] = useState(false);
    const { promptAsync: promptGoogleSignIn } = useGoogleSignIn();

    const registerForPushNotifications = async (userId: string) => {
        try {
            const hasPermission = await NotificationService.requestPermissions();
            if (hasPermission) {
                const token = await NotificationService.getPushToken();
                if (token) {
                    await NotificationService.registerDeviceToken(userId, token);
                }
            }
        } catch (error) {
            console.error('Error registering for push notifications:', error);
        }
    };

    useEffect(() => {
        checkBiometricAvailability();
        checkAppleSignInAvailability();
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

    const checkAppleSignInAvailability = async () => {
        try {
            const available = await AppleAuthService.checkAppleSignInAvailability();
            setAppleSignInAvailable(available);
        } catch (error) {
            console.error('Error checking Apple Sign-In availability:', error);
            setAppleSignInAvailable(false);
        }
    };

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Login Failed', 'Please enter both email and password.');
            return;
        }

        setIsLoading(true);
        try {
            const userCredential = await signInWithEmail(email, password);
            if (userCredential.user) {
                await registerForPushNotifications(userCredential.user.uid);
            }
            
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
            
            // View-only accounts: skip onboarding screens, go straight to main app
            try {
                const { accountType } = await FamilyService.getAccountStatus();
                if (accountType === 'view-only') {
                    router.replace('/(main)/(tabs)/journal');
                    return;
                }
            } catch (e) {
                console.warn('Account status check failed, proceeding with onboarding check', e);
            }

            const { checkOnboardingStatus } = await import('../../../services/userService');
            const { getAuth } = await import('firebase/auth');
            const auth = getAuth();

            const status = await checkOnboardingStatus(auth.currentUser?.uid || '');

            if (!status.hasProfile) {
                router.replace('/(auth)/add-profile');
            } else if (!status.hasChild) {
                router.replace('/(auth)/add-profile');
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

    const handleAppleSignIn = async () => {
        setIsLoading(true);
        try {
            const result = await AppleAuthService.signInWithApple();
            if (result.success && result.user) {
                await registerForPushNotifications(result.user.uid);
            }
            if (result.success) {
                // Small delay to ensure auth state is updated
                const { checkOnboardingStatus } = await import('../../../services/userService');
                const { getAuth } = await import('firebase/auth');
                const auth = getAuth();
                setTimeout(async () => {
                    // View-only accounts: skip onboarding screens, go straight to main app
                    try {
                        const { accountType } = await FamilyService.getAccountStatus();
                        if (accountType === 'view-only') {
                            router.replace('/(main)/(tabs)/journal');
                            return;
                        }
                    } catch (e) {
                        console.warn('Account status check failed after Apple login', e);
                    }

                    const status = await checkOnboardingStatus(auth.currentUser?.uid || '');
                    console.log('Post-Apple-login onboarding status:', status);
                    console.log('User UID:', auth.currentUser?.uid);

                    // Debug: Check children separately (commented out as not needed now)
                    // const { getUserChildren } = await import('../../../services/userService');
                    // const children = await getUserChildren(auth.currentUser?.uid || '');
                    // console.log('Children found:', children.length);
                    // console.log('Children data:', children);

                    if (!status.hasProfile) {
                        console.log('Redirecting to add-profile after Apple login...');
                        router.replace('/(auth)/add-profile');
                    } else if (!status.hasChild) {
                        console.log('Redirecting to add-child-details after Apple login...');
                        router.replace('/(auth)/add-child-details');
                    } else {
                        console.log('Onboarding complete, redirecting to main app...');
                        router.replace('/(main)/(tabs)/journal');
                    }
                }, 1000);
            } else {
                Alert.alert('Login Failed', result.error || 'Failed to sign in with Apple');
            }
        } catch (error: any) {
            Alert.alert('Login Failed', error.message || 'Failed to sign in with Apple');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        try {
            const result: any = await promptGoogleSignIn();

            // If user cancelled or an error occurred, do not navigate
            if (!result || result.type !== 'success') {
                if (result?.type === 'dismiss' || result?.type === 'cancel') {
                    console.log('Google sign-in dismissed/cancelled by user');
                } else if (result?.type === 'error') {
                    console.warn('Google sign-in error from provider:', result?.error || result);
                    Alert.alert('Google Sign-In Failed', 'Unable to complete sign-in. Please try again.');
                }
                return;
            }

            // Wait for Firebase auth state to reflect the Google credential sign-in
            const waitForAuthUser = async (timeoutMs = 10000): Promise<any | null> => {
                const { getAuth, onAuthStateChanged } = await import('firebase/auth');
                const auth = getAuth();
                if (auth.currentUser) return auth.currentUser;
                return await new Promise((resolve) => {
                    let settled = false;
                    let unsubscribeFn: (() => void) | undefined;
                    const timer = setTimeout(() => {
                        if (!settled) {
                            settled = true;
                            if (unsubscribeFn) unsubscribeFn();
                            resolve(null);
                        }
                    }, timeoutMs);
                    unsubscribeFn = onAuthStateChanged(auth, (user) => {
                        if (!settled && user) {
                            settled = true;
                            clearTimeout(timer);
                            if (unsubscribeFn) unsubscribeFn();
                            resolve(user);
                        }
                    });
                });
            };

            const authUser = await waitForAuthUser();
            if (!authUser) {
                console.warn('Google sign-in did not complete within timeout: no authenticated user');
                Alert.alert('Google Sign-In Incomplete', 'We could not verify your sign-in. Please try again.');
                return;
            }

            await registerForPushNotifications(authUser.uid);

            // View-only accounts: skip onboarding screens, go straight to main app
            try {
                const { accountType } = await FamilyService.getAccountStatus();
                if (accountType === 'view-only') {
                    router.replace('/(main)/(tabs)/journal');
                    return;
                }
            } catch (e) {
                console.warn('Account status check failed after Google login', e);
            }

            const { checkOnboardingStatus } = await import('../../../services/userService');
            const status = await checkOnboardingStatus(authUser.uid);
            console.log('Post-Google-login onboarding status:', status);
            console.log('User UID:', authUser.uid);

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
        } catch (error) {
            console.error('Google Sign-In Error:', error);
            Alert.alert('Sign-In Error', 'An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleBiometricSwitch = async (value: boolean) => {
        if (value) {
            // The user wants to enable biometrics
            if (!email || !password) {
                Alert.alert(
                    'Enable Biometrics',
                    'Please enter your email and password first to enable biometric login.',
                    [{ text: 'OK' }]
                );
                return;
            }
            try {
                await biometricService.enableBiometric(email, password);
                setBiometricEnabled(true);
                Alert.alert('Success', 'Biometric login has been enabled.');
            } catch (error: any) {
                Alert.alert('Error', `Failed to enable biometric login: ${error.message}`);
            }
        } else {
            // The user wants to disable biometrics
            try {
                await biometricService.disableBiometric();
                setBiometricEnabled(false);
                Alert.alert('Success', 'Biometric login has been disabled.');
            } catch (error: any) {
                Alert.alert('Error', `Failed to disable biometric login: ${error.message}`);
            }
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
                        
                        // View-only accounts: skip onboarding screens, go straight to main app
                        try {
                            const { accountType } = await FamilyService.getAccountStatus();
                            if (accountType === 'view-only') {
                                router.replace('/(main)/(tabs)/journal');
                                return;
                            }
                        } catch (e) {
                            console.warn('Account status check failed after biometric login', e);
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
        handleAppleSignIn,
        handleBiometricLogin,
        checkBiometricAvailability,
        toggleBiometricSwitch,
        appleSignInAvailable
    };
};
