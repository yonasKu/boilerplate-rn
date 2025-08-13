import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../../../theme/colors';

const filterOptions = ['All', 'Weekly', 'Monthly', 'Favorites'];

const RecapFilter = () => {
  const [activeFilter, setActiveFilter] = React.useState('All');

  return (
    <View style={styles.container}>

      <View style={styles.filters}>
        {filterOptions.map(option => (
          <TouchableOpacity
            key={option}
            style={[styles.filterButton, activeFilter === option && styles.activeFilter]}
            onPress={() => setActiveFilter(option)}
          >
            <Text style={[styles.filterText, activeFilter === option && styles.activeText]}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>
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
