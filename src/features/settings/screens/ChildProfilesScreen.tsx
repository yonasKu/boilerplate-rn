import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '../../../components/ui/ScreenHeader';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { getUserChildren, Child } from '../../../services/childService';

type ChildProfile = {
  name: string;
  id?: string;
  dateOfBirth?: Date;
  gender?: string;
  avatar?: string;
};

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

const ChildProfilesScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChildren = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const childrenData = await getUserChildren(user.uid);
        setChildren(childrenData.map(child => ({
          name: child.name,
          id: child.id,
          dateOfBirth: child.dateOfBirth,
          gender: child.gender,
          avatar: child.avatar
        })));
      } catch (error) {
        console.error('Error fetching children:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChildren();
  }, [user]);

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#5D9275" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScreenHeader title="Child Profiles" />
      <ScrollView style={styles.scrollView}>
        <View style={styles.listContainer}>
          {children.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No child profiles yet</Text>
              <Text style={styles.emptySubtext}>Add your first child to get started</Text>
            </View>
          ) : (
            children.map((child) => (
              <View key={child.id} style={styles.profileRow}>
                <View style={styles.childInfo}>
                  <Text style={styles.profileName}>{child.name}</Text>
                  {child.dateOfBirth && (
                    <Text style={styles.childDetails}>
                      {formatDate(child.dateOfBirth)}
                    </Text>
                  )}
                </View>
                <TouchableOpacity>
                  <Image source={require('../../../assets/images/edit-2_icon.png')} style={styles.editIcon} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/(auth)/add-child-details')}
        >
          <Text style={styles.addButtonText}>Add Child Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  listContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    borderStyle: 'dotted',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  profileName: {
    fontSize: 16,
    color: '#2F4858',
  },
  editIcon: {
    width: 20,
    height: 20,
    tintColor: '#5D9275',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
    backgroundColor: '#FFFFFF',
  },
  addButton: {
    backgroundColor: '#5D9275',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#2F4858',
    marginBottom: 8,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666666',
  },
  childInfo: {
    flex: 1,
  },
  childDetails: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
});

export default ChildProfilesScreen;
