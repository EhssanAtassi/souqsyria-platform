/**
 * Backend Homepage API Interfaces
 *
 * These interfaces match the exact structure returned by the NestJS backend
 * API endpoint: GET /api/categories/homepage-sections
 *
 * @see /Users/macbookpro/WebstormProjects/souqsyria-backend/HOMEPAGE_API_DOCUMENTATION.md
 */

/**
 * Backend API Response Structure
 * Wrapper for all homepage sections data
 */
export interface BackendHomepageResponse {
  data: BackendHomepageSection[];
  meta: {
    total: number;
  };
}

/**
 * Backend Homepage Section
 * Represents a single category section (e.g., "Consumer Electronics")
 */
export interface BackendHomepageSection {
  section_id: number;
  section_name_en: string;
  section_name_ar: string;
  section_slug: string;
  featured_product: BackendFeaturedProduct;
  child_categories: BackendChildCategory[];
}

/**
 * Backend Featured Product
 * Product displayed in the promotional banner (65% width)
 */
export interface BackendFeaturedProduct {
  id: number;
  name_en: string;
  name_ar: string;
  slug: string;
  sku: string;
  currency: string; // e.g., "SYP", "USD"
  base_price: string; // Decimal as string
  discount_price: string; // Decimal as string
  discount_percentage: number;
  image_url: string;
  is_featured: boolean;
  featured_priority: number;
  featured_badge: string | null; // e.g., "Best Seller", "UNESCO"
  featured_start_date: string; // ISO date string
  featured_end_date: string; // ISO date string
  is_best_seller: boolean;
  sales_count: number;
  category: {
    id: number;
    name_en: string;
    name_ar: string;
    slug: string;
    parent_id: number | null;
  };
  status: string; // e.g., "published"
  approval_status: string; // e.g., "approved"
  is_active: boolean;
  is_published: boolean;
  created_at: string; // ISO date string
  promotional_text: string;
}

/**
 * Backend Child Category
 * Subcategory displayed in the grid (35% width, 7 items)
 */
export interface BackendChildCategory {
  id: number;
  name_en: string;
  name_ar: string;
  slug: string;
  image_url: string; // Can be URL or icon name (e.g., "speaker", "tv")
  product_count: number;
}

/**
 * API Query Parameters
 */
export interface HomepageSectionsQueryParams {
  limit?: number; // Default: 3, Max: 10
}

/**
 * Featured Products Query Parameters
 */
export interface FeaturedProductsQueryParams {
  limit?: number; // Default: 3, Max: 20
  categoryId?: number;
  parentCategoryId?: number;
  sort?: 'featured' | 'best_seller' | 'new_arrivals'; // Default: 'featured'
}
