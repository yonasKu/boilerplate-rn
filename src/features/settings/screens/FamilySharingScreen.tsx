import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Modal, Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '../../../components/ui/ScreenHeader';
import FamilyMemberCircle from '../components/FamilyMemberCircle';
import { Colors } from '../../../theme/colors';
import { FamilyService } from '../../../services/familyService';
import { getAuth } from 'firebase/auth';

const FamilySharingScreen = () => {
  const insets = useSafeAreaInsets();
  const auth = getAuth();
  const user = auth.currentUser;
  const [familyMembers, setFamilyMembers] = useState<Array<{id?: string, viewerId: string, scopes: string[], createdAt: string}>>([]);
  const [loading, setLoading] = useState(false);
  const [isInviteModalVisible, setInviteModalVisible] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteResult, setInviteResult] = useState<{ code: string; expiresAt?: string } | null>(null);

  useEffect(() => {
    loadFamilyMembers();
  }, []);

  const loadFamilyMembers = async () => {
    if (!user) return;
    
    try {
      const members = await FamilyService.getSharedAccess();
      setFamilyMembers(members);
    } catch (error) {
      console.error('Error loading family members:', error);
    }
  };

  

  const handleRevokeAccess = async (viewerId: string) => {
    try {
      await FamilyService.revokeAccess(viewerId);
      loadFamilyMembers();
    } catch (error) {
      Alert.alert('Error', 'Failed to revoke access');
    }
  };

  const openInviteModal = () => {
    setInviteModalVisible(true);
    setInviteEmail('');
    setInviteName('');
  };

  const closeInviteModal = () => setInviteModalVisible(false);

  const handleInviteFromModal = async () => {
    if (!user || !inviteEmail.trim()) {
      Alert.alert('Email required', 'Please enter an email to send the invite code.');
      return;
    }

    setLoading(true);
    try {
      const { inviteCode, expiresAt } = await FamilyService.createInvitation({
        inviteeContact: inviteEmail.trim(),
        scopes: ['recaps:read', 'comments:write', 'likes:write']
      });

      setInviteEmail('');
      setInviteName('');
      setInviteModalVisible(false);
      setInviteResult({ code: inviteCode, expiresAt });
      loadFamilyMembers();
    } catch (error) {
      console.error('Error creating invitation:', error);
      Alert.alert('Error', 'Failed to create invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (!inviteResult?.code) return;
    try {
      // Use expo-clipboard if available; otherwise show a helpful message
      const Clipboard: any = await import('expo-clipboard');
      await Clipboard.setStringAsync(inviteResult.code);
      Alert.alert('Copied', 'Invite code copied to clipboard');
    } catch (e) {
      Alert.alert(
        'Copy unavailable',
      );
    }
  };

  const handleShareCode = async () => {
    if (!inviteResult?.code) return;
    try {
      await Share.share({
        message: `Join my SproutBook family with this invite code: ${inviteResult.code}`,
      });
    } catch (e) {
      // no-op
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Family Sharing" />

      <Modal
        visible={isInviteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeInviteModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Invite Family Member</Text>
            <TextInput
              placeholder="Name (optional)"
              value={inviteName}
              onChangeText={setInviteName}
              style={styles.modalInput}
              placeholderTextColor={Colors.mediumGrey}
            />
            <TextInput
              placeholder="Email"
              value={inviteEmail}
              onChangeText={setInviteEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.modalInput}
              placeholderTextColor={Colors.mediumGrey}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancel]}
                onPress={closeInviteModal}
                disabled={loading}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalPrimary, loading && styles.disabledButton]}
                onPress={handleInviteFromModal}
                disabled={loading}
              >
                <Text style={[styles.modalButtonText, styles.modalPrimaryText]}>
                  {loading ? 'Generating...' : 'Generate'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Invite Code Modal */}
      <Modal
        visible={!!inviteResult}
        transparent
        animationType="fade"
        onRequestClose={() => setInviteResult(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Invite Code</Text>
            <Text style={{ fontSize: 14, color: Colors.mediumGrey, marginBottom: 8 }}>
              Copy and share this code with your family member.
            </Text>
            <TextInput
              placeholder="Invite Code"
              value={inviteResult?.code ?? ''}
              editable={false}
              style={styles.modalInput}
              placeholderTextColor={Colors.mediumGrey}
            />
            {inviteResult?.expiresAt ? (
              <Text style={{ fontSize: 12, color: Colors.mediumGrey, marginBottom: 10 }}>
                Expires: {new Date(inviteResult.expiresAt).toLocaleString()}
              </Text>
            ) : null}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancel]}
                onPress={() => setInviteResult(null)}
              >
                <Text style={styles.modalButtonText}>Done</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton]}
                onPress={handleShareCode}
              >
                <Text style={styles.modalButtonText}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalPrimary]}
                onPress={handleCopyCode}
              >
                <Text style={[styles.modalButtonText, styles.modalPrimaryText]}>Copy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={Colors.mediumGrey} style={styles.searchIcon} />
          <TextInput
            placeholder="Dad"
            placeholderTextColor={Colors.mediumGrey}
            style={styles.searchInput}
          />
        </View>

        <View style={styles.gridContainer}>
          {familyMembers.map((member, index) => (
            <FamilyMemberCircle
              key={index}
              name={(member.viewerId && member.viewerId.substring(0, 6)) || 'Family Member'}
              image={require('../../../assets/images/user.png')}
              selected={false}
              onPress={() => handleRevokeAccess(member.viewerId)}
            />
          ))}
          
          <View style={styles.addMemberContainer}>
            <TouchableOpacity style={styles.addButton} onPress={openInviteModal}>
              <Ionicons name="person-add-outline" size={26} color={Colors.primary} />
            </TouchableOpacity>
            <Text style={styles.addText}>Add</Text>
          </View>
        </View>
        
        
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollContainer: {
    padding: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightGrey,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.black,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  addMemberContainer: {
    width: '30%',
    aspectRatio: 1,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.lightGrey,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  addText: {
    fontSize: 12,
    color: Colors.darkGrey,
    textAlign: 'center',
  },
  disabledButton: {
    backgroundColor: Colors.mediumGrey,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: Colors.lightGrey,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.black,
    marginBottom: 10,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 10,
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancel: {
    backgroundColor: Colors.lightGrey,
  },
  modalPrimary: {
    backgroundColor: Colors.primary,
  },
  modalButtonText: {
    color: Colors.black,
    fontWeight: '600',
  },
  modalPrimaryText: {
    color: Colors.white,
  },
});

export default FamilySharingScreen;
