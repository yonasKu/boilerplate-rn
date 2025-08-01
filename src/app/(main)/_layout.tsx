import { Tabs } from 'expo-router';
import React from 'react';
import CustomTabBar from '../../components/ui/CustomTabBar';

export default function MainLayout() {
  return (
    <Tabs
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen
        name="journal"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="recaps"
        options={{
          title: 'Recaps',
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
        }}
      />
      <Tabs.Screen
        name="new"
        options={{
          title: 'New',
        }}
      />
      <Tabs.Screen
        name="settings"
        // This hides the screen from the tab bar
        options={{ href: null }}
      />
    </Tabs>
  );
}

