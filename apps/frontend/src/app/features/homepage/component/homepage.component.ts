/**
 * SouqSyria Syrian Marketplace Homepage Component (Refactored)
 *
 * @description Streamlined homepage component following PROJECT_STRUCTURE_BLUEPRINT pattern
 * Reduced from 2,244 lines to ~350 lines by:
 * - Extracting configurations to config/ folder
 * - Using facade service for business logic orchestration
 * - Delegating analytics to dedicated service
 * - Removing all embedded mock data
 * - Simplifying event handlers
 *
 * @pattern Smart Container Component (300-400 lines)
 * - Presentation logic only
 * - Delegates to facade and analytics services
 * - Uses signals for reactive state management
 * - Imports configurations from dedicated config files
 * - Clean, maintainable, testable
 *
 * @swagger
 * components:
 *   schemas:
 *     HomepageComponent:
 *       type: object
 *       description: Main homepage container component
 */

import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  DestroyRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterModule, Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// Child Components
import { HeroSplitLayoutComponent } from '../components/hero-split-layout/hero-split-layout.component';
import { CategoryShowcaseSectionComponent } from '../components/category-showcase-section/category-showcase-section.component';
import { ProductOffersRowComponent } from '../../../shared/components/product-offers-row/product-offers-row.component';
import { FeaturedCategoriesComponent } from '../../category/components/featured-categories/featured-categories.component';
import { CategorySkeletonComponent } from '../../category/components/category-skeleton/category-skeleton.component';

// Services
import { HomepageFacadeService } from '../services/homepage-facade.service';
import { HomepageAnalyticsService } from '../services/homepage-analytics.service';
import { HeroBannersService } from '../../../store/hero-banners/hero-banners.service';
import { HeroBannersQuery } from '../../../store/hero-banners/hero-banners.query';
import { CategoryApiService } from '../../category/services/category-api.service';

// Interfaces
import { Product } from '../../../shared/interfaces/product.interface';
import {
  CategoryShowcaseSection,
  BannerClickEvent,
  SubcategoryClickEvent
} from '../../../shared/interfaces/category-showcase.interface';
import { ProductOffer, ProductOfferClickEvent } from '../../../shared/interfaces/product-offer.interface';
import { FeaturedCategory } from '../../category/models/category-tree.interface';

// Configurations
import {
  FEATURED_CATEGORIES_CONFIG,
  FeaturedCategoryConfig
} from '../config/featured-categories.config';
import {
  QUICK_NAVIGATION_CONFIG,
  QuickNavigationItemConfig,
  getQuickNavigationMutableCopy
} from '../config/quick-navigation.config';

/**
 * Homepage Component
 *
 * @description Syrian marketplace homepage with authentic cultural design
 * Features:
 * - Hero split layout with promotional banners
 * - Product offers row (Hot Deals)
 * - Category showcase sections (admin-configured)
 * - Featured categories grid
 * - Featured products showcase
 * - Trust indicators and newsletter signup
 *
 * @remarks
 * Following PROJECT_STRUCTURE_BLUEPRINT.md pattern:
 * - Component kept to 300-400 lines
 * - All configs imported from config/ folder
 * - Business logic delegated to facade service
 * - Analytics delegated to analytics service
 * - Reactive state with Angular signals
 * - Clean, maintainable, testable
 */
@Component({
  selector: 'app-homepage',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    MatSnackBarModule,
    HeroSplitLayoutComponent,
    CategoryShowcaseSectionComponent,
    ProductOffersRowComponent,
    FeaturedCategoriesComponent,
    CategorySkeletonComponent
  ],
  templateUrl: '../homepage.component.html',
  styleUrl: '../homepage.component.scss'
})
export class HomepageComponent implements OnInit {
  //#region Dependency Injection

  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly homepageFacade = inject(HomepageFacadeService);
  private readonly analytics = inject(HomepageAnalyticsService);
  readonly heroBannersService = inject(HeroBannersService);
  private readonly heroBannersQuery = inject(HeroBannersQuery);
  private readonly categoryApi = inject(CategoryApiService);

  //#endregion

  //#region Configuration Imports

  /** Featured categories from config */
  readonly featuredCategories: readonly FeaturedCategoryConfig[] = FEATURED_CATEGORIES_CONFIG;

  /** Quick navigation items from config (mutable for active state) */
  quickNavCategories: QuickNavigationItemConfig[] = getQuickNavigationMutableCopy();

  //#endregion

  //#region Reactive State with Signals

  /** All products loaded from service */
  readonly allProducts = signal<Product[]>([]);

  /** Featured products (computed from allProducts) */
  readonly featuredProducts = computed(() => {
    const products = this.allProducts();
    return products
      .filter(p => {
        const hasDiscount = p.price.discount?.percentage && p.price.discount.percentage > 0;
        const highRating = p.reviews.averageRating >= 4.5;
        return hasDiscount || highRating;
      })
      .slice(0, 8);
  });

