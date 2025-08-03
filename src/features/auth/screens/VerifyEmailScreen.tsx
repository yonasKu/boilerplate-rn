import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '@/lib/firebase/firebaseConfig';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function VerifyEmailScreen() {
    const router = useRouter();
    const { email } = useLocalSearchParams();
    const [isSending, setIsSending] = useState(false);
    const [isChecking, setIsChecking] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState<'checking' | 'verified' | 'not_verified' | null>(null);
    const [lastCheckMessage, setLastCheckMessage] = useState<string>('');

    const insets = useSafeAreaInsets();

    useEffect(() => {
        console.log('=== VERIFY EMAIL SCREEN MOUNTED ===');
        const user = auth.currentUser;

        if (user && !user.emailVerified) {
            // Send initial verification email
            sendEmailVerification(user).catch(error => {
                console.error('Failed to send initial verification:', error);
            });
        }

        return () => {
            console.log('=== VERIFY EMAIL SCREEN UNMOUNTED ===');
        };
    }, []);

    const handleContinue = async () => {
        console.log('🚨 BUTTON CLICKED - CHECKING VERIFICATION');
        setIsChecking(true);

        try {
            const user = auth.currentUser;
            if (!user) {
                Alert.alert('Error', 'No user found. Please try again.');
                return;
            }

            await user.reload();

            if (user.emailVerified) {
                console.log('✅ EMAIL VERIFIED! Going to pricing...');
                router.replace('/(auth)/pricing');
            } else {
                Alert.alert('Not Verified', 'Please check your email and verify before continuing.');
            }
        } catch (error) {
            console.error('Error checking verification:', error);
            Alert.alert('Error', 'Failed to check verification status.');
        } finally {
            setIsChecking(false);
        }
    };

    const handleResendEmail = async () => {
        setIsSending(true);
        console.log('=== HANDLE RESEND EMAIL CLICKED ===');
        try {
            const user = auth.currentUser;
            console.log('Resending email to:', user?.email);
            if (user) {
                await sendEmailVerification(user);
                console.log('Email resent successfully');
                Alert.alert('Email Sent', 'Verification email has been resent to your inbox.');
            } else {
                console.error('No user found for resend');
            }
        } catch (error) {
            console.error('Failed to resend verification email:', error);
            Alert.alert('Error', 'Failed to resend verification email.');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Text style={[styles.icon, { color: '#4CAF50' }]}>✉️</Text>
                </View>

                <Text style={styles.title}>Verify Your Email</Text>

                <Text style={styles.description}>
                    We've sent a verification email to:
                </Text>

                <Text style={styles.email}>{email}</Text>

                <Text style={styles.instructions}>
                    Please check your inbox and click the verification link to continue.
                </Text>

                {verificationStatus && (
                    <View style={[styles.statusContainer, 
                        verificationStatus === 'verified' ? styles.statusSuccess : 
                        verificationStatus === 'not_verified' ? styles.statusError : 
                        styles.statusChecking
                    ]}>
                        <Text style={[styles.statusText, 
                            verificationStatus === 'verified' ? styles.statusTextSuccess : 
                            verificationStatus === 'not_verified' ? styles.statusTextError : 
                            styles.statusTextChecking
                        ]}>
                            {verificationStatus === 'verified' ? '✅ Email Verified!' :
                             verificationStatus === 'not_verified' ? '❌ Email Not Verified' :
                             verificationStatus === 'checking' ? '⏳ Checking...' :
                             lastCheckMessage}
                        </Text>
                    </View>
                )}

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[styles.button, styles.primaryButton]}
                        onPress={handleContinue}
                        disabled={isChecking}
                    >
                        {isChecking ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.primaryButtonText}>Check Status & Continue</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.secondaryButton]}
                        onPress={handleResendEmail}
                        disabled={isSending}
                    >
                        {isSending ? (
                            <ActivityIndicator color="#4CAF50" />
                        ) : (
                            <Text style={styles.secondaryButtonText}>Resend Email</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
                    <Text style={styles.cancelText}>Back to Login</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333333',
        marginBottom: 16,
    },
    description: {
        fontSize: 16,
        color: '#666666',
        textAlign: 'center',
        marginBottom: 8,
    },
    email: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4CAF50',
        marginBottom: 32,
    },
    iconContainer: {
        marginBottom: 32,
    },
    icon: {
        fontSize: 64,
    },
    instructions: {
        fontSize: 16,
        color: '#666666',
        textAlign: 'center',
        marginBottom: 32,
        paddingHorizontal: 20,
    },
    buttonContainer: {
        width: '100%',
        maxWidth: 300,
    },
    button: {
        width: '100%',
        paddingVertical: 16,
        borderRadius: 12,
        marginBottom: 12,
        alignItems: 'center',
    },
    primaryButton: {
        backgroundColor: '#4CAF50',
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    secondaryButton: {
        borderColor: '#4CAF50',
        borderWidth: 2,
    },
    secondaryButtonText: {
        color: '#4CAF50',
        fontSize: 16,
        fontWeight: 'bold',
    },
    cancelText: {
        color: '#666666',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 16,
    },
    statusContainer: {
        padding: 16,
        borderRadius: 8,
        marginVertical: 16,
        width: '100%',
        maxWidth: 300,
        alignItems: 'center',
    },
    statusSuccess: {
        backgroundColor: '#E8F5E8',
        borderColor: '#4CAF50',
        borderWidth: 1,
    },
    statusError: {
        backgroundColor: '#FFE8E8',
        borderColor: '#F44336',
        borderWidth: 1,
    },
    statusChecking: {
        backgroundColor: '#E8F4FD',
        borderColor: '#2196F3',
        borderWidth: 1,
    },
    statusText: {
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    statusTextSuccess: {
        color: '#2E7D32',
    },
    statusTextError: {
        color: '#C62828',
    },
    statusTextChecking: {
        color: '#1565C0',
    },
});
