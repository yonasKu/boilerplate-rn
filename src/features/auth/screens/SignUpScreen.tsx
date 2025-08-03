import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, TextInput, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { Image } from 'react-native';
import { useRouter } from 'expo-router';
import { signUpWithEmail, useGoogleSignIn } from '@/lib/firebase/auth';

const SignUpScreen = () => {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { promptAsync: promptGoogleSignIn } = useGoogleSignIn();

    const handleSignUp = async () => {
        if (!name || !email || !password) {
            Alert.alert('Missing Information', 'Please fill in all required fields.');
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

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <Text style={styles.title}>Create your account</Text>

                <View style={styles.socialContainer}>
                    <TouchableOpacity style={styles.socialButton} onPress={handleGoogleSignIn}>
                        <Image source={require('../../../assets/images/Google.png')} style={styles.socialIcon} />
                        <Text style={styles.socialButtonText}>Google</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.socialButton}>
                        <Image source={require('../../../assets/images/Apple.png')} style={styles.socialIcona} />
                        <Text style={styles.socialButtonText}>Apple</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.dividerContainer}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.orText}>Or</Text>
                    <View style={styles.dividerLine} />
                </View>

                <Text style={styles.label}>Name<Text style={styles.asterisk}>*</Text></Text>
                <View style={styles.inputContainer}>
                    <Image source={require('../../../assets/images/user.png')} style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Name"
                        value={name}
                        onChangeText={setName}
                    />
                </View>

                <Text style={styles.label}>Email<Text style={styles.asterisk}>*</Text></Text>
                <View style={styles.inputContainer}>
                    <Image source={require('../../../assets/images/sms.png')} style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="email"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>

                <Text style={styles.label}>Password<Text style={styles.asterisk}>*</Text></Text>
                <View style={styles.inputContainer}>
                    <Image source={require('../../../assets/images/password-check.png')} style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!isPasswordVisible}
                    />
                    <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                        <Image source={require('../../../assets/images/eye.png')} style={{ width: 24, height: 24, tintColor: '#A9A9A9' }} />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.button} onPress={handleSignUp} disabled={isLoading}>
                    {isLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Continue</Text>}
                </TouchableOpacity>

                <View style={styles.footerTextContainer}>
                    <Text style={styles.termsText}>By clicking continue you agree to our</Text>
                    <Text style={styles.termsText}>
                        <Text style={styles.linkText}>Terms of Use</Text> and <Text style={styles.linkText}>Privacy Policy</Text>
                    </Text>
                </View>

                <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
                    <Text style={styles.signInText}>
                        Already have an account? <Text style={styles.linkText}>Sign In</Text>
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollContainer: {
        flexGrow: 1,
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#2F4858',
        textAlign: 'center',
        marginVertical: 50,
        fontFamily: 'serif',
    },
    socialContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    socialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 16,
        paddingVertical: 18,
        width: '48%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    socialIcon: {
        width: 24,
        height: 24,
        marginRight: 10,
    },
    socialIcona: {
        width: 20,
        height: 24, // Adjusted height to match Google icon's container
        marginRight: 10,
        resizeMode: 'contain',
    },
    socialButtonText: {
        fontSize: 16,
        color: '#2F4858',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E0E0E0',
    },
    orText: {
        marginHorizontal: 15,
        color: '#A9A9A9',
        fontSize: 14,
    },
    label: {
        color: '#2F4858',
        marginBottom: 5,
        fontSize: 16,
        fontWeight: '500',
    },
    asterisk: {
        color: '#E58C8A',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 16,
        paddingHorizontal: 15,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    inputIcon: {
        width: 20,
        height: 20,
        marginRight: 10,
        tintColor: '#A9A9A9',
    },
    input: {
        flex: 1,
        height: 50,
        fontSize: 16,
    },
    button: {
        backgroundColor: '#5D9275',
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 4,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    footerTextContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    termsText: {
        color: '#A9A9A9',
        fontSize: 12,
        lineHeight: 18,
    },
    signInText: {
        textAlign: 'center',
        color: '#A9A9A9',
        fontSize: 14,
    },
    linkText: {
        color: '#5D9275',
    },
});

export default SignUpScreen;
