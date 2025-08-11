import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TimelineDropdown, { TimelineOption } from './TimelineDropdown';

interface JournalFilterProps {
  onAgePress: () => void;
  onFilterChange: (filter: string) => void;
  activeFilter: string;
  onTimelineChange: (timeline: TimelineOption) => void;
  activeTimeline: TimelineOption;
}

const JournalFilter: React.FC<JournalFilterProps> = ({ 
  onAgePress, 
  onFilterChange, 
  activeFilter, 
  onTimelineChange,
  activeTimeline,
}) => {
  const FILTERS = ['All', 'Favorites', 'Milestones', 'Age'];
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const allFilterRef = useRef<View | null>(null);

  const handleFilterPress = (filter: string) => {
    if (filter === 'Age') {
      onAgePress();
    } else if (filter === 'All') {
      onFilterChange('All'); // Ensure 'All' filter is active
      allFilterRef.current?.measureInWindow((x: number, y: number, _width: number, height: number) => {
        setDropdownPosition({ top: y + height, left: x });
        setDropdownVisible(true);
      });
    } else {
      onFilterChange(filter);
    }
  };

  const handleTimelineSelect = (timeline: TimelineOption) => {
    onTimelineChange(timeline);
    setDropdownVisible(false);
  };

  return (
    <View style={styles.container}>
      {FILTERS.map((filter) => (
        <TouchableOpacity
          ref={filter === 'All' ? allFilterRef : null}
          key={filter}
          style={[styles.chip, activeFilter === filter && styles.activeChip]}
          onPress={() => handleFilterPress(filter)}
        >
          <View style={styles.chipContent}>
            <Text style={[styles.chipText, activeFilter === filter && styles.activeChipText]}>
              {filter === 'All' && activeTimeline !== 'All' ? activeTimeline : filter}
            </Text>
            {filter === 'Age' && (
              <Ionicons 
                name="chevron-down" 
                size={14} 
                color={activeFilter === filter ? '#FFFFFF' : '#333333'} 
                style={styles.chevronIcon}
              />
            )}
          </View>
        </TouchableOpacity>
      ))}

      {dropdownVisible && (
        <Modal
          transparent={true}
          animationType="none"
          visible={dropdownVisible}
          onRequestClose={() => setDropdownVisible(false)}
        >
          <Pressable style={styles.backdrop} onPress={() => setDropdownVisible(false)} />
          <TimelineDropdown
            options={['All', 'Weekly', 'Monthly']}
            selectedValue={activeTimeline}
            onSelect={handleTimelineSelect}
            onClose={() => setDropdownVisible(false)}
            position={dropdownPosition}
          />
        </Modal>
      )}
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
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    minWidth: 80, // Ensure a minimum width for the filter buttons
    alignItems: 'center', // Center text horizontally
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
