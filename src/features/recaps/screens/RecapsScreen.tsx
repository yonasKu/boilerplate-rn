import React from 'react';
import { View, StyleSheet, StatusBar, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/theme';

import AppHeader from '@/components/AppHeader';
import { RecapCard } from '../components/RecapCard';

const RecapsScreen = () => {
  const insets = useSafeAreaInsets();
  const recaps = [1, 2, 3]; // Sample data for multiple cards

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <AppHeader />
      <FlatList
        data={recaps}
        renderItem={() => <RecapCard />}
        keyExtractor={(item) => item.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 24 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.offWhite,
  },
});

export default RecapsScreen;
