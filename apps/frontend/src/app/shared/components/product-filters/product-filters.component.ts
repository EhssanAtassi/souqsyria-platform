import { Component, Output, EventEmitter, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSliderModule } from '@angular/material/slider';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatRadioModule } from '@angular/material/radio';
import { MatDividerModule } from '@angular/material/divider';

import { ProductsService } from '../../../store/products/products.service';
import { ProductsQuery } from '../../../store/products/products.query';

/**
 * Product Filters Panel Component - Syrian Marketplace
 *
 * Reusable sidebar filter component for product filtering.
 * Integrates with Akita ProductsService to update global filter state.
 * Features Syrian-specific filters (UNESCO, regional origins).
 *
 * @swagger
 * components:
 *   schemas:
 *     ProductFiltersComponent:
 *       type: object
 *       description: Product filtering sidebar panel
 *       properties:
 *         language:
 *           type: string
 *           enum: [en, ar]
 *           description: Display language
 *         selectedCategories:
 *           type: array
 *           items:
 *             type: string
 *           description: Selected category slugs
 *         priceRange:
 *           type: object
 *           properties:
 *             min:
 *               type: number
 *             max:
 *               type: number
 *         selectedRating:
 *           type: number
 *           description: Minimum rating filter (1-5)
 *         isHeritageOnly:
 *           type: boolean
 *           description: Show only UNESCO heritage products
 *         inStockOnly:
 *           type: boolean
 *           description: Show only in-stock products
 *
 * @example
 * // Usage in template:
 * <app-product-filters
 *   [language]="'en'"
 *   (filtersChange)="onFiltersUpdate()">
 * </app-product-filters>
 */
