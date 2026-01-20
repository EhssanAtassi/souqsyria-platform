import { Component, ChangeDetectionStrategy, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { Product } from '../../../interfaces/product.interface';
import { ProductsService } from '../../../../store/products/products.service';
import { ProductsQuery } from '../../../../store/products/products.query';

/**
 * Theme Product Component
 *
 * Displays products in grid or slider mode
 * Core widget for showing Syrian marketplace products
 *
 * Features:
 * - Grid and slider display modes
 * - Product filtering by IDs or category
 * - Responsive grid layout
 * - Product cards with images, prices, ratings
 * - Discount badges and authenticity indicators
 * - Bilingual support (English/Arabic)
 * - Golden Wheat design system
 * - Integration with ProductService
 *
 * @swagger
 * components:
 *   schemas:
 *     ThemeProductComponent:
 *       type: object
 *       description: Product display widget with grid/slider modes
 *       properties:
 *         products:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Product'
 *           description: Products to display (manual override)
 *         productIds:
 *           type: array
 *           items:
 *             type: string
 *           description: Product IDs to fetch from service
 *         categorySlug:
 *           type: string
 *           description: Category slug to filter products
 *         displayMode:
 *           type: string
 *           enum: [grid, slider]
 *           description: Display layout mode
 *         columns:
 *           type: number
 *           enum: [2, 3, 4, 5]
 *           description: Grid column count
 *         limit:
 *           type: number
 *           description: Maximum products to display
 *
 * @example
 * ```html
 * <app-theme-product
 *   [productIds]="['damascus-steel-knife-001', 'aleppo-soap-premium-002']"
 *   [displayMode]="'grid'"
 *   [columns]="4"
 *   [language]="'en'">
 * </app-theme-product>
 * ```
 */
@Component({
  selector: 'app-theme-product',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule
  ],
  templateUrl: './theme-product.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,

  styleUrls: ['./theme-product.component.scss']
})
export class ThemeProductComponent implements OnInit {
  /**
   * Products to display (can be passed directly)
   */
  @Input() products: Product[] = [];

  /**
   * Product IDs to fetch from ProductService
   */
  @Input() productIds?: string[];

  /**
   * Category slug to filter products
   */
  @Input() categorySlug?: string;

  /**
   * Display mode: 'grid' or 'slider'
   */
  @Input() displayMode: 'grid' | 'slider' = 'grid';

  /**
   * Number of columns for grid layout
   */
  @Input() columns: 2 | 3 | 4 | 5 = 4;

  /**
   * Maximum number of products to display
   */
  @Input() limit?: number;

  /**
   * Current display language
   */
  @Input() language: 'en' | 'ar' = 'en';

  /**
   * Show add to cart button
   */
  @Input() showAddToCart: boolean = true;

  /**
   * Show wishlist button
   */
  @Input() showWishlist: boolean = true;

  /**
   * Signal for loading state
   */
  isLoading = signal<boolean>(false);

  /**
   * Signal for displayed products
   */
  displayedProducts = signal<Product[]>([]);

  constructor(
    private productsService: ProductsService,
    private productsQuery: ProductsQuery
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  /**
   * Loads products based on input configuration
   * Fetches from ProductsService if productIds or categorySlug provided
   */
  private loadProducts(): void {
    // If products are passed directly, use them
    if (this.products.length > 0) {
      this.applyLimitAndSet(this.products);
      return;
    }

    // Otherwise, fetch from service
    this.isLoading.set(true);
    this.productsService.loadProducts();

    let filteredProducts = this.productsQuery.getAll();

    // Filter by product IDs if provided
    if (this.productIds && this.productIds.length > 0) {
      filteredProducts = filteredProducts.filter(p =>
        this.productIds!.includes(p.id) || this.productIds!.includes(p.slug)
      );
    }

    // Filter by category slug if provided
    if (this.categorySlug) {
      filteredProducts = filteredProducts.filter(p =>
        p.category.slug === this.categorySlug
      );
    }

    this.applyLimitAndSet(filteredProducts);
    this.isLoading.set(false);
  }

  /**
   * Applies limit and updates displayed products signal
   */
  private applyLimitAndSet(products: Product[]): void {
    const limited = this.limit ? products.slice(0, this.limit) : products;
    this.displayedProducts.set(limited);
  }

  /**
   * Gets grid column class based on column count
   */
  get gridClass(): string {
    return `theme-product__grid--${this.columns}col`;
  }

  /**
   * Calculates discount percentage for display
   */
  getDiscountPercentage(product: Product): number {
    return product.price.discount?.percentage || 0;
  }

  /**
   * Checks if product has discount
   */
  hasDiscount(product: Product): boolean {
    return !!product.price.discount && product.price.discount.percentage > 0;
  }

  /**
   * Gets product name based on language
   */
  getProductName(product: Product): string {
    return this.language === 'ar' && product.nameArabic
      ? product.nameArabic
      : product.name;
  }

  /**
   * Gets primary product image
   */
  getPrimaryImage(product: Product): string {
    const primary = product.images.find(img => img.isPrimary);
    return primary?.url || product.images[0]?.url || '/assets/placeholder.jpg';
  }

  /**
   * Gets product image alt text
   */
  getImageAlt(product: Product): string {
    const primary = product.images.find(img => img.isPrimary);
    return primary?.alt || this.getProductName(product);
  }

  /**
   * Handles add to cart action
   */
  onAddToCart(product: Product, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    console.log('Add to cart:', product.id);
    // TODO: Implement cart service integration
  }

  /**
   * Handles add to wishlist action
   */
  onAddToWishlist(product: Product, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    console.log('Add to wishlist:', product.id);
    // TODO: Implement wishlist service integration
  }

  /**
   * Generates star array for rating display
   */
  getStarArray(rating: number): boolean[] {
    return Array(5).fill(false).map((_, i) => i < Math.floor(rating));
  }
}
