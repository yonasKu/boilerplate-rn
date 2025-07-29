import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import Container from '@/components/ui/Container';
import Header from '@/components/ui/Header';
import Avatar from '@/components/ui/Avatar';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Text from '@/components/ui/Text';
import { Spacing } from '@/theme';

export default function AddProfileScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // This would come from a state management library or context
  const lifestage = 'Soon to be parent'; 

  return (
    <Container>
      <Header title="Tell us about yourself" canGoBack />
      <View style={styles.content}>
        <View style={styles.avatarContainer}>
          <Avatar />
          <Text variant="caption" style={styles.avatarCaption}>Add Photo</Text>
        </View>

        <Input
          label="Name*"
          placeholder="Your name"
          value={name}
          onChangeText={setName}
        />

        <Input
          label="Email*"
          placeholder="your.email@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />

        <View style={styles.lifestageContainer}>
          <Text style={styles.lifestageLabel}>Lifestage*</Text>
          <Text style={styles.lifestageValue}>{lifestage}</Text>
        </View>

        <View style={styles.footer}>
          <Button title="Continue" onPress={() => router.push('/add-child-details')} />
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
  avatarContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  avatarCaption: {
    marginTop: Spacing.sm,
  },
  lifestageContainer: {
    marginTop: Spacing.md,
  },
  lifestageLabel: {
    marginBottom: Spacing.sm,
    fontSize: 16, // Using direct values as per design
  },
  lifestageValue: {
    fontSize: 16,
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
    marginBottom: Spacing.lg,
  },
});
