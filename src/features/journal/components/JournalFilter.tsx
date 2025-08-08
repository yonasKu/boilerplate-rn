import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface JournalFilterProps {
  onAgePress: () => void;
  onFilterChange: (filter: string) => void;
  activeFilter: string;
}

const JournalFilter: React.FC<JournalFilterProps> = ({ onAgePress, onFilterChange, activeFilter }) => {
  const FILTERS = ['All', 'Favorites', 'Milestones', 'Age'];

  const handleFilterPress = (filter: string) => {
    if (filter === 'Age') {
      onAgePress();
    } else {
      onFilterChange(filter);
    }
  };

  return (
    <View style={styles.container}>
      {FILTERS.map((filter) => (
        <TouchableOpacity
          key={filter}
          style={[styles.chip, activeFilter === filter && styles.activeChip]}
          onPress={() => handleFilterPress(filter)}
        >
          <Text style={[styles.chipText, activeFilter === filter && styles.activeChipText]}>
            {filter}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  activeChip: {
    backgroundColor: '#6D9C74',
    borderColor: '#6D9C74',
  },
  chipText: {
    color: '#333333',
    fontWeight: '500',
  },
  activeChipText: {
    color: '#FFFFFF',
  },
});

export default JournalFilter;
