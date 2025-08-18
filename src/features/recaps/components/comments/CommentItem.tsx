import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

interface CommentItemProps {
  comment: {
    author: string;
    text: string;
    date: string;
    avatarUrl?: string;
    mediaUrl?: string;
  };
}

const CommentItem: React.FC<CommentItemProps> = ({ comment }) => {
  const { author, text, date, avatarUrl, mediaUrl } = comment;
  return (
    <View style={styles.container}>
      <Image source={{ uri: avatarUrl || 'https://placehold.co/50' }} style={styles.avatar} />
      <View style={styles.commentContent}>
        <Text style={styles.commentText}><Text style={styles.author}>{author}</Text> commented: "{text}"</Text>
        <Text style={styles.date}>{date}</Text>
      </View>
      {mediaUrl && <Image source={{ uri: mediaUrl }} style={styles.mediaThumbnail} />} 
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
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
