import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/theme';

interface JournalActionButtonsProps {
  isFavorited: boolean;
  isMilestone: boolean;
  onToggleFavorite: () => void;
  onToggleMilestone: () => void;
  onShare: () => void;
  containerStyle?: object;
}

const JournalActionButtons: React.FC<JournalActionButtonsProps> = ({ 
  isFavorited, 
  isMilestone, 
  onToggleFavorite, 
  onToggleMilestone, 
  onShare,
  containerStyle
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      <TouchableOpacity onPress={onToggleFavorite} style={styles.actionButton}>
        <Ionicons name={isFavorited ? 'heart' : 'heart-outline'} size={20} color={isFavorited ? Colors.red : Colors.darkGrey} />
      </TouchableOpacity>
      <TouchableOpacity onPress={onToggleMilestone} style={styles.actionButton}>
        <Ionicons name={isMilestone ? 'ribbon' : 'ribbon-outline'} size={20} color={isMilestone ? Colors.primary : Colors.darkGrey} />
      </TouchableOpacity>
      <TouchableOpacity onPress={onShare} style={styles.actionButton}>
        <Ionicons name="share-outline" size={20} color={Colors.darkGrey} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: Colors.lightGrey,
  },
});

export default JournalActionButtons;
