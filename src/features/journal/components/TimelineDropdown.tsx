import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { Colors } from '@/theme/colors';

export type TimelineOption = 'All' | 'Weekly' | 'Monthly';

interface TimelineDropdownProps {
  options: TimelineOption[];
  selectedValue: TimelineOption;
  onSelect: (value: TimelineOption) => void;
  onClose: () => void;
  position: { top: number; left: number };
}

const TimelineDropdown: React.FC<TimelineDropdownProps> = ({ options, selectedValue, onSelect, position }) => {
  return (
    <View style={[styles.dropdown, { top: position.top, left: position.left }]}>
      <FlatList
        data={options}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.dropdownItem, selectedValue === item && styles.activeDropdownItem]}
            onPress={() => onSelect(item)}
          >
            <Text style={[styles.itemText, selectedValue === item && styles.itemTextSelected]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  dropdown: {
    position: 'absolute',
    backgroundColor: Colors.white,
    borderRadius: 16,
    gap: 4,
    padding: 10,
    elevation: 5,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    width: 150,
    zIndex: 1100,
  },
  dropdownItem: {
    alignItems: 'center',
    justifyContent: 'center',  
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  itemText: {
    fontSize: 16,
    color: Colors.darkGrey,
  },
  itemTextSelected: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  separator: {
    height: 1,
    backgroundColor: Colors.lightGrey,
  },
  activeDropdownItem: {
    borderRadius: 25,
    backgroundColor: Colors.accent,
  },
});

export default TimelineDropdown;
