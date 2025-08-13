import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

interface User {
  name: string;
  avatar?: any;
}

interface AvatarClusterProps {
  users: User[];
}

const AvatarCluster = ({ users }: AvatarClusterProps) => {
  if (!users || users.length === 0) {
    return null;
  }

  const firstUser = users[0];
  const secondUser = users.length > 1 ? users[1] : null;

  if (!secondUser) {
    return firstUser.avatar ? <Image source={firstUser.avatar} style={styles.avatar} /> : null;
  }

  return (
    <View style={styles.clusterContainer}>
      {firstUser.avatar && <Image source={firstUser.avatar} style={[styles.avatar, styles.avatarLeft]} />}
      {secondUser.avatar && <Image source={secondUser.avatar} style={[styles.avatar, styles.avatarRight]} />}
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
