import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, StatusBar, Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '../../../components/ui/ScreenHeader';
import ReferFriendModal from '../components/ReferFriendModal';

const ReferAFriendScreen = () => {
  const insets = useSafeAreaInsets();
  const referralLink = 'https://sproutbook.design';
  const [isModalVisible, setModalVisible] = useState(false);

  const handleShare = () => {
    setModalVisible(true);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScreenHeader title="Refer a Friend" showShareIcon onSharePress={handleShare} />
      <ReferFriendModal visible={isModalVisible} onClose={() => setModalVisible(false)} />
      <View style={styles.content}>
        <Image source={require('../../../assets/images/Logo_Icon.png')} style={styles.logo} />
        <Text style={styles.title}>Invite Friends</Text>
        <Text style={styles.subtitle}>
          Do you know someone who might like Sproutbook? Give them a free month!
        </Text>

        <View style={styles.promoContainer}>
          <Image source={require('../../../assets/images/ticket.png')} style={styles.promoIcon} />
          <Text style={styles.promoText}>1 free month</Text>
        </View>

        <Text style={styles.shareLinkTitle}>Share link</Text>
        <View style={styles.linkContainer}>
          <Text style={styles.linkText}>{referralLink}</Text>
          <TouchableOpacity onPress={handleShare}>
            <Image source={require('../../../assets/images/paperclip-2_icon.png')} style={styles.copyIcon} />
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
    backgroundColor: '#FFFFFF',
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
    fontWeight: 'bold',
    color: '#2F4858',
    marginTop: 24,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: "gray",
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
  },
  promoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginTop: 32,
  },
  promoIcon: {
    width: 20,
    height: 20,
    tintColor: '#5D9275',
    marginRight: 12,
  },
  promoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2F4858',
  },
  shareLinkTitle: {
    fontSize: 14,
    color: '#2F4858',
    alignSelf: 'flex-start',
    marginTop: 40,
    marginBottom: 8,
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    width: '100%',
  },
  linkText: {
    flex: 1,
    fontSize: 16,
    color: '#2F4858',
  },
  copyIcon: {
    width: 20,
    height: 20,
    tintColor: '#5D9275',
  },
  footerText: {
    fontSize: 12,
    color: '#5D9275',
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 18,
  },
});

export default ReferAFriendScreen;
