import React from 'react';
import { View, StyleSheet, StatusBar, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppHeader from '../../../components/AppHeader';
import FilterTabs from '../components/FilterTabs';
import RecapCard from '../components/RecapCard';

const sampleData = [
  {
    id: '1',
    title: "Sienna's First Steps",
    date: 'Week of July 15',
    image: require('../../../assets/images/sample_parents2.png'), // Replace with your actual image
  },
  {
    id: '2',
    title: 'Camping Adventure',
    date: 'Week of July 15',
    image: require('../../../assets/images/sample_recap.png'), // Replace with your actual image
  },
];

const RecapsScreen = () => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <AppHeader />
      <FilterTabs />
      <FlatList
        data={sampleData}
        renderItem={({ item }) => <RecapCard {...item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
});

export default RecapsScreen;
