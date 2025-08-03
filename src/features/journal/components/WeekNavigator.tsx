import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type DayStatus = 'checked' | 'filled' | 'empty';

const weekData: { day: string; status: DayStatus }[] = [
  { day: 'SUN', status: 'checked' },
  { day: 'MON', status: 'checked' },
  { day: 'TUE', status: 'empty' },
  { day: 'WEN', status: 'checked' },
  { day: 'THU', status: 'filled' },
  { day: 'FRI', status: 'empty' },
  { day: 'SAT', status: 'empty' },
];

const Day = ({ day, status, isToday }: { day: string; status: DayStatus; isToday: boolean }) => {
  return (
    <View style={styles.dayContainer}>
      <Text style={[styles.dayText, isToday && styles.todayText]}>{day}</Text>
      <View style={[styles.statusCircle, styles[status]]}>
        {status === 'checked' && <Ionicons name="checkmark" size={14} color="#5D9275" />}
      </View>
    </View>
  );
};

const WeekNavigator = () => {
  return (
    <View style={styles.container}>
      {weekData.map((item) => (
        <Day key={item.day} day={item.day} status={item.status} isToday={item.day === 'SAT'} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dayContainer: {
    alignItems: 'center',
    gap: 8,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A0AEC0',
  },
  todayText: {
    color: '#5D9275',
  },
  statusCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  checked: {
    borderWidth: 1,
    borderColor: '#5D9275',
  },
  filled: {
    backgroundColor: '#5D9275',
  },
});

export default WeekNavigator;
