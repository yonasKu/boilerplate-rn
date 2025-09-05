import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '@/theme/colors';

interface ErrorBannerProps {
  message?: string | null;
  onClose?: () => void;
  testID?: string;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, onClose, testID }) => {
  if (!message) return null;
  return (
    <View style={styles.container} testID={testID || 'error-banner'}>
      <View style={styles.row}>
        <Text style={styles.icon} accessibilityLabel="Error">!</Text>
        <Text style={styles.text}>{message}</Text>
        {onClose && (
          <TouchableOpacity onPress={onClose} accessibilityLabel="Dismiss error" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.dismiss}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FDECEA',
    borderColor: '#F5C2C0',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
    color: Colors.error,
    fontWeight: '800',
    fontSize: 16,
  },
  text: {
    flex: 1,
    color: Colors.error,
    fontSize: 14,
  },
  dismiss: {
    color: Colors.error,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ErrorBanner;
