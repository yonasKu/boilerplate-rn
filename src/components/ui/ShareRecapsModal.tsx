import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ShareRecapsModalProps {
    visible: boolean;
    onClose: () => void;
}

const ShareRecapsModal: React.FC<ShareRecapsModalProps> = ({ visible, onClose }) => {
    const shareLink = 'https://sproutbook.design';

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Ionicons name="close" size={20} color="#A0A0A0" />
                    </TouchableOpacity>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>Share your Recaps</Text>
                        <Text style={styles.modalText}>
                            Copy and share this link with friends and family who you want to share your Recaps with. Friends and family will have access to view your weekly and monthly Recaps, comment, like, and get notifications when ne...
                        </Text>

                        <Text style={styles.shareLinkTitle}>Share link</Text>
                        <View style={styles.shareLinkContainer}>
                            <TextInput
                                style={styles.shareLinkInput}
                                value={shareLink}
                                editable={false}
                            />
                            <TouchableOpacity style={styles.copyButton}>
                                <Ionicons name="copy-outline" size={22} color="#A0A0A0" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    modalView: {
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 25,
        alignItems: 'flex-start',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        width: '90%',
    },
    closeButton: {
        position: 'absolute',
        top: 15,
        right: 15,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2F4858',
        marginBottom: 12,
    },
    modalText: {
        marginBottom: 20,
        fontSize: 14,
        color: '#555',
        lineHeight: 20,
    },
    modalContainer: {
        marginVertical: 20,
    },
    shareLinkTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2F4858',
        marginBottom: 8,
    },
    shareLinkContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        borderRadius: 10,
        paddingHorizontal: 12,
        width: '100%',
    },
    shareLinkInput: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 14,
        color: '#2F4858',
    },
    copyButton: {
        padding: 4,
    },
});

export default ShareRecapsModal;
