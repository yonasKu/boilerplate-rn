import { Colors } from '@/theme';
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';


interface CommentInputProps {
  entryId: string;
}

const CommentInput: React.FC<CommentInputProps> = ({ entryId }) => {
  const [comment, setComment] = useState('');

  const handleAddComment = () => {
    if (comment.trim()) {
      // Logic to add comment will go here
      console.log(`Adding comment to entry ${entryId}: ${comment}`);
      setComment('');
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      style={styles.keyboardAvoidingView}
      keyboardVerticalOffset={90} // Adjust this value as needed
    >
      <View style={styles.container}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Add a comment..."
            placeholderTextColor={Colors.mediumGrey}
            value={comment}
            onChangeText={setComment}
            multiline
          />
        </View>
        <TouchableOpacity style={styles.postButton} onPress={handleAddComment}>
          <Text style={styles.postButtonText}>Post</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    // borderTopWidth: 1,
    // borderTopColor: Colors.grey,
  },
  inputContainer: {
    flex: 1,
    backgroundColor: Colors.white,
    borderWidth:1,
    borderColor:Colors.lightGrey,
    borderRadius: 22,
    paddingHorizontal: 16,
    marginRight: 12,
  },
  input: {
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.blacktext,
    minHeight: 44,
    maxHeight: 120, // To allow for multiple lines but not infinite growth
  },
  postButton: {
    backgroundColor: Colors.primary,
    borderRadius: 22,
    width: 70,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CommentInput;
