import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

interface ReminderToastProps {
  onClose: () => void;
}

const ReminderToast: React.FC<ReminderToastProps> = ({ onClose }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
            <View style={styles.iconBackground}>
                <Image source={require('../../assets/images/profile-2user.png')} style={styles.icon} />
            </View>
            <Text style={styles.title}>Reminder</Text>
        </View>
        <Text style={styles.time}>Now</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.mainText}>Your weekly Recap is ready!</Text>
        <Text style={styles.subText}>Click here to view and share</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60, // Adjust as needed
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBackground: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E8F5E9', // Light green background
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  icon: {
    width: 16,
    height: 16,
    tintColor: '#4CAF50',
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  time: {
    fontSize: 12,
    color: '#4CAF50',
  },
  content: {
    alignItems: 'flex-start',
  },
  mainText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2F4858',
    marginBottom: 4,
  },
  subText: {
    fontSize: 14,
    color: '#555',
  },
});

export default ReminderToast;
