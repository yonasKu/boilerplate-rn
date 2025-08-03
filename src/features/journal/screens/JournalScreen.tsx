import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import WeekNavigator from '../components/WeekNavigator';

const JournalScreen = () => {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user } = useAuth();
    const [isWeekNavigatorVisible, setIsWeekNavigatorVisible] = useState(false);
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
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom, paddingLeft: insets.left, paddingRight: insets.right }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerLeft} onPress={() => setIsWeekNavigatorVisible(!isWeekNavigatorVisible)}>
                    <Image source={require('../../../assets/images/sampleProfile.png')} style={styles.avatar} />
                    <Text style={styles.headerTitle}>
                        {loadingProfile ? 'Loading...' : (userProfile?.name || user?.email || 'User')}
                    </Text>
                    <Ionicons name={isWeekNavigatorVisible ? 'chevron-up' : 'chevron-down'} size={20} color="#2F4858" />
                </TouchableOpacity>
                <View style={styles.headerRight}>
                    <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/(main)/notifications')}>
                        <Ionicons name="notifications-outline" size={24} color="#2F4858" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/(main)/settings')}>
                        <Ionicons name="settings-outline" size={24} color="#2F4858" />
                    </TouchableOpacity>
                </View>
            </View>
            {isWeekNavigatorVisible && <WeekNavigator />}
            <View style={styles.content}>
                <Image source={require('../../../assets/images/leaf_home.png')} style={styles.mainImage} />
                <Text style={styles.promptText}>Let's start your first memory</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2F4858',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    headerButton: {
        padding: 4,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mainImage: {
        width: 150,
        height: 150,
        resizeMode: 'contain',
    },
    promptText: {
        marginTop: 24,
        fontSize: 16,
        color: '#A9A9A9',
    },
});

export default JournalScreen;

