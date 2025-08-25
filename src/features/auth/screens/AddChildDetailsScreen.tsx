import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, TextInput, Image, Platform, Alert, ActivityIndicator, StatusBar, Linking } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { addChild } from '../../../services/childService';
import { uploadChildProfileImage, getUserProfile } from '../../../services/userService';
import * as ImagePicker from 'expo-image-picker';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase/firebaseConfig';
import { Colors } from '../../../theme/colors';
import { Button } from '../../../components/Button';

const AddChildDetailsScreen = () => {
    const router = useRouter();
    const { user, refreshOnboardingStatus } = useAuth();
    const [date, setDate] = useState(new Date());
    const [childName, setChildName] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [gender, setGender] = useState('');
    const [childImage, setChildImage] = useState<string | null>(null);
    const [lifestage, setLifestage] = useState<string>('Soon to be parent');
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Fetch user's actual life stage from Firebase
    useEffect(() => {
        const fetchUserLifeStage = async () => {
            if (user?.uid) {
                const userProfile = await getUserProfile(user.uid);
                if (userProfile?.lifestage) {
                    setLifestage(userProfile.lifestage);
                }
            }
        };
        fetchUserLifeStage();
    }, [user]);

    const genderOptions = lifestage === 'Soon to be parent'
        ? ['Boy', 'Girl', "Don't know yet"]
        : ['Boy', 'Girl', "Prefer not to say"];

    const handleSelect = (option: string) => {
        setGender(option);
        setIsPickerOpen(false);
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        // For Android, the picker is modal and closes on its own.
        // For iOS, we need to manually hide it.
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }

        if (selectedDate) {
            // A date was selected. Update state and close the picker on iOS.
            if (Platform.OS === 'ios') {
                setShowDatePicker(false);
            }

            try {
                const today = new Date();
                today.setHours(0, 0, 0, 0); // Reset time to start of day

                // Validate based on lifestage
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
                setDueDate(formattedDate);
                setDate(selectedDate);
            } catch (error) {
                console.error('Error handling date change:', error);
                Alert.alert('Error', 'Failed to process date selection. Please try again.');
            }
        } else if (event.type === 'dismissed') {
            // This handles cancellation on iOS
            setShowDatePicker(false);
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

            // Map UI label to canonical stored value
            // Stored set: 'Boy' | 'Girl' | "Don't know yet" | 'prefer_not_to_say'
            let firestoreGender: 'Boy' | 'Girl' | "Don't know yet" | 'prefer_not_to_say';
            if (gender === 'Boy') {
                firestoreGender = 'Boy';
            } else if (gender === 'Girl') {
                firestoreGender = 'Girl';
            } else if (gender === 'Prefer not to say') {
                firestoreGender = 'prefer_not_to_say';
            } else {
                firestoreGender = "Don't know yet";
            }

            // Create child document first
            const childId = await addChild({
                name: childName,
                dateOfBirth: date,
                gender: firestoreGender as any, // Matches ChildInput union in childService
            }, user.uid);

            // Upload child image after child document is created
            if (childImage) {
                profileImageUrl = await uploadChildProfileImage(childId, childImage);

                // Update child document with profile image URL
                if (profileImageUrl) {
                    const childRef = doc(db, 'children', childId);
                    await updateDoc(childRef, {
                        profileImageUrl: profileImageUrl,
                        updatedAt: new Date()
                    });
                }
            }

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

    const openDatePicker = () => {
        setShowDatePicker(true);
    };

    const pickChildImage = async () => {
        try {
            // Request media library permissions
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

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.avatarContainer}>
                    <TouchableOpacity onPress={pickChildImage} disabled={isUploadingImage}>
                        {isUploadingImage ? (
                            <View style={[styles.avatar, styles.uploadingContainer]}>
                                <ActivityIndicator size="large" color="#4A90E2" />
                            </View>
                        ) : (
                            <View style={styles.avatar}>
                                <Image
                                    source={childImage ? { uri: childImage } : require('../../../assets/images/placeholder profile.png')}
                                    style={styles.avatarImage}
                                />
                            </View>
                        )}
                    </TouchableOpacity>
                    {childImage ? (
                        <TouchableOpacity
                            style={styles.editIconContainer}
                            onPress={pickChildImage}
                            disabled={isUploadingImage}
                        >
                            <Image source={require('../../../assets/images/Pen_Icon.png')} style={styles.editIcon} />
                        </TouchableOpacity>
                    ) : (
                        <Text style={styles.addPhotoText}>Add photo</Text>
                    )}
                </View>

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Child's name*"
                        placeholderTextColor={Colors.mediumGrey}
                        value={childName}
                        onChangeText={setChildName}
                        accessibilityLabel="Child's name"
                    />
                </View>

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder={`${lifestage === 'Parent' ? "Child's birthday" : "Baby's due date"}*`}
                        placeholderTextColor={Colors.mediumGrey}
                        value={dueDate}
                        onChangeText={setDueDate}
                        editable={false}
                        accessibilityLabel={lifestage === 'Parent' ? "Child's birthday" : "Baby's due date"}
                    />
                    <TouchableOpacity onPress={openDatePicker}>
                        <Image source={require('../../../assets/images/calendar.png')} style={styles.calendarIcon} />
                    </TouchableOpacity>
                </View>

                {showDatePicker && (
                    <DateTimePicker
                        testID="dateTimePicker"
                        value={date}
                        mode={'date'}
                        is24Hour={true}
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={onDateChange}
                        minimumDate={lifestage === 'Soon to be parent' ? new Date() : undefined}
                        maximumDate={lifestage === 'Parent' ? new Date() : undefined}
                        style={Platform.OS === 'ios' ? { backgroundColor: Colors.white } : undefined}
                    />
                )}

                <View style={styles.pickerWrapper}>
                    <TouchableOpacity style={styles.inputContainer} onPress={() => setIsPickerOpen(!isPickerOpen)}>
                        <Text style={[styles.pickerText, { color: gender ? Colors.black : Colors.mediumGrey }]}>
                            {gender || `Baby Gender`}
                        </Text>
                        <Image source={require('../../../assets/images/Chevron_Down.png')} style={styles.arrowIcon} />
                    </TouchableOpacity>
                    {isPickerOpen && (
                        <View style={styles.optionsContainer}>
                            {genderOptions.map((option) => (
                                <TouchableOpacity key={option} style={styles.optionItem} onPress={() => handleSelect(option)}>
                                    {gender === option ? (
                                        <View style={styles.selectedOptionButton}>
                                            <Text style={styles.selectedOptionText}>{option}</Text>
                                        </View>
                                    ) : (
                                        <Text style={styles.optionText}>{option}</Text>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                <View style={styles.footer}>
                    <Button
                        title={isLoading ? 'Saving...' : 'Continue'}
                        onPress={handleContinue}
                        loading={isLoading}
                        disabled={isLoading}
                        style={styles.continueButton}
                    />
                </View>
            </ScrollView>

            {/* Success Modal */}
            {showSuccessModal && (
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.successBadge}>
                            <Text style={styles.successBadgeText}>✓</Text>
                        </View>
                        <Text style={styles.modalTitle}>Child profile added</Text>

                        <TouchableOpacity
                            style={[styles.modalButton, styles.primaryButton]}
                            onPress={handleStartJournaling}
                            accessibilityLabel="Start journaling"
                        >
                            <Text style={styles.primaryButtonText}>Start Journaling</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.modalButton, styles.secondaryButton]}
                            onPress={handleAddAnotherChild}
                            accessibilityLabel="Add another child"
                        >
                            <Text style={styles.secondaryButtonText}>Add Another Child</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    scrollContainer: {
        flexGrow: 1,
        paddingHorizontal: 20,
    },
    avatarContainer: {
        alignItems: 'center',
        marginVertical: 40,

    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: Colors.white,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarImage: {
        width: 110,
        height: 110,
        borderRadius: 55,
    },
    editIconContainer: {
        position: 'absolute',
        bottom: -4,
        right: '32%',
    },
    editIcon: {
        width: 50,
        height: 50,
    },
    label: {
        color: Colors.black,
        marginBottom: 8,
        fontSize: 16,
        fontWeight: '500',
    },
    asterisk: {
        color: Colors.secondary,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.lightGrey,
        borderRadius: 25,
        height: 55,
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: Colors.blacktext,
        height: 50,
        paddingVertical: 6
    },
    dateText: {
        flex: 1,
        fontSize: 16,
        color: Colors.blacktext,
        fontFamily: 'Poppins-Regular',
    },
    pickerWrapper: {
        marginBottom: 20,
        position: 'relative',
        width: '100%',
    },
    pickerText: {
        flex: 1,
        fontSize: 16,
        color: Colors.blacktext,
        width: '100%',
        fontFamily: 'Poppins-Regular',
        paddingVertical: 6
    },
    arrowIcon: {
        width: 20,
        height: 20,
        tintColor: Colors.mediumGrey,
    },
    optionsContainer: {
        position: 'absolute',
        top: '100%',
        width: '100%',
        backgroundColor: Colors.white,
        borderRadius: 16,
        marginTop: 8,
        borderWidth: 1,
        borderColor: Colors.lightGrey,
        padding: 8,
        zIndex: 1,
        elevation: 3,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    optionItem: {
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    optionText: {
        fontSize: 16,
        fontFamily: 'Poppins-Regular',
        color: Colors.darkGrey,
    },
    selectedOptionButton: {
        backgroundColor: Colors.lightPink,
        borderRadius: 12,
    },
    selectedOptionText: {
        color: Colors.primary,
        fontWeight: '600',
        padding: 12,
        fontFamily: 'Poppins-SemiBold',
    },
    calendarIcon: {
        width: 22,
        height: 22,
        tintColor: Colors.grey,
    },
    footer: {
        flex: 1,
        justifyContent: 'flex-end',
        paddingBottom: 20,
        marginTop: 20, // Add margin top to ensure it doesn't overlap
    },
    button: {
        backgroundColor: Colors.primary,
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
    },
    buttonDisabled: {
        backgroundColor: Colors.mediumGrey,
        opacity: 0.7,
    },
    buttonText: {
        color: Colors.white,
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'Poppins-Regular',
    },
    continueButton: {
        marginBottom: 20,
        width: '100%',
    },
    addPhotoText: {
        fontSize: 14,
        color: Colors.primary,
        fontWeight: '500',
        marginTop: 8,
        fontFamily: 'Poppins-Regular',
    },
    uploadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.lightGrey,
    },
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        elevation: 5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 24,
        marginHorizontal: 20,
        alignItems: 'center',
        shadowColor: Colors.black,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        width: '80%',
        maxWidth: 320,
    },
    successBadge: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.primary + '20',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    successBadgeText: {
        color: Colors.primary,
        fontSize: 28,
        fontWeight: '700',
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.darkGrey,
        marginTop: 16,
        marginBottom: 24,
        textAlign: 'center',
        fontFamily: 'Poppins-Regular',
    },
    modalButton: {
        width: '100%',
        paddingVertical: 18,
        borderRadius: 30, // Pill shape
        alignItems: 'center',
        marginBottom: 12,
    },
    primaryButton: {
        backgroundColor: Colors.primary,
    },
    secondaryButton: {
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.lightGrey,
    },
    primaryButtonText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Poppins-Regular',
    },
    secondaryButtonText: {
        color: Colors.black,
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Poppins-Regular',
    },
});

export default AddChildDetailsScreen;
