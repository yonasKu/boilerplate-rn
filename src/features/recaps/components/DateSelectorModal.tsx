import React, { useState } from 'react';
import { Modal, Pressable, View, Text, Platform, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '@/theme';

interface DateSelectorModalProps {
  visible: boolean;
  initialDate?: Date | null;
  onClose: () => void;
  onSelect: (date: Date) => void;
}

const DateSelectorModal: React.FC<DateSelectorModalProps> = ({ visible, initialDate, onClose, onSelect }) => {
  const [tempDate, setTempDate] = useState<Date>(initialDate || new Date());

  const handleChange = (_event: any, selected?: Date) => {
    const currentDate = selected || tempDate;
    setTempDate(currentDate);
    if (Platform.OS === 'android' && selected) {
      onSelect(currentDate);
    }
  };

  const handleConfirm = () => {
    onSelect(tempDate);
  };

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.pickerContainer}>
          <DateTimePicker
            value={tempDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
            onChange={handleChange}
          />
        </View>
        {Platform.OS === 'ios' && (
          <View style={styles.actions}>
            <Pressable style={[styles.button, styles.cancel]} onPress={onClose}>
              <Text style={styles.buttonText}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.button, styles.confirm]} onPress={handleConfirm}>
              <Text style={[styles.buttonText, styles.confirmText]}>Select</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  sheet: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: '18%',
    borderRadius: 12,
    backgroundColor: Colors.white,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: Colors.lightGrey,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: Colors.offWhite,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 12,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  cancel: {
    backgroundColor: Colors.offWhite,
  },
  confirm: {
    backgroundColor: Colors.primary,
  },
  buttonText: {
    fontFamily: 'Poppins_500Medium',
    color: Colors.blacktext,
  },
  confirmText: {
    color: Colors.white,
  },
});

export default DateSelectorModal;
