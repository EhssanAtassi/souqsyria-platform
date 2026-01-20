import {
  Component,
  OnInit,
  signal,
  computed,
  inject,
  output,
  input
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSliderModule } from '@angular/material/slider';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { SearchFilters } from '../../interfaces/search.interface';
import { SyrianCategoriesService } from '../../services/syrian-categories.service';

/**
 * Enhanced Filter Sidebar Component
 *
 * Comprehensive filtering system with:
 * - Dynamic price range slider
 * - Multi-select category filters
 * - Brand/Artisan filters
 * - Star rating filters
 * - Availability filters (in stock, pre-order)
 * - Syrian-specific filters:
 *   - UNESCO Heritage items
 *   - Authenticity certified
 *   - Regional specialties (Damascus, Aleppo, etc.)
 * - Active filters display with chips
 * - Clear all filters option
 * - Filter count badges
 * - Mobile: Bottom sheet integration ready
 *
 * UX Features:
 * - Expandable filter sections
 * - Visual feedback for active filters
 * - Filter count indicators
 * - Reset individual filter groups
 * - Smooth animations
 * - Responsive design
 *
 * @example
 * ```html
 * <app-enhanced-filter-sidebar
 *   [minPrice]="0"
 *   [maxPrice]="1000"
 *   (filtersChange)="handleFiltersChange($event)">
 * </app-enhanced-filter-sidebar>
 * ```
 */
@Component({
  selector: 'app-enhanced-filter-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatExpansionModule,
    MatCheckboxModule,
    MatSliderModule,
    MatRadioModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatBadgeModule
  ],
  templateUrl: './enhanced-filter-sidebar.component.html',
  styleUrls: ['./enhanced-filter-sidebar.component.scss']
})
export class EnhancedFilterSidebarComponent implements OnInit {
  private categoriesService = inject(SyrianCategoriesService);

  // Inputs
  readonly minPrice = input<number>(0);
  readonly maxPrice = input<number>(1000);
  readonly showMobileView = input<boolean>(false);

  // Outputs
  readonly filtersChange = output<SearchFilters>();
  readonly closePanel = output<void>();

  // Filter state signals
  readonly selectedCategories = signal<string[]>([]);
  readonly priceRange = signal<{ min: number; max: number }>({ min: 0, max: 1000 });
  readonly selectedRating = signal<number | null>(null);
  readonly inStockOnly = signal<boolean>(false);
  readonly unescoOnly = signal<boolean>(false);
  readonly certifiedOnly = signal<boolean>(false);
  readonly selectedRegions = signal<string[]>([]);
  readonly selectedBrands = signal<string[]>([]);

  // Expansion panel states
  readonly categoryExpanded = signal<boolean>(true);
  readonly priceExpanded = signal<boolean>(true);
  readonly ratingExpanded = signal<boolean>(true);
  readonly syrianFiltersExpanded = signal<boolean>(true);
  readonly availabilityExpanded = signal<boolean>(false);
  readonly regionExpanded = signal<boolean>(false);

  // Data
  readonly categories = signal<any[]>([]);
  readonly brands = signal<string[]>([]);
  readonly syrianRegions = signal<any[]>([]);

  // Computed
  readonly activeFiltersCount = computed(() => {
    let count = 0;
    if (this.selectedCategories().length > 0) count += this.selectedCategories().length;
    if (this.priceRange().min > this.minPrice() || this.priceRange().max < this.maxPrice()) count++;
    if (this.selectedRating() !== null) count++;
    if (this.inStockOnly()) count++;
    if (this.unescoOnly()) count++;
    if (this.certifiedOnly()) count++;
    if (this.selectedRegions().length > 0) count += this.selectedRegions().length;
    if (this.selectedBrands().length > 0) count += this.selectedBrands().length;
    return count;
  });

  readonly hasActiveFilters = computed(() => this.activeFiltersCount() > 0);

  // Rating options
  readonly ratingOptions = [
    { value: 5, label: '5 Stars', icon: '★★★★★' },
    { value: 4, label: '4 Stars & Up', icon: '★★★★☆' },
    { value: 3, label: '3 Stars & Up', icon: '★★★☆☆' },
    { value: 2, label: '2 Stars & Up', icon: '★★☆☆☆' },
    { value: 1, label: '1 Star & Up', icon: '★☆☆☆☆' }
  ];

  ngOnInit(): void {
    this.loadFilterData();
    this.initializePriceRange();
  }

  /**
   * Load filter data (categories, brands, regions)
   */
  private loadFilterData(): void {
    // Load categories
    this.categoriesService.getCategories().subscribe(cats => {
      this.categories.set(cats);
    });

    // Mock brands (in production, load from API)
    this.brands.set([
      'Damascus Heritage Crafts',
      'Aleppo Artisans',
      'Syrian Traditions',
      'Heritage Makers',
      'Traditional Souq'
    ]);

    // Syrian regions
    this.syrianRegions.set([
      { code: 'damascus', name: 'Damascus', nameAr: 'دمشق' },
      { code: 'aleppo', name: 'Aleppo', nameAr: 'حلب' },
      { code: 'homs', name: 'Homs', nameAr: 'حمص' },
      { code: 'hama', name: 'Hama', nameAr: 'حماة' },
      { code: 'latakia', name: 'Latakia', nameAr: 'اللاذقية' },
      { code: 'tartus', name: 'Tartus', nameAr: 'طرطوس' },
      { code: 'deir-ez-zor', name: 'Deir ez-Zor', nameAr: 'دير الزور' }
    ]);
  }

