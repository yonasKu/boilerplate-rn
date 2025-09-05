import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Colors } from '@/theme';
import NotificationService from '@/services/notifications/NotificationService';
import { router } from 'expo-router';
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
  recapId?: string;
  comment?: string;
  body?: string;
  title?: string;
  date: string;
  isRead: boolean;
}

const CommentNotification = ({ item }: { item: Notification }) => {
  const userNames = item.users?.map(u => u.name).join(', ').replace(/,([^,]*)$/, ' and$1');

  const handlePress = React.useCallback(() => {
    if (!item.isRead) {
      NotificationService.markNotificationAsRead(item.id).catch((e) =>
        console.error('Failed to mark notification as read:', e)
      );
    }
    const id = item.recapId || item.recap;
    if (id) {
      try {
        router.push({ pathname: '/(main)/recaps/recap-view', params: { recapId: String(id), openComments: 'true' } });
      } catch (e) {
        console.warn('Navigation error from CommentNotification:', e);
      }
    }
  }, [item.id, item.isRead]);

  // Render avatar for the first actor, supporting URL or fallback initials
  const renderAvatar = () => {
    const first = item.users && item.users[0];
    if (!first) {
      return (
        <View style={[styles.avatar, generateAvatarStyle('?')]}> 
          <Text style={[styles.initials, { color: getContrastingTextColorForName('?') }]}> 
            {getInitials('')} 
          </Text>
        </View>
      );
    }

    const avatar = first.avatar as any;
    // If avatar is a non-empty string, assume it's a remote URL
    if (typeof avatar === 'string' && avatar.trim().length > 0) {
      return <Image source={{ uri: avatar }} style={styles.avatar} />;
    }
    // If avatar is a valid image source (require or object), render directly
    if (avatar) {
      return <Image source={avatar} style={styles.avatar} />;
    }
    // Fallback to initials-based avatar like RecapLoveNotification
    return (
      <View style={[styles.avatar, generateAvatarStyle(first.name || '?')]}> 
        <Text style={[styles.initials, { color: getContrastingTextColorForName(first.name || '?') }]}> 
          {getInitials(first.name || '')} 
        </Text>
      </View>
    );
  };

  // Derive comment text for legacy notifications (fallback to parsing body like "Name: text")
  const displayComment = React.useMemo(() => {
    const direct = (item.comment ?? '').toString().trim();
    if (direct.length > 0) return direct;
    const body = (item.body ?? '').toString().trim();
    if (!body) return '';
    const colonIdx = body.indexOf(':');
    if (colonIdx >= 0 && colonIdx < body.length - 1) {
      return body.slice(colonIdx + 1).replace(/^\s+/, '');
    }
    return body;
  }, [item.comment, item.body]);

  return (
    <TouchableOpacity style={styles.itemContainer} onPress={handlePress}>
      {renderAvatar()}
      <View style={styles.textContainer}>
        <Text style={styles.text}>
          <Text style={styles.bold}>{userNames}</Text> commented: {displayComment}
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
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  initials: {
    color: Colors.white,
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
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
  date: {
    fontSize: 13,
    color: Colors.mediumGrey,
    marginTop: 4,
    fontFamily: 'Poppins-Regular',
  },
});

export default CommentNotification;
