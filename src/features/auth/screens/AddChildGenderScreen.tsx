import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

import Container from '@/components/ui/Container';
import Header from '@/components/ui/Header';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import SelectableOption from '@/components/ui/SelectableOption';
import { Spacing } from '@/theme';

const GENDER_OPTIONS = ['Boy', 'Girl', `Don't know yet`, 'Prefer not to say'];

export default function AddChildGenderScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [selectedGender, setSelectedGender] = useState<string | null>(null);

  return (
    <Container>
      <Header title="Tell us about your little one" canGoBack />
      <View style={styles.content}>
        <View style={styles.avatarContainer}>
          <Avatar />
        </View>

        <View style={styles.optionsContainer}>
          {GENDER_OPTIONS.map((option) => (
            <SelectableOption
              key={option}
              text={option}
              isSelected={selectedGender === option}
              onPress={() => setSelectedGender(option)}
            />
          ))}
        </View>

        <View style={styles.footer}>
          <Button 
            title="Continue" 
            onPress={() => {
              login();
              // The root layout will now automatically redirect to the main app.
            }}
            disabled={!selectedGender}
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
  avatarContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  optionsContainer: {
    flex: 1,
  },
  footer: {
    justifyContent: 'flex-end',
    marginBottom: Spacing.lg,
  },
});
