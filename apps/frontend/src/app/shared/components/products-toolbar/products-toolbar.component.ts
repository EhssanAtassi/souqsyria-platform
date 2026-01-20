import { Component, ChangeDetectionStrategy, input, output, signal, ElementRef, HostListener, AfterViewInit, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';

/**
 * Sort option type for product sorting
 */
export type SortOption = 'price-asc' | 'price-desc' | 'rating' | 'newest' | 'popular';

/**
 * View mode type for product display
 */
export type ViewMode = 'grid' | 'list';

/**
 * Sort option interface with labels
 */
export interface SortOptionConfig {
  value: SortOption;
  label: string;
  labelAr: string;
  icon?: string;
}

/**
 * Products Toolbar Component
 *
 * Provides product sorting, view mode toggle, and results count display.
 * Includes responsive design with mobile filter toggle button.
 * Supports RTL layout and bilingual labels.
 *
 * @description
 * This toolbar appears above the product grid and provides:
 * - Sort dropdown with multiple sorting options (price, rating, newest, etc.)
 * - View mode toggle between grid and list views
 * - Product count display ("Showing X products")
 * - Mobile filter toggle button (shows on mobile only)
 * - Golden Wheat design system integration
 *
 * @example
 * ```html
 * <app-products-toolbar
 *   [totalProducts]="150"
 *   [currentSort]="'popular'"
 *   [currentView]="'grid'"
 *   [language]="'en'"
 *   (sortChange)="onSortChange($event)"
 *   (viewChange)="onViewChange($event)"
 *   (toggleFilters)="onToggleFilters()">
 * </app-products-toolbar>
 * ```
 *
 * @swagger
 * components:
 *   schemas:
 *     ProductsToolbarComponent:
 *       type: object
 *       description: Product listing toolbar with sorting and view controls
 *       properties:
 *         totalProducts:
 *           type: number
 *           description: Total number of products in current view
 *         currentSort:
 *           type: string
 *           enum: [price-asc, price-desc, rating, newest, popular]
 *         currentView:
 *           type: string
 *           enum: [grid, list]
 *         language:
 *           type: string
 *           enum: [en, ar]
 */
@Component({
  selector: 'app-products-toolbar',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatButtonToggleModule,
    MatTooltipModule
  ],
  templateUrl: './products-toolbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,

  styleUrl: './products-toolbar.component.scss'
})
export class ProductsToolbarComponent implements AfterViewInit {
  /**
   * Signal tracking if toolbar is stuck to top
   */
  readonly isStuck = signal<boolean>(false);

  /**
   * Initial offset top position of toolbar
   */
  private initialOffsetTop: number = 0;
  /**
   * Total number of products being displayed
   * @default 0
   */
  readonly totalProducts = input<number>(0);

  /**
   * Currently active sort option
   * @default 'popular'
   */
  readonly currentSort = input<SortOption>('popular');

  /**
   * Current view mode (grid or list)
   * @default 'grid'
   */
  readonly currentView = input<ViewMode>('grid');

  /**
   * Display language for translations
   * @default 'en'
   */
  readonly language = input<'en' | 'ar'>('en');

  /**
   * Whether to show the mobile filter toggle button
   * @default true
   */
  readonly showFilterToggle = input<boolean>(true);

  /**
   * Emits when sort option changes
   */
  readonly sortChange = output<SortOption>();

  /**
   * Emits when view mode changes
   */
  readonly viewChange = output<ViewMode>();

  /**
   * Emits when filter toggle is clicked (mobile only)
   */
  readonly toggleFilters = output<void>();

  /**
   * Available sort options with translations
   */
  readonly sortOptions: SortOptionConfig[] = [
    {
      value: 'popular',
      label: 'Most Popular',
      labelAr: 'الأكثر شعبية',
      icon: 'trending_up'
    },
    {
      value: 'newest',
      label: 'Newest First',
      labelAr: 'الأحدث أولاً',
      icon: 'fiber_new'
    },
    {
      value: 'rating',
      label: 'Highest Rated',
      labelAr: 'الأعلى تقييماً',
      icon: 'star'
    },
    {
      value: 'price-asc',
      label: 'Price: Low to High',
      labelAr: 'السعر: من الأقل للأعلى',
      icon: 'arrow_upward'
    },
    {
      value: 'price-desc',
      label: 'Price: High to Low',
      labelAr: 'السعر: من الأعلى للأقل',
      icon: 'arrow_downward'
    }
  ];

  /**
   * Handles sort selection change
   * @param value - Selected sort option
   */
  onSortChange(value: SortOption): void {
    this.sortChange.emit(value);
  }

  /**
   * Handles view mode toggle
   * @param mode - Selected view mode
   */
  onViewModeChange(mode: ViewMode): void {
    if (mode !== this.currentView()) {
      this.viewChange.emit(mode);
    }
  }

  /**
   * Handles filter toggle button click
   */
  onFilterToggle(): void {
    this.toggleFilters.emit();
  }

  /**
   * Gets translated label for sort option
   * @param option - Sort option config
   * @returns Localized label
   */
  getSortLabel(option: SortOptionConfig): string {
    return this.language() === 'ar' ? option.labelAr : option.label;
  }

  /**
   * Gets currently selected sort option config
   * @returns Current sort option configuration
   */
  getCurrentSortOption(): SortOptionConfig {
    return this.sortOptions.find(opt => opt.value === this.currentSort()) || this.sortOptions[0];
  }

  /**
   * Formats product count text with proper localization
   * @returns Formatted product count string
   */
  getProductCountText(): string {
    const count = this.totalProducts();
    const lang = this.language();

    if (lang === 'ar') {
      const formattedCount = count.toLocaleString('ar-SY');
      return count === 1
        ? `عرض منتج واحد`
        : `عرض ${formattedCount} منتج`;
    }

    return count === 1
      ? `Showing 1 product`
      : `Showing ${count.toLocaleString('en-US')} products`;
  }

  /**
   * Gets tooltip text for grid view button
   * @returns Localized tooltip text
   */
  getGridViewTooltip(): string {
    return this.language() === 'ar' ? 'عرض شبكي' : 'Grid View';
  }

  /**
   * Gets tooltip text for list view button
   * @returns Localized tooltip text
   */
  getListViewTooltip(): string {
    return this.language() === 'ar' ? 'عرض قائمة' : 'List View';
  }

  /**
   * Gets label for filter button
   * @returns Localized filter button text
   */
  getFilterButtonLabel(): string {
    return this.language() === 'ar' ? 'التصفية' : 'Filters';
  }

  /**
   * Constructor
   * @param elementRef - Reference to toolbar element for sticky detection
   */
  constructor(private elementRef: ElementRef) {}

  /**
   * After view initialization - capture initial position
   */
  ngAfterViewInit(): void {
    // Small delay to ensure DOM is fully rendered
    setTimeout(() => {
      this.initialOffsetTop = this.elementRef.nativeElement.offsetTop;
    }, 100);
  }

  /**
   * Listen to window scroll events to detect sticky state
   * @param event - Scroll event
   */
  @HostListener('window:scroll', ['$event'])
  onWindowScroll(): void {
    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
    this.isStuck.set(currentScroll >= this.initialOffsetTop);
  }

}
