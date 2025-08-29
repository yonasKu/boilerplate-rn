/* SuccessScreen disabled - not used. Keeping file as placeholder only.
   Original implementation commented out on 2025-08-28T22:53:20+03:00.

import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Image, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../../theme/colors';
import { Button } from '../../../components/Button';
import ConfettiCannon from 'react-native-confetti-cannon';

const SuccessScreen = () => {
  const router = useRouter();
  const confettiRef = useRef<ConfettiCannon>(null);

  useEffect(() => {
    confettiRef.current?.start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
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
        <Button 
          title="Continue to Login" 
          onPress={() => router.replace('/(auth)/login')}
          variant="primary"
          size="large"
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
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
    color: Colors.black,
    textAlign: 'center',
    marginBottom: 100,
    fontFamily: 'Poppins',
  },
});

export default SuccessScreen;
*/

// Placeholder export while success is disabled
const SuccessScreenPlaceholder = () => null;
export default SuccessScreenPlaceholder;
