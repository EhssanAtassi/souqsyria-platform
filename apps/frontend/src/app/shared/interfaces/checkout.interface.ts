/**
 * Checkout interfaces for Syrian marketplace
 * Designed for B2C e-commerce with Syrian-specific requirements
 * Supports multi-step checkout, governorate-based shipping, and local payment methods
 *
 * @swagger
 * components:
 *   schemas:
 *     Checkout:
 *       type: object
 *       description: Complete checkout state
 *       required:
 *         - currentStep
 *         - shippingAddress
 *         - paymentMethod
 *       properties:
 *         id:
 *           type: string
 *         currentStep:
 *           type: integer
 *           minimum: 0
 *           maximum: 2
 *         shippingAddress:
 *           $ref: '#/components/schemas/ShippingAddress'
 *         paymentMethod:
 *           $ref: '#/components/schemas/PaymentMethod'
 */

/**
 * Checkout step enumeration
 * Defines the multi-step checkout process
 */
export enum CheckoutStep {
  SHIPPING = 0,
  PAYMENT = 1,
  REVIEW = 2
}

/**
 * Main checkout state interface
 * Contains all information for the checkout process
 */
export interface Checkout {
  /** Unique checkout identifier */
  id: string;

  /** Current step in checkout process (0-2) */
  currentStep: number;

  /** Array of completed step indices */
  completedSteps: number[];

  /** Shipping address information */
  shippingAddress: ShippingAddress | null;

  /** Billing address (if different from shipping) */
  billingAddress: ShippingAddress | null;

  /** Whether billing address is same as shipping */
  useSameAddress: boolean;

  /** Selected payment method */
  paymentMethod: PaymentMethod;

  /** Customer order notes */
  orderNotes: string;

  /** Special delivery instructions */
  specialInstructions: string;

  /** Estimated delivery date */
  estimatedDelivery: Date | null;

  /** Calculated shipping cost based on governorate */
  shippingCost: number;

  /** Selected shipping method ID */
  selectedShippingMethod: string;

  /** Agreement to terms and conditions */
  agreedToTerms: boolean;

  /** Newsletter subscription opt-in */
  subscribedToNewsletter: boolean;

  /** Validation errors array */
  validationErrors: CheckoutValidationError[];

  /** Processing state (e.g., submitting order) */
  isProcessing: boolean;

  /** Last update timestamp */
  lastUpdated: Date;

  /** Checkout creation timestamp */
  createdAt: Date;
}

/**
 * Shipping address interface for Syrian marketplace
 * Includes governorate-based addressing system
 */
export interface ShippingAddress {
  /** Customer first name */
  firstName: string;

  /** Customer last name */
  lastName: string;

  /** Email address for order updates */
  email: string;

  /** Phone number (Syrian format) */
  phone: string;

  /** Street address */
  address: string;

  /** Building/apartment number */
  addressLine2?: string;

  /** Syrian governorate ID */
  governorate: string;

  /** Governorate display name (English) */
  governorateName: string;

  /** Governorate display name (Arabic) */
  governorateNameAr?: string;

  /** City/town within governorate */
  city: string;

  /** Region/district within city */
  region?: string;

  /** Postal code (if applicable) */
  postalCode?: string;

  /** Shipping zone (1-4) for cost calculation */
  shippingZone: number;

  /** Landmark or nearby reference point */
  landmark?: string;

  /** Is this the default shipping address */
  isDefault?: boolean;

  /** Address type (home, work, other) */
  addressType?: 'home' | 'work' | 'other';
}

/**
 * Payment method interface
 * Supports Syrian local payment methods
 */
export interface PaymentMethod {
  /** Payment method unique ID */
  id: string;

  /** Payment method type */
  type: 'cod' | 'bank_transfer' | 'mobile_wallet' | 'credit_card';

  /** Payment method name (English) */
  name: string;

  /** Payment method name (Arabic) */
  nameAr: string;

  /** Description (English) */
  description: string;

  /** Description (Arabic) */
  descriptionAr: string;

  /** Icon or logo URL */
  icon?: string;

  /** Whether this method is currently available */
  isAvailable: boolean;

  /** Processing fee (if applicable) */
  processingFee: number;

  /** Additional payment details */
  details?: PaymentMethodDetails;
}

/**
 * Payment method specific details
 * Contains provider-specific information
 */
export interface PaymentMethodDetails {
  /** For bank transfer */
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  iban?: string;
  swiftCode?: string;

  /** For mobile wallet */
  walletProvider?: 'syriatel_cash' | 'mtn_mobile_money';
  walletNumber?: string;

  /** For credit card */
  cardNumber?: string;
  cardholderName?: string;
  expiryMonth?: string;
  expiryYear?: string;
  cvv?: string;
}

/**
 * Order summary interface
 * Used for final review step
 */
