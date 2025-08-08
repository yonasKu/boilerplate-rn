import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, TextInput, StatusBar, Image, ActivityIndicator } from 'react-native';
import { useLogin } from '../hooks/useLogin';
import { router } from 'expo-router';


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
        
        // Functions
        handleLogin,
        handleForgotPassword,
        handleSendResetEmail,
        handleGoogleSignIn,
        handleBiometricLogin,
        checkBiometricAvailability
    } = useLogin();



    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <ScrollView contentContainerStyle={styles.scrollContainer}>


                <View style={styles.logoContainer}>
                    <Image source={require('../../../assets/images/Logo_text.png')} style={styles.logo} />
                </View>

                <Text style={styles.label}>Email<Text style={styles.asterisk}>*</Text></Text>
                <View style={styles.inputContainer}>
                    <Image source={require('../../../assets/images/sms.png')} style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
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

                <View style={styles.row}>
                    <TouchableOpacity style={styles.checkboxContainer} onPress={() => setRememberMe(!rememberMe)}>
                        <View style={[styles.checkbox, rememberMe && styles.checkedCheckbox]} />
                        <Text style={styles.checkboxLabel}>Remember Me</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleForgotPassword}>
                        <Text style={styles.forgotPassword}>Forgot Password</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.loginRow}>
                    <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={isLoading}>
                        {isLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Log in</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.faceIdButton, !biometricEnabled && styles.disabledFaceIdButton]} 
                        onPress={handleBiometricLogin}
                        disabled={!biometricEnabled}
                    >
                        <Image 
                            source={require('../../../assets/images/iconoir_face-id.png')} 
                            style={[styles.faceIdIcon, !biometricEnabled && styles.disabledFaceIdIcon]} 
                        />
                    </TouchableOpacity>
                </View>

                <View style={styles.dividerContainer}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.orText}>Or</Text>
                    <View style={styles.dividerLine} />
                </View>

                <View style={styles.socialContainer}>
                    <TouchableOpacity style={styles.socialButton} onPress={handleGoogleSignIn}>
                        <Image source={require('../../../assets/images/Google.png')} style={styles.socialIcon} />
                        <Text style={styles.socialButtonText}>Google</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.socialButton}>
                        <Image source={require('../../../assets/images/Apple.png')} style={styles.socialIcon} />
                        <Text style={styles.socialButtonText}>Apple</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.footerTextContainer}>
                    <Text style={styles.termsText}>By clicking continue you agree to our</Text>
                    <Text style={styles.termsText}>
                        <Text style={styles.linkText}>Terms of Use</Text> and <Text style={styles.linkText}>Privacy Policy</Text>
                    </Text>
                </View>

                <Text style={styles.signInText}>
                    Don't have an account? <TouchableOpacity onPress={() => router.push('/signup')}><Text style={styles.linkText}>Sign Up</Text></TouchableOpacity>
                </Text>
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


        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollContainer: {
        flexGrow: 1,
        padding: 20,
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
        marginVertical: 40,
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
        height: 60,
    },
    inputIcon: {
        width: 20,
        height: 20,
        marginRight: 10,
        tintColor: '#A9A9A9',
    },
    input: {
        flex: 1,
        height: '100%',
        fontSize: 16,
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
        borderColor: '#5D9275',
        marginRight: 10,
    },
    checkedCheckbox: {
        backgroundColor: '#5D9275',
    },
    checkboxLabel: {
        color: '#5D9275',
        fontWeight: '500',
    },
    forgotPassword: {
        color: '#5D9275',
        fontWeight: 'bold',
    },
    loginRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
        marginVertical: 20,
    },
    loginButton: {
        flex: 1,
        backgroundColor: '#6A8A7A', // Updated color from image
        paddingVertical: 18,
        borderRadius: 16, // Updated border radius from image
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
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
    faceIdButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#F0F0F0',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    faceIdIcon: {
        width: 28,
        height: 28,
        tintColor: '#333',
    },
    disabledFaceIdButton: {
        opacity: 0.5,
    },
    disabledFaceIdIcon: {
        tintColor: '#999',
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
    },
    socialIcon: {
        width: 24,
        height: 24,
        marginRight: 10,
        resizeMode: 'contain',
    },
    socialButtonText: {
        fontSize: 16,
        color: '#2F4858',
    },

    // Modal styles
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    modalContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        margin: 20,
        width: '90%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2F4858',
        marginBottom: 8,
        textAlign: 'center',
    },
    modalDescription: {
        fontSize: 14,
        color: '#666666',
        marginBottom: 16,
        textAlign: 'center',
        lineHeight: 20,
    },
    modalInput: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 20,
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
        backgroundColor: '#F5F5F5',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    cancelButtonText: {
        color: '#666666',
        fontSize: 16,
        fontWeight: '600',
    },
    sendButton: {
        backgroundColor: '#4CAF50',
    },
    sendButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
