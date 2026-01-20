/**
 * Category Analytics Service
 *
 * @description Dedicated service for category analytics tracking
 * This file follows the PROJECT_STRUCTURE_BLUEPRINT pattern of separating
 * concerns by creating a dedicated analytics service.
 *
 * @pattern Analytics Service Pattern
 * - Centralizes all analytics tracking logic
 * - Provides type-safe analytics methods
 * - Handles multiple analytics providers
 * - Graceful error handling (analytics failures don't break app)
 * - Easy to mock for testing
 *
 * @swagger
 * tags:
 *   - name: Category Analytics
 *     description: Analytics tracking for category events
 */

import { Injectable } from '@angular/core';
import { Product } from '../../../shared/interfaces/product.interface';
import {
  CategoryFilter,
  ProductSort
} from '../../../shared/interfaces/category-filter.interface';
import { CategoryAnalyticsEventParams } from '../models/category.interface';

/**
 * Category Analytics Service
 *
 * @description Handles all analytics tracking for category component
 * Provides methods for tracking user interactions and events
 *
 * @remarks
 * Following PROJECT_STRUCTURE_BLUEPRINT.md pattern:
 * - Separates analytics logic from business logic
 * - Centralizes event tracking in one place
 * - Provides consistent event naming and parameters
 * - Supports multiple analytics providers (GA4, Adobe, etc.)
 * - Fails silently to prevent analytics from breaking app
 *
 * @example
 * ```typescript
 * // In component or service:
 * constructor(private analytics: CategoryAnalyticsService) {}
 *
 * onProductClick(product: Product) {
 *   this.analytics.trackProductClick(product, 'category-listing');
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class CategoryAnalyticsService {
  //#region Configuration

  /** Enable console logging for debugging */
  private readonly enableDebugLogging = true;

  /** Analytics provider name */
  private readonly provider = 'Google Analytics 4';

  //#endregion

  //#region Category Events

  /**
   * Track category view
   * @description Records when user views a category page
   * @param categorySlug - Category slug
   * @param productCount - Number of products displayed (optional)
   */
  trackCategoryView(categorySlug: string, productCount?: number): void {
    this.trackEvent('category_view', {
      category_slug: categorySlug,
      product_count: productCount,
      page: 'category',
      page_type: 'category_listing'
    });
  }

  /**
   * Track category page load time
   * @description Records category page load performance
   * @param categorySlug - Category slug
   * @param loadTimeMs - Load time in milliseconds
   */
  trackCategoryLoadTime(categorySlug: string, loadTimeMs: number): void {
    this.trackEvent('category_load_time', {
      category_slug: categorySlug,
      load_time_ms: loadTimeMs,
      page: 'category'
    });
  }

  //#endregion

  //#region Filter Events

  /**
   * Track filter applied
   * @description Records when user applies filters
   * @param categorySlug - Category slug
   * @param filters - Applied filters
   */
  trackFilterApplied(categorySlug: string, filters: CategoryFilter): void {
    const filterCount = this.countActiveFilters(filters);

    this.trackEvent('filter_applied', {
      category_slug: categorySlug,
      filter_count: filterCount,
      filters: this.serializeFilters(filters),
      page: 'category'
    });
  }

  /**
   * Track filter cleared
   * @description Records when user clears filters
   * @param categorySlug - Category slug
   */
  trackFilterCleared(categorySlug: string): void {
    this.trackEvent('filter_cleared', {
      category_slug: categorySlug,
      page: 'category'
    });
  }

  /**
   * Track specific filter type usage
   * @description Records when user applies specific filter type
   * @param categorySlug - Category slug
   * @param filterType - Type of filter (price, rating, etc.)
   * @param filterValue - Filter value
   */
  trackFilterTypeUsage(categorySlug: string, filterType: string, filterValue: any): void {
    this.trackEvent('filter_type_usage', {
      category_slug: categorySlug,
      filter_type: filterType,
      filter_value: filterValue,
      page: 'category'
    });
  }

  //#endregion

  //#region Sort Events

  /**
   * Track sort applied
   * @description Records when user changes sort option
   * @param categorySlug - Category slug
   * @param sort - Applied sort
   */
  trackSortApplied(categorySlug: string, sort: ProductSort): void {
    this.trackEvent('sort_applied', {
      category_slug: categorySlug,
      sort_field: sort.field,
      sort_direction: sort.direction,
      sort_label: sort.label,
      page: 'category'
    });
  }

  //#endregion

  //#region Pagination Events

  /**
   * Track page change
   * @description Records when user navigates to different page
   * @param categorySlug - Category slug
   * @param page - Page number
   * @param limit - Items per page
   */
  trackPageChange(categorySlug: string, page: number, limit: number): void {
    this.trackEvent('page_change', {
      category_slug: categorySlug,
      page_number: page,
      items_per_page: limit,
      page: 'category'
    });
  }

  /**
   * Track page size change
   * @description Records when user changes items per page
   * @param categorySlug - Category slug
   * @param pageSize - New page size
   */
  trackPageSizeChange(categorySlug: string, pageSize: number): void {
    this.trackEvent('page_size_change', {
      category_slug: categorySlug,
      page_size: pageSize,
      page: 'category'
    });
  }

  //#endregion

  //#region Product Events

  /**
   * Track product click
   * @description Records when user clicks a product
   * @param product - Clicked product
   * @param source - Click source
   * @param position - Position in list
   */
  trackProductClick(product: Product, source: string, position?: number): void {
    this.trackEvent('product_click', {
      product_id: product.id,
      product_name: product.name,
      product_name_arabic: product.nameArabic,
      category: product.category.name,
      price: product.price.amount,
      currency: product.price.currency,
      source: source,
      position: position,
      page: 'category'
    });
  }

  /**
   * Track add to cart
   * @description Records when user adds product to cart
   * @param product - Product being added
   * @param quantity - Quantity added
   * @param source - Add to cart source
   */
  trackAddToCart(product: Product, quantity: number, source: string): void {
    this.trackEvent('add_to_cart', {
      currency: product.price.currency,
      value: product.price.amount * quantity,
      items: [{
        item_id: product.id,
        item_name: product.name,
        item_name_arabic: product.nameArabic,
        item_category: product.category.name,
        price: product.price.amount,
        quantity: quantity
      }],
      source: source,
      page: 'category'
    });
  }

  /**
   * Track wishlist toggle
   * @description Records when user adds/removes from wishlist
   * @param product - Product being toggled
   * @param source - Toggle source
   */
  trackWishlistToggle(product: Product, source: string): void {
    this.trackEvent('wishlist_toggle', {
      product_id: product.id,
      product_name: product.name,
      product_name_arabic: product.nameArabic,
      category: product.category.name,
      source: source,
      page: 'category'
    });
  }

  //#endregion

  //#region View Mode Events

  /**
   * Track view mode change
   * @description Records when user switches view mode (grid/list)
   * @param categorySlug - Category slug
   * @param viewMode - New view mode
   */
  trackViewModeChange(categorySlug: string, viewMode: 'grid' | 'list'): void {
    this.trackEvent('view_mode_change', {
      category_slug: categorySlug,
      view_mode: viewMode,
      page: 'category'
    });
  }

  //#endregion

  //#region Related Category Events

  /**
   * Track related category click
   * @description Records when user clicks related category
   * @param categorySlug - Related category slug
   * @param categoryName - Related category name
   */
  trackRelatedCategoryClick(categorySlug: string, categoryName: string): void {
    this.trackEvent('related_category_click', {
      category_slug: categorySlug,
      category_name: categoryName,
      page: 'category'
    });
  }

  //#endregion

  //#region UI Interaction Events

  /**
   * Track sidebar toggle
   * @description Records when user opens/closes filter sidebar
   * @param categorySlug - Category slug
   * @param isOpen - Sidebar state
   */
  trackSidebarToggle(categorySlug: string, isOpen: boolean): void {
    this.trackEvent('sidebar_toggle', {
      category_slug: categorySlug,
      is_open: isOpen,
      page: 'category'
    });
  }

  /**
   * Track back to top click
   * @description Records when user clicks back to top button
   * @param categorySlug - Category slug
   */
  trackBackToTopClick(categorySlug: string): void {
    this.trackEvent('back_to_top_click', {
      category_slug: categorySlug,
      page: 'category'
    });
  }

  //#endregion

  //#region Error Events

  /**
   * Track error
   * @description Records when an error occurs
   * @param errorType - Type of error
   * @param errorMessage - Error message
   * @param context - Additional context
   */
  trackError(errorType: string, errorMessage: string, context?: any): void {
    this.trackEvent('category_error', {
      error_type: errorType,
      error_message: errorMessage,
      context: context,
      page: 'category'
    });
  }

  //#endregion

  //#region Core Analytics Methods

  /**
   * Track generic event
   * @description Core method for tracking any analytics event
   * @param eventName - Event name
   * @param parameters - Event parameters
   */
  trackEvent(eventName: string, parameters: CategoryAnalyticsEventParams): void {
    try {
      // Add timestamp to all events
      const eventData = {
        ...parameters,
        timestamp: new Date().toISOString()
      };

      // Debug logging
      if (this.enableDebugLogging) {
        console.log(`📊 Analytics [${this.provider}]: ${eventName}`, eventData);
      }

      // Send to Google Analytics 4
      this.sendToGoogleAnalytics(eventName, eventData);

      // Send to other providers (can add Adobe Analytics, Mixpanel, etc.)
      // this.sendToAdobeAnalytics(eventName, eventData);
      // this.sendToMixpanel(eventName, eventData);

    } catch (error) {
      // Analytics errors should never break the application
      console.error('Analytics tracking error:', error);
    }
  }

  /**
   * Send event to Google Analytics 4
   * @description Sends event to GA4 using gtag
   * @param eventName - Event name
   * @param parameters - Event parameters
   */
  private sendToGoogleAnalytics(eventName: string, parameters: any): void {
    // Check if gtag is available
    if (typeof (window as any).gtag === 'function') {
      (window as any).gtag('event', eventName, parameters);
    } else {
      if (this.enableDebugLogging) {
        console.warn('Google Analytics gtag not available');
      }
    }
  }

  //#endregion

  //#region Helper Methods

  /**
   * Count active filters
   * @description Counts how many filters are active
   * @param filters - Filter object
   * @returns Number of active filters
   */
  private countActiveFilters(filters: CategoryFilter): number {
    let count = 0;

    if (filters.priceRange) count++;
    if (filters.ratings && filters.ratings.length > 0) count++;
    if (filters.availability && filters.availability.length > 0) count++;
    if (filters.locations && filters.locations.length > 0) count++;
    if (filters.materials && filters.materials.length > 0) count++;
    if (filters.heritage && filters.heritage.length > 0) count++;
    if (filters.authenticityOnly) count++;
    if (filters.freeShippingOnly) count++;
    if (filters.onSaleOnly) count++;
    if (filters.unescoOnly) count++;

    return count;
  }

  /**
   * Serialize filters for analytics
   * @description Converts filters to analytics-friendly format
   * @param filters - Filter object
   * @returns Serialized filters
   */
  private serializeFilters(filters: CategoryFilter): any {
    return {
      price_range: filters.priceRange ? `${filters.priceRange.min}-${filters.priceRange.max}` : null,
      ratings: filters.ratings?.join(',') || null,
      availability: filters.availability?.join(',') || null,
      locations: filters.locations?.join(',') || null,
      materials: filters.materials?.join(',') || null,
      heritage: filters.heritage?.join(',') || null,
      authenticity_only: filters.authenticityOnly || false,
      free_shipping_only: filters.freeShippingOnly || false,
      on_sale_only: filters.onSaleOnly || false,
      unesco_only: filters.unescoOnly || false
    };
  }

  //#endregion
}
