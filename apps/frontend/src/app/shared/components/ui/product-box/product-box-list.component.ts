import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Product } from '../../../../core/models/product.interface';
import { BadgeComponent } from '../badge/badge.component';

/**
 * Product Box List Component
 *
 * Horizontal card layout for product display in list view.
 * Features compact design with image on left and info on right.
 *
 * @swagger
 * components:
 *   schemas:
 *     ProductBoxListComponent:
 *       type: object
 *       description: Horizontal product card for list layout
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
 *
 * @example
 * ```html
 * <app-product-box-list
 *   [product]="product"
 *   [language]="currentLang"
 *   (addToCart)="onAddToCart($event)"
 *   (addToWishlist)="onAddToWishlist($event)">
 * </app-product-box-list>
 * ```
 */
@Component({
  selector: 'app-product-box-list',
  standalone: true,
  imports: [CommonModule, RouterModule, BadgeComponent],
  templateUrl: './product-box-list.component.html',
  styleUrls: ['./product-box-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductBoxListComponent {
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
   * Get product name based on language
   */
  get productName(): string {
    return this.language === 'ar' && this.product.nameArabic
      ? this.product.nameArabic
      : this.product.name;
  }

  /**
   * Get product description based on language
   */
  get productDescription(): string {
    const desc = this.language === 'ar' && this.product.descriptionArabic
      ? this.product.descriptionArabic
      : this.product.description;

    // Truncate to 150 characters
    return desc.length > 150 ? desc.substring(0, 150) + '...' : desc;
  }

  /**
   * Calculate discount percentage if on sale
   */
  get discountPercentage(): number | null {
    if (this.product.salePrice && this.product.price > this.product.salePrice) {
      return Math.round(((this.product.price - this.product.salePrice) / this.product.price) * 100);
    }
    return null;
  }

  /**
   * Get display price (sale price if available, otherwise regular price)
   */
  get displayPrice(): number {
    return this.product.salePrice || this.product.price;
  }

  /**
   * Check if product is on sale
   */
  get isOnSale(): boolean {
    return !!this.product.salePrice && this.product.salePrice < this.product.price;
  }

  /**
   * Get primary product image
   */
  get productImage(): string {
    return this.product.images?.[0] || '/assets/images/placeholder/product.png';
  }
}
