import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { ProfileAvatar } from './ProfileAvatar';

interface AppHeaderProps {
  showBackButton?: boolean;
}

const AppHeader: React.FC<AppHeaderProps> = ({ showBackButton = false }) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

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

  const handleBackPress = () => {
    if (router.canGoBack()) {
      router.back();
    }
  };

  return (
    <View style={[styles.headerContainer]}>
      <View style={styles.leftContainer}>
        {showBackButton ? (
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <View style={styles.backButtonCircle}>
              <Ionicons name="chevron-back" size={22} color="#000" />
            </View>
          </TouchableOpacity>
        ) : (
          <>
            <ProfileAvatar
              imageUrl={userProfile?.profileImageUrl}
              name={userProfile?.name || user?.email || 'User'}
              size={40}
              textSize={16}
            />
            <View>
              <Text style={styles.userName} numberOfLines={1} ellipsizeMode="tail">
                {loadingProfile ? 'Loading...' : (userProfile?.name || user?.email || 'User')}
              </Text>
            </View>
          </>
        )}
      </View>
      <View style={styles.rightContainer}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/(main)/notifications')}>
          <Ionicons name="notifications-outline" size={22} color="#2F4858" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/(main)/settings')}>
          <Ionicons name="settings-outline" size={22} color="#2F4858" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2F4858',
  },
  email: {
    fontSize: 12,
    color: '#666',
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  headerButton: {
    padding :4,  
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AppHeader;
