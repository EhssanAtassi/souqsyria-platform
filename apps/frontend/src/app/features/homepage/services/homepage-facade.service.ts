/**
 * Homepage Facade Service
 *
 * @description Facade service that coordinates multiple services for homepage
 * This file follows the PROJECT_STRUCTURE_BLUEPRINT pattern of using the Facade
 * pattern to simplify complex service interactions and provide a clean API.
 *
 * @pattern Facade Pattern
 * - Coordinates multiple services (homepage, products, cart, etc.)
 * - Provides simplified, high-level API to component
 * - Handles complex orchestration logic
 * - Reduces component complexity
 * - Centralizes business logic
 *
 * @swagger
 * tags:
 *   - name: Homepage Facade
 *     description: High-level homepage operations
 */

import { Injectable, inject } from '@angular/core';
import { Observable, combineLatest, forkJoin } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { HomepageService } from './homepage.service';
import { HomepageAnalyticsService } from './homepage-analytics.service';
import { ProductsService } from '../../../store/products/products.service';
import { CartService } from '../../../store/cart/cart.service';
import { HomepageSectionsService } from '../../../shared/services/homepage-sections.service';
import { ProductOffersService } from '../../../shared/services/product-offers.service';
import { Product } from '../../../shared/interfaces/product.interface';
import { Campaign } from '../../../shared/interfaces/campaign.interface';
import { CategoryShowcaseSection } from '../../../shared/interfaces/category-showcase.interface';
import { ProductOffer } from '../../../shared/interfaces/product-offer.interface';
import { HomepageDataState } from '../models/homepage.interface';
import { environment } from '../../../../environments/environment';

