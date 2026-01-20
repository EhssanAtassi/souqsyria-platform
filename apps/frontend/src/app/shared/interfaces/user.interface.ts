// Import types from category-filter.interface.ts 
import type { SyrianGovernorate } from './category-filter.interface';

/**
 * User interface definitions for SouqSyria marketplace
 *
 * Defines user profile data structure, account preferences,
 * bilingual support, and Syrian marketplace specific fields
 *
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       description: Syrian marketplace user profile
 *       properties:
 *         id:
 *           type: string
 *           description: Unique user identifier
 *         email:
 *           type: string
 *           format: email
 *           description: User email address
 *         firstName:
 *           type: string
 *           description: User first name in selected language
 *         lastName:
 *           type: string
 *           description: User last name in selected language
 *         firstNameAr:
 *           type: string
 *           description: User first name in Arabic
 *         lastNameAr:
 *           type: string
 *           description: User last name in Arabic
 *         firstNameEn:
 *           type: string
 *           description: User first name in English
 *         lastNameEn:
 *           type: string
 *           description: User last name in English
 *         preferredLanguage:
 *           type: string
 *           enum: [en, ar]
 *           description: User preferred language (English/Arabic)
 *         preferredCurrency:
 *           type: string
 *           enum: [SYP, USD, EUR]
 *           description: Preferred currency for display
 *         profilePicture:
 *           type: string
 *           description: Profile picture URL
 *         phoneNumber:
 *           type: string
 *           description: Phone number with country code
 *         syrianOriginCity:
 *           type: string
 *           description: Syrian origin city
 *         diasporaLocation:
 *           type: string
 *           description: Current diaspora location
 *         isEmailVerified:
 *           type: boolean
 *           description: Email verification status
 *         isPhoneVerified:
 *           type: boolean
 *           description: Phone verification status
 *         loyaltyPoints:
 *           type: number
 *           description: Accumulated loyalty points
 *         membershipTier:
 *           type: string
 *           enum: [bronze, silver, gold, platinum]
 *           description: Membership tier based on activity
 *         lastLoginAt:
 *           type: string
 *           format: date-time
 *           description: Last login timestamp
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Account creation timestamp
 *         preferences:
 *           $ref: '#/components/schemas/UserPreferences'
 *           description: User preferences and settings
 */

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  firstNameAr?: string;
  lastNameAr?: string;
  firstNameEn?: string;
  lastNameEn?: string;
  preferredLanguage: 'en' | 'ar';
  preferredCurrency: 'SYP' | 'USD' | 'EUR';
  profilePicture?: string;
  phoneNumber?: string;
  syrianOriginCity?: string;
  diasporaLocation?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  loyaltyPoints: number;
  membershipTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  lastLoginAt: Date;
  createdAt: Date;
  preferences?: UserPreferences;
}

/**
 * User preferences interface for profile settings
 * 
 * @swagger
 * components:
 *   schemas:
 *     UserPreferences:
 *       type: object
 *       description: User preferences and settings
 *       properties:
 *         notifications:
 *           $ref: '#/components/schemas/NotificationPreferences'
 *         privacy:
 *           $ref: '#/components/schemas/PrivacySettings'
 *         theme:
 *           type: string
 *           enum: [light, dark, auto]
 *           description: Theme preference
 *         twoFactorAuth:
 *           type: boolean
 *           description: Two-factor authentication status
 */
export interface UserPreferences {
  notifications: NotificationPreferences;
  privacy: PrivacySettings;
  theme: 'light' | 'dark' | 'auto';
  twoFactorAuth: boolean;
}

/**
 * Notification preferences interface
 * 
 * @swagger
 * components:
 *   schemas:
 *     NotificationPreferences:
 *       type: object
 *       description: User notification preferences
 *       properties:
 *         orderUpdates:
 *           type: boolean
 *           description: Order status update notifications
 *         promotions:
 *           type: boolean
 *           description: Promotional offer notifications
 *         newsletter:
 *           type: boolean
 *           description: Newsletter subscription
 *         sms:
 *           type: boolean
 *           description: SMS notifications
 *         push:
 *           type: boolean
 *           description: Push notifications
 */
