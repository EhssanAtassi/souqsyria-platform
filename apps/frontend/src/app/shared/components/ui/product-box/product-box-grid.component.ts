import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Product } from '../../../interfaces/product.interface';
import { BadgeComponent } from '../badge/badge.component';

/**
 * Product Box Grid Component
 *
 * Vertical card layout for product display in grid view.
 * Features image, title, price, badges, and action buttons.
 *
 * @swagger
 * components:
 *   schemas:
 *     ProductBoxGridComponent:
 *       type: object
 *       description: Vertical product card for grid layout
 *       properties:
 *         product:
 *           $ref: '#/components/schemas/Product'
 *           description: Product data to display
 *         language:
 *           type: string
 *           enum: [en, ar]
 *           description: Display language
 *         addToCart:
 *           type: event
 *           description: Emitted when Add to Cart clicked
 *         addToWishlist:
 *           type: event
 *           description: Emitted when Wishlist icon clicked
 *         quickView:
 *           type: event
 *           description: Emitted when Quick View icon clicked
 *
 * @example
 * ```html
 * <app-product-box-grid
 *   [product]="product"
 *   [language]="currentLang"
 *   (addToCart)="onAddToCart($event)"
 *   (addToWishlist)="onAddToWishlist($event)"
 *   (quickView)="onQuickView($event)">
 * </app-product-box-grid>
 * ```
 */
@Component({
  selector: 'app-product-box-grid',
  standalone: true,
  imports: [CommonModule, RouterModule, BadgeComponent],
  templateUrl: './product-box-grid.component.html',
  styleUrls: ['./product-box-grid.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductBoxGridComponent {
  /**
   * Product data to display
   */
  @Input({ required: true }) product!: Product;

  /**
   * Current display language
   */
  @Input() language: 'en' | 'ar' = 'en';

  /**
   * Event emitted when Add to Cart button clicked
   */
  @Output() addToCart = new EventEmitter<Product>();

  /**
   * Event emitted when Wishlist icon clicked
   */
  @Output() addToWishlist = new EventEmitter<Product>();

  /**
   * Event emitted when Quick View icon clicked
   */
  @Output() quickView = new EventEmitter<Product>();

  /**
   * Handle Add to Cart click
   */
  onAddToCart(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.addToCart.emit(this.product);
  }

  /**
   * Handle Wishlist click
   */
  onAddToWishlist(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.addToWishlist.emit(this.product);
  }

  /**
   * Handle Quick View click
   */
  onQuickView(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.quickView.emit(this.product);
  }

  /**
   * Get product name based on language
   */
  get productName(): string {
    return this.language === 'ar' && this.product.nameArabic
      ? this.product.nameArabic
      : this.product.name;
  }

  /**
   * Calculate discount percentage if on sale
   */
  get discountPercentage(): number | null {
    const currentPrice = this.product.price?.amount;
    const originalPrice = this.product.price?.originalPrice;

    if (originalPrice && currentPrice && originalPrice > currentPrice) {
      return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
    }
    return null;
  }

  /**
   * Get display price (current price)
   */
  get displayPrice(): number {
    return this.product.price?.amount || 0;
  }

  /**
   * Check if product is on sale
   */
  get isOnSale(): boolean {
    const currentPrice = this.product.price?.amount;
    const originalPrice = this.product.price?.originalPrice;
    return !!originalPrice && !!currentPrice && originalPrice > currentPrice;
  }

  /**
   * Get primary product image
   */
  get productImage(): string {
    return this.product.images?.[0]?.url || '/assets/images/placeholder/product.png';
  }
}
