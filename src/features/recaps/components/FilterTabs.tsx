import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/theme';

interface FilterTabsProps {
  onAgePress: () => void;
  onFilterChange: (filter: string) => void;
  activeFilter: string;
  onTimelineChange: (timeline: string) => void;
  activeTimeline: string;
}

const FilterTabs: React.FC<FilterTabsProps> = ({ 
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

  const handleTimelineSelect = (timeline: string) => {
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
          <View style={[styles.dropdown, { top: dropdownPosition.top, left: dropdownPosition.left }]}>
            {['All', 'Weekly', 'Monthly'].map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.dropdownOption,
                  activeTimeline === option && styles.activeDropdownOption,
                ]}
                onPress={() => handleTimelineSelect(option)}
              >
                <Text
                  style={[
                    styles.dropdownOptionText,
                    activeTimeline === option && styles.activeDropdownOptionText,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
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
  dropdown: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    minWidth: 120,
  },
  dropdownOption: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 6,
  },
  dropdownOptionText: {
    fontSize: 16,
    color: Colors.darkGrey,
  },
  activeDropdownOption: {
    backgroundColor: '#CDE4D2',
  },
  activeDropdownOptionText: {
    fontWeight: 'bold',
  },
});

export default FilterTabs;
