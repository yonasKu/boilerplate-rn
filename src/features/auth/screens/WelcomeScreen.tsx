import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Image, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/theme';
import { Button } from '../../../components/Button';

const WelcomeScreen = () => {
    const router = useRouter();

    const handleGetStarted = () => {
        // router.push('/add-profile');
        // router.push('/signup');
        router.push('/login');
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
            <View style={styles.content}>
                <Image
                    source={require('@/assets/images/Logo_Icon.png')}
                    style={styles.logo}
                />
                <Text style={styles.title}>
                    Welcome{'\n'} To Sproutbook
                </Text>
                <Text style={styles.subtitle}>
                    Easily capture everyday moments and turn them into shareable, lasting memories.
                </Text>
                <View style={styles.buttonContainer}>
                    <Button
                        title="Get Started"
                        onPress={handleGetStarted}
                        variant="primary"
                        size="large"
                    />
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
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
        fontWeight: '500',
        color: Colors.black,
        textAlign: 'center',
        marginBottom: 16,
    },
    subtitle: {
        fontSize: 14,
        fontFamily: 'Poppins',
        color: Colors.mediumGrey,
        textAlign: 'center',
        lineHeight: 24,
    },
    buttonContainer: {
        width: '100%',
        marginTop: 60, // Add space above the button
    },
});

export default WelcomeScreen;
