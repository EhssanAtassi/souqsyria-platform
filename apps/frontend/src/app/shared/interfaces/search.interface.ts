/**
 * Search-related interfaces for Syrian marketplace
 * Supports advanced search, autocomplete, and search history
 *
 * @swagger
 * components:
 *   schemas:
 *     SearchResult:
 *       type: object
 *       properties:
 *         products:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Product'
 *         suggestions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SearchSuggestion'
 *         total:
 *           type: number
 */

import { Product } from './product.interface';

/**
 * Search suggestion for autocomplete
 */
export interface SearchSuggestion {
  /** Suggestion text */
  text: string;

  /** Suggestion type */
  type: 'product' | 'category' | 'brand' | 'recent' | 'popular';

  /** Associated product ID if type is 'product' */
  productId?: string;

  /** Associated category slug if type is 'category' */
  categorySlug?: string;

  /** Number of search results for this suggestion */
  resultCount?: number;

  /** Image URL for visual suggestions */
  imageUrl?: string;

  /** Highlight positions for matched text */
  highlights?: { start: number; end: number }[];
}

/**
 * Search history item
 */
export interface SearchHistoryItem {
  /** Search query text */
  query: string;

  /** Timestamp of search */
  timestamp: Date;

  /** Number of results found */
  resultsCount: number;

  /** Category context if searched within category */
  category?: string;
}

/**
 * Search filters
 */
export interface SearchFilters {
  /** Category filter */
  category?: string;

  /** Price range */
  priceRange?: {
    min: number;
    max: number;
  };

  /** Rating filter (minimum stars) */
  minRating?: number;

  /** In stock only */
  inStockOnly?: boolean;

  /** UNESCO heritage only */
  unescoOnly?: boolean;

  /** Authenticity certified only */
  certifiedOnly?: boolean;

  /** Regional filter (Syrian governorate) */
  region?: string;

  /** Brand/Artisan filter */
  brands?: string[];

  /** Sort option */
  sortBy?: 'relevance' | 'price-asc' | 'price-desc' | 'rating' | 'newest';
}

/**
 * Search result
 */
export interface SearchResult {
  /** Matching products */
  products: Product[];

  /** Total number of results */
  total: number;

  /** Current page */
  page: number;

  /** Items per page */
  pageSize: number;

  /** Search suggestions */
  suggestions?: SearchSuggestion[];

  /** Applied filters */
  filters: SearchFilters;

  /** Search query */
  query: string;

  /** Search execution time in milliseconds */
  executionTime?: number;
}

/**
 * Popular search item
 */
export interface PopularSearch {
  /** Search query */
  query: string;

  /** Number of times searched */
  searchCount: number;

  /** Trending indicator */
  trending: boolean;

  /** Related category */
  category?: string;
}

/**
 * Voice search result
 */
export interface VoiceSearchResult {
  /** Recognized text */
  transcript: string;

  /** Confidence score (0-1) */
  confidence: number;

  /** Alternative transcripts */
  alternatives?: string[];

  /** Language detected */
  language: 'en' | 'ar';
}
