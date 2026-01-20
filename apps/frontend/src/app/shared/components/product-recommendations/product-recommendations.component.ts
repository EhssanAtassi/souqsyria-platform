import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Product } from '../../interfaces/product.interface';

/**
 * Highly flexible and reusable product recommendations component for Syrian marketplace
 *
 * Features:
 * - Multiple display styles (grid, carousel, compact)
 * - Customizable themes (related, trending, cart-recommendations, etc.)
 * - Syrian cultural styling with golden wheat theme
 * - Responsive design for all screen sizes
 * - Revenue optimization focused (quick add, wishlist, cross-selling)
 *
 * @swagger
 * components:
 *   schemas:
 *     ProductRecommendationsComponent:
 *       type: object
 *       properties:
 *         products:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Product'
 *           description: Array of products to display as recommendations
 *         title:
 *           type: string
 *           description: Section title (e.g., "Related Products", "Customers Also Bought")
 *         subtitle:
 *           type: string
 *           description: Optional subtitle for additional context
 *         theme:
 *           type: string
 *           enum: [related, trending, cart-recommendations, artisan, bundle, popular]
 *           description: Visual theme that affects colors and badges
 *         displayStyle:
 *           type: string
 *           enum: [grid, carousel, compact, list]
 *           description: Layout style for product display
 *         maxItems:
 *           type: number
 *           description: Maximum number of products to display
 *         showQuickAdd:
 *           type: boolean
 *           description: Whether to show quick add to cart buttons
 *         showWishlist:
 *           type: boolean
 *           description: Whether to show wishlist toggle buttons
 *         gridColumns:
 *           type: object
 *           description: Responsive grid column configuration
 */
@Component({
  selector: 'app-product-recommendations',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatBadgeModule,
    MatTooltipModule
  ],
  templateUrl: './product-recommendations.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,

  styleUrls: ['./product-recommendations.component.scss']
})
export class ProductRecommendationsComponent implements OnInit {

  /** Array of products to display as recommendations */
  @Input() products: Product[] = [];

  /** Section title */
  @Input() title: string = 'Recommended Products';

  /** Optional subtitle for additional context */
  @Input() subtitle: string = '';

  /** Visual theme affecting colors and styling */
  @Input() theme: 'related' | 'trending' | 'cart-recommendations' | 'artisan' | 'bundle' | 'popular' = 'related';

  /** Layout style for product display */
  @Input() displayStyle: 'grid' | 'carousel' | 'compact' | 'list' = 'grid';

  /** Maximum number of products to display */
  @Input() maxItems: number = 6;

  /** Whether to show quick add to cart buttons */
  @Input() showQuickAdd: boolean = true;

  /** Whether to show wishlist toggle buttons */
  @Input() showWishlist: boolean = true;

  /** Whether to show product prices */
  @Input() showPrice: boolean = true;

  /** Whether to show product ratings */
  @Input() showRating: boolean = true;

  /** Whether to show seller information */
  @Input() showSeller: boolean = false;

  /** Whether to show cultural authenticity badges */
  @Input() showAuthenticity: boolean = true;

