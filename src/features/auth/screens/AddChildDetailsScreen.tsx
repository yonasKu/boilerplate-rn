import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, TextInput, Image, Platform, ActivityIndicator, StatusBar } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '../../../theme/colors';
import { Button } from '../../../components/Button';
import { useAddChildDetails } from '../hooks/useAddChildDetails';

const AddChildDetailsScreen = () => {
    const {
        // State
        childrenRows,
        setChildrenRows,
        activeDatePickerIndex,
        openGenderPickerIndex,
        setOpenGenderPickerIndex,
        journalImage,
        journalName,
        setJournalName,
        lifestage,
        showDatePicker,
        isLoading,
        isUploadingJournalImage,
        genderOptions,

        // Actions
        handleGenderSelect,
        onDateChange,
        openDatePicker,
        pickJournalImage,
        pickRowImage,
        handleContinue,
    } = useAddChildDetails();

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />


            <ScrollView contentContainerStyle={styles.scrollContainer}>

                <View style={styles.headerTop}>
                    <Text style={styles.sectionTitle}>Let’s create{'\n'}your journal</Text>
                </View>
                <View style={styles.avatarContainer}>
                    <TouchableOpacity onPress={pickJournalImage} disabled={isUploadingJournalImage}>
                        {isUploadingJournalImage ? (
                            <View style={[styles.avatar, styles.uploadingContainer]}>
                                <ActivityIndicator size="large" color="#4A90E2" />
                            </View>
                        ) : (
                            <View style={styles.avatar}>
                                <Image
                                    source={journalImage ? { uri: journalImage } : require('../../../assets/images/placeholder profile.png')}
                                    style={styles.avatarImage}
                                />
                            </View>
                        )}
                    </TouchableOpacity>
                    {journalImage ? (
                        <TouchableOpacity
                            style={styles.editIconContainer}
                            onPress={pickJournalImage}
                            disabled={isUploadingJournalImage}
                        >
                            <Image source={require('../../../assets/images/Pen_Icon.png')} style={styles.editIcon} />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity onPress={pickJournalImage} disabled={isUploadingJournalImage}>
                            <Text style={styles.addPhotoText}>Add photo</Text>
                        </TouchableOpacity>
                    )}
                    <TextInput
                        style={styles.journalNameInput}
                        placeholder="Your journal name"
                        placeholderTextColor={Colors.mediumGrey}
                        value={journalName}
                        onChangeText={setJournalName}
                        accessibilityLabel="Journal name"
                    />
                </View>

                <Text style={styles.sectionSubtitle}>Who are you journaling about?</Text>

                {childrenRows.map((row, index) => (
                    <View key={`child-row-${index}`} style={styles.childCard}>
                        <View style={styles.childHeader}>
                            <View style={{ alignItems: 'center' }}>
                                <TouchableOpacity onPress={() => pickRowImage(index)}>
                                    <View style={styles.childAvatar}>
                                        <Image
                                            source={row.imageUri ? { uri: row.imageUri } : require('../../../assets/images/placeholder profile.png')}
                                            style={styles.childAvatarImage}
                                        />
                                        <View style={styles.childEditIconContainer}>
                                            <Image source={require('../../../assets/images/camera.png')} style={styles.childEditIcon} />
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            </View>

                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <View style={styles.labelRow}>
                                    <Text style={styles.fieldLabel}>Name</Text>
                                    <TouchableOpacity style={styles.removeButton} onPress={() => setChildrenRows(rows => rows.filter((_, i) => i !== index))} accessibilityLabel={`Remove child ${index + 1}`}>
                                        <Image source={require('../../../assets/images/trash_Icon.png')} style={styles.trashIcon} />
                                    </TouchableOpacity>
                                </View>
                                <TextInput
                                    style={styles.inputUnderline}
                                    placeholder="Child’s name or nickname"
                                    placeholderTextColor={Colors.mediumGrey}
                                    value={row.name}
                                    onChangeText={(text) => setChildrenRows((rows) => rows.map((r, i) => i === index ? { ...r, name: text } : r))}
                                    accessibilityLabel={`Child ${index + 1} name`}
                                />
                            </View>
                        </View>

                        <View style={styles.rowInline}>
                            <View style={{ flex: 1, marginRight: 8 }}>
                                <Text style={styles.fieldLabel}>Birthday/due date</Text>
                                <View style={styles.underlineContainer}>
                                    <TextInput
                                        style={styles.inputUnderlineText}
                                        placeholder="MM/DD/YYYY"
                                        placeholderTextColor={Colors.mediumGrey}
                                        value={row.dueDate}
                                        onChangeText={() => { }}
                                        editable={false}
                                        accessibilityLabel={lifestage === 'Parent' ? "Child's birthday" : "Baby's due date"}
                                    />
                                    <TouchableOpacity onPress={() => openDatePicker(index)}>
                                        <Image source={require('../../../assets/images/calendar.png')} style={styles.calendarIcon} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={{ flex: 1, marginLeft: 8 }}>
                                <Text style={styles.fieldLabel}>Gender</Text>
                                <View style={styles.pickerWrapper}>
                                    <TouchableOpacity style={styles.underlineContainer} onPress={() => setOpenGenderPickerIndex(openGenderPickerIndex === index ? null : index)}>
                                        <Text style={[styles.pickerText, { color: row.gender ? Colors.black : Colors.mediumGrey }]}>
                                            {row.gender || 'Select'}
                                        </Text>
                                        <Image source={require('../../../assets/images/Chevron_Down.png')} style={styles.arrowIcon} />
                                    </TouchableOpacity>
                                    {openGenderPickerIndex === index && (
                                        <View style={styles.optionsContainer}>
                                            {genderOptions.map((option) => (
                                                <TouchableOpacity key={option} style={styles.optionItem} onPress={() => handleGenderSelect(index, option)}>
                                                    {row.gender === option ? (
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
                        </View>
                    </View>
                ))}

                {/* Journal name input moved under avatar */}

                {showDatePicker && (
                    <DateTimePicker
                        testID="dateTimePicker"
                        value={activeDatePickerIndex !== null && childrenRows[activeDatePickerIndex]?.date ? (childrenRows[activeDatePickerIndex]?.date as Date) : new Date()}
                        mode={'date'}
                        is24Hour={true}
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={onDateChange}
                        minimumDate={lifestage === 'Soon to be parent' ? new Date() : undefined}
                        maximumDate={lifestage === 'Parent' ? new Date() : undefined}
                        style={Platform.OS === 'ios' ? { backgroundColor: Colors.white } : undefined}
                    />
                )}

                <TouchableOpacity
                    style={[styles.modalButton]}
                    onPress={() => setChildrenRows((rows) => [...rows, { name: '', date: null, dueDate: '', gender: '', imageUri: undefined }])}
                    accessibilityLabel="Add another child row"
                >
                    <Text style={styles.secondaryButtonText}>+ Add Child</Text>
                </TouchableOpacity>

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
        marginVertical: 30
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
    journalNameInput: {
        marginTop: 12,
        fontSize: 16,
        color: Colors.black,
        textAlign: 'center',
        width: '80%',
        fontFamily: 'Poppins-Regular',
        paddingVertical: 6,

    },
    editIconContainer: {
        position: 'absolute',
        bottom: 32,
        right: '34%',
    },
    editIcon: {
        width: 50,
        height: 50,
    },
    label: {
        color: Colors.black,
        //marginBottom: 8,
        fontSize: 16,
        fontWeight: '500',
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
       
    },
    fieldLabel: {
        color: Colors.darkGrey,
        fontFamily: 'poppins-500regular',
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
        fontSize: 15,
        color: Colors.blacktext,
        height: 50,
        paddingVertical: 6,
        fontFamily: 'Poppins-Regular',
    },
    inputUnderline: {
        fontSize: 15,
        color: Colors.blacktext,
        fontFamily: 'Poppins-Regular',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderColor: Colors.lightGrey,
    },
    dateText: {
        flex: 1,
        fontSize: 14,
        color: Colors.blacktext,
        fontFamily: 'Poppins-Regular',
    },
    pickerWrapper: {
        marginBottom: 20,
        position: 'relative',
        width: '100%',
    },
    underlineContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderColor: Colors.lightGrey,
        paddingVertical: 8,
    },
    inputUnderlineText: {
        flex: 1,
        fontSize: 12,
        color: Colors.blacktext,
        fontFamily: 'Poppins-Regular',
        paddingVertical: 6,
    },
    pickerText: {
        flex: 1,
        fontSize: 15,
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
        fontSize: 15,
        fontFamily: 'Poppins-Regular',
        color: Colors.darkGrey,
    },
    selectedOptionButton: {
        backgroundColor: Colors.lightPink,
        borderRadius: 12,
    },
    selectedOptionText: {
        color: Colors.primary,
        fontWeight: '500',
        padding: 12,
        fontFamily: 'Poppins-Regular',
        fontSize: 15,
    },
    calendarIcon: {
        width: 16,
        height: 16,
        tintColor: Colors.grey,
    },
    childCard: {
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.lightGrey,
        borderRadius: 16,
        padding: 12,
        marginTop: 16,
    },
    childHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    childAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.lightGrey,
        position: 'relative',
    },
    childAvatarImage: {
        width: 52,
        height: 52,
        borderRadius: 26,
    },
    childEditIconContainer: {
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.primary,
        borderRadius: 12,
        position: 'absolute',
        bottom: -4,
        right: -4,
    },
    childEditIcon: {
        width: 12,
        height: 12,
    },
    removeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    removeButtonText: {
        fontSize: 22,
        color: Colors.darkGrey,
        marginTop: -3,
    },
    trashIcon: {
        width: 16,
        height: 16,
    },
    rowInline: {
        flexDirection: 'row',
        paddingHorizontal: 6,
        alignItems: 'flex-start',
        paddingVertical: 6,
        marginLeft: 24,

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
        alignSelf: 'center',
        width: 150,
        paddingVertical: 18,
        alignItems: 'center',

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
    sectionTitle: {
        alignItems: 'center',
        fontSize: 26,
        fontWeight: '500',
        color: Colors.black,
        marginBottom: 8,
        textAlign: 'center',
        fontFamily: 'Poppins-SemiBold',
        lineHeight: 32,
    },
    sectionSubtitle: {
        paddingHorizontal: 10,
        fontSize: 15,
        color: Colors.mediumGrey,
        marginTop: 16,
        fontFamily: 'Poppins-Regular',
    },
    headerTop: {
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 8,
    },
});

export default AddChildDetailsScreen;
