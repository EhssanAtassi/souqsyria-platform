/**
 * Product comparison interfaces for Syrian marketplace
 * Enables side-by-side product comparison
 *
 * @swagger
 * components:
 *   schemas:
 *     ComparisonItem:
 *       type: object
 *       properties:
 *         product:
 *           $ref: '#/components/schemas/Product'
 *         addedAt:
 *           type: string
 *           format: date-time
 */

import { Product } from './product.interface';

/**
 * Product comparison item
 */
export interface ComparisonItem {
  /** Product being compared */
  product: Product;

  /** Timestamp when added to comparison */
  addedAt: Date;
}

/**
 * Comparison table row
 */
export interface ComparisonRow {
  /** Row label */
  label: string;

  /** Row key for data access */
  key: string;

  /** Row category (pricing, specifications, etc.) */
  category: 'pricing' | 'specifications' | 'shipping' | 'authenticity' | 'seller' | 'reviews';

  /** Values for each product */
  values: (string | number | boolean | null)[];

  /** Data type for formatting */
  type: 'text' | 'number' | 'currency' | 'rating' | 'boolean' | 'date';

  /** Whether this row has differences between products */
  hasDifference: boolean;

  /** Unit for numeric values */
  unit?: string;
}

/**
 * Comparison configuration
 */
export interface ComparisonConfig {
  /** Maximum number of products to compare */
  maxProducts: number;

  /** Fields to compare */
  fields: ComparisonField[];

  /** Show differences only */
  showDifferencesOnly: boolean;

  /** Highlight best values */
  highlightBest: boolean;
}

/**
 * Comparison field definition
 */
export interface ComparisonField {
  /** Field label */
  label: string;

  /** Field label in Arabic */
  labelAr?: string;

  /** Field key (dot notation supported for nested fields) */
  key: string;

  /** Field category */
  category: 'pricing' | 'specifications' | 'shipping' | 'authenticity' | 'seller' | 'reviews';

  /** Data type */
  type: 'text' | 'number' | 'currency' | 'rating' | 'boolean' | 'date' | 'list';

  /** Display order */
  order: number;

  /** Whether field is always visible */
  alwaysVisible: boolean;

  /** Formatting function name */
  formatter?: 'currency' | 'percentage' | 'date' | 'rating' | 'list';

  /** Unit label */
  unit?: string;

  /** Whether lower is better (for highlighting) */
  lowerIsBetter?: boolean;
}

/**
 * Comparison state
 */
export interface ComparisonState {
  /** Products being compared */
  items: ComparisonItem[];

  /** Whether comparison is visible */
  isVisible: boolean;

  /** Selected category for filtering rows */
  selectedCategory?: string;

  /** Show differences only */
  showDifferencesOnly: boolean;
}