  /**
   * Initialize price range from inputs
   */
  private initializePriceRange(): void {
    this.priceRange.set({
      min: this.minPrice(),
      max: this.maxPrice()
    });
  }

  /**
   * Toggle category selection
   */
  toggleCategory(categorySlug: string): void {
    const current = this.selectedCategories();
    if (current.includes(categorySlug)) {
      this.selectedCategories.set(current.filter(c => c !== categorySlug));
    } else {
      this.selectedCategories.set([...current, categorySlug]);
    }
    this.emitFilters();
  }

  /**
   * Toggle brand selection
   */
  toggleBrand(brand: string): void {
    const current = this.selectedBrands();
    if (current.includes(brand)) {
      this.selectedBrands.set(current.filter(b => b !== brand));
    } else {
      this.selectedBrands.set([...current, brand]);
    }
    this.emitFilters();
  }

  /**
   * Toggle region selection
   */
  toggleRegion(regionCode: string): void {
    const current = this.selectedRegions();
    if (current.includes(regionCode)) {
      this.selectedRegions.set(current.filter(r => r !== regionCode));
    } else {
      this.selectedRegions.set([...current, regionCode]);
    }
    this.emitFilters();
  }

  /**
   * Update price range
   */
  onPriceChange(type: 'min' | 'max', value: number): void {
    const current = this.priceRange();
    if (type === 'min') {
      this.priceRange.set({ ...current, min: value });
    } else {
      this.priceRange.set({ ...current, max: value });
    }
    this.emitFilters();
  }

  /**
   * Select rating filter
   */
  selectRating(rating: number): void {
    this.selectedRating.set(rating);
    this.emitFilters();
  }

  /**
   * Clear rating filter
   */
  clearRating(): void {
    this.selectedRating.set(null);
    this.emitFilters();
  }

  /**
   * Toggle in stock filter
   */
  toggleInStock(): void {
    this.inStockOnly.set(!this.inStockOnly());
    this.emitFilters();
  }

  /**
   * Toggle UNESCO filter
   */
  toggleUNESCO(): void {
    this.unescoOnly.set(!this.unescoOnly());
    this.emitFilters();
  }

  /**
   * Toggle certified filter
   */
  toggleCertified(): void {
    this.certifiedOnly.set(!this.certifiedOnly());
    this.emitFilters();
  }

  /**
   * Clear all filters
   */
  clearAllFilters(): void {
    this.selectedCategories.set([]);
    this.priceRange.set({ min: this.minPrice(), max: this.maxPrice() });
    this.selectedRating.set(null);
    this.inStockOnly.set(false);
    this.unescoOnly.set(false);
    this.certifiedOnly.set(false);
    this.selectedRegions.set([]);
    this.selectedBrands.set([]);
    this.emitFilters();
  }

  /**
   * Clear category filters
   */
  clearCategories(): void {
    this.selectedCategories.set([]);
    this.emitFilters();
  }

  /**
   * Clear price filter
   */
  clearPriceRange(): void {
    this.priceRange.set({ min: this.minPrice(), max: this.maxPrice() });
    this.emitFilters();
  }

  /**
   * Clear region filters
   */
  clearRegions(): void {
    this.selectedRegions.set([]);
    this.emitFilters();
  }

  /**
   * Clear brand filters
   */
  clearBrands(): void {
    this.selectedBrands.set([]);
    this.emitFilters();
  }

  /**
   * Emit filter changes
   */
  private emitFilters(): void {
    const filters: SearchFilters = {
      category: this.selectedCategories().length === 1 ? this.selectedCategories()[0] : undefined,
      priceRange: {
        min: this.priceRange().min,
        max: this.priceRange().max
      },
      minRating: this.selectedRating() || undefined,
      inStockOnly: this.inStockOnly(),
      unescoOnly: this.unescoOnly(),
      certifiedOnly: this.certifiedOnly(),
      region: this.selectedRegions().length === 1 ? this.selectedRegions()[0] : undefined,
      brands: this.selectedBrands().length > 0 ? this.selectedBrands() : undefined
    };

    this.filtersChange.emit(filters);
  }

  /**
   * Close mobile filter panel
   */
  onClose(): void {
    this.closePanel.emit();
  }

  /**
   * Format price for display
   */
  formatPrice(value: number): string {
    return `$${value}`;
  }

  /**
   * Check if category is selected
   */
  isCategorySelected(slug: string): boolean {
    return this.selectedCategories().includes(slug);
  }

  /**
   * Check if brand is selected
   */
  isBrandSelected(brand: string): boolean {
    return this.selectedBrands().includes(brand);
  }

  /**
   * Check if region is selected
   */
  isRegionSelected(code: string): boolean {
    return this.selectedRegions().includes(code);
  }

  /**
   * Get rating stars display
   */
  getRatingStars(rating: number): string {
    const filled = '★'.repeat(rating);
    const empty = '☆'.repeat(5 - rating);
    return filled + empty;
  }
}
