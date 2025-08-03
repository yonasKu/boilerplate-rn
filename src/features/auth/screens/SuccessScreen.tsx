import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, Image } from 'react-native';
import { useRouter } from 'expo-router';
import ConfettiCannon from 'react-native-confetti-cannon';

const SuccessScreen = () => {
  const router = useRouter();
  const confettiRef = useRef<ConfettiCannon>(null);

  useEffect(() => {
    confettiRef.current?.start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ConfettiCannon
        count={300} // More confetti
        origin={{ x: -10, y: 30 }}
        autoStart={false}
        ref={confettiRef}
        fallSpeed={8000} // Slower fall speed to last longer
        fadeOut
      />
      <View style={styles.content}>
        
        <Image source={require('../../../assets/images/Checked_BIG.png')} style={styles.successIcon} />
        <Text style={styles.title}>Account created successfully</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.replace('/(auth)/login')}>
          <Text style={styles.buttonText}>Continue to Login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  successIcon: {
    width: 200,
    height: 200,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2F4858',
    textAlign: 'center',
    marginBottom: 100,
    fontFamily: 'serif',
  },
  button: {
    backgroundColor: '#5D9275',
    paddingVertical: 18,
    width: '100%',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default SuccessScreen;
