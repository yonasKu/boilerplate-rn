import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { signUpWithEmail, useGoogleSignIn } from '@/lib/firebase/auth';
import { AppleAuthService } from '@/features/auth/services/appleAuthService';

export const useSignUp = () => {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isPasswordFocused, setIsPasswordFocused] = useState(false);
    const [passwordValidation, setPasswordValidation] = useState({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        specialChar: false,
    });
    const [appleSignInAvailable, setAppleSignInAvailable] = useState(false);
    const { promptAsync: promptGoogleSignIn } = useGoogleSignIn();

    useEffect(() => {
        checkAppleSignInAvailability();
    }, []);

    const checkAppleSignInAvailability = async () => {
        try {
            const available = await AppleAuthService.checkAppleSignInAvailability();
            setAppleSignInAvailable(available);
        } catch (error) {
            console.error('Error checking Apple Sign-In availability:', error);
            setAppleSignInAvailable(false);
        }
    };

    const validatePassword = (password: string) => {
        const newValidation = {
            length: password.length >= 8 && password.length <= 64,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            specialChar: /[^A-Za-z0-9]/.test(password),
        };
        setPasswordValidation(newValidation);
        return Object.values(newValidation).every(Boolean);
    };

    const handleSignUp = async () => {
        if (!name || !email || !password) {
            Alert.alert('Missing Information', 'Please fill in all required fields.');
            return;
        }

        if (!validatePassword(password)) {
            Alert.alert('Invalid Password', 'Please ensure your password meets all the requirements.');
            return;
        }

        setIsLoading(true);
        try {
            const [firstName, ...lastNameParts] = name.trim().split(/\s+/);
            const lastName = lastNameParts.join(' ');
            await signUpWithEmail(email, password, firstName, lastName);
            // Navigate to verification screen with email parameter
            router.replace({ pathname: '/(auth)/verify-email', params: { email } });
        } catch (error: any) {
            console.error('Full sign-up error:', JSON.stringify(error, null, 2));
            // Provide a more user-friendly error message
            let errorMessage = 'An unexpected error occurred. Please try again.';
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'This email address is already in use by another account.';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'The password is too weak. Please choose a stronger password.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'The email address is not valid. Please check and try again.';
            } else if (error.code === 'permission-denied') {
                errorMessage = 'Could not create user profile. Please ensure Firestore is enabled in your Firebase project.';
            }
            Alert.alert('Sign-Up Failed', errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            await promptGoogleSignIn();
            // The hook's useEffect will handle the rest
        } catch (error) {
            console.error('Google Sign-In Error:', error);
            Alert.alert('Sign-Up Error', 'An unexpected error occurred. Please try again.');
        }
    };

    const handlePasswordChange = (text: string) => {
        setPassword(text);
        validatePassword(text);
    };

    const getPasswordStrength = () => {
        const strength = Object.values(passwordValidation).filter(Boolean).length;
        let strengthText = 'Weak';
        let strengthColor = '#F2C94C';

        if (strength >= 5) {
            strengthText = 'Strong';
            strengthColor = '#5D9275';
        } else if (strength >= 3) {
            strengthText = 'Medium';
            strengthColor = '#F2994A';
        }

        return { strengthText, strengthColor, strength };
    };

    const handleAppleSignUp = async () => {
        setIsLoading(true);
        try {
            const result = await AppleAuthService.signInWithApple();
            if (result.success) {
                // Check onboarding status after Apple sign-up
                const { checkOnboardingStatus } = await import('../../../services/userService');
                const { getAuth } = await import('firebase/auth');
                const auth = getAuth();

                // Small delay to ensure auth state is updated
                setTimeout(async () => {
                    const status = await checkOnboardingStatus(auth.currentUser?.uid || '');
                    console.log('Post-Apple-signup onboarding status:', status);
                    console.log('User UID:', auth.currentUser?.uid);

                    // Debug: Check children separately
                    const { getUserChildren } = await import('../../../services/userService');
                    const children = await getUserChildren(auth.currentUser?.uid || '');
                    console.log('Children found:', children.length);
                    console.log('Children data:', children);

                    if (!status.hasProfile) {
                        console.log('Redirecting to add-profile after Apple signup...');
                        router.replace('/(auth)/add-profile');
                    } else if (!status.hasChild) {
                        console.log('Redirecting to add-child-details after Apple signup...');
                        router.replace('/(auth)/add-child-details');
                    } else {
                        console.log('Onboarding complete, redirecting to main app...');
                        router.replace('/(main)/(tabs)/journal');
                    }
                }, 1000);
            } else {
                Alert.alert('Sign Up Failed', result.error || 'Failed to sign up with Apple');
            }
        } catch (error: any) {
            Alert.alert('Sign Up Failed', error.message || 'Failed to sign up with Apple');
        } finally {
            setIsLoading(false);
        }
    };

    const passwordCriteria = [
        { key: 'length', text: 'Between 8 and 64 characters' },
        { key: 'uppercase', text: 'At least one uppercase letter' },
        { key: 'lowercase', text: 'At least one lowercase letter' },
        { key: 'number', text: 'At least one number' },
        { key: 'specialChar', text: 'At least one special character' },
    ];

    return {
        name,
        setName,
        email,
        setEmail,
        password,
        setPassword: handlePasswordChange,
        isPasswordVisible,
        setIsPasswordVisible,
        isLoading,
        isPasswordFocused,
        setIsPasswordFocused,
        passwordValidation,
        handleSignUp,
        handleGoogleSignIn,
        handleAppleSignUp,
        appleSignInAvailable,
        passwordStrength: getPasswordStrength(),
        passwordCriteria,
        isFormValid: name && email && password && Object.values(passwordValidation).every(Boolean),
        validatePassword
    };
};

// Helper component for password strength indicator (can be used separately)
export const PasswordStrengthIndicator = ({ validation }: { validation: { [key: string]: boolean } }) => {
    const criteria = [
        { key: 'length', text: 'Between 8 and 64 characters' },
        { key: 'uppercase', text: 'At least one uppercase letter' },
        { key: 'lowercase', text: 'At least one lowercase letter' },
        { key: 'number', text: 'At least one number' },
        { key: 'specialChar', text: 'At least one special character' },
    ];

    const strength = Object.values(validation).filter(Boolean).length;
    let strengthText = 'Weak';
    let strengthColor = '#F2C94C';

    if (strength >= 5) {
        strengthText = 'Strong';
        strengthColor = '#5D9275';
    } else if (strength >= 3) {
        strengthText = 'Medium';
        strengthColor = '#F2994A';
    }

    return {
        strengthText,
        strengthColor,
        strength,
        criteria: criteria.map(item => ({
            ...item,
            isValid: validation[item.key],
        }))
    };
};