export interface OrderSummary {
  /** Order items count */
  itemsCount: number;

  /** Subtotal amount */
  subtotal: number;

  /** Shipping cost */
  shipping: number;

  /** Tax amount (if applicable) */
  tax?: number;

  /** Discount amount */
  discount: number;

  /** Grand total */
  total: number;

  /** Currency code */
  currency: string;

  /** Applied coupon code */
  couponCode?: string;

  /** Estimated delivery date */
  estimatedDelivery: Date | null;

  /** Shipping method name */
  shippingMethod: string;

  /** Payment method name */
  paymentMethod: string;
}

/**
 * Order confirmation interface
 * Returned after successful order placement
 */
export interface OrderConfirmation {
  /** Unique order number */
  orderNumber: string;

  /** Order ID */
  orderId: string;

  /** Order status */
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered';

  /** Order total */
  total: number;

  /** Currency */
  currency: string;

  /** Order date */
  orderDate: Date;

  /** Estimated delivery date */
  estimatedDelivery: Date;

  /** Tracking number (if available) */
  trackingNumber?: string;

  /** Payment instructions (for COD or bank transfer) */
  paymentInstructions?: string;

  /** Customer email for confirmation */
  customerEmail: string;

  /** Next steps guidance */
  nextSteps: string[];
}

/**
 * Checkout validation error interface
 */
export interface CheckoutValidationError {
  /** Error field name */
  field: string;

  /** Error type */
  type: 'required' | 'invalid_format' | 'out_of_stock' | 'shipping_unavailable' | 'payment_failed';

  /** Error message (English) */
  message: string;

  /** Error message (Arabic) */
  messageAr?: string;

  /** Step where error occurred */
  step: CheckoutStep;
}

/**
 * Shipping method interface
 */
export interface ShippingMethod {
  /** Method ID */
  id: string;

  /** Method name (English) */
  name: string;

  /** Method name (Arabic) */
  nameAr: string;

  /** Delivery time estimate */
  estimatedDays: number;

  /** Base cost */
  baseCost: number;

  /** Cost per kg (for weight-based) */
  costPerKg?: number;

  /** Whether available for governorate */
  availableForZone: number[];

  /** Is this the default method */
  isDefault: boolean;
}

/**
 * Available payment methods in Syrian marketplace
 */
export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'cod',
    type: 'cod',
    name: 'Cash on Delivery',
    nameAr: 'الدفع عند الاستلام',
    description: 'Pay in cash when your order arrives',
    descriptionAr: 'ادفع نقداً عند وصول طلبك',
    icon: 'payments',
    isAvailable: true,
    processingFee: 0
  },
  {
    id: 'syriatel_cash',
    type: 'mobile_wallet',
    name: 'Syriatel Cash',
    nameAr: 'سيرياتيل كاش',
    description: 'Pay using Syriatel Cash mobile wallet',
    descriptionAr: 'الدفع عبر محفظة سيرياتيل كاش',
    icon: 'phone_android',
    isAvailable: true,
    processingFee: 0,
    details: {
      walletProvider: 'syriatel_cash'
    }
  },
  {
    id: 'mtn_wallet',
    type: 'mobile_wallet',
    name: 'MTN Mobile Money',
    nameAr: 'MTN موبايل موني',
    description: 'Pay using MTN Mobile Money',
    descriptionAr: 'الدفع عبر MTN موبايل موني',
    icon: 'phone_android',
    isAvailable: true,
    processingFee: 0,
    details: {
      walletProvider: 'mtn_mobile_money'
    }
  },
  {
    id: 'bank_transfer',
    type: 'bank_transfer',
    name: 'Bank Transfer',
    nameAr: 'تحويل بنكي',
    description: 'Transfer payment to our bank account',
    descriptionAr: 'حول المبلغ إلى حسابنا البنكي',
    icon: 'account_balance',
    isAvailable: true,
    processingFee: 0
  }
];

/**
 * Syrian governorate shipping zones and costs
 * Zone 1: Damascus area (fastest, cheapest)
 * Zone 2: Major cities (Aleppo, Homs, Hama, Latakia)
 * Zone 3: Other governorates
 * Zone 4: Remote areas
 */
export const SHIPPING_COSTS: Record<number, number> = {
  1: 5000,   // Zone 1: Damascus - 5,000 SYP
  2: 10000,  // Zone 2: Major cities - 10,000 SYP
  3: 15000,  // Zone 3: Other governorates - 15,000 SYP
  4: 20000   // Zone 4: Remote areas - 20,000 SYP
};

/**
 * Estimated delivery times by zone (in days)
 */
export const DELIVERY_TIMES: Record<number, number> = {
  1: 2,  // Zone 1: 1-2 days
  2: 4,  // Zone 2: 3-4 days
  3: 6,  // Zone 3: 5-6 days
  4: 8   // Zone 4: 7-8 days
};
