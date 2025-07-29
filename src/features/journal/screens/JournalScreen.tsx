import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Container from '@/components/ui/Container';
import Header from '@/components/ui/Header';
import Avatar from '@/components/ui/Avatar';
import Logo from '@/components/ui/Logo';
import Text from '@/components/ui/Text';
import { Spacing, Colors, FontSizes } from '@/theme';

// This data would typically come from auth state/context
const user = { name: 'Mathew', avatar: undefined };

export default function JournalScreen() {
  return (
    <Container>
      <Header 
        withBorder={false}
        leftComponent={
          <View style={styles.headerLeftContainer}>
            <Avatar source={user.avatar} size={40} />
            <Text style={styles.headerTitle}>{user.name}</Text>
            <Ionicons name="chevron-down" size={20} color={Colors.text} />
          </View>
        }
        rightComponent={
          <View style={styles.headerRightContainer}>
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="notifications-outline" size={24} color={Colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="settings-outline" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
        }
      />
      <View style={styles.content}>
        <Logo />
        <Text style={styles.promptText}>Let's start your first memory</Text>
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  promptText: {
    marginTop: Spacing.lg,
    fontSize: 18,
  },
  headerLeftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerTitle: {
    fontSize: FontSizes.h3,
    fontWeight: 'bold',
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerButton: {
    padding: Spacing.sm,
  },
});
