/**
 * Category Pagination Configuration
 *
 * @description Centralized pagination settings for category product listing
 * This file follows the PROJECT_STRUCTURE_BLUEPRINT pattern of extracting
 * all configurations from components to dedicated config files.
 *
 * @pattern Configuration Extraction
 * - Single source of truth for pagination settings
 * - Type-safe with const assertions
 * - Responsive page size options
 * - Helper functions for pagination operations
 *
 * @swagger
 * tags:
 *   - name: Category Pagination Config
 *     description: Pagination configuration for category product listing
 */

import { ProductPagination } from '../../../shared/interfaces/category-filter.interface';

/**
 * Page size option interface
 *
 * @description Defines structure for page size dropdown options
 */
export interface PageSizeOption {
  /** Number of items per page */
  value: number;

  /** Display label */
  label: string;

  /** Arabic label */
  labelArabic?: string;
}

/**
 * Available page size options
 *
 * @description Common items-per-page options for category listing
 * @constant
 * @readonly
 */
export const PAGE_SIZE_OPTIONS: readonly PageSizeOption[] = [
  {
    value: 12,
    label: '12 per page',
    labelArabic: '12 في الصفحة'
  },
  {
    value: 20,
    label: '20 per page',
    labelArabic: '20 في الصفحة'
  },
  {
    value: 40,
    label: '40 per page',
    labelArabic: '40 في الصفحة'
  },
  {
    value: 60,
    label: '60 per page',
    labelArabic: '60 في الصفحة'
  }
] as const;

/**
 * Default page size
 *
 * @description Default number of products per page
 * @constant
 */
export const DEFAULT_PAGE_SIZE = 20;

/**
 * Default pagination configuration
 *
 * @description Initial pagination state for category pages
 * @constant
 */
export const DEFAULT_CATEGORY_PAGINATION: ProductPagination = {
  page: 1,
  limit: DEFAULT_PAGE_SIZE,
  total: 0,
  totalPages: 0,
  hasNext: false,
  hasPrevious: false
};

/**
 * Maximum items per page
 *
 * @description Maximum allowed items per page to prevent performance issues
 * @constant
 */
export const MAX_PAGE_SIZE = 100;

/**
 * Minimum items per page
 *
 * @description Minimum allowed items per page
 * @constant
 */
export const MIN_PAGE_SIZE = 12;

/**
 * Creates pagination configuration
 *
 * @description Helper to create ProductPagination with calculated values
 * @param page - Current page number (1-based)
 * @param limit - Items per page
 * @param total - Total number of items
 * @returns Complete ProductPagination object
 *
 * @example
 * ```typescript
 * const pagination = createPagination(2, 20, 150);
 * // Returns {
 * //   page: 2,
 * //   limit: 20,
 * //   total: 150,
 * //   totalPages: 8,
 * //   hasNext: true,
 * //   hasPrevious: true
 * // }
 * ```
 */
export function createPagination(
  page: number,
  limit: number,
  total: number
): ProductPagination {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrevious: page > 1
  };
}

/**
 * Validates page number
 *
 * @description Ensures page number is within valid range
 * @param page - Page number to validate
 * @param totalPages - Total number of pages
 * @returns Valid page number (1 to totalPages)
 *
 * @example
 * ```typescript
 * const validPage = validatePageNumber(10, 5);
 * // Returns 5 (capped at totalPages)
 * ```
 */
export function validatePageNumber(page: number, totalPages: number): number {
  if (page < 1) return 1;
  if (page > totalPages) return totalPages;
  return page;
}

/**
 * Validates page size
 *
 * @description Ensures page size is within valid range
 * @param pageSize - Page size to validate
 * @returns Valid page size (MIN_PAGE_SIZE to MAX_PAGE_SIZE)
 *
 * @example
 * ```typescript
 * const validSize = validatePageSize(150);
 * // Returns 100 (capped at MAX_PAGE_SIZE)
 * ```
 */
export function validatePageSize(pageSize: number): number {
  if (pageSize < MIN_PAGE_SIZE) return MIN_PAGE_SIZE;
  if (pageSize > MAX_PAGE_SIZE) return MAX_PAGE_SIZE;
  return pageSize;
}

/**
 * Calculates start index for pagination
 *
 * @description Gets zero-based start index for array slicing
 * @param page - Current page number (1-based)
 * @param limit - Items per page
 * @returns Zero-based start index
 *
 * @example
 * ```typescript
 * const startIndex = getStartIndex(2, 20);
 * // Returns 20 (start of page 2)
 * ```
 */
export function getStartIndex(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Calculates end index for pagination
 *
 * @description Gets zero-based end index for array slicing
 * @param page - Current page number (1-based)
 * @param limit - Items per page
 * @returns Zero-based end index
 *
 * @example
 * ```typescript
 * const endIndex = getEndIndex(2, 20);
 * // Returns 40 (end of page 2)
 * ```
 */
export function getEndIndex(page: number, limit: number): number {
  return page * limit;
}

/**
 * Gets page size option by value
 *
 * @description Helper to find page size option
 * @param value - Page size value
 * @returns Page size option or default
 *
 * @example
 * ```typescript
 * const option = getPageSizeOption(20);
 * // Returns { value: 20, label: '20 per page', ... }
 * ```
 */
export function getPageSizeOption(value: number): PageSizeOption {
  return PAGE_SIZE_OPTIONS.find(opt => opt.value === value) || PAGE_SIZE_OPTIONS[1];
}
