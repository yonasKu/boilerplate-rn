import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, View } from 'react-native';
import { Colors, FontSizes, Spacing, BorderRadius, Shadows } from '@/theme';

import { ActivityIndicator } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  loading?: boolean;
}

const Button: React.FC<ButtonProps> = ({ title, onPress, variant = 'primary', icon, style, textStyle, disabled, loading }) => {
  const buttonStyles = [
    styles.button, 
    styles[`${variant}Button`], 
    disabled && styles.disabled, 
    style
  ];
  const textStyles = [styles.text, styles[`${variant}Text`], textStyle];

  return (
    <TouchableOpacity style={buttonStyles} onPress={onPress} activeOpacity={0.8} disabled={disabled || loading}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? Colors.white : Colors.primary} />
      ) : (
        <>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={textStyles}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  text: {
    fontSize: FontSizes.body,
    fontWeight: 'bold',
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  primaryText: {
    color: Colors.white,
  },
  secondaryButton: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray,
  },
  secondaryText: {
    color: Colors.primary,
  },
  iconContainer: {
    marginRight: Spacing.sm,
  },
  disabled: {
    opacity: 0.5,
  }
});

export default Button;
