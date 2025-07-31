import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Image, TextInput } from 'react-native';

import { useRouter } from 'expo-router';

const CheckoutScreen = () => {
  const router = useRouter();
  const [selectedPayment, setSelectedPayment] = useState('apple');

  interface PaymentOptionProps {
  id: string;
  icon: any;
  title: string;
  subtitle?: string;
  selected: boolean;
  onSelect: (id: string) => void;
}

const PaymentOption: React.FC<PaymentOptionProps> = ({ id, icon, title, subtitle, selected, onSelect }) => (
    <TouchableOpacity style={[styles.paymentOption, selected && styles.selectedPayment]} onPress={() => onSelect(id)}>
      <Image source={icon} style={styles.paymentIcon} />
      <View style={styles.paymentTextContainer}>
        <Text style={styles.paymentTitle}>{title}</Text>
        {subtitle && <Text style={styles.paymentSubtitle}>{subtitle}</Text>}
      </View>
      <View style={[styles.radioCircle, selected && styles.radioSelected]}>
        {selected && <View style={styles.radioInnerCircle} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Image source={require('../../../assets/images/Logo_Icon_small.png')} style={styles.mainIcon} />
        <Text style={styles.trialText}>10 days free, then</Text>
        <Text style={styles.priceText}>$4.99/month</Text>
        <View style={styles.planBadge}>
          <Text style={styles.planBadgeText}>Monthly Plan</Text>
        </View>

        <Text style={styles.sectionTitle}>Payment Option</Text>
        <PaymentOption
          id="apple"
          icon={require('../../../assets/images/Apple.png')}
          title="Apple Pay"
          subtitle="Pay with Face/Touch ID"
          selected={selectedPayment === 'apple'}
          onSelect={setSelectedPayment}
        />
        <PaymentOption
          id="google"
          icon={require('../../../assets/images/Google.png')}
          title="Google Pay"
          subtitle="Pay with Google"
          selected={selectedPayment === 'google'}
          onSelect={setSelectedPayment}
        />
        <PaymentOption
          id="stripe"
          icon={require('../../../assets/images/Stripe.png')}
          title="Stripe"
          subtitle="Pay with Stripe"
          selected={selectedPayment === 'stripe'}
          onSelect={setSelectedPayment}
        />

        <View style={styles.promoContainer}>
          <Image source={require('../../../assets/images/ticket.png')} style={styles.promoIcon} />
          <TextInput style={styles.promoInput} placeholder="Apply a promo code" />
          <TouchableOpacity>
            <Text style={styles.promoApply}>Apply</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={() => router.replace('/(auth)/login')}>
          <Text style={styles.buttonText}>Start Free Trial</Text>
        </TouchableOpacity>
        <Text style={styles.termsText}>
          By clicking continue you agree to our <Text style={styles.linkText}>Terms of Use</Text> and <Text style={styles.linkText}>Privacy Policy</Text>
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15 },
  urlContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F0F0', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  urlText: { marginLeft: 5, color: '#888' },
  progressBar: { height: 4, backgroundColor: '#5D9275', width: '60%', alignSelf: 'center', borderRadius: 2 },
  scrollContainer: { padding: 20, alignItems: 'center' },
  mainIcon: { width: 40, height: 40, resizeMode: 'contain', marginVertical: 20 },
  trialText: { color: '#888', fontSize: 14, marginBottom: 5 },
  priceText: { fontSize: 28, fontWeight: 'bold', color: '#2F4858', marginBottom: 15 },
  planBadge: { backgroundColor: '#EAF2ED', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8, marginBottom: 30 },
  planBadgeText: { color: '#5D9275', fontWeight: 'bold' },
  sectionTitle: { alignSelf: 'flex-start', fontSize: 16, fontWeight: 'bold', color: '#2F4858', marginBottom: 15 },
  paymentOption: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 12, padding: 15, marginBottom: 10, width: '100%' },
  selectedPayment: { borderColor: '#5D9275', borderWidth: 2 },
  paymentIcon: { width: 24, height: 24, resizeMode: 'contain', marginRight: 15 },
  paymentTextContainer: { flex: 1 },
  paymentTitle: { fontSize: 16, fontWeight: '500' },
  paymentSubtitle: { fontSize: 12, color: '#888' },
  radioCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center' },
  radioSelected: { borderColor: '#5D9275' },
  radioInnerCircle: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#5D9275' },
  promoContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF0F0', borderRadius: 12, padding: 15, width: '100%', marginTop: 10 },
  promoIcon: { width: 20, height: 20, resizeMode: 'contain' },
  promoInput: { flex: 1, marginLeft: 10, color: '#E58C8A' },
  promoApply: { color: '#E58C8A', fontWeight: 'bold' },
  footer: { padding: 20, borderTopWidth: 1, borderColor: '#E0E0E0' },
  button: { backgroundColor: '#5D9275', paddingVertical: 18, borderRadius: 24, alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  termsText: { textAlign: 'center', color: '#A9A9A9', fontSize: 13, marginTop: 20, lineHeight: 20 },
  linkText: { color: '#5D9275' },
});

export default CheckoutScreen;
