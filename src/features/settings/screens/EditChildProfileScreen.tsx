import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, StatusBar, Platform, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../../../context/AuthContext';
import { getChild, updateChild, ChildInput } from '../../../services/childService';
import { uploadChildProfileImage } from '../../../services/userService';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../../theme/colors';
import { Button } from '../../../components/Button';
import ScreenHeader from '../../../components/ui/ScreenHeader';

const EditChildProfileScreen = () => {
    const router = useRouter();
    const { id: childId } = useLocalSearchParams<{ id: string }>();
    const { user } = useAuth();
    const insets = useSafeAreaInsets();
    
    // Validate child ID parameter
    if (!childId || typeof childId !== 'string') {
        Alert.alert('Error', 'Invalid child profile ID');
        router.back();
        return null;
    }

    const [childName, setChildName] = useState('');
    const [date, setDate] = useState(new Date());
    const [dueDate, setDueDate] = useState('');
    const [gender, setGender] = useState('');
    const [childImage, setChildImage] = useState<string | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [originalChild, setOriginalChild] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [lifestage, setLifestage] = useState<'Parent' | 'Soon to be parent'>('Parent');

    const genderOptions = lifestage === 'Soon to be parent' 
        ? ['Boy', 'Girl', "Don't know yet"] 
        : ['Boy', 'Girl', "Prefer not to say"];

    // Safe date formatting utility - consistent with ChildProfilesScreen
    const formatDateDisplay = (dateInput: any): string => {
        if (!dateInput) return '';
        
        try {
            let date: Date;
            
            // Handle Firebase Timestamp objects
            if (dateInput.toDate) {
                date = dateInput.toDate();
            } else if (dateInput instanceof Date) {
                date = dateInput;
            } else if (typeof dateInput === 'string' || typeof dateInput === 'number') {
                date = new Date(dateInput);
            } else {
                return '';
            }
            
            // Check if date is valid
            if (isNaN(date.getTime())) {
                return '';
            }
            
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        } catch (error) {
            console.error('Error formatting date:', error);
            return '';
        }
    };

    const fetchChildData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const childData = await getChild(childId);
            if (childData) {
                setChildName(childData.name);
                if (childData.dateOfBirth) {
                    const dob = childData.dateOfBirth instanceof Date 
                        ? childData.dateOfBirth 
                        : new Date(childData.dateOfBirth);
                    setDate(dob);
                    setDueDate(formatDateDisplay(childData.dateOfBirth));
                }
                setGender(childData.gender);
                const childDataAny = childData as any;
                setChildImage(childDataAny.profileImageUrl || childData.avatar || null);
                // Determine lifestage based on child's data or current date
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const childDate = childData.dateOfBirth instanceof Date 
                    ? childData.dateOfBirth 
                    : new Date(childData.dateOfBirth);
                setLifestage(childDate > today ? 'Soon to be parent' : 'Parent');
            } else {
                setError('Child profile not found');
            }
        } catch (err) {
            setError('Failed to load child profile');
            console.error('Error loading child:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchChildData();
    }, [childId]);

    const handleSaveChanges = async () => {
        if (!childName.trim()) {
            Alert.alert('Error', 'Please enter a name');
            return;
        }

        if (!gender) {
            Alert.alert('Error', 'Please select a gender');
            return;
        }

        setIsLoading(true);
        try {
            if (!user) {
                Alert.alert('Error', 'User not authenticated');
                router.replace('/(auth)/welcome');
                return;
            }

            // Map UI gender values to ChildInput interface values
            let firestoreGender: 'male' | 'female' | 'prefer_not_to_say';
            if (gender === 'Boy') {
                firestoreGender = 'male';
            } else if (gender === 'Girl') {
                firestoreGender = 'female';
            } else {
                firestoreGender = 'prefer_not_to_say';
            }

            const updateData: Partial<ChildInput> = {
                name: childName,
                dateOfBirth: date,
                gender: firestoreGender,
            };
            
            if (childImage) {
                updateData.profileImageUrl = childImage;
            }
            
            await updateChild(childId, updateData);

            Alert.alert('Success', 'Child profile updated successfully');
            router.back();
        } catch (error) {
            console.error('Error updating child:', error);
            Alert.alert('Error', 'Failed to update child profile');
        } finally {
            setIsLoading(false);
        }
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

            setDate(selectedDate);
            setDueDate(formatDateDisplay(selectedDate));
        }
    };

    const pickChildImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled && result.assets && result.assets[0].uri && typeof childId === 'string') {
            setIsUploadingImage(true);
            const newImageUrl = await uploadChildProfileImage(result.assets[0].uri, childId);
            if (newImageUrl) {
                setChildImage(newImageUrl);
                await updateChild(childId, { avatar: newImageUrl });
            }
            setIsUploadingImage(false);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading child profile...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchChildData}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} >
            <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
            <ScreenHeader 
                title={childName.trim() || 'Edit Child Profile'} 
                onBack={() => router.back()}
            />
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.avatarContainer}>
                    {isUploadingImage ? (
                        <View style={[styles.avatar, styles.uploadingContainer]}>
                            <ActivityIndicator size="large" color={Colors.primary} />
                        </View>
                    ) : (
                        <TouchableOpacity 
                            style={styles.avatar} 
                            onPress={pickChildImage}
                            disabled={isUploadingImage}
                        >
                            {childImage ? (
                                <Image 
                                    source={{ uri: childImage }} 
                                    style={styles.avatarImage}
                                    resizeMode="cover"
                                />
                            ) : (
                                <View style={styles.initialsContainer}>
                                    <Text style={styles.initialsText}>
                                        {childName.trim() ? childName.trim().charAt(0).toUpperCase() : '?'}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
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

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Child's name*</Text>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter child's name"
                            placeholderTextColor={Colors.mediumGrey}
                            value={childName}
                            onChangeText={setChildName}
                            accessibilityLabel="Child's name"
                        />
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>{lifestage === 'Parent' ? "Child's birth date*" : "Baby's due date*"}</Text>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder={`Select ${lifestage === 'Parent' ? 'birth date' : 'due date'}`}
                            placeholderTextColor={Colors.mediumGrey}
                            value={dueDate}
                            onChangeText={setDueDate}
                            editable={false}
                            accessibilityLabel={lifestage === 'Parent' ? "Child's birth date" : "Baby's due date"}
                        />
                        <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                            <Image source={require('../../../assets/images/calendar.png')} style={styles.calendarIcon} />
                        </TouchableOpacity>
                    </View>
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

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Gender*</Text>
                    <View style={styles.pickerWrapper}>
                        <TouchableOpacity style={styles.inputContainer} onPress={() => setIsPickerOpen(!isPickerOpen)}>
                            <Text style={[styles.pickerText, { color: gender ? Colors.black : Colors.mediumGrey }]}>
                                {gender || `Select gender`}
                            </Text>
                            <Image source={require('../../../assets/images/Chevron_Down.png')} style={styles.arrowIcon} />
                        </TouchableOpacity>
                        {isPickerOpen && (
                            <View style={styles.optionsContainer}>
                                {genderOptions.map((option) => (
                                    <TouchableOpacity key={option} style={styles.optionItem} onPress={() => { setGender(option); setIsPickerOpen(false); }}>
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
                </View>

                <View style={styles.footer}>
                    <Button
                        title={isLoading ? 'Saving...' : 'Save Changes'}
                        onPress={handleSaveChanges}
                        loading={isLoading}
                        disabled={isLoading}
                        style={styles.continueButton}
                    />
                </View>
            </ScrollView>
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
    initialsContainer: {
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    initialsText: {
        fontSize: 36,
        fontWeight: 'bold',
        color: Colors.white,
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
    addPhotoText: {
        fontSize: 14,
        color: Colors.primary,
        fontWeight: '500',
        marginTop: 8,
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
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 16,
        fontFamily: 'Poppins',
        color: Colors.darkGrey,
        marginBottom: 8,
        fontWeight: '500',
    },
    footer: {
        flex: 1,
        justifyContent: 'flex-end',
        paddingBottom: 20,
        marginTop: 20,
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
        marginBottom: 20,
        width: '100%',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.white,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 18,
        color: Colors.error,
        textAlign: 'center',
        marginBottom: 20,
        fontFamily: 'Poppins',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: Colors.darkGrey,
    },
    uploadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    retryButton: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: '600',
    },

});

export default EditChildProfileScreen;
