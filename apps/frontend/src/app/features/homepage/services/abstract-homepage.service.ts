/**
 * Abstract Homepage Service
 *
 * @description Abstract service interface defining homepage data operations
 * This file follows the PROJECT_STRUCTURE_BLUEPRINT pattern of creating abstract
 * service interfaces that can be implemented by both mock and real API services.
 *
 * @pattern Abstract Service Pattern
 * - Define abstract methods for all data operations
 * - Concrete implementations provide mock or real API data
 * - Switch between implementations via environment configuration
 * - Enables seamless transition from development to production
 *
 * @swagger
 * components:
 *   schemas:
 *     AbstractHomepageService:
 *       type: object
 *       description: Abstract interface for homepage data operations
 */

import { Observable } from 'rxjs';
import { Product } from '../../../shared/interfaces/product.interface';
import { Campaign } from '../../../shared/interfaces/campaign.interface';
import { CategoryShowcaseSection } from '../../../shared/interfaces/category-showcase.interface';
import { ProductOffer } from '../../../shared/interfaces/product-offer.interface';

/**
 * Abstract Homepage Service
 *
 * @description Defines the contract for homepage data operations
 * Implementations must provide both mock and real API methods
 *
 * @remarks
 * Following PROJECT_STRUCTURE_BLUEPRINT.md pattern:
 * - Abstract class defines interface
 * - Concrete class implements both mock and real methods
 * - Environment config determines which method to use
 * - Mock methods perform client-side filtering
 * - Real methods call backend APIs
 *
 * @example
 * ```typescript
 * // Concrete implementation
 * export class HomepageService extends AbstractHomepageService {
 *   getFeaturedProducts() {
 *     return environment.useMockData
 *       ? this.getMockFeaturedProducts()
 *       : this.http.get<Product[]>('/api/products/featured');
 *   }
 * }
 * ```
 */
export abstract class AbstractHomepageService {
  //#region Product Operations

  /**
   * Get featured products for homepage display
   * @description Retrieves products marked as featured with high ratings and discounts
   * @returns Observable stream of featured products
   */
  abstract getFeaturedProducts(): Observable<Product[]>;

  /**
   * Get featured products from mock data
   * @description Mock implementation with client-side filtering
   * @returns Observable stream of mock featured products
   */
  abstract getMockFeaturedProducts(): Observable<Product[]>;

  /**
   * Get new arrival products for homepage display
   * @description Retrieves recently added products sorted by creation date
   * @param limit - Maximum number of products to return
   * @returns Observable stream of new arrival products
   */
  abstract getNewArrivals(limit?: number): Observable<Product[]>;

  /**
   * Get new arrival products from mock data
   * @description Mock implementation with client-side sorting
   * @param limit - Maximum number of products to return
   * @returns Observable stream of mock new arrivals
   */
  abstract getMockNewArrivals(limit?: number): Observable<Product[]>;

  /**
   * Get top rated products for homepage display
   * @description Retrieves products with highest ratings and review counts
   * @param limit - Maximum number of products to return
   * @returns Observable stream of top rated products
   */
  abstract getTopRatedProducts(limit?: number): Observable<Product[]>;

  /**
   * Get top rated products from mock data
   * @description Mock implementation with client-side sorting by rating
   * @param limit - Maximum number of products to return
   * @returns Observable stream of mock top rated products
   */
  abstract getMockTopRatedProducts(limit?: number): Observable<Product[]>;

  /**
   * Get all products for homepage
   * @description Retrieves complete product catalog
   * @returns Observable stream of all products
   */
  abstract getAllProducts(): Observable<Product[]>;

  /**
   * Get all products from mock data
   * @description Mock implementation returning static Syrian products
   * @returns Observable stream of mock products
   */
  abstract getMockAllProducts(): Observable<Product[]>;

  //#endregion

  //#region Campaign Operations

  /**
   * Get active campaigns for hero section
   * @description Retrieves currently active promotional campaigns
   * @returns Observable stream of active campaigns
   */
  abstract getActiveCampaigns(): Observable<Campaign[]>;

  /**
   * Get active campaigns from mock data
   * @description Mock implementation with Syrian cultural campaigns
   * @returns Observable stream of mock campaigns
   */
  abstract getMockActiveCampaigns(): Observable<Campaign[]>;

  //#endregion

  //#region Category Showcase Operations

  /**
   * Get visible category showcase sections
   * @description Retrieves admin-configured category showcase sections
   * @returns Observable stream of showcase sections
   */
  abstract getCategoryShowcaseSections(): Observable<CategoryShowcaseSection[]>;

  /**
   * Get category showcase sections from mock data
   * @description Mock implementation with Syrian marketplace sections
   * @returns Observable stream of mock showcase sections
   */
  abstract getMockCategoryShowcaseSections(): Observable<CategoryShowcaseSection[]>;

  //#endregion

  //#region Product Offers Operations

  /**
   * Get featured product offers
   * @description Retrieves promotional product offers for display
   * @returns Observable stream of featured offers
   */
  abstract getFeaturedOffers(): Observable<ProductOffer[]>;

  /**
   * Get featured offers from mock data
   * @description Mock implementation with Syrian product promotions
   * @returns Observable stream of mock featured offers
   */
  abstract getMockFeaturedOffers(): Observable<ProductOffer[]>;

  /**
   * Get flash sale offers
   * @description Retrieves time-limited flash sale offers
   * @returns Observable stream of flash sale offers
   */
  abstract getFlashSaleOffers(): Observable<ProductOffer[]>;

  /**
   * Get flash sale offers from mock data
   * @description Mock implementation with time-limited promotions
   * @returns Observable stream of mock flash sale offers
   */
  abstract getMockFlashSaleOffers(): Observable<ProductOffer[]>;

  //#endregion

  //#region Analytics Operations

  /**
   * Track homepage view event
   * @description Records analytics event when homepage is viewed
   * @returns Observable stream confirming tracking
   */
  abstract trackHomepageView(): Observable<void>;

  /**
   * Track category click event
   * @description Records analytics event when category is clicked
   * @param categoryId - Clicked category identifier
   * @param categoryName - Category name for analytics
   * @param source - Click source (e.g., 'featured', 'quick-nav')
   * @returns Observable stream confirming tracking
   */
  abstract trackCategoryClick(
    categoryId: string,
    categoryName: string,
    source: string
  ): Observable<void>;

  /**
   * Track product view event
   * @description Records analytics event when product is viewed
   * @param productId - Viewed product identifier
   * @param source - View source (e.g., 'featured', 'new-arrivals')
   * @returns Observable stream confirming tracking
   */
  abstract trackProductView(
    productId: string,
    source: string
  ): Observable<void>;

  /**
   * Track campaign interaction event
   * @description Records analytics event when campaign is interacted with
   * @param campaignId - Campaign identifier
   * @param interactionType - Type of interaction (click, view, etc.)
   * @returns Observable stream confirming tracking
   */
  abstract trackCampaignInteraction(
    campaignId: string,
    interactionType: 'click' | 'view' | 'cta_click'
  ): Observable<void>;

  //#endregion
}
