import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';

import { useRouter } from 'expo-router';
import { Colors } from '../../theme/colors';

interface ScreenHeaderProps {
  title: string;
  showBackButton?: boolean;
  showShareIcon?: boolean;
  onSharePress?: () => void;
  rightComponent?: React.ReactNode;
  onBack?: () => void;
  showCalendarIcon?: boolean;
  leftComponent?: React.ReactNode;
  onTitlePress?: () => void;
  centerTitle?: boolean;
}

const ScreenHeader: React.FC<ScreenHeaderProps> = ({ title, showBackButton = true, showShareIcon = false, onSharePress, rightComponent, onBack, showCalendarIcon = false, leftComponent, onTitlePress, centerTitle = false }) => {
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
      {leftComponent ? (
        leftComponent
      ) : showBackButton ? (
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Image source={require('../../assets/images/Chevron_Left_icon.png')} style={styles.backIcon} />
        </TouchableOpacity>
      ) : (
        <View style={styles.headerSpacer} />
      )}
      <View style={[styles.titleContainer, centerTitle && styles.titleCenteredContainer]}>
        {showCalendarIcon && <Image source={require('../../assets/images/calendar.png')} style={styles.calendarIcon} />}
        {onTitlePress ? (
          <TouchableOpacity onPress={onTitlePress} activeOpacity={0.7} style={centerTitle ? styles.titleTouchableCentered : undefined}>
            <Text style={[styles.headerTitle, showCalendarIcon && { marginLeft: 8 }, centerTitle && styles.headerTitleCentered]} numberOfLines={1} ellipsizeMode="tail">{title}</Text>
          </TouchableOpacity>
        ) : (
          <Text style={[styles.headerTitle, showCalendarIcon && { marginLeft: 8 }, centerTitle && styles.headerTitleCentered]} numberOfLines={1} ellipsizeMode="tail">{title}</Text>
        )}
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
    backgroundColor: Colors.white,
  },
  backButton: {
    padding: 4,
    backgroundColor: Colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.lightGrey,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  titleCenteredContainer: {
    justifyContent: 'center',
  },
  calendarIcon: {
    width: 20,
    height: 20,
    tintColor: Colors.darkGrey,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.darkGrey,
    flexShrink: 1,
    minWidth: 0,
  },
  headerTitleCentered: {
    textAlign: 'center',
    width: '100%',
  },
  titleTouchableCentered: {
    flex: 1,
    alignItems: 'center',
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
    borderColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareIcon: {
    width: 20,
    height: 20,
    tintColor: Colors.darkGrey,
  },
  backIcon: {
    width: 24,
    height: 24,
    tintColor: Colors.darkGrey,
  },
});

export default ScreenHeader;
