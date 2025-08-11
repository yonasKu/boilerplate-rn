import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, TextInput, Image, StatusBar, Alert, ActivityIndicator } from 'react-native';
import ScreenHeader from '../../../components/ui/ScreenHeader';
import { getAuth, updateProfile } from 'firebase/auth';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { uploadUserProfileImage, deleteUserProfileImage } from '../../../services/userService';
import { ProfileAvatar } from '../../../components/ProfileAvatar';
import { Colors } from '../../../theme/colors';
import { Button } from '../../../components/Button';

const MyProfileScreen = () => {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [lifestage, setLifestage] = useState('');
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const lifestageOptions = ['Soon to be parent', 'Parent'];

    const handleSelect = (option: string) => {
        setLifestage(option);
        setIsPickerOpen(false);
    };

    const pickProfileImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Required', 'Please allow access to your photos to upload a profile picture.');
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
                        const profileData = userDoc.data();
                        setName(profileData.name || '');
                        setEmail(profileData.email || user.email || '');
                        setLifestage(profileData.lifestage || '');
                        setProfileImage(profileData.profileImageUrl || null);
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

    const handleSaveChanges = async () => {
        setIsLoading(true);
        if (user) {
            try {
                // Update Firestore user profile
                const { doc, setDoc } = await import('firebase/firestore');
                const { db } = await import('@/lib/firebase/firebaseConfig');
                
                const userDocRef = doc(db, 'users', user.uid);
                await setDoc(userDocRef, {
                    name: name.trim(),
                    email: email.trim(),
                    lifestage: lifestage,
                    updatedAt: new Date()
                }, { merge: true });
                
                console.log('Profile updated successfully');
                // Optionally, you can show a success message to the user
            } catch (error) {
                console.error('Error updating profile:', error);
                // Optionally, show an error message to the user
            }
        }
        setIsLoading(false);
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#F9F9F9" />
            <ScreenHeader title="My Profile" />
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.avatarContainer}>
                    <TouchableOpacity onPress={pickProfileImage} style={styles.avatar}>
                        <ProfileAvatar
                            imageUrl={profileImage}
                            name={name || 'User'}
                            size={120}
                            textSize={40}
                        />
                        {isUploadingImage && (
                            <View style={styles.uploadingContainer}>
                                <ActivityIndicator size="small" color="#5D9275" />
                            </View>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={pickProfileImage} style={styles.editIconContainer}>
                        <Image source={require('../../../assets/images/Pen_Icon.png')} style={styles.editIcon} />
                    </TouchableOpacity>
                </View>

                <Text style={styles.label}>Name<Text style={styles.asterisk}>*</Text></Text>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="your name"
                        placeholderTextColor="#A9A9A9"
                        value={name}
                        onChangeText={setName}
                    />
                </View>

                <Text style={styles.label}>Email<Text style={styles.asterisk}>*</Text></Text>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="your email"
                        placeholderTextColor="#A9A9A9"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>

                <Text style={styles.label}>Lifestage<Text style={styles.asterisk}>*</Text></Text>
                <View style={styles.pickerWrapper}>
                    <TouchableOpacity style={styles.inputContainer} onPress={() => setIsPickerOpen(!isPickerOpen)}>
                        <Text style={styles.pickerText}>{lifestage}</Text>
                        <Image source={require('../../../assets/images/Chevron_Down.png')} style={styles.arrowIcon} />
                    </TouchableOpacity>
                    {isPickerOpen && (
                        <View style={styles.optionsContainer}>
                            {lifestageOptions.map((option) => (
                                <TouchableOpacity key={option} style={styles.optionItem} onPress={() => handleSelect(option)}>
                                    {lifestage === option ? (
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
                        title="Save Changes"
                        onPress={handleSaveChanges}
                        loading={isLoading}
                        disabled={isLoading}
                        size="large"
                    />
                </View>
            </ScrollView>
        </View>
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
        marginVertical: 20,
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
        bottom: -15,
        right: '32%',
    },
    editIcon: {
        width: 50,
        height: 50,
    },
    uploadingContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderRadius: 55,
    },
    label: {
        color: Colors.darkGrey,
        marginBottom: 8,
        fontSize: 16,
        fontWeight: '500',
    },
    asterisk: {
        color: Colors.error,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.lightGrey,
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 55,
        marginBottom: 20,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: Colors.darkGrey,
    },
    pickerWrapper: {
        marginBottom: 20,
        position: 'relative',
    },
    pickerText: {
        flex: 1,
        fontSize: 16,
        color: Colors.darkGrey,
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
    footer: {
        flex: 1,
        justifyContent: 'flex-end',
        paddingBottom: 20,
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
        fontWeight: '600',
    },
});

export default MyProfileScreen;
