import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, StatusBar, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '../../../components/ui/ScreenHeader';
import ReferFriendModal from '../components/ReferFriendModal';
import { Colors } from '../../../theme/colors';
import { ReferralService } from '../../../services/referralService';
import * as Clipboard from 'expo-clipboard';

const ReferAFriendScreen = () => {
  const insets = useSafeAreaInsets();
  const [isModalVisible, setModalVisible] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [stats, setStats] = useState<{ totalReferrals: number; successfulReferrals: number; lastReferralDate: string | null }>({
    totalReferrals: 0,
    successfulReferrals: 0,
    lastReferralDate: null,
  });

  useEffect(() => {
    // Fetch stats and code on mount
    fetchStatsAndCode();
  }, []);

  const ensureReferralCode = async (): Promise<string | null> => {
    try {
      setLoading(true);
      // Ensure we have an authenticated user (allow anonymous)
      const { getAuth, signInAnonymously } = await import('firebase/auth');
      const auth = getAuth();
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }
      const code = await ReferralService.generateReferralCode();
      setReferralCode(code);
      return code;
    } catch (e) {
      console.log('[ReferAFriend] Failed to generate referral code', e);
      setReferralCode(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchStatsAndCode = async () => {
    try {
      setLoading(true);
      const { getAuth, signInAnonymously } = await import('firebase/auth');
      const auth = getAuth();
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }
      const res = await ReferralService.getReferralStats();
      if (res?.referralStats) setStats(res.referralStats);
      const code: string | undefined = res?.referralCode;
      if (code) {
        setReferralCode(code);
      } else {
        // Generate if not present
        await ensureReferralCode();
      }
    } catch (e) {
      console.log('[ReferAFriend] getReferralStats failed, fallback to generate', e);
      await ensureReferralCode();
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!referralCode) {
      await ensureReferralCode();
    }
    setModalVisible(true);
  };

  const handleCopyCode = async () => {
    // Step 1: ensure we have a code
    let code = referralCode;
    if (!code) {
      try {
        code = await ensureReferralCode();
      } catch (e) {
        console.error('[ReferAFriend] ensureReferralCode threw:', e);
      }
    }
    if (!code) {
      Alert.alert('Unavailable', 'Referral code not ready. Try again.');
      return;
    }

    await Clipboard.setStringAsync(code);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      <ScreenHeader title="Refer a Friend" />
      <ReferFriendModal
        visible={isModalVisible}
        onClose={() => setModalVisible(false)}
        shareMessage={`Download the Sproutbook app and use my Sproutbook referral code: ${referralCode ?? ''}`}
      />
      <View style={styles.content}>
        <Image source={require('../../../assets/images/Logo_Icon.png')} style={styles.logo} />
        <Text style={styles.title}>Invite Friends</Text>
        <Text style={styles.subtitle}>
          Do you know someone who might like Sproutbook? Give them a free month!
        </Text>

        <TouchableOpacity style={styles.promoContainer} onPress={handleShare} activeOpacity={0.9}>
          <Image source={require('../../../assets/images/gift_icon.png')} style={styles.promoIcon} />
          <Text style={styles.promoText}>1 free month</Text>
        </TouchableOpacity>

        <Text style={styles.shareLinkTitle}>Referral code</Text>
        <TouchableOpacity activeOpacity={0.8} style={styles.linkContainer} onPress={handleCopyCode}>
          <Text style={styles.linkText}>{referralCode ?? '—'}</Text>
          <TouchableOpacity onPress={handleCopyCode} style={styles.linkIconButton}>
            <Image source={require('../../../assets/images/copy_link_icon.png')} style={styles.linkIcon} />
          </TouchableOpacity>
        </TouchableOpacity>

        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Your referral code</Text>
          <View style={styles.codeBadge}>
            <Text style={styles.codeText}>{referralCode ?? '—'}</Text>
          </View>
          <View style={styles.statsRow}>
            <Text style={styles.statsItem}>Total sent: {stats.totalReferrals}</Text>
            <Text style={styles.statsItem}>Successful: {stats.successfulReferrals}</Text>
          </View>
        </View>

        <Text style={styles.footerText}>
          Give One Month Free To Anyone Who Signs Up Using Your Referral Code. Must Be A New User To Claim Free Month.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    flex: 1,
    marginTop: 40,
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 40,
  },
  logo: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 28,
    color: Colors.black,
    marginTop: 24,
    textAlign: 'center',
    fontFamily: 'Poppins-SemiBold',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.mediumGrey,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
    fontFamily: 'Poppins-Regular',
  },
  promoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginTop: 32,
    width: '100%',
  },
  promoIcon: {
    width: 20,
    height: 20,
    tintColor: Colors.white,
    marginRight: 12,
  },
  promoText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    fontFamily: 'Poppins-SemiBold',
  },
  shareLinkTitle: {
    fontSize: 14,
    color: Colors.black,
    alignSelf: 'flex-start',
    marginTop: 40,
    marginBottom: 8,
    fontFamily: 'Poppins-Regular',
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightPink2,
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 16,
    width: '100%',
  },
  linkText: {
    flex: 1,
    fontSize: 16,
    color: Colors.grey,
    fontFamily: 'Poppins-Regular',
  },
  linkIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.lightPink2,
    marginLeft: 8,
  },
  linkIcon: {
    width: 20,
    height: 20,
    tintColor: Colors.primary,
  },
  statsContainer: {
    marginTop: 24,
    width: '100%',
    alignItems: 'center',
  },
  statsTitle: {
    fontSize: 14,
    color: Colors.black,
    marginBottom: 8,
    fontFamily: 'Poppins-Regular',
  },
  codeBadge: {
    backgroundColor: Colors.lightPink2,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  codeText: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.primary,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
  },
  statsItem: {
    fontSize: 13,
    color: Colors.mediumGrey,
    fontFamily: 'Poppins-Regular',
  },
  footerText: {
    fontSize: 12,
    color: Colors.primary,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 18,
    fontFamily: 'Poppins-Regular',
  },
});

export default ReferAFriendScreen;
