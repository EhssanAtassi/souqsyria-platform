/**
 * Category Facade Service
 *
 * @description Facade service that coordinates multiple services for category page
 * This file follows the PROJECT_STRUCTURE_BLUEPRINT pattern of using the Facade
 * pattern to simplify complex service interactions.
 *
 * @pattern Facade Pattern
 * - Coordinates multiple services (category, cart, analytics)
 * - Provides simplified, high-level API to component
 * - Handles complex orchestration logic
 * - Reduces component complexity
 * - Centralizes business logic
 *
 * @swagger
 * tags:
 *   - name: Category Facade
 *     description: High-level category operations
 */

import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { CategoryService } from './category.service';
import { CategoryAnalyticsService } from './category-analytics.service';
import { CartService } from '../../../store/cart/cart.service';
import { Product } from '../../../shared/interfaces/product.interface';
import {
  CategoryFilter,
  ProductSort,
  ProductListingRequest,
  ProductListingResponse
} from '../../../shared/interfaces/category-filter.interface';

/**
 * Category Facade Service
 *
 * @description Provides simplified, high-level operations for category component
 * Coordinates multiple services and handles complex business logic
 *
 * @remarks
 * Following PROJECT_STRUCTURE_BLUEPRINT.md pattern:
 * - Facade simplifies component interaction with multiple services
 * - Centralizes business logic and orchestration
 * - Component only needs to inject facade, not all services
 * - Provides reactive state management with Observables
 * - Handles error recovery and fallback strategies
 *
 * @example
 * ```typescript
 * // In component - simplified interaction
 * constructor(private categoryFacade: CategoryFacadeService) {}
 *
 * ngOnInit() {
 *   this.categoryFacade.loadCategoryProducts(this.categorySlug()).subscribe(response => {
 *     this.products.set(response.products);
 *   });
 * }
 * ```
 */
@Injectable()
export class CategoryFacadeService {
  //#region Dependency Injection

  private readonly categoryService = inject(CategoryService);
  private readonly analyticsService = inject(CategoryAnalyticsService);
  private readonly cartService = inject(CartService);

  //#endregion

  //#region Product Listing Operations

  /**
   * Load category products with filters, sorting, and pagination
   * @description Main method for loading category product listing
   * @param request - Product listing request
   * @returns Observable with product listing response
   */
  loadCategoryProducts(request: ProductListingRequest): Observable<ProductListingResponse> {
    // Track category view
    this.analyticsService.trackCategoryView(request.categorySlug || 'all');

    return this.categoryService.getProductsByCategory(request).pipe(
      tap(response => {
        console.log(`✅ Loaded ${response.products.length} products for category: ${request.categorySlug}`);

        // Track applied filters
        if (request.filters) {
          this.analyticsService.trackFilterApplied(request.categorySlug || 'all', request.filters);
        }

        // Track applied sort
        if (request.sort) {
          this.analyticsService.trackSortApplied(request.categorySlug || 'all', request.sort);
        }

        // Track pagination
        if (request.pagination) {
          this.analyticsService.trackPageChange(
            request.categorySlug || 'all',
            request.pagination.page,
            request.pagination.limit
          );
        }
      }),
      catchError(error => {
        console.error('Failed to load category products:', error);
        this.analyticsService.trackError('category_products_load_failed', error.message);

        // Return empty response on error
        return of({
          products: [],
          pagination: {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrevious: false
          }
        } as ProductListingResponse);
      })
    );
  }

  /**
   * Load category information and related categories in parallel
   * @description Loads category metadata and related categories together
   * @param categorySlug - Category slug
   * @returns Observable with category data
   */
  loadCategoryData(categorySlug: string): Observable<{
    categoryInfo: any;
    relatedCategories: any[];
  }> {
    return forkJoin({
      categoryInfo: this.categoryService.getCategoryInfo(categorySlug).pipe(
        catchError(() => of(null))
      ),
      relatedCategories: this.categoryService.getRelatedCategories(categorySlug, 4).pipe(
        catchError(() => of([]))
      )
    });
  }

  //#endregion

  //#endregion

