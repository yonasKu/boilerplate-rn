import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';

const WelcomeScreen = () => {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <View style={styles.content}>
                <Image 
                    source={require('@/assets/images/Logo_Big.png')} 
                    style={styles.logo}
                />
                <Text style={styles.title}>
                    Welcome To Sproutbook
                </Text>
                <Text style={styles.subtitle}>
                    Easily capture everyday moments and turn them into shareable, lasting memories.
                </Text>
                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.button} onPress={() => router.push('/signup')}>
                        <Text style={styles.buttonText}>Get Started</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center', // Center the main content block
    },
    content: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 25,
    },
    logo: {
        width: 100,
        height: 100,
        resizeMode: 'contain',
        marginBottom: 32,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#2F4858',
        textAlign: 'center',
        fontFamily: 'serif',
        marginBottom: 16,
    },
    subtitle: {
        fontSize: 16,
        color: '#597181',
        textAlign: 'center',
        lineHeight: 24,
        fontFamily: 'serif',
    },
    buttonContainer: {
        width: '100%',
        marginTop: 60, // Add space above the button
    },
    button: {
        backgroundColor: '#5D9275',
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
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
});

export default WelcomeScreen;
