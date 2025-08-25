# Stripe Payment Integration Plan

## Current Pricing Flow Analysis
Based on the current navigation flow:
```
Verification → Pricing → Checkout → Success → Login → Add Profile → Add Child → Journal
```

## Stripe Integration Options

### Option 1: Stripe Payment Links (Easiest - 30 mins)
**How it works:**
- Use Stripe Dashboard to create payment links
- Redirect users to Stripe-hosted checkout pages
- No backend code required

**Setup:**
1. Go to stripe.com → Products → Create product
2. Set price (e.g., $9.99/month for premium)
3. Copy payment link
4. In pricing screen: `Linking.openURL('https://buy.stripe.com/your-link')`

**Pros:**
- ✅ No backend required
- ✅ Stripe handles everything
- ✅ PCI compliant
- ✅ Takes 5 minutes to set up

**Cons:**
- ❌ Limited customization
- ❌ Can't capture user data during payment

### Option 2: Stripe Checkout (Medium - 1 hour)
**How it works:**
- Use Stripe Checkout SDK
- Custom checkout flow within app
- Still Stripe-hosted but branded

**Setup:**
```bash
npm install @stripe/stripe-react-native
```

**Code structure:**
```typescript
// In CheckoutScreen.tsx
import { useStripe } from '@stripe/stripe-react-native';

const CheckoutScreen = () => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  
  const handlePayment = async () => {
    // 1. Create payment intent on backend
    // 2. Initialize payment sheet
    // 3. Present payment UI
  };
};
```

### Option 3: Full Stripe Integration (Advanced - 2-3 hours)
**How it works:**
- Custom payment forms
- Firebase Functions for backend
- Webhook handling

**Components needed:**
- Firebase Functions for payment processing
- Stripe webhooks for events
- User subscription management
- Receipt handling

## Recommended Implementation: Payment Links (Start Here)

### Step 1: Stripe Dashboard Setup (5 minutes)
1. Create Stripe account at stripe.com
2. Go to "Products" → "Add product"
3. Set:
   - Name: "SproutBook Premium"
   - Price: $9.99/month (or your price)
   - Billing period: Monthly
4. Copy the "Payment link"

### Step 2: Update Pricing Screen
```typescript
// In PricingScreen.tsx
import { Linking } from 'react-native';

const handleSubscribe = () => {
  Linking.openURL('https://buy.stripe.com/your-payment-link-here');
};
```

### Step 3: Handle Payment Success
Since Payment Links redirect externally, handle return:
```typescript
// In SuccessScreen.tsx
// After payment, Stripe redirects back to your app
// Use deep linking to handle return
```

### Step 4: Firebase Integration
Add subscription status to user profile:
```typescript
// In Firestore: users/{userId}
{
  subscription: {
    status: 'active' | 'inactive',
    stripeCustomerId: 'cus_xxx',
    currentPeriodEnd: timestamp
  }
}
```

## Advanced Setup (When Ready)

### Firebase Functions Setup
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Initialize functions
firebase init functions

# Install Stripe
cd functions && npm install stripe
```

### Environment Variables
```bash
# Add to .env
STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
```

### Pricing Strategy Options

#### Option A: Simple One-Time Payment
- **Price**: $9.99 one-time
- **Access**: Lifetime premium
- **Setup**: Payment Links (5 mins)

#### Option B: Subscription Model
- **Price**: $5.99/month
- **Features**: All premium features
- **Setup**: Stripe Checkout (1 hour)

#### Option C: Freemium Model
- **Free**: Basic features
- **Premium**: $9.99/month for advanced features
- **Setup**: Full integration (2-3 hours)

## Quick Start Checklist

### Level 1: Payment Links (5 minutes)
- [ ] Create Stripe account
- [ ] Create product in Stripe dashboard
- [ ] Copy payment link
- [ ] Update pricing screen with link
- [ ] Test payment flow

### Level 2: Stripe Checkout (1 hour)
- [ ] Install Stripe React Native SDK
- [ ] Set up Firebase Functions
- [ ] Create payment intent endpoint
- [ ] Implement checkout flow
- [ ] Handle payment success/failure

### Level 3: Full Integration (2-3 hours)
- [ ] Set up webhooks
- [ ] Handle subscription management
- [ ] Implement receipt system
- [ ] Add subscription status checks
- [ ] Handle upgrades/cancellations

## Testing Strategy

### Test Cards for Development
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

### Testing Flow
1. Test with test card
2. Verify payment appears in Stripe dashboard
3. Check user subscription status updates
4. Test subscription renewal
5. Test cancellation flow

## Security Considerations

- Never expose secret keys in client code
- Use Firebase Functions for sensitive operations
- Validate all webhook signatures
- Store subscription status securely
- Implement proper access control based on subscription

## Next Steps

1. **Choose your level** (recommend starting with Payment Links)
2. **Create Stripe account** (5 minutes)
3. **Set up first product** (5 minutes)
4. **Test payment flow** (10 minutes)
5. **Enhance based on needs** (later)

**Recommendation**: Start with Payment Links for MVP, then upgrade to full integration as needed.
