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
    borderRadius: 18,
    borderWidth: 0,
    borderColor: 'transparent',
    paddingVertical: 10,
    paddingHorizontal: 10,
    elevation: 6,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    width: 160,
    zIndex: 1100,
  },
  dropdownItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 20,
  },
  itemText: {
    fontSize: 16,
    color: Colors.grey,
  },
  itemTextSelected: {
    color: Colors.grey,
    fontWeight: '600',
  },
  separator: {
    height: 8,
    backgroundColor: 'transparent',
  },
  activeDropdownItem: {
    borderRadius: 20,
    backgroundColor: Colors.lightPink,
    borderWidth: 0,
  },
});

export default TimelineDropdown;
