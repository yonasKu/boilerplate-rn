import { useState, useEffect } from 'react';
import { Alert, Platform, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { updateUserProfile, uploadUserProfileImage } from '../../../services/userService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase/firebaseConfig';
import * as ImagePicker from 'expo-image-picker';

export const useAddProfile = () => {
    const router = useRouter();
    const { user, refreshOnboardingStatus } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [lifestage, setLifestage] = useState('Soon to be parent');
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const lifestageOptions = ['Soon to be parent', 'Parent'];

    useEffect(() => {
        const loadUserData = async () => {
            if (user) {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setName(userData.name || '');
                    setEmail(userData.email || user.email || '');
                    setLifestage(userData.lifestage || 'Soon to be parent');
                }
            }
        };
        loadUserData();
    }, [user]);

    const handleSelect = (option: string) => {
        setLifestage(option);
        setIsPickerOpen(false);
    };

    const pickProfileImage = async () => {
        try {
            // Request media library permissions
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            
            if (permissionResult.status !== 'granted') {
                Alert.alert(
                    'Permission Required',
                    'Please allow access to your photos to upload a profile picture. You can enable this in Settings > Privacy > Photos > SproutBook.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Open Settings', onPress: () => Platform.OS === 'ios' && Linking.openURL('app-settings:') }
                    ]
                );
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
                base64: false,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setIsUploadingImage(true);
                const imageUri = result.assets[0].uri;
                
                if (user) {
                    const downloadURL = await uploadUserProfileImage(user.uid, imageUri);
                    setProfileImage(downloadURL);
                }
                
                setIsUploadingImage(false);
            }
        } catch (error) {
            console.error('Error picking profile image:', error);
            Alert.alert('Error', 'Failed to upload profile image. Please try again.');
            setIsUploadingImage(false);
        }
    };

    const handleContinue = async () => {
        if (!name.trim()) {
            Alert.alert('Name Required', 'Please enter your name.');
            return;
        }
        setIsLoading(true);
        try {
            await updateUserProfile(user!.uid, { name, lifestage });
            await refreshOnboardingStatus();
            router.push({
                pathname: '/(auth)/add-child-details',
                params: { lifestage }
            });
        } catch (error) {
            Alert.alert('Update Failed', 'Could not update your profile.');
        } finally {
            setIsLoading(false);
        }
    };

    return {
        // State
        name,
        setName,
        email,
        setEmail,
        lifestage,
        setLifestage,
        profileImage,
        setProfileImage,
        isPickerOpen,
        setIsPickerOpen,
        isLoading,
        isUploadingImage,
        lifestageOptions,
        
        // Functions
        handleSelect,
        pickProfileImage,
        handleContinue
    };
};
