import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const PricingScreen = () => {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState('annual');

    const Feature = ({ text }: { text: string }) => (
    <View style={styles.featureItem}>
      <Image source={require('../../../assets/images/check.png')} style={styles.checkIcon} />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F4F4" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <LinearGradient
          colors={['#6EAD8A', '#5D9275']}
          style={styles.testimonialCard}
        >
          <View style={styles.starsContainer}>
            {[...Array(5)].map((_, i) => <FontAwesome key={i} name="star" size={16} color="#FFD700" />)}
          </View>
          <Text style={styles.testimonialText}>"This app made it so easy to capture all the precious early memories with my baby"</Text>
          <View style={styles.authorContainer}>
            <Image source={require('../../../assets/images/sampleProfile.png')} style={styles.avatar} />
            <View>
              <Text style={styles.authorName}>Alexandra W</Text>
              <Text style={styles.authorLocation}>Carlsbad, CA</Text>
            </View>
          </View>
        </LinearGradient>

        <TouchableOpacity onPress={() => {}}>
          <Text style={styles.giftLink}>Join today for free!</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.planCard, selectedPlan === 'monthly' && styles.selectedPlan]} onPress={() => setSelectedPlan('monthly')}>
          <View style={styles.planDetails}>
            <View style={styles.radioCircle}>
              {selectedPlan === 'monthly' && <Image source={require('../../../assets/images/check.png')} style={styles.radioCheck} />}
            </View>
            <View>
              <Text style={styles.planTitle}>Monthly</Text>
              <Text style={styles.planPrice}>$4.99/month</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.planCard, selectedPlan === 'annual' && styles.selectedPlan]} onPress={() => setSelectedPlan('annual')}>
          <View style={styles.planDetails}>
            <View style={styles.radioCircle}>
              {selectedPlan === 'annual' && <Image source={require('../../../assets/images/check.png')} style={styles.radioCheck} />}
            </View>
            <View>
              <Text style={styles.planTitle}>Annual</Text>
              <Text style={styles.planPrice}>$44.99/year</Text>
            </View>
          </View>
          <View style={styles.mostPopularBadge}>
            <Text style={styles.mostPopularBadgeText}>Most Popular</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.whatsIncluded}>What's included</Text>
        <Feature text="Effortless photo & memory journaling" />
        <Feature text="AI-powered, shareable recaps" />
        <Feature text="Personalized reminders, family access, & more" />

      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/(auth)/checkout')}>
          <Text style={styles.buttonText}>Start Free Trial</Text>
        </TouchableOpacity>
        <Text style={styles.trialInfo}>Get 10 days free before being charged</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContainer: { padding: 20 },
  testimonialCard: { borderRadius: 20, padding: 20, marginBottom: 15 },
  starsContainer: { flexDirection: 'row', marginBottom: 10 },
  testimonialText: { color: '#FFFFFF', fontSize: 16, marginBottom: 15, lineHeight: 24 },
  authorContainer: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E0E0E0', marginRight: 10 },
  authorName: { color: '#FFFFFF', fontWeight: 'bold' },
  authorLocation: { color: '#FFFFFF', opacity: 0.8 },
  giftLink: { color: '#5A5A5A', textAlign: 'center', marginBottom: 20, fontWeight: 'bold', fontSize: 16 },
  planCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 12, padding: 20, marginBottom: 15, backgroundColor: '#FFFFFF' },
  selectedPlan: { borderColor: '#5D9275', borderWidth: 2 },
  planDetails: { flexDirection: 'row', alignItems: 'center' },
  planTitle: { fontSize: 18, fontWeight: 'bold', color: '#2F4858' },
  radioCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  radioCheck: { width: 16, height: 16, tintColor: '#5D9275' },
  mostPopularBadge: { backgroundColor: '#5D9275', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  mostPopularBadgeText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 12 },
  planPrice: { fontSize: 16, color: '#2F4858' },
  whatsIncluded: { fontSize: 18, fontWeight: 'bold', color: '#2F4858', marginBottom: 15, marginTop: 10 },
  featureItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  featureText: { marginLeft: 10, fontSize: 16, color: '#2F4858' },
  checkIcon: { width: 20, height: 20, resizeMode: 'contain' },
  footer: { backgroundColor: '#FFFFFF', marginBottom: 20, padding: 20, borderTopWidth: 1, borderColor: '#E0E0E0' },
  button: { backgroundColor: '#5D9275', paddingVertical: 18, borderRadius: 16, alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  trialInfo: { textAlign: 'center', color: '#E58C8A', marginTop: 10, fontSize: 14 },
});

export default PricingScreen;
