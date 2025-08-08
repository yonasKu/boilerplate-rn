import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView } from 'react-native';

interface AgeFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (ageRange: { min: number; max: number; unit: string }) => void;
}

const AgeFilterModal: React.FC<AgeFilterModalProps> = ({ visible, onClose, onSave }) => {
  const ageRanges = [
    { label: 'Newborn (0-3 months)', min: 0, max: 3, unit: 'Months' },
    { label: 'Infant (3-12 months)', min: 3, max: 12, unit: 'Months' },
    { label: 'Toddler (1-3 years)', min: 12, max: 36, unit: 'Months' },
    { label: 'Preschool (3-5 years)', min: 36, max: 60, unit: 'Months' },
    { label: 'School Age (5-12 years)', min: 60, max: 144, unit: 'Months' },
    { label: 'Teen (12-18 years)', min: 144, max: 216, unit: 'Months' },
  ];

  const handleAgeSelection = (ageRange: { min: number; max: number; unit: string }) => {
    onSave(ageRange);
    onClose();
  };

  return (
    <Modal transparent={true} visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          
          <Text style={styles.title}>Select Age Range</Text>
          
          <ScrollView style={styles.scrollView}>
            {ageRanges.map((range, index) => (
              <TouchableOpacity
                key={index}
                style={styles.ageButton}
                onPress={() => handleAgeSelection(range)}
              >
                <Text style={styles.ageButtonText}>{range.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: Dimensions.get('window').width - 40,
    maxWidth: 340,
    maxHeight: Dimensions.get('window').height * 0.8,
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  scrollView: {
    maxHeight: 300,
  },
  ageButton: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  ageButtonText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  cancelButton: {
    marginTop: 15,
    paddingVertical: 12,
    backgroundColor: '#6c757d',
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
});

export default AgeFilterModal;