export interface NotificationPreferences {
  orderUpdates: boolean;
  promotions: boolean;
  newsletter: boolean;
  sms: boolean;
  push: boolean;
}

/**
 * Privacy settings interface
 * 
 * @swagger
 * components:
 *   schemas:
 *     PrivacySettings:
 *       type: object
 *       description: User privacy settings
 *       properties:
 *         profileVisibility:
 *           type: string
 *           enum: [public, private, friends]
 *           description: Profile visibility level
 *         showReviews:
 *           type: boolean
 *           description: Show user reviews publicly
 *         showPurchaseHistory:
 *           type: boolean
 *           description: Show purchase history to others
 *         dataCollection:
 *           type: boolean
 *           description: Allow data collection for analytics and personalization
 *         analyticsOptOut:
 *           type: boolean
 *           description: Opt out of analytics tracking
 */
export interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'friends';
  showReviews: boolean;
  showPurchaseHistory: boolean;
  dataCollection: boolean;
  analyticsOptOut: boolean;
}

/**
 * Syrian cities for origin selection
 */
export const SYRIAN_CITIES = [
  'Damascus', 'Aleppo', 'Homs', 'Latakia', 'Hama', 'Raqqa', 'Deir ez-Zor', 
  'Daraa', 'Idlib', 'Qamishli', 'Tartus', 'Palmyra', 'Sweida', 'Kobani'
] as const;

export type SyrianCity = typeof SYRIAN_CITIES[number];

/**
 * Account dashboard navigation item interface
 * Supports bilingual navigation with Syrian marketplace styling
 * 
 * @swagger
 * components:
 *   schemas:
 *     AccountDashboardItem:
 *       type: object
 *       description: Account dashboard navigation tile
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for navigation item
 *         titleEn:
 *           type: string
 *           description: English title for navigation item
 *         titleAr:
 *           type: string
 *           description: Arabic title for navigation item
 *         descriptionEn:
 *           type: string
 *           description: English description
 *         descriptionAr:
 *           type: string
 *           description: Arabic description
 *         icon:
 *           type: string
 *           description: Material Design icon name
 *         route:
 *           type: string
 *           description: Angular route path
 *         badge:
 *           type: number
 *           description: Optional badge count (for orders, messages, etc.)
 *         isAvailable:
 *           type: boolean
 *           description: Whether feature is available to current user
 *         color:
 *           type: string
 *           description: Syrian marketplace theme color
 */
export interface AccountDashboardItem {
  id: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  icon: string;
  route: string;
  badge?: number;
  isAvailable: boolean;
  color: 'primary' | 'accent' | 'warn' | 'damascus-gold' | 'aleppo-green';
}

/**
 * User statistics interface for dashboard display
 * Shows key metrics for Syrian marketplace engagement
 * 
 * @swagger
 * components:
 *   schemas:
 *     UserStats:
 *       type: object
 *       description: User engagement statistics
 *       properties:
 *         totalOrders:
 *           type: number
 *           description: Total number of orders placed
 *         totalSpent:
 *           type: number
 *           description: Total amount spent in Syrian Pounds (SYP)
 *         wishlistCount:
 *           type: number
 *           description: Number of items in wishlist
 *         reviewsCount:
 *           type: number
 *           description: Number of reviews written
 *         rewardPoints:
 *           type: number
 *           description: Current reward points balance
 *         addressesCount:
 *           type: number
 *           description: Number of saved addresses
 */
export interface UserStats {
  totalOrders: number;
  totalSpent: number;
  wishlistCount: number;
  reviewsCount: number;
  rewardPoints: number;
  addressesCount: number;
}

/**
 * Account dashboard configuration interface
 * Defines the complete dashboard layout and content
 */
export interface AccountDashboardConfig {
  user: User;
  navigationItems: AccountDashboardItem[];
  userStats: UserStats;
  recentActivity: RecentActivity[];
  announcements: Announcement[];
}

/**
 * Recent activity interface for dashboard activity feed
 */
