/**
 * Category Feature Models and Interfaces
 *
 * @description Complete TypeScript interfaces for category feature
 * This file follows the PROJECT_STRUCTURE_BLUEPRINT pattern of creating
 * dedicated model files for type safety.
 *
 * @pattern Type Safety
 * - Comprehensive interface definitions
 * - Compile-time type checking
 * - Documentation for all types
 * - Default configurations
 *
 * @swagger
 * components:
 *   schemas:
 *     CategoryState:
 *       type: object
 *       description: Complete state management for category feature
 */

import { Product } from '../../../shared/interfaces/product.interface';
import {
  CategoryFilter,
  ProductSort,
  ProductViewMode,
  ProductPagination,
  ProductListingResponse,
  AvailableFilters
} from '../../../shared/interfaces/category-filter.interface';

/**
 * Category component state interface
 *
 * @description Complete state for category browsing component
 */
export interface CategoryState {
  /** Loading states */
  loading: CategoryLoadingState;

  /** Error states */
  errors: CategoryErrorState;

  /** Data state */
  data: CategoryDataState;

  /** Filter state */
  filters: CategoryFilterState;

  /** UI state */
  ui: CategoryUIState;
}

/**
 * Category loading state
 *
 * @description Tracks loading status for different operations
 */
export interface CategoryLoadingState {
  /** Products loading */
  products: boolean;

  /** Filters loading */
  filters: boolean;

  /** Category info loading */
  categoryInfo: boolean;

  /** Related categories loading */
  relatedCategories: boolean;
}

/**
 * Category error state
 *
 * @description Tracks errors for different operations
 */
export interface CategoryErrorState {
  /** Products loading error */
  products: string | null;

  /** Filters error */
  filters: string | null;

  /** Category info error */
  categoryInfo: string | null;

  /** General error message */
  general: string | null;
}

/**
 * Category data state
 *
 * @description Holds all data for category browsing
 */
export interface CategoryDataState {
  /** Current category slug */
  categorySlug: string;

  /** Product listing response */
  productListingResponse: ProductListingResponse | null;

  /** Related categories */
  relatedCategories: any[];
}

/**
 * Category filter state
 *
 * @description Current filter selections
 */
export interface CategoryFilterState {
  /** Price range filter */
  priceRange: { min: number; max: number };

  /** Selected ratings */
  selectedRatings: number[];

  /** Selected availability statuses */
  selectedAvailability: string[];

  /** Selected locations/governorates */
  selectedLocations: string[];

  /** Selected materials */
  selectedMaterials: string[];

  /** Selected heritage types */
  selectedHeritage: string[];

  /** Boolean filters */
  onlyAuthentic: boolean;
  onlyFreeShipping: boolean;
  onlyOnSale: boolean;
  onlyUnesco: boolean;
}

/**
 * Category UI state
 *
 * @description UI-specific state
 */
export interface CategoryUIState {
  /** Sidebar open/closed (mobile) */
  isSidenavOpen: boolean;

  /** Current view mode */
  currentViewMode: ProductViewMode;

  /** Current sort option */
  currentSort: ProductSort;

  /** Current page number */
  currentPage: number;

  /** Items per page */
  itemsPerPage: number;

  /** Back to top button visibility */
  showBackToTop: boolean;
}

/**
 * Category analytics event parameters
 *
 * @description Parameters for category analytics tracking
 */
export interface CategoryAnalyticsEventParams {
  /** Event category */
  category?: string;

  /** Event action */
  action?: string;

  /** Event label */
  label?: string;

  /** Event value */
  value?: number;

  /** Additional custom parameters */
  [key: string]: any;
}

/**
 * Filter chip interface for active filters display
 *
 * @description Structure for active filter chips
 */
export interface FilterChip {
  /** Filter key/identifier */
  key: string;

  /** Display label */
  label: string;

  /** Arabic label */
  labelArabic?: string;

  /** Filter type */
  type: 'priceRange' | 'rating' | 'authenticity' | 'availability' | 'region' | 'material' | 'heritage';

  /** Removable flag */
  removable: boolean;
}

/**
 * SEO meta tags interface
 *
 * @description SEO metadata for category pages
 */
