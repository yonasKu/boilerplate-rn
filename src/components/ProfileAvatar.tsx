// src/components/ProfileAvatar.tsx

import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { generateAvatarColor, getInitials } from '../utils/avatarUtils';

interface ProfileAvatarProps {
  imageUrl?: string | null;
  name: string;
  size?: number;
  textSize?: number;
}

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  imageUrl,
  name,
  size = 50,
  textSize = 20,
}) => {
  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
        }}
      />
    );
  }

  const backgroundColor = generateAvatarColor(name);
  const initials = getInitials(name);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor, width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={[styles.text, { fontSize: textSize }]}>
        {initials}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
