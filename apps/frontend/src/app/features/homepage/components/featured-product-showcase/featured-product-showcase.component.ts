import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, signal, computed, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';

/**
 * Featured Product Showcase Component for Syrian Marketplace
 *
 * Displays a featured product in the right panel of the hero dual panel layout.
 * Features Syrian golden wheat gradient background with Damascus geometric patterns.
 *
 * Components:
 * - "Today's Pick" badge in Arabic/English
 * - Circular/rounded product image
 * - Product name (Arabic first, English second)
 * - Price display with discount highlighting
 * - 5-star rating visualization
 * - Add to Cart button in Syrian red (#CE1126)
 * - Damascus geometric pattern overlay
 *
 * @swagger
 * components:
 *   schemas:
 *     FeaturedProductShowcaseComponent:
 *       type: object
 *       properties:
 *         product:
 *           type: object
 *           description: Featured product data to display
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *               description: Product name in English
 *             nameArabic:
 *               type: string
 *               description: Product name in Arabic
 *             price:
 *               type: object
 *               properties:
 *                 amount:
 *                   type: number
 *                 currency:
 *                   type: string
 *                 originalPrice:
 *                   type: number
 *             images:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   url:
 *                     type: string
 *                   alt:
 *                     type: string
 *             reviews:
 *               type: object
 *               properties:
 *                 averageRating:
 *                   type: number
 *                   minimum: 0
 *                   maximum: 5
 *                 totalReviews:
 *                   type: number
 *             inventory:
 *               type: object
 *               properties:
 *                 inStock:
 *                   type: boolean
 *                 quantity:
 *                   type: number
 *         showTodaysBadge:
 *           type: boolean
 *           description: Whether to show the "Today's Pick" badge
 *         damascusPatternOverlay:
 *           type: boolean
 *           description: Whether to show Damascus geometric pattern overlay
 */
@Component({
  selector: 'app-featured-product-showcase',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatRippleModule
  ],
  templateUrl: './featured-product-showcase.component.html',
  styleUrl: './featured-product-showcase.component.scss'
})
export class FeaturedProductShowcaseComponent {

  /**
   * Product data to showcase - backed by a signal for computed reactivity
   * @description Complete product object with all necessary display information
   */
  private _product: WritableSignal<any> = signal(null);

  @Input()
  set product(value: any) { this._product.set(value); }
  get product(): any { return this._product(); }

  /**
   * Whether to show the "Today's Pick" badge
   * @description Controls display of the prominent "منتج اليوم | Today's Pick" badge
   */
  @Input() showTodaysBadge: boolean = true;

  /**
   * Whether to show Damascus pattern overlay
   * @description Controls display of the subtle Damascus geometric pattern background
   */
  @Input() damascusPatternOverlay: boolean = true;

  /**
   * Background theme for the showcase
   * @description Controls the gradient background theme ('golden-wheat', 'cream', 'sand')
   */
  @Input() backgroundTheme: 'golden-wheat' | 'cream' | 'sand' = 'golden-wheat';

  /**
   * Product click event
   * @description Emitted when user clicks on the product (image, name, or view details)
   */
  @Output() productClick = new EventEmitter<any>();

  /**
   * Add to cart event
   * @description Emitted when user clicks the "Add to Cart" button
   */
  @Output() addToCart = new EventEmitter<any>();

  /**
   * Wishlist toggle event
   * @description Emitted when user clicks the wishlist heart icon
   */
  @Output() toggleWishlist = new EventEmitter<any>();

  /**
   * Computed signal for product availability
   * @description Determines if product is available for purchase
   */
  readonly isProductAvailable = computed(() => {
    if (!this.product) return false;
    return this.product.inventory?.inStock === true && this.product.inventory?.quantity > 0;
  });

