import React, { useState, useMemo, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/theme/colors';

type TimeUnit = 'Weeks' | 'Months' | 'Years';

interface AgeFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (ageRange: { value: number; unit: TimeUnit }) => void;
}

const AgeFilterModal: React.FC<AgeFilterModalProps> = ({ visible, onClose, onSave }) => {
  const [selectedValue, setSelectedValue] = useState(1);
  const [selectedUnit, setSelectedUnit] = useState<TimeUnit>('Weeks');

  const numbers = useMemo(() => {
    let max = 52;
    if (selectedUnit === 'Weeks') {
      max = 52;
    } else if (selectedUnit === 'Months') {
      max = 12;
    } else if (selectedUnit === 'Years') {
      max = 18;
    }
    return Array.from({ length: max }, (_, i) => i + 1);
  }, [selectedUnit]);

  useEffect(() => {
    const max = numbers.length;
    if (selectedValue > max) {
      setSelectedValue(1);
    }
  }, [numbers, selectedValue]);

  const units: TimeUnit[] = ['Weeks', 'Months', 'Years'];

  const handleSave = () => {
    onSave({ value: selectedValue, unit: selectedUnit });
    onClose();
  };

  const renderNumberItem = ({ item }: { item: number }) => (
    <TouchableOpacity onPress={() => setSelectedValue(item)}>
      <Text style={[styles.pickerItem, selectedValue === item && styles.selectedPickerItem]}>
        {String(item).padStart(2, '0')}
      </Text>
    </TouchableOpacity>
  );

  const renderUnitItem = ({ item }: { item: TimeUnit }) => (
    <TouchableOpacity onPress={() => setSelectedUnit(item)}>
      <Text style={[styles.pickerItem, styles.unitPickerItem, selectedUnit === item && styles.selectedPickerItem]}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <View style={styles.header}>
            <Text style={styles.modalTitle}>Select Time</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.pickerContainer}>
            <FlatList
              data={numbers}
              renderItem={renderNumberItem}
              keyExtractor={(item) => item.toString()}
              showsVerticalScrollIndicator={false}
              style={styles.pickerColumn}
              contentContainerStyle={styles.pickerContentContainer}
            />
            <FlatList
              data={units}
              renderItem={renderUnitItem}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              style={styles.datepickerColumn}
              contentContainerStyle={styles.datepickerContentContainer}
            />
          </View>

          <View style={styles.footer}>
            {/* <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity> */}
            <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save</Text>
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
    backgroundColor: 'rgba(0,0,0,0.4)',
    //paddingVertical: 20,
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '85%',
    marginVertical: 20,
    maxHeight: '85%',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  pickerContainer: {
    flexDirection: 'row',
    height: 150,
    marginBottom: 30,
  },
  pickerColumn: {
    flex: 1,
  },
  pickerContentContainer: {
    alignItems: 'center',
  },
  datepickerContainer: {
    flexDirection: 'row',
    height: 150,
    marginBottom: 30,
  },
  datepickerColumn: {
    flex: 1,
    margin: 16,
  },
  datepickerContentContainer: {
    alignItems: 'center',
  },
  pickerItem: {
    fontSize: 18,
    paddingVertical: 8,
    color: '#A0A0A0',
  },
  unitPickerItem: {
    textAlign: 'left',
    width: 100,
  },
  selectedPickerItem: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 22,
  },
  footer: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    alignSelf: 'stretch',
    paddingHorizontal: 12,
    minHeight: 48,
    justifyContent: 'center',
    zIndex: 1,
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: Colors.primary,
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '500',
    fontSize: 16,
  },
  saveButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default AgeFilterModal;
