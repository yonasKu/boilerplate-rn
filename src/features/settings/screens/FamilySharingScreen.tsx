import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Modal, Share, RefreshControl, BackHandler } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import ScreenHeader from '../../../components/ui/ScreenHeader';
import ShareRecapsModal from '../../../components/ui/ShareRecapsModal';
import FamilyMemberCircle from '../components/FamilyMemberCircle';
import { Colors } from '../../../theme/colors';
import { FamilyService, type SharedAccess, type Invitation } from '../../../services/familyService';
import { getAuth } from 'firebase/auth';
import { useRouter } from 'expo-router';

const FamilySharingScreen = () => {
  const insets = useSafeAreaInsets();
  const auth = getAuth();
  const user = auth.currentUser;
  const router = useRouter();
  const [familyMembers, setFamilyMembers] = useState<SharedAccess[]>([]);
  const [loading, setLoading] = useState(false);
  const [isInviteModalVisible, setInviteModalVisible] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteResult, setInviteResult] = useState<{ code: string; expiresAt?: string } | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [shareModalValue, setShareModalValue] = useState<string | null>(null);

  useEffect(() => {
    loadFamilyMembers();
    loadInvitations();
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

  const loadInvitations = async () => {
    if (!user) return;
    try {
      const list = await FamilyService.getInvitations();
      // Show all invitations (pending/accepted), we'll visually distinguish in UI
      setInvitations(list);
    } catch (error) {
      console.error('Error loading invitations:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadFamilyMembers(), loadInvitations()]);
    } finally {
      setRefreshing(false);
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
      setShareModalValue(inviteCode);
      loadFamilyMembers();
      loadInvitations();
    } catch (error) {
      console.error('Error creating invitation:', error);
      Alert.alert('Error', 'Failed to create invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (!shareModalValue) return;
    try {
      await Clipboard.setStringAsync(shareModalValue);
    } catch (e) {
      // silent fail
    }
  };

  const handleShareCode = async () => {
    if (!shareModalValue) return;
    try {
      await Share.share({ message: `Join my SproutBook family with this invite code: ${shareModalValue}` });
    } catch (e) {
      // no-op
    }
  };

  // Pending invites: per-item actions
  const handleCopyInviteCode = async (code: string) => {
    try {
      await Clipboard.setStringAsync(code);
    } catch (e) {
      // silent fail
    }
  };

  const handleShareInviteCode = async (code: string) => {
    try {
      await Share.share({ message: `Join my SproutBook family with this invite code: ${code}` });
    } catch (e) {
      // no-op
    }
  };

  // Android hardware back: close any open modals first
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isInviteModalVisible || shareModalValue) {
        setInviteModalVisible(false);
        setShareModalValue(null);
        return true; // handled
      }
      return false; // let router handle
    });
    return () => sub.remove();
  }, [isInviteModalVisible, shareModalValue]);

  // Ensure we close any open modals before navigating back to avoid Android drawing-order crashes
  const handleBack = () => {
    if (isInviteModalVisible || shareModalValue) {
      setInviteModalVisible(false);
      setShareModalValue(null);
      setTimeout(() => {
        router.back();
      }, 250);
      return;
    }
    router.back();
  };

  // Format invitee name from contact (e.g., email => take local part)
  const getInviteeDisplayName = (contact?: string) => {
    if (!contact) return 'Invited';
    const at = contact.indexOf('@');
    let base = at > 0 ? contact.slice(0, at) : contact;
    base = base.replace(/[^a-zA-Z0-9]+/g, ' ').trim();
    if (!base) return 'Invited';
    return base.charAt(0).toUpperCase() + base.slice(1);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Family Sharing" onBack={handleBack} />

      <Modal
        visible={isInviteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeInviteModal}
        statusBarTranslucent
        hardwareAccelerated
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
                style={[styles.modalButton, styles.ml8, styles.modalPrimary, loading && styles.disabledButton]}
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
      {/* Share (Invite Code) Modal with the same look as screenshot */}
      <ShareRecapsModal
        visible={!!shareModalValue}
        onClose={() => setShareModalValue(null)}
        title="Share invite code"
        description="Copy and share this invite code with your family member. They will be able to accept the invite using this code."
        label="Invite code"
        value={shareModalValue ?? ''}
        onCopy={async () => {
          if (!shareModalValue) return;
          try {
            await Clipboard.setStringAsync(shareModalValue);
          } catch (e) {
            // silent fail
          }
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContainer} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={Colors.mediumGrey} style={styles.searchIcon} />
          <TextInput
            placeholder="Dad"
            placeholderTextColor={Colors.mediumGrey}
            style={styles.searchInput}
          />
        </View>

        <View style={styles.gridContainer}>
          {/* Invitations shown inline as avatars only */}
          {invitations.map((inv, idx) => (
            <FamilyMemberCircle
              key={inv.id || inv.inviteCode || String(idx)}
              name={`${getInviteeDisplayName(inv.inviteeContact)}${inv.status === 'pending' ? ' (Pending)' : inv.status === 'accepted' ? ' (Accepted)' : ''}`}
              selected={inv.status === 'accepted'}
              onPress={() => setShareModalValue(inv.inviteCode)}
              hideName
            />
          ))}
          {/* Add tile first, left-aligned */}
          <View style={styles.addMemberContainer}>
            <TouchableOpacity style={styles.addButton} onPress={openInviteModal}>
              <Ionicons name="person-add-outline" size={26} color={Colors.primary} />
            </TouchableOpacity>
            <Text style={styles.addText}>Add</Text>
          </View>



          {/* Existing family members */}
          {familyMembers.map((member) => (
            <FamilyMemberCircle
              key={member.viewerId}
              name={member.viewer?.name || 'Family Member'}
              image={member.viewer?.profileImageUrl ? { uri: member.viewer.profileImageUrl } : undefined}
              selected={false}
              onPress={() => handleRevokeAccess(member.viewerId)}
            />
          ))}
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
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.black,
  },
  sectionRefreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionRefreshText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  emptyText: {
    color: Colors.mediumGrey,
    fontSize: 12,
    paddingVertical: 6,
  },
  inviteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.lightGrey,
    borderRadius: 12,
    padding: 12,
  },
  inviteCode: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.black,
  },
  inviteMeta: {
    fontSize: 12,
    color: Colors.mediumGrey,
    marginTop: 2,
  },
  inviteActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  smallBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.lightGrey,
  },
  smallBtnText: {
    color: Colors.black,
    fontWeight: '600',
    fontSize: 12,
  },
  smallBtnPrimary: {
    backgroundColor: Colors.primary,
  },
  smallBtnPrimaryText: {
    color: Colors.white,
  },
  scrollContainer: {
    padding: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.grey,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 2,
    marginBottom: 20,
  },
  ml6: { marginLeft: 6 },
  ml8: { marginLeft: 8 },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.black,
  },
  gridContainer: {
    marginTop: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  addMemberContainer: {
    width: '33%',
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.lightPink,
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
    // backgroundColor: Colors.lightGrey,
    borderWidth: 1,
    borderColor: Colors.lightGrey,
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
