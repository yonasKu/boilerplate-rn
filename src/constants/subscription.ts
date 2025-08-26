// Subscription constants for product IDs and entitlement naming
// Update these to match your RevenueCat and store products

export const SUBSCRIPTION_PRODUCTS = {
  MONTHLY: 'sprout_pro_monthly_v1',
  YEARLY: 'sprout_pro_yearly_v1',
} as const;

export type SubscriptionProductId = typeof SUBSCRIPTION_PRODUCTS[keyof typeof SUBSCRIPTION_PRODUCTS];

// If you use a specific entitlement key in RevenueCat, set it here
export const ENTITLEMENT_PRO = 'pro';

export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  TRIAL: 'trial',
  INACTIVE: 'inactive',
  CANCELLED: 'cancelled',
} as const;

export type SubscriptionStatus = typeof SUBSCRIPTION_STATUS[keyof typeof SUBSCRIPTION_STATUS];