  /**
   * Computed signal for primary product image
   * @description Gets the main product image for display
   */
  readonly primaryImage = computed(() => {
    if (!this.product?.images || this.product.images.length === 0) {
      return this.getPlaceholderImage();
    }

    const primaryImg = this.product.images.find((img: any) => img.isPrimary) || this.product.images[0];
    return {
      url: primaryImg.url,
      alt: primaryImg.alt || this.product.name || 'Product image'
    };
  });

  /**
   * Computed signal for price display
   * @description Formats price information with discount highlighting
   */
  readonly priceDisplay = computed(() => {
    if (!this.product?.price) {
      return null;
    }

    const { amount, currency, originalPrice } = this.product.price;
    const hasDiscount = originalPrice && originalPrice > amount;
    const discountPercentage = hasDiscount
      ? Math.round(((originalPrice - amount) / originalPrice) * 100)
      : 0;

    return {
      current: amount,
      original: originalPrice,
      currency: currency || 'USD',
      hasDiscount,
      discountPercentage,
      formattedCurrent: this.formatPrice(amount, currency),
      formattedOriginal: originalPrice ? this.formatPrice(originalPrice, currency) : null
    };
  });

  /**
   * Computed signal for star rating display
   * @description Generates star rating visualization array
   */
  readonly starRating = computed(() => {
    if (!this.product?.reviews?.averageRating) {
      return this.generateStarArray(0);
    }
    return this.generateStarArray(this.product.reviews.averageRating);
  });

  /**
   * Computed signal for stock status
   * @description Determines stock status message and styling
   */
  readonly stockStatus = computed(() => {
    if (!this.product?.inventory) {
      return { status: 'unknown', message: '', messageAr: '', className: '' };
    }

    const { inStock, quantity, lowStockThreshold = 5 } = this.product.inventory;

    if (!inStock || quantity <= 0) {
      return {
        status: 'out-of-stock',
        message: 'Out of Stock',
        messageAr: 'نفد من المخزون',
        className: 'stock-out'
      };
    }

    if (quantity <= lowStockThreshold) {
      return {
        status: 'low-stock',
        message: `Only ${quantity} left`,
        messageAr: `متبقي ${quantity} فقط`,
        className: 'stock-low'
      };
    }

    return {
      status: 'in-stock',
      message: 'In Stock',
      messageAr: 'متوفر',
      className: 'stock-available'
    };
  });

  /**
   * Handles product click events
   * @description Emits product click event with tracking data
   */
  onProductClick(): void {
    if (!this.product) return;

    console.log('Featured product showcase: Product clicked', {
      id: this.product.id,
      name: this.product.name,
      nameArabic: this.product.nameArabic
    });

    this.productClick.emit(this.product);

    // Track analytics
    this.trackAnalyticsEvent('featured_product_click', {
      product_id: this.product.id,
      product_name: this.product.name,
      product_name_ar: this.product.nameArabic,
      price: this.product.price?.amount,
      currency: this.product.price?.currency,
      source: 'featured_product_showcase'
    });
  }

  /**
   * Handles add to cart button clicks
   * @description Validates stock and emits add to cart event
   */
  onAddToCart(event: Event): void {
    event.stopPropagation(); // Prevent triggering product click

    if (!this.product || !this.isProductAvailable()) {
      console.warn('Featured product showcase: Cannot add unavailable product to cart');
      return;
    }

    console.log('Featured product showcase: Add to cart clicked', {
      id: this.product.id,
      name: this.product.name,
      price: this.product.price?.amount
    });

    this.addToCart.emit(this.product);

    // Track analytics
    this.trackAnalyticsEvent('add_to_cart', {
      currency: this.product.price?.currency || 'USD',
      value: this.product.price?.amount || 0,
      items: [{
        item_id: this.product.id,
        item_name: this.product.name,
        item_name_ar: this.product.nameArabic,
        category: this.product.category?.name,
        price: this.product.price?.amount || 0,
        quantity: 1
      }],
      source: 'featured_product_showcase'
    });
  }

