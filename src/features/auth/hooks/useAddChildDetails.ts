import { useState, useEffect } from 'react';
import { Alert, Platform, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { addChild } from '../../../services/childService';
import { uploadChildProfileImage, updateJournalSettings, uploadJournalImage, getUserProfile } from '../../../services/userService';
import * as ImagePicker from 'expo-image-picker';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase/firebaseConfig';

export const useAddChildDetails = () => {
    const router = useRouter();
    const { user, refreshOnboardingStatus } = useAuth();

    // Multi-child rows and journal-level state
    const [childrenRows, setChildrenRows] = useState<Array<{ name: string; date: Date | null; dueDate: string; gender: string; imageUri?: string }>>([
        { name: '', date: null, dueDate: '', gender: '', imageUri: undefined },
    ]);
    const [activeDatePickerIndex, setActiveDatePickerIndex] = useState<number | null>(null);
    const [openGenderPickerIndex, setOpenGenderPickerIndex] = useState<number | null>(null);
    const [journalImage, setJournalImage] = useState<string | null>(null);
    const [journalName, setJournalName] = useState('');
    const [lifestage, setLifestage] = useState<string>('Soon to be parent');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploadingJournalImage, setIsUploadingJournalImage] = useState(false);

    // Fetch user's life stage
    useEffect(() => {
        const fetchUserLifeStage = async () => {
            if (user?.uid) {
                try {
                    const profile = await getUserProfile(user.uid);
                    if (profile?.lifestage) {
                        let stage = profile.lifestage as string;
                        if (stage === 'Soon-to-be parent') stage = 'Soon to be parent';
                        if (stage !== 'Parent' && stage !== 'Soon to be parent') stage = 'Soon to be parent';
                        setLifestage(stage);
                    }
                } catch (e) {
                    console.warn('Failed to fetch user profile for lifestage:', e);
                }
            }
        };
        fetchUserLifeStage();
    }, [user?.uid]);

    const genderOptions = lifestage === 'Soon to be parent'
        ? ['Boy', 'Girl', "Don't know yet"]
        : ['Boy', 'Girl', 'Prefer not to say'];

    const handleGenderSelect = (rowIndex: number, option: string) => {
        setChildrenRows(rows => rows.map((r, i) => i === rowIndex ? { ...r, gender: option } : r));
        setOpenGenderPickerIndex(null);
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }

        if (selectedDate) {
            if (Platform.OS === 'ios') {
                setShowDatePicker(false);
            }

            try {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                if (lifestage === 'Parent' && selectedDate > today) {
                    Alert.alert('Invalid Date', 'Birth date cannot be in the future. Please select a valid birth date.');
                    return;
                } else if (lifestage === 'Soon to be parent' && selectedDate < today) {
                    Alert.alert('Invalid Date', 'Due date cannot be in the past. Please select a valid due date.');
                    return;
                }

                const formattedDate = selectedDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                });
                if (activeDatePickerIndex !== null) {
                    setChildrenRows(rows => rows.map((r, i) => i === activeDatePickerIndex ? { ...r, dueDate: formattedDate, date: selectedDate } : r));
                }
            } catch (error) {
                console.error('Error handling date change:', error);
                Alert.alert('Error', 'Failed to process date selection. Please try again.');
            }
        } else if (event.type === 'dismissed') {
            setShowDatePicker(false);
        }
    };

    const openDatePicker = (index: number) => {
        setActiveDatePickerIndex(index);
        setShowDatePicker(true);
    };

    const pickJournalImage = async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (permissionResult.status !== 'granted') {
                Alert.alert(
                    'Permission Required',
                    'Please allow access to your photos to upload a child picture. You can enable this in Settings > Privacy > Photos > SproutBook.',
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
                setIsUploadingJournalImage(true);
                const imageUri = result.assets[0].uri;
                setJournalImage(imageUri);
                setIsUploadingJournalImage(false);
            }
        } catch (error) {
            console.error('Error picking journal image:', error);
            Alert.alert('Error', 'Failed to select image. Please try again.');
            setIsUploadingJournalImage(false);
        }
    };

    const pickRowImage = async (rowIndex: number) => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (permissionResult.status !== 'granted') {
                Alert.alert(
                    'Permission Required',
                    'Please allow access to your photos to upload a child picture. You can enable this in Settings > Privacy > Photos > SproutBook.',
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
                const imageUri = result.assets[0].uri;
                setChildrenRows(rows => rows.map((r, i) => i === rowIndex ? { ...r, imageUri } : r));
            }
        } catch (error) {
            console.error('Error picking child row image:', error);
            Alert.alert('Error', 'Failed to select image. Please try again.');
        }
    };

    const handleContinue = async () => {
        if (!user) {
            Alert.alert('Error', 'User not authenticated');
            return;
        }

        const trimmedRows = childrenRows.map(r => ({ ...r, name: r.name.trim() }));
        const validRows = trimmedRows.filter(r => r.name && r.date);
        if (validRows.length === 0) {
            Alert.alert('Error', 'Please enter at least one child with a name and date');
            return;
        }

        setIsLoading(true);
        try {
            // 1) Save journal settings at user level
            if (journalName && user?.uid) {
                await updateJournalSettings(user.uid, { journalName });
            }

            // 2) Save journal image
            if (journalImage && user?.uid) {
                try {
                    await uploadJournalImage(user.uid, journalImage);
                } catch (e) {
                    console.warn('Failed to upload journal image, continuing with child creation', e);
                }
            }

            // 3) Process children sequentially
            for (const row of validRows) {
                let firestoreGender: 'Boy' | 'Girl' | "Don't know yet" | 'prefer_not_to_say';
                if (row.gender === 'Boy') {
                    firestoreGender = 'Boy';
                } else if (row.gender === 'Girl') {
                    firestoreGender = 'Girl';
                } else if (row.gender === 'Prefer not to say') {
                    firestoreGender = 'prefer_not_to_say';
                } else {
                    firestoreGender = "Don't know yet";
                }

                const childId = await addChild({
                    name: row.name,
                    dateOfBirth: row.date as Date,
                    gender: firestoreGender as any,
                }, user.uid);

                if (row.imageUri) {
                    const profileImageUrl = await uploadChildProfileImage(childId, row.imageUri);
                    if (profileImageUrl) {
                        const childRef = doc(db, 'children', childId);
                        await updateDoc(childRef, {
                            profileImageUrl,
                            updatedAt: new Date(),
                        });
                    }
                }
            }

            await refreshOnboardingStatus();
            router.replace('/(main)/(tabs)/journal');
        } catch (error) {
            console.error('Error adding child:', error);
            Alert.alert('Error', 'Failed to add child. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return {
        // State
        childrenRows,
        setChildrenRows,
        activeDatePickerIndex,
        setActiveDatePickerIndex,
        openGenderPickerIndex,
        setOpenGenderPickerIndex,
        journalImage,
        setJournalImage,
        journalName,
        setJournalName,
        lifestage,
        showDatePicker,
        isLoading,
        isUploadingJournalImage,
        genderOptions,

        // Functions
        handleGenderSelect,
        onDateChange,
        openDatePicker,
        pickJournalImage,
        pickRowImage,
        handleContinue,
    };
};
