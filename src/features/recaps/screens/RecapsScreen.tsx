import React, { useState } from 'react';
import { View, StyleSheet, StatusBar, FlatList, Alert, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/theme';

import AppHeader from '@/components/AppHeader';
import { RecapCard } from '../components/RecapCard';
import ShareBottomSheet from '../../journal/components/ShareBottomSheet';
import { useRecaps } from '../hooks/useRecaps';
import { Recap } from '../../../services/aiRecapService';

const RecapsScreen = () => {
  const insets = useSafeAreaInsets();
  const [isShareSheetVisible, setShareSheetVisible] = useState(false);

  const { recaps: rawRecaps, loading } = useRecaps();

  const recaps = rawRecaps.filter(recap => recap.id);

  const handleSharePress = () => {
    setShareSheetVisible(true);
  };

  const handleShareOption = (platform: 'copy' | 'system') => {
    setShareSheetVisible(false);
    Alert.alert('Sharing', `Shared via ${platform}`);
    // Implement actual sharing logic here
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Loading recaps...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <AppHeader />
      <FlatList
        data={recaps}
        renderItem={({ item }) => <RecapCard recap={item as Recap} onShare={handleSharePress} />}
        keyExtractor={(item) => item.id!}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 24 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No recaps yet</Text>
          </View>
        }
      />
      <ShareBottomSheet 
        isVisible={isShareSheetVisible}
        onClose={() => setShareSheetVisible(false)}
        onShare={handleShareOption}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.offWhite,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.mediumGrey,
  },
});

export default RecapsScreen;
