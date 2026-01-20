/**
 * Abstract Category Service
 *
 * @description Defines the contract for category service implementations
 * This file follows the PROJECT_STRUCTURE_BLUEPRINT pattern of using
 * abstract services to define interfaces for mock and real implementations.
 *
 * @pattern Abstract Service Pattern
 * - Defines interface contract for all category operations
 * - Allows switching between mock and real API implementations
 * - Environment-based configuration (enableMockData flag)
 * - Type-safe method signatures
 *
 * @swagger
 * tags:
 *   - name: Abstract Category Service
 *     description: Contract for category service implementations
 */

import { Observable } from 'rxjs';
import { Product } from '../../../shared/interfaces/product.interface';
import {
  CategoryFilter,
  ProductSort,
  ProductListingRequest,
  ProductListingResponse,
  AvailableFilters
} from '../../../shared/interfaces/category-filter.interface';

/**
 * Abstract Category Service
 *
 * @description Base class defining all category-related operations
 * Concrete implementations must provide both mock and real API methods
 *
 * @remarks
 * Following PROJECT_STRUCTURE_BLUEPRINT.md pattern:
 * - Abstract class defines the contract
 * - Concrete service implements both mock and real methods
 * - Environment flag controls which implementation is used
 * - Clean separation between interface and implementation
 *
 * @example
 * ```typescript
 * export class CategoryService extends AbstractCategoryService {
 *   getProductsByCategory(request: ProductListingRequest): Observable<ProductListingResponse> {
 *     return environment.enableMockData
 *       ? this.getMockProductsByCategory(request)
 *       : this.http.get<ProductListingResponse>(`${this.apiUrl}/categories/${request.categorySlug}/products`);
 *   }
 * }
 * ```
 */
export abstract class AbstractCategoryService {
  //#region Product Listing Operations

  /**
   * Get products by category with filtering, sorting, and pagination
   * @description Main method for category product listing
   * @param request - Product listing request with filters
   * @returns Observable with paginated product listing response
   */
  abstract getProductsByCategory(request: ProductListingRequest): Observable<ProductListingResponse>;

  /**
   * Get mock products by category
   * @description Mock implementation for development
   * @param request - Product listing request
   * @returns Observable with mock product listing response
   */
  abstract getMockProductsByCategory(request: ProductListingRequest): Observable<ProductListingResponse>;

  //#endregion

  //#region Category Information Operations

  /**
   * Get category information by slug
   * @description Retrieves category metadata, description, breadcrumbs
   * @param categorySlug - Category slug identifier
   * @returns Observable with category information
   */
  abstract getCategoryInfo(categorySlug: string): Observable<any>;

  /**
   * Get mock category information
   * @description Mock category metadata for development
   * @param categorySlug - Category slug
   * @returns Observable with mock category info
   */
  abstract getMockCategoryInfo(categorySlug: string): Observable<any>;

  /**
   * Get all categories
   * @description Retrieves complete category list
   * @returns Observable with all categories
   */
  abstract getAllCategories(): Observable<any[]>;

  /**
   * Get mock all categories
   * @description Mock categories for development
   * @returns Observable with mock categories
   */
  abstract getMockAllCategories(): Observable<any[]>;

  //#endregion

  //#region Filter Operations

  /**
   * Get available filters for current product set
   * @description Computes filter options based on products
   * @param products - Current filtered product set
   * @returns Available filter options
   */
  abstract getAvailableFilters(products: Product[]): AvailableFilters;

  /**
   * Apply filters to product list
   * @description Client-side filtering implementation
   * @param products - Products to filter
   * @param filters - Filter criteria
   * @returns Filtered products
   */
  abstract applyFilters(products: Product[], filters: CategoryFilter): Product[];

  //#endregion

  //#region Sorting Operations

  /**
   * Apply sorting to product list
   * @description Client-side sorting implementation
   * @param products - Products to sort
   * @param sort - Sort criteria
   * @returns Sorted products
   */
  abstract applySorting(products: Product[], sort: ProductSort): Product[];

  /**
   * Get sorting options
   * @description Returns available sort options
   * @returns Array of sort options
   */
  abstract getSortOptions(): ProductSort[];

  //#endregion

  //#region Syrian Marketplace Specific Operations

  /**
   * Get Syrian governorates
   * @description Returns list of Syrian governorates for location filtering
   * @returns Array of governorate names
   */
  abstract getSyrianGovernorates(): string[];

  /**
   * Get common materials
   * @description Returns list of common Syrian product materials
   * @returns Array of material names
   */
  abstract getCommonMaterials(): string[];

  /**
   * Get heritage types
   * @description Returns Syrian heritage classification types
   * @returns Array of heritage types
   */
  abstract getHeritageTypes(): string[];

  //#endregion

  //#region Related Products Operations

  /**
   * Get related categories
   * @description Returns categories related to current category
   * @param currentCategorySlug - Current category slug
   * @param limit - Maximum number of related categories
   * @returns Observable with related categories
   */
  abstract getRelatedCategories(currentCategorySlug: string, limit?: number): Observable<any[]>;

  /**
   * Get mock related categories
   * @description Mock related categories for development
   * @param currentCategorySlug - Current category slug
   * @param limit - Maximum number
   * @returns Observable with mock related categories
   */
  abstract getMockRelatedCategories(currentCategorySlug: string, limit?: number): Observable<any[]>;

  //#endregion

  //#region Analytics Operations

  /**
   * Track category view
   * @description Records category page view for analytics
   * @param categorySlug - Category slug
   * @param productCount - Number of products displayed
   * @returns Observable void
   */
  abstract trackCategoryView(categorySlug: string, productCount: number): Observable<void>;

  /**
   * Track filter usage
   * @description Records filter application for analytics
   * @param categorySlug - Category slug
   * @param filters - Applied filters
   * @returns Observable void
   */
  abstract trackFilterUsage(categorySlug: string, filters: CategoryFilter): Observable<void>;

  /**
   * Track sort usage
   * @description Records sort option selection for analytics
   * @param categorySlug - Category slug
   * @param sort - Applied sort
   * @returns Observable void
   */
  abstract trackSortUsage(categorySlug: string, sort: ProductSort): Observable<void>;

  /**
   * Track pagination usage
   * @description Records page navigation for analytics
   * @param categorySlug - Category slug
   * @param page - Page number
   * @param limit - Items per page
   * @returns Observable void
   */
  abstract trackPaginationUsage(categorySlug: string, page: number, limit: number): Observable<void>;

  //#endregion

  //#region SEO Operations

  /**
   * Generate SEO meta tags
   * @description Creates SEO meta tags for category page
   * @param category - Category information
   * @param products - Current products
   * @param totalProducts - Total product count
   * @returns SEO meta tags object
   */
  abstract generateSEOMetaTags(category: any, products: Product[], totalProducts: number): any;

  /**
   * Generate structured data
   * @description Creates JSON-LD structured data for Google
   * @param category - Category information
   * @param products - Current products
   * @returns Structured data object
   */
  abstract generateStructuredData(category: any, products: Product[]): any;

  //#endregion
}
