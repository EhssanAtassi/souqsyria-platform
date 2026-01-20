import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartItem } from '../../interfaces/cart.interface';
import { formatCurrency } from '../../utils/currency.util';

/**
 * Cart Item Price Component
 *
 * Displays cart item price with price lock indicators and savings badges.
 * Shows locked price, current price, and price reductions.
 *
 * Features:
 * - Price lock badge (when priceAtAdd > currentPrice)
 * - Price reduced badge (when currentPrice < priceAtAdd)
 * - Price lock expired warning
 * - Bilingual labels (Arabic/English)
 * - SYP currency formatting
 *
 * @example
 * <app-cart-item-price [cartItem]="item" [locale]="'ar'" />
 */
@Component({
  selector: 'app-cart-item-price',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cart-item-price.component.html',
  styleUrls: ['./cart-item-price.component.scss']
})
export class CartItemPriceComponent {
  @Input({ required: true }) cartItem!: CartItem;
  @Input() locale: 'ar' | 'en' = 'en';

  /**
   * Get Effective Price
   *
   * Returns the price the customer will pay (min of locked price and current price).
   */
  get effectivePrice(): number {
    if (!this.cartItem.priceAtAdd || this.isPriceLockExpired) {
      return this.cartItem.price.unitPrice;
    }

    return Math.min(this.cartItem.priceAtAdd, this.cartItem.price.unitPrice);
  }

  /**
   * Get Price Status
   *
   * Determines if price is locked, reduced, or expired.
   */
  get priceStatus(): 'locked' | 'reduced' | 'expired' | 'normal' {
    if (!this.cartItem.priceAtAdd) {
      return 'normal';
    }

    if (this.isPriceLockExpired) {
      return 'expired';
    }

    if (this.cartItem.price.unitPrice < this.cartItem.priceAtAdd) {
      return 'reduced';
    }

    if (this.cartItem.price.unitPrice > this.cartItem.priceAtAdd) {
      return 'locked';
    }

    return 'normal';
  }

  /**
   * Check if Price Lock Expired
   */
  get isPriceLockExpired(): boolean {
    if (!this.cartItem.lockedUntil) {
      // Calculate lock expiry (7 days from addedAt)
      const lockExpiry = new Date(this.cartItem.addedAt);
      lockExpiry.setDate(lockExpiry.getDate() + 7);
      return new Date() > lockExpiry;
    }

    return new Date() > new Date(this.cartItem.lockedUntil);
  }

  /**
   * Get Savings Amount
   */
  get savings(): number {
    if (this.priceStatus !== 'reduced') {
      return 0;
    }

    return this.cartItem.priceAtAdd! - this.cartItem.price.unitPrice;
  }

  /**
   * Format Price
   */
  formatPrice(amount: number): string {
    return formatCurrency(
      amount,
      this.cartItem.price.currency as 'SYP' | 'USD' | 'EUR',
      this.locale
    );
  }

  /**
   * Get Badge Label
   */
  getBadgeLabel(): string {
    switch (this.priceStatus) {
      case 'locked':
        return this.locale === 'ar' ? 'السعر محجوز' : 'Price locked';
      case 'reduced':
        return this.locale === 'ar'
          ? `وفّرت ${this.formatPrice(this.savings)}`
          : `You save ${this.formatPrice(this.savings)}`;
      case 'expired':
        return this.locale === 'ar' ? 'انتهى حجز السعر' : 'Price lock expired';
      default:
        return '';
    }
  }

  /**
   * Get Badge Class
   */
  getBadgeClass(): string {
    switch (this.priceStatus) {
      case 'locked':
        return 'badge-locked';
      case 'reduced':
        return 'badge-reduced';
      case 'expired':
        return 'badge-expired';
      default:
        return '';
    }
  }
}
