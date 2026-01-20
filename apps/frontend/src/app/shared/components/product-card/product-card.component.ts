import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Product } from '../../interfaces/product.interface';

/**
 * Product card component for Syrian marketplace
 * Displays product information in grid or list view with B2C optimizations
 * 
 * @swagger
 * components:
 *   schemas:
 *     ProductCardComponent:
 *       type: object
 *       properties:
 *         product:
 *           $ref: '#/components/schemas/Product'
 *         viewMode:
 *           type: string
 *           enum: [grid, list]
 *           description: Display mode for the product card
 *         showWishlist:
 *           type: boolean
 *           description: Whether to show wishlist functionality
 *         showQuickAdd:
 *           type: boolean
 *           description: Whether to show quick add to cart button
 *         onAddToCart:
 *           type: function
 *           description: Event emitted when product added to cart
 *         onAddToWishlist:
 *           type: function
 *           description: Event emitted when product added to wishlist
 */
@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatChipsModule,
    MatTooltipModule
  ],
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductCardComponent {
  /**
   * Product data to display in card
   */
  @Input() product!: Product;
  
  /**
   * Display mode: grid or list view
   */
  @Input() viewMode: 'grid' | 'list' = 'grid';
  
  /**
   * Whether to show wishlist functionality
   */
  @Input() showWishlist: boolean = true;
  
  /**
   * Whether to show quick add to cart button
   */
  @Input() showQuickAdd: boolean = true;
  
  /**
   * Whether product is in user's wishlist
   */
  @Input() isInWishlist: boolean = false;
  
  /**
   * Loading state for cart operations
   */
  @Input() isAddingToCart: boolean = false;
  
  /**
   * Currency preference for display
   */
  @Input() currency: 'USD' | 'EUR' | 'SYP' = 'USD';

  /**
   * Event emitted when user adds product to cart
   */
  @Output() addToCart = new EventEmitter<Product>();
  
  /**
   * Event emitted when user adds/removes product from wishlist
   */
  @Output() toggleWishlist = new EventEmitter<Product>();
  
  /**
   * Event emitted when user clicks on product card
   */
  @Output() productClick = new EventEmitter<Product>();

  /**
   * Gets the primary product image URL
   * Returns placeholder if no image available
   * 
   * @returns Primary image URL or placeholder
   */
  getPrimaryImageUrl(): string {
    const primaryImage = this.product.images?.find(img => img.isPrimary);
    return primaryImage?.url || '/assets/images/placeholder-image.svg';
  }

  /**
   * Gets the display price based on currency preference
   * Handles international pricing and discounts
   * 
   * @returns Formatted price object with amount and currency
   */
  getDisplayPrice(): { amount: number; currency: string; originalAmount?: number } {
    let amount = this.product.price.amount;
    let originalAmount: number | undefined;
    
    // Use international pricing if available
    if (this.currency !== 'USD' && this.product.price.internationalPricing?.[this.currency]) {
      amount = this.product.price.internationalPricing[this.currency];
      if (this.product.price.originalPrice && this.product.price.internationalPricing) {
        originalAmount = this.product.price.internationalPricing[this.currency] * 
          (this.product.price.originalPrice / this.product.price.amount);
      }
    } else {
      if (this.product.price.originalPrice) {
        originalAmount = this.product.price.originalPrice;
      }
    }
    
    return { amount, currency: this.currency, originalAmount };
  }

  /**
   * Gets discount percentage if available
   * 
   * @returns Discount percentage or null
   */
  getDiscountPercentage(): number | null {
    return this.product.price.discount?.percentage || null;
  }

  /**
   * Checks if product has discount
   * 
   * @returns True if product has active discount
   */
  hasDiscount(): boolean {
    return !!this.product.price.discount;
  }

  /**
   * Gets star rating array for display
   * Returns array of 5 elements with filled/empty stars
   * 
   * @returns Array representing star ratings
   */
  getStarRating(): ('full' | 'half' | 'empty')[] {
    const rating = this.product.reviews.averageRating;
    const stars: ('full' | 'half' | 'empty')[] = [];
    
    for (let i = 1; i <= 5; i++) {
      if (rating >= i) {
        stars.push('full');
      } else if (rating >= i - 0.5) {
        stars.push('half');
      } else {
        stars.push('empty');
      }
    }
    
    return stars;
  }

  /**
   * Gets inventory status display information
   * 
   * @returns Inventory status with color and text
   */
  getInventoryStatus(): { text: string; color: string; icon: string } {
    const status = this.product.inventory.status;
    const quantity = this.product.inventory.quantity;
    
    switch (status) {
      case 'in_stock':
        if (quantity <= this.product.inventory.lowStockThreshold) {
          return { text: `Only ${quantity} left`, color: 'warn', icon: 'warning' };
        }
        return { text: 'In Stock', color: 'primary', icon: 'check_circle' };
      case 'low_stock':
        return { text: `Only ${quantity} left`, color: 'warn', icon: 'warning' };
      case 'out_of_stock':
        return { text: 'Out of Stock', color: 'accent', icon: 'cancel' };
      case 'pre_order':
        return { text: 'Pre-Order', color: 'primary', icon: 'schedule' };
      default:
        return { text: 'Unknown', color: 'primary', icon: 'help' };
    }
  }

  /**
   * Checks if product is available for purchase
   * 
   * @returns True if product can be added to cart
   */
  isAvailableForPurchase(): boolean {
    return this.product.inventory.inStock && this.product.inventory.quantity > 0;
  }

  /**
   * Gets heritage badges for display
   * 
   * @returns Array of badge information
   */
  getHeritageBadges(): { text: string; color: string }[] {
    const badges: { text: string; color: string }[] = [];
    
    if (this.product.authenticity.certified) {
      badges.push({ text: 'Certified Authentic', color: 'primary' });
    }
    
    if (this.product.authenticity.unescoRecognition) {
      badges.push({ text: 'UNESCO Heritage', color: 'accent' });
    }
    
    if (this.product.authenticity.heritage === 'traditional') {
      badges.push({ text: 'Traditional Craft', color: 'warn' });
    }
    
    return badges.slice(0, 2); // Limit to 2 badges for card display
  }

  /**
   * Gets shipping information for display
   * 
   * @returns Shipping display information
   */
  getShippingInfo(): { text: string; isFree: boolean } {
    const displayPrice = this.getDisplayPrice();
    const freeShippingThreshold = this.product.shipping.freeShippingThreshold?.amount || 0;
    const isFree = displayPrice.amount >= freeShippingThreshold;
    
    if (isFree) {
      return { text: 'Free Shipping', isFree: true };
    }
    
    const cheapestShipping = this.product.shipping.methods
      .sort((a, b) => a.cost.amount - b.cost.amount)[0];
    
    if (cheapestShipping) {
      return { 
        text: `Shipping from $${cheapestShipping.cost.amount}`, 
        isFree: false 
      };
    }
    
    return { text: 'Shipping calculated at checkout', isFree: false };
  }

  /**
   * Handles add to cart button click
   * Emits addToCart event with product data
   * 
   * @param event - Click event
   */
  onAddToCartClick(event: Event): void {
    event.stopPropagation(); // Prevent card click
    if (this.isAvailableForPurchase() && !this.isAddingToCart) {
      this.addToCart.emit(this.product);
    }
  }

  /**
   * Handles wishlist toggle button click
   * Emits toggleWishlist event with product data
   * 
   * @param event - Click event
   */
  onWishlistToggle(event: Event): void {
    event.stopPropagation(); // Prevent card click
    this.toggleWishlist.emit(this.product);
  }

  /**
   * Handles product card click
   * Emits productClick event for navigation
   * 
   * @param event - Click event
   */
  onCardClick(event: Event): void {
    this.productClick.emit(this.product);
  }

  /**
   * Gets CSS classes for the card based on view mode and state
   * 
   * @returns CSS class string
   */
  getCardClasses(): string {
    const baseClasses = 'product-card cursor-pointer transition-all duration-200 hover:shadow-lg';
    const viewClasses = this.viewMode === 'list' ? 'product-card--list' : 'product-card--grid';
    const stockClasses = !this.isAvailableForPurchase() ? 'product-card--out-of-stock' : '';
    
    return `${baseClasses} ${viewClasses} ${stockClasses}`.trim();
  }

  /**
   * Formats price for display with appropriate currency symbol
   * 
   * @param amount - Price amount
   * @param currency - Currency code
   * @returns Formatted price string
   */
  formatPrice(amount: number, currency: string): string {
    const symbols: Record<string, string> = {
      'USD': '$',
      'EUR': '€',
      'SYP': 'ل.س'
    };
    
    const symbol = symbols[currency] || currency;
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: currency === 'SYP' ? 0 : 2,
      maximumFractionDigits: currency === 'SYP' ? 0 : 2
    }).format(amount);
    
    return currency === 'SYP' ? `${formatted} ${symbol}` : `${symbol}${formatted}`;
  }
}