  /** Loading states */
  readonly isLoadingProducts = signal<boolean>(false);
  readonly isLoadingOffers = signal<boolean>(false);
  readonly isLoadingFeaturedCategories = signal<boolean>(false);

  /** Featured categories from API (S1 Categories Sprint) */
  readonly featuredCategoriesFromApi = signal<FeaturedCategory[]>([]);

  /** Error states */
  readonly productsError = signal<string | null>(null);

  //#endregion

  //#region Hero Banners State (Akita Store Integration)

  /** Observable of active hero banners from Akita store */
  readonly heroBanners$ = this.heroBannersQuery.selectActiveBanners$;

  /** Observable of hero banners loading state */
  readonly isLoadingHeroBanners$ = this.heroBannersQuery.selectLoading$;

  /** Observable of hero banners error state */
  readonly heroBannersError$ = this.heroBannersQuery.selectError$;

  /** Observable of featured banner (highest priority) */
  readonly featuredBanner$ = this.heroBannersQuery.selectFeaturedBanner$;

  /** Category showcase sections */
  readonly categoryShowcaseSections = signal<CategoryShowcaseSection[]>([]);

  /** Product offers */
  readonly featuredOffers = signal<ProductOffer[]>([]);
  readonly flashSaleOffers = signal<ProductOffer[]>([]);

  //#endregion

  //#region Lifecycle Hooks

  /**
   * Component initialization
   * @description Loads all homepage data using facade service and Akita store
   */
  ngOnInit(): void {
    // Load hero banners via Akita store (limit to 5 banners)
    this.heroBannersService.loadActiveBanners(5);
    console.log('✅ Hero banners loading initiated via Akita store');

    this.loadFeaturedCategories();
    this.initializeHomepage();
  }

