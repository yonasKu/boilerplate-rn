import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal } from 'react-native';
import { Colors } from '@/theme/colors';

interface ShareBottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  onShare: (platform: 'copy' | 'system') => void;
}

const ShareBottomSheet: React.FC<ShareBottomSheetProps> = ({
  isVisible,
  onClose,
  onShare,
}) => {
  return (
    <Modal
      transparent
      visible={isVisible}
      onRequestClose={onClose}
      animationType="slide"
    >
      <TouchableOpacity style={styles.overlay} onPress={onClose}>
        <View style={styles.sheetContent}>
          <Text style={styles.title}>Share Entry</Text>
          
          <View style={styles.iconsContainer}>
            <TouchableOpacity 
              style={styles.iconButton} 
              onPress={() => onShare('copy')}
            >
              <Image 
                source={require('../../../assets/images/copy_link_icon.png')} 
                style={styles.icon}
              />
              <Text style={styles.iconLabel}>Copy Link</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.iconButton} 
              onPress={() => onShare('system')}
            >
              <Image 
                source={require('../../../assets/images/Horizontal_Dots_Icon.png')} 
                style={styles.icon}
              />
              <Text style={styles.iconLabel}>Share</Text>
            </TouchableOpacity>
          </View>
          
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheetContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 30,
  },
  iconsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    marginBottom: 30,
  },
  iconButton: {
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 24,
  },
  iconLabel: {
    fontSize: 14,
    color: Colors.mediumGrey,
    fontWeight: '500',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    backgroundColor: Colors.offWhite,
    minWidth: 120,
  },
  cancelText: {
    fontSize: 16,
    color: Colors.black,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default ShareBottomSheet;
