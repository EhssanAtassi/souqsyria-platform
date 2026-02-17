import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../../../shared/interfaces/product.interface';
import { ProductBoxGridComponent } from '../../../../shared/components/ui/product-box/product-box-grid.component';

/**
 * Empty Cart Component
 *
 * @description Full-page empty cart state with SVG illustration, bilingual CTAs,
 * and a product recommendations section to drive engagement.
 * Uses the Syrian gold theme for the illustration.
 *
 * @swagger
 * components:
 *   schemas:
 *     EmptyCartProps:
 *       type: object
 *       properties:
 *         language:
 *           type: string
 *           enum: [en, ar]
 *           description: Display language
 *         recommendedProducts:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Product'
 *           description: Trending products to show as recommendations
 *
 * @example
 * ```html
 * <app-empty-cart
 *   [language]="'en'"
 *   [recommendedProducts]="products"
 *   (startShopping)="goToProducts()"
 *   (browseCategories)="goToCategories()"
 *   (addToCart)="onAdd($event)">
 * </app-empty-cart>
 * ```
 */
@Component({
  selector: 'app-empty-cart',
  standalone: true,
  imports: [CommonModule, ProductBoxGridComponent],
  templateUrl: './empty-cart.component.html',
  styleUrls: ['./empty-cart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmptyCartComponent {
  /** Display language for i18n */
  @Input() language: 'en' | 'ar' = 'en';

  /** Trending/recommended products for empty cart engagement */
  @Input() recommendedProducts: Product[] = [];

  /** Emitted when user clicks "Start Shopping" */
  @Output() startShopping = new EventEmitter<void>();

  /** Emitted when user clicks "Browse Categories" */
  @Output() browseCategories = new EventEmitter<void>();

  /** Emitted when user adds a recommended product to cart */
  @Output() addToCart = new EventEmitter<Product>();

  /** TrackBy function for recommended products ngFor performance */
  trackByProductId(_index: number, product: Product): string | number {
    return product.id;
  }
}
