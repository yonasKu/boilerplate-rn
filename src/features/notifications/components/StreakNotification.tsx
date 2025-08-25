import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/theme';

interface Notification {
  id: string;
  type: 'recap_love' | 'comment' | 'reminder' | 'streak' | 'recap_ready';
  date: string;
  isRead: boolean;
  body?: string;
  title?: string;
}

const StreakNotification = ({ item }: { item: Notification }) => {
  const iconContainerStyle = [styles.iconContainer, { backgroundColor: item.isRead ? Colors.offWhite : Colors.accent }];

  return (
    <TouchableOpacity style={styles.itemContainer}>
      <View style={iconContainerStyle}>
        <Ionicons name="book-outline" size={24} color={Colors.darkGrey} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.text}>Don't forget today's entry! Let's keep the streak going! Write today's memory now</Text>
        <Text style={styles.date}>{item.date}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  itemContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    marginLeft: 12,
    flex: 1,
  },
  text: {
    fontSize: 15,
    color: Colors.darkGrey,
    lineHeight: 20,
    fontFamily: 'Poppins-Regular',
  },
  date: {
    fontSize: 13,
    color: Colors.mediumGrey,
    marginTop: 4,
    fontFamily: 'Poppins-Regular',
  },
});

export default StreakNotification;
