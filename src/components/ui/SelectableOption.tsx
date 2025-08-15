import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import Text from './Text';
import { Colors, Spacing, BorderRadius } from '@/theme';

interface SelectableOptionProps {
  text: string;
  isSelected: boolean;
  onPress: () => void;
}

const SelectableOption: React.FC<SelectableOptionProps> = ({ text, isSelected, onPress }) => {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: isSelected ? Colors.primary : Colors.lightGray,
          borderColor: isSelected ? Colors.primary : Colors.gray,
        },
      ]}
      onPress={onPress}
    >
      <Text style={{ color: isSelected ? Colors.white : Colors.text }}>{text}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.sm,
  },
});

export default SelectableOption;
