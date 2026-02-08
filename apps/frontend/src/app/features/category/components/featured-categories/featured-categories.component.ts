/**
 * Featured Categories Component
 *
 * @description Displays featured categories in responsive grid layout
 * with product counts and hover effects. Supports RTL and loading states.
 *
 * @pattern Dumb Component
 * - Pure presentation component
 * - No service injection
 * - Receives data via inputs
 * - Emits events via outputs
 *
 * @swagger
 * components:
 *   schemas:
 *     FeaturedCategoriesComponent:
 *       type: object
 *       description: Featured categories display component
 *       properties:
 *         categories:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/FeaturedCategory'
 *           description: Array of featured categories to display
 *         isLoading:
 *           type: boolean
 *           description: Loading state for skeleton display
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  signal,
  computed,
  PLATFORM_ID,
  Inject,
  OnInit
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FeaturedCategory } from '../../models/category-tree.interface';

/**
 * Featured Categories Component
 *
 * @description Responsive grid of featured categories with images,
 * product counts, and hover effects. Supports RTL layout.
 *
 * @example
 * ```html
 * <app-featured-categories
 *   [categories]="featuredCategories"
 *   [isLoading]="loading"
 *   (categoryClicked)="onCategoryClick($event)">
 * </app-featured-categories>
 * ```
 *
 * @component
 */
@Component({
  selector: 'app-featured-categories',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './featured-categories.component.html',
  styleUrls: ['./featured-categories.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeaturedCategoriesComponent implements OnInit {
  /**
   * Featured categories to display
   *
   * @input
   */
  @Input() categories: FeaturedCategory[] = [];

  /**
   * Loading state for skeleton display
   *
   * @input
   */
  @Input() isLoading = false;

  /**
   * Event emitted when category is clicked
   *
   * @output
   * @emits {string} categorySlug - Clicked category slug
   */
  @Output() categoryClicked = new EventEmitter<string>();

  /** RTL layout state */
  isRtl = signal<boolean>(false);

  /** Placeholder image for failed loads */
  private readonly placeholderImage = '/assets/images/placeholder-category.png';

  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  /**
   * Initialize component and detect RTL
   *
   * @lifecycle
   */
  ngOnInit(): void {
    this.detectRTL();
  }

  /**
   * Handle category card click
   *
   * @param slug - Category slug
   */
  onCategoryClick(slug: string): void {
    this.categoryClicked.emit(slug);
  }

  /**
   * Handle image load error with fallback
   *
   * @param event - Error event
   */
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = this.placeholderImage;
  }

  /**
   * Get category display name based on locale
   *
   * @param category - Category object
   * @returns Localized category name
   */
  getCategoryName(category: FeaturedCategory): string {
    return this.isRtl() ? category.nameAr : category.name;
  }

  /**
   * Get formatted product count text
   *
   * @param count - Product count
   * @returns Formatted count string
   */
  getProductCountText(count: number): string {
    if (this.isRtl()) {
      return `${count} منتج`;
    }
    return count === 1 ? '1 product' : `${count} products`;
  }

  /**
   * Detect RTL layout from document
   *
   * @private
   */
  private detectRTL(): void {
    if (isPlatformBrowser(this.platformId)) {
      const dir = document.documentElement.getAttribute('dir');
      this.isRtl.set(dir === 'rtl');
    }
  }

  /**
   * Track by function for ngFor optimization
   *
   * @param index - Item index
   * @param item - Category item
   * @returns Unique identifier
   */
  trackByCategory(index: number, item: FeaturedCategory): number {
    return item.id;
  }
}
