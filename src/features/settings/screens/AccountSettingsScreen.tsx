import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '../../../components/ui/ScreenHeader';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import { getUserProfile, UserProfile } from '../../../services/userService';
import ReminderToast from '../../../components/ui/ReminderToast';

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
        <Feather name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color="#2F4858" />
      </TouchableOpacity>
      {isExpanded && <View style={styles.sectionContent}>{children}</View>}
    </View>
  );
};

interface ReminderRowProps {
  label: string;
  value: boolean;
  onValueChange: () => void;
}

// Safe date formatting utility
const formatDate = (dateInput: any): string => {
  if (!dateInput) return '';
  
  try {
    let date: Date;
    
    // Handle Firebase Timestamp objects
    if (dateInput.toDate) {
      date = dateInput.toDate();
    } else if (dateInput instanceof Date) {
      date = dateInput;
    } else if (typeof dateInput === 'string' || typeof dateInput === 'number') {
      date = new Date(dateInput);
    } else {
      return '';
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '';
    }
    
    return date.toLocaleDateString();
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

const ReminderRow: React.FC<ReminderRowProps> = ({ label, value, onValueChange }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Switch
      trackColor={{ false: '#E0E0E0', true: '#5D9275' }}
      thumbColor={'#FFFFFF'}
      ios_backgroundColor="#E0E0E0"
      onValueChange={onValueChange}
      value={value}
    />
  </View>
);

const AccountSettingsScreen = () => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  
  const [reminders, setReminders] = useState({
    dailyEntries: false,
    comment: true,
    likes: true,
    monthlyRecaps: false,
    weeklyRecaps: true,
  });

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const profile = await getUserProfile(user.uid);
        setUserProfile(profile);
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  const handleReminderChange = (key: keyof typeof reminders) => {
    const newValue = !reminders[key];
    setReminders(prev => ({ ...prev, [key]: newValue }));

    if (newValue) {
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
      }, 4000); // Hide toast after 4 seconds
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#5D9275" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Account settings" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        
        <AccordionSection title="Security" defaultExpanded={true}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Email</Text>
            <Text style={styles.rowValue}>{user?.email || 'Not provided'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Password</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.rowValue}>••••••••</Text>
              <TouchableOpacity style={{ marginLeft: 8 }}>
                <Feather name="eye-off" size={16} color="#888" />
              </TouchableOpacity>
            </View>
          </View>
        </AccordionSection>

        <AccordionSection title="Profile" defaultExpanded={true}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Name</Text>
            <Text style={styles.rowValue}>{userProfile?.name || 'Not provided'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Lifestage</Text>
            <Text style={styles.rowValue}>{userProfile?.lifestage || 'Not set'}</Text>
          </View>
        </AccordionSection>

        <AccordionSection title="Notifications" defaultExpanded={true}>
          <ReminderRow label="Push notifications" value={reminders.dailyEntries} onValueChange={() => handleReminderChange('dailyEntries')} />
        </AccordionSection>

        <AccordionSection title="Manage Subscription" defaultExpanded={true}>
           <View style={styles.row}>
            <Text style={styles.rowLabel}>Current Plan</Text>
            <Text style={styles.rowValue}>{userProfile?.subscription?.plan || 'Free'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Status</Text>
            <Text style={[styles.rowValue, { 
              color: userProfile?.subscription?.status === 'active' ? '#5D9275' : '#E74C3C' 
            }]}>
              {userProfile?.subscription?.status || 'Inactive'}
            </Text>
          </View>
          {userProfile?.subscription?.trialEndDate && (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Trial Ends</Text>
              <Text style={styles.rowValue}>
                {formatDate(userProfile.subscription.trialEndDate)}
              </Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Member Since</Text>
            <Text style={styles.rowValue}>
              {formatDate(userProfile?.createdAt) || 'Loading...'}
            </Text>
          </View>
        </AccordionSection>

      </ScrollView>
      {showToast && <ReminderToast onClose={() => setShowToast(false)} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2F4858',
  },
  sectionContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  rowLabel: {
    fontSize: 14,
    color: '#555',
  },
  rowValue: {
    fontSize: 14,
    color: '#2F4858',
    fontWeight: '500',
  },
});

export default AccountSettingsScreen;
