import { Tabs } from 'expo-router';
import React from 'react';
import CustomTabBar from '../../../components/ui/CustomTabBar';

export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="home"
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: 'Journal',
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

    </Tabs>
  );
}
