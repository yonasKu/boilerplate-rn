import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, TextInput, Image, Platform, Alert, ActivityIndicator } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { addChild } from '../../../services/childService';
import { uploadChildProfileImage } from '../../../services/userService';
import * as ImagePicker from 'expo-image-picker';

const AddChildDetailsScreen = () => {
    const router = useRouter();
    const { user, refreshOnboardingStatus } = useAuth();
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
    
    const params = useLocalSearchParams();
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

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.avatarContainer}>
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
                    <TouchableOpacity 
                        style={styles.editIconContainer}
                        onPress={pickChildImage}
                        disabled={isUploadingImage}
                    >
                        <Image source={require('../../../assets/images/Pen_Icon.png')} style={styles.editIcon} />
                    </TouchableOpacity>
                    <Text style={styles.addPhotoText}>Add photo</Text>
                </View>

                <Text style={styles.label}>Child's Name<Text style={styles.asterisk}>*</Text></Text>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="child's name"
                        placeholderTextColor="#A9A9A9"
                        value={childName}
                        onChangeText={setChildName}
                    />
                </View>

                <Text style={styles.label}>
                    {lifestage === 'Soon to be parent' ? 'Due Date' : 'Birth Date'}<Text style={styles.asterisk}>*</Text>
                </Text>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder={`child's ${lifestage === 'Parent' ? 'birth date' : 'due date'}`}
                        placeholderTextColor="#A9A9A9"
                        value={dueDate}
                        onChangeText={setDueDate}
                        editable={false}
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
                    />
                )}

                <Text style={styles.label}>Gender<Text style={styles.asterisk}>*</Text></Text>
                <View style={styles.pickerWrapper}>
                    <TouchableOpacity style={styles.inputContainer} onPress={() => setIsPickerOpen(!isPickerOpen)}>
                        <Text style={styles.pickerText}>{gender}</Text>
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
                  <TouchableOpacity 
                    style={[styles.button, isLoading && styles.buttonDisabled]} 
                    onPress={handleContinue}
                    disabled={isLoading}
                  >
                      <Text style={styles.buttonText}>{isLoading ? 'Saving...' : 'Continue'}</Text>
                  </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Success Modal */}
            {showSuccessModal && (
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>Child Profile Added!</Text>
                        <Text style={styles.modalSubtitle}>What would you like to do next?</Text>
                        
                        <TouchableOpacity 
                            style={[styles.modalButton, styles.secondaryButton]} 
                            onPress={handleAddAnotherChild}
                        >
                            <Text style={styles.secondaryButtonText}>Add another child</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={[styles.modalButton, styles.primaryButton]} 
                            onPress={handleStartJournaling}
                        >
                            <Text style={styles.primaryButtonText}>Start journaling</Text>
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
        backgroundColor: '#F9F9F9',
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
        backgroundColor: '#E0E0E0',
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
        bottom: -15,
        right: '32%',
    },
    editIcon: {
        width: 50,
        height: 50,
    },
    label: {
        color: '#2F4858',
        marginBottom: 8,
        fontSize: 16,
        fontWeight: '500',
    },
    asterisk: {
        color: '#E58C8A',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 55,
        marginBottom: 20,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#2F4858',
    },
    dateText: {
        flex: 1,
        fontSize: 16,
        color: '#A9A9A9',
    },
    pickerWrapper: {
        marginBottom: 20,
        position: 'relative', // Needed for absolute positioning of options
    },
    pickerText: {
        flex: 1,
        fontSize: 16,
        color: '#2F4858',
    },
    arrowIcon: {
        width: 20,
        height: 20,
        tintColor: '#A9A9A9',
    },
    optionsContainer: {
        position: 'absolute',
        top: '100%',
        right: 0,
        width: 200,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        paddingVertical: 10,
        zIndex: 1,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    optionItem: {
        paddingVertical: 5,
        width: '100%',
        alignItems: 'flex-end', // Align text to the left
        justifyContent: 'center',
        paddingHorizontal: 15, // Adjust padding
    },
    optionText: {
        fontSize: 14,
        color: '#A9A9A9',
        paddingVertical: 10,
    },
    selectedOptionButton: {
        backgroundColor: '#E6F3EE',
        borderRadius: 16,
        paddingVertical: 10,
        paddingHorizontal: 20,
        alignSelf: 'flex-end',
    },
    selectedOptionText: {
        color: '#5D9275',
        fontWeight: '600',
    },
    calendarIcon: {
        width: 24,
        height: 24,
        tintColor: '#A9A9A9',
    },
    footer: {
        flex: 1,
        justifyContent: 'flex-end',
        paddingBottom: 20,
        marginTop: 20, // Add margin top to ensure it doesn't overlap
    },
    button: {
        backgroundColor: '#5D9275',
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
    },
    buttonDisabled: {
        backgroundColor: '#A0A0A0',
        opacity: 0.7,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    addPhotoText: {
        fontSize: 14,
        color: '#6A8A7A',
        fontWeight: '500',
        marginTop: 8,
    },
    uploadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#E0E0E0',
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
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        marginHorizontal: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2F4858',
        marginBottom: 8,
    },
    modalSubtitle: {
        fontSize: 16,
        color: '#666666',
        marginBottom: 24,
        textAlign: 'center',
    },
    modalButton: {
        width: '100%',
        paddingVertical: 12,
        borderRadius: 8,
        marginBottom: 12,
        alignItems: 'center',
    },
    primaryButton: {
        backgroundColor: '#4A90E2',
    },
    secondaryButton: {
        backgroundColor: '#F5F5F5',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButtonText: {
        color: '#2F4858',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default AddChildDetailsScreen;
