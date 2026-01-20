import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Product } from '../../interfaces/product.interface';

/**
 * Sidebar Featured Products Component
 *
 * Displays mini product cards (3 items max) in sidebar sections.
 * Reusable across Homepage, Category pages, and Search results.
 *
 * @description
 * Compact product display optimized for sidebar placement.
 * Shows product image (80x80px), title, and price with Golden Wheat styling.
 * Supports RTL layout and bilingual content.
 *
 * @example
 * ```html
 * <app-sidebar-featured-products
 *   [products]="featuredProducts()"
 *   [title]="'Featured Products'"
 *   [titleAr]="'منتجات مميزة'"
 *   [language]="'ar'"
 *   (productClick)="onProductClick($event)">
 * </app-sidebar-featured-products>
 * ```
 *
 * @swagger
 * components:
 *   schemas:
 *     SidebarFeaturedProductsComponent:
 *       type: object
 *       description: Compact featured products display for sidebars
 *       properties:
 *         products:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Product'
 *           description: Featured products to display (max 3)
 *         title:
 *           type: string
 *           description: Section title in English
 *           default: Featured Products
 *         titleAr:
 *           type: string
 *           description: Section title in Arabic
 *         language:
 *           type: string
 *           enum: [en, ar]
 *           description: Display language
 *           default: en
 *         showPrices:
 *           type: boolean
 *           description: Show product prices
 *           default: true
 *         maxProducts:
 *           type: number
 *           description: Maximum number of products to display
 *           default: 3
 */
@Component({
  selector: 'app-sidebar-featured-products',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './sidebar-featured-products.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,

  styleUrl: './sidebar-featured-products.component.scss'
})
export class SidebarFeaturedProductsComponent {
  /**
   * Featured products to display (limited to maxProducts)
   */
  readonly products = input.required<Product[]>();

  /**
   * Section title in English
   * @default 'Featured Products'
   */
  readonly title = input<string>('Featured Products');

  /**
   * Section title in Arabic
   */
  readonly titleAr = input<string>('منتجات مميزة');

  /**
   * Display language for RTL/LTR support
   * @default 'en'
   */
  readonly language = input<'en' | 'ar'>('en');

  /**
   * Show product prices
   * @default true
   */
  readonly showPrices = input<boolean>(true);

  /**
   * Maximum number of products to display
   * @default 3
   */
  readonly maxProducts = input<number>(3);

  /**
   * Emits when a product is clicked
   */
  readonly productClick = output<Product>();

  /**
   * Get limited products array
   * @returns First N products based on maxProducts input
   */
  getLimitedProducts(): Product[] {
    return this.products().slice(0, this.maxProducts());
  }

  /**
   * Handle product click event
   * @param product - Clicked product
   */
  onProductClick(product: Product): void {
    this.productClick.emit(product);
  }

  /**
   * Get display title based on language
   * @returns Localized title
   */
  getDisplayTitle(): string {
    return this.language() === 'ar' ? this.titleAr() : this.title();
  }

  /**
   * Get product name based on language
   * @param product - Product object
   * @returns Localized product name
   */
  getProductName(product: Product): string {
    return this.language() === 'ar' && product.nameArabic
      ? product.nameArabic
      : product.name;
  }

  /**
   * Get primary product image
   * @param product - Product object
   * @returns Primary image URL or placeholder
   */
  getPrimaryImage(product: Product): string {
    return product.images && product.images.length > 0
      ? product.images[0].url
      : '/assets/images/placeholder-product.svg';
  }

  /**
   * Format price for display
   * @param product - Product object
   * @returns Formatted price string
   */
  formatPrice(product: Product): string {
    const price = product.price.amount;
    const currency = product.price.currency || 'USD';
    return `${price} ${currency}`;
  }

  /**
   * Check if product has discount
   * @param product - Product object
   * @returns True if product has active discount
   */
  hasDiscount(product: Product): boolean {
    return !!product.price.discount && !!product.price.originalPrice;
  }

  /**
   * Get original price if product has discount
   * @param product - Product object
   * @returns Formatted original price or null
   */
  getOriginalPrice(product: Product): string | null {
    if (!this.hasDiscount(product)) return null;
    const originalPrice = product.price.originalPrice!;
    const currency = product.price.currency || 'USD';
    return `${originalPrice} ${currency}`;
  }
}
