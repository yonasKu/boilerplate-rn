import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';

interface ShareCodeModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  label?: string;
  value: string;
  onCopy: () => void;
}

const ShareCodeModal: React.FC<ShareCodeModalProps> = ({
  visible,
  onClose,
  title = 'Share invite code',
  description = 'Copy and share this code with your family member. They will be able to accept the invite using this code.',
  label = 'Invite code',
  value,
  onCopy,
}) => {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={20} color="#A0A0A0" />
          </TouchableOpacity>

          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalText}>{description}</Text>

          <Text style={styles.shareLinkTitle}>{label}</Text>
          <View style={styles.shareLinkContainer}>
            <TextInput style={styles.shareLinkInput} value={value} editable={false} />
            <TouchableOpacity style={styles.copyButton} onPress={onCopy}>
              <Ionicons name="copy-outline" size={22} color={Colors.mediumGrey} />
            </TouchableOpacity>
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
    shadowOffset: { width: 0, height: 2 },
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

export default ShareCodeModal;
