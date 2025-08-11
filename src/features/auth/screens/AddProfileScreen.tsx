import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, TextInput, Image, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { useAddProfile } from '../hooks/useAddProfile';
import { Colors } from '../../../theme/colors';
import { Button } from '../../../components/Button';

const AddProfileScreen = () => {
    const {
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
        handleSelect,
        pickProfileImage,
        handleContinue
    } = useAddProfile();

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
            <ScrollView contentContainerStyle={styles.scrollContainer}>


                <View style={styles.avatarContainer}>
                    {isUploadingImage ? (
                        <View style={[styles.avatar, styles.uploadingContainer]}>
                            <ActivityIndicator size="large" color="#4A90E2" />
                        </View>
                    ) : (
                        <View style={styles.avatar}>
                            <Image
                                source={profileImage ? { uri: profileImage } : require('../../../assets/images/placeholder profile.png')}
                                style={styles.avatarImage}
                            />
                        </View>
                    )}
                    <TouchableOpacity 
                        style={styles.editIconContainer}
                        onPress={pickProfileImage}
                        disabled={isUploadingImage}
                    >
                        <Image source={require('../../../assets/images/Pen_Icon.png')} style={styles.editIcon} />
                    </TouchableOpacity>
                    <Text style={styles.addPhotoText}>Add photo</Text>
                </View>

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        value={name}
                        editable={false}
                        placeholder="Name"
                        placeholderTextColor={Colors.mediumGrey}
                        accessibilityLabel="Name"
                    />
                </View>

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        value={email}
                        editable={false}
                        placeholder="Email"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        placeholderTextColor={Colors.mediumGrey}
                        accessibilityLabel="Email"
                    />
                </View>

                <View style={styles.pickerWrapper}>
                    <TouchableOpacity style={styles.inputContainer} onPress={() => setIsPickerOpen(!isPickerOpen)}>
                        <Text style={[styles.pickerText, { color: lifestage !== 'Select your lifestage' ? Colors.black : Colors.mediumGrey }]}>
                            {lifestage !== 'Select your lifestage' ? lifestage : 'lifestage*'}
                        </Text>
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
                        title="Continue"
                        onPress={handleContinue}
                        disabled={!lifestage || lifestage === 'Select your lifestage' || isLoading}
                        loading={isLoading}
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
        paddingVertical: 10
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
    footer: {
        flex: 1,
        justifyContent: 'flex-end',
        paddingBottom: 20,
        marginTop: 20,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.black,
        marginBottom: 8,
        textAlign: 'center',
    },
    sectionSubtitle: {
        fontSize: 16,
        color: Colors.mediumGrey,
        textAlign: 'center',
        marginBottom: 30,
    },
    uploadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.lightGrey,
    },
    cameraButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: Colors.primary,
        borderRadius: 20,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: Colors.white,
    },
    cameraButtonText: {
        fontSize: 20,
        color: Colors.white,
    },
});

export default AddProfileScreen;