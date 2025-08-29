import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image, Dimensions, Share, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../theme/colors';
import * as Clipboard from 'expo-clipboard';

interface ReferFriendModalProps {
  visible: boolean;
  onClose: () => void;
  shareMessage?: string;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const APP_PREVIEW_HEIGHT = Math.max(280, Math.min(SCREEN_HEIGHT * 0.45, 420));

const ReferFriendModal: React.FC<ReferFriendModalProps> = ({ visible, onClose, shareMessage }) => {
  const onPressMore = async () => {
    try {
      await Share.share({
        message: shareMessage || 'Download the Sproutbook app! https://sproutbook.design',
      });
    } catch (e) {
      // no-op
    }
  };
  const onPressCopy = async () => {
    try {
      const text = shareMessage || 'Download the Sproutbook app! https://sproutbook.design';
      await Clipboard.setStringAsync(text);
      Alert.alert('Copied', 'Text copied to clipboard');
    } catch (e) {
      Alert.alert('Copy unavailable');
    }
  };
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
          <Image source={require('../../../assets/images/Logo_Icon_small.png')} style={styles.topLogo} />
          <Image source={require('../../../assets/images/shareable.png')} style={styles.appPreview} />
          <View style={styles.downloadRow}>
            <Text style={styles.downloadText}>Download the Sproutbook app!</Text>
            <Image source={require('../../../assets/images/apple_icon.png')} style={styles.platformIcon} />
            <Image source={require('../../../assets/images/android_icon.png')} style={styles.platformIcon} />
          </View>
        </View>

        <View style={styles.bottomSheet}>
          <Text style={styles.shareTitle}>Share To</Text>
          <View style={styles.shareOptionsContainer}>
            <TouchableOpacity style={styles.shareOption} onPress={onPressCopy}>
              <View style={styles.shareIconCircle}>
                <Image source={require('../../../assets/images/copy_link_icon.png')} style={styles.copyIcon} />
              </View>
              <Text style={styles.shareOptionText}>Copy link</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareOption} onPress={onPressMore}>
              <View style={styles.shareIconCircle}>
                <Ionicons name="ellipsis-horizontal" size={24} color={Colors.primary} />
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
  appPreview: {
    width: '100%',
    height: APP_PREVIEW_HEIGHT,
    resizeMode: 'contain',
    borderRadius: 16,
    marginBottom: 16,
  },
  topLogo: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
    marginBottom: 8,
  },
  downloadText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.black,
  },
  downloadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  platformIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
    marginLeft: 6,
    tintColor: Colors.black,
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
  copyIcon: {
    width: 24,
    height: 24,
    tintColor: Colors.primary,
    resizeMode: 'contain',
  },
  shareOptionText: {
    fontSize: 14,
    color: '#555',
  },
});

export default ReferFriendModal;