/**
 * Homepage Facade Service
 *
 * @description Provides simplified, high-level operations for homepage component
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
 * constructor(private homepageFacade: HomepageFacadeService) {}
 *
 * ngOnInit() {
 *   // Single call loads all homepage data
 *   this.homepageFacade.initializeHomepage().subscribe(data => {
 *     this.allProducts.set(data.allProducts);
 *     this.featuredProducts.set(data.featuredProducts);
 *     // ... etc
 *   });
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class HomepageFacadeService {
  //#region Dependency Injection

  private readonly homepageService = inject(HomepageService);
  private readonly analyticsService = inject(HomepageAnalyticsService);
  private readonly productsService = inject(ProductsService);
  private readonly cartService = inject(CartService);
  private readonly homepageSectionsService = inject(HomepageSectionsService);
  private readonly productOffersService = inject(ProductOffersService);

  //#endregion

  //#region Initialization Operations

  /**
   * Initialize all homepage data
   * @description Loads all required data for homepage in parallel
   * @returns Observable with complete homepage data state
   */
  initializeHomepage(): Observable<HomepageDataState> {
    // Track homepage view
    this.analyticsService.trackHomepageView();

    // Load all data in parallel using forkJoin
    return forkJoin({
      products: this.loadProducts(),
      campaigns: this.loadCampaigns(),
      showcaseSections: this.loadCategoryShowcaseSections(),
      offers: this.loadProductOffers()
    }).pipe(
      map(({ products, campaigns, showcaseSections, offers }) => {
        // Compute derived product lists
        const featuredProducts = this.computeFeaturedProducts(products);
        const newArrivals = this.computeNewArrivals(products);
        const topRated = this.computeTopRatedProducts(products);

        return {
          allProducts: products,
          featuredProducts,
          newArrivals,
          topRated,
          activeCampaigns: campaigns,
          categoryShowcaseSections: showcaseSections,
          featuredOffers: offers.featured,
          flashSaleOffers: offers.flashSale
        };
      }),
      catchError(error => {
        console.error('Failed to initialize homepage:', error);
        // Return empty state on error
        return of(this.getEmptyDataState());
      })
    );
  }

  /**
   * Reload homepage data
   * @description Refreshes all homepage data (useful for pull-to-refresh)
   * @returns Observable with updated homepage data state
   */
  reloadHomepage(): Observable<HomepageDataState> {
    return this.initializeHomepage();
  }

  //#endregion

  //#region Product Operations

  /**
   * Load all products
   * @description Loads product catalog using appropriate service
   * @returns Observable with product array
   */
  private loadProducts(): Observable<Product[]> {
    return this.homepageService.getAllProducts().pipe(
      map(products => {
        // Defensive: ensure we always return an array
        if (!products || !Array.isArray(products)) {
          console.warn('Products API returned invalid data, using empty array');
          return [];
        }
        return products;
      }),
      tap(products => { if (!environment.production) console.log(`Loaded ${products.length} products`); }),
      catchError(error => {
        console.error('Failed to load products:', error);
        return of([]);
      })
    );
  }

  /**
   * Compute featured products from all products
   * @description Filters products with discounts or high ratings
   * @param products - All products
   * @returns Array of featured products
   */
  private computeFeaturedProducts(products: Product[]): Product[] {
    return products
      .filter(p => {
        const hasDiscount = p.price.discount?.percentage && p.price.discount.percentage > 0;
        const highRating = p.reviews.averageRating >= 4.5;
        return hasDiscount || highRating;
      })
      .slice(0, 8);
  }

  /**
   * Compute new arrival products from all products
   * @description Sorts by creation date and returns most recent
   * @param products - All products
   * @returns Array of new arrival products
   */
  private computeNewArrivals(products: Product[]): Product[] {
    return [...products]
      .sort((a, b) => b.timestamps.created.getTime() - a.timestamps.created.getTime())
      .slice(0, 6);
  }

  /**
   * Compute top rated products from all products
   * @description Sorts by rating and review count
   * @param products - All products
   * @returns Array of top rated products
   */
  private computeTopRatedProducts(products: Product[]): Product[] {
    return [...products]
      .sort((a, b) => {
        const scoreA = a.reviews.averageRating * Math.log(a.reviews.totalReviews + 1);
        const scoreB = b.reviews.averageRating * Math.log(b.reviews.totalReviews + 1);
        return scoreB - scoreA;
      })
      .slice(0, 6);
  }

  /**
   * Get featured products
   * @description Public method to get featured products
   * @returns Observable with featured products
   */
  getFeaturedProducts(): Observable<Product[]> {
    return this.homepageService.getFeaturedProducts();
  }

  /**
   * Get new arrivals
   * @description Public method to get new arrival products
   * @param limit - Maximum number of products
   * @returns Observable with new arrivals
   */
  getNewArrivals(limit: number = 6): Observable<Product[]> {
    return this.homepageService.getNewArrivals(limit);
  }

  /**
   * Get top rated products
   * @description Public method to get top rated products
   * @param limit - Maximum number of products
   * @returns Observable with top rated products
   */
  getTopRatedProducts(limit: number = 6): Observable<Product[]> {
    return this.homepageService.getTopRatedProducts(limit);
  }

  //#endregion

  //#region Campaign Operations

  /**
   * Load active campaigns
   * @description Loads campaigns for hero section
   * @returns Observable with campaign array
   */
  private loadCampaigns(): Observable<Campaign[]> {
    return this.homepageService.getActiveCampaigns().pipe(
      tap(campaigns => { if (!environment.production) console.log(`Loaded ${campaigns.length} campaigns`); }),
      catchError(error => {
        console.error('Failed to load campaigns:', error);
        return of([]);
      })
    );
  }

  /**
   * Handle campaign click
   * @description Processes campaign click with analytics tracking
   * @param campaign - Clicked campaign
   */
  handleCampaignClick(campaign: Campaign): void {
    this.analyticsService.trackCampaignInteraction(campaign.id, 'click');
    if (!environment.production) console.log('Campaign clicked:', campaign.name);
  }

  /**
   * Handle campaign view
   * @description Processes campaign impression with analytics tracking
   * @param campaign - Viewed campaign
   */
  handleCampaignView(campaign: Campaign): void {
    this.analyticsService.trackCampaignInteraction(campaign.id, 'view');
  }

  //#endregion

  //#region Category Showcase Operations

  /**
   * Load category showcase sections
   * @description Loads admin-configured showcase sections
   * @returns Observable with showcase sections array
   */
  private loadCategoryShowcaseSections(): Observable<CategoryShowcaseSection[]> {
    return this.homepageSectionsService.getVisibleSections().pipe(
      tap(sections => { if (!environment.production) console.log(`Loaded ${sections.length} showcase sections`); }),
      catchError(error => {
        console.error('Failed to load showcase sections:', error);
        return of([]);
      })
    );
  }

  //#endregion

  //#region Product Offers Operations

  /**
   * Load product offers
   * @description Loads both featured and flash sale offers
   * @returns Observable with offers object
   */
  private loadProductOffers(): Observable<{ featured: ProductOffer[], flashSale: ProductOffer[] }> {
    return forkJoin({
      featured: this.productOffersService.getFeaturedOffers().pipe(
        catchError(() => of([]))
      ),
      flashSale: this.productOffersService.getFlashSaleOffers().pipe(
        catchError(() => of([]))
      )
    }).pipe(
      tap(offers => {
        if (!environment.production) {
          console.log(`Loaded ${offers.featured.length} featured offers`);
          console.log(`Loaded ${offers.flashSale.length} flash sale offers`);
        }
      })
    );
  }

  //#endregion

  //#region Cart Operations

  /**
   * Add product to cart
   * @description Adds product to cart with analytics tracking
   * @param product - Product to add
   * @param quantity - Quantity to add
   * @param source - Source identifier for analytics
   */
  addToCart(product: Product, quantity: number = 1, source: string = 'homepage'): void {
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

    if (!environment.production) console.log(`Added ${product.name} to cart (qty: ${quantity}, source: ${source})`);
  }

  //#endregion

  //#region Navigation Operations

  /**
   * Handle category click
   * @description Processes category click with analytics tracking
   * @param categoryId - Category identifier
   * @param categoryName - Category name
   * @param source - Click source
   */
  handleCategoryClick(categoryId: string, categoryName: string, source: string): void {
    this.analyticsService.trackCategoryClick(categoryId, categoryName, source);
  }

  /**
   * Handle product click
   * @description Processes product click with analytics tracking
   * @param productId - Product identifier
   * @param source - Click source
   */
  handleProductClick(productId: string, source: string): void {
    this.analyticsService.trackProductView(productId, source);
  }

  //#endregion

  //#region Helper Methods

  /**
   * Get empty data state
   * @description Returns empty data state for error fallback
   * @returns Empty homepage data state
   */
  private getEmptyDataState(): HomepageDataState {
    return {
      allProducts: [],
      featuredProducts: [],
      newArrivals: [],
      topRated: [],
      activeCampaigns: [],
      categoryShowcaseSections: [],
      featuredOffers: [],
      flashSaleOffers: []
    };
  }

  //#endregion
}
