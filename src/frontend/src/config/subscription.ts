import type { ShoppingItem } from '../backend';

// Default fallback subscription fee (in cents)
export const DEFAULT_SUBSCRIPTION_FEE_CENTS = 999; // $9.99

// Helper to create subscription shopping item from fee in cents
export function createSubscriptionItem(feeInCents: number): ShoppingItem {
  return {
    productName: 'HandyConnect Subscription',
    productDescription: 'One-time subscription fee to join HandyConnect platform',
    currency: 'usd',
    priceInCents: BigInt(feeInCents),
    quantity: BigInt(1),
  };
}

// Minimum subscription configuration for onboarding (fallback)
export const MINIMUM_SUBSCRIPTION: ShoppingItem = createSubscriptionItem(DEFAULT_SUBSCRIPTION_FEE_CENTS);
