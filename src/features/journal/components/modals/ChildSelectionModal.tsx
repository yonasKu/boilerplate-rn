import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, FlatList, SafeAreaView } from 'react-native';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { Ionicons } from '@expo/vector-icons';

interface Child {
  id: string;
  name: string;
  profileImageUrl?: string;
}

interface ChildSelectionModalProps {
  visible: boolean;
  children: Child[];
  currentUser: any; // Can be more specific if user type is defined
  onClose: () => void;
    onSelect: (child: Child | null) => void; // null for 'All Journals'
}

const ChildSelectionModal: React.FC<ChildSelectionModalProps> = ({ visible, children, currentUser, onClose, onSelect }) => {
  const renderItem = ({ item }: { item: Child | null }) => {
        const isAllChildren = item === null;
    const name = isAllChildren ? 'Journals' : item.name;
    const imageUrl = isAllChildren ? currentUser?.profileImageUrl : item.profileImageUrl;

    return (
      <TouchableOpacity style={styles.itemContainer} onPress={() => onSelect(item)}>
        <ProfileAvatar imageUrl={imageUrl} name={name} size={40} textSize={16} />
        <Text style={styles.itemName}>{name}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Select a Journal</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
          </View>
          <FlatList
                        data={[null, ...children]} // Add 'null' for the 'All Journals' option
            renderItem={renderItem}
            keyExtractor={(item, index) => item?.id || `all-children-${index}`}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    height: '50%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  itemName: {
    fontSize: 16,
    color: '#333',
  },
  separator: {
    height: 1,
    backgroundColor: '#EFEFEF',
    marginLeft: 52, // Align with text
  },
});

export default ChildSelectionModal;
