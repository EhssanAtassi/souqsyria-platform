/**
 * Product recommendations interfaces for Syrian marketplace
 * Supports various recommendation strategies
 *
 * @swagger
 * components:
 *   schemas:
 *     RecommendationResult:
 *       type: object
 *       properties:
 *         products:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Product'
 *         strategy:
 *           type: string
 *           enum: [similar, category, price, cultural, recent, popular]
 *         title:
 *           type: string
 */

import { Product } from './product.interface';

/**
 * Recommendation strategy type
 */
export type RecommendationStrategy =
  | 'similar'           // Similar products based on category/features
  | 'category'          // Same category products
  | 'price-range'       // Similar price range
  | 'cultural'          // Syrian cultural connections
  | 'recent'            // Based on recently viewed
  | 'popular'           // Popular products
  | 'frequently-bought' // Frequently bought together
  | 'complementary';    // Complementary products

/**
 * Recommendation result
 */
export interface RecommendationResult {
  /** Recommended products */
  products: Product[];

  /** Recommendation strategy used */
  strategy: RecommendationStrategy;

  /** Display title for the recommendation section */
  title: string;

  /** Display title in Arabic */
  titleAr?: string;

  /** Confidence score (0-1) */
  confidence?: number;

  /** Reason for recommendation */
  reason?: string;

  /** Maximum products to show */
  limit: number;
}

/**
 * Recommendation configuration
 */
export interface RecommendationConfig {
  /** Strategy to use */
  strategy: RecommendationStrategy;

  /** Maximum number of recommendations */
  limit: number;

  /** Exclude specific product IDs */
  excludeIds?: string[];

  /** Include only specific categories */
  categoryFilter?: string[];

  /** Minimum rating threshold */
  minRating?: number;

  /** Price range multiplier (e.g., 0.8-1.2 for ±20%) */
  priceRangeMultiplier?: { min: number; max: number };

  /** Cultural filters */
  culturalFilter?: {
    unescoOnly?: boolean;
    certifiedOnly?: boolean;
    region?: string;
  };
}

/**
 * Recently viewed product
 */
export interface RecentlyViewedProduct {
  /** Product reference */
  product: Product;

  /** Timestamp when viewed */
  viewedAt: Date;

  /** How many times viewed */
  viewCount: number;

  /** Last view duration in seconds */
  duration?: number;
}

/**
 * Recommendation context for personalization
 */
export interface RecommendationContext {
  /** Current product being viewed */
  currentProduct?: Product;

  /** Recently viewed products */
  recentlyViewed?: string[];

  /** User's cart items */
  cartItems?: string[];

  /** User's wishlist items */
  wishlistItems?: string[];

  /** User's preferred categories */
  preferredCategories?: string[];

  /** User's price sensitivity (low, medium, high) */
  priceSensitivity?: 'low' | 'medium' | 'high';
}

/**
 * Cultural recommendation factors
 */
export interface CulturalRecommendation {
  /** Related Syrian craft traditions */
  relatedCrafts: string[];

  /** Regional specialties */
  regionalConnection: string[];

  /** UNESCO heritage relationships */
  unescoConnection: boolean;

  /** Traditional technique similarities */
  techniques: string[];
}
