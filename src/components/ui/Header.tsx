import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import Text from './Text';
import { Colors, Spacing, FontSizes } from '@/theme';

interface HeaderProps {
  title?: string;
  canGoBack?: boolean;
  leftComponent?: React.ReactNode;
  rightComponent?: React.ReactNode;
  withBorder?: boolean;
}

const Header: React.FC<HeaderProps> = ({ title, canGoBack, leftComponent, rightComponent, withBorder = true }) => {
  const navigation = useNavigation();

  const renderLeft = () => {
    if (leftComponent) {
      return leftComponent;
    }
    if (canGoBack && navigation.canGoBack()) {
      return (
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.button}>
          <Ionicons name="chevron-back" size={28} color={Colors.dark.text} />
        </TouchableOpacity>
      );
    }
    return <View style={styles.placeholder} />;
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, withBorder && styles.safeAreaWithBorder]}>
      <View style={styles.container}>
        <View style={styles.leftContainer}>{renderLeft()}</View>
        <View style={styles.titleContainer}>
          {title && <Text style={styles.title}>{title}</Text>}
        </View>
        <View style={styles.rightContainer}>
          {rightComponent ? rightComponent : <View style={styles.placeholder} />}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.background,
  },
  safeAreaWithBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56, // Standard header height
    paddingHorizontal: Spacing.md,
  },
  leftContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 2,
    alignItems: 'center',
  },
  rightContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  title: {
    fontSize: FontSizes.h3,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  button: {
    padding: Spacing.sm,
  },
  placeholder: {
    width: 44, // Standard touch target size
  },
});

export default Header;
