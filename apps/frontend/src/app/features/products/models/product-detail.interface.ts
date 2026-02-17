/**
 * @description Product detail API response interfaces for the product detail page
 * Maps to GET /products/:slug backend response
 */

import { ReviewSummary } from './review.interface';

/**
 * @description Supported currency codes matching the backend ProductPriceEntity enum.
 * SYP = Syrian Pound, USD = US Dollar, TRY = Turkish Lira.
 */
export type CurrencyCode = 'SYP' | 'USD' | 'TRY';

/**
 * @description Supported variant option display types.
 * 'color' renders as color swatches, 'size' as size chips, 'select' as generic selectable chips.
 */
export type VariantOptionType = 'color' | 'select' | 'size';

/** @description Complete product detail response from API */
export interface ProductDetailResponse {
  id: number;
  slug: string;
  nameEn: string;
  nameAr: string;
  sku: string | null;
  category: {
    id: number;
    nameEn: string;
    nameAr: string;
    slug: string;
    /** @description Ancestor categories from root down to parent, for breadcrumb navigation */
    ancestors?: Array<{ id: number; nameEn: string; nameAr: string; slug: string }>;
  } | null;
  manufacturer: { id: number; name: string } | null;
  vendor: { id: number; storeName: string } | null;
  pricing: { basePrice: number; discountPrice: number | null; currency: CurrencyCode } | null;
  images: ProductDetailImage[];
  descriptions: ProductDetailDescription[];
  variants: ProductDetailVariant[];
  attributes: ProductDetailAttribute[];
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  totalStock: number;
  relatedProducts: ProductDetailRelated[];
  reviewSummary?: ReviewSummary;
}

/** @description Product image in detail response */
export interface ProductDetailImage {
  id: number;
  imageUrl: string;
  altText?: string | null;
  sortOrder: number;
}

/** @description Product description in detail response */
export interface ProductDetailDescription {
  language: string;
  shortDescription: string;
  fullDescription: string;
}

/**
 * @description Product variant in detail response
 * Contains variant-specific data including SKU, pricing, stock status, and variant attributes
 */
export interface ProductDetailVariant {
  id: number;
  sku: string | null;
  price: number;
  /** @description Variant attribute key-value pairs (e.g., {"Size": "L", "Color": "Red"}) */
  variantData: Record<string, string>;
  imageUrl: string | null;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  totalStock: number;
  isActive: boolean;
}

/** @description Product attribute in detail response */
export interface ProductDetailAttribute {
  id: number;
  attributeNameEn: string;
  attributeNameAr: string;
  valueEn: string;
  valueAr: string;
  colorHex: string | null;
}

/** @description Related product in detail response */
export interface ProductDetailRelated {
  id: number;
  slug: string;
  nameEn: string;
  nameAr: string;
  mainImage: string | null;
  basePrice: number;
  discountPrice: number | null;
  /** @description Currency code matching backend ProductPriceEntity enum */
  currency: CurrencyCode;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
}

/** @description Option group for variant selectors (from /variant-options endpoint) */
export interface VariantOptionGroup {
  optionName: string;
  optionNameAr: string | null;
  /** @description Display type: 'color' for swatches, 'size' for size chips, 'select' for generic chips */
  type: VariantOptionType;
  values: VariantOptionValue[];
}

/** @description Single option value within a variant option group */
export interface VariantOptionValue {
  value: string;
  valueAr: string | null;
  colorHex: string | null;
  displayOrder: number;
}

/** @description Search suggestion from API */
export interface SearchSuggestionItem {
  text: string;
  textAr: string;
  type: 'product' | 'category';
  slug: string | null;
  /** Thumbnail image URL (product suggestions only) */
  imageUrl?: string | null;
  /** Product price (discount or base, product suggestions only) */
  price?: number | null;
  /** @description Currency code (default: SYP), matching backend ProductPriceEntity enum */
  currency?: CurrencyCode;
}
