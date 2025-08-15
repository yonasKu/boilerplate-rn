import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, ActivityIndicator, SafeAreaView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '../../../components/ui/ScreenHeader';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import { getUserProfile, UserProfile } from '../../../services/userService';
import { Colors } from '../../../theme/colors';

interface AccordionSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

const AccordionSection: React.FC<AccordionSectionProps> = ({ title, children, defaultExpanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <View style={styles.section}>
      <TouchableOpacity style={styles.sectionHeader} onPress={() => setIsExpanded(!isExpanded)}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Feather name={isExpanded ? 'chevron-up' : 'chevron-down'} size={24} color={Colors.mediumGrey} />
      </TouchableOpacity>
      {isExpanded && <View style={styles.sectionContent}>{children}</View>}
    </View>
  );
};

interface ReminderRowProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  isLast?: boolean;
}

const ReminderRow: React.FC<ReminderRowProps> = ({ label, value, onValueChange, isLast = false }) => {
  return (
    <View style={[styles.row, isLast && styles.rowLast]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch
        trackColor={{ false: '#E9E9EA', true: Colors.primary }}
        thumbColor={Colors.white}
        ios_backgroundColor="#E9E9EA"
        onValueChange={onValueChange}
        value={value}
      />
    </View>
  );
};

const InfoRow: React.FC<{ label: string; value: string; isLast?: boolean }> = ({ label, value, isLast = false }) => (
  <View style={[styles.row, isLast && styles.rowLast]}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue}>{value}</Text>
  </View>
);

const AccountSettingsScreen = () => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const [reminders, setReminders] = useState({
    dailyEntries: true,
    comments: false,
    likes: true,
    weeklyRecaps: true,
    monthlyRecaps: true,
  });

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const profile = await getUserProfile(user.uid);
        setUserProfile(profile);
        // Here you would also fetch and set reminder preferences
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [user]);

  const handleReminderChange = (key: keyof typeof reminders) => {
    setReminders(prev => ({ ...prev, [key]: !prev[key] }));
    // Here you would typically save the new settings to your backend
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]} >
      <ScreenHeader title="Account settings" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <AccordionSection title="Security" defaultExpanded={true}>
          <InfoRow label="Email" value={user?.email || 'user@gmail.com'} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Password</Text>
            <TouchableOpacity style={styles.passwordContainer} onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
              <Text style={styles.rowValue}>{isPasswordVisible ? 'password123' : '••••••••'}</Text>
              <Feather name={isPasswordVisible ? 'eye' : 'eye-off'} size={20} color={Colors.mediumGrey} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </View>
        </AccordionSection>

        <AccordionSection title="Notifications" defaultExpanded={true}>
          <ReminderRow label="Daily Entries" value={reminders.dailyEntries} onValueChange={() => handleReminderChange('dailyEntries')} />
          <ReminderRow label="Comments" value={reminders.comments} onValueChange={() => handleReminderChange('comments')} />
          <ReminderRow label="Likes" value={reminders.likes} onValueChange={() => handleReminderChange('likes')} />
          <ReminderRow label="Weekly Recaps" value={reminders.weeklyRecaps} onValueChange={() => handleReminderChange('weeklyRecaps')} />
          <ReminderRow label="Monthly Recaps" value={reminders.monthlyRecaps} onValueChange={() => handleReminderChange('monthlyRecaps')} isLast={true} />
        </AccordionSection>

        <AccordionSection title="Manage Subscription" defaultExpanded={true}>
          <InfoRow label="Current Plan" value="Sproutbook Monthly" />
          <InfoRow label="Next Billing Date" value="22 August 2025" />
          <InfoRow label="Amount" value="5.99/mo" isLast={true} />
        </AccordionSection>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
  },
  scrollContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  section: {
    marginVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EDEDED',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.darkGrey,
    fontFamily: 'Poppins-SemiBold',
  },
  sectionContent: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowLabel: {
    fontSize: 16,
    color: Colors.darkGrey,
    fontFamily: 'Poppins-Regular',
  },
  rowValue: {
    fontSize: 16,
    color: Colors.mediumGrey,
    fontFamily: 'Poppins-Regular',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default AccountSettingsScreen;
