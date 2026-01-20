import { Component, ChangeDetectionStrategy, input, output, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { PriceRangeFilterComponent } from './price-range-filter/price-range-filter.component';
import { RatingFilterComponent } from './rating-filter/rating-filter.component';
import { AuthenticityFilterComponent } from './authenticity-filter/authenticity-filter.component';
import { MatCheckboxModule } from '@angular/material/checkbox';

/**
 * Filter State Interface
 * Represents all possible filter criteria for product browsing
 *
 * @swagger
 * components:
 *   schemas:
 *     FilterState:
 *       type: object
 *       description: Complete filter state for product browsing
 *       properties:
 *         priceRange:
 *           type: object
 *           properties:
 *             min:
 *               type: number
 *             max:
 *               type: number
 *         ratings:
 *           type: array
 *           items:
 *             type: number
 *         authenticity:
 *           type: object
 *           properties:
 *             unesco:
 *               type: boolean
 *             handmade:
 *               type: boolean
 *             regional:
 *               type: boolean
 *         availability:
 *           type: object
 *           properties:
 *             inStock:
 *               type: boolean
 *             outOfStock:
 *               type: boolean
 *         regions:
 *           type: array
 *           items:
 *             type: string
 */
export interface FilterState {
  priceRange?: { min: number; max: number };
  ratings?: number[];
  authenticity?: {
    unesco?: boolean;
    handmade?: boolean;
    regional?: boolean;
  };
  availability?: {
    inStock?: boolean;
    outOfStock?: boolean;
  };
  regions?: string[];
}

/**
 * Filter Sidebar Component
 *
 * Provides comprehensive filtering options for Syrian marketplace products.
 * Supports price range, ratings, authenticity, availability, and regional filters.
 * Fully responsive with mobile drawer support and RTL language compatibility.
 *
 * @description
 * This component manages all product filtering state and emits changes to parent.
 * Uses Angular Material expansion panels for organized filter sections.
 * Integrates Golden Wheat design system and Syrian cultural elements.
 *
 * @example
 * ```html
 * <app-filter-sidebar
 *   [language]="'en'"
 *   [category]="currentCategory"
 *   [initialFilters]="filters"
 *   (filtersChange)="onFiltersChange($event)"
 *   (clearFilters)="onClearFilters()">
 * </app-filter-sidebar>
 * ```
 *
 * @swagger
 * components:
 *   schemas:
 *     FilterSidebarComponent:
 *       type: object
 *       description: Sidebar filter component for product browsing
 *       properties:
 *         language:
 *           type: string
 *           enum: [en, ar]
 *         category:
 *           $ref: '#/components/schemas/Category'
 *         initialFilters:
 *           $ref: '#/components/schemas/FilterState'
 */
@Component({
  selector: 'app-filter-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    MatDividerModule,
    MatCheckboxModule,
    PriceRangeFilterComponent,
    RatingFilterComponent,
    AuthenticityFilterComponent
  ],
  templateUrl: './filter-sidebar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,

  styleUrl: './filter-sidebar.component.scss'
})
export class FilterSidebarComponent {
  /**
   * Display language for RTL/LTR support
   * @default 'en'
   */
  readonly language = input<'en' | 'ar'>('en');

  /**
   * Current category being browsed
   * Used to show category-specific filters
   */
  readonly category = input<any | null>(null);

  /**
   * Initial filter state from URL or saved preferences
   * @default {}
   */
  readonly initialFilters = input<FilterState>({});

  /**
   * Emits when filters change
   * Parent component should update products based on new filters
   */
  readonly filtersChange = output<FilterState>();

  /**
   * Emits when clear all filters is clicked
   * Parent component should reset all filters
   */
  readonly clearFilters = output<void>();

  /**
   * Current filter state
   * Reactive signal that tracks all active filters
   */
  currentFilters = signal<FilterState>({});

  /**
   * Syrian regions for location filtering
   * Represents all Syrian governorates
   */
  readonly syrianRegions = [
    { value: 'damascus', label: 'Damascus', labelAr: 'دمشق' },
    { value: 'aleppo', label: 'Aleppo', labelAr: 'حلب' },
    { value: 'homs', label: 'Homs', labelAr: 'حمص' },
    { value: 'hama', label: 'Hama', labelAr: 'حماة' },
    { value: 'lattakia', label: 'Lattakia', labelAr: 'اللاذقية' },
    { value: 'tartus', label: 'Tartus', labelAr: 'طرطوس' },
    { value: 'daraa', label: 'Daraa', labelAr: 'درعا' },
    { value: 'deir-ez-zor', label: 'Deir ez-Zor', labelAr: 'دير الزور' }
  ];