export interface RecentActivity {
  id: string;
  type: 'order' | 'review' | 'wishlist' | 'address' | 'profile';
  titleEn: string;
  titleAr: string;
  timestamp: Date;
  link?: string;
}

/**
 * Announcement interface for important messages
 */
export interface Announcement {
  id: string;
  titleEn: string;
  titleAr: string;
  messageEn: string;
  messageAr: string;
  type: 'info' | 'warning' | 'success' | 'promotion';
  isActive: boolean;
  expiresAt?: Date;
}

/**
 * Wishlist Item interface for Syrian marketplace products
 * 
 * @swagger
 * components:
 *   schemas:
 *     WishlistItem:
 *       type: object
 *       description: Syrian marketplace wishlist item
 *       properties:
 *         id:
 *           type: string
 *           description: Unique wishlist item identifier
 *         productId:
 *           type: string
 *           description: Product identifier
 *         nameEn:
 *           type: string
 *           description: Product name in English
 *         nameAr:
 *           type: string
 *           description: Product name in Arabic
 *         descriptionEn:
 *           type: string
 *           description: Product description in English
 *         descriptionAr:
 *           type: string
 *           description: Product description in Arabic
 *         image:
 *           type: string
 *           description: Primary product image URL
 *         images:
 *           type: array
 *           items:
 *             type: string
 *           description: Additional product images
 *         price:
 *           type: number
 *           description: Current price in Syrian Pounds (SYP)
 *         originalPrice:
 *           type: number
 *           description: Original price before discount
 *         priceUSD:
 *           type: number
 *           description: Price in USD for international buyers
 *         category:
 *           type: string
 *           description: Product category
 *         categorySlug:
 *           type: string
 *           description: Category URL slug
 *         productSlug:
 *           type: string
 *           description: Product URL slug
 *         isAvailable:
 *           type: boolean
 *           description: Product availability status
 *         isOnSale:
 *           type: boolean
 *           description: Whether product is on sale
 *         stockQuantity:
 *           type: number
 *           description: Available stock quantity
 *         priceHistory:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/PriceHistoryPoint'
 *           description: Price tracking history
 *         addedAt:
 *           type: string
 *           format: date-time
 *           description: Date when added to wishlist
 *         craftOrigin:
 *           type: string
 *           description: Syrian region of origin (Damascus, Aleppo, etc.)
 *         artisanInfo:
 *           type: string
 *           description: Information about the artisan/maker
 *         culturalSignificance:
 *           type: string
 *           description: Cultural or historical significance
 */
export interface WishlistItem {
  id: string;
  productId: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  image: string;
  images: string[];
  price: number;
  originalPrice?: number;
  priceUSD: number;
  category: string;
  categorySlug: string;
  productSlug: string;
  isAvailable: boolean;
  isOnSale: boolean;
  stockQuantity: number;
  priceHistory: PriceHistoryPoint[];
  addedAt: Date;
  craftOrigin: string;
  artisanInfo?: string;
  culturalSignificance?: string;
}

/**
 * Price History Point for price tracking
 * 
 * @swagger
 * components:
 *   schemas:
 *     PriceHistoryPoint:
 *       type: object
 *       description: Historical price data point
 *       properties:
 *         price:
 *           type: number
 *           description: Price at this point in time (SYP)
 *         priceUSD:
 *           type: number
 *           description: Price in USD at this point
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: When this price was recorded
 *         priceChange:
 *           type: number
 *           description: Percentage change from previous price
 */
export interface PriceHistoryPoint {
  price: number;
  priceUSD: number;
  timestamp: Date;
  priceChange?: number;
}

/**
 * Wishlist Configuration interface
 * Contains user's wishlist with organization and filtering options
 * 
 * @swagger
 * components:
 *   schemas:
 *     WishlistConfig:
 *       type: object
 *       description: Complete wishlist configuration
 *       properties:
 *         wishlistItems:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/WishlistItem'
 *           description: User's wishlist items
 *         totalItems:
 *           type: number
 *           description: Total number of items in wishlist
 *         categories:
 *           type: array
 *           items:
 *             type: string
 *           description: Available categories for filtering
 *         priceDropAlerts:
 *           type: number
 *           description: Number of items with recent price drops
 *         stockAlerts:
 *           type: number
 *           description: Number of out-of-stock items
 */
