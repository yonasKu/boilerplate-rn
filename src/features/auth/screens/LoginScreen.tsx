import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, TextInput, StatusBar, Image, ActivityIndicator, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { useLogin } from '../hooks/useLogin';
import { router, useNavigation } from 'expo-router';
import { Colors } from '../../../theme/colors';
import { Button } from '../../../components/Button';
import ErrorBanner from '../../../components/ui/ErrorBanner';


export default function LoginScreen() {
    const {
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
        appleSignInAvailable,

        // Functions
        handleLogin,
        handleForgotPassword,
        handleSendResetEmail,
        handleGoogleSignIn,
        handleAppleSignIn,
        handleBiometricLogin,
        checkBiometricAvailability,
        toggleBiometricSwitch,
        uiError,
        setUiError
    } = useLogin();

    const navigation = useNavigation();

    useEffect(() => {
        navigation.setOptions({
            onRightPress: handleBiometricLogin,
        });
    }, [navigation, handleBiometricLogin]);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
            <KeyboardAvoidingView
                style={styles.keyboardAvoidingView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView contentContainerStyle={styles.scrollContainer}>


                    <View style={styles.logoContainer}>
                        <Image source={require('../../../assets/images/Logo_Icon_small.png')} style={styles.logo} />
                    </View>

                    {/* Inline, user-friendly auth errors */}
                    <ErrorBanner message={uiError} onClose={() => setUiError(null)} />

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Email address *"
                            placeholderTextColor={Colors.mediumGrey}
                            value={email}
                            onChangeText={(t) => { setUiError(null); setEmail(t); }}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            accessibilityLabel="Email address input"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Password *"
                            placeholderTextColor={Colors.mediumGrey}
                            value={password}
                            onChangeText={(t) => { setUiError(null); setPassword(t); }}
                            secureTextEntry={!isPasswordVisible}
                            accessibilityLabel="Password input"
                        />
                        <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                            <Image source={require('../../../assets/images/eye.png')} style={{ width: 24, height: 24, tintColor: Colors.mediumGrey }} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.faceIdToggleContainer}>
                        <Text style={styles.faceIdToggleLabel}>Enable Face ID</Text>
                        <Switch
                            trackColor={{ false: Colors.lightGrey, true: Colors.primary }}
                            thumbColor={Colors.white}
                            ios_backgroundColor={Colors.lightGrey}
                            onValueChange={toggleBiometricSwitch}
                            value={biometricEnabled}
                        />
                    </View>

                    {biometricAvailable && (
                        <View style={styles.faceIdToggleContainer}>
                            <Text style={styles.faceIdToggleLabel}>Enable {biometricType}</Text>
                            <Switch
                                trackColor={{ false: Colors.lightGrey, true: Colors.primary }}
                                thumbColor={Colors.white}
                                ios_backgroundColor={Colors.lightGrey}
                                onValueChange={toggleBiometricSwitch}
                                value={biometricEnabled}
                            />
                        </View>
                    )}

                    <Button
                        title="Log In"
                        onPress={() => handleLogin()}
                        loading={isLoading}
                        disabled={isLoading}
                        variant="primary"
                        size="large"
                        style={{ paddingVertical: 18, width: '100%', marginVertical: 20 }}
                    />

                    <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPasswordContainer}>
                        <Text style={styles.forgotPassword}>Forgot Password?</Text>
                    </TouchableOpacity>

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
                        {/* {appleSignInAvailable && ( */}
                        <TouchableOpacity style={styles.socialButton} onPress={handleAppleSignIn}>
                            <Image source={require('../../../assets/images/apple_logo.png')} style={styles.socialIcon} />
                            <Text style={styles.socialButtonText}>Continue with Apple</Text>
                        </TouchableOpacity>
                        {/* )} */}
                    </View>

                    <TouchableOpacity onPress={() => router.push('/signup')}>
                        <Text style={styles.signInText}>
                            Don't have an account? <Text style={styles.linkText}>Sign Up</Text>
                        </Text>
                    </TouchableOpacity>

                                        <TouchableOpacity onPress={() => router.push('/enter-invite' as any)}>
                        <Text style={styles.signInText}>
                            Have an invite code? <Text style={styles.linkText}>Enter Code</Text>
                        </Text>
                    </TouchableOpacity>
                </ScrollView>

                {/* Password Reset Modal */}
                {showResetModal && (
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContainer}>
                            <Text style={styles.modalTitle}>Reset Password</Text>
                            <Text style={styles.modalDescription}>
                                Enter your email address and we'll send you a link to reset your password.
                            </Text>

                            <TextInput
                                style={styles.modalInput}
                                placeholder="Enter your email"
                                value={resetEmail}
                                onChangeText={setResetEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />

                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.cancelButton]}
                                    onPress={() => setShowResetModal(false)}
                                >
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.modalButton, styles.sendButton]}
                                    onPress={handleSendResetEmail}
                                    disabled={isSendingReset}
                                >
                                    {isSendingReset ? (
                                        <ActivityIndicator color="#FFFFFF" />
                                    ) : (
                                        <Text style={styles.sendButtonText}>Send Reset Email</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}

            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    scrollContainer: {
        flexGrow: 1,
        padding: 20,
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    backButton: {
        padding: 10,
        marginLeft: -10,
    },
    forgotPasswordContainer: {
        alignItems: 'center',
    },
    backIcon: {
        width: 24,
        height: 24,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2F4858',
        textAlign: 'center',
        flex: 1,
        marginRight: 24, // to balance the back button
    },
    logoContainer: {
        alignItems: 'center',
        marginTop: 30,
        marginBottom: 40,
    },
    logo: {
        width: 150,
        height: 40,
        resizeMode: 'contain',
    },
    label: {
        color: '#2F4858',
        marginBottom: 5,
        fontSize: 16,
        fontWeight: '500',
    },
    asterisk: {
        color: '#E58C8A',
        fontFamily: 'Poppins_400Regular',
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
        fontSize: 16,
        color: Colors.blacktext,
        height: 50,
        fontFamily: 'Poppins_400Regular',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 10,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkbox: {
        width: 18,
        height: 18,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: Colors.primary,
        marginRight: 10,
    },
    checkedCheckbox: {
        backgroundColor: Colors.primary,
    },
    checkboxLabel: {
        color: Colors.primary,
        fontWeight: '500',
        fontFamily: 'Poppins_400Regular',
    },
    forgotPassword: {
        color: Colors.grey,
        textAlign: 'right',
        fontSize: 16,
        fontFamily: 'Poppins_400Regular',
    },
    loginRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
        marginVertical: 20,
    },
    faceIdButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    disabledFaceIdButton: {
        backgroundColor: Colors.lightGrey,
    },
    faceIdIcon: {
        width: 24,
        height: 24,
        tintColor: Colors.white,
    },
    disabledFaceIdIcon: {
        tintColor: Colors.mediumGrey,
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
        fontFamily: 'Poppins_400Regular',
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
        borderWidth: 1,
        borderColor: Colors.lightGrey,
        borderRadius: 50,
        paddingVertical: 14,
        width: '100%',
    },
    socialIcon: {
        width: 24,
        height: 24,
        marginRight: 10,
        resizeMode: 'contain',
    },
    socialButtonText: {
        fontSize: 16,
        color: Colors.blacktext,
        fontFamily: 'Poppins_400Regular',
    },
    footerTextContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    termsText: {
        color: Colors.mediumGrey,
        fontSize: 12,
        lineHeight: 18,
        fontFamily: 'Poppins_400Regular',
    },
    signInText: {
        marginTop: 10,
        textAlign: 'center',
        color: Colors.grey,
        fontSize: 14,
        fontFamily: 'Poppins_400Regular',
    },
    linkText: {
        color: Colors.grey,
        fontFamily: 'Poppins_400Regular',
    },
    faceIdToggleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 20,
        paddingHorizontal: 10,
    },
    faceIdToggleLabel: {
        fontSize: 16,
        color: Colors.darkGrey,
        fontFamily: 'Poppins_400Regular',
    },
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: Colors.black + '80',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    modalContainer: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 24,
        margin: 20,
        width: '90%',
        maxWidth: 400,
        shadowColor: Colors.black,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 24,
        fontFamily: 'Poppins_600SemiBold',
        color: Colors.darkGrey,
        marginBottom: 8,
        textAlign: 'center',
    },
    modalDescription: {
        fontSize: 16,
        fontFamily: 'Poppins_400Regular',
        color: Colors.mediumGrey,
        marginBottom: 24,
        textAlign: 'center',
        lineHeight: 22,
    },
    modalInput: {
        borderWidth: 1,
        borderColor: Colors.lightGrey,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 20,
        color: Colors.black,
        fontFamily: 'Poppins_400Regular',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: Colors.lightGrey,
        borderWidth: 1,
        borderColor: Colors.lightGrey,
        borderRadius: 50,
    },
    cancelButtonText: {
        color: Colors.darkGrey,
        fontSize: 16,
        fontFamily: 'Poppins_400Regular',
    },
    sendButton: {
        backgroundColor: Colors.primary,
        borderWidth: 1,
        borderColor: 'transparent',
        borderRadius: 50,
    },
    sendButtonText: {
        color: Colors.white,
        fontSize: 16,
        fontFamily: 'Poppins_400Regular',
    },
    googleButtonText: {
        color: Colors.darkGrey,
        fontSize: 16,
        fontFamily: 'Poppins_600SemiBold',
        marginLeft: 10,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: 'Poppins_600SemiBold',
    },
});
