/**
 * Category Tree Models for Mega Menu Navigation
 *
 * @description TypeScript interfaces for hierarchical category tree structure
 * used in mega menu and featured category displays.
 *
 * @pattern Type Safety
 * - Hierarchical tree structure with children
 * - Multi-language support (name, nameAr)
 * - Icon and image support for visual navigation
 *
 * @swagger
 * components:
 *   schemas:
 *     CategoryTreeNode:
 *       type: object
 *       description: Category node in tree hierarchy for mega menu navigation
 *       required:
 *         - id
 *         - name
 *         - nameAr
 *         - slug
 *       properties:
 *         id:
 *           type: number
 *           description: Unique category identifier
 *         name:
 *           type: string
 *           description: Category name in English
 *         nameAr:
 *           type: string
 *           description: Category name in Arabic
 *         slug:
 *           type: string
 *           description: URL-friendly category slug
 *         icon:
 *           type: string
 *           description: Material icon name for category
 *         image:
 *           type: string
 *           description: Category image URL
 *         children:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CategoryTreeNode'
 *           description: Child categories
 *
 *     CategoryTreeResponse:
 *       type: object
 *       description: API response for category tree
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CategoryTreeNode'
 *
 *     FeaturedCategory:
 *       type: object
 *       description: Featured category for homepage display
 *       required:
 *         - id
 *         - name
 *         - nameAr
 *         - slug
 *         - productCount
 *         - sortOrder
 *       properties:
 *         id:
 *           type: number
 *           description: Category ID
 *         name:
 *           type: string
 *           description: Category name in English
 *         nameAr:
 *           type: string
 *           description: Category name in Arabic
 *         slug:
 *           type: string
 *           description: URL-friendly slug
 *         image:
 *           type: string
 *           description: Featured image URL
 *         icon:
 *           type: string
 *           description: Material icon name
 *         productCount:
 *           type: number
 *           description: Number of products in category
 *         sortOrder:
 *           type: number
 *           description: Display order priority
 *
 *     FeaturedCategoriesResponse:
 *       type: object
 *       description: API response for featured categories
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/FeaturedCategory'
 */

/**
 * Category node in the tree hierarchy for mega menu
 *
 * @description Represents a category with recursive children structure
 * for multi-level navigation in mega menu component
 *
 * @interface CategoryTreeNode
 */
export interface CategoryTreeNode {
  /** Unique category identifier */
  id: number;

  /** Category name in English */
  name: string;

  /** Category name in Arabic for RTL support */
  nameAr: string;

  /** URL-friendly category slug for routing */
  slug: string;

  /** Material icon name for visual representation */
  icon: string;

  /** Category image URL for featured display */
  image: string;

  /** Child categories forming tree hierarchy */
  children: CategoryTreeNode[];
}

/**
 * API response for category tree
 *
 * @description Wrapper for category tree data from backend API
 *
 * @interface CategoryTreeResponse
 */
export interface CategoryTreeResponse {
  /** Array of top-level category nodes */
  data: CategoryTreeNode[];
}

/**
 * Featured category for homepage display
 *
 * @description Streamlined category data for featured sections
 * with product count and display ordering
 *
 * @interface FeaturedCategory
 */
export interface FeaturedCategory {
  /** Category identifier */
  id: number;

  /** Category name in English */
  name: string;

  /** Category name in Arabic for RTL */
  nameAr: string;

  /** URL-friendly slug */
  slug: string;

  /** Featured category image URL */
  image: string;

  /** Material icon name */
  icon: string;

  /** Total number of products in category */
  productCount: number;

  /** Display order priority (lower = higher priority) */
  sortOrder: number;
}

/**
 * API response for featured categories
 *
 * @description Wrapper for featured categories data from backend
 *
 * @interface FeaturedCategoriesResponse
 */
export interface FeaturedCategoriesResponse {
  /** Array of featured categories sorted by sortOrder */
  data: FeaturedCategory[];
}

/**
 * Product search result item
 *
 * @description Basic product information returned from category search
 *
 * @interface ProductSearchResult
 */
export interface ProductSearchResult {
  /** Product identifier */
  id: number;

  /** Product name in English */
  name: string;

  /** Product name in Arabic */
  nameAr: string;

  /** Product URL slug */
  slug: string;

  /** Product thumbnail image URL */
  image: string;

  /** Product price */
  price: number;

  /** Discounted price (if applicable) */
  discountPrice?: number;

  /** Product rating (0-5) */
  rating: number;

  /** Number of reviews */
  reviewCount: number;

  /** Stock availability status */
  inStock: boolean;
}

/**
 * Search in category API response
 *
 * @description Response for searching products within a specific category.
 * Backend returns products with nameEn/nameAr which map to name/nameAr in frontend.
 *
 * @interface SearchInCategoryResponse
 *
 * @swagger
 * components:
 *   schemas:
 *     SearchInCategoryResponse:
 *       type: object
 *       description: API response for category product search
 *       properties:
 *         success:
 *           type: boolean
 *           description: Request success status
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProductSearchResult'
 *           description: Array of product search results
 *         meta:
 *           type: object
 *           description: Pagination metadata
 *           properties:
 *             total:
 *               type: number
 *               description: Total number of results
 *             page:
 *               type: number
 *               description: Current page number
 *             limit:
 *               type: number
 *               description: Results per page
 *             totalPages:
 *               type: number
 *               description: Total number of pages
 */
export interface SearchInCategoryResponse {
  /** Request success status */
  success: boolean;

  /** Array of product search results */
  data: ProductSearchResult[];

  /** Pagination metadata */
  meta: {
    /** Total number of results */
    total: number;
    /** Current page number */
    page: number;
    /** Results per page */
    limit: number;
    /** Total number of pages */
    totalPages: number;
  };
}
