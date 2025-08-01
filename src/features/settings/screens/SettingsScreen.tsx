import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';

type SettingsOption = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  text: string;
};

const settingsOptions: SettingsOption[] = [
  { icon: 'people-outline', text: 'Partner access' },
  { icon: 'gift-outline', text: 'Refer a friend' },
  { icon: 'person-outline', text: 'Child Profiles' },
  { icon: 'settings-outline', text: 'Account settings' },
  { icon: 'card-outline', text: 'Gift cards' },
  { icon: 'share-social-outline', text: 'Family sharing' },
];

const SettingsScreen = () => {
  const { signOut } = useAuth();
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <Image
              source={{ uri: 'https://placehold.co/100x100' }} // Placeholder image
              style={styles.profileImage}
            />
            <TouchableOpacity style={styles.editIconContainer}>
              <Ionicons name="pencil" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.profileName}>Eleanor</Text>
        </View>

        <View style={styles.optionsContainer}>
          {settingsOptions.map((option, index) => (
            <TouchableOpacity key={index} style={styles.optionRow}>
              <View style={styles.iconBackground}>
                <Ionicons name={option.icon} size={24} color="#2E7D32" />
              </View>
              <Text style={styles.optionText}>{option.text}</Text>
              <Ionicons name="chevron-forward" size={24} color="#BDBDBD" />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileSection: {
    alignItems: 'center',
    marginVertical: 24,
  },
  profileImageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#E0F2F1',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4CAF50',
    borderRadius: 15,
    padding: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileName: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: '600',
  },
  optionsContainer: {
    marginHorizontal: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  iconBackground: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    flex: 1,
    marginLeft: 16,
    fontSize: 16,
  },
  logoutButton: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FBE9E7',
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#D32F2F',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SettingsScreen;