  /**
   * Handles wishlist toggle clicks
   * @description Emits wishlist toggle event
   */
  onToggleWishlist(event: Event): void {
    event.stopPropagation(); // Prevent triggering product click

    if (!this.product) return;

    console.log('Featured product showcase: Wishlist toggle clicked', {
      id: this.product.id,
      name: this.product.name
    });

    this.toggleWishlist.emit(this.product);

    // Track analytics
    this.trackAnalyticsEvent('add_to_wishlist', {
      currency: this.product.price?.currency || 'USD',
      value: this.product.price?.amount || 0,
      items: [{
        item_id: this.product.id,
        item_name: this.product.name,
        category: this.product.category?.name,
        price: this.product.price?.amount || 0
      }],
      source: 'featured_product_showcase'
    });
  }

  /**
   * Handles image load errors
   * @description Provides fallback image when product image fails to load
   */
  onImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    if (imgElement) {
      imgElement.src = this.getPlaceholderImage().url;
      imgElement.alt = 'Product image not available | الصورة غير متاحة';
    }
  }

  /**
   * Generates placeholder image object
   * @description Provides fallback image for missing product images
   */
  private getPlaceholderImage(): { url: string; alt: string } {
    return {
      url: 'assets/images/placeholder-product.svg',
      alt: 'Product image | صورة المنتج'
    };
  }

  /**
   * Formats price with currency symbol
   * @description Handles different currency formatting
   */
  private formatPrice(amount: number, currency: string = 'USD'): string {
    if (!amount) return '';

    switch (currency.toUpperCase()) {
      case 'USD':
        return `$${amount.toFixed(2)}`;
      case 'SYP':
        return `${amount.toLocaleString()} £S`;
      case 'EUR':
        return `€${amount.toFixed(2)}`;
      default:
        return `${amount.toFixed(2)} ${currency}`;
    }
  }

  /**
   * Generates star rating array for display
   * @description Creates array of star objects for rating visualization
   */
  private generateStarArray(rating: number): Array<{ filled: boolean; half: boolean }> {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    // Add full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push({ filled: true, half: false });
    }

    // Add half star if needed
    if (hasHalfStar) {
      stars.push({ filled: false, half: true });
    }

    // Add empty stars to reach 5 total
    while (stars.length < 5) {
      stars.push({ filled: false, half: false });
    }

    return stars;
  }

  /**
   * Tracks analytics events with error handling
   * @description Centralized analytics tracking
   */
  private trackAnalyticsEvent(eventName: string, parameters: any): void {
    try {
      console.log(`Featured Product Showcase Analytics: ${eventName}`, parameters);

      // Google Analytics 4 tracking (when available)
      if (typeof (window as any).gtag !== 'undefined') {
        (window as any).gtag('event', eventName, parameters);
      }
    } catch (error) {
      console.error('Featured Product Showcase: Analytics tracking error:', error);
    }
  }

  /**
   * Gets CSS classes for background theme
   * @description Returns appropriate CSS classes for background styling
   */
  getBackgroundThemeClass(): string {
    const baseClass = 'featured-product-showcase-container';
    const themeClass = `theme-${this.backgroundTheme}`;
    const patternClass = this.damascusPatternOverlay ? 'with-damascus-pattern' : '';

    return `${baseClass} ${themeClass} ${patternClass}`.trim();
  }

  /**
   * Gets product route for navigation
   * @description Generates proper product detail route
   */
  getProductRoute(): string {
    if (!this.product?.slug) {
      return '/products';
    }
    return `/product/${this.product.slug}`;
  }

  /**
   * TrackBy function for star rating ngFor optimization
   * @description Improves performance by tracking stars by index
   * @param index - Array index
   * @param star - Star object
   * @returns Unique identifier for tracking
   */
  trackStarIndex(index: number, star: any): number {
    return index;
  }

  /**
   * TrackBy function for badge ngFor optimization
   * @description Improves performance by tracking badges by value
   * @param index - Array index
   * @param badge - Badge string
   * @returns Unique identifier for tracking
   */
  trackBadge(index: number, badge: string): string {
    return badge;
  }
}