export interface WishlistConfig {
  wishlistItems: WishlistItem[];
  totalItems: number;
  categories: string[];
  priceDropAlerts: number;
  stockAlerts: number;
}

/**
 * Wishlist Filter Options for organizing and searching
 * 
 * @swagger
 * components:
 *   schemas:
 *     WishlistFilters:
 *       type: object
 *       description: Wishlist filtering and sorting options
 *       properties:
 *         category:
 *           type: string
 *           description: Filter by category
 *         availability:
 *           type: string
 *           enum: [all, available, out_of_stock]
 *           description: Filter by availability
 *         priceRange:
 *           $ref: '#/components/schemas/PriceRange'
 *           description: Filter by price range
 *         sortBy:
 *           type: string
 *           enum: [recent, name_ar, name_en, price_low, price_high, price_drop]
 *           description: Sort criteria
 *         searchQuery:
 *           type: string
 *           description: Search within wishlist items
 */
export interface WishlistFilters {
  category?: string;
  availability: 'all' | 'available' | 'out_of_stock';
  priceRange?: PriceRange;
  sortBy: 'recent' | 'name_ar' | 'name_en' | 'price_low' | 'price_high' | 'price_drop';
  searchQuery?: string;
}

/**
 * Price Range interface for filtering
 */
export interface PriceRange {
  min: number;
  max: number;
  currency?: 'USD' | 'EUR' | 'SYP';
}

/**
 * Order Status enumeration for Syrian marketplace
 * Comprehensive 22-state workflow for international shipping
 * 
 * @swagger
 * components:
 *   schemas:
 *     OrderStatus:
 *       type: string
 *       enum: [pending, confirmed, payment_processing, paid, preparing, ready_for_pickup, 
 *              picked_up, in_transit_domestic, at_customs, customs_cleared, 
 *              in_transit_international, arrived_destination_country, 
 *              destination_customs, destination_customs_cleared, out_for_delivery, 
 *              delivery_attempted, delivered, cancelled, refunded, returned, 
 *              exchange_requested, exchanged]
 *       description: Order status in Syrian marketplace workflow
 */
export type OrderStatus = 
  'pending' | 'confirmed' | 'payment_processing' | 'paid' | 'preparing' | 
  'ready_for_pickup' | 'picked_up' | 'in_transit_domestic' | 'at_customs' | 
  'customs_cleared' | 'in_transit_international' | 'arrived_destination_country' | 
  'destination_customs' | 'destination_customs_cleared' | 'out_for_delivery' | 
  'delivery_attempted' | 'delivered' | 'cancelled' | 'refunded' | 'returned' | 
  'exchange_requested' | 'exchanged';

/**
 * Order Item interface for Syrian marketplace products
 * 
 * @swagger
 * components:
 *   schemas:
 *     OrderItem:
 *       type: object
 *       description: Individual item within an order
 *       properties:
 *         id:
 *           type: string
 *           description: Order item identifier
 *         productId:
 *           type: string
 *           description: Product identifier
 *         nameEn:
 *           type: string
 *           description: Product name in English
 *         nameAr:
 *           type: string
 *           description: Product name in Arabic
 *         image:
 *           type: string
 *           description: Product image URL
 *         quantity:
 *           type: number
 *           description: Quantity ordered
 *         unitPrice:
 *           type: number
 *           description: Unit price in Syrian Pounds (SYP)
 *         unitPriceUSD:
 *           type: number
 *           description: Unit price in USD
 *         totalPrice:
 *           type: number
 *           description: Total price for this item (SYP)
 *         totalPriceUSD:
 *           type: number
 *           description: Total price for this item (USD)
 *         productSlug:
 *           type: string
 *           description: Product URL slug
 *         craftOrigin:
 *           type: string
 *           description: Syrian region of origin
 *         artisanInfo:
 *           type: string
 *           description: Artisan/maker information
 */