  /**
   * Availability options for filtering
   */
  readonly availabilityOptions = [
    { value: 'inStock', label: 'In Stock', labelAr: 'متوفر' },
    { value: 'outOfStock', label: 'Out of Stock', labelAr: 'غير متوفر' }
  ];

  /**
   * Computed property to check if any filters are active
   * Used to show/hide "Clear All" button
   */
  hasActiveFilters = computed(() => {
    const filters = this.currentFilters();
    return !!(
      filters.priceRange ||
      (filters.ratings && filters.ratings.length > 0) ||
      (filters.authenticity && (filters.authenticity.unesco || filters.authenticity.handmade || filters.authenticity.regional)) ||
      (filters.availability && (filters.availability.inStock || filters.availability.outOfStock)) ||
      (filters.regions && filters.regions.length > 0)
    );
  });

  /**
   * Active filter count for display
   */
  activeFilterCount = computed(() => {
    let count = 0;
    const filters = this.currentFilters();

    if (filters.priceRange) count++;
    if (filters.ratings && filters.ratings.length > 0) count += filters.ratings.length;
    if (filters.authenticity?.unesco) count++;
    if (filters.authenticity?.handmade) count++;
    if (filters.authenticity?.regional) count++;
    if (filters.availability?.inStock) count++;
    if (filters.availability?.outOfStock) count++;
    if (filters.regions && filters.regions.length > 0) count += filters.regions.length;

    return count;
  });

  constructor() {
    // Initialize filters from input when component loads
    effect(() => {
      const initial = this.initialFilters();
      if (initial && Object.keys(initial).length > 0) {
        this.currentFilters.set(initial);
      }
    });
  }

  /**
   * Handles price range change from price filter component
   * @param range - New price range { min, max }
   */
  onPriceChange(range: { min: number; max: number }): void {
    this.currentFilters.update(filters => ({
      ...filters,
      priceRange: range
    }));
    this.emitFilters();
  }

  /**
   * Handles rating selection change from rating filter component
   * @param ratings - Array of selected rating values
   */
  onRatingChange(ratings: number[]): void {
    this.currentFilters.update(filters => ({
      ...filters,
      ratings: ratings.length > 0 ? ratings : undefined
    }));
    this.emitFilters();
  }

  /**
   * Handles authenticity filter change from authenticity filter component
   * @param authenticity - Authenticity filter state
   */
  onAuthenticityChange(authenticity: { unesco?: boolean; handmade?: boolean; regional?: boolean }): void {
    this.currentFilters.update(filters => ({
      ...filters,
      authenticity: authenticity
    }));
    this.emitFilters();
  }

  /**
   * Handles availability checkbox change
   * @param type - 'inStock' or 'outOfStock'
   */
  onAvailabilityChange(type: 'inStock' | 'outOfStock', checked: boolean): void {
    this.currentFilters.update(filters => ({
      ...filters,
      availability: {
        ...filters.availability,
        [type]: checked
      }
    }));
    this.emitFilters();
  }

  /**
   * Handles region checkbox change
   * @param region - Region value to toggle
   */
  onRegionChange(region: string, checked: boolean): void {
    this.currentFilters.update(filters => {
      const regions = filters.regions || [];
      const newRegions = checked
        ? [...regions, region]
        : regions.filter(r => r !== region);

      return {
        ...filters,
        regions: newRegions.length > 0 ? newRegions : undefined
      };
    });
    this.emitFilters();
  }

  /**
   * Checks if region is selected
   * @param region - Region to check
   * @returns true if region is selected
   */
  isRegionSelected(region: string): boolean {
    return this.currentFilters().regions?.includes(region) || false;
  }

  /**
   * Checks if availability option is selected
   * @param type - Availability type to check
   * @returns true if option is selected
   */
  isAvailabilitySelected(type: 'inStock' | 'outOfStock'): boolean {
    return this.currentFilters().availability?.[type] || false;
  }

  /**
   * Clears all active filters
   * Resets filter state and emits clear event
   */
  clearAll(): void {
    this.currentFilters.set({});
    this.clearFilters.emit();
  }

  /**
   * Emits current filter state to parent component
   * Debounced to prevent excessive updates
   */
  private emitFilters(): void {
    this.filtersChange.emit(this.currentFilters());
  }

  /**
   * Gets translated label for current language
   * @param label - English label
   * @param labelAr - Arabic label
   * @returns Appropriate label based on current language
   */
  getLabel(label: string, labelAr: string): string {
    return this.language() === 'ar' ? labelAr : label;
  }
}
