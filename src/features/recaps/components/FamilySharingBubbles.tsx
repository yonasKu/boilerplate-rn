import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/theme';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { FamilyService, SharedAccess, type Invitation } from '@/services/familyService';
import { useActiveTimeline } from '@/context/ActiveTimelineContext';
import { getAuth } from 'firebase/auth';
import { useRouter } from 'expo-router';

const FamilySharingBubbles: React.FC = () => {
    const router = useRouter();
    const { activeOwnerId } = useActiveTimeline();
    const auth = getAuth();
    const currentUid = auth.currentUser?.uid;

    const [profiles, setProfiles] = useState<Array<{uid: string, name: string, profileImageUrl?: string}>>([]);
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    const isOwner = useMemo(() => !!activeOwnerId && currentUid === activeOwnerId, [currentUid, activeOwnerId]);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            if (!activeOwnerId) return;
            setLoading(true);
            try {
                // Accepted family members (viewer profiles) for this owner
                const shared: SharedAccess[] = await FamilyService.getSharedAccess();
                const forOwner = shared.filter(sa => sa.ownerId === activeOwnerId && sa.viewer);
                const uniqueViewers = new Map<string, {uid: string, name: string, profileImageUrl?: string}>();

                forOwner.forEach(sa => {
                    if (sa.viewer && sa.viewer.uid) {
                        uniqueViewers.set(sa.viewer.uid, sa.viewer);
                    }
                });

                // Pending/accepted invitations created by the owner (only load when viewing own timeline)
                let invites: Invitation[] = [];
                if (currentUid && currentUid === activeOwnerId) {
                    try {
                        invites = await FamilyService.getInvitations();
                    } catch (e) {
                        // ignore errors loading invites to avoid blocking accepted viewers display
                    }
                    if (!cancelled) setInvitations(invites);
                } else {
                    if (!cancelled) setInvitations([]);
                }

                // Merge: accepted viewers + accepted/pending invites into a flat list for bubbles
                const fromInvites: Array<{uid: string, name: string, profileImageUrl?: string}> = invites.map(inv => {
                    // Prefer accepted profile
                    const name = inv.acceptedProfile?.name || inv.inviteeName || deriveNameFromContact(inv.inviteeContact);
                    const profileImageUrl = inv.acceptedProfile?.profileImageUrl || '';
                    // Use stable uid-like key for invites to de-dupe against accepted viewers if same user
                    const uid = inv.acceptedProfile?.uid || `invite_${inv.inviteCode}`;
                    return { uid, name, profileImageUrl };
                });

                const mergedMap = new Map<string, {uid: string, name: string, profileImageUrl?: string}>([
                    ...Array.from(uniqueViewers.entries()),
                    ...fromInvites.map(v => [v.uid, v] as const),
                ]);

                const profs = Array.from(mergedMap.values());
                if (!cancelled) setProfiles(profs);
            } catch (e) {
                if (!cancelled) {
                    setProfiles([]);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, [activeOwnerId]);

    const handleAddPress = () => {
        // Navigate to the dedicated Family Sharing screen
        router.push('/(main)/family-sharing');
    };

    if (!activeOwnerId) return null;

    const showPlus = isOwner; // only owners can invite
    const nothingToShow = profiles.length === 0 && !showPlus;
    if (nothingToShow) return null;

    // Compute visible items and overflow
    const maxVisible = 4;
    const visible = profiles.slice(0, maxVisible);
    const overflow = Math.max(0, profiles.length - visible.length);

    function deriveNameFromContact(contact?: string) {
        if (!contact) return 'Invited';
        const at = contact.indexOf('@');
        let base = at > 0 ? contact.slice(0, at) : contact;
        base = base.replace(/[^a-zA-Z0-9]+/g, ' ').trim();
        if (!base) return 'Invited';
        return base.charAt(0).toUpperCase() + base.slice(1);
    }

    return (
        <View style={styles.container}>
            <View style={styles.row}>
                {visible.map((p, idx) => (
                    <View key={p.uid} style={[styles.item, idx > 0 && styles.itemOverlap]}> 
                        <View style={styles.avatarRing}>
                            <ProfileAvatar name={p.name} imageUrl={p.profileImageUrl || ''} size={26} textSize={11} />
                        </View>
                    </View>
                ))}
                {overflow > 0 && (
                    <View style={[styles.item, styles.itemOverlap, styles.overflowItem]}>
                        <Text style={styles.overflowText}>{overflow}+</Text>
                    </View>
                )}
                {showPlus && (
                    <TouchableOpacity style={[styles.item, styles.itemOverlap, styles.addItem]} onPress={handleAddPress} activeOpacity={0.8} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <View style={styles.addCircle}>
                            <Ionicons name="add" size={14} color={Colors.primary} />
                        </View>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    item: {
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 0,
      marginRight: 0,
    },
    itemOverlap: {
      marginLeft: -10,
    },
    avatarRing: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: Colors.white,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Colors.white,
    },
    addItem: {
      justifyContent: 'center',
    },
    addCircle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderColor: Colors.lightGrey,
      backgroundColor: Colors.white,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,

    },
  overflowItem: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: Colors.lightGrey,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: Colors.white,
  },
  overflowText: {
      color: Colors.blacktext,
      fontSize: 12,
      fontWeight: '600',
    },
});

export default FamilySharingBubbles;