export interface OrderItem {
  id: string;
  productId: string;
  nameEn: string;
  nameAr: string;
  image: string;
  quantity: number;
  unitPrice: number;
  unitPriceUSD: number;
  totalPrice: number;
  totalPriceUSD: number;
  productSlug: string;
  craftOrigin: string;
  artisanInfo?: string;
}

/**
 * Shipping Address interface for Syrian diaspora delivery
 * 
 * @swagger
 * components:
 *   schemas:
 *     ShippingAddress:
 *       type: object
 *       description: Shipping address for Syrian diaspora customers
 *       properties:
 *         id:
 *           type: string
 *           description: Address identifier
 *         recipientName:
 *           type: string
 *           description: Recipient full name
 *         recipientPhone:
 *           type: string
 *           description: Recipient phone number
 *         addressLine1:
 *           type: string
 *           description: Primary address line
 *         addressLine2:
 *           type: string
 *           description: Secondary address line
 *         city:
 *           type: string
 *           description: City name
 *         state:
 *           type: string
 *           description: State/Province
 *         postalCode:
 *           type: string
 *           description: Postal/ZIP code
 *         country:
 *           type: string
 *           description: Country name
 *         countryCode:
 *           type: string
 *           description: ISO country code
 *         isDefault:
 *           type: boolean
 *           description: Default shipping address flag
 */
export interface ShippingAddress {
  id: string;
  recipientName: string;
  recipientPhone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  countryCode: string;
  isDefault: boolean;
}

/**
 * Order Tracking Event for delivery timeline
 * 
 * @swagger
 * components:
 *   schemas:
 *     OrderTrackingEvent:
 *       type: object
 *       description: Individual tracking event in order timeline
 *       properties:
 *         id:
 *           type: string
 *           description: Tracking event identifier
 *         status:
 *           $ref: '#/components/schemas/OrderStatus'
 *           description: Order status at this event
 *         titleEn:
 *           type: string
 *           description: Event title in English
 *         titleAr:
 *           type: string
 *           description: Event title in Arabic
 *         descriptionEn:
 *           type: string
 *           description: Event description in English
 *         descriptionAr:
 *           type: string
 *           description: Event description in Arabic
 *         location:
 *           type: string
 *           description: Event location
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Event timestamp
 *         isCompleted:
 *           type: boolean
 *           description: Whether this event is completed
 *         estimatedDate:
 *           type: string
 *           format: date-time
 *           description: Estimated completion date
 */
export interface OrderTrackingEvent {
  id: string;
  status: OrderStatus;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  location?: string;
  timestamp?: Date;
  isCompleted: boolean;
  estimatedDate?: Date;
}

/**
 * Main Order interface for Syrian marketplace
 * 
 * @swagger
 * components:
 *   schemas:
 *     Order:
 *       type: object
 *       description: Complete order information for Syrian marketplace
 *       properties:
 *         id:
 *           type: string
 *           description: Unique order identifier
 *         orderNumber:
 *           type: string
 *           description: Human-readable order number
 *         userId:
 *           type: string
 *           description: Customer user ID
 *         status:
 *           $ref: '#/components/schemas/OrderStatus'
 *           description: Current order status
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *           description: Items in this order
 *         subtotal:
 *           type: number
 *           description: Subtotal in Syrian Pounds (SYP)
 *         subtotalUSD:
 *           type: number
 *           description: Subtotal in USD
 *         shippingCost:
 *           type: number
 *           description: Shipping cost in SYP
 *         shippingCostUSD:
 *           type: number
 *           description: Shipping cost in USD
 *         tax:
 *           type: number
 *           description: Tax amount in SYP
 *         taxUSD:
 *           type: number
 *           description: Tax amount in USD
 *         total:
 *           type: number
 *           description: Total amount in SYP
 *         totalUSD:
 *           type: number
 *           description: Total amount in USD
 *         currency:
 *           type: string
 *           enum: [SYP, USD, EUR]
 *           description: Order currency
 *         paymentMethod:
 *           type: string
 *           description: Payment method used
 *         paymentStatus:
 *           type: string
 *           enum: [pending, processing, completed, failed, refunded]
 *           description: Payment status
 *         shippingAddress:
 *           $ref: '#/components/schemas/ShippingAddress'
 *           description: Delivery address
 *         tracking:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderTrackingEvent'
 *           description: Order tracking timeline
 *         trackingNumber:
 *           type: string
 *           description: Shipping carrier tracking number
 *         estimatedDelivery:
 *           type: string
 *           format: date-time
 *           description: Estimated delivery date
 *         placedAt:
 *           type: string
 *           format: date-time
 *           description: Order placement timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *         notes:
 *           type: string
 *           description: Special instructions or notes
 *         isGift:
 *           type: boolean
 *           description: Whether order is a gift
 *         giftMessage:
 *           type: string
 *           description: Gift message if applicable
 *         canCancel:
 *           type: boolean
 *           description: Whether order can still be cancelled
 *         canReturn:
 *           type: boolean
 *           description: Whether order can be returned
 *         returnWindow:
 *           type: number
 *           description: Return window in days
 */
