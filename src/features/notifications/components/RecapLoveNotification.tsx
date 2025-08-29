import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/theme';
import AvatarCluster from './AvatarCluster';
import { getInitials, generateAvatarStyle, getContrastingTextColorForName } from '@/utils/avatarUtils';

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
  // Derive actors from users or fallback parse from body (e.g., "John Doe liked your recap")
  const actors: User[] = React.useMemo(() => {
    if (users.length > 0) return users;
    const body = (item.body ?? '').trim();
    let name: string | undefined;
    // Try to find text before ' liked'
    const likedIdx = body.toLowerCase().indexOf(' liked');
    if (likedIdx > 0) {
      name = body.substring(0, likedIdx).trim();
    }
    // Alternative pattern: "... by NAME"
    if (!name) {
      const byIdx = body.toLowerCase().lastIndexOf(' by ');
      if (byIdx >= 0) name = body.substring(byIdx + 4).trim();
    }
    // Fallback: empty array
    return name ? [{ name }] : [];
  }, [users, item.body]);

  let userNames = '';

  if (actors.length === 1) {
    userNames = actors[0].name;
  } else if (actors.length === 2) {
    userNames = `${actors[0].name} and ${actors[1].name}`;
  } else if (actors.length > 2) {
    userNames = `${actors[0].name}, ${actors[1].name} and others`;
  }

  // Derive action text from body without repeating names
  const actionText = React.useMemo(() => {
    const body = (item.body ?? '').trim();
    if (!body) return '';
    if (actors.length === 0) return body;
    // Build a leading label to strip if present
    const leading = actors.length === 1
      ? actors[0].name
      : actors.length === 2
      ? `${actors[0].name} and ${actors[1].name}`
      : '';
    if (leading && body.toLowerCase().startsWith(leading.toLowerCase())) {
      return body.slice(leading.length).replace(/^[:,\-]?\s*/, '');
    }
    const likedIdx = body.toLowerCase().indexOf(' liked');
    if (likedIdx >= 0) return body.slice(likedIdx).trim();
    return body;
  }, [item.body, actors]);

  return (
    <TouchableOpacity style={styles.itemContainer}>
      <View style={styles.avatarContainer}>
        {actors.length > 1 ? (
          <AvatarCluster users={actors} />
        ) : actors.length === 1 ? (
          actors[0]?.avatar ? (
            <Image source={actors[0].avatar} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, generateAvatarStyle(actors[0]?.name || '?')]}> 
              <Text style={[styles.initials, { color: getContrastingTextColorForName(actors[0]?.name || '?') }]}>
                {getInitials(actors[0]?.name || '')}
              </Text>
            </View>
          )
        ) : (
          <View style={[styles.avatar, generateAvatarStyle('?')]}> 
            <Text style={[styles.initials, { color: getContrastingTextColorForName('?') }]}>
              {getInitials('')}
            </Text>
          </View>
        )}
        <View style={actors.length > 1 ? styles.heartIconContainerCluster : styles.heartIconContainerSingle}>
          <Ionicons name="heart" size={12} color={'#F68B7F'} />
        </View>
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.text}>
          {actors.length > 0 ? (
            <>
              <Text style={styles.bold}>{userNames}</Text> {actionText}
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
    backgroundColor: Colors.white,
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
    backgroundColor:Colors.white,
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
  initials: {
    color: Colors.white,
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
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
