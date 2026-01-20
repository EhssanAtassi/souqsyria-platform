/**
 * Category Sort Options Configuration
 *
 * @description Centralized sorting options for category product listing
 * This file follows the PROJECT_STRUCTURE_BLUEPRINT pattern of extracting
 * all configurations from components to dedicated config files.
 *
 * @pattern Configuration Extraction
 * - Single source of truth for sort options
 * - Type-safe with const assertions
 * - Easy to modify without touching component code
 * - Helper functions for common operations
 *
 * @swagger
 * tags:
 *   - name: Category Sort Config
 *     description: Sorting options for category product listing
 */

import { ProductSort } from '../../../shared/interfaces/category-filter.interface';

/**
 * Available sorting options for category product listing
 *
 * @description Comprehensive sort options for Syrian marketplace
 * Includes popularity, price, rating, date, name, and reviews
 *
 * @constant
 * @readonly
 */
export const CATEGORY_SORT_OPTIONS: readonly ProductSort[] = [
  {
    field: 'popularity',
    direction: 'desc',
    label: 'Most Popular'
  },
  {
    field: 'price',
    direction: 'asc',
    label: 'Price: Low to High'
  },
  {
    field: 'price',
    direction: 'desc',
    label: 'Price: High to Low'
  },
  {
    field: 'rating',
    direction: 'desc',
    label: 'Highest Rated'
  },
  {
    field: 'newest',
    direction: 'desc',
    label: 'Newest First'
  },
  {
    field: 'name',
    direction: 'asc',
    label: 'Name: A to Z'
  },
  {
    field: 'reviews',
    direction: 'desc',
    label: 'Most Reviews'
  }
] as const;

/**
 * Default sort option (Most Popular)
 *
 * @description Default sorting for category pages
 * @constant
 */
export const DEFAULT_CATEGORY_SORT: ProductSort = CATEGORY_SORT_OPTIONS[0];

/**
 * SortOption type for toolbar compatibility
 * Maps ProductSort to simplified toolbar sort values
 */
export type SortOption = 'popular' | 'newest' | 'rating' | 'price-asc' | 'price-desc';

/**
 * Maps toolbar sort option to ProductSort
 *
 * @description Helper function to convert toolbar sort value to ProductSort
 * @param sortValue - Toolbar sort option value
 * @returns Corresponding ProductSort object
 *
 * @example
 * ```typescript
 * const sort = mapSortOptionToProductSort('price-asc');
 * // Returns { field: 'price', direction: 'asc', label: 'Price: Low to High' }
 * ```
 */
export function mapSortOptionToProductSort(sortValue: SortOption): ProductSort {
  switch (sortValue) {
    case 'popular':
      return CATEGORY_SORT_OPTIONS.find(s => s.field === 'popularity') || CATEGORY_SORT_OPTIONS[0];
    case 'newest':
      return CATEGORY_SORT_OPTIONS.find(s => s.field === 'newest') || CATEGORY_SORT_OPTIONS[4];
    case 'rating':
      return CATEGORY_SORT_OPTIONS.find(s => s.field === 'rating') || CATEGORY_SORT_OPTIONS[3];
    case 'price-asc':
      return CATEGORY_SORT_OPTIONS[1]; // Price: Low to High
    case 'price-desc':
      return CATEGORY_SORT_OPTIONS[2]; // Price: High to Low
    default:
      return CATEGORY_SORT_OPTIONS[0];
  }
}

/**
 * Maps ProductSort to toolbar sort option
 *
 * @description Helper function to convert ProductSort to toolbar value
 * @param productSort - ProductSort object
 * @returns Corresponding SortOption value
 *
 * @example
 * ```typescript
 * const sort = { field: 'price', direction: 'asc', label: 'Price: Low to High' };
 * const toolbarValue = mapProductSortToSortOption(sort);
 * // Returns 'price-asc'
 * ```
 */
export function mapProductSortToSortOption(productSort: ProductSort): SortOption {
  if (productSort.field === 'popularity') return 'popular';
  if (productSort.field === 'newest') return 'newest';
  if (productSort.field === 'rating') return 'rating';
  if (productSort.field === 'price' && productSort.direction === 'asc') return 'price-asc';
  if (productSort.field === 'price' && productSort.direction === 'desc') return 'price-desc';
  return 'popular';
}

/**
 * Gets sort option by field and direction
 *
 * @description Helper function to find sort option by criteria
 * @param field - Sort field
 * @param direction - Sort direction
 * @returns Matching ProductSort or default
 *
 * @example
 * ```typescript
 * const sort = getSortOptionByField('price', 'asc');
 * // Returns { field: 'price', direction: 'asc', label: 'Price: Low to High' }
 * ```
 */
export function getSortOptionByField(
  field: ProductSort['field'],
  direction: ProductSort['direction'] = 'desc'
): ProductSort {
  return CATEGORY_SORT_OPTIONS.find(
    s => s.field === field && s.direction === direction
  ) || DEFAULT_CATEGORY_SORT;
}
