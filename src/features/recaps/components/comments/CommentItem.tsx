import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { RecapComment } from '../../services/recapCommentsService';
import { ProfileAvatar } from '../../../../components/ProfileAvatar';

interface CommentItemProps {
  comment: RecapComment;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment }) => {
  const { userName, text, createdAt, userAvatar } = comment;

const formattedDate = createdAt ? new Date(createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }) : '';

  return (
    <View style={styles.container}>
      <ProfileAvatar imageUrl={userAvatar} name={userName || 'Anonymous'} size={40} />
      <View style={styles.commentContent}>
        <Text style={styles.commentText}>
          <Text style={styles.author}>{userName}</Text> commented: "{text}"
        </Text>
        <Text style={styles.date}>{formattedDate}</Text>
      </View>
      {comment.imageUrl ? (
        <Image source={{ uri: comment.imageUrl }} style={styles.mediaThumbnail} />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
    gap: 6,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
    marginLeft: 4,
    paddingRight: 8,
  },
  commentText: {
    color: '#333',
    fontSize: 15,
    lineHeight: 22,
  },
  author: {
    fontWeight: 'bold',
  },
  date: {
    color: 'gray',
    fontSize: 13,
    marginTop: 4,
  },
  mediaThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginLeft: 12,
  },
});

export default CommentItem;
