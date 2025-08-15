import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ReferFriendModalProps {
  visible: boolean;
  onClose: () => void;
}

const ReferFriendModal: React.FC<ReferFriendModalProps> = ({ visible, onClose }) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.popupContainer}>
          <Image source={require('../../../assets/images/Logo_Icon_small.png')} style={styles.logo} />
          <Text style={styles.ratingText}>Rated 4.5/5</Text>
          <View style={styles.starsContainer}>
            {[...Array(4)].map((_, i) => <Ionicons key={i} name="star" size={20} color="#FFD700" />)}
            <Ionicons name="star-half" size={20} color="#FFD700" />
          </View>
          <Image source={require('../../../assets/images/onboarding-1.png')} style={styles.appPreview} />
          <Text style={styles.downloadText}>Download the Sproutbook app!</Text>
        </View>

        <View style={styles.bottomSheet}>
          <Text style={styles.shareTitle}>Share To</Text>
          <View style={styles.shareOptionsContainer}>
            <TouchableOpacity style={styles.shareOption}>
              <View style={styles.shareIconCircle}>
                <Ionicons name="copy-outline" size={24} color="#2F4858" />
              </View>
              <Text style={styles.shareOptionText}>Copy link</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareOption}>
              <View style={styles.shareIconCircle}>
                <Ionicons name="ellipsis-horizontal" size={24} color="#2F4858" />
              </View>
              <Text style={styles.shareOptionText}>More</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 2,
  },
  popupContainer: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    marginBottom: 'auto',
    marginTop: 120
  },
  logo: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
    marginBottom: 12,
  },
  ratingText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  appPreview: {
    width: '100%',
    height: 300,
    resizeMode: 'contain',
    borderRadius: 16,
    marginBottom: 16,
  },
  downloadText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2F4858',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  shareTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2F4858',
    marginBottom: 20,
  },
  shareOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  shareOption: {
    alignItems: 'center',
  },
  shareIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  shareOptionText: {
    fontSize: 14,
    color: '#555',
  },
});

export default ReferFriendModal;
