import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FamilyService } from '../../../services/familyService';
import { useAuth } from '../../../context/AuthContext';
import { Colors } from '../../../theme/colors';

const EnterInviteCodeScreen = () => {
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const handleAcceptInvite = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Required', 'Please enter an invite code.');
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
        Alert.alert('Error', 'Could not proceed. Please try again.');
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
      Alert.alert('Error', error.message || 'Failed to accept invitation. Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Have an Invite Code?</Text>
      <Text style={styles.subtitle}>Enter the code you received to get access.</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Enter Invite Code"
        value={inviteCode}
        onChangeText={setInviteCode}
        autoCapitalize="characters"
        autoCorrect={false}
      />

      <TouchableOpacity 
        style={[styles.button, loading && styles.disabledButton]}
        onPress={handleAcceptInvite}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? 'Verifying...' : 'Submit Code'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.backText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: Colors.white,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: Colors.primary,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: Colors.darkGrey,
  },
  input: {
    backgroundColor: Colors.lightGrey,
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: Colors.mediumGrey,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  backText: {
    marginTop: 20,
    textAlign: 'center',
    color: Colors.primary,
    fontSize: 16,
  },
});

export default EnterInviteCodeScreen;
