import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useJournal } from '@/hooks/useJournal';
import { Colors } from '@/theme';

type DayStatus = 'checked' | 'filled' | 'empty';

interface WeekDay {
  day: string;
  date: Date;
  status: DayStatus;
  isToday: boolean;
}

interface WeekProgressData {
  days: WeekDay[];
  currentWeek: string;
  totalEntries: number;
  missedDays: number;
  completedDays: number;
}

const Day = ({ day, status, isToday, date, onPress, selected }: { day: string; status: DayStatus; isToday: boolean; date: Date; onPress?: (date: Date) => void; selected?: boolean }) => {
  return (
    <TouchableOpacity style={styles.dayContainer} activeOpacity={0.8} onPress={() => onPress?.(date)}>
      <Text style={[styles.dayText, isToday && styles.todayText]}>{day}</Text>
      <View style={[
        styles.statusCircle,
        styles[status],
        selected ? styles.selected : null,
      ]}>
        {status === 'checked' && <Ionicons name="checkmark" size={14} color="#5D9275" />}
      </View>
    </TouchableOpacity>
  );
};

interface WeekNavigatorProps {
  onDayPress?: (date: Date) => void;
  selectedDate?: Date | null;
}

const WeekNavigator: React.FC<WeekNavigatorProps> = ({ onDayPress, selectedDate }) => {
  const { entries } = useJournal();
  const [weekData, setWeekData] = useState<WeekProgressData>({
    days: [],
    currentWeek: '',
    totalEntries: 0,
    missedDays: 0,
    completedDays: 0
  });

  useEffect(() => {
    calculateWeekProgress();
  }, [entries]);

  const calculateWeekProgress = () => {
    const now = new Date();
    const weekStart = getStartOfWeek(now); // Sunday
    const weekEnd = getEndOfWeek(now); // Saturday
    
    const weekDays = getDaysInWeek(weekStart);
    
    const days: WeekDay[] = weekDays.map(date => {
      const dayEntries = entries.filter(entry => 
        entry.createdAt && isSameDayNative(entry.createdAt.toDate(), date)
      );
      
      let status: DayStatus = 'empty';
      if (isTodayNative(date)) {
        status = 'filled';
      } else if (dayEntries.length > 0) {
        status = 'checked';
      }
      
      return {
        day: getDayName(date),
        date,
        status,
        isToday: isTodayNative(date)
      };
    });

    const completedDays = days.filter(day => day.status !== 'empty').length;
    const missedDays = days.filter(day => 
      day.status === 'empty' && day.date < now && !isTodayNative(day.date)
    ).length;

    setWeekData({
      days,
      currentWeek: formatDateRange(weekStart, weekEnd),
      totalEntries: entries.length,
      missedDays,
      completedDays
    });
  };

  return (
    <View style={styles.container}>
      {weekData.days.map((item) => (
        <Day 
          key={item.date.toISOString()} 
          day={item.day} 
          status={item.status} 
          isToday={item.isToday}
          date={item.date}
          onPress={onDayPress}
          selected={selectedDate ? isSameDayNative(selectedDate, item.date) : false}
        />
      ))}
    </View>
  );
};

// Native date utility functions
const getStartOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
};

const getEndOfWeek = (date: Date): Date => {
  const start = getStartOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return end;
};

const getDaysInWeek = (startDate: Date): Date[] => {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(startDate);
    day.setDate(startDate.getDate() + i);
    days.push(day);
  }
  return days;
};

const isSameDayNative = (date1: Date, date2: Date): boolean => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};

const isTodayNative = (date: Date): boolean => {
  return isSameDayNative(date, new Date());
};

const getDayName = (date: Date): string => {
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  return days[date.getDay()];
};

const formatDateRange = (start: Date, end: Date): string => {
  const formatDate = (date: Date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  };
  return `${formatDate(start)} - ${formatDate(end)}`;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.white,
  },
  dayContainer: {
    alignItems: 'center',
    gap: 8,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.mediumGrey,
  },
  todayText: {
    color: Colors.primary,
  },
  statusCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.offWhite,
  },
  empty: {
    borderWidth: 1,
    borderColor: Colors.white,
  },
  checked: {
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  filled: {
    backgroundColor: Colors.primary,
  },
  selected: {
    backgroundColor: Colors.primary,
  },
});

export default WeekNavigator;
