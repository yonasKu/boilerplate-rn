import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/theme';

interface JournalFilterProps {
  onAgePress: () => void;
  onFilterChange: (filter: string) => void;
  activeFilter: string;
}

const JournalFilter: React.FC<JournalFilterProps> = ({ 
  onAgePress, 
  onFilterChange, 
  activeFilter,
}) => {
  const FILTERS = ['All', 'Favorites', 'Milestones', 'Age'];

  const handleFilterPress = (filter: string) => {
    if (filter === 'Age') {
      onAgePress();
    } else if (filter === 'All') {
      // Skip the dropdown and just apply 'All' filter directly
      onFilterChange('All');
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
          <View style={styles.chipContent}>
            <Text style={[styles.chipText, activeFilter === filter && styles.activeChipText]}>
              {filter}
            </Text>
            {filter === 'Age' && (
              <Ionicons 
                name="chevron-down" 
                size={14} 
                color={activeFilter === filter ? '#FFFFFF' : Colors.mediumGrey} 
                style={styles.chevronIcon}
              />
            )}
          </View>
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
    backgroundColor: Colors.offWhite,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.offWhite,
    backgroundColor: Colors.white,
    minWidth: 80, // Ensure a minimum width for the filter buttons
    alignItems: 'center', // Center text horizontally
  },
  activeChip: {
    backgroundColor: Colors.white,
    borderColor: Colors.grey,
  },
  chipText: {
    color: Colors.grey,
    fontWeight: '500',
  },
  activeChipText: {
    color: Colors.grey,
  },
  chipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronIcon: {
    marginLeft: 4,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    zIndex: 1000,
  },
});

export default JournalFilter;