export interface CategorySEOMetaTags {
  /** Page title */
  title: string;

  /** Meta description */
  description: string;

  /** Meta keywords */
  keywords: string;

  /** Canonical URL */
  canonicalUrl: string;

  /** Open Graph tags */
  openGraph: {
    title: string;
    description: string;
    url: string;
    image: string;
    type: string;
    siteName: string;
  };

  /** Twitter Card tags */
  twitterCard: {
    card: string;
    title: string;
    description: string;
    image: string;
  };
}

/**
 * Structured data interface for Google rich results
 *
 * @description JSON-LD structured data for SEO
 */
export interface CategoryStructuredData {
  /** Schema.org context */
  '@context': string;

  /** Schema.org graph */
  '@graph': Array<BreadcrumbListStructuredData | ItemListStructuredData>;
}

/**
 * Breadcrumb list structured data
 *
 * @description Breadcrumb navigation for SEO
 */
export interface BreadcrumbListStructuredData {
  /** Schema.org context */
  '@context': string;

  /** Schema.org type */
  '@type': 'BreadcrumbList';

  /** Breadcrumb items */
  itemListElement: Array<{
    '@type': 'ListItem';
    position: number;
    name: string;
    item: string;
  }>;
}

/**
 * Item list structured data
 *
 * @description Product list for SEO
 */
export interface ItemListStructuredData {
  /** Schema.org context */
  '@context': string;

  /** Schema.org type */
  '@type': 'ItemList';

  /** List name */
  name: string;

  /** List description */
  description: string;

  /** Number of items */
  numberOfItems: number;

  /** Product items */
  itemListElement: Array<{
    '@type': 'Product';
    position: number;
    name: string;
    description: string;
    image: string;
    url: string;
    offers: {
      '@type': 'Offer';
      price: number;
      priceCurrency: string;
      availability: string;
      seller: {
        '@type': 'Organization';
        name: string;
      };
    };
    aggregateRating: {
      '@type': 'AggregateRating';
      ratingValue: number;
      reviewCount: number;
    };
  }>;
}

/**
 * Default category state
 *
 * @description Initial state for category component
 * @constant
 */
export const DEFAULT_CATEGORY_STATE: CategoryState = {
  loading: {
    products: false,
    filters: false,
    categoryInfo: false,
    relatedCategories: false
  },
  errors: {
    products: null,
    filters: null,
    categoryInfo: null,
    general: null
  },
  data: {
    categorySlug: '',
    productListingResponse: null,
    relatedCategories: []
  },
  filters: {
    priceRange: { min: 0, max: 1000 },
    selectedRatings: [],
    selectedAvailability: [],
    selectedLocations: [],
    selectedMaterials: [],
    selectedHeritage: [],
    onlyAuthentic: false,
    onlyFreeShipping: false,
    onlyOnSale: false,
    onlyUnesco: false
  },
  ui: {
    isSidenavOpen: false,
    currentViewMode: {
      mode: 'grid',
      columns: 4,
      itemsPerRow: { mobile: 2, tablet: 3, desktop: 4 }
    },
    currentSort: {
      field: 'popularity',
      direction: 'desc',
      label: 'Most Popular'
    },
    currentPage: 1,
    itemsPerPage: 20,
    showBackToTop: false
  }
};

/**
 * Default filter state
 *
 * @description Initial filter selections
 * @constant
 */
export const DEFAULT_FILTER_STATE: CategoryFilterState = {
  priceRange: { min: 0, max: 1000 },
  selectedRatings: [],
  selectedAvailability: [],
  selectedLocations: [],
  selectedMaterials: [],
  selectedHeritage: [],
  onlyAuthentic: false,
  onlyFreeShipping: false,
  onlyOnSale: false,
  onlyUnesco: false
};

/**
 * Scroll threshold for back to top button
 *
 * @description Scroll position in pixels to show back-to-top
 * @constant
 */
export const BACK_TO_TOP_SCROLL_THRESHOLD = 300;

/**
 * Mobile breakpoint for responsive behavior
 *
 * @description Width in pixels for mobile detection
 * @constant
 */
export const MOBILE_BREAKPOINT = 768;
