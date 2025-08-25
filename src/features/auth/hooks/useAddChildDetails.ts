import { useState, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { addChild } from '../../../services/childService';
import { uploadChildProfileImage } from '../../../services/userService';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase/firebaseConfig';

export const useAddChildDetails = () => {
    const router = useRouter();
    const { user, refreshOnboardingStatus } = useAuth();
    const params = useLocalSearchParams();
    const [childName, setChildName] = useState('');
    const [date, setDate] = useState(new Date());
    const [dueDate, setDueDate] = useState('');
    const [gender, setGender] = useState("Don't know yet");
    const [childImage, setChildImage] = useState<string | null>(null);
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    
    // Resolve lifestage from route params or fetch from Firestore as fallback
    const [lifestage, setLifestage] = useState<string>('');

    useEffect(() => {
        const resolveLifestage = async () => {
            const paramStage = (params.lifestage as string) || '';
            if (paramStage) {
                setLifestage(paramStage);
                return;
            }
            // Fallback: fetch from user profile
            if (user?.uid) {
                try {
                    const snap = await getDoc(doc(db, 'users', user.uid));
                    if (snap.exists()) {
                        const data = snap.data() as any;
                        let stage = data?.lifestage || '';
                        // Normalize value to match UI expectations
                        if (stage === 'Soon-to-be parent') stage = 'Soon to be parent';
                        if (stage !== 'Parent' && stage !== 'Soon to be parent') {
                            stage = 'Soon to be parent';
                        }
                        setLifestage(stage);
                        return;
                    }
                } catch (e) {
                    console.warn('Failed to fetch user lifestage, defaulting:', e);
                }
            }
            setLifestage('Soon to be parent');
        };
        resolveLifestage();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.uid]);

    const genderOptions = (lifestage || 'Soon to be parent') === 'Soon to be parent' 
        ? ['Boy', 'Girl', "Don't know yet"] 
        : ['Boy', 'Girl', 'Prefer not to say'];

    const handleSelect = (option: string) => {
        setGender(option);
        setIsPickerOpen(false);
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');

        if (selectedDate) {
            const formattedDate = selectedDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
            setDueDate(formattedDate);
        }
    };

    const openDatePicker = () => {
        setShowDatePicker(true);
    };

    const pickChildImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Required', 'Please allow access to your photos to upload a child picture.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled) {
                setIsUploadingImage(true);
                const imageUri = result.assets[0].uri;
                setChildImage(imageUri);
                setIsUploadingImage(false);
            }
        } catch (error) {
            console.error('Error picking child image:', error);
            Alert.alert('Error', 'Failed to select child image. Please try again.');
            setIsUploadingImage(false);
        }
    };

    const handleContinue = async () => {
        if (!user) {
            Alert.alert('Error', 'User not authenticated');
            return;
        }

        if (!childName.trim()) {
            Alert.alert('Error', 'Please enter your child\'s name');
            return;
        }

        setIsLoading(true);
        try {
            let profileImageUrl: string | undefined = undefined;
            
            // Upload child image if selected
            if (childImage) {
                const childId = `temp_${Date.now()}`; // Temporary ID for upload
                profileImageUrl = await uploadChildProfileImage(childId, childImage);
            }

            // Map UI label to canonical stored value
            // Stored set: 'Boy' | 'Girl' | "Don't know yet" | 'prefer_not_to_say'
            const firestoreGender = (gender === 'Boy'
                ? 'Boy'
                : gender === 'Girl'
                    ? 'Girl'
                    : gender === 'Prefer not to say'
                        ? 'prefer_not_to_say'
                        : "Don't know yet") as 'Boy' | 'Girl' | 'prefer_not_to_say' | "Don't know yet";

            await addChild({
                name: childName,
                dateOfBirth: date,
                gender: firestoreGender,
                ...(profileImageUrl && { profileImageUrl })
            }, user.uid);

            await refreshOnboardingStatus();
            console.log('Child added successfully');
            setShowSuccessModal(true);
        } catch (error) {
            console.error('Error adding child:', error);
            Alert.alert('Error', 'Failed to add child. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddAnotherChild = () => {
        setShowSuccessModal(false);
        setChildName('');
        setDueDate('');
        setChildImage(null);
        setGender("Don't know yet");
        router.push('/(auth)/add-child-details');
    };

    const handleStartJournaling = () => {
        setShowSuccessModal(false);
        router.replace('/(main)/(tabs)/journal');
    };

    return {
        // State
        childName,
        setChildName,
        date,
        setDate,
        dueDate,
        setDueDate,
        gender,
        setGender,
        childImage,
        setChildImage,
        isPickerOpen,
        setIsPickerOpen,
        showDatePicker,
        setShowDatePicker,
        isLoading,
        isUploadingImage,
        showSuccessModal,
        setShowSuccessModal,
        lifestage,
        genderOptions,
        
        // Functions
        handleSelect,
        onDateChange,
        openDatePicker,
        pickChildImage,
        handleContinue,
        handleAddAnotherChild,
        handleStartJournaling
    };
};
