import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Image, StatusBar, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../../theme/colors';

const PricingScreen = () => {
  const router = useRouter();
  const [showPlans, setShowPlans] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('annual');

  const handlePayment = () => {
    // Stub function for payment processing
    console.log(`${Platform.OS === 'ios' ? 'Apple Pay' : 'Google Pay'} payment initiated`);
    router.push('/(auth)/login');
  };

  const Feature = ({ text }: { text: string }) => (
    <View style={styles.featureItem}>
      <Feather name="check" size={16} color={Colors.darkGrey} />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );

  const PlanOption = ({ id, price, billing, popular, saved, selected, onPress }: { id: string; price: string; billing: string; popular: boolean; saved: string | boolean; selected: boolean; onPress: () => void }) => (
    <TouchableOpacity onPress={onPress} style={[styles.planOption, selected && styles.planOptionSelected]}>
      <View style={styles.planRadio}>
        {selected && <View style={styles.planRadioSelected} />}
      </View>
      <View style={styles.planDetails}>
        <Text style={styles.planPrice}>{price}</Text>
        <Text style={styles.planBilling}>{billing}</Text>
      </View>
      {popular && <View style={styles.popularBadge}><Text style={styles.popularBadgeText}>Most popular</Text></View>}
      {saved && <View style={styles.savedBadge}><Text style={styles.savedBadgeText}>Save {saved}</Text></View>}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.contentContainer}>
          <Text style={styles.title}>Start with 10 days free</Text>
          <Text style={styles.subtitle}>Capture your baby's journey today with:</Text>

          <View style={styles.featuresContainer}>
            <Feature text="Effortless photo & memory journaling" />
            <Feature text="AI powered, shareable recaps" />
            <Feature text="Automatic, secure family sharing & more" />
          </View>

          <View style={styles.testimonialCard}>
            <View style={styles.testimonialHeader}>
              <View style={styles.starsContainer}>
                {[...Array(5)].map((_, i) => (
                  <Feather key={i} name="star" size={16} color="#FFC700" style={{ marginRight: 2 }} />
                ))}
              </View>
              <View style={styles.authorContainer}>
                <Text style={styles.authorName}>Alexandria W.</Text>
                <Image source={require('@/assets/images/sampleProfile.png')} style={styles.authorImage} />
              </View>
            </View>
            <Text style={styles.testimonialText}>
              "This app made it so easy to capture all the precious early memories with my baby"
            </Text>
          </View>

          {!showPlans && (
            <View style={styles.pricingInfoContainer}>
              <Text style={styles.priceText}>Get 10 days free, then just $3.95/month</Text>
              <Text style={styles.billingText}>(billed $40/year)</Text>
            </View>
          )}


          {showPlans && (
            <View style={styles.planSelectorContainer}>
              <PlanOption
                id="annual"
                price="$3.99/month"
                billing="Billed at $48/year"
                popular
                saved="33%"
                selected={selectedPlan === 'annual'}
                onPress={() => setSelectedPlan('annual')}
              />
              <PlanOption
                id="monthly"
                price="$5.99/month"
                billing="Billed monthly"
                popular={false}
                saved={false}
                selected={selectedPlan === 'monthly'}
                onPress={() => setSelectedPlan('monthly')}
              />
            </View>
          )}
          <TouchableOpacity onPress={() => setShowPlans(!showPlans)}>
            <Text style={styles.seePlansText}>{showPlans ? 'Hide plans' : 'See all plans'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.paymentButton} onPress={handlePayment}>
            <View style={styles.paymentButtonContent}>
              <Text style={styles.paymentButtonText}>Subscribe with </Text>
              <Image
                source={Platform.OS === 'ios'
                  ? require('@/assets/images/apple_logo.png')
                  : require('@/assets/images/google_logo.png')
                }
                style={styles.paymentLogo}
              />
              <Text style={styles.paymentButtonText}> Pay</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity>
            <Text style={styles.moreWaysText}>More ways to pay</Text>
          </TouchableOpacity>
        </View>


      </ScrollView>
      <View style={styles.footer}>
        <Text style={styles.footerInfoText}>Get 10 days free before being charged</Text>
        <Text style={styles.promoText}>
          Have a promo code? <Text style={styles.redeemText}>Redeem code</Text>
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollContainer: {
    flexGrow: 1,
    //justifyContent: 'space-between',
  },
  contentContainer: {
    marginVertical: 24,
    padding: 12,
    alignItems: 'center',
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 24,
  },
  progressIndicator: {
    height: 4,
    width: 60,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: Colors.darkGrey,
    //textAlign: 'center',
    marginBottom: 12,

  },
  subtitle: {
    fontSize: 16,
    color: Colors.mediumGrey,
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'Poppins',
  },
  featuresContainer: {
    alignSelf: 'flex-start',
    marginBottom: 14,
    marginLeft: '10%'
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    color: Colors.darkGrey,
    marginLeft: 12,
    fontFamily: 'Poppins',
  },
  testimonialCard: {
    backgroundColor: Colors.lightPink,
    borderRadius: 12,
    padding: 20,
    width: '90%',
    marginBottom: 32,
    alignSelf: 'center',
  },
  testimonialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.darkGrey,
    marginRight: 8,
    fontFamily: 'Poppins',
  },
  authorImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  testimonialText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.darkGrey,
    lineHeight: 22,
    fontFamily: 'Poppins',
  },
  pricingInfoContainer: {
    alignItems: 'center',
    marginBottom: 12,
    marginVertical: 25,
    gap: 4,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.darkGrey,
    fontFamily: 'Poppins',
  },
  billingText: {
    fontSize: 14,
    color: Colors.mediumGrey,
    marginTop: 4,
    fontFamily: 'Poppins',
  },
  seePlansText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.darkGrey,
    textDecorationLine: 'underline',
    marginBottom: 24,
    fontFamily: 'Poppins',
  },
  paymentButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 6,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    width: '90%',
    marginBottom: 12,
  },
  paymentButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Poppins',
    marginHorizontal: -8,
  },
  paymentLogo: {
    width: 45,
    height: 25,
    resizeMode: 'contain',
  },
  moreWaysText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.darkGrey,
    textDecorationLine: 'underline',
    marginBottom: 24,
    fontFamily: 'Poppins',
  },
  footer: {
    alignItems: 'center',
    marginBottom: 25,
    paddingTop: 24,
    width: '100%',
  },
  footerInfoText: {
    fontSize: 14,
    color: Colors.secondary,
    marginBottom: 8,
    fontFamily: 'Poppins',
  },
  promoText: {
    fontSize: 14,
    color: Colors.mediumGrey,
    fontFamily: 'Poppins',
  },
  redeemText: {
    fontWeight: 'bold',
    color: Colors.darkGrey,
    textDecorationLine: 'underline',
    fontFamily: 'Poppins',
  },
  planSelectorContainer: {
    width: '95%',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 20,
    marginBottom: 24,
    paddingTop: 20,
    paddingBottom: 10,
    paddingHorizontal: 10,
    position: 'relative',
    alignItems: 'center',
  },
  planOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    width: '100%',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  planOptionSelected: {
    borderColor: Colors.primary,
  },
  planRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  planRadioSelected: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  planDetails: {
    flex: 1,
  },
  planPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.darkGrey,
    fontFamily: 'Poppins',
  },
  planBilling: {
    fontSize: 14,
    color: Colors.mediumGrey,
    fontFamily: 'Poppins',
  },
  popularBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    position: 'absolute',
    top: -18,
    zIndex: 1,
  },
  popularBadgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Poppins',
  },
  savedBadge: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  savedBadgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Poppins',
  }
});

export default PricingScreen;
