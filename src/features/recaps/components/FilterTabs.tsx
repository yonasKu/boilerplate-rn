import { Colors } from '@/theme';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';

const filters = ['All', 'Favorites', 'Milestones', 'Age'];

const FilterTabs = () => {
  const [activeFilter, setActiveFilter] = useState('All');
  const [activeModalOption, setModalOption] = useState('All');
  const [modalVisible, setModalVisible] = useState(false);

  const handleFilterPress = (filter: string) => {
    if (filter === 'All') {
      setModalVisible(true);
    } else {
      setActiveFilter(filter);
    }
  };

  const handleModalSelect = (option: string) => {
    setActiveFilter(option);
    setModalOption(option);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {filters.map((filter) => (
        <TouchableOpacity
          key={filter}
          style={[styles.tab, activeFilter === filter && styles.activeTab]}
          onPress={() => handleFilterPress(filter)}
        >
          <Text style={[styles.tabText, activeFilter === filter && styles.activeTabText]}>{filter}</Text>
        </TouchableOpacity>
      ))}

      <Modal
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent}>
            {['All', 'Monthly', 'Weekly'].map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.modalOption,
                  activeModalOption === option && styles.activeModalOption,
                ]}
                onPress={() => handleModalSelect(option)}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    activeModalOption === option && styles.activeModalOptionText,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  activeTab: {
    backgroundColor: '#5D9275',
  },
  tabText: {
    color: Colors.darkGrey,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    marginTop: 150, // Adjust as needed
    marginLeft: 20, // Adjust as needed
    width: 150,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalOption: {
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderRadius: 6,
  },
  modalOptionText: {
    fontSize: 16,
    color: Colors.darkGrey,
  },
  activeModalOption: {
    backgroundColor: '#CDE4D2',
  },
  activeModalOptionText: {
    fontWeight: 'bold',
  },
});

export default FilterTabs;
