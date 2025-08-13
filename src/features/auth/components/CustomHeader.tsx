import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/theme';

interface CustomHeaderProps {
  title?: string;
  variant?: 'main' | 'auth' | 'refer';
  showBackButton?: boolean;
  onProfilePress?: () => void;
  onNotificationsPress?: () => void;
  onSettingsPress?: () => void;
  onSharePress?: () => void;
  containerStyle?: object;
}

const CustomHeader: React.FC<CustomHeaderProps> = ({
  title,
  variant = 'auth',
  showBackButton = true,
  onProfilePress,
  onNotificationsPress,
  onSettingsPress,
  onSharePress,
  containerStyle,
}) => {
  const navigation = useNavigation();
  const { top } = useSafeAreaInsets();

  const renderLeftComponent = () => {
    if (variant === 'main') {
      return (
        <TouchableOpacity onPress={onProfilePress} style={styles.profileContainer}>
          <Image
            source={{ uri: 'https://placeimg.com/64/64/people' }} // Placeholder
            style={styles.profileImage}
          />
          <Text style={styles.profileName}>Matthew</Text>
          <Feather name="chevron-down" size={20} color="#2F4858" />
        </TouchableOpacity>
      );
    }
        if (showBackButton) {
      return (
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <View style={styles.backButtonContainer}>
            <Feather name="chevron-left" size={24} color="#2F4858" />
          </View>
        </TouchableOpacity>
      );
    }
    return <View style={styles.leftPlaceholder} />;
  };

  const renderRightComponent = () => {
    if (variant === 'main') {
      return (
        <View style={styles.rightContainer}>
          <TouchableOpacity onPress={onNotificationsPress} style={styles.iconButton}>
            <Feather name="bell" size={24} color="#2F4858" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onSettingsPress} style={styles.iconButton}>
            <Feather name="settings" size={24} color="#2F4858" />
          </TouchableOpacity>
        </View>
      );
    }
    if (variant === 'refer') {
        return (
            <TouchableOpacity onPress={onSharePress} style={styles.iconButton}>
                <Feather name="share-2" size={24} color="#2F4858" />
            </TouchableOpacity>
        )
    }
    return <View style={styles.rightPlaceholder} />;
  };

  return (
        <View style={[styles.container, { paddingTop: top }, containerStyle]}>
      <View style={styles.headerContent}>
        {renderLeftComponent()}
        <Text style={styles.title}>{title}</Text>
        {renderRightComponent()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 15,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 60,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
    color: Colors.darkGrey,
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    zIndex: -1, // Allow icons to be pressed
  },
  rightContainer: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: 5,
  },
  backButtonContainer: {
    backgroundColor: Colors.white,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  rightPlaceholder: {
    width: 34, // to balance the left icon
  },
  leftPlaceholder: {
    width: 34, // to balance the right icon
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.darkGrey,
    marginRight: 4,
  },
});

export default CustomHeader;