export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  subtotalUSD: number;
  shippingCost: number;
  shippingCostUSD: number;
  tax: number;
  taxUSD: number;
  total: number;
  totalUSD: number;
  currency: 'SYP' | 'USD' | 'EUR';
  paymentMethod: string;
  paymentStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  shippingAddress: ShippingAddress;
  tracking: OrderTrackingEvent[];
  trackingNumber?: string;
  estimatedDelivery?: Date;
  placedAt: Date;
  updatedAt: Date;
  notes?: string;
  isGift: boolean;
  giftMessage?: string;
  canCancel: boolean;
  canReturn: boolean;
  returnWindow: number;
}

/**
 * Order History Configuration interface
 * Contains user's complete order history with filtering and statistics
 * 
 * @swagger
 * components:
 *   schemas:
 *     OrderHistoryConfig:
 *       type: object
 *       description: Complete order history configuration
 *       properties:
 *         orders:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Order'
 *           description: User's order history
 *         totalOrders:
 *           type: number
 *           description: Total number of orders
 *         totalSpent:
 *           type: number
 *           description: Total amount spent (SYP)
 *         totalSpentUSD:
 *           type: number
 *           description: Total amount spent (USD)
 *         ordersByStatus:
 *           type: object
 *           description: Order count grouped by status
 *         recentDeliveries:
 *           type: number
 *           description: Orders delivered in last 30 days
 *         pendingOrders:
 *           type: number
 *           description: Currently pending orders
 *         favoriteProducts:
 *           type: array
 *           items:
 *             type: string
 *           description: Most frequently ordered product IDs
 */
export interface OrderHistoryConfig {
  orders: Order[];
  totalOrders: number;
  totalSpent: number;
  totalSpentUSD: number;
  ordersByStatus: { [key in OrderStatus]?: number };
  recentDeliveries: number;
  pendingOrders: number;
  favoriteProducts: string[];
}

/**
 * Order History Filter Options for searching and organizing
 * 
 * @swagger
 * components:
 *   schemas:
 *     OrderHistoryFilters:
 *       type: object
 *       description: Order history filtering and sorting options
 *       properties:
 *         status:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderStatus'
 *           description: Filter by order status
 *         dateRange:
 *           $ref: '#/components/schemas/DateRange'
 *           description: Filter by date range
 *         searchQuery:
 *           type: string
 *           description: Search by order number or product name
 *         sortBy:
 *           type: string
 *           enum: [recent, oldest, amount_high, amount_low, status]
 *           description: Sort criteria
 *         pageSize:
 *           type: number
 *           description: Number of orders per page
 *         currentPage:
 *           type: number
 *           description: Current page number
 */
export interface OrderHistoryFilters {
  status?: OrderStatus[];
  dateRange?: DateRange;
  searchQuery?: string;
  sortBy: 'recent' | 'oldest' | 'amount_high' | 'amount_low' | 'status';
  pageSize: number;
  currentPage: number;
}

