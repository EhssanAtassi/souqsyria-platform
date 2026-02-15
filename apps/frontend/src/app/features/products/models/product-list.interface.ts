/**
 * @description API response types for the product listing endpoint
 * Maps to GET /products?page=1&limit=20 backend response
 */

import { CurrencyCode } from './product-detail.interface';

/**
 * @description Single product item in the listing response
 */
export interface ProductListItem {
  /** Unique product identifier */
  id: number;
  /** URL-friendly product slug */
  slug: string;
  /** Product name in English */
  nameEn: string;
  /** Product name in Arabic */
  nameAr: string;
  /** URL to the main product image */
  mainImage: string | null;
  /** Base price in the smallest currency unit */
  basePrice: number;
  /** Discounted price if applicable */
  discountPrice: number | null;
  /** @description Currency code matching backend ProductPriceEntity enum (e.g., 'SYP') */
  currency: CurrencyCode;
  /** Category identifier */
  categoryId: number | null;
  /** Category name in English */
  categoryNameEn: string | null;
  /** Category name in Arabic */
  categoryNameAr: string | null;
  /** Current stock availability status */
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  /** Average product rating (0-5) */
  rating: number;
  /** Total number of reviews */
  reviewCount: number;
}

/**
 * @description Pagination metadata from the API
 */
export interface ProductListMeta {
  /** Total number of products */
  total: number;
  /** Current page number (1-based) */
  page: number;
  /** Items per page */
  limit: number;
  /** Total number of pages */
  totalPages: number;
}

/**
 * @description Full API response shape for product listing
 */
export interface ProductListResponse {
  /** Array of product items */
  data: ProductListItem[];
  /** Pagination metadata */
  meta: ProductListMeta;
}
