import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, TextInput, Image, Platform, Alert, ActivityIndicator, StatusBar } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { addChild } from '../../../services/childService';
import { uploadChildProfileImage } from '../../../services/userService';
import * as ImagePicker from 'expo-image-picker';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase/firebaseConfig';
import { Colors } from '../../../theme/colors';
import { Button } from '../../../components/Button';

const AddChildDetailsScreen = () => {
    const router = useRouter();
    const { user, refreshOnboardingStatus } = useAuth();
    const [childName, setChildName] = useState('');
    const [date, setDate] = useState(new Date());
    const [dueDate, setDueDate] = useState('');
    const [gender, setGender] = useState('');
    const [childImage, setChildImage] = useState<string | null>(null);
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    
    const params = useLocalSearchParams();
    const lifestage = params.lifestage as string || 'Soon to be parent';
    const genderOptions = lifestage === 'Soon to be parent' 
        ? ['Boy', 'Girl', "Don't know yet"] 
        : ['Boy', 'Girl',"Prefer not to say"];

    const handleSelect = (option: string) => {
        setGender(option);
        setIsPickerOpen(false);
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');

        if (selectedDate) {
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
            
            // Map UI gender values to Firestore rule values
            let firestoreGender: 'Boy' | 'Girl' | "Don't know yet" | "Prefer not to say";
            if (gender === 'Boy') {
                firestoreGender = 'Boy';
            } else if (gender === 'Girl') {
                firestoreGender = 'Girl';
            } else if (gender === "Prefer not to say") {
                firestoreGender = "Prefer not to say";
            } else {
                firestoreGender = "Don't know yet";
            }
            
            // Create child document first
            const childId = await addChild({
                name: childName,
                dateOfBirth: date,
                gender: firestoreGender as any, // Cast to match ChildInput interface
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
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Required', 'Please allow access to your photos to upload a child picture.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
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

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.avatarContainer}>
                    {isUploadingImage ? (
                        <View style={[styles.avatar, styles.uploadingContainer]}>
                            <ActivityIndicator size="large" color={Colors.primary} />
                        </View>
                    ) : (
                        <View style={styles.avatar}>
                            <Image 
                                source={childImage ? { uri: childImage } : require('../../../assets/images/placeholder profile.png')} 
                                style={styles.avatarImage} 
                            />
                        </View>
                    )}
                    <TouchableOpacity 
                        style={styles.editIconContainer}
                        onPress={pickChildImage}
                        disabled={isUploadingImage}
                    >
                        <Image source={require('../../../assets/images/Pen_Icon.png')} style={styles.editIcon} />
                    </TouchableOpacity>
                    <Text style={styles.addPhotoText}>Add photo</Text>
                </View>

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="child's name*"
                        placeholderTextColor={Colors.mediumGrey}
                        value={childName}
                        onChangeText={setChildName}
                        accessibilityLabel="Child's name"
                    />
                </View>

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder={`${lifestage === 'Parent' ? "Child's birth date" : "Baby's due date"}*`}
                        placeholderTextColor={Colors.mediumGrey}
                        value={dueDate}
                        onChangeText={setDueDate}
                        editable={false}
                        accessibilityLabel={lifestage === 'Parent' ? "Child's birth date" : "Baby's due date"}
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
                        display="default"
                        onChange={onDateChange}
                        minimumDate={lifestage === 'Soon to be parent' ? new Date() : undefined}
                        maximumDate={lifestage === 'Parent' ? new Date() : undefined}
                    />
                )}

                <View style={styles.pickerWrapper}>
                    <TouchableOpacity style={styles.inputContainer} onPress={() => setIsPickerOpen(!isPickerOpen)}>
                        <Text style={[styles.pickerText, { color: gender ? Colors.black : Colors.mediumGrey }]}>
                            {gender || `gender*`}
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
                        <Text style={styles.modalTitle}>Child Profile Added</Text>
                        <Text style={styles.modalSubtitle}>Great! You can start journaling memories now or add another child.</Text>

                        <TouchableOpacity 
                            style={[styles.modalButton, styles.primaryButton]} 
                            onPress={handleStartJournaling}
                            accessibilityLabel="Start journaling"
                        >
                            <Text style={styles.primaryButtonText}>Start journaling</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.modalButton, styles.secondaryButton]} 
                            onPress={handleAddAnotherChild}
                            accessibilityLabel="Add another child"
                        >
                            <Text style={styles.secondaryButtonText}>Add another child</Text>
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
        backgroundColor: Colors.lightGrey,
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
        bottom: 15,
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
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 4,
        marginBottom: 16,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: Colors.black,
    },
    dateText: {
        flex: 1,
        fontSize: 16,
        color: Colors.black,
    },
    pickerWrapper: {
        marginBottom: 20,
        position: 'relative',
        width: '100%',
    },
    pickerText: {
        flex: 1,
        fontSize: 16,
        color: Colors.black,
        padding: 10,
        width: '100%',
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
        fontFamily: 'Poppins',
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
    },
    calendarIcon: {
        width: 24,
        height: 24,
        tintColor: Colors.mediumGrey,
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
    },
    continueButton: {
        marginBottom   : 20,
        width: '100%',
    },
    addPhotoText: {
        fontSize: 14,
        color: Colors.primary,
        fontWeight: '500',
        marginTop: 8,
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
        lineHeight: 32,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.black,
        marginBottom: 8,
    },
    modalSubtitle: {
        fontSize: 16,
        color: Colors.mediumGrey,
        marginBottom: 24,
        textAlign: 'center',
    },
    modalButton: {
        width: '100%',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        marginBottom: 12,
        alignItems: 'center',
    },
    primaryButton: {
        backgroundColor: Colors.primary,
    },
    secondaryButton: {
        backgroundColor: Colors.lightGrey,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    primaryButtonText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButtonText: {
        color: Colors.black,
        fontSize: 16,
        fontWeight: '600',
    },
});

export default AddChildDetailsScreen;