/**
 * Date Range interface for filtering
 */
export interface DateRange {
  startDate: Date;
  endDate: Date;
}


/**
 * Address Type enumeration for Syrian marketplace
 * Multiple address types for different purposes
 * 
 * @swagger
 * components:
 *   schemas:
 *     AddressType:
 *       type: string
 *       enum: [home, work, family, pickup_point, temporary]
 *       description: Address type classification
 */
export type AddressType = 'home' | 'work' | 'family' | 'pickup_point' | 'temporary';

/**
 * User Address interface for Syrian marketplace
 * Comprehensive address management with Syrian cultural elements
 * 
 * @swagger
 * components:
 *   schemas:
 *     UserAddress:
 *       type: object
 *       description: User address for Syrian marketplace
 *       properties:
 *         id:
 *           type: string
 *           description: Unique address identifier
 *         userId:
 *           type: string
 *           description: User ID this address belongs to
 *         type:
 *           $ref: '#/components/schemas/AddressType'
 *           description: Address type classification
 *         titleEn:
 *           type: string
 *           description: Address title in English (e.g., "Home", "Office")
 *         titleAr:
 *           type: string
 *           description: Address title in Arabic
 *         recipientName:
 *           type: string
 *           description: Full name of recipient
 *         recipientNameAr:
 *           type: string
 *           description: Recipient name in Arabic
 *         phoneNumber:
 *           type: string
 *           description: Contact phone number with country code
 *         alternatePhone:
 *           type: string
 *           description: Alternative phone number
 *         addressLine1:
 *           type: string
 *           description: Primary address line (street, building number)
 *         addressLine1Ar:
 *           type: string
 *           description: Primary address line in Arabic
 *         addressLine2:
 *           type: string
 *           description: Secondary address line (apartment, floor)
 *         addressLine2Ar:
 *           type: string
 *           description: Secondary address line in Arabic
 *         neighborhood:
 *           type: string
 *           description: Neighborhood/District name
 *         neighborhoodAr:
 *           type: string
 *           description: Neighborhood/District name in Arabic
 *         city:
 *           type: string
 *           description: City name
 *         cityAr:
 *           type: string
 *           description: City name in Arabic
 *         governorate:
 *           $ref: '#/components/schemas/SyrianGovernorate'
 *           description: Syrian governorate
 *         postalCode:
 *           type: string
 *           description: Syrian postal code
 *         country:
 *           type: string
 *           description: Country name (for diaspora addresses)
 *         countryCode:
 *           type: string
 *           description: ISO country code
 *         isDefault:
 *           type: boolean
 *           description: Default address for shipping
 *         isDefaultBilling:
 *           type: boolean
 *           description: Default address for billing
 *         isActive:
 *           type: boolean
 *           description: Address active status
 *         instructions:
 *           type: string
 *           description: Special delivery instructions
 *         instructionsAr:
 *           type: string
 *           description: Delivery instructions in Arabic
 *         landmark:
 *           type: string
 *           description: Nearby landmark for easier location
 *         landmarkAr:
 *           type: string
 *           description: Landmark in Arabic
 *         coordinates:
 *           $ref: '#/components/schemas/GeoCoordinates'
 *           description: GPS coordinates for precise location
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Address creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *         lastUsedAt:
 *           type: string
 *           format: date-time
 *           description: Last time this address was used for an order
 *         isVerified:
 *           type: boolean
 *           description: Address verification status
 *         verifiedAt:
 *           type: string
 *           format: date-time
 *           description: Address verification timestamp
 */
export interface UserAddress {
  id: string;
  userId: string;
  type: AddressType;
  titleEn: string;
  titleAr: string;
  recipientName: string;
  recipientNameAr?: string;
  phoneNumber: string;
  alternatePhone?: string;
  addressLine1: string;
  addressLine1Ar?: string;
  addressLine2?: string;
  addressLine2Ar?: string;
  neighborhood?: string;
  neighborhoodAr?: string;
  city: string;
  cityAr?: string;
  governorate: string;
  postalCode?: string;
  country: string;
  countryCode: string;
  isDefault: boolean;
  isDefaultBilling: boolean;
  isActive: boolean;
  instructions?: string;
  instructionsAr?: string;
  landmark?: string;
  landmarkAr?: string;
  coordinates?: GeoCoordinates;
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt?: Date;
  isVerified: boolean;
  verifiedAt?: Date;
}

