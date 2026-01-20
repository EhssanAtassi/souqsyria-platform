import { PriceRange } from './user.interface';

/**
 * Category filtering and sorting interfaces for Syrian marketplace
 * Designed for comprehensive product browsing and filtering capabilities
 * 
 * @swagger
 * components:
 *   schemas:
 *     CategoryFilter:
 *       type: object
 *       description: Filter criteria for product category browsing
 *       properties:
 *         priceRange:
 *           $ref: '#/components/schemas/PriceRange'
 *         ratings:
 *           type: array
 *           items:
 *             type: number
 *           description: Minimum rating filter (1-5)
 *         availability:
 *           type: array
 *           items:
 *             type: string
 *           enum: [in_stock, low_stock, out_of_stock, pre_order]
 *         categories:
 *           type: array
 *           items:
 *             type: string
 *           description: Category IDs to filter by
 *         sellers:
 *           type: array
 *           items:
 *             type: string
 *           description: Seller IDs to filter by
 *         locations:
 *           type: array
 *           items:
 *             type: string
 *           description: Syrian governorates to filter by
 *         heritage:
 *           type: array
 *           items:
 *             type: string
 *           enum: [traditional, modern, contemporary]
 *         materials:
 *           type: array
 *           items:
 *             type: string
 *           description: Material filters
 */

/**
 * Main category filter interface for product browsing
 */
export interface CategoryFilter {
  /** Price range filter */
  priceRange?: PriceRange;
  
  /** Minimum rating filter (1-5 stars) */
  ratings?: number[];
  
  /** Product availability status filter */
  availability?: ('in_stock' | 'low_stock' | 'out_of_stock' | 'pre_order')[];
  
  /** Category IDs to filter by */
  categories?: string[];
  
  /** Seller IDs to filter by */
  sellers?: string[];
  
  /** Syrian governorates/locations to filter by */
  locations?: string[];
  
  /** Heritage classification filter */
  heritage?: string[];
  
  /** Material composition filter */
  materials?: string[];
  
  /** Product authenticity filter */
  authenticityOnly?: boolean;
  
  /** Free shipping filter */
  freeShippingOnly?: boolean;
  
  /** Featured products only */
  featuredOnly?: boolean;
  
  /** Discount/sale items only */
  onSaleOnly?: boolean;
  
  /** UNESCO recognized items only */
  unescoOnly?: boolean;

  /** Master craftsman products only */
  masterCraftsmanOnly?: boolean;
  
  /** In stock products only */
  inStockOnly?: boolean;
}

/**
 * Price range with currency information
 */
export interface PriceRangeWithCurrency {
  /** Price range */
  range: PriceRange;
  
  /** Currency for price range */
  currency: 'USD' | 'EUR' | 'SYP';
}

/**
 * Product sorting options for category browsing
 */
export interface ProductSort {
  /** Sort field */
  field: 'price' | 'rating' | 'popularity' | 'newest' | 'name' | 'reviews';
  
  /** Sort direction */
  direction: 'asc' | 'desc';
  
  /** Sort label for UI display */
  label: string;
}

/**
 * Pagination options for product listing
 */
export interface ProductPagination {
  /** Current page number (1-based) */
  page: number;
  
  /** Number of items per page */
  limit: number;
  
  /** Total number of items */
  total: number;
  
  /** Total number of pages */
  totalPages: number;
  
  /** Whether there is a next page */
  hasNext: boolean;
  
  /** Whether there is a previous page */
  hasPrevious: boolean;
}

/**
 * Product view mode options
 */
export interface ProductViewMode {
  /** Current view mode */
  mode: 'grid' | 'list';
  
  /** Grid columns (for grid view) */
  columns?: number;
  
  /** Items per row (responsive) */
  itemsPerRow?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
}

/**
 * Complete product listing request interface
 */
export interface ProductListingRequest {
  /** Category slug to browse */
  categorySlug?: string;
  
  /** Search query */
  searchQuery?: string;
  
  /** Filter criteria */
  filters?: CategoryFilter;
  
  /** Sorting options */
  sort?: ProductSort;
  
  /** Pagination settings */
  pagination?: {
    page: number;
    limit: number;
  };
  
  /** View mode settings */
  viewMode?: ProductViewMode;
}

/**
 * Product listing response interface
 */
export interface ProductListingResponse {
  /** Array of products */
  products: any[]; // Using any[] to match existing Product interface
  
  /** Pagination information */
  pagination: ProductPagination;
  
  /** Applied filters */
  appliedFilters?: CategoryFilter;
  
  /** Applied sorting */
  appliedSort?: ProductSort;
  
  /** Available filter options based on current results */
  availableFilters?: AvailableFilters;
  
  /** Category information */
  category?: {
    id: string;
    name: string;
    nameArabic?: string;
    slug: string;
    breadcrumb: string[];
    description?: string;
    descriptionArabic?: string;
  };
}

/**
 * Available filter options based on current category/search results
 */
export interface AvailableFilters {
  /** Available price ranges */
  priceRanges: {
    min: number;
    max: number;
    currency: string;
  };
  
  /** Available rating options */
  ratings: {
    value: number;
    count: number;
  }[];
  
  /** Available categories */
  categories: {
    id: string;
    name: string;
    nameArabic?: string;
    count: number;
  }[];
  
  /** Available sellers */
  sellers: {
    id: string;
    name: string;
    location: string;
    count: number;
    verified: boolean;
  }[];
  
  /** Available locations */
  locations: {
    governorate: string;
    count: number;
  }[];
  
  /** Available materials */
  materials: {
    name: string;
    count: number;
  }[];
  
  /** Available heritage classifications */
  heritage: {
    type: 'traditional' | 'modern' | 'contemporary';
    count: number;
  }[];
}

/**
 * Pre-defined sorting options for Syrian marketplace
 */
export const SORT_OPTIONS: ProductSort[] = [
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
];

/**
 * Default pagination settings
 */
export const DEFAULT_PAGINATION = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
  hasNext: false,
  hasPrevious: false
};

/**
 * Default view mode settings
 */
export const DEFAULT_VIEW_MODE: ProductViewMode = {
  mode: 'grid' as const,
  columns: 4,
  itemsPerRow: {
    mobile: 2,
    tablet: 3,
    desktop: 4
  }
};

/**
 * Syrian governorates for location filtering
 */
export const SYRIAN_GOVERNORATES = [
  'Damascus',
  'Aleppo',
  'Homs',
  'Hama',
  'Lattakia',
  'Idlib',
  'Daraa',
  'Deir ez-Zor',
  'Tartus',
  'Al-Hasakah',
  'Ar-Raqqa',
  'As-Suwayda',
  'Quneitra',
  'Damascus Countryside'
] as const;

/**
 * Syrian governorate type based on the constant array
 */
export type SyrianGovernorate = typeof SYRIAN_GOVERNORATES[number];

/**
 * Common material categories for Syrian products
 */
export const COMMON_MATERIALS = [
  'Damascus Steel',
  'Sterling Silver',
  'Syrian Walnut Wood',
  'Olive Wood',
  'Silk',
  'Cotton',
  'Brocade',
  'Ceramic',
  'Natural Stone',
  'Gold Thread',
  'Laurel Oil',
  'Olive Oil',
  'Natural Pigments',
  'Traditional Leather',
  'Brass',
  'Copper'
];