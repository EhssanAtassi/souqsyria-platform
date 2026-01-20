import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductOffer, ProductOfferClickEvent } from '../../interfaces/product-offer.interface';

/**
 * Product Offer Card Component (Presentational)
 *
 * Displays a single promotional product offer card with flexible price display formats.
 * This is a DUMB component - receives data via inputs, emits events via outputs.
 *
 * Supports 3 price display formats:
 * 1. DISCOUNT: Shows original price, discounted price, and percentage badge
 * 2. SALE: Shows "SALE UP TO X% Off" message
 * 3. PRICE: Shows "PRICE JUST $X.XX" simple display
 *
 * Features:
 * - Large product image
 * - Dynamic price display based on type
 * - Yellow CTA button (Figma design)
 * - Hover effects (scale, shadow)
 * - Bilingual Arabic/English support
 * - Responsive mobile layout
 *
 * Usage:
 * ```html
 * <app-product-offer-card
 *   [offer]="myOffer"
 *   (cardClick)="onOfferClick($event)" />
 * ```
 *
 * @component
 * @standalone
 */
@Component({
  selector: 'app-product-offer-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-offer-card.component.html',
  styleUrl: './product-offer-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductOfferCardComponent {
  /**
   * Product offer data
   * @input
   */
  offer = input.required<ProductOffer>();

  /**
   * Card click event
   * Emits when user clicks on the card
   * @output
   */
  cardClick = output<ProductOfferClickEvent>();

  /**
   * Handle card click
   * Emits click event with offer data and timestamp
   */
  onCardClick(): void {
    const offer = this.offer();

    // Only emit if offer is active (default true)
    if (offer.isActive !== false) {
      this.cardClick.emit({
        offer,
        timestamp: new Date()
      });
    }
  }

  /**
   * Format price for display
   * @param price - Price value
   * @param currency - Currency code (default: 'USD')
   * @returns Formatted price string (e.g., "$159.99")
   */
  formatPrice(price: number | undefined, currency: string = 'USD'): string {
    if (price === undefined) return '';

    // For Syrian Pound (SYP), format without decimals
    if (currency === 'SYP') {
      return price.toLocaleString('en-US', {
        style: 'decimal',
        maximumFractionDigits: 0
      });
    }

    // For USD and other currencies, format with 2 decimals
    return price.toLocaleString('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  /**
   * Get discount badge lines for display
   * Splits "40%\nOFF" into separate lines
   */
  getDiscountBadgeLines(): string[] {
    const badge = this.offer().priceDisplay.discountBadge;
    return badge ? badge.split('\n') : [];
  }

  /**
   * Get badge style object
   * @returns CSS style object for discount badge
   */
  getBadgeStyle(): { [key: string]: string } {
    const priceDisplay = this.offer().priceDisplay;
    return {
      'background-color': priceDisplay.badgeColor || '#FF6B35'
    };
  }

  /**
   * Check if offer is active (clickable)
   */
  isActive(): boolean {
    return this.offer().isActive !== false;
  }
}
