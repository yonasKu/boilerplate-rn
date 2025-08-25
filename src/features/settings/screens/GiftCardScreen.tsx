import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TextInput, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '../../../components/ui/ScreenHeader';
import { Colors } from '../../../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const GiftCardScreen = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [email, setEmail] = useState('');

  const onBuy = () => {
    // TODO: integrate Apple Pay / payment flow
    router.push('/gift-card-confirmation');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Gift cards" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <Image source={require('../../../assets/images/Logo_Icon.png')} style={styles.logo} />

          <Text style={styles.title}>Spread the love</Text>
          <Text style={styles.subtitle}>Do you know someone who might like sproutbook? Gift them 1 Free Year!</Text>

          <TouchableOpacity style={styles.productPill} activeOpacity={0.9}>
            <Text style={styles.productPillText}>1 Year of Sproutbook</Text>
          </TouchableOpacity>

          <Text style={styles.priceText}>$48.00</Text>

          <Text style={styles.label}>Where should we send it?</Text>

          <View style={styles.inputRow}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Recipient's email address"
              placeholderTextColor={Colors.mediumGrey}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
            <View style={styles.inputIconWrap}>
              <Ionicons name="checkmark" size={18} color={Colors.white} />
            </View>
          </View>

          <Text style={styles.noteText}>
            Send a loved one a full year of Sproutbook! Your recipient will receive a special promo code by email, redeemable for an annual subscription. Perfect for new or expecting moms—and a gift parents use the rest of the year! On annual renewal (if already subscribed), they can continue enjoying Sproutbook with their own payment method.
          </Text>

          <TouchableOpacity style={styles.payButton} activeOpacity={0.9} onPress={onBuy}>
            <View style={styles.payButtonContent}>
              <Text style={styles.payButtonText}>Buy with</Text>
              <Image source={require('../../../assets/images/apple_icon.png')} style={styles.appleIcon} />
              <Text style={styles.payButtonText}>pay</Text>
            </View>
          </TouchableOpacity>
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
    paddingTop: 40,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  content: {
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  logo: {
    width: 72,
    height: 72,
    resizeMode: 'contain',
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    color: Colors.black,
    fontFamily: 'Poppins-Bold',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.mediumGrey,
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  productPill: {
    marginTop: 20,
    backgroundColor: Colors.primary,
    borderRadius: 28,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  productPillText: {
    color: Colors.lightPink,
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  priceText: {
    marginTop: 16,
    fontSize: 20,
    color: Colors.black,
    fontFamily: 'Poppins-SemiBold',
  },
  label: {
    marginTop: 18,
    alignSelf: 'flex-start',
    fontSize: 14,
    color: Colors.black,
    fontFamily: 'Poppins-Regular',
  },
  inputRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: Colors.lightPink2,
    borderRadius: 28,
    paddingHorizontal: 14,
    height: 52,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.black,
    fontFamily: 'Poppins-Regular',
  },
  inputIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  noteText: {
    marginTop: 14,
    fontSize: 12,
    color: Colors.primary,
    fontFamily: 'Poppins-Regular',
    lineHeight: 18,
    textAlign: 'center',
  },
  payButton: {
    marginTop: 18,
    alignSelf: 'stretch',
    borderRadius: 28,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    alignItems: 'center',
  },
  payButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  appleIcon: {
    width: 18,
    height: 18,
    tintColor: Colors.white,
    resizeMode: 'contain',
    marginHorizontal: 6,
  },
  payButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
});

export default GiftCardScreen;
