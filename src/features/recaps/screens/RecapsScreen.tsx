import React from 'react';
import { View, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/theme';
import AppHeader from '../../../components/AppHeader';
import { RecapCard } from '../../journal/components/RecapCard';
import RecapFilter from '../../journal/components/RecapFilter';

const RecapsScreen = () => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <AppHeader />
      <ScrollView>
        <RecapFilter />
        <RecapCard />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});

export default RecapsScreen;

