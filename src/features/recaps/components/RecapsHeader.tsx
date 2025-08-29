import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/theme';

const RecapsHeader = () => {
  const router = useRouter();

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={styles.headerTitle}>Recaps</Text>
      </View>
      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/(main)/notifications')}>
          <Ionicons name="notifications-outline" size={22} color={Colors.darkGrey} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/(main)/settings')}>
          <Ionicons name="settings-outline" size={22} color={Colors.darkGrey} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGrey,
    backgroundColor: Colors.background,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.black,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerButton: {
    padding :4, 
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.lightGrey,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default RecapsHeader;
