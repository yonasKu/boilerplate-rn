import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import Container from '@/components/ui/Container';
import Header from '@/components/ui/Header';
import Logo from '@/components/ui/Logo';
import Input from '@/components/ui/Input';
import Checkbox from '@/components/ui/Checkbox';
import Button from '@/components/ui/Button';
import Divider from '@/components/ui/Divider';
import Text from '@/components/ui/Text';
import { Spacing, Colors } from '@/theme';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  return (
    <Container>
      <Header title="Login" canGoBack />
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Logo />
        </View>

        <Input
          label="Email*"
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          icon={<Ionicons name="mail-outline" size={20} color={Colors.gray} />}
        />

        <Input
          label="Password*"
          placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          icon={<Ionicons name="lock-closed-outline" size={20} color={Colors.gray} />}
        />

        <View style={styles.row}>
          <Checkbox label="Remember Me" checked={rememberMe} onChange={setRememberMe} />
          <TouchableOpacity onPress={() => { /* Forgot Password */ }}>
            <Text style={styles.forgotPassword}>Forgot Password</Text>
          </TouchableOpacity>
        </View>

        <Button title="Log In" onPress={() => router.replace('/journal')} />

        <Divider text="Or" />

        <View style={styles.socialContainer}>
          <Button
            title="Google"
            variant="secondary"
            onPress={() => { /* Handle Google Login */ }}
            icon={<Ionicons name="logo-google" size={20} color={Colors.primary} />}
            style={styles.socialButton}
          />
          <Button
            title="Apple"
            variant="secondary"
            onPress={() => { /* Handle Apple Login */ }}
            icon={<Ionicons name="logo-apple" size={20} color={Colors.primary} />}
            style={styles.socialButton}
          />
        </View>
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  forgotPassword: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  socialButton: {
    flex: 1,
  },
});