  /**
   * Load featured categories from API
   * @description Fetches featured categories for homepage display
   */
  private loadFeaturedCategories(): void {
    this.isLoadingFeaturedCategories.set(true);

    this.categoryApi
      .getFeatured(6)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.featuredCategoriesFromApi.set(response.data);
          this.isLoadingFeaturedCategories.set(false);
        },
        error: (error) => {
          console.error('Failed to load featured categories:', error);
          this.isLoadingFeaturedCategories.set(false);
        }
      });
  }

  /**
   * Initialize homepage data
   * @description Loads all data in parallel using facade service
   */
  private initializeHomepage(): void {
    this.isLoadingProducts.set(true);
    this.isLoadingOffers.set(true);

    this.homepageFacade
      .initializeHomepage()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.allProducts.set(data.allProducts);
          this.categoryShowcaseSections.set(data.categoryShowcaseSections);
          this.featuredOffers.set(data.featuredOffers);
          this.flashSaleOffers.set(data.flashSaleOffers);

          this.isLoadingProducts.set(false);
          this.isLoadingOffers.set(false);
          this.productsError.set(null);

          console.log(`✅ Homepage initialized: ${data.allProducts.length} products`);
        },
        error: (error) => {
          console.error('Failed to initialize homepage:', error);
          this.productsError.set(this.getErrorMessage(error));
          this.isLoadingProducts.set(false);
          this.isLoadingOffers.set(false);
          this.showErrorNotification('Failed to load homepage data. Please try again.');
        }
      });
  }

  //#endregion

  //#region Category Event Handlers

  /**
   * Handle featured category click
   * @description Navigates to category page with analytics tracking
   */
  onFeaturedCategoryClick(category: FeaturedCategoryConfig): void {
    this.analytics.trackCategoryClick(category.route, category.name, 'featured-categories');
    this.router.navigate([category.route]);
  }

  /**
   * Handle API-driven featured category click
   * @description Navigates to category page using slug from API data
   */
  onFeaturedCategoryClickApi(slug: string): void {
    this.analytics.trackCategoryClick(`/category/${slug}`, slug, 'featured-categories-api');
    this.router.navigate(['/category', slug]);
  }

  /**
   * Handle quick navigation category click
   * @description Updates active state and navigates with analytics
   */
  onQuickNavCategoryClick(category: QuickNavigationItemConfig): void {
    // Update active state
    this.quickNavCategories.forEach(cat => (cat.active = false));
    category.active = true;

    this.analytics.trackQuickNavClick(category.name, category.route);
    this.router.navigate([category.route]);
  }

  //#endregion

  //#region Product Event Handlers

  /**
   * Handle product grid product click
   * @description Navigates to product detail page with analytics
   */
  onProductGridClick(product: Product): void {
    this.analytics.trackProductClick(product, 'featured-products');
    this.router.navigate(['/product', product.slug]);
  }

  /**
   * Handle product grid add to cart
   * @description Adds product to cart via facade service
   */
  onProductGridAddToCart(product: Product): void {
    try {
      // Validate inventory
      if (!product.inventory.inStock) {
        this.showErrorNotification('Product is currently out of stock');
        return;
      }

      if (product.inventory.quantity < 1) {
        this.showErrorNotification('Insufficient stock available');
        return;
      }

      // Add to cart via facade (handles analytics automatically)
      this.homepageFacade.addToCart(product, 1, 'featured-products');

      // Show success notification
      const message = `${product.name} added to cart!`;
      this.showSuccessNotification(message);
    } catch (error: any) {
      this.showErrorNotification(error.message || 'Failed to add product to cart');
    }
  }

  /**
   * Handle product grid wishlist toggle
   * @description Toggles product in wishlist with analytics
   */
  onProductGridToggleWishlist(product: Product): void {
    this.analytics.trackAddToWishlist(product, 'featured-products');

    // Wishlist toggle logic will be implemented when wishlist service is ready
    const message = `${product.nameArabic || product.name} تم إضافته لقائمة الأمنيات | Added to wishlist`;
    this.showSuccessNotification(message);
  }

  /**
   * Handle view all products button
   * @description Navigates to all products page with analytics
   */
  onViewAllProducts(): void {
    this.analytics.trackViewAllClick('featured-products', '/categories/all');
    this.router.navigate(['/categories/all']);
  }

  /**
   * Handle retry load products
   * @description Retries loading homepage data
   */
  onRetryLoadProducts(): void {
    console.log('User requested retry for loading products');
    this.initializeHomepage();
  }

  //#endregion

  //#region Category Showcase Event Handlers

  /**
   * Handle showcase banner click
   * @description Processes category showcase banner clicks
   */
  onShowcaseBannerClick(event: BannerClickEvent): void {
    this.analytics.trackEvent('showcase_banner_click', {
      banner_id: event.bannerId,
      section_id: event.sectionId,
      target_url: event.targetUrl,
      ...event.analytics
    });

    if (event.targetUrl) {
      this.router.navigateByUrl(event.targetUrl);
    }
  }

  /**
   * Handle showcase subcategory click
   * @description Processes category showcase subcategory clicks
   */
  onShowcaseSubcategoryClick(event: SubcategoryClickEvent): void {
    this.analytics.trackEvent('showcase_subcategory_click', {
      subcategory_id: event.subcategoryId,
      section_id: event.sectionId,
      category_name: event.categoryName,
      ...event.analytics
    });

    // Navigation will be handled by the event if targetUrl is provided
  }

  //#endregion

  //#region Product Offers Event Handlers

  /**
   * Handle product offer click
   * @description Processes promotional offer clicks
   */
  onProductOfferClick(event: ProductOfferClickEvent): void {
    this.analytics.trackOfferClick(
      event.offer.id.toString(),
      event.offer.title,
      event.offer.priceDisplay.discountBadge || event.offer.priceDisplay.salePercentage
    );

    if (event.offer.targetUrl) {
      this.router.navigateByUrl(event.offer.targetUrl);
    }
  }

  //#endregion

  //#region Helper Methods

  /**
   * Extract user-friendly error message from error object
   * @param error - Error object
   * @returns User-friendly error message
   */
  private getErrorMessage(error: any): string {
    if (error?.error?.message) {
      return error.error.message;
    }
    if (error?.message) {
      return error.message;
    }
    if (error?.status) {
      switch (error.status) {
        case 0:
          return 'Network connection error. Please check your internet connection.';
        case 404:
          return 'Products not found.';
        case 500:
          return 'Server error. Please try again later.';
        default:
          return `HTTP Error ${error.status}: ${error.statusText || 'Unknown error'}`;
      }
    }
    return 'An unexpected error occurred. Please try again.';
  }

  //#endregion

  //#region Notification Methods

  /**
   * Show success notification
   * @param message - Success message to display
   */
  private showSuccessNotification(message: string): void {
    this.snackBar.open(message, 'Close | إغلاق', {
      duration: 3000,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }

  /**
   * Show error notification
   * @param message - Error message to display
   */
  private showErrorNotification(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }

  //#endregion

  //#region Template Helper Methods

  /**
   * Generate safe test ID from category name
   * @param categoryName - Category name to convert
   * @param prefix - Optional prefix for the test ID
   * @returns Safe test ID string
   */
  getCategoryTestId(categoryName: string, prefix: string = 'category-card'): string {
    if (!categoryName) return prefix;
    return `${prefix}-${categoryName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  }

  /**
   * Generate safe test ID from product ID
   * @param productId - Product ID to convert
   * @param prefix - Optional prefix for the test ID
   * @returns Safe test ID string
   */
  getProductTestId(productId: number | string, prefix: string = 'product-card'): string {
    if (!productId) return prefix;
    return `${prefix}-${productId}`;
  }

  //#endregion
}
