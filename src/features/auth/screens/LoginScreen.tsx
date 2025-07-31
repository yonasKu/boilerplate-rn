import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, TextInput, StatusBar, Image } from 'react-native';
import { useRouter } from 'expo-router';


export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

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
                    <TouchableOpacity onPress={() => { /* Forgot Password */ }}>
                        <Text style={styles.forgotPassword}>Forgot Password</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.loginRow}>
                    <TouchableOpacity style={styles.loginButton} onPress={() => router.replace('/(auth)/add-profile')}>
                        <Text style={styles.buttonText}>Log in</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.faceIdButton}>
                        <Image source={require('../../../assets/images/user.png')} style={styles.faceIdIcon} />
                    </TouchableOpacity>
                </View>

                <View style={styles.dividerContainer}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.orText}>Or</Text>
                    <View style={styles.dividerLine} />
                </View>

                <View style={styles.socialContainer}>
                    <TouchableOpacity style={styles.socialButton}>
                        <Image source={require('../../../assets/images/Google.png')} style={styles.socialIcon} />
                        <Text style={styles.socialButtonText}>Google</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.socialButton}>
                        <Image source={require('../../../assets/images/Apple.png')} style={styles.socialIcon} />
                        <Text style={styles.socialButtonText}>Apple</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
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
        fontSize: 18,
        fontWeight: '500',
    },
    faceIdButton: {
        padding: 18,
        backgroundColor: '#6A8A7A', // Updated color from image
        borderRadius: 16, // Updated border radius from image
    },
    faceIdIcon: {
        width: 24,
        height: 24,
        tintColor: '#FFFFFF',
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
    },
    socialButtonText: {
        fontSize: 16,
        color: '#2F4858',
    },
});
