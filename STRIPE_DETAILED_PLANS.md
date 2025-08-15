# Detailed Stripe Implementation Plans

## Option 2: Stripe Checkout (Detailed - 1 Hour)

### Overview
Stripe Checkout provides a pre-built, hosted payment page that you redirect users to, then return them to your app. It's more customizable than Payment Links and gives you better control over the user experience.

### Step-by-Step Implementation

#### Phase 1: Setup (15 minutes)

**1. Install Dependencies**
```bash
# Install Stripe React Native SDK
npm install @stripe/stripe-react-native

# Install Firebase Functions for backend
npm install -g firebase-tools
firebase init functions
```

**2. Configure Stripe**
```typescript
// src/lib/stripe/config.ts
export const STRIPE_CONFIG = {
  publishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  merchantIdentifier: 'com.yourapp.sproutbook',
  urlScheme: 'sproutbook',
};

// In App.tsx or root component
import { StripeProvider } from '@stripe/stripe-react-native';

<StripeProvider
  publishableKey={STRIPE_CONFIG.publishableKey}
  merchantIdentifier={STRIPE_CONFIG.merchantIdentifier}
  urlScheme={STRIPE_CONFIG.urlScheme}
>
  <App />
</StripeProvider>
```

#### Phase 2: Firebase Functions Setup (20 minutes)

**1. Create Payment Intent Function**
```typescript
// functions/src/createPaymentIntent.ts
import * as functions from 'firebase-functions';
import Stripe from 'stripe';

const stripe = new Stripe(functions.config().stripe.secret, {
  apiVersion: '2023-10-16',
});

export const createPaymentIntent = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { amount, currency = 'usd', productId } = data;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency,
      metadata: {
        userId: context.auth.uid,
        productId,
      },
    });

    return { clientSecret: paymentIntent.client_secret };
  } catch (error) {
    throw new functions.https.HttpsError('internal', 'Failed to create payment intent');
  }
});
```

**2. Deploy Functions**
```bash
cd functions
npm install stripe
firebase deploy --only functions
```

#### Phase 3: Checkout Screen Implementation (20 minutes)

**1. Create Checkout Screen**
```typescript
// src/features/payment/screens/CheckoutScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { getFunctions, httpsCallable } from 'firebase/functions';

interface CheckoutScreenProps {
  price: number;
  productName: string;
  onPaymentSuccess: () => void;
}

export const CheckoutScreen: React.FC<CheckoutScreenProps> = ({
  price,
  productName,
  onPaymentSuccess,
}) => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);

  const initializePayment = async () => {
    setLoading(true);
    try {
      const functions = getFunctions();
      const createPaymentIntent = httpsCallable(functions, 'createPaymentIntent');
      
      const { data } = await createPaymentIntent({
        amount: price,
        currency: 'usd',
        productId: 'sproutbook_premium',
      });

      const { clientSecret } = data as { clientSecret: string };

      const { error } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'SproutBook',
        returnURL: 'sproutbook://payment-success',
      });

      if (error) {
        Alert.alert('Error', error.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to initialize payment');
    } finally {
      setLoading(false);
    }
  };

  const openPaymentSheet = async () => {
    const { error } = await presentPaymentSheet();

    if (error) {
      Alert.alert('Payment failed', error.message);
    } else {
      Alert.alert('Success', 'Payment completed successfully');
      onPaymentSuccess();
    }
  };

  useEffect(() => {
    initializePayment();
  }, []);

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>
        Complete Your Purchase
      </Text>
      <Text style={{ fontSize: 18, marginBottom: 30 }}>
        {productName}: ${price}
      </Text>
      
      <TouchableOpacity
        style={{
          backgroundColor: '#007AFF',
          padding: 15,
          borderRadius: 8,
          alignItems: 'center',
        }}
        onPress={openPaymentSheet}
        disabled={loading}
      >
        <Text style={{ color: 'white', fontSize: 16 }}>
          {loading ? 'Loading...' : 'Pay Now'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};
```

#### Phase 4: Deep Linking Setup (5 minutes)

**1. Configure app.json**
```json
{
  "expo": {
    "scheme": "sproutbook"
  }
}
```

### Testing Checklist
- [ ] Test card: `4242 4242 4242 4242`
- [ ] Test 3D Secure: `4000 0025 0000 3155`
- [ ] Test decline: `4000 0000 0000 0002`

---

## Option 3: Full Stripe Integration (Detailed - 2-3 Hours)

### Overview
Complete subscription management with recurring billing, webhooks, and user subscription status management.

### Architecture
```
Frontend (React Native) ↔ Firebase Functions ↔ Stripe API ↔ Webhooks
```

### Phase 1: Advanced Setup (30 minutes)

#### 1. Enhanced Firebase Functions
```typescript
// functions/src/index.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

admin.initializeApp();
const stripe = new Stripe(functions.config().stripe.secret, {
  apiVersion: '2023-10-16',
});

// Create customer on user registration
export const createStripeCustomer = functions.auth.user().onCreate(async (user) => {
  const customer = await stripe.customers.create({
    email: user.email,
    metadata: { firebaseUID: user.uid },
  });

  await admin.firestore().collection('users').doc(user.uid).set({
    stripeCustomerId: customer.id,
    subscriptionStatus: 'inactive',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
});

// Create subscription
export const createSubscription = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { priceId } = data;
  const userId = context.auth.uid;

  try {
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    const { stripeCustomerId } = userDoc.data() || {};

    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });

    return {
      subscriptionId: subscription.id,
      clientSecret: (subscription.latest_invoice as any).payment_intent.client_secret,
    };
  } catch (error) {
    throw new functions.https.HttpsError('internal', 'Failed to create subscription');
  }
});

// Cancel subscription
export const cancelSubscription = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;
  const userDoc = await admin.firestore().collection('users').doc(userId).get();
  const { stripeCustomerId } = userDoc.data() || {};

  const subscriptions = await stripe.subscriptions.list({
    customer: stripeCustomerId,
    status: 'active',
    limit: 1,
  });

  if (subscriptions.data.length > 0) {
    await stripe.subscriptions.update(subscriptions.data[0].id, {
      cancel_at_period_end: true,
    });
  }

  return { success: true };
});
```

