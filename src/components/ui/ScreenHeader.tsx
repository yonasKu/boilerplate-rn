import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';

import { useRouter } from 'expo-router';

interface ScreenHeaderProps {
  title: string;
  showBackButton?: boolean;
  showShareIcon?: boolean;
  onSharePress?: () => void;
  rightComponent?: React.ReactNode;
  onBack?: () => void;
  showCalendarIcon?: boolean;
}

const ScreenHeader: React.FC<ScreenHeaderProps> = ({ title, showBackButton = true, showShareIcon = false, onSharePress, rightComponent, onBack, showCalendarIcon = false }) => {
  const router = useRouter();

  const handleBackPress = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.header}>
      {showBackButton ? (
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Image source={require('../../assets/images/Chevron_Left_icon.png')} style={styles.backIcon} />
        </TouchableOpacity>
      ) : (
        <View style={styles.headerSpacer} />
      )}
            <View style={styles.titleContainer}>
                {showCalendarIcon && <Image source={require('../../assets/images/calendar.png')} style={styles.calendarIcon} />}
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
      {rightComponent ? (
        rightComponent
      ) : showShareIcon ? (
        <TouchableOpacity onPress={onSharePress} style={styles.shareIconContainer}>
          <Image source={require('../../assets/images/Share_Android.png')} style={styles.shareIcon} />
        </TouchableOpacity>
      ) : (
        <View style={styles.rightPlaceholder} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
    titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
    calendarIcon: {
    width: 20,
    height: 20,
    tintColor: '#2E2E2E',
  },
  headerTitle: {
        fontSize: 16,
    fontWeight: '600',
    color: '#2E2E2E',
  },
  headerSpacer: {
    width: 32,
  },
  rightPlaceholder: {
    width: 40,
  },
  shareIconContainer: {
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareIcon: {
    width: 20,
    height: 20,
    tintColor: '#2E2E2E',
  },
  backIcon: {
    width: 24,
    height: 24,
    tintColor: '#2E2E2E',
  },
});

export default ScreenHeader;
