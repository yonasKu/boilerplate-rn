import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import CommentList from './CommentList';
import CommentInput from './CommentInput';
import { Colors } from '@/theme';

interface CommentsSectionProps {
  entryId: string;
  onClose?: () => void;
}

const sampleComments = [
  {
    id: '1',
    author: 'Susan',
    text: 'Wow, look at her go!',
    date: 'July 16, 2025',
    avatarUrl: 'https://i.pravatar.cc/150?u=susan',
    mediaUrl: 'https://i.imgur.com/AD3G415.jpeg',
  },
  {
    id: '2',
    author: 'Sarah',
    text: 'Such a sweet smile! She\'s growing so fast',
    date: 'July 15, 2025',
    avatarUrl: 'https://i.pravatar.cc/150?u=sarah',
  },
];

const CommentsSection: React.FC<CommentsSectionProps> = ({ entryId, onClose }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.commentsButton}>
          <Text style={styles.commentsButtonText}>12 Comments</Text>
        </TouchableOpacity>
      </View>
      <CommentList comments={sampleComments} />
      <CommentInput entryId={entryId} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 90, // Add padding to avoid overlap with the absolute positioned input
  },
  header: {
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGrey,
  },
  commentsButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.lightGrey,
    borderRadius: 20,
  },
  commentsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.darkGrey,
  },
});

export default CommentsSection;
