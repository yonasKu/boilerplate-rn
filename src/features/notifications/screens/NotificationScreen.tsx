import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '../../../components/ui/ScreenHeader';

type Notification = {
  id: string;
  title: string;
  description: string;
  time: string;
};

const notifications: Notification[] = [
  {
    id: '1',
    title: 'Grandma loved your post',
    description: 'Your recent memory entry got 3...',
    time: '2:55 PM',
  },
  {
    id: '2',
    title: 'Auntie Sarah commented',
    description: '"Such a sweet smile! Growing so f...',
    time: '7:48 AM',
  },
  {
    id: '3',
    title: 'Journal reminder',
    description: 'Looks like you missed a day this w...',
    time: '10:30 AM',
  },
  {
    id: '4',
    title: 'New memory added',
    description: 'You added 5 new photos to "First...',
    time: '9:15 AM',
  },
  {
    id: '5',
    title: "Don't forget today's entry",
    description: "Let's keep the streak going! Write...",
    time: '6:00 PM',
  },
  {
    id: '6',
    title: 'Dad liked your post',
    description: 'Your entry "First Tooth!" got a ❤️',
    time: '11:20 AM',
  },
];

const NotificationScreen = () => {
  const insets = useSafeAreaInsets();

  const renderItem = ({ item }: { item: Notification }) => (
    <View style={styles.notificationItem}>
      <View style={styles.iconBackground}>
        <Image source={require('../../../assets/images/profile-2user.png')} style={styles.notificationIcon} />
      </View>
      <View style={styles.notificationTextContainer}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationDescription}>{item.description}</Text>
      </View>
      <Text style={styles.notificationTime}>{item.time}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScreenHeader title="Notification" />
      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  iconBackground: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  notificationIcon: {
    width: 22,
    height: 22,
    tintColor: '#5D9275',
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2F4858',
  },
  notificationDescription: {
    fontSize: 14,
    color: '#5D9275',
    marginTop: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#A0AEC0',
    marginLeft: 8,
  },
});

export default NotificationScreen;