  /** Responsive grid column configuration */
  @Input() gridColumns: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  } = {
    xs: 1,
    sm: 2,
    md: 3,
    lg: 4,
    xl: 6
  };

  /** Event emitted when a product is clicked */
  @Output() productClick = new EventEmitter<Product>();

  /** Event emitted when add to cart is clicked */
  @Output() addToCart = new EventEmitter<string>();

  /** Event emitted when wishlist is toggled */
  @Output() toggleWishlist = new EventEmitter<Product>();

  /** Event emitted when product quick view is requested */
  @Output() quickView = new EventEmitter<Product>();

  /** Computed filtered products based on maxItems */
  displayedProducts = computed(() => {
    const products = this.products;
    const max = this.maxItems;
    return products.slice(0, max);
  });

  /** Computed theme configuration */
  themeConfig = computed(() => {
    const theme = this.theme;

    const themeMap = {
      related: {
        cardHeaderClass: 'bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-200',
        titleClass: 'text-amber-800',
        iconClass: 'text-amber-600',
        icon: 'category',
        hoverClass: 'hover:text-amber-700',
        buttonClass: 'hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700',
        badgeClass: 'bg-amber-100 text-amber-800',
        badgeIcon: 'star'
      },
      trending: {
        cardHeaderClass: 'bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-200',
        titleClass: 'text-purple-800',
        iconClass: 'text-purple-600',
        icon: 'trending_up',
        hoverClass: 'hover:text-purple-700',
        buttonClass: 'hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700',
        badgeClass: 'bg-purple-500 text-white',
        badgeIcon: 'whatshot'
      },
      'cart-recommendations': {
        cardHeaderClass: 'bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200',
        titleClass: 'text-green-800',
        iconClass: 'text-green-600',
        icon: 'people',
        hoverClass: 'hover:text-green-700',
        buttonClass: 'hover:bg-green-50 hover:border-green-300 hover:text-green-700',
        badgeClass: 'bg-green-500 text-white',
        badgeIcon: 'thumb_up'
      },
      artisan: {
        cardHeaderClass: 'bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200',
        titleClass: 'text-blue-800',
        iconClass: 'text-blue-600',
        icon: 'person',
        hoverClass: 'hover:text-blue-700',
        buttonClass: 'hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700',
        badgeClass: 'bg-blue-500 text-white',
        badgeIcon: 'verified'
      },
      bundle: {
        cardHeaderClass: 'bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-200',
        titleClass: 'text-orange-800',
        iconClass: 'text-orange-600',
        icon: 'shopping_basket',
        hoverClass: 'hover:text-orange-700',
        buttonClass: 'hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700',
        badgeClass: 'bg-orange-500 text-white',
        badgeIcon: 'group_work'
      },
      popular: {
        cardHeaderClass: 'bg-gradient-to-r from-rose-50 to-red-50 border-b border-rose-200',
        titleClass: 'text-rose-800',
        iconClass: 'text-rose-600',
        icon: 'favorite',
        hoverClass: 'hover:text-rose-700',
        buttonClass: 'hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700',
        badgeClass: 'bg-rose-500 text-white',
        badgeIcon: 'favorite'
      }
    };

    return themeMap[theme] || themeMap.related;
  });

  /** Computed grid classes based on responsive configuration */
  gridClasses = computed(() => {
    const cols = this.gridColumns;
    return `grid grid-cols-${cols.xs} sm:grid-cols-${cols.sm} md:grid-cols-${cols.md} lg:grid-cols-${cols.lg} xl:grid-cols-${cols.xl} gap-4`;
  });

  ngOnInit(): void {
    // Component initialization
  }

  /**
   * TrackBy function for product list optimization
   * @param index - Array index
   * @param product - Product object
   * @returns Unique identifier for the product
   */
  trackByProduct(index: number, product: Product): string {
    return product.id || index.toString();
  }

  /**
   * Handles product click navigation
   *
   * @param product - Product that was clicked
   */
  onProductClick(product: Product): void {
    this.productClick.emit(product);
  }

  /**
   * Handles add to cart action
   *
   * @param productId - Product ID to add to cart
   * @param event - Click event to stop propagation
   */
  onAddToCart(productId: string, event: Event): void {
    event.stopPropagation();
    this.addToCart.emit(productId);
  }

  /**
   * Handles wishlist toggle action
   *
   * @param product - Product to toggle in wishlist
   * @param event - Click event to stop propagation
   */
  onToggleWishlist(product: Product, event: Event): void {
    event.stopPropagation();
    this.toggleWishlist.emit(product);
  }

  /**
   * Handles quick view action
   *
   * @param product - Product to view
   * @param event - Click event to stop propagation
   */
  onQuickView(product: Product, event: Event): void {
    event.stopPropagation();
    this.quickView.emit(product);
  }

  /**
   * Formats price for display with currency
   *
   * @param amount - Price amount
   * @param currency - Currency code
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
   * Calculates and formats discount percentage
   *
   * @param originalPrice - Original price
   * @param currentPrice - Discounted price
   * @returns Formatted discount percentage
   */
  getDiscountPercentage(originalPrice: number, currentPrice: number): string {
    const discount = ((originalPrice - currentPrice) / originalPrice) * 100;
    return Math.round(discount) + '% OFF';
  }

  /**
   * Gets the primary authenticity badge for a product
   *
   * @param product - Product to get badge for
   * @returns Primary authenticity badge or null
   */
  getPrimaryAuthenticityBadge(product: Product): string | null {
    if (product.authenticity?.badges && product.authenticity.badges.length > 0) {
      return product.authenticity.badges[0];
    }
    return null;
  }

  /**
   * Gets the primary traditional technique for a product
   *
   * @param product - Product to get technique for
   * @returns Primary traditional technique or null
   */
  getPrimaryTechnique(product: Product): string | null {
    if (product.authenticity?.traditionalTechniques && product.authenticity.traditionalTechniques.length > 0) {
      return product.authenticity.traditionalTechniques[0];
    }
    return null;
  }

  /**
   * Determines if product should show discount badge
   *
   * @param product - Product to check
   * @returns Whether to show discount badge
   */
  shouldShowDiscount(product: Product): boolean {
    return !!(product.price.originalPrice && product.price.originalPrice > product.price.amount);
  }

  /**
   * Gets the appropriate content badge for the product based on theme
   *
   * @param product - Product to get badge for
   * @returns Badge configuration object
   */
  getBadgeConfig(product: Product): { text: string; class: string; icon?: string } | null {
    const theme = this.theme;
    const config = this.themeConfig();

    switch (theme) {
      case 'trending':
        return { text: 'Hot', class: config.badgeClass, icon: config.badgeIcon };
      case 'cart-recommendations':
        return { text: 'Popular', class: config.badgeClass, icon: config.badgeIcon };
      case 'bundle':
        return { text: 'Bundle', class: config.badgeClass, icon: config.badgeIcon };
      case 'popular':
        return { text: 'Loved', class: config.badgeClass, icon: config.badgeIcon };
      case 'artisan':
        const badge = this.getPrimaryAuthenticityBadge(product);
        return badge ? { text: badge, class: config.badgeClass, icon: config.badgeIcon } : null;
      case 'related':
      default:
        return this.shouldShowDiscount(product)
          ? { text: this.getDiscountPercentage(product.price.originalPrice!, product.price.amount), class: 'bg-red-500 text-white' }
          : null;
    }
  }

  /**
   * Gets bottom badge (usually authenticity) for display
   *
   * @param product - Product to get badge for
   * @returns Bottom badge configuration or null
   */
  getBottomBadge(product: Product): { text: string; class: string; icon?: string } | null {
    if (!this.showAuthenticity) return null;

    const badge = this.getPrimaryAuthenticityBadge(product);
    if (badge) {
      return { text: badge, class: 'bg-green-500 text-white', icon: 'verified' };
    }

    const technique = this.getPrimaryTechnique(product);
    if (technique) {
      return { text: technique, class: 'bg-amber-500 text-white', icon: 'handyman' };
    }

    return null;
  }
}