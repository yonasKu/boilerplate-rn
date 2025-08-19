import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import CommentList from './CommentList';
import CommentInput from './CommentInput';
import { Colors } from '@/theme';
import { recapCommentsService } from '../../services/recapCommentsService';

interface CommentsSectionProps {
  recapId: string;
  onClose?: () => void;
  onCommentCountUpdate?: (count: number) => void;
}

const CommentsSection: React.FC<CommentsSectionProps> = ({ recapId, onClose, onCommentCountUpdate }) => {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      const fetchedComments = await recapCommentsService.getComments(recapId);
      setComments(fetchedComments);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    } finally {
      setLoading(false);
    }
  }, [recapId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  useEffect(() => {
    if (onCommentCountUpdate) {
      onCommentCountUpdate(comments.length);
    }
  }, [comments.length, onCommentCountUpdate]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.commentsButton}>
          <Text style={styles.commentsButtonText}>{comments.length} Comments</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} size="large" color={Colors.primary} />
      ) : (
        <CommentList comments={comments} />
      )}
      <CommentInput recapId={recapId} onCommentAdded={fetchComments} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 4,
    paddingBottom: 90, // Add padding to avoid overlap with the absolute positioned input
  },
  header: {
    alignItems: 'center',
    paddingVertical: 10,
 
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
