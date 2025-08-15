import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '../theme/colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'large',
  style,
}) => {
  const getButtonStyle = (): ViewStyle[] => {
    const baseStyle: ViewStyle[] = [styles.button];
    
    if (variant === 'secondary') {
      baseStyle.push({ backgroundColor: Colors.secondary } as ViewStyle);
    } else if (variant === 'outline') {
      baseStyle.push({ 
        backgroundColor: 'transparent', 
        borderWidth: 2, 
        borderColor: Colors.primary 
      } as ViewStyle);
    } else {
      baseStyle.push({ backgroundColor: Colors.primary } as ViewStyle);
    }

    if (size === 'small') {
      baseStyle.push(styles.small);
    } else if (size === 'medium') {
      baseStyle.push(styles.medium);
    } else {
      baseStyle.push(styles.large);
    }

    if (disabled || loading) {
      baseStyle.push(styles.disabled);
    }

    return baseStyle;
  };

  const getTextStyle = (): TextStyle[] => {
    const baseStyle: TextStyle[] = [styles.buttonText];
    
    if (variant === 'outline') {
      baseStyle.push({ color: Colors.primary } as TextStyle);
    }

    return baseStyle;
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={Colors.white} />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  large: {
    paddingVertical: 18,
    width: '100%',
  },
  medium: {
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  small: {
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  disabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16, 
    fontWeight: '600',
  },
});
