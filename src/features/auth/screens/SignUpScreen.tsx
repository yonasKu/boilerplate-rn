import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, TextInput, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useSignUp } from '../hooks/useSignUp';
import { FontAwesome } from '@expo/vector-icons';

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
                        onFocus={() => setIsPasswordFocused(true)}
                        onBlur={() => setIsPasswordFocused(false)}
                    />
                    <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                        <Image source={require('../../../assets/images/eye.png')} style={{ width: 24, height: 24, tintColor: '#A9A9A9' }} />
                    </TouchableOpacity>
                </View>

                {isPasswordFocused && password.length > 0 && (
                    <PasswordStrengthIndicator validation={passwordValidation} />
                )}

                <TouchableOpacity style={styles.button} onPress={handleSignUp} disabled={isLoading} >
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
    validationContainer: {
        marginBottom: 20,
        padding: 15,
        backgroundColor: '#F8F9FA',
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
