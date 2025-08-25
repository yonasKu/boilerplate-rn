import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TextInput, Alert } from 'react-native';
import { Button } from '../../../components/Button';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '../../../components/ui/ScreenHeader';
import { Colors } from '../../../theme/colors';
import { FamilyService } from '../../../services/familyService';
import { getAuth } from 'firebase/auth';

const PartnerAccessScreen = () => {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = getAuth();
  const user = auth.currentUser;

  const handleInvite = async () => {
    if (!user || !email.trim()) {
      Alert.alert('Email required', 'Please enter an email to send the invite code.');
      return;
    }

    setLoading(true);
    try {
      const { inviteCode } = await FamilyService.createInvitation({
        inviteeContact: email.trim(),
        scopes: ['recaps:read', 'journal:read', 'comments:write', 'likes:write'],
      });

      Alert.alert('Invite Code Generated', `Share this code: ${inviteCode}`, [{ text: 'OK' }]);
      setEmail('');
    } catch (error) {
      console.error('Error creating invitation:', error);
      Alert.alert('Error', 'Failed to create invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.contentContainer}>
          <Image
            source={require('../../../assets/images/Logo_Icon.png')} // Assuming this is the logo path
            style={styles.logo}
          />
          <Text style={styles.title}>Partner Access</Text>
          <Text style={styles.subtitle}>Invite your partner or spouse to contribute to your journal.</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email<Text style={styles.asterisk}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="Your partner's email address"
              placeholderTextColor={Colors.mediumGrey}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <Button
            title="Send Invite"
            onPress={handleInvite}
            variant="primary"
            size="large"
            style={styles.ctaButton}
            loading={loading}
          />

          <Text style={styles.footerText}>
            Only one partner allowed per account. Partner will be able to create their own profile and contribute to and edit all journals and recaps, as well as share entries and recaps to friends and family.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    width: 88,
    height: 88,
    marginBottom: 24,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 24,
    color: Colors.black,
    marginBottom: 8,
    fontFamily: 'Poppins-SemiBold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.mediumGrey,
    textAlign: 'center',
    marginBottom: 32,
    fontFamily: 'Poppins-Regular',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    color: Colors.black,
    marginBottom: 8,
    fontFamily: 'Poppins-Regular',
  },
  asterisk: {
    color: Colors.secondary,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightGrey,
    borderRadius: 25,
    paddingHorizontal: 16,
    height: 55,
    fontSize: 16,
    width: '100%',
    color: Colors.blacktext,
    fontFamily: 'Poppins-Regular',
  },
  ctaButton: {
    marginTop: 4,
    width: '100%',
  },
  footerText: {
    marginTop: 16,
    fontSize: 12,
    color: Colors.primary,
    textAlign: 'center',
    lineHeight: 18,
    fontFamily: 'Poppins-Regular',
  },
});

export default PartnerAccessScreen;
