import React from 'react';
import { View, Image, StyleSheet, ImageSourcePropType } from 'react-native';
import { Colors } from '@/theme';
import { Ionicons } from '@expo/vector-icons';

interface AvatarProps {
  source?: ImageSourcePropType;
  size?: number;
}

const Avatar: React.FC<AvatarProps> = ({ source, size = 100 }) => {
  const avatarStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  return (
    <View style={[styles.container, avatarStyle]}>
      {source ? (
        <Image source={source} style={styles.image} />
      ) : (
        <Ionicons name="person" size={size * 0.6} color={Colors.gray} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

export default Avatar;