  //#region Cart Operations

  /**
   * Add product to cart
   * @description Adds product to cart with analytics tracking
   * @param product - Product to add
   * @param quantity - Quantity to add
   * @param source - Source identifier for analytics
   */
  addToCart(product: Product, quantity: number = 1, source: string = 'category'): void {
    // Validate inventory
    if (!product.inventory.inStock) {
      throw new Error('Product is out of stock');
    }

    if (product.inventory.quantity < quantity) {
      throw new Error('Insufficient stock available');
    }

    // Add to cart
    this.cartService.addToCart(product.id, quantity);

    // Track analytics
    this.analyticsService.trackAddToCart(product, quantity, source);

    console.log(`✅ Added ${product.name} to cart (qty: ${quantity}, source: ${source})`);
  }

  //#endregion

  //#region Product Operations

  /**
   * Handle product click
   * @description Processes product click with analytics tracking
   * @param product - Clicked product
   * @param position - Position in list
   * @param source - Click source
   */
  handleProductClick(product: Product, position?: number, source: string = 'category'): void {
    this.analyticsService.trackProductClick(product, source, position);
  }

  /**
   * Handle product wishlist toggle
   * @description Processes wishlist toggle with analytics tracking
   * @param product - Product to toggle
   * @param source - Toggle source
   */
  handleWishlistToggle(product: Product, source: string = 'category'): void {
    this.analyticsService.trackWishlistToggle(product, source);
    // TODO: Implement wishlist service integration
  }

  //#endregion

  //#region Related Categories Operations

  /**
   * Get related categories
   * @description Retrieves related categories for cross-selling
   * @param currentCategorySlug - Current category slug
   * @param limit - Maximum number of categories
   * @returns Observable with related categories
   */
  getRelatedCategories(currentCategorySlug: string, limit: number = 4): Observable<any[]> {
    return this.categoryService.getRelatedCategories(currentCategorySlug, limit).pipe(
      tap(categories => {
        console.log(`✅ Loaded ${categories.length} related categories`);
      }),
      catchError(error => {
        console.error('Failed to load related categories:', error);
        return of([]);
      })
    );
  }

  /**
   * Handle related category click
   * @description Processes related category click with analytics
   * @param categorySlug - Category slug
   * @param categoryName - Category name
   */
  handleRelatedCategoryClick(categorySlug: string, categoryName: string): void {
    this.analyticsService.trackRelatedCategoryClick(categorySlug, categoryName);
  }

  //#endregion

  //#region SEO Operations

  /**
   * Generate SEO meta tags for category page
   * @description Creates complete SEO metadata
   * @param category - Category information
   * @param products - Current products
   * @param totalProducts - Total product count
   * @returns SEO meta tags object
   */
  generateSEOMetaTags(category: any, products: Product[], totalProducts: number): any {
    return this.categoryService.generateSEOMetaTags(category, products, totalProducts);
  }

  /**
   * Generate structured data for category page
   * @description Creates JSON-LD for Google rich results
   * @param category - Category information
   * @param products - Current products
   * @returns Structured data object
   */
  generateStructuredData(category: any, products: Product[]): any {
    return this.categoryService.generateStructuredData(category, products);
  }

  //#endregion

  //#region Helper Methods

  /**
   * Get Syrian governorates
   * @description Returns list of Syrian governorates for filtering
   * @returns Array of governorate names
   */
  getSyrianGovernorates(): string[] {
    return this.categoryService.getSyrianGovernorates();
  }

  /**
   * Get common materials
   * @description Returns list of common Syrian product materials
   * @returns Array of material names
   */
  getCommonMaterials(): string[] {
    return this.categoryService.getCommonMaterials();
  }

  /**
   * Get heritage types
   * @description Returns Syrian heritage classification types
   * @returns Array of heritage types
   */
  getHeritageTypes(): string[] {
    return this.categoryService.getHeritageTypes();
  }

  /**
   * Get sort options
   * @description Returns available sort options
   * @returns Array of sort options
   */
  getSortOptions(): ProductSort[] {
    return this.categoryService.getSortOptions();
  }

  //#endregion
}
