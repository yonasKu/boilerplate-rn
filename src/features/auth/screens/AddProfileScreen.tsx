import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, TextInput, Image, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { useAddProfile } from '../hooks/useAddProfile';

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
            <StatusBar barStyle="dark-content" backgroundColor="#F9F9F9" />
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

                <Text style={styles.label}>Name</Text>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        value={name}
                        editable={false}
                        placeholderTextColor="#999"
                    />
                </View>

                <Text style={styles.label}>Email</Text>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        value={email}
                        editable={false}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        placeholderTextColor="#999"
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
                  <TouchableOpacity 
                    style={[styles.button, isLoading && styles.buttonDisabled]} 
                    onPress={handleContinue}
                    disabled={isLoading}
                  >
                      <Text style={styles.buttonText}>{isLoading ? 'Saving...' : 'Continue'}</Text>
                  </TouchableOpacity>
                </View>
            </ScrollView>
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
        width: 16,
        height: 16,
    },
    addPhotoText: {
        fontSize: 14,
        color: '#4A90E2',
        fontWeight: '500',
        marginTop: 8,
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
    footer: {
        flex: 1,
        justifyContent: 'flex-end',
        paddingBottom: 20,
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
    sectionTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2F4858',
        marginBottom: 8,
        textAlign: 'center',
    },
    sectionSubtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 30,
    },
    uploadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    cameraButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#4A90E2',
        borderRadius: 20,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#fff',
    },
    cameraButtonText: {
        fontSize: 20,
        color: '#fff',
    },
});

export default AddProfileScreen;