import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Colors } from '@/theme';
import { useRouter } from 'expo-router';
import { FamilyService, type SharedAccess } from '@/services/familyService';
import { useActiveTimeline } from '@/context/ActiveTimelineContext';
import { getAuth } from 'firebase/auth';
import { ProfileAvatar } from '@/components/ProfileAvatar';

const ShareWithLovedOnesCard: React.FC = () => {
  const router = useRouter();
  const { activeOwnerId } = useActiveTimeline();
  const auth = getAuth();
  const currentUid = auth.currentUser?.uid;

  const [profiles, setProfiles] = useState<Array<{ uid: string; name: string; profileImageUrl?: string }>>([]);
  const [loading, setLoading] = useState(false);

  const isOwner = useMemo(() => !!activeOwnerId && currentUid === activeOwnerId, [currentUid, activeOwnerId]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!activeOwnerId) return;
      setLoading(true);
      try {
        const list: SharedAccess[] = await FamilyService.getSharedAccess();
        const forOwner = list.filter(sa => sa.ownerId === activeOwnerId && sa.viewer);
        const unique = new Map<string, { uid: string; name: string; profileImageUrl?: string }>();
        forOwner.forEach(sa => {
          if (sa.viewer?.uid) unique.set(sa.viewer.uid, sa.viewer);
        });
        const items = Array.from(unique.values());
        if (!cancelled) setProfiles(items);
      } catch (e) {
        if (!cancelled) setProfiles([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [activeOwnerId]);

  // If there are no shared viewers, keep the original invite card UI
  if (!loading && profiles.length === 0) {
    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.leftIconWrap}>
            <Image source={require('@/assets/images/people_icon.png')} style={styles.leftIcon} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Share with loved ones</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>Share recaps effortlessly by inviting family and friends.</Text>

        <TouchableOpacity style={styles.cta} onPress={() => router.push('/(main)/family-sharing')} activeOpacity={0.85}>
          <Text style={styles.ctaText}>Invite family</Text>
        </TouchableOpacity>

        <View style={styles.footerRow}>
          <View style={styles.avatarsRow}>
            <View style={[styles.avatar, styles.avatar1]} />
            <View style={[styles.avatar, styles.avatar2]} />
            <View style={[styles.avatarAdd]}>
              <Feather name="plus" size={16} color={Colors.mediumGrey} />
            </View>
          </View>
          <Text style={styles.caption}>Loved ones will automatically receive recaps each week</Text>
        </View>
      </View>
    );
  }

  // Otherwise, show the Family sharing card matching the design
  const maxVisible = isOwner ? 3 : 4; // keep space for Add when owner
  const visible = profiles.slice(0, maxVisible);
  const overflow = Math.max(0, profiles.length - visible.length);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.leftIconWrap}>
          <Image source={require('@/assets/images/people_icon.png')} style={styles.leftIcon} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Family sharing</Text>
        </View>
      </View>
      <Text style={styles.subtitle}>Automatically sharing recaps with your loved ones:</Text>

      <View style={styles.membersRow}>
        {visible.map((p) => (
          <View key={p.uid} style={styles.memberItem}>
            <View style={styles.memberAvatarRing}>
              <ProfileAvatar name={p.name} imageUrl={p.profileImageUrl || ''} size={36} textSize={14} />
            </View>
            <Text style={styles.memberName} numberOfLines={1}>
              {p.name}
            </Text>
          </View>
        ))}
        {overflow > 0 && (
          <View style={styles.memberItem}>
            <View style={[styles.memberAvatarRing, styles.overflowCircle]}>
              <Text style={styles.overflowText}>{overflow}+</Text>
            </View>
            <Text style={styles.memberName}>More</Text>
          </View>
        )}
        {isOwner && (
          <TouchableOpacity
            style={styles.memberItem}
            onPress={() => router.push('/(main)/family-sharing')}
            activeOpacity={0.85}
          >
            <View style={[styles.memberAvatarRing, styles.addCircle]}> 
              <Ionicons name="person-add-outline" size={18} color={Colors.primary} />
            </View>
            <Text style={styles.memberName}>Add</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.offWhite,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 8,
  },
  leftIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.offWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftIcon: {
    width: 16,
    height: 16,
    tintColor: Colors.darkGrey,
    resizeMode: 'contain',
  },
  title: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 15,
    color: Colors.darkGrey,
  },
  subtitle: {
    paddingHorizontal: 8,
    color: Colors.darkGrey,
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
  },
  membersRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 16,
    paddingHorizontal: 6,
  },
  memberItem: {
    width: 64,
    alignItems: 'center',
  },
  memberAvatarRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberName: {
    marginTop: 6,
    fontSize: 11,
    color: Colors.darkGrey,
    textAlign: 'center',
    maxWidth: 64,
  },
  cta: {
    alignSelf: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 8,
    borderRadius: 22,
    margin: 6,
  },
  ctaText: {
    color: Colors.white,
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
  },
  footerRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 34,
    height: 34, 
    borderRadius: 17,
  },
  avatar1: {
    width: 34,
    height: 34, 
    borderRadius: 17,
    backgroundColor: Colors.lightPink, // left-most, slightly darker
  },
  avatar2: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.lightPink2,
    marginLeft: -14,
  },
  avatarAdd: {
    backgroundColor: Colors.lightGrey,
    width: 34,
    height: 34,
    borderRadius: 17,
    marginLeft: -14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caption: {
    flex: 1,
    color: Colors.mediumGrey,
    fontSize: 12,
    marginLeft: 12,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'right',
  },
  addCircle: {
    borderWidth: 1,
    borderColor: Colors.lightGrey,
    backgroundColor: Colors.white,
  },
  overflowCircle: {
    backgroundColor: Colors.lightGrey,
  },
  overflowText: {
    color: Colors.blacktext,
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
});

export default ShareWithLovedOnesCard;
