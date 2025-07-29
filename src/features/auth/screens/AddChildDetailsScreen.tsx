import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import Container from '@/components/ui/Container';
import Header from '@/components/ui/Header';
import Avatar from '@/components/ui/Avatar';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Text from '@/components/ui/Text';
import { Spacing, Colors } from '@/theme';

export default function AddChildDetailsScreen() {
  const router = useRouter();
  const [childName, setChildName] = useState('');
  const [dueDate, setDueDate] = useState('');

  return (
    <Container>
      <Header title="Tell us about your little one" canGoBack />
      <View style={styles.content}>
        <View style={styles.avatarContainer}>
          <Avatar />
        </View>

        <Input
          label="Child's name*"
          placeholder="Enter child's name"
          value={childName}
          onChangeText={setChildName}
        />

        <View style={styles.dateInputContainer}>
          <Text style={styles.label}>Due Date*</Text>
          <TouchableOpacity style={styles.dateInput} onPress={() => { /* Open Date Picker */ }}>
            <Text style={styles.dateText}>{dueDate || "Child's due date"}</Text>
            <Ionicons name="calendar-outline" size={24} color={Colors.gray} />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Button title="Continue" onPress={() => router.push('/add-child-gender')} />
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
  dateInputContainer: {
    marginTop: Spacing.md,
  },
  label: {
    marginBottom: Spacing.sm,
    fontSize: 16,
    color: Colors.dark.text, 
  },
  dateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.lightGray,
    borderRadius: 8, // BorderRadius.sm
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  dateText: {
    fontSize: 16,
    color: Colors.dark.text,
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
    marginBottom: Spacing.lg,
  },
});
