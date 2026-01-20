/**
 * Featured Categories Configuration
 *
 * @description Configuration for featured Syrian categories displayed on homepage
 * This file follows the PROJECT_STRUCTURE_BLUEPRINT pattern of extracting all
 * configurations from components into dedicated config files.
 *
 * @swagger
 * components:
 *   schemas:
 *     FeaturedCategory:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Category name in English
 *         nameAr:
 *           type: string
 *           description: Category name in Arabic
 *         icon:
 *           type: string
 *           description: Material icon name
 *         color:
 *           type: string
 *           description: Hex color code for category theme
 *         discount:
 *           type: string
 *           description: Discount percentage display
 *         route:
 *           type: string
 *           description: Navigation route for category
 */

/**
 * Featured category configuration interface
 * @description Type-safe configuration for featured categories with bilingual support
 */
export interface FeaturedCategoryConfig {
  /** Category name in English */
  name: string;
  /** Category name in Arabic */
  nameAr: string;
  /** Material Design icon identifier */
  icon: string;
  /** Hex color code for category brand color */
  color: string;
  /** Discount percentage display text */
  discount: string;
  /** Navigation route path */
  route: string;
}

/**
 * Featured Syrian categories configuration
 *
 * @description Prominent categories displayed in promotional grid with Syrian heritage design
 * These categories represent the core offerings of the Syrian marketplace and are
 * displayed with authentic cultural styling and special promotional discounts.
 *
 * @remarks
 * - Each category includes bilingual names (English/Arabic)
 * - Color schemes reflect Syrian cultural aesthetics
 * - Discount values are promotional and should be updated seasonally
 * - Icons use Material Design icon names
 *
 * @example
 * ```typescript
 * // In component:
 * import { FEATURED_CATEGORIES_CONFIG } from './config/featured-categories.config';
 *
 * featuredCategories = FEATURED_CATEGORIES_CONFIG;
 * ```
 */
export const FEATURED_CATEGORIES_CONFIG: readonly FeaturedCategoryConfig[] = [
  {
    name: 'Damascus Steel',
    nameAr: 'الفولاذ الدمشقي',
    icon: 'hardware',
    color: '#059669',
    discount: '15%',
    route: '/category/damascus-steel'
  },
  {
    name: 'Beauty & Wellness',
    nameAr: 'الجمال والعافية',
    icon: 'face',
    color: '#C41E3A',
    discount: '20%',
    route: '/category/beauty-wellness'
  },
  {
    name: 'Textiles & Fabrics',
    nameAr: 'المنسوجات والأقمشة',
    icon: 'texture',
    color: '#D4AF37',
    discount: '25%',
    route: '/category/textiles-fabrics'
  },
  {
    name: 'Food & Spices',
    nameAr: 'الطعام والبهارات',
    icon: 'restaurant',
    color: '#EA580C',
    discount: '10%',
    route: '/category/food-spices'
  },
  {
    name: 'Traditional Crafts',
    nameAr: 'الحرف التقليدية',
    icon: 'handyman',
    color: '#1E3A8A',
    discount: '30%',
    route: '/category/traditional-crafts'
  },
  {
    name: 'Jewelry & Accessories',
    nameAr: 'المجوهرات والإكسسوارات',
    icon: 'diamond',
    color: '#8B5CF6',
    discount: '35%',
    route: '/category/jewelry-accessories'
  }
] as const;

/**
 * Helper function to get a featured category by name
 * @param name - Category name to search for (case-insensitive)
 * @returns Featured category configuration or undefined if not found
 */
export function getFeaturedCategoryByName(name: string): FeaturedCategoryConfig | undefined {
  return FEATURED_CATEGORIES_CONFIG.find(
    cat => cat.name.toLowerCase() === name.toLowerCase()
  );
}

/**
 * Helper function to get featured categories by color
 * @param color - Hex color code to filter by
 * @returns Array of featured categories with matching color
 */
export function getFeaturedCategoriesByColor(color: string): readonly FeaturedCategoryConfig[] {
  return FEATURED_CATEGORIES_CONFIG.filter(cat => cat.color === color);
}

/**
 * Helper function to get categories with discounts above a threshold
 * @param minDiscount - Minimum discount percentage (as number, e.g., 20 for 20%)
 * @returns Array of categories with discount >= minDiscount
 */
export function getCategoriesWithMinDiscount(minDiscount: number): readonly FeaturedCategoryConfig[] {
  return FEATURED_CATEGORIES_CONFIG.filter(cat => {
    const discountValue = parseInt(cat.discount.replace('%', ''), 10);
    return discountValue >= minDiscount;
  });
}
