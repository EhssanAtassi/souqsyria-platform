/**
 * @description Product detail API response interfaces for the product detail page
 * Maps to GET /products/:slug backend response
 */

/** @description Complete product detail response from API */
export interface ProductDetailResponse {
  id: number;
  slug: string;
  nameEn: string;
  nameAr: string;
  sku: string | null;
  category: { id: number; nameEn: string; nameAr: string; slug: string } | null;
  manufacturer: { id: number; name: string } | null;
  vendor: { id: number; storeName: string } | null;
  pricing: { basePrice: number; discountPrice: number | null; currency: string } | null;
  images: ProductDetailImage[];
  descriptions: ProductDetailDescription[];
  variants: ProductDetailVariant[];
  attributes: ProductDetailAttribute[];
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  totalStock: number;
  relatedProducts: ProductDetailRelated[];
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

/** @description Product variant in detail response */
export interface ProductDetailVariant {
  id: number;
  sku: string | null;
  price: number;
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
  currency: string;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
}

/** @description Search suggestion from API */
export interface SearchSuggestionItem {
  text: string;
  textAr: string;
  type: 'product' | 'category';
  slug: string | null;
}
