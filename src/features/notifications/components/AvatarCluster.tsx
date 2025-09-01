import React from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';
import { getInitials, generateAvatarStyle } from '@/utils/avatarUtils';

interface User {
  name: string;
  avatar?: any;
}

interface AvatarClusterProps {
  users: User[];
  // Optional override colors for fallback avatars (no image provided)
  // Index 0 applies to the first/left avatar, index 1 to the second/right avatar
  colors?: string[];
}

const AvatarCluster = ({ users, colors }: AvatarClusterProps) => {
  if (!users || users.length === 0) {
    return null;
  }

  const firstUser = users[0];
  const secondUser = users.length > 1 ? users[1] : null;

  if (!secondUser) {
    return firstUser.avatar ? (
      <Image source={firstUser.avatar} style={styles.avatar} />
    ) : (
      <View style={[
        styles.avatar,
        generateAvatarStyle(firstUser.name),
        colors && colors[0] ? { backgroundColor: colors[0] } : null,
      ]}>
        <Text style={styles.initials}>{getInitials(firstUser.name)}</Text>
      </View>
    );
  }

  return (
    <View style={styles.clusterContainer}>
      {firstUser.avatar ? (
        <Image source={firstUser.avatar} style={[styles.avatar, styles.avatarLeft]} />
      ) : (
        <View style={[
          styles.avatar,
          styles.avatarLeft,
          generateAvatarStyle(firstUser.name),
          colors && colors[0] ? { backgroundColor: colors[0] } : null,
        ]}>
          <Text style={styles.initials}>{getInitials(firstUser.name)}</Text>
        </View>
      )}
      {secondUser.avatar ? (
        <Image source={secondUser.avatar} style={[styles.avatar, styles.avatarRight]} />
      ) : (
        <View style={[
          styles.avatar,
          styles.avatarRight,
          generateAvatarStyle(secondUser.name),
          colors && colors[1] ? { backgroundColor: colors[1] } : null,
        ]}>
          <Text style={styles.initials}>{getInitials(secondUser.name)}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  clusterContainer: {
    width: 58, // (40 * 2) - (40 * 0.55 overlap) = 80 - 22 = 58
    height: 40,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  initials: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    textAlign: 'center',
  },
  avatarLeft: {
    position: 'absolute',
    left: 0,
    
  },
  avatarRight: {
    position: 'absolute',
    top: 8,
    right: 3,
    zIndex: 1,
  },
});

export default AvatarCluster;
