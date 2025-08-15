import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const FILTERS = ['All', 'Favorites', 'Milestones', 'Age'];

const FilterBar = () => {
  const [activeFilter, setActiveFilter] = useState('All');

  return (
    <View style={styles.container}>
      {FILTERS.map((filter) => (
        <TouchableOpacity
          key={filter}
          style={[styles.chip, activeFilter === filter && styles.activeChip]}
          onPress={() => setActiveFilter(filter)}
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
    backgroundColor: '#6D9C74', // A green color from the image
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

export default FilterBar;