#### 2. Webhook Handler
```typescript
// functions/src/webhooks.ts
export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = functions.config().stripe.webhook_secret;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).send('Invalid signature');
  }

  switch (event.type) {
    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
      break;
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;
  }

  res.json({ received: true });
});

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const userSnapshot = await admin.firestore()
    .collection('users')
    .where('stripeCustomerId', '==', customerId)
    .get();

  if (!userSnapshot.empty) {
    const userDoc = userSnapshot.docs[0];
    await userDoc.ref.update({
      subscriptionStatus: 'active',
      subscriptionEndDate: new Date(invoice.period_end * 1000),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}
```

### Phase 2: Frontend Implementation (45 minutes)

#### 1. Subscription Management Hook
```typescript
// src/hooks/useSubscription.ts
import { useEffect, useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase/auth';

export interface SubscriptionData {
  status: 'active' | 'inactive' | 'canceled' | 'past_due';
  currentPeriodEnd: Date;
  priceId: string;
}

export const useSubscription = () => {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();

  useEffect(() => {
    if (!auth.currentUser) return;

    const unsubscribe = onSnapshot(
      doc(db, 'users', auth.currentUser.uid),
      (doc) => {
        const data = doc.data();
        if (data?.subscriptionStatus) {
          setSubscription({
            status: data.subscriptionStatus,
            currentPeriodEnd: data.subscriptionEndDate?.toDate(),
            priceId: data.priceId,
          });
        }
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [auth.currentUser]);

  const createSubscription = async (priceId: string) => {
    const functions = getFunctions();
    const createSub = httpsCallable(functions, 'createSubscription');
    
    const { data } = await createSub({ priceId });
    return data as { subscriptionId: string; clientSecret: string };
  };

  const cancelSubscription = async () => {
    const functions = getFunctions();
    const cancelSub = httpsCallable(functions, 'cancelSubscription');
    await cancelSub({});
  };

  return { subscription, loading, createSubscription, cancelSubscription };
};
```

#### 2. Subscription Management Screen
```typescript
// src/features/payment/screens/SubscriptionScreen.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useSubscription } from '../../../hooks/useSubscription';
import { useStripe } from '@stripe/stripe-react-native';

const PRICES = {
  monthly: 'price_monthly_premium',
  yearly: 'price_yearly_premium',
};

export const SubscriptionScreen = () => {
  const { subscription, loading, createSubscription } = useSubscription();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const handleSubscribe = async (priceId: string) => {
    try {
      const { clientSecret } = await createSubscription(priceId);
      
      const { error } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'SproutBook',
      });

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      const { error: paymentError } = await presentPaymentSheet();
      
      if (paymentError) {
        Alert.alert('Payment failed', paymentError.message);
      } else {
        Alert.alert('Success', 'Subscription created successfully');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create subscription');
    }
  };

  if (loading) return <Text>Loading...</Text>;

  return (
    <View style={{ padding: 20 }}>
      {subscription?.status === 'active' ? (
        <View>
          <Text>✅ Premium Active</Text>
          <Text>Renews: {subscription.currentPeriodEnd?.toLocaleDateString()}</Text>
          <TouchableOpacity onPress={() => {}}>
            <Text>Manage Subscription</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          <Text>Choose your plan:</Text>
          <TouchableOpacity onPress={() => handleSubscribe(PRICES.monthly)}>
            <Text>$9.99/month</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleSubscribe(PRICES.yearly)}>
            <Text>$99.99/year (Save 17%)</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};
```

### Phase 3: Security & Configuration (15 minutes)

#### 1. Environment Configuration
```bash
# Firebase Functions config
firebase functions:config:set stripe.secret="sk_test_..."
firebase functions:config:set stripe.webhook_secret="whsec_..."

# Frontend .env
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

#### 2. Firestore Rules Update
```javascript
// Add to firestore.rules
match /users/{userId} {
  allow read: if request.auth != null;
  allow update: if request.auth != null && 
                request.auth.uid == userId &&
                (request.resource.data.keys().hasOnly(['subscriptionStatus', 'subscriptionEndDate', 'stripeCustomerId']) ||
                 request.resource.data.keys().hasAll(['subscriptionStatus', 'subscriptionEndDate']));
}
```

### Testing Checklist

#### Manual Testing
- [ ] Test subscription creation
- [ ] Test payment failure scenarios
- [ ] Test subscription renewal
- [ ] Test cancellation
- [ ] Test webhook handling

#### Automated Testing
```typescript
// Test subscription flow
const testSubscription = async () => {
  const { clientSecret } = await createSubscription('test_price');
  expect(clientSecret).toBeDefined();
};
```

### Deployment Commands
```bash
# Deploy functions
firebase deploy --only functions

# Configure webhooks in Stripe Dashboard
# URL: https://your-region-your-project.cloudfunctions.net/stripeWebhook
# Events: invoice.payment_succeeded, customer.subscription.updated, customer.subscription.deleted
```

### Monitoring & Analytics
- Set up Stripe webhooks for real-time updates
- Monitor failed payments in Stripe Dashboard
- Track subscription metrics in Firebase Analytics
- Set up alerts for failed webhooks
