import { PriceRange } from './user.interface';

/**
 * @fileoverview Navigation interfaces for SouqSyria e-commerce platform
 * @description Defines TypeScript interfaces for navigation components including categories, user data, and search
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the category
 *         name:
 *           type: string
 *           description: Display name of the category
 *         nameAr:
 *           type: string
 *           description: Arabic display name of the category
 *         icon:
 *           type: string
 *           description: Material Design icon name for the category
 *         subcategories:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Subcategory'
 *           description: Array of subcategories
 *         featured:
 *           type: boolean
 *           description: Whether this category should be featured in navigation
 *     Subcategory:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the subcategory
 *         name:
 *           type: string
 *           description: Display name of the subcategory
 *         nameAr:
 *           type: string
 *           description: Arabic display name of the subcategory
 *         url:
 *           type: string
 *           description: Navigation URL for the subcategory
 *     UserInfo:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique user identifier
 *         name:
 *           type: string
 *           description: User's display name
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         avatar:
 *           type: string
 *           format: uri
 *           description: URL to user's avatar image
 *         isLoggedIn:
 *           type: boolean
 *           description: Whether user is currently logged in
 *     SearchFilters:
 *       type: object
 *       properties:
 *         category:
 *           type: string
 *           description: Selected category filter
 *         location:
 *           type: string
 *           description: Selected location filter
 *         priceRange:
 *           $ref: '#/components/schemas/PriceRange'
 *           description: Price range filter
 *     PriceRange:
 *       type: object
 *       properties:
 *         min:
 *           type: number
 *           description: Minimum price
 *         max:
 *           type: number
 *           description: Maximum price
 *         currency:
 *           type: string
 *           description: Currency code (e.g., SYP)
 *     CartInfo:
 *       type: object
 *       properties:
 *         itemCount:
 *           type: number
 *           description: Total number of items in cart
 *         totalAmount:
 *           type: number
 *           description: Total cart value
 *         currency:
 *           type: string
 *           description: Currency code
 */

/**
 * Interface for category navigation items
 * @description Represents a product category with localization support
 */
export interface Category {
  /** Unique identifier for the category */
  id: string;
  
  /** Display name of the category in English */
  name: string;
  
  /** Display name of the category in Arabic */
  nameAr: string;
  
  /** Material Design icon name for the category */
  icon: string;
  
  /** Array of subcategories under this category */
  subcategories?: Subcategory[];
  
  /** Whether this category should be featured in main navigation */
  featured: boolean;
  
  /** Navigation URL for the category page */
  url: string;
}

/**
 * Interface for subcategory navigation items
 * @description Represents a subcategory within a main category
 */
export interface Subcategory {
  /** Unique identifier for the subcategory */
  id: string;

  /** Display name of the subcategory in English */
  name: string;

  /** Display name of the subcategory in Arabic */
  nameAr: string;

  /** Navigation URL for the subcategory page */
  url: string;

  /** Optional icon for the subcategory */
  icon?: string;

  /** Optional description for mega menu display */
  description?: string;

  /** Optional Arabic description for mega menu display */
  descriptionAr?: string;

  /** Child subcategories (nested subcategories) */
  children?: ChildSubcategory[];

  /** Whether to show this subcategory in mega menu */
  showInMegaMenu?: boolean;
}

/**
 * Interface for child subcategory navigation items
 * @description Represents a child subcategory within a subcategory (3rd level)
 */
export interface ChildSubcategory {
  /** Unique identifier for the child subcategory */
  id: string;

  /** Display name in English */
  name: string;

  /** Display name in Arabic */
  nameAr: string;

  /** Navigation URL */
  url: string;

  /** Optional icon */
  icon?: string;

  /** Whether to show this child in mega menu */
  showInMegaMenu: boolean;
}

/**
 * Interface for user information in navigation
 * @description Contains user data for display in header navigation
 */
export interface UserInfo {
  /** Unique user identifier */
  id?: string;
  
  /** User's display name */
  name?: string;
  
  /** User's email address */
  email?: string;
  
  /** URL to user's avatar image */
  avatar?: string;
  
  /** Whether user is currently logged in */
  isLoggedIn: boolean;
}

/**
 * Interface for search functionality
 * @description Defines the structure for search filters and parameters
 */
export interface SearchFilters {
  /** Selected category filter */
  category?: string;
  
  /** Selected location filter */
  location?: string;
  
  /** Price range filter */
  priceRange?: PriceRange;
  
  /** Search query text */
  query?: string;
}

/**
 * Interface for currency information
 * @description Contains currency data for navigation display
 */
export interface CurrencyInfo {
  /** Currency code (e.g., 'SYP' for Syrian Pound) */
  currency: string;
}

/**
 * Interface for shopping cart information
 * @description Contains cart data for display in navigation
 */
export interface CartInfo {
  /** Total number of items in cart */
  itemCount: number;
  
  /** Total cart value */
  totalAmount: number;
  
  /** Currency code */
  currency: string;
}

/**
 * Interface for navigation configuration
 * @description Configuration options for the navigation component
 */
export interface NavigationConfig {
  /** Whether to show Arabic text alongside English */
  showArabic: boolean;
  
  /** Current language setting ('en' | 'ar') */
  language: 'en' | 'ar';
  
  /** Whether to use RTL layout */
  rtl: boolean;
  
  /** Available Syrian locations for delivery */
  locations: Location[];
  
  /** Featured categories to display in main navigation */
  featuredCategories: Category[];
}

/**
 * Interface for Syrian locations
 * @description Represents cities and regions in Syria for delivery options
 */
export interface Location {
  /** Unique location identifier */
  id: string;
  
  /** Location name in English */
  name: string;
  
  /** Location name in Arabic */
  nameAr: string;
  
  /** Location type (city, governorate, etc.) */
  type: 'city' | 'governorate' | 'district';
  
  /** Whether delivery is available to this location */
  deliveryAvailable: boolean;
}