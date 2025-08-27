import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, StatusBar, Image } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/context/AuthContext';
import { ReferralService } from '@/services/referralService';
import { Colors } from '@/theme/colors';
import { SafeAreaView } from 'react-native-safe-area-context';

const EnterReferralCodeScreen = () => {
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const handleProcessReferral = async () => {
    const code = referralCode.trim().toUpperCase();
    if (!code) {
      Alert.alert('Required', 'Please enter a referral code.');
      return;
    }

    if (!user) {
      try {
        await AsyncStorage.setItem('@pendingReferralCode', code);
        Alert.alert('Almost there', 'Create an account or log in to apply your referral.');
        router.replace('/(auth)/signup');
      } catch (e) {
        console.error('Error storing pending referral code:', e);
        Alert.alert('Error', 'Could not proceed. Please try again.');
      }
      return;
    }

    setLoading(true);
    try {
      await ReferralService.processReferral(code);
      Alert.alert('Success', 'Referral applied!');
      router.replace('/(auth)/pricing');
    } catch (error: any) {
      console.error('Error processing referral:', error);
      Alert.alert('Error', error?.message || 'Failed to apply referral. Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/Logo_Icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.headerContainer}>
          <Text style={styles.title}>Enter Referral Code</Text>
          <Text style={styles.description}>
            Enter a referral code to unlock complimentary days
          </Text>
        </View>

        <View style={styles.footerContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter referral code"
            value={referralCode}
            placeholderTextColor={Colors.mediumGrey}
            onChangeText={setReferralCode}
            autoCapitalize="characters"
            autoCorrect={false}
          />

          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleProcessReferral}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.primaryButtonText}>Continue</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.back()}
            disabled={loading}
          >
            <Text style={styles.secondaryButtonText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 50,
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  logoContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
  },
  headerContainer: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.black,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: Colors.mediumGrey,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  footerContainer: {
    gap: 10,
    width: '100%',
    alignItems: 'center',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.lightGrey,
    backgroundColor: Colors.lightPink,
    borderRadius: 25,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    marginBottom: 16,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: Colors.white,
  },
  secondaryButtonText: {
    color: Colors.primary,
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});

export default EnterReferralCodeScreen;
