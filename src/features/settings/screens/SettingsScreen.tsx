import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '../../../components/ui/ScreenHeader';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'expo-router';

type SettingsOption = {
  icon: any;
  text: string;
};

const settingsOptions: SettingsOption[] = [
  { icon: require('../../../assets/images/people_icon.png'), text: 'Child Profiles' },
  { icon: require('../../../assets/images/user.png'), text: 'Partner access' },
  { icon: require('../../../assets/images/heart.png'), text: 'Refer a friend' },
  { icon: require('../../../assets/images/profile_Icon.png'), text: 'Account settings' },
  { icon: require('../../../assets/images/receipt-discount_icon.png'), text: 'Gift cards' },
  { icon: require('../../../assets/images/Share_icon.png'), text: 'Family sharing' },
];

const SettingsScreen = () => {
  const { signOut, user } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Fetch actual user profile from Firestore
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        try {
          const { doc, getDoc } = await import('firebase/firestore');
          const { db } = await import('@/lib/firebase/firebaseConfig');
          
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            setUserProfile(userDoc.data());
          }
          setLoadingProfile(false);
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setLoadingProfile(false);
        }
      } else {
        setLoadingProfile(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScreenHeader title="Settings" />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>

        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <Image
              source={require('../../../assets/images/sampleProfile.png')}
              style={styles.profileImage}
            />
            <TouchableOpacity style={styles.editIconContainer} onPress={() => router.push('/profile')}>
              <Image source={require('../../../assets/images/edit-2_icon.png')} style={styles.editIcon} />
            </TouchableOpacity>
          </View>
          <Text style={styles.profileName}>
            {loadingProfile ? 'Loading...' : (userProfile?.name || user?.email || 'User')}
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          {settingsOptions.map((option, index) => (
            <TouchableOpacity key={index} style={styles.optionRow} onPress={() => {
                if (option.text === 'Child Profiles') {
                  router.push('/child-profiles');
                } else if (option.text === 'Account settings') {
                  router.push('/account-settings');
                } else if (option.text === 'Partner access') {
                  router.push('/partner-access');
                } else if (option.text === 'Refer a friend') {
                  router.push('/refer-a-friend');
                }
              }}>
              <View style={styles.iconBackground}>
                <Image source={option.icon} style={styles.optionIcon} />
              </View>
              <Text style={styles.optionText}>{option.text}</Text>
              <Image source={require('../../../assets/images/Chevron_Down.png')} style={styles.chevronIcon} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 60, // Add padding to ensure scroll
  },
  profileSection: {
    alignItems: 'center',
    marginVertical: 32,
    paddingHorizontal: 20,
  },
  profileImageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#E8F5E9',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#5D9275',
    borderRadius: 12,
    padding: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  editIcon: {
    width: 14,
    height: 14,
    tintColor: '#FFFFFF',
    resizeMode: 'contain',
  },
  profileName: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#2F4858',
  },
  optionsContainer: {
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  iconBackground: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    flex: 1,
    marginLeft: 16,
    fontSize: 16,
    color: '#2F4858',
    fontWeight: '400',
  },
  optionIcon: {
    width: 20,
    height: 20,
    tintColor: '#5D9275',
  },
  chevronIcon: {
    width: 16,
    height: 16,
    tintColor: '#2F4858',
    transform: [{ rotate: '-90deg' }],
  },
  logoutButton: {
    marginHorizontal: 20,
    marginTop: 40,
    marginBottom: 32,
    paddingVertical: 16,
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE5E5',
  },
  logoutButtonText: {
    color: '#E53E3E',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SettingsScreen;
