import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, TextInput, StatusBar, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useSignUp } from '../hooks/useSignUp';
import { FontAwesome } from '@expo/vector-icons';
import { Button } from '../../../components/Button';
import { Colors } from '../../../theme/colors';

const SignUpScreen = () => {
    const router = useRouter();
    const {
        name,
        setName,
        email,
        setEmail,
        password,
        setPassword,
        isPasswordVisible,
        setIsPasswordVisible,
        isLoading,
        isPasswordFocused,
        setIsPasswordFocused,
        passwordValidation,
        handleSignUp,
        handleGoogleSignIn
    } = useSignUp();

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
            <KeyboardAvoidingView
                style={styles.keyboardAvoidingView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    <Text style={styles.title}>Create your account</Text>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Name *"
                            value={name}
                            onChangeText={setName}
                            placeholderTextColor={Colors.black}
                            accessibilityLabel="Name input"
                            autoCapitalize="words"
                        />
                    </View>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Email address *"
                            placeholderTextColor={Colors.black}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            accessibilityLabel="Email address input"
                        />
                    </View>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Password *"
                            placeholderTextColor={Colors.black}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!isPasswordVisible}
                            onFocus={() => setIsPasswordFocused(true)}
                            onBlur={() => setIsPasswordFocused(false)}
                            accessibilityLabel="Password input"
                            textContentType="password"
                        />
                        <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                            <Image source={require('../../../assets/images/eye.png')} style={{ width: 24, height: 24, tintColor: '#A9A9A9' }} />
                        </TouchableOpacity>
                    </View>

                    {isPasswordFocused && password.length > 0 && (
                        <PasswordStrengthIndicator validation={passwordValidation} />
                    )}

                    <Button
                        title="Continue"
                        onPress={handleSignUp}
                        loading={isLoading}
                        disabled={isLoading}
                        variant="primary"
                        size="large"
                        style={{ paddingVertical: 16, marginVertical: 20 }}
                    />

                    <View style={styles.dividerContainer}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.orText}>Or</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    <View style={styles.socialContainer}>
                        <TouchableOpacity style={styles.socialButton} onPress={handleGoogleSignIn}>
                            <Image source={require('../../../assets/images/google_logo.png')} style={styles.socialIcon} />
                            <Text style={styles.socialButtonText}>Continue with Google</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.socialButton}>
                            <Image source={require('../../../assets/images/apple_logo.png')} style={styles.socialIcona} />
                            <Text style={styles.socialButtonText}>Continue with Apple</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
                        <Text style={styles.signInText}>
                            Already have an account? <Text style={styles.linkText}>Sign In</Text>
                        </Text>
                    </TouchableOpacity>
                    <View style={styles.footerTextContainer}>
                        <Text style={styles.termsText}>By clicking continue you agree to our</Text>
                        <Text style={styles.termsText}>
                            <Text style={styles.linkText}>Terms of Use</Text> and <Text style={styles.linkText}>Privacy Policy</Text>
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

        </SafeAreaView>
    );
};

const PasswordStrengthIndicator = ({ validation }: { validation: { [key: string]: boolean } }) => {
    const criteria = [
        { key: 'length', text: 'Between 8 and 64 characters' },
        { key: 'uppercase', text: 'At least one uppercase letter' },
        { key: 'lowercase', text: 'At least one lowercase letter' },
        { key: 'number', text: 'At least one number' },
        { key: 'specialChar', text: 'At least one special character' },
    ];

    const strength = Object.values(validation).filter(Boolean).length;
    let strengthText = 'Weak';
    let strengthColor = '#F2C94C'; // Yellow for weak, as per the image

    if (strength >= 5) {
        strengthText = 'Strong';
        strengthColor = '#5D9275'; // Green for strong
    } else if (strength >= 3) {
        strengthText = 'Medium';
        strengthColor = '#F2994A'; // Orange for medium
    }

    return (
        <View style={styles.validationContainer}>
            <View style={styles.strengthIndicatorContainer}>
                <Text style={[styles.strengthText, { color: strengthColor }]}>{strengthText}</Text>
                <View style={styles.strengthBar}>
                    {Array.from({ length: 5 }).map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.strengthBarSegment,
                                { backgroundColor: index < strength ? strengthColor : '#E0E0E0' },
                            ]}
                        />
                    ))}
                </View>
            </View>
            {criteria.map((item) => (
                <View key={item.key} style={styles.criterionRow}>
                    <FontAwesome name={validation[item.key] ? 'check' : 'circle-o'} size={16} color={validation[item.key] ? '#5D9275' : '#A9A9A9'} />
                    <Text style={[styles.criterionText, { color: validation[item.key] ? '#2F4858' : '#A9A9A9' }]}>
                        {item.text}
                    </Text>
                </View>
            ))}
        </View>
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
    keyboardAvoidingView: {
        flex: 1,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.black,
        textAlign: 'center',
        marginTop: 10,
        marginBottom: 30,
        fontFamily: 'Poppins',
    },
    socialContainer: {
        flexDirection: 'column',
        gap: 16,
        marginBottom: 20,
    },
    socialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.white,
        borderWidth: 1.15,
        borderColor: Colors.lightGrey,
        borderRadius: 50,
        paddingVertical: 14,
        width: '100%',
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
        color: Colors.black,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: Colors.lightGrey,
    },
    orText: {
        marginHorizontal: 15,
        color: Colors.mediumGrey,
        fontSize: 14,
    },
    asterisk: {
        color: Colors.secondary,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.lightGrey,
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 2,
        marginBottom: 16,
    },
    inputIcon: {
        width: 20,
        height: 20,
        marginRight: 10,
        tintColor: Colors.mediumGrey,
    },
    input: {
        flex: 1,
        height: 50,
        fontSize: 16,
    },

    footerTextContainer: {
        marginVertical: 50,
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    termsText: {
        color: Colors.mediumGrey,
        fontSize: 12,
        lineHeight: 18,
    },
    signInText: {
        textAlign: 'center',
        color: Colors.mediumGrey,
        fontSize: 14,
    },
    linkText: {
        color: Colors.primary,
    },
    validationContainer: {
        marginBottom: 20,
        padding: 15,
        backgroundColor: Colors.white,
        borderRadius: 12,
    },
    strengthIndicatorContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    strengthText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    strengthBar: {
        flexDirection: 'row',
    },
    strengthBarSegment: {
        width: 25,
        height: 5,
        borderRadius: 2.5,
        marginLeft: 4,
    },
    criterionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 4,
    },
    criterionText: {
        marginLeft: 10,
        fontSize: 14,
    },
});

export default SignUpScreen;
