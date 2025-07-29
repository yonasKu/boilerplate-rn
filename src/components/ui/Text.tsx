import { Colors, FontSizes } from "@/theme";
import React from "react";
import { Text as RNText, StyleSheet, TextProps, useColorScheme } from "react-native";

// Define the possible variants for the text component
type TextVariant = 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'link';

// Use keys from the base Colors object (excluding the 'dark' object itself)
type ColorName = keyof Omit<typeof Colors, 'dark'>;

interface CustomTextProps extends TextProps {
  children: React.ReactNode;
  variant?: TextVariant;
  color?: ColorName;
}

const Text: React.FC<CustomTextProps> = ({ children, style, variant = 'body', color = 'text', ...props }) => {
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = colorScheme === 'dark' ? Colors.dark : Colors;
  const textColor = themeColors[color as keyof typeof themeColors] || Colors.text;

  return (
    <RNText style={[styles.base, styles[variant], { color: textColor }, style]} {...props}>
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  base: {
    // Default font properties can go here if needed
  },
  h1: {
    fontSize: FontSizes.h1,
    fontWeight: 'bold',
  },
  h2: {
    fontSize: FontSizes.h2,
    fontWeight: '600',
  },
  h3: {
    fontSize: FontSizes.h3,
    fontWeight: '500',
  },
  body: {
    fontSize: FontSizes.body,
  },
  caption: {
    fontSize: FontSizes.caption,
    color: Colors.gray,
  },
  link: {
    fontSize: FontSizes.body,
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
});

export default Text;
