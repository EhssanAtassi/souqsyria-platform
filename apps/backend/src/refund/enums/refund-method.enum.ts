/**
 * Enum for how a refund will be delivered to the user.
 */
export enum RefundMethod {
  MANUAL = 'manual', // via cash or manual bank refund
  WALLET = 'wallet', // refunded to in-app balance
  CARD = 'card', // refunded via Stripe/PayPal/etc
}
