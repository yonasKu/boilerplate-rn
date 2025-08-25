import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/theme';
import AvatarCluster from './AvatarCluster';

interface User {
  name: string;
  avatar?: any;
}

interface Notification {
  id: string;
  type: 'recap_love' | 'comment' | 'reminder' | 'streak' | 'recap_ready';
  users?: User[];
  recap?: string;
  comment?: string;
  body?: string;
  title?: string;
  date: string;
  isRead: boolean;
}

const RecapLoveNotification = ({ item }: { item: Notification }) => {
  const users = item.users || [];
  let userNames = '';

  if (users.length === 1) {
    userNames = users[0].name;
  } else if (users.length === 2) {
    userNames = `${users[0].name} and ${users[1].name}`;
  } else if (users.length > 2) {
    userNames = `${users[0].name}, ${users[1].name} and others`;
  }

  return (
    <TouchableOpacity style={styles.itemContainer}>
      <View style={styles.avatarContainer}>
        {users.length > 1 ? (
          <AvatarCluster users={users} />
        ) : (
          <Image source={users[0]?.avatar} style={styles.avatar} />
        )}
        <View style={users.length > 1 ? styles.heartIconContainerCluster : styles.heartIconContainerSingle}>
          <Ionicons name="heart" size={12} color={Colors.white} />
        </View>
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.text}>
          {users.length > 0 ? (
            <>
              <Text style={styles.bold}>{userNames}</Text> {item.body}
            </>
          ) : (
            item.body
          )}
        </Text>
        <Text style={styles.date}>{item.date}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  itemContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.offWhite,
  },
  avatarContainer: {
    width: 48, // Accommodates the cluster
    height: 48, // Accommodates the cluster
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  heartIconContainerSingle: {
    position: 'absolute',
    bottom: -2,
    right: 0,
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    padding: 2,
    borderWidth: 2,
    borderColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  heartIconContainerCluster: {
    position: 'absolute',
    bottom: -6,
    right:-8, // Adjusted for the cluster width
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    padding: 2,
    borderWidth: 2,
    borderColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  textContainer: {
    marginLeft: 12,
    flex: 1,
  },
  text: {
    fontSize: 15,
    color: Colors.darkGrey,
    lineHeight: 20,
    fontFamily: 'Poppins-Regular',
  },
  bold: {
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  link: {
    textDecorationLine: 'underline',
  },
  date: {
    fontSize: 13,
    color: Colors.mediumGrey,
    marginTop: 4,
    fontFamily: 'Poppins-Regular',
  },
});

export default RecapLoveNotification;
