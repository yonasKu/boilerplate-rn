import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import CommentItem from './CommentItem';

import { RecapComment } from '../../services/recapCommentsService';

interface CommentListProps {
  comments: RecapComment[];
}

const CommentList: React.FC<CommentListProps> = ({ comments }) => {
  return (
    <FlatList
      data={comments}
      keyExtractor={(item, index) => item.id || `comment-${index}`}
      renderItem={({ item }) => (
        <CommentItem
          comment={item}
        />
      )}
    />
  );
};

const styles = StyleSheet.create({});

export default CommentList;
