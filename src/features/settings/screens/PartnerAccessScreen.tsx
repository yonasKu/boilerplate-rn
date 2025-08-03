import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '../../../components/ui/ScreenHeader';

const PartnerAccessScreen = () => {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.contentContainer}>
          <Image
            source={require('../../../assets/images/Logo_Big.png')} // Assuming this is the logo path
            style={styles.logo}
          />
          <Text style={styles.title}>Partner Access</Text>
          <Text style={styles.subtitle}>Invite your partner or spouse to contribute to the journal</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email*</Text>
            <TextInput
              style={styles.input}
              placeholder="your partner email"
              placeholderTextColor="#A0A0A0"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Save Invite</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
    padding: 24,
    borderWidth: 1,
    borderColor: '#5D9275',
    borderStyle: 'dotted',
    borderRadius: 16,
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2F4858',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginBottom: 32,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    color: '#E53E3E',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    width: '100%',
  },
  button: {
    backgroundColor: '#5D9275',
    borderRadius: 12,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PartnerAccessScreen;
