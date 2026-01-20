/**
 * Homepage Models and Interfaces
 *
 * @description Type definitions for homepage component data structures
 * This file follows the PROJECT_STRUCTURE_BLUEPRINT pattern of extracting all
 * interfaces and type definitions into a dedicated models folder.
 *
 * @swagger
 * components:
 *   schemas:
 *     HomepageState:
 *       type: object
 *       description: Complete state management for homepage component
 */

import { Product } from '../../../shared/interfaces/product.interface';
import { Campaign } from '../../../shared/interfaces/campaign.interface';
import { CategoryShowcaseSection } from '../../../shared/interfaces/category-showcase.interface';
import { ProductOffer } from '../../../shared/interfaces/product-offer.interface';

/**
 * Homepage loading state interface
 * @description Tracks loading states for different homepage sections
 */
export interface HomepageLoadingState {
  /** Products loading state */
  products: boolean;
  /** Categories loading state */
  categories: boolean;
  /** Campaigns loading state */
  campaigns: boolean;
  /** Category showcase sections loading state */
  showcaseSections: boolean;
  /** Product offers loading state */
  offers: boolean;
}

/**
 * Homepage error state interface
 * @description Tracks error messages for different homepage sections
 */
export interface HomepageErrorState {
  /** Products error message */
  products: string | null;
  /** Categories error message */
  categories: string | null;
  /** Campaigns error message */
  campaigns: string | null;
  /** Showcase sections error message */
  showcaseSections: string | null;
  /** Offers error message */
  offers: string | null;
}

/**
 * Homepage data state interface
 * @description Contains all data displayed on homepage
 */
export interface HomepageDataState {
  /** All products loaded from service */
  allProducts: Product[];
  /** Featured products (computed from allProducts) */
  featuredProducts: Product[];
  /** New arrival products (computed from allProducts) */
  newArrivals: Product[];
  /** Top rated products (computed from allProducts) */
  topRated: Product[];
  /** Active campaigns for hero section */
  activeCampaigns: Campaign[];
  /** Category showcase sections */
  categoryShowcaseSections: CategoryShowcaseSection[];
  /** Featured product offers */
  featuredOffers: ProductOffer[];
  /** Flash sale product offers */
  flashSaleOffers: ProductOffer[];
}

/**
 * Complete homepage state interface
 * @description Aggregates all homepage state management
 */
export interface HomepageState {
  /** Loading states */
  loading: HomepageLoadingState;
  /** Error states */
  errors: HomepageErrorState;
  /** Data states */
  data: HomepageDataState;
  /** Retry count for failed operations */
  retryCount: number;
}

/**
 * Hero dual panel event interfaces
 */

/**
 * Hero offer click event
 * @description Event emitted when hero banner offer is clicked
 */
export interface HeroOfferClickEvent {
  /** Banner identifier */
  bannerId: string;
  /** Target navigation link */
  link: string;
  /** Event source identifier */
  source: string;
}

/**
 * Hero product click event
 * @description Event emitted when featured product in hero is clicked
 */
export interface HeroProductClickEvent {
  /** Product identifier */
  productId: string;
  /** Product name for analytics */
  productName: string;
  /** Event source identifier */
  source: string;
}

/**
 * Hero add to cart event
 * @description Event emitted when add to cart button clicked in hero
 */
export interface HeroAddToCartEvent {
  /** Product identifier */
  productId: string;
  /** Product name for analytics */
  productName: string;
  /** Product price */
  price: number;
  /** Event source identifier */
  source: string;
}

/**
 * Analytics event parameters interface
 * @description Generic analytics event tracking parameters
 */
export interface AnalyticsEventParams {
  /** Event category */
  category?: string;
  /** Event action */
  action?: string;
  /** Event label */
  label?: string;
  /** Event value (numeric) */
  value?: number;
  /** Currency code */
  currency?: string;
  /** Additional custom parameters */
  [key: string]: any;
}

/**
 * Homepage configuration options interface
 * @description Configuration options for homepage behavior
 */
export interface HomepageConfig {
  /** Maximum retry attempts for failed operations */
  maxRetryAttempts: number;
  /** Delay between retry attempts (milliseconds) */
  retryDelayMs: number;
  /** Enable offline mode (skip API calls) */
  offlineMode: boolean;
  /** Number of products to display per section */
  productsPerSection: number;
  /** Auto-refresh interval for campaigns (milliseconds, 0 = disabled) */
  campaignRefreshInterval: number;
}

/**
 * Default homepage configuration
 */
export const DEFAULT_HOMEPAGE_CONFIG: HomepageConfig = {
  maxRetryAttempts: 3,
  retryDelayMs: 1000,
  offlineMode: false,
  productsPerSection: 8,
  campaignRefreshInterval: 0
};

/**
 * Homepage notification type
 * @description Types of notifications that can be displayed
 */
export type HomepageNotificationType = 'success' | 'error' | 'info' | 'warning';

/**
 * Homepage notification interface
 * @description Structure for user notifications
 */
export interface HomepageNotification {
  /** Notification message */
  message: string;
  /** Notification type */
  type: HomepageNotificationType;
  /** Action button text (optional) */
  action?: string;
  /** Duration in milliseconds */
  duration?: number;
}

/**
 * Product section type
 * @description Types of product sections displayed on homepage
 */
export type ProductSectionType = 'featured' | 'new-arrivals' | 'top-rated' | 'flash-sale';

/**
 * Product section interface
 * @description Configuration for product display sections
 */
export interface ProductSection {
  /** Section identifier */
  id: ProductSectionType;
  /** Section title in English */
  titleEn: string;
  /** Section title in Arabic */
  titleAr: string;
  /** Products to display */
  products: Product[];
  /** Show "View All" link */
  showViewAll: boolean;
  /** View all route */
  viewAllRoute?: string;
}

/**
 * Helper type for featured category from config
 */
export interface FeaturedCategoryItem {
  name: string;
  nameAr: string;
  icon: string;
  color: string;
  discount: string;
  route: string;
}

/**
 * Helper type for quick navigation item from config
 */
export interface QuickNavigationItem {
  name: string;
  icon: string;
  active: boolean;
  route: string;
}
