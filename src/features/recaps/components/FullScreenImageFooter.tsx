import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/theme';

interface FullScreenImageFooterProps {
  commentCount: number;
  isLiked: boolean;
  onSharePress: () => void;
  onCommentPress: () => void;
  onLikePress: () => void;
}

const FullScreenImageFooter: React.FC<FullScreenImageFooterProps> = ({
  commentCount,
  isLiked,
  onSharePress,
  onCommentPress,
  onLikePress,
}) => {
  return (
    <View style={styles.footer}>
      <TouchableOpacity style={styles.footerButton} onPress={onSharePress}>
        <Ionicons name="arrow-redo-outline" size={24} color={Colors.grey} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.commentsButton} onPress={onCommentPress}>
        <Text style={styles.commentsText}>{commentCount} Comments</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.footerButton} onPress={onLikePress}>
        <Ionicons
          name={isLiked ? 'heart' : 'heart-outline'}
          size={24}
          color={isLiked ? Colors.red : Colors.grey}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: Colors.white,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGrey,
  },
  footerButton: {
    padding: 10,
  },
  commentsButton: {
    padding: 10,
  },
  commentsText: {
    fontSize: 14,
    color: Colors.grey,
  },
});

export default FullScreenImageFooter;
