/**
 * Related Categories Configuration
 *
 * @description Centralized related categories data for category pages
 * This file follows the PROJECT_STRUCTURE_BLUEPRINT pattern of extracting
 * all configurations from components to dedicated config files.
 *
 * @pattern Configuration Extraction
 * - Single source of truth for category data
 * - Type-safe with const assertions
 * - Bilingual support (English + Arabic)
 * - Helper functions for category operations
 *
 * @swagger
 * tags:
 *   - name: Related Categories Config
 *     description: Related categories configuration for cross-selling
 */

/**
 * Related category interface
 *
 * @description Defines structure for related category items
 */
export interface RelatedCategoryConfig {
  /** Category slug (URL identifier) */
  slug: string;

  /** English category name */
  name: string;

  /** Arabic category name */
  nameArabic: string;

  /** Emoji icon for visual representation */
  image: string;

  /** Optional category description */
  description?: string;

  /** Optional Arabic description */
  descriptionArabic?: string;
}

/**
 * All available related categories for Syrian marketplace
 *
 * @description Comprehensive list of Syrian product categories
 * Used for cross-selling and category navigation
 *
 * @constant
 * @readonly
 */
export const RELATED_CATEGORIES_CONFIG: readonly RelatedCategoryConfig[] = [
  {
    slug: 'damascus-steel',
    name: 'Damascus Steel',
    nameArabic: 'الفولاذ الدمشقي',
    image: '🗡️',
    description: 'World-renowned Damascus steel products handcrafted by master artisans',
    descriptionArabic: 'منتجات الفولاذ الدمشقي المشهورة عالمياً والمصنوعة يدوياً'
  },
  {
    slug: 'beauty-wellness',
    name: 'Beauty & Wellness',
    nameArabic: 'الجمال والعافية',
    image: '🧴',
    description: 'Traditional Syrian beauty and wellness products',
    descriptionArabic: 'منتجات الجمال والعافية السورية التقليدية'
  },
  {
    slug: 'textiles-fabrics',
    name: 'Textiles & Fabrics',
    nameArabic: 'المنسوجات والأقمشة',
    image: '🧵',
    description: 'Luxurious Syrian textiles including traditional brocade fabrics',
    descriptionArabic: 'المنسوجات السورية الفاخرة بما في ذلك أقمشة البروكار'
  },
  {
    slug: 'food-spices',
    name: 'Food & Spices',
    nameArabic: 'الطعام والبهارات',
    image: '🌶️',
    description: 'Authentic Syrian spices and food products',
    descriptionArabic: 'البهارات والمنتجات الغذائية السورية الأصيلة'
  },
  {
    slug: 'traditional-crafts',
    name: 'Traditional Crafts',
    nameArabic: 'الحرف التقليدية',
    image: '🎨',
    description: 'Handcrafted Syrian traditional items',
    descriptionArabic: 'الحرف السورية التقليدية المصنوعة يدوياً'
  },
  {
    slug: 'jewelry-accessories',
    name: 'Jewelry & Accessories',
    nameArabic: 'المجوهرات والإكسسوارات',
    image: '💍',
    description: 'Traditional Syrian jewelry crafted from precious metals',
    descriptionArabic: 'المجوهرات السورية التقليدية المصنوعة من المعادن النفيسة'
  },
  {
    slug: 'nuts-snacks',
    name: 'Nuts & Snacks',
    nameArabic: 'المكسرات والوجبات الخفيفة',
    image: '🥜',
    description: 'Premium Syrian nuts and snacks',
    descriptionArabic: 'المكسرات والوجبات الخفيفة السورية الممتازة'
  },
  {
    slug: 'sweets-desserts',
    name: 'Sweets & Desserts',
    nameArabic: 'الحلويات والمعجنات',
    image: '🍰',
    description: 'Traditional Syrian sweets and desserts',
    descriptionArabic: 'الحلويات والمعجنات السورية التقليدية'
  }
] as const;

/**
 * Gets related categories excluding the current one
 *
 * @description Helper function to get related categories for cross-selling
 * Excludes the current category and returns a limited number
 *
 * @param currentSlug - Current category slug to exclude
 * @param limit - Maximum number of related categories to return (default: 4)
 * @returns Array of related categories
 *
 * @example
 * ```typescript
 * const related = getRelatedCategories('damascus-steel', 4);
 * // Returns 4 categories excluding Damascus Steel
 * ```
 */
export function getRelatedCategories(
  currentSlug: string,
  limit: number = 4
): RelatedCategoryConfig[] {
  return RELATED_CATEGORIES_CONFIG
    .filter(cat => cat.slug !== currentSlug)
    .slice(0, limit);
}

/**
 * Gets category by slug
 *
 * @description Helper function to find specific category
 * @param slug - Category slug
 * @returns Category config or undefined
 *
 * @example
 * ```typescript
 * const category = getCategoryBySlug('damascus-steel');
 * // Returns { slug: 'damascus-steel', name: 'Damascus Steel', ... }
 * ```
 */
export function getCategoryBySlug(slug: string): RelatedCategoryConfig | undefined {
  return RELATED_CATEGORIES_CONFIG.find(cat => cat.slug === slug);
}

/**
 * Gets category name by slug (with fallback)
 *
 * @description Helper to get category name with fallback to slug
 * @param slug - Category slug
 * @param language - Language preference ('en' or 'ar')
 * @returns Category name or slug
 *
 * @example
 * ```typescript
 * const name = getCategoryName('damascus-steel', 'en');
 * // Returns 'Damascus Steel'
 * ```
 */
export function getCategoryName(
  slug: string,
  language: 'en' | 'ar' = 'en'
): string {
  const category = getCategoryBySlug(slug);
  if (!category) return slug;
  return language === 'ar' ? category.nameArabic : category.name;
}

/**
 * Gets all category slugs
 *
 * @description Helper to get array of all category slugs
 * @returns Array of category slugs
 *
 * @example
 * ```typescript
 * const slugs = getAllCategorySlugs();
 * // Returns ['damascus-steel', 'beauty-wellness', ...]
 * ```
 */
export function getAllCategorySlugs(): string[] {
  return RELATED_CATEGORIES_CONFIG.map(cat => cat.slug);
}

/**
 * Checks if category slug is valid
 *
 * @description Helper to validate category slug
 * @param slug - Category slug to check
 * @returns True if valid category
 *
 * @example
 * ```typescript
 * const isValid = isValidCategorySlug('damascus-steel');
 * // Returns true
 * ```
 */
export function isValidCategorySlug(slug: string): boolean {
  return RELATED_CATEGORIES_CONFIG.some(cat => cat.slug === slug);
}