@Component({
  selector: 'app-product-filters',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatExpansionModule,
    MatCheckboxModule,
    MatSliderModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatRadioModule,
    MatDividerModule
  ],
  templateUrl: './product-filters.component.html',
  styleUrls: ['./product-filters.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductFiltersComponent {
  /**
   * Injected services
   */
  private productsService = inject(ProductsService);
  private productsQuery = inject(ProductsQuery);

  /**
   * Event emitted when filters change
   */
  @Output() filtersChange = new EventEmitter<void>();

  /**
   * Language preference
   */
  language = signal<'en' | 'ar'>('en');

  /**
   * Akita store state
   */
  selectedCategory$ = this.productsQuery.select('selectedCategory');
  priceRange$ = this.productsQuery.select('priceRange');
  isHeritageOnly$ = this.productsQuery.select('isHeritageOnly');
  inStockOnly$ = this.productsQuery.select('inStockOnly');
  sortBy$ = this.productsQuery.select('sortBy');

  /**
   * Local filter state signals
   */
  minPrice = signal(0);
  maxPrice = signal(1000);
  selectedRating = signal(0);

  /**
   * Available categories with Syrian marketplace focus
   */
  categories = [
    { slug: 'damascus-steel', name: 'Damascus Steel', nameArabic: 'الفولاذ الدمشقي', icon: 'content_cut' },
    { slug: 'beauty-wellness', name: 'Beauty & Wellness', nameArabic: 'الجمال والعافية', icon: 'spa' },
    { slug: 'textiles-fabrics', name: 'Textiles & Fabrics', nameArabic: 'المنسوجات والأقمشة', icon: 'checkroom' },
    { slug: 'food-spices', name: 'Food & Spices', nameArabic: 'الطعام والتوابل', icon: 'restaurant' },
    { slug: 'traditional-crafts', name: 'Traditional Crafts', nameArabic: 'الحرف التقليدية', icon: 'palette' },
    { slug: 'jewelry-accessories', name: 'Jewelry & Accessories', nameArabic: 'المجوهرات', icon: 'diamond' },
    { slug: 'nuts-snacks', name: 'Nuts & Snacks', nameArabic: 'المكسرات', icon: 'egg_alt' },
    { slug: 'sweets-desserts', name: 'Sweets & Desserts', nameArabic: 'الحلويات', icon: 'cake' }
  ];

  /**
   * Syrian regional origins
   */
  regions = [
    { value: 'Damascus', label: 'Damascus', labelArabic: 'دمشق' },
    { value: 'Aleppo', label: 'Aleppo', labelArabic: 'حلب' },
    { value: 'Homs', label: 'Homs', labelArabic: 'حمص' },
    { value: 'Latakia', label: 'Latakia', labelArabic: 'اللاذقية' },
    { value: 'Palmyra', label: 'Palmyra', labelArabic: 'تدمر' }
  ];

  /**
   * Rating options
   */
  ratings = [
    { value: 4, label: '4 Stars & Up', labelArabic: '4 نجوم وأكثر', stars: 4 },
    { value: 3, label: '3 Stars & Up', labelArabic: '3 نجوم وأكثر', stars: 3 },
    { value: 2, label: '2 Stars & Up', labelArabic: '2 نجوم وأكثر', stars: 2 },
    { value: 1, label: '1 Star & Up', labelArabic: 'نجمة واحدة وأكثر', stars: 1 }
  ];

  /**
   * Active filters count
   */
  activeFiltersCount = computed(() => {
    let count = 0;
    // Count will be calculated based on Akita store state
    return count;
  });

  constructor() {
    // Load language preference
    const savedLanguage = localStorage.getItem('language') as 'en' | 'ar';
    if (savedLanguage) {
      this.language.set(savedLanguage);
    }
  }

  /**
   * Toggle category filter
   *
   * @param categorySlug - Category slug to toggle
   */
  toggleCategory(categorySlug: string): void {
    this.productsService.setCategory(categorySlug);
    this.filtersChange.emit();
  }

  /**
   * Update price range filter
   *
   * @param min - Minimum price
   * @param max - Maximum price
   */
  updatePriceRange(min: number, max: number): void {
    this.minPrice.set(min);
    this.maxPrice.set(max);
    this.productsService.setPriceRange(min, max);
    this.filtersChange.emit();
  }

  /**
   * Update rating filter
   *
   * @param rating - Minimum rating
   */
  updateRating(rating: number): void {
    this.selectedRating.set(rating);
    // TODO: Add rating filter to ProductsService
    this.filtersChange.emit();
  }

  /**
   * Toggle heritage/UNESCO filter
   *
   * @param enabled - Whether to show only heritage products
   */
  toggleHeritageFilter(enabled: boolean): void {
    this.productsService.setHeritageOnly(enabled);
    this.filtersChange.emit();
  }

  /**
   * Toggle in-stock filter
   *
   * @param enabled - Whether to show only in-stock products
   */
  toggleInStockFilter(enabled: boolean): void {
    this.productsService.setInStockOnly(enabled);
    this.filtersChange.emit();
  }

  /**
   * Clear all filters
   */
  clearAllFilters(): void {
    this.productsService.resetFilters();
    this.minPrice.set(0);
    this.maxPrice.set(1000);
    this.selectedRating.set(0);
    this.filtersChange.emit();
  }

  /**
   * Format price for display
   *
   * @param value - Price value
   * @returns Formatted price string
   */
  formatPrice(value: number): string {
    return `$${value}`;
  }

  /**
   * Get star array for rating display
   *
   * @param count - Number of stars
   * @returns Array of star indices
   */
  getStarArray(count: number): number[] {
    return Array(count).fill(0).map((_, i) => i);
  }

  /**
   * Check if category is selected
   *
   * @param categorySlug - Category slug
   * @returns True if selected
   */
  isCategorySelected(categorySlug: string): boolean {
    const selected = this.productsQuery.getValue().selectedCategory;
    return selected === categorySlug;
  }

  /**
   * Get category name based on language
   *
   * @param category - Category object
   * @returns Localized category name
   */
  getCategoryName(category: { name: string; nameArabic: string }): string {
    return this.language() === 'ar' ? category.nameArabic : category.name;
  }

  /**
   * Get region label based on language
   *
   * @param region - Region object
   * @returns Localized region label
   */
  getRegionLabel(region: { label: string; labelArabic: string }): string {
    return this.language() === 'ar' ? region.labelArabic : region.label;
  }

  /**
   * Get rating label based on language
   *
   * @param rating - Rating object
   * @returns Localized rating label
   */
  getRatingLabel(rating: { label: string; labelArabic: string }): string {
    return this.language() === 'ar' ? rating.labelArabic : rating.label;
  }
}
