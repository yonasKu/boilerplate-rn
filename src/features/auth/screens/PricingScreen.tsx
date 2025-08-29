import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Image, StatusBar, TouchableOpacity, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../../theme/colors';
import Purchases, { PurchasesPackage } from 'react-native-purchases';
import { PromoCodeModal } from '@/features/subscriptions/components/PromoCodeModal';

const PricingScreen = () => {
  const router = useRouter();
  const [showPlans, setShowPlans] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'annual' | 'monthly'>('annual');
  const [loadingOfferings, setLoadingOfferings] = useState(false);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [billingError, setBillingError] = useState<string | undefined>();
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoCompDays, setPromoCompDays] = useState<number | undefined>(undefined);

  useEffect(() => {
    // Try to load offerings defensively. Will fail gracefully if SDK not configured yet
    (async () => {
      setLoadingOfferings(true);
      setBillingError(undefined);
      try {
        const offerings = await Purchases.getOfferings();
        const current = offerings.current;
        setPackages(current?.availablePackages ?? []);
      } catch (e: any) {
        // Keys not set or products not configured yet
        setBillingError(e?.message || 'Billing not configured yet');
      } finally {
        setLoadingOfferings(false);
      }
    })();
  }, []);

  const handlePayment = async () => {
    try {
      if (!packages.length) {
        setBillingError('Purchases SDK not configured or no packages available yet');
        return;
      }

      // naive mapping: try to pick a package by identifier/title
      const pick = (want: 'annual' | 'monthly') => {
        const byId = packages.find((p) => p.identifier.toLowerCase().includes(want === 'annual' ? 'annual' : 'month'));
        if (byId) return byId;
        const byTitle = packages.find((p) => p.product.title.toLowerCase().includes(want === 'annual' ? 'year' : 'month'));
        return byTitle ?? packages[0];
      };

      const pkg = pick(selectedPlan);
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      if (customerInfo) {
        // Navigate only after successful purchase
        router.replace('/(auth)/add-profile');
      }
    } catch (e: any) {
      // user cancelled or error
      if (!e?.userCancelled) {
        setBillingError(e?.message || 'Purchase failed');
      }
    }
  };

  const restorePurchases = async () => {
    try {
      await Purchases.restorePurchases();
    } catch (e) {
      // ignore
    }
  };

  const onOpenRedeem = () => {
    console.log('[PricingScreen] promo:openModal');
    setShowPromoModal(true);
  };

  const onRedeemSuccess = (reward: any) => {
    console.log('[PricingScreen] promo:success', reward);
    setPromoApplied(true);
    const days = typeof reward?.compDays === 'number' ? reward.compDays : undefined;
    setPromoCompDays(days);
    Alert.alert('Success', 'Promo code applied successfully.');
    setShowPromoModal(false);
  };

  const Feature = ({ text }: { text: string }) => (
    <View style={styles.featureItem}>
      <Feather name="check" size={16} color={Colors.primary} style={styles.featureIcon} />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );

  const PlanOption = ({ id, price, billing, popular, saved, selected, onPress }: { id: string; price: string; billing: string; popular: boolean; saved: string | boolean; selected: boolean; onPress: () => void }) => (
    <TouchableOpacity onPress={onPress} style={[styles.planOption, selected && styles.planOptionSelected]}>
      <View style={[styles.planRadio, { borderColor: selected ? Colors.primary : Colors.grey }]}>
        {selected && <Feather name="check" size={16} color={Colors.primary} />}
      </View>
      <View style={styles.planDetails}>
        <Text style={styles.planPrice}>{price}</Text>
        <Text style={styles.planBilling}>{billing}</Text>
      </View>
      {popular && selected && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularBadgeText}>Most popular</Text>
        </View>
      )}
      {saved && <View style={styles.savedBadge}><Text style={styles.savedBadgeText}>Save {saved}</Text></View>}
    </TouchableOpacity>
  );

  // ---------- Dynamic pricing labels from RevenueCat (with fallbacks) ----------
  const findPackage = (want: 'annual' | 'monthly') => {
    const wantWord = want === 'annual' ? 'annual' : 'month';
    const wantAlt = want === 'annual' ? 'year' : 'month';
    return packages.find(
      (p) =>
        p.identifier?.toLowerCase?.().includes(wantWord) ||
        p.product?.title?.toLowerCase?.().includes(wantAlt)
    );
  };

  const monthlyPkg = findPackage('monthly');
  const annualPkg = findPackage('annual');

  const monthlyPriceString = monthlyPkg?.product?.priceString;
  const annualPriceString = annualPkg?.product?.priceString;

  const monthlyNumeric = typeof (monthlyPkg as any)?.product?.price === 'number' ? (monthlyPkg as any).product.price as number : undefined;
  const annualNumeric = typeof (annualPkg as any)?.product?.price === 'number' ? (annualPkg as any).product.price as number : undefined;

  const currencyPrefix = (ps?: string) => {
    if (!ps) return undefined;
    const prefix = ps.match(/^[^\d\s]+/);
    if (prefix) return prefix[0];
    return undefined; // Fallback handled below
  };

  let annualPerMonthDisplay: string | undefined;
  if (typeof annualNumeric === 'number' && annualNumeric > 0) {
    const sym = currencyPrefix(annualPriceString) || currencyPrefix(monthlyPriceString) || '$';
    annualPerMonthDisplay = `${sym}${(annualNumeric / 12).toFixed(2)}`;
  }

  let savedLabel: string | boolean = false;
  if (typeof monthlyNumeric === 'number' && typeof annualNumeric === 'number' && monthlyNumeric > 0) {
    const pct = Math.round((1 - (annualNumeric / (monthlyNumeric * 12))) * 100);
    if (pct > 0) savedLabel = `${pct}%`;
  }

  const topPriceText = monthlyPriceString
    ? `Get 10 days free, then just ${monthlyPriceString}/month`
    : 'Get 10 days free, then just $4.99/month';
  const topBillingText = annualPriceString
    ? `(billed ${annualPriceString}/year)`
    : '(billed $59.99/year)';

  const planMonthlyPrice = monthlyPriceString ? `${monthlyPriceString}/month` : '$6.99/month';
  const planMonthlyBilling = 'Billed monthly';
  const planAnnualPrice = annualPerMonthDisplay ? `${annualPerMonthDisplay}/month` : '$5.99/month';
  const planAnnualBilling = annualPriceString ? `Billed at ${annualPriceString}/year` : 'Billed at $59.99/year';
  const savedForAnnual: string | boolean = packages.length ? savedLabel : '29%';

  // Dynamic title reflecting applied promo
  const dynamicTitle = promoApplied
    ? (promoCompDays && promoCompDays >= 365 ? 'Start with 1 free year!' : 'Start with 1 free month!')
    : 'Start with 10 days free';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.contentContainer}>
          <View style={styles.contentColumn}>
            <Text style={styles.title}>{dynamicTitle}</Text>
            <View style={styles.featuresContainer}>
              <Text style={styles.subtitle}>Capture your baby's journey today with:</Text>
              <Feature text="Effortless photo & memory journaling" />
              <Feature text="AI powered, shareable recaps" />
              <Feature text="Automatic, secure family sharing & more" />
            </View>

            <View style={styles.testimonialCard}>
              <View style={styles.testimonialHeader}>
                <View style={styles.starsContainer}>
                  <Image source={require('@/assets/images/5_stars.png')} style={styles.starsImage} />
                </View>
                <View style={styles.authorContainer}>
                  <Text style={styles.authorName}>Alexandra W.</Text>
                  <Image source={require('@/assets/images/sampleProfile.png')} style={styles.authorImage} />
                </View>
              </View>
              <Text style={styles.testimonialText}>
                "This app made it so easy to capture all the precious early memories with my baby"
              </Text>
            </View>

            {!showPlans && (
              <View style={styles.pricingInfoContainer}>
                <Text style={styles.priceText}>{topPriceText}</Text>
                <Text style={styles.billingText}>{topBillingText}</Text>
              </View>
            )}

            {showPlans && (
              <View style={styles.planSelectorContainer}>
                <PlanOption
                  id="annual"
                  price={planAnnualPrice}
                  billing={planAnnualBilling}
                  popular
                  saved={savedForAnnual}
                  selected={selectedPlan === 'annual'}
                  onPress={() => setSelectedPlan('annual')}
                />
                <PlanOption
                  id="monthly"
                  price={planMonthlyPrice}
                  billing={planMonthlyBilling}
                  popular={false}
                  saved={false}
                  selected={selectedPlan === 'monthly'}
                  onPress={() => setSelectedPlan('monthly')}
                />
              </View>
            )}
            <TouchableOpacity onPress={() => setShowPlans(!showPlans)}>
              <Text style={[styles.seePlansText, { color: showPlans ? Colors.grey : Colors.primary }]}>
                {showPlans ? 'Hide plans' : 'See all plans'}
              </Text>
            </TouchableOpacity>

            {!!billingError && (
              <Text style={styles.errorText}>{billingError}</Text>
            )}
            <TouchableOpacity style={styles.paymentButton} onPress={handlePayment} disabled={loadingOfferings}>
              <View style={styles.paymentButtonContent}>
                <Text style={styles.paymentButtonText}>Subscribe with </Text>
                <Image
                  source={Platform.OS === 'ios'
                    ? require('@/assets/images/apple_logo_white.png')
                    : require('@/assets/images/google_logo.png')
                  }
                  style={styles.paymentLogo}
                />
                <Text style={styles.paymentButtonText}> Pay</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={restorePurchases}>
              <Text style={styles.restoreText}>Restore purchases</Text>
            </TouchableOpacity>

            <TouchableOpacity>
              <Text style={styles.moreWaysText}>More ways to pay</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerInfoText}>Get 10 days free before being charged</Text>
          {promoApplied ? (
            <Text style={[styles.promoText, { color: Colors.success }]}>Promo code applied</Text>
          ) : (
            <Text style={styles.promoText}>
              Have a promo code? <Text onPress={onOpenRedeem} style={styles.redeemText}>Redeem code</Text>
            </Text>
          )}
        </View>
      </ScrollView>

      <PromoCodeModal
        isOpen={showPromoModal}
        onClose={() => setShowPromoModal(false)}
        onSuccess={onRedeemSuccess}
      />
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
  contentColumn: {
    width: '90%',
    alignSelf: 'center',
    alignItems: 'center',
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
    color: Colors.darkGrey,
    marginBottom: 26,
    fontFamily: 'Poppins_600SemiBold',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.darkGrey,
    marginBottom: 16,
    textAlign: 'left',
    fontFamily: 'Poppins-400Regular',
  },
  featuresContainer: {
    width: '100%',
    paddingLeft: 16, // aligns icons with testimonial stars inside card (card padding is 16)
    alignSelf: 'center',
    marginBottom: 14,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
    paddingLeft: 26, // text starts at same x as testimonial text (card padding 16 + inner 10)
  },
  featureIcon: {
    position: 'absolute',
    left: 0,
  },
  featureText: {
    fontSize: 14,
    color: Colors.darkGrey,
    marginLeft: 0,
    fontFamily: 'Poppins_400Regular',
  },
  testimonialCard: {
    backgroundColor: "#F9F6F4",
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    width: '100%',
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
    color: Colors.darkGrey,
    marginRight: 8,
    fontFamily: 'Poppins_400Regular',
  },
  authorImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  starsImage: {
    width: 90,
    height: 16,
    resizeMode: 'contain',
  },
  testimonialText: {
    fontSize: 14,
    paddingHorizontal: 10,
    color: Colors.darkGrey,
    lineHeight: 22,
    fontFamily: 'Poppins_400Regular',
  },
  pricingInfoContainer: {
    alignItems: 'center',
    marginBottom: 12,
    marginVertical: 20,
    gap: 4,
  },
  priceText: {
    fontSize: 14,
    color: Colors.darkGrey,
    fontFamily: 'Poppins_500Medium',
  },
  billingText: {
    fontSize: 14,
    color: Colors.mediumGrey,
    marginTop: 4,
    fontFamily: 'Poppins_400Regular',
  },
  seePlansText: {
    fontSize: 15,
    marginBottom: 24,
    fontFamily: 'Poppins_500Medium',
    textDecorationLine: 'underline',
  },
  paymentButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 6,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 12,
  },
  paymentButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontFamily: 'Poppins_500Medium',
    marginHorizontal: -8,
  },
  paymentLogo: {
    width: 45,
    height: 25,
    resizeMode: 'contain',
  },
  moreWaysText: {
    fontSize: 15,
    color: Colors.darkGrey,
    marginBottom: 12,
    fontFamily: 'Poppins_400Regular',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'Poppins_400Regular',
  },
  restoreText: {
    fontSize: 14,
    color: Colors.darkGrey,
    textDecorationLine: 'underline',
    marginBottom: 12,
    fontFamily: 'Poppins_400Regular',
  },
  footer: {
    alignItems: 'center',
    marginBottom: 25,
    width: '100%',
  },
  footerInfoText: {
    fontSize: 14,
    color: Colors.secondary,
    marginBottom: 8,
    fontFamily: 'Poppins_400Regular',
  },
  promoText: {
    fontSize: 14,
    color: Colors.mediumGrey,
    fontFamily: 'Poppins_400Regular',
  },
  redeemText: {
    color: Colors.darkGrey,
    textDecorationLine: 'underline',
    fontFamily: 'Poppins_400Regular',
  },
  planSelectorContainer: {
    width: '95%',
    borderWidth: 1,
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
    borderWidth: 1,
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
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },

  planDetails: {
    flex: 1,
  },
  planPrice: {
    fontSize: 14,
    color: Colors.darkGrey,
    fontFamily: 'Poppins_500Medium',
  },
  planBilling: {
    fontSize: 12,
    color: Colors.mediumGrey,
    fontFamily: 'Poppins_400Regular',
    marginTop: 4,
  },
  popularBadge: {
    marginLeft: 28,
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
    fontFamily: 'Poppins_700Bold',
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
    fontFamily: 'Poppins_700Bold',
  }
});

export default PricingScreen;
