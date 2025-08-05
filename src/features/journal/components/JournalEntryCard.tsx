import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface JournalEntryCardProps {
  entry: {
    id: string;
    text: string;
    media: Array<{
      type: 'image' | 'video';
      url: string;
      thumbnailUrl?: string;
    }>;
    isFavorited: boolean;
    isMilestone: boolean;
    childAgeAtEntry: string;
    likes: Record<string, boolean>;
    createdAt: any;
  };
  onLike?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const JournalEntryCard: React.FC<JournalEntryCardProps> = ({ entry, onLike, onEdit, onDelete }) => {
  const likeCount = Object.keys(entry.likes || {}).length;
  const isLiked = false; // This would come from current user context

  const renderMedia = () => {
    if (!entry.media || entry.media.length === 0) return null;

    return (
      <View style={styles.mediaGrid}>
        {entry.media.map((item, index) => (
          <View key={index} style={styles.mediaContainer}>
            <Image source={{ uri: item.url }} style={styles.media} />
            {item.type === 'video' && (
              <View style={styles.videoOverlay}>
                <Ionicons name="play-circle" size={24} color="white" />
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.handlebar} />
      <View style={styles.header}>
        <Text style={styles.age}>{entry.childAgeAtEntry}</Text>
        <View style={styles.actions}>
          {onLike && (
            <TouchableOpacity style={styles.actionButton} onPress={onLike}>
              <Ionicons name="heart" size={16} color={isLiked ? '#5D9275' : '#555'} />
              <Text style={[styles.actionText, isLiked && styles.actionText]}>{likeCount}</Text>
            </TouchableOpacity>
          )}
          {onEdit && (
            <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
              <Ionicons name="pencil" size={16} color="#555" />
              <Text style={styles.actionText}>Edit</Text>
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity style={styles.actionButton} onPress={onDelete}>
              <Ionicons name="close" size={16} color="#FF4444" />
              <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      <Text style={styles.entryText}>{entry.text}</Text>
      {renderMedia()}
      <View style={styles.tags}>
        {entry.isMilestone && (
          <View style={[styles.tag, styles.milestoneTag]}>
            <Ionicons name="ribbon-outline" size={12} color="#666" />
            <Text style={styles.tagText}>Milestone</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  handlebar: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
    marginBottom: 16,
  },
  entryText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  age: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  tags: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  milestoneTag: {
    backgroundColor: '#FFF9E6',
  },
  tagText: {
    fontSize: 12,
    color: '#666',
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  mediaContainer: {
    position: 'relative',
  },
  media: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 14,
    color: '#666',
  },
  deleteText: {
    color: '#FF4444',
  },

});

export default JournalEntryCard;
