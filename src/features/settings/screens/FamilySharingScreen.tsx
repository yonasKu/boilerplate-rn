import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ScreenHeader from '../../../components/ui/ScreenHeader';
import FamilyMemberCircle from '../components/FamilyMemberCircle';
import ShareRecapsModal from '../../../components/ui/ShareRecapsModal';

const familyMembers = [
  { name: 'Dad', image: require('../../../assets/images/sample_parents.png') },
  { name: 'Sister', image: require('../../../assets/images/sample_parents2.png') },
  { name: 'Brother', image: require('../../../assets/images/sample_parents3.png') },
  { name: 'Gramma', image: require('../../../assets/images/sampleProfile.png') },
  { name: 'Grampa', image: require('../../../assets/images/sample_parents.png') },
  { name: 'Aunty', image: require('../../../assets/images/sample_parents2.png') },
  { name: 'Uncle', image: require('../../../assets/images/sample_parents3.png') },
  { name: 'Mom', image: require('../../../assets/images/sampleProfile.png') },
];

const FamilySharingScreen = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [isModalVisible, setModalVisible] = useState(false);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Family Sharing" showShareIcon onSharePress={() => setModalVisible(true)} />

      <ShareRecapsModal visible={isModalVisible} onClose={() => setModalVisible(false)} />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#A9A9A9" style={styles.searchIcon} />
          <TextInput placeholder="Dad" style={styles.searchInput} />
        </View>

        <View style={styles.gridContainer}>
          {familyMembers.map((member, index) => (
            <FamilyMemberCircle key={index} name={member.name} image={member.image} />
          ))}
          <View style={styles.addMemberContainer}>
            <TouchableOpacity style={styles.addButton}>
              <Ionicons name="person-add-outline" size={30} color="#5D9275" />
            </TouchableOpacity>
            <Text style={styles.addText}>Add</Text>
          </View>
        </View>

        <Text style={styles.referralText}>
          One month free to anyone who signs up using your personalized referral link. Must be a new user to claim free month.
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    padding: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 20,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  addMemberContainer: {
    width: '33%',
    alignItems: 'center',
    marginBottom: 20,
  },
  addButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  addText: {
    fontSize: 14,
    color: '#2F4858',
    fontWeight: '500',
  },
  referralText: {
    marginTop: 20,
    textAlign: 'center',
    color: '#5D9275',
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
});

export default FamilySharingScreen;
