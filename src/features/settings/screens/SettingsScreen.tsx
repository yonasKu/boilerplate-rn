import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import ScreenHeader from '../../../components/ui/ScreenHeader';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'expo-router';
import { ProfileAvatar } from '../../../components/ProfileAvatar';
import { Colors } from '../../../theme/colors';

type SettingsOption = {
  icon: any;
  text: string;
};

const settingsOptions: SettingsOption[] = [
  { icon: require('../../../assets/images/tabler_mood-kid_icon.png'), text: 'Child Profiles' },
  { icon: require('../../../assets/images/link_icon.png'), text: 'Partner access' },
  { icon: require('../../../assets/images/refer_icon.png'), text: 'Refer a friend' },
  { icon: require('../../../assets/images/settings_icon.png'), text: 'Account settings' },
  { icon: require('../../../assets/images/gift_icon.png'), text: 'Gift a free year' },
  { icon: require('../../../assets/images/people_icon.png'), text: 'Family sharing' },
  { icon: 'log-out', text: 'Logout' }, // Using correct Feather icon name
];

const SettingsScreen = () => {
  const { signOut, user } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace('/(auth)/welcome');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

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
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      <ScreenHeader title="Settings" />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>

        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <ProfileAvatar
              imageUrl={userProfile?.profileImageUrl}
              name={userProfile?.name || user?.email || 'User'}
              size={80}
              textSize={32}
            />
            <TouchableOpacity style={styles.editIconContainer} onPress={() => router.push('/profile')}>
              <Image source={require('../../../assets/images/Pen_Icon.png')} style={styles.editIcon} />
            </TouchableOpacity>
          </View>
          <Text style={styles.profileName}>
            {loadingProfile ? 'Loading...' : (userProfile?.name || user?.email || 'User')}
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          {settingsOptions.map((option, index) => (
            <TouchableOpacity key={index} style={styles.optionRow} onPress={() => {
                if (option.text === 'Logout') {
                  handleLogout();
                } else if (option.text === 'Child Profiles') {
                  router.push('/child-profiles');
                } else if (option.text === 'Partner access') {
                  router.push('/partner-access');
                } else if (option.text === 'Refer a friend') {
                  router.push('/refer-a-friend');
                } else if (option.text === 'Account settings') {
                  router.push('/account-settings');
                } else if (option.text === 'Family sharing') {
                  router.push('/family-sharing');
                } else if (option.text === 'Test Notifications') {
                  router.push('/notification-test');
                } else {
                  console.log('Navigate to:', option.text);
                }
              }}>
              <View style={styles.iconBackground}>
                {typeof option.icon === 'string' ? (
                  <Feather name={option.icon as any} size={20} color={Colors.grey} />
                ) : (
                  <Image source={option.icon} style={styles.optionIcon} />
                )}
              </View>
              <Text style={styles.optionText}>{option.text}</Text>
              <Image source={require('../../../assets/images/Chevron_Down.png')} style={styles.chevronIcon} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
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
    borderColor: Colors.accent,
  },
  editIconContainer: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    // backgroundColor: Colors.primary,
    // borderRadius: 12,
    padding: 4,
    // borderWidth: 2,
    // borderColor: Colors.white,
  },
  editIcon: {
    width: 14,
    height: 14,
    tintColor: Colors.white,
    resizeMode: 'contain',
  },
  profileName: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.darkGrey,
  },
  optionsContainer: {
    marginHorizontal: 20,
    backgroundColor: Colors.white,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  iconBackground: {
    width: 44,
    height: 44,
    borderRadius: 22,
    padding: 4,
    backgroundColor: Colors.lightPink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    flex: 1,
    marginLeft: 16,
    fontSize: 16,
    color: Colors.darkGrey,
    fontWeight: '400',
  },
  optionIcon: {
    width: 20,
    height: 20,
    tintColor: Colors.grey,
    resizeMode: 'contain',
  },
  chevronIcon: {
    width: 16,
    height: 16,
    tintColor: Colors.black,
    transform: [{ rotate: '-90deg' }],
  },

});

export default SettingsScreen;
