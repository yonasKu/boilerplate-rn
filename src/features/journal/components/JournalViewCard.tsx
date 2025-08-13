import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../theme/colors';

// This is a simplified version of the entry prop for the preview
interface JournalViewCardProps {
  entry: {
    text: string;
    media: Array<{ url: string; type: 'image' | 'video' }>;
  };
  onFavorite?: () => void;
  onMilestone?: () => void;
  onShare?: () => void;
}

const JournalViewCard: React.FC<JournalViewCardProps> = ({ entry, onFavorite, onMilestone, onShare }) => {

  const renderMedia = () => {
    if (!entry.media || entry.media.length === 0) return null;

    return (
      <View style={styles.mediaGridContainer}>
        {entry.media.map((item, index) => (
          <View key={index} style={styles.gridItem}>
            <Image source={{ uri: item.url }} style={styles.mediaImage} />
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.card}>
      <Text style={styles.entryText}>{entry.text}</Text>
      {renderMedia()}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  entryText: {
    fontSize: 16,
    fontFamily: 'Poppins',
    color: Colors.black,
    marginBottom: 16,
  },
  mediaGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: -2, // Counteract padding on items
  },
  gridItem: {
    width: '33.333%', // 3 columns
    aspectRatio: 1, // Square items
    padding: 2,
  },
  mediaImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
});

export default JournalViewCard;
