import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import CommentItem from './CommentItem';

import { Comment } from '@/types';

interface CommentListProps {
  comments: Comment[];
}

const CommentList: React.FC<CommentListProps> = ({ comments }) => {
  return (
    <FlatList
      data={comments}
      keyExtractor={(item) => item.id}
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
