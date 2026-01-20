import { Component, OnInit, DestroyRef, Input, Output, EventEmitter, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { Product } from '../../../shared/interfaces/product.interface';
import { ProductsService } from '../../../store/products/products.service';
import { ProductsQuery } from '../../../store/products/products.query';
import { CartService } from '../../../store/cart/cart.service';

/**
 * Product Recommendations Sidebar Component for SouqSyria Syrian Marketplace
 *
 * Features:
 * - Contextual product recommendations based on current campaign
 * - Syrian cultural product highlighting (Damascus steel, Aleppo soap, etc.)
 * - Quick add-to-cart functionality with Syrian Pound pricing
 * - Responsive design optimized for sidebar placement
 * - Bilingual product information (Arabic/English)
 * - Syrian marketplace branding and cultural elements
 * - Analytics tracking for recommendation performance
 *
 * @swagger
 * components:
 *   schemas:
 *     ProductRecommendationsComponent:
 *       type: object
 *       properties:
 *         maxProducts:
 *           type: number
 *           description: Maximum number of products to display
 *           default: 6
 *         campaignType:
 *           type: string
 *           description: Current campaign type for contextual recommendations
 *         showPrices:
 *           type: boolean
 *           description: Whether to display product prices
 *           default: true
 *         showAddToCart:
 *           type: boolean
 *           description: Whether to show add to cart buttons
 *           default: true
 *         layout:
 *           type: string
 *           enum: [sidebar, grid, list]
 *           description: Layout style for recommendations
 *           default: sidebar
 */
@Component({
  selector: 'app-product-recommendations',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatRippleModule,
    MatBadgeModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './product-recommendations.component.html',
  styleUrl: './product-recommendations.component.scss'
})
export class ProductRecommendationsComponent implements OnInit {
  //#region Component Properties and Configuration

  /** Maximum number of products to display */
  @Input() maxProducts: number = 6;

  /** Current campaign type for contextual recommendations */
  @Input() campaignType: string = 'general';

  /** Whether to display product prices */
  @Input() showPrices: boolean = true;

  /** Whether to show add to cart buttons */
  @Input() showAddToCart: boolean = true;

  /** Layout style for recommendations */
  @Input() layout: 'sidebar' | 'grid' | 'list' = 'sidebar';

  /** Component title */
  @Input() title: string = 'Recommended Products';

  /** Component title in Arabic */
  @Input() titleArabic: string = 'المنتجات المقترحة';

  /** Show cultural badges (UNESCO, Heritage, etc.) */
  @Input() showCulturalBadges: boolean = true;

  /** Filter products by Syrian regions */
  @Input() regionFilter?: 'aleppo' | 'damascus' | 'latakia' | 'homs';

  /** Event emitted when product is clicked */
  @Output() productClick = new EventEmitter<Product>();

  /** Event emitted when product is added to cart */
  @Output() productAddToCart = new EventEmitter<Product>();

  /** Event emitted when recommendations are loaded */
  @Output() recommendationsLoaded = new EventEmitter<Product[]>();

  //#endregion

  //#region Private Properties and Lifecycle Management

  /** Subject for component destruction and cleanup */
  private readonly destroyRef = inject(DestroyRef);

  /** Maximum retry attempts for failed operations */
  private readonly MAX_RETRY_ATTEMPTS = 3;

  //#endregion

  //#region Reactive State Management with Signals

  /** All available products */
  readonly allProducts = signal<Product[]>([]);

  /** Loading state for products */
  readonly isLoadingProducts = signal<boolean>(false);

  /** Error state for product loading */
  readonly productsError = signal<string | null>(null);

  /** Recommended products based on campaign type and filters */
  readonly recommendedProducts = computed(() => {
    const products = this.allProducts();
    if (products.length === 0) return [];

    let filtered = products;

    // Filter by campaign type context
    switch (this.campaignType) {
      case 'damascus_steel':
        filtered = products.filter(p =>
          p.category.name.toLowerCase().includes('damascus') ||
          p.category.name.toLowerCase().includes('steel') ||
          p.name.toLowerCase().includes('damascus') ||
          p.name.toLowerCase().includes('steel')
        );
        break;

      case 'aleppo_soap':
        filtered = products.filter(p =>
          p.category.name.toLowerCase().includes('beauty') ||
          p.category.name.toLowerCase().includes('soap') ||
          p.name.toLowerCase().includes('aleppo') ||
          p.name.toLowerCase().includes('soap')
        );
        break;

      case 'textiles':
        filtered = products.filter(p =>
          p.category.name.toLowerCase().includes('textile') ||
          p.category.name.toLowerCase().includes('fabric') ||
          p.category.name.toLowerCase().includes('clothing')
        );
        break;

      case 'food_spices':
        filtered = products.filter(p =>
          p.category.name.toLowerCase().includes('food') ||
          p.category.name.toLowerCase().includes('spice') ||
          p.category.name.toLowerCase().includes('snack')
        );
        break;

      case 'traditional_crafts':
        filtered = products.filter(p =>
          p.category.name.toLowerCase().includes('craft') ||
          p.category.name.toLowerCase().includes('traditional') ||
          p.category.name.toLowerCase().includes('handmade')
        );
        break;

      case 'seasonal':
        // Show products with discounts for seasonal campaigns
        filtered = products.filter(p => p.price.discount && p.price.discount.percentage > 0);
        break;

      case 'new_arrivals':
        // Sort by creation date and show newest
        filtered = products
          .sort((a, b) => b.timestamps.created.getTime() - a.timestamps.created.getTime())
          .slice(0, this.maxProducts * 2); // Get more for better selection
        break;

      case 'top_rated':
        // Show highly rated products
        filtered = products.filter(p => p.reviews.averageRating >= 4.5);
        break;

      default:
        // General recommendations - mix of featured, top-rated, and discounted
        filtered = products.filter(p =>
          p.reviews.averageRating >= 4.0 ||
          (p.price.discount && p.price.discount.percentage > 0) ||
          p.featured
        );
    }

    // Apply region filter if specified
    if (this.regionFilter && filtered.length > 0) {
      filtered = filtered.filter(p => {
        const productRegion = this.extractProductRegion(p);
        return productRegion === this.regionFilter;
      });
    }

    // Prioritize Syrian cultural products
    const culturalProducts = filtered.filter(p => this.isSyrianCulturalProduct(p));
    const otherProducts = filtered.filter(p => !this.isSyrianCulturalProduct(p));

    // Combine cultural products first, then others
    const sortedProducts = [
      ...culturalProducts.sort((a, b) => b.reviews.averageRating - a.reviews.averageRating),
      ...otherProducts.sort((a, b) => b.reviews.averageRating - a.reviews.averageRating)
    ];

    return sortedProducts.slice(0, this.maxProducts);
  });

  /** Has products to display */
  readonly hasProducts = computed(() => {
    return this.recommendedProducts().length > 0;
  });

  /** Cultural products count */
  readonly culturalProductsCount = computed(() => {
    return this.recommendedProducts().filter(p => this.isSyrianCulturalProduct(p)).length;
  });

  //#endregion

  //#region Dependency Injection

  /** Angular router service for navigation */
  private readonly router = inject(Router);

  /** Service for product data management */
  private readonly productsService = inject(ProductsService);

  /** Query for product data access */
  private readonly productsQuery = inject(ProductsQuery);

  /** Service for cart operations */
  private readonly cartService = inject(CartService);

  /** Material snackbar for user notifications */
  private readonly snackBar = inject(MatSnackBar);

  //#endregion

  //#region Lifecycle Hooks

  /**
   * Component initialization
   * @description Loads product recommendations based on campaign context
   */
  ngOnInit(): void {
    console.log('Product Recommendations initialized for campaign type:', this.campaignType);
    this.loadRecommendations();
  }


  //#endregion

  //#region Data Loading and Management

  /**
   * Loads product recommendations with error handling
   * @description Fetches products and applies contextual filtering
   */
  private loadRecommendations(): void {
    this.isLoadingProducts.set(true);
    this.productsError.set(null);

    // Load products into Akita store
    this.productsService.loadProducts()
      .pipe(
        catchError((error: any) => {
          console.error('Failed to load product recommendations:', error);
          const errorMessage = this.getErrorMessage(error);
          this.productsError.set(errorMessage);
          this.showErrorNotification('Failed to load recommendations');
          return of([]);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();

    // Subscribe to products from Akita query
    this.productsQuery.products$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (products: Product[]) => {
          this.allProducts.set(products);
          this.isLoadingProducts.set(false);

          const recommendations = this.recommendedProducts();
          console.log(`Loaded ${recommendations.length} product recommendations for ${this.campaignType}`);

          // Emit recommendations loaded event
          this.recommendationsLoaded.emit(recommendations);

          if (recommendations.length === 0) {
            console.warn('No product recommendations found for campaign type:', this.campaignType);
          }
        },
        error: (error) => {
          this.isLoadingProducts.set(false);
          console.error('Product recommendations subscription error:', error);
        }
      });
  }

  /**
   * Retries loading recommendations
   * @description Allows manual retry of failed recommendation loading
   */
  onRetryLoad(): void {
    console.log('User requested retry for loading recommendations');
    this.loadRecommendations();
  }

  //#endregion

  //#region Product Actions and Interactions

  /**
   * Handles product click events
   * @description Navigates to product detail page and tracks analytics
   * @param product - Clicked product
   * @param event - Click event
   */
  onProductClick(product: Product, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    console.log('Recommendation product clicked:', product.name);

    // Emit product click event
    this.productClick.emit(product);

    // Track analytics
    this.trackAnalyticsEvent('recommendation_product_click', {
      product_id: product.id,
      product_name: product.name,
      campaign_type: this.campaignType,
      recommendation_position: this.recommendedProducts().indexOf(product),
      is_cultural_product: this.isSyrianCulturalProduct(product)
    });

    // Navigate to product detail page
    this.router.navigate(['/product', product.slug]);
  }

  /**
   * Handles add to cart events with comprehensive error handling
   * @description Adds recommended product to cart
   * @param product - Product to add to cart
   * @param event - Click event
   */
  onAddToCart(product: Product, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    console.log('Add to cart from recommendations:', product.name, 'Price:', product.price.amount, product.price.currency);

    // Validate product inventory
    if (!product.inventory.inStock) {
      this.showErrorNotification('Product is currently out of stock');
      return;
    }

    if (product.inventory.quantity < 1) {
      this.showErrorNotification('Insufficient stock available');
      return;
    }

    // Track analytics before adding to cart
    this.trackAnalyticsEvent('recommendation_add_to_cart', {
      product_id: product.id,
      product_name: product.name,
      campaign_type: this.campaignType,
      recommendation_position: this.recommendedProducts().indexOf(product),
      price: product.price.amount,
      currency: product.price.currency,
      is_cultural_product: this.isSyrianCulturalProduct(product)
    });

    try {
      this.cartService.addToCart(product.id, 1);
      const message = `${product.nameArabic || product.name} added to cart`;
      this.showSuccessNotification(message);

      // Emit add to cart event
      this.productAddToCart.emit(product);
    } catch (error) {
      console.error('Add to cart error:', error);
      const errorMessage = this.getErrorMessage(error);
      this.showErrorNotification(`Failed to add item to cart: ${errorMessage}`);
    }
  }

  //#endregion

  //#region Utility Methods

  /**
   * Checks if product is a Syrian cultural product
   * @description Identifies products with cultural significance
   * @param product - Product to check
   * @returns True if product has Syrian cultural significance
   */
  isSyrianCulturalProduct(product: Product): boolean {
    const culturalKeywords = [
      'damascus', 'aleppo', 'syrian', 'heritage', 'traditional', 'handmade',
      'artisan', 'cultural', 'authentic', 'unesco', 'craft', 'بدمشق', 'حلب', 'سوري', 'تراثي'
    ];

    const productText = (
      product.name + ' ' +
      product.description + ' ' +
      product.category.name + ' ' +
      (product.nameArabic || '') + ' ' +
      (product.descriptionArabic || '')
    ).toLowerCase();

    return culturalKeywords.some(keyword => productText.includes(keyword.toLowerCase()));
  }

  /**
   * Extracts product region from product data
   * @description Determines Syrian region associated with product
   * @param product - Product to analyze
   * @returns Syrian region or null
   */
  private extractProductRegion(product: Product): string | null {
    const productText = (
      product.name + ' ' +
      product.description + ' ' +
      (product.nameArabic || '') + ' ' +
      (product.descriptionArabic || '')
    ).toLowerCase();

    if (productText.includes('damascus') || productText.includes('دمشق')) {
      return 'damascus';
    }
    if (productText.includes('aleppo') || productText.includes('حلب')) {
      return 'aleppo';
    }
    if (productText.includes('latakia') || productText.includes('اللاذقية')) {
      return 'latakia';
    }
    if (productText.includes('homs') || productText.includes('حمص')) {
      return 'homs';
    }

    return null;
  }

  /**
   * Gets cultural badge for product
   * @description Returns appropriate cultural badge for Syrian products
   * @param product - Product to analyze
   * @returns Cultural badge information
   */
  getCulturalBadge(product: Product): { icon: string; text: string; color: string } | null {
    if (!this.showCulturalBadges || !this.isSyrianCulturalProduct(product)) {
      return null;
    }

    const productText = (product.name + ' ' + product.description).toLowerCase();

    if (productText.includes('unesco') || productText.includes('heritage')) {
      return { icon: 'verified', text: 'UNESCO', color: 'gold' };
    }
    if (productText.includes('damascus') || productText.includes('دمشق')) {
      return { icon: 'location_city', text: 'Damascus', color: 'navy' };
    }
    if (productText.includes('aleppo') || productText.includes('حلب')) {
      return { icon: 'location_city', text: 'Aleppo', color: 'red' };
    }
    if (productText.includes('handmade') || productText.includes('artisan')) {
      return { icon: 'handyman', text: 'Handmade', color: 'emerald' };
    }
    if (productText.includes('traditional')) {
      return { icon: 'heritage', text: 'Traditional', color: 'gold' };
    }

    return { icon: 'star', text: 'Syrian', color: 'red' };
  }

  /**
   * Formats product price with Syrian cultural context
   * @description Returns formatted price with currency symbol
   * @param product - Product with price information
   * @returns Formatted price string
   */
  getFormattedPrice(product: Product): { current: string; original?: string; discount?: number } {
    const currency = product.price.currency === 'SYP' ? 'ل.س' : '$';
    const current = `${product.price.amount.toLocaleString()} ${currency}`;

    let result: { current: string; original?: string; discount?: number } = { current };

    if (product.price.discount && product.price.discount > 0) {
      const originalAmount = product.price.amount / (1 - product.price.discount / 100);
      result.original = `${originalAmount.toLocaleString()} ${currency}`;
      result.discount = product.price.discount;
    }

    return result;
  }

  /**
   * Track by function for product list optimization
   * @description Improves ngFor performance by tracking items by id
   * @param index - Array index
   * @param product - Product object
   * @returns Unique identifier for tracking
   */
  trackProduct(index: number, product: Product): string {
    return product.id;
  }

  /**
   * Extracts user-friendly error messages from error objects
   * @description Provides consistent error message formatting
   * @param error - The error object
   * @returns User-friendly error message
   */
  private getErrorMessage(error: unknown): string {
    if (typeof error === 'object' && error !== null) {
      const err = error as any;
      if (err.error?.message) {
        return err.error.message;
      }
      if (err.message) {
        return err.message;
      }
      if (typeof err.status === 'number') {
        switch (err.status) {
          case 0:
            return 'Network connection error. Please check your internet connection.';
          case 404:
            return 'Products not found.';
          case 500:
            return 'Server error. Please try again later.';
          default:
            return `HTTP Error ${err.status}: ${err.statusText || 'Unknown error'}`;
        }
      }
    }
    return 'An unexpected error occurred. Please try again.';
  }

  //#endregion

  //#region Notification Helper Methods

  /**
   * Shows success notification to user
   * @description Displays green success notification with Arabic/English text
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
   * Shows error notification to user
   * @description Displays red error notification with action button
   * @param message - Error message to display
   * @param action - Optional action button text
   */
  private showErrorNotification(message: string, action: string = 'Close'): void {
    this.snackBar.open(message, action, {
      duration: 5000,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }

  /**
   * Tracks analytics events
   * @description Centralized analytics tracking with error handling
   * @param eventName - Name of the analytics event
   * @param parameters - Event parameters
   */
  private trackAnalyticsEvent(eventName: string, parameters: any): void {
    try {
      console.log(`Analytics: ${eventName}`, parameters);
      // Google Analytics 4 tracking
      // gtag('event', eventName, parameters);

      // Additional analytics providers can be added here
    } catch (error) {
      console.error('Analytics tracking error:', error);
      // Analytics errors should not break the application
    }
  }

  //#endregion
}