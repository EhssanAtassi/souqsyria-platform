import { Component, ChangeDetectionStrategy, input, output, OnInit, AfterViewInit, signal, inject, CUSTOM_ELEMENTS_SCHEMA, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { register } from 'swiper/element/bundle';
import { Product } from '../../interfaces/product.interface';
import { ProductsService } from '../../../store/products/products.service';
import { ProductsQuery } from '../../../store/products/products.query';

// Register Swiper custom elements
register();

/**
 * Recommendation types supported by the carousel component
 */
export type RecommendationType =
  | 'similar'
  | 'related'
  | 'frequently-bought'
  | 'bestsellers'
  | 'regional';

/**
 * Product Recommendations Carousel Component for Syrian Marketplace
 *
 * Displays product recommendations in a Swiper carousel with Golden Wheat styling.
 * Integrated with RecommendationsService for intelligent product suggestions.
 *
 * Features:
 * - 5 recommendation algorithm types
 * - Swiper carousel with navigation and responsive breakpoints
 * - Golden Wheat theme colors (#988561, #b9a779, #edebe0)
 * - RTL support for Arabic language
 * - Loading, error, and empty states
 * - Click tracking for analytics
 * - Mobile responsive (2-5 columns)
 *
 * @swagger
 * components:
 *   schemas:
 *     ProductRecommendationsCarouselComponent:
 *       type: object
 *       properties:
 *         productId:
 *           type: string
 *           required: true
 *           description: Current product ID for generating recommendations
 *         type:
 *           type: string
 *           enum: [similar, related, frequently-bought, bestsellers, regional]
 *           default: similar
 *           description: Type of recommendation algorithm to use
 *         title:
 *           type: string
 *           default: You May Also Like
 *           description: Section title in English
 *         titleAr:
 *           type: string
 *           default: قد يعجبك أيضاً
 *           description: Section title in Arabic
 *         limit:
 *           type: number
 *           default: 8
 *           description: Maximum number of products to display
 *         showViewAll:
 *           type: boolean
 *           default: true
 *           description: Whether to show "View All" button
 *         language:
 *           type: string
 *           enum: [en, ar]
 *           default: en
 *           description: Current language for display
 *       events:
 *         productClick:
 *           description: Emitted when a product is clicked
 *           payload:
 *             type: Product
 *         addToCart:
 *           description: Emitted when "Add to Cart" is clicked
 *           payload:
 *             type: Product
 *         viewAll:
 *           description: Emitted when "View All" is clicked
 */
@Component({
  selector: 'app-product-recommendations-carousel',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './product-recommendations-carousel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,

  styleUrl: './product-recommendations-carousel.component.scss'
})
export class ProductRecommendationsCarouselComponent implements OnInit, AfterViewInit {

  // ==================== INPUTS ====================

  /** Product ID for generating recommendations */
  readonly productId = input.required<string>();

  /** Type of recommendation algorithm */
  readonly type = input<RecommendationType>('similar');

  /** Section title in English */
  readonly title = input<string>('You May Also Like');

  /** Section title in Arabic */
  readonly titleAr = input<string>('قد يعجبك أيضاً');

  /** Maximum number of products to display */
  readonly limit = input<number>(8);

  /** Whether to show "View All" button */
  readonly showViewAll = input<boolean>(true);

  /** Current language (en or ar) */
  readonly language = input<'en' | 'ar'>('en');

  /** Category slug (for bestsellers type) */
  readonly categorySlug = input<string>('');

  /** Region name (for regional type) */
  readonly region = input<string>('');

  // ==================== OUTPUTS ====================

  /** Emitted when a product is clicked */
  readonly productClick = output<Product>();

  /** Emitted when "Add to Cart" is clicked */
  readonly addToCart = output<Product>();

  /** Emitted when "View All" is clicked */
  readonly viewAll = output<void>();

  // ==================== SERVICES ====================

  /** Products service for Akita state */
  private productsService = inject(ProductsService);

  /** Products query for Akita state */
  private productsQuery = inject(ProductsQuery);

  // ==================== STATE ====================

  /** Recommended products */
  recommendations = signal<Product[]>([]);

  /** Loading state */
  isLoading = signal<boolean>(false);

  /** Error state */
  error = signal<string | null>(null);

  // ==================== LIFECYCLE ====================

  /**
   * Component initialization
   * Loads recommendations based on input parameters
   */
  ngOnInit(): void {
    this.loadRecommendations();
  }

  ngAfterViewInit(): void {
    // Swiper breakpoints are now handled via CSS media queries in SCSS file
    // No need to set them programmatically
  }

  // ==================== METHODS ====================

  /**
   * Loads recommendations based on type and parameters
   * Uses ProductsQuery with appropriate filtering algorithm
   */
  private loadRecommendations(): void {
    this.isLoading.set(true);
    this.error.set(null);

    const productId = this.productId();
    const limit = this.limit();
    const type = this.type();

    // Load products from Akita
    this.productsService.loadProducts();
    const allProducts = this.productsQuery.getAll();

    // Find current product
    const currentProduct = allProducts.find(p => p.id === productId);

    let recommendations: Product[] = [];

    switch (type) {
      case 'similar':
        // Products from same category, excluding current
        recommendations = currentProduct
          ? allProducts.filter(p => p.category.slug === currentProduct.category.slug && p.id !== productId).slice(0, limit)
          : allProducts.slice(0, limit);
        break;

      case 'related':
        // Products from same category or seller
        recommendations = currentProduct
          ? allProducts.filter(p =>
              (p.category.slug === currentProduct.category.slug || p.seller.id === currentProduct.seller.id)
              && p.id !== productId
            ).slice(0, limit)
          : allProducts.slice(0, limit);
        break;

      case 'frequently-bought':
        // Highest rated products from same category
        recommendations = currentProduct
          ? allProducts
              .filter(p => p.category.slug === currentProduct.category.slug && p.id !== productId)
              .sort((a, b) => b.reviews.averageRating - a.reviews.averageRating)
              .slice(0, limit)
          : allProducts.sort((a, b) => b.reviews.averageRating - a.reviews.averageRating).slice(0, limit);
        break;

      case 'bestsellers':
        // Highest rated products in category
        const category = this.categorySlug();
        recommendations = category
          ? allProducts
              .filter(p => p.category.slug === category)
              .sort((a, b) => b.reviews.averageRating - a.reviews.averageRating)
              .slice(0, limit)
          : allProducts.sort((a, b) => b.reviews.averageRating - a.reviews.averageRating).slice(0, limit);
        break;

      case 'regional':
        // Products from same region (using seller governorate)
        const region = this.region();
        recommendations = currentProduct && region
          ? allProducts
              .filter(p => p.seller.location.governorate === region && p.id !== productId)
              .slice(0, limit)
          : allProducts.slice(0, limit);
        break;

      default:
        // Default to similar products
        recommendations = currentProduct
          ? allProducts.filter(p => p.category.slug === currentProduct.category.slug && p.id !== productId).slice(0, limit)
          : allProducts.slice(0, limit);
    }

    this.recommendations.set(recommendations);
    this.isLoading.set(false);
  }

  /**
   * Handles product click event
   * Emits productClick output for parent component
   *
   * @param product - Clicked product
   */
  onProductClick(product: Product): void {
    this.productClick.emit(product);
  }

  /**
   * Handles add to cart event
   * Emits addToCart output for parent component
   *
   * @param product - Product to add to cart
   * @param event - Click event (to prevent propagation)
   */
  onAddToCart(product: Product, event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.addToCart.emit(product);
  }

  /**
   * Handles view all button click
   * Emits viewAll output for parent component
   */
  onViewAll(): void {
    this.viewAll.emit();
  }

  /**
   * Formats price for display with currency symbol
   *
   * @param amount - Price amount
   * @param currency - Currency code (USD, EUR, SYP)
   * @returns Formatted price string
   */
  formatPrice(amount: number, currency: string): string {
    if (currency === 'SYP') {
      return `£S${new Intl.NumberFormat('ar-SY').format(amount)}`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  /**
   * Calculates discount percentage
   *
   * @param originalPrice - Original price
   * @param currentPrice - Current discounted price
   * @returns Discount percentage
   */
  getDiscountPercentage(originalPrice: number, currentPrice: number): number {
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  }

  /**
   * Checks if product has discount
   *
   * @param product - Product to check
   * @returns True if product has discount
   */
  hasDiscount(product: Product): boolean {
    return !!(product.price.originalPrice && product.price.originalPrice > product.price.amount);
  }

  /**
   * Gets primary authenticity badge for product
   *
   * @param product - Product to get badge for
   * @returns Primary badge text or null
   */
  getPrimaryBadge(product: Product): string | null {
    if (product.authenticity?.unescoRecognition) {
      return 'UNESCO Heritage';
    }
    if (product.authenticity?.certified) {
      return 'Certified Authentic';
    }
    if (product.authenticity?.badges && product.authenticity.badges.length > 0) {
      return product.authenticity.badges[0];
    }
    return null;
  }

  /**
   * TrackBy function for ngFor optimization
   *
   * @param index - Array index
   * @param product - Product object
   * @returns Unique product identifier
   */
  trackByProduct(index: number, product: Product): string {
    return product.id;
  }
}
