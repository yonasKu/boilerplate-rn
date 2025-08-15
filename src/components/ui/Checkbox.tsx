import React from 'react';
import { TouchableOpacity, View, StyleSheet, Text } from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/theme';
import { Ionicons } from '@expo/vector-icons'; // Assuming usage of Ionicons

interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const Checkbox: React.FC<CheckboxProps> = ({ label, checked, onChange }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={() => onChange(!checked)} activeOpacity={0.7}>
      <View style={[styles.box, checked && styles.checkedBox]}>
        {checked && <Ionicons name="checkmark" size={16} color={Colors.white} />}
      </View>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  box: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: Colors.gray,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  checkedBox: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  label: {
    fontSize: FontSizes.body,
    color: Colors.dark.text, // Defaulting to dark text, can be made theme-aware
  },
});

export default Checkbox;
