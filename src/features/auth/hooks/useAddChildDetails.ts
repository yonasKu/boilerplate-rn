import { useState } from 'react';
import { Alert, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { addChild } from '../../../services/childService';
import { uploadChildProfileImage } from '../../../services/userService';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

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
    
    const lifestage = params.lifestage as string || 'Soon to be parent';
    const genderOptions = lifestage === 'Soon to be parent' 
        ? ['Boy', 'Girl', "Don't know yet"] 
        : ['Boy', 'Girl'];

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

            await addChild({
                name: childName,
                dateOfBirth: date,
                gender: gender as 'male' | 'female' | 'prefer_not_to_say',
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
