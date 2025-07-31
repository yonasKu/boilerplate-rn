import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Image, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';


const AddChildDetailsScreen = () => {
    const router = useRouter();
    const [childName, setChildName] = useState('');
    const [date, setDate] = useState(new Date());
    const [dueDate, setDueDate] = useState('');
    const [gender, setGender] = useState("Don't know yet");
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const genderOptions = ['Boy', 'Girl', "Don't know yet"];

    const handleSelect = (option: string) => {
        setGender(option);
        setIsPickerOpen(false);
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || date;
        setShowDatePicker(Platform.OS === 'ios');
        setDate(currentDate);

        if (selectedDate) {
            const formattedDate = currentDate.toLocaleDateString('en-US', {
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

        return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.avatarContainer}>
                    <View style={styles.avatar}>
                        <Image source={require('../../../assets/images/placeholder profile.png')} style={styles.avatarImage} />
                    </View>
                    <TouchableOpacity style={styles.editIconContainer}>
                        <Image source={require('../../../assets/images/Pen_Icon.png')} style={styles.editIcon} />
                    </TouchableOpacity>
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

                <Text style={styles.label}>Due Date<Text style={styles.asterisk}>*</Text></Text>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="child's due date"
                        placeholderTextColor="#A9A9A9"
                        value={dueDate}
                        onChangeText={setDueDate}
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
                  <TouchableOpacity style={styles.button} onPress={() => router.push('/(main)/journal')}>
                      <Text style={styles.buttonText}>Continue</Text>
                  </TouchableOpacity>
                </View>
                        </ScrollView>
        </View>
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
        marginBottom: 15, // Added margin
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default AddChildDetailsScreen;
