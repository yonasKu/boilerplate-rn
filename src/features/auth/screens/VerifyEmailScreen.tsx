import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    StatusBar,
    Image,
    ViewStyle,
    TextStyle,
    ImageStyle,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { sendEmailVerification } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../theme/colors';
import { useAccount } from '@/context/AccountContext';
import ErrorBanner from '../../../components/ui/ErrorBanner';

export default function VerifyEmailScreen() {
    const router = useRouter();
    const { email } = useLocalSearchParams();
    const { accountType } = useAccount();
    const [isSending, setIsSending] = useState(false);
    const [isChecking, setIsChecking] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState<string | null>(null);

    useEffect(() => {
        const user = auth.currentUser;
        if (user && !user.emailVerified) {
            sendEmailVerification(user).catch(error => {
                console.error('Failed to send initial verification:', error);
            });
        }
    }, []);

    const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

    const handleContinue = async () => {
        setIsChecking(true);
        setVerificationStatus(null);
        try {
            const user = auth.currentUser;
            if (!user) {
                Alert.alert('Error', 'No user found. Please try again.');
                return;
            }

            await user.reload();

            if (user.emailVerified) {
                // Poll Firestore briefly for accountType propagation after accept-invite flows
                // Try up to 6 times over ~3 seconds
                const userRef = doc(db, 'users', user.uid);
                for (let i = 0; i < 6; i++) {
                    try {
                        const snap = await getDoc(userRef);
                        const data: any = snap.data() || {};
                        if (data.accountType === 'view-only') {
                            router.replace('/(main)/(tabs)/journal');
                            return;
                        }
                    } catch {}
                    await sleep(500);
                }
                // Fallback: pricing for non-viewers
                router.replace('/(auth)/pricing');
            } else {
                setVerificationStatus('Please check your email and verify before continuing.');
            }
        } catch (error) {
            console.error('Error checking verification:', error);
            setVerificationStatus('Failed to check verification status.');
        } finally {
            setIsChecking(false);
        }
    };

    const handleResendEmail = async () => {
        setIsSending(true);
        setVerificationStatus(null);
        try {
            const user = auth.currentUser;
            if (user) {
                await sendEmailVerification(user);
                Alert.alert('Email Sent', `A new verification email has been sent to ${user.email}.`);
            } else {
                setVerificationStatus('No user found. Please try logging in again.');
            }
        } catch (error) {
            console.error('Failed to resend verification email:', error);
            setVerificationStatus('Failed to resend verification email.');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
            <View style={styles.content}>
                <View style={styles.logoContainer}>
                    <Image
                        source={require('../../../assets/images/Logo_Icon.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>
                <View style={styles.headerContainer}>
                    <Text style={styles.title}>Verify your Email</Text>
                    <Text style={styles.description}>
                        Check your email & click the link to activate your account
                    </Text>
                    {email && (
                        <Text style={styles.emailText}>
                            {typeof email === 'string' ? email : email[0]}
                        </Text>
                    )}
                    <ErrorBanner message={verificationStatus} onClose={() => setVerificationStatus(null)} />
                </View>
                <View style={styles.footerContainer}>
                    <Text style={styles.helperText}>
                        Can't find it? Check your spam/junk folder or promotions tab
                    </Text>
                    <TouchableOpacity
                        style={[styles.button, styles.primaryButton]}
                        onPress={handleContinue}
                        disabled={isChecking}
                    >
                        {isChecking ? (
                            <ActivityIndicator color={Colors.white} />
                        ) : (
                            <Text style={styles.primaryButtonText}>Continue</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={handleResendEmail}
                        disabled={isSending}
                    >
                        {isSending ? (
                            <ActivityIndicator color={Colors.primary} />
                        ) : (
                            <Text style={styles.secondaryButtonText}>Resend email</Text>
                        )}
                    </TouchableOpacity>

                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 50,
        paddingVertical: 48,
        paddingHorizontal: 24,
    },
    logoContainer: {
        marginBottom: 24,
        alignItems: 'center',
    },
    logo: {
        width: 100,
        height: 100,
    },
    headerContainer: {
        alignItems: 'center',
        width: '100%',
        marginBottom: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.black,
        marginBottom: 12,
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        color: Colors.mediumGrey,
        textAlign: 'center',
        paddingHorizontal: 20,
        lineHeight: 22,
    },
    footerContainer: {
        width: '100%',
        alignItems: 'center',
    },
    button: {
        width: '100%',
        paddingVertical: 16,
        borderRadius: 50,
        alignItems: 'center',
    },
    primaryButton: {
        backgroundColor: Colors.primary,
        marginBottom: 16,
    },
    primaryButtonText: {
        color: Colors.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
    secondaryButton: {
        backgroundColor: Colors.white,
    },
    secondaryButtonText: {
        color: Colors.primary,
        fontSize: 16,
        textDecorationLine: 'underline',
    },
    verificationStatus: {
        color: Colors.error,
        marginBottom: 16,
        textAlign: 'center',
    },
    emailText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.primary,
        marginVertical: 16,
        textAlign: 'center',
    },
    helperText: {
        fontSize: 14,
        color: Colors.mediumGrey,
        textAlign: 'center',
        marginVertical: 12,
        fontStyle: 'italic',
    },
});
