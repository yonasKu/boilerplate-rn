import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/theme';

interface JournalPreviewActionButtonsProps {
  isFavorited: boolean;
  isMilestone: boolean;
  onToggleFavorite: () => void;
  onToggleMilestone: () => void;
  onShare?: () => void;
}

const JournalPreviewActionButtons: React.FC<JournalPreviewActionButtonsProps> = ({ 
  isFavorited, 
  isMilestone, 
  onToggleFavorite, 
  onToggleMilestone, 
  onShare 
}) => {
  return (
    <View style={styles.toggleContainer}>
      {onShare && (
        <TouchableOpacity
          style={[styles.toggleButton, { borderColor: '#E0E0E0', backgroundColor: '#F5F5F5' }]}
          onPress={onShare}
        >
          <Image source={require('../../../assets/images/Share_icon.png')} style={[styles.milestoneIcon, { tintColor: '#555' }]} />
          <Text style={styles.toggleText}>Share</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={[styles.toggleButton, isFavorited && styles.activeToggleButton]}
        onPress={onToggleFavorite}
      >
        <Ionicons name={isFavorited ? 'heart' : 'heart-outline'} size={20} color={isFavorited ? Colors.white : '#555'} />
        <Text style={[styles.toggleText, isFavorited && styles.activeToggleText]}>Favorite</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.toggleButton, isMilestone && styles.activeToggleButton]}
        onPress={onToggleMilestone}
      >
        <Image source={require('../../../assets/images/Trophy_icon.png')} style={[styles.milestoneIcon, { tintColor: isMilestone ? Colors.white : '#555' }]} />
        <Text style={[styles.toggleText, isMilestone && styles.activeToggleText]}>Milestone</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  toggleContainer: {
    flexDirection: "row-reverse",
    gap: 12,
    marginTop: -4,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.lightGrey,
    backgroundColor: Colors.white,
  },
  activeToggleButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  toggleText: {
    fontSize: 14,
    color: Colors.mediumGrey,
  },
  activeToggleText: {
    color: Colors.white,
    fontWeight: '600',
  },
  milestoneIcon: {
    width: 20,
    height: 20,
  },
});

export default JournalPreviewActionButtons;
