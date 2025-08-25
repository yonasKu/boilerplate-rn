import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '../../../components/ui/ScreenHeader';
import ReferFriendModal from '../components/ReferFriendModal';
import { Colors } from '../../../theme/colors';

const ReferAFriendScreen = () => {
  const insets = useSafeAreaInsets();
  const referralLink = 'https://sproutbook.design';
  const [isModalVisible, setModalVisible] = useState(false);

  const handleShare = () => {
    setModalVisible(true);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      <ScreenHeader title="Refer a Friend" />
      <ReferFriendModal
        visible={isModalVisible}
        onClose={() => setModalVisible(false)}
        shareMessage={`Download the Sproutbook app! ${referralLink}`}
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

        <Text style={styles.shareLinkTitle}>Share link</Text>
        <View style={styles.linkContainer}>
          <Text style={styles.linkText}>{referralLink}</Text>
          <TouchableOpacity onPress={handleShare} style={styles.linkIconButton}>
            <Image source={require('../../../assets/images/copy_link_icon.png')} style={styles.linkIcon} />
          </TouchableOpacity>
        </View>

        <Text style={styles.footerText}>
          Give One Month Free To Anyone Who Signs Up Using Your Personalized Referral Link. Must Be A New User To Claim Free Month.
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
