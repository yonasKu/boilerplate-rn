import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Container from '@/components/ui/Container';
import Logo from '@/components/ui/Logo';
import Text from '@/components/ui/Text';
import Button from '@/components/ui/Button';
import { Spacing } from '@/theme';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <Container style={styles.container}>
      <View style={styles.content}>
        <Logo />
        <Text variant="h1" style={styles.title}>
          Welcome To Sproutbook
        </Text>
        <Text variant="body" style={styles.subtitle}>
          Easily capture everyday moments and turn them into shareable, lasting memories.
        </Text>
      </View>
      <Button title="Get Started" onPress={() => router.push('/add-profile')} />
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  title: {
    marginTop: Spacing.lg,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: Spacing.md,
    textAlign: 'center',
  },
});
