import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '../../../theme/colors';

const filterOptions = ['All', 'Weekly', 'Monthly', 'Favorites', 'Date'];

type RecapFilterProps = {
  onDateSelected?: (date: Date) => void;
};

const RecapFilter: React.FC<RecapFilterProps> = ({ onDateSelected }) => {
  const [activeFilter, setActiveFilter] = React.useState('All');
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);

  return (
    <View style={styles.container}>

      <View style={styles.filters}>
        {filterOptions.map(option => (
          <TouchableOpacity
            key={option}
            style={[styles.filterButton, activeFilter === option && styles.activeFilter]}
            onPress={() => {
              if (option === 'Date') {
                setShowDatePicker(true);
              } else {
                setActiveFilter(option);
              }
            }}
          >
            <Text style={[styles.filterText, activeFilter === option && styles.activeText]}>
              {option === 'Date' && selectedDate
                ? `Date • ${selectedDate.toLocaleDateString()}`
                : option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
          onChange={(_e, date) => {
            if (date) {
              setSelectedDate(date);
              setActiveFilter('Date');
              onDateSelected?.(date);
            }
            if (Platform.OS === 'android') {
              setShowDatePicker(false);
            }
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.black,
    marginBottom: 16,
  },
  filters: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: Colors.lightGrey,
  },
  activeFilter: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    color: Colors.darkGrey,
    fontWeight: 'normal',
  },
  activeText: {
    color: Colors.white,
  },
});

export default RecapFilter;