/**
 * Geographic Coordinates interface
 * 
 * @swagger
 * components:
 *   schemas:
 *     GeoCoordinates:
 *       type: object
 *       description: Geographic coordinates for address location
 *       properties:
 *         latitude:
 *           type: number
 *           description: Latitude coordinate
 *         longitude:
 *           type: number
 *           description: Longitude coordinate
 *         accuracy:
 *           type: number
 *           description: Location accuracy in meters
 */
export interface GeoCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

/**
 * Address Book Configuration interface
 * Contains user's complete address book with organization
 * 
 * @swagger
 * components:
 *   schemas:
 *     AddressBookConfig:
 *       type: object
 *       description: Complete address book configuration
 *       properties:
 *         addresses:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/UserAddress'
 *           description: User's saved addresses
 *         totalAddresses:
 *           type: number
 *           description: Total number of saved addresses
 *         defaultShippingId:
 *           type: string
 *           description: Default shipping address ID
 *         defaultBillingId:
 *           type: string
 *           description: Default billing address ID
 *         recentlyUsed:
 *           type: array
 *           items:
 *             type: string
 *           description: Recently used address IDs
 *         unverifiedCount:
 *           type: number
 *           description: Number of unverified addresses
 *         addressTypes:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AddressType'
 *           description: Available address types for organization
 */
export interface AddressBookConfig {
  addresses: UserAddress[];
  totalAddresses: number;
  defaultShippingId?: string;
  defaultBillingId?: string;
  recentlyUsed: string[];
  unverifiedCount: number;
  addressTypes: AddressType[];
}

/**
 * Address Validation Result interface
 * Result of address validation for Syrian postal system
 * 
 * @swagger
 * components:
 *   schemas:
 *     AddressValidationResult:
 *       type: object
 *       description: Address validation result
 *       properties:
 *         isValid:
 *           type: boolean
 *           description: Overall validation status
 *         errors:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ValidationError'
 *           description: Validation error details
 *         suggestions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AddressSuggestion'
 *           description: Address correction suggestions
 *         postalCodeValid:
 *           type: boolean
 *           description: Postal code validation status
 *         coordinatesFound:
 *           type: boolean
 *           description: Whether GPS coordinates were found
 *         estimatedDeliveryDays:
 *           type: number
 *           description: Estimated delivery days to this address
 */
export interface AddressValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  suggestions: AddressSuggestion[];
  postalCodeValid: boolean;
  coordinatesFound: boolean;
  estimatedDeliveryDays?: number;
}

/**
 * Validation Error interface
 */
export interface ValidationError {
  field: string;
  messageEn: string;
  messageAr: string;
  severity: 'error' | 'warning';
}

/**
 * Address Suggestion interface for corrections
 */
export interface AddressSuggestion {
  field: string;
  originalValue: string;
  suggestedValue: string;
  confidence: number;
}

/**
 * Address Form Data interface for forms
 * Simplified interface for address forms
 */
export interface AddressFormData {
  type: AddressType;
  titleEn: string;
  titleAr: string;
  recipientName: string;
  recipientNameAr?: string;
  phoneNumber: string;
  alternatePhone?: string;
  addressLine1: string;
  addressLine1Ar?: string;
  addressLine2?: string;
  addressLine2Ar?: string;
  neighborhood?: string;
  neighborhoodAr?: string;
  city: string;
  cityAr?: string;
  governorate: string;
  postalCode?: string;
  country: string;
  countryCode: string;
  isDefault: boolean;
  isDefaultBilling: boolean;
  instructions?: string;
  instructionsAr?: string;
  landmark?: string;
  landmarkAr?: string;
}