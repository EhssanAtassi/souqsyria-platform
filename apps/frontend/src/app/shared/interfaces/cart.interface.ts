/**
 * Shopping cart interfaces for Syrian marketplace
 * Designed for B2C e-commerce with multi-vendor support and international shipping
 * 
 * @swagger
 * components:
 *   schemas:
 *     CartItem:
 *       type: object
 *       required:
 *         - id
 *         - product
 *         - quantity
 *         - price
 *       properties:
 *         id:
 *           type: string
 *           description: Unique cart item identifier
 *         product:
 *           $ref: '#/components/schemas/Product'
 *         quantity:
 *           type: number
 *           description: Quantity of the product
 *         selectedVariant:
 *           $ref: '#/components/schemas/ProductVariant'
 *         selectedShippingMethod:
 *           type: string
 *           description: Selected shipping method ID
 *         price:
 *           $ref: '#/components/schemas/CartItemPrice'
 *         addedAt:
 *           type: string
 *           format: date-time
 *           description: When item was added to cart
 */

import { Product, ProductVariant, ShippingMethod } from './product.interface';

/**
 * Shopping cart item interface
 * Represents a product with selected options in the cart
 */
export interface CartItem {
  /** Unique cart item identifier */
  id: string;

  /** Product information */
  product: Product;

  /** Selected quantity */
  quantity: number;

  /** Selected product variant if applicable */
  selectedVariant?: ProductVariant;

  /** Selected shipping method ID */
  selectedShippingMethod?: string;

  /** Price information for this cart item */
  price: CartItemPrice;

  /** When this item was added to cart */
  addedAt: Date;

  /** Notes or special instructions */
  notes?: string;

  // Price Locking Fields (User Story 4)
  /** Price snapshot at time of adding to cart (for 7-day price lock) */
  priceAtAdd?: number;

  /** Price lock expiration date (addedAt + 7 days) */
  lockedUntil?: Date;

  /** Whether the price lock has expired */
  isLockExpired?: boolean;

  /** Effective price (min of priceAtAdd and current price if not expired) */
  effectivePrice?: number;
}

/**
 * Cart item price breakdown
 */
export interface CartItemPrice {
  /** Base price per unit */
  unitPrice: number;
  
  /** Total price for quantity */
  totalPrice: number;
  
  /** Discount amount if applicable */
  discount?: number;
  
  /** Shipping cost for this item */
  shipping: number;
  
  /** Currency */
  currency: string;
}

/**
 * Shopping cart summary interface
 * Contains all cart items and totals
 */
export interface Cart {
  /** Cart unique identifier */
  id: string;

  /** All items in the cart */
  items: CartItem[];

  /** Cart totals */
  totals: CartTotals;

  /** Selected currency for display */
  selectedCurrency: 'USD' | 'EUR' | 'SYP';

  /** Applied coupon if any */
  appliedCoupon?: CartCoupon | null;

  /** Cart creation timestamp */
  createdAt: Date;

  /** Cart last updated timestamp */
  updatedAt: Date;

  /** Cart expiry date */
  expiresAt?: Date;

  /** Customer session ID */
  sessionId?: string;

  // Server Sync Fields (User Story 2)
  /** Cart version for optimistic locking and conflict resolution */
  version?: number;

  /** Last successful sync timestamp */
  lastSyncedAt?: Date;

  /** Current sync status */
  syncStatus?: 'synced' | 'pending' | 'offline' | 'syncing' | 'conflict';

  /** User ID (for authenticated users) */
  userId?: string;
}

/**
 * Cart financial totals
 */
export interface CartTotals {
  /** Subtotal before shipping and taxes */
  subtotal: number;
  
  /** Total shipping cost */
  shipping: number;
  
  /** Total discount amount */
  discount: number;
  
  /** Tax amount if applicable */
  tax?: number;
  
  /** Grand total */
  total: number;
  
  /** Currency */
  currency: string;
  
  /** Number of items */
  itemCount: number;
  
  /** Total weight for shipping calculation */
  totalWeight?: number;
}

/**
 * Cart operations interface
 */
export interface CartOperations {
  /** Add item to cart */
  addItem(productId: string, quantity: number, options?: CartItemOptions): void;
  
  /** Remove item from cart */
  removeItem(cartItemId: string): void;
  
  /** Update item quantity */
  updateQuantity(cartItemId: string, quantity: number): void;
  
  /** Update shipping method for item */
  updateShippingMethod(cartItemId: string, shippingMethodId: string): void;
  
  /** Clear entire cart */
  clearCart(): void;
  
  /** Apply coupon or discount code */
  applyCoupon(couponCode: string): void;
  
  /** Remove coupon */
  removeCoupon(): void;
}

/**
 * Options when adding item to cart
 */
export interface CartItemOptions {
  /** Selected product variant */
  variantId?: string;
  
  /** Selected shipping method */
  shippingMethodId?: string;
  
  /** Special notes or instructions */
  notes?: string;
  
  /** Gift wrapping option */
  giftWrap?: boolean;
}

/**
 * Coupon/Discount code interface
 */
export interface CartCoupon {
  /** Coupon code */
  code: string;
  
  /** Coupon name/description */
  name: string;
  
  /** Discount type */
  type: 'percentage' | 'fixed' | 'free_shipping';
  
  /** Discount value */
  value: number;
  
  /** Minimum order amount required */
  minOrderAmount?: number;
  
  /** Maximum discount amount */
  maxDiscountAmount?: number;
  
  /** Currency */
  currency: string;
  
  /** Expiry date */
  expiresAt?: Date;
  
  /** Whether coupon is valid */
  isValid: boolean;
}

/**
 * Cart grouped by seller/vendor
 * Useful for multi-vendor marketplaces
 */
export interface CartGroupedBySeller {
  /** Seller information */
  seller: {
    id: string;
    name: string;
    location: string;
  };
  
  /** Items from this seller */
  items: CartItem[];
  
  /** Subtotal for this seller's items */
  subtotal: number;
  
  /** Shipping cost for this seller */
  shipping: number;
  
  /** Total for this seller */
  total: number;
}

/**
 * Cart validation result
 */
export interface CartValidationResult {
  /** Whether cart is valid */
  isValid: boolean;
  
  /** Validation errors */
  errors: CartValidationError[];
  
  /** Warnings */
  warnings: CartValidationWarning[];
}

/**
 * Cart validation error
 */
export interface CartValidationError {
  /** Error type */
  type: 'out_of_stock' | 'price_changed' | 'shipping_unavailable' | 'quantity_invalid';
  
  /** Cart item ID affected */
  cartItemId: string;
  
  /** Error message */
  message: string;
  
  /** Current value */
  currentValue?: any;
  
  /** Expected value */
  expectedValue?: any;
}

/**
 * Cart validation warning
 */
export interface CartValidationWarning {
  /** Warning type */
  type: 'low_stock' | 'price_increase' | 'shipping_delay';
  
  /** Cart item ID affected */
  cartItemId?: string;
  
  /** Warning message */
  message: string;
}

/**
 * Saved cart for later (wishlist-like functionality)
 */
export interface SavedCart {
  /** Saved cart ID */
  id: string;
  
  /** Cart name/title */
  name: string;
  
  /** Cart items */
  items: CartItem[];
  
  /** When cart was saved */
  savedAt: Date;
  
  /** Customer ID */
  customerId?: string;
}