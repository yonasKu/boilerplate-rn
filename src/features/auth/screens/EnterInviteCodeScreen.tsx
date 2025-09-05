import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, StatusBar, Image } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FamilyService } from '../../../services/familyService';
import { useAuth } from '../../../context/AuthContext';
import { Colors } from '../../../theme/colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import ErrorBanner from '../../../components/ui/ErrorBanner';

const EnterInviteCodeScreen = () => {
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [uiError, setUiError] = useState<string | null>(null);
  const router = useRouter();
  const { user } = useAuth();

  const handleAcceptInvite = async () => {
    if (!inviteCode.trim()) {
      setUiError('Please enter an invite code.');
      return;
    }

    // If not authenticated, store code and route to signup/login
    if (!user) {
      try {
        await AsyncStorage.setItem('@pendingInviteCode', inviteCode.trim());
        Alert.alert('Almost there', 'Create an account or log in to accept your invite.');
        router.replace('/(auth)/signup');
      } catch (e) {
        console.error('Error storing pending invite code:', e);
        setUiError('Could not proceed. Please try again.');
      }
      return;
    }

    setLoading(true);
    try {
      await FamilyService.acceptInvitation(inviteCode.trim());
      Alert.alert('Success', 'Invitation accepted! You now have access.');
      router.replace('/(main)/(tabs)/journal');
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      setUiError(error?.message || 'Failed to accept invitation. Please check the code and try again.');
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
            source={require('../../../assets/images/Logo_Icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.headerContainer}>
          <Text style={styles.title}>Enter Family Invite Code</Text>
          <Text style={styles.description}>
            This is only for Family Sharing. Enter the family invite code to join and access shared Recaps.
          </Text>
          <ErrorBanner message={uiError} onClose={() => setUiError(null)} />
        </View>

        <View style={styles.footerContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter family invite code"
            value={inviteCode}
            placeholderTextColor={Colors.mediumGrey}
            onChangeText={(t) => { setInviteCode(t); setUiError(null); }}
            autoCapitalize="characters"
            autoCorrect={false}
          />

          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleAcceptInvite}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.primaryButtonText}>Accept invite</Text>
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

export default EnterInviteCodeScreen;

