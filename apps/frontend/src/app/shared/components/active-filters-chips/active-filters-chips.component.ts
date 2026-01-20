import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

/**
 * Active filter chip interface
 */
export interface FilterChip {
  key: string;
  label: string;
  labelAr: string;
  value: any;
  type: 'price' | 'rating' | 'authenticity' | 'availability' | 'region';
}

/**
 * Filter state for chip generation
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
 * Active Filters Chips Component
 *
 * Displays currently active filters as removable chips.
 * Shows above product grid to provide visual feedback of applied filters.
 * Each chip can be individually removed or all cleared at once.
 *
 * @description
 * Converts filter state into user-friendly chip labels.
 * Supports all filter types: price, rating, authenticity, availability, regions.
 * Provides "Clear All" button when multiple filters are active.
 * Uses Golden Wheat design with proper RTL support.
 *
 * @example
 * ```html
 * <app-active-filters-chips
 *   [filters]="currentFilters"
 *   [language]="'en'"
 *   (removeFilter)="onRemoveFilter($event)"
 *   (clearAll)="onClearFilters()">
 * </app-active-filters-chips>
 * ```
 *
 * @swagger
 * components:
 *   schemas:
 *     ActiveFiltersChipsComponent:
 *       type: object
 *       description: Active filter chips display component
 *       properties:
 *         filters:
 *           $ref: '#/components/schemas/FilterState'
 *         language:
 *           type: string
 *           enum: [en, ar]
 */
@Component({
  selector: 'app-active-filters-chips',
  standalone: true,
  imports: [
    CommonModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './active-filters-chips.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,

  styleUrl: './active-filters-chips.component.scss'
})
export class ActiveFiltersChipsComponent {
  /**
   * Current filter state
   * @default {}
   */
  readonly filters = input<FilterState>({});

  /**
   * Display language for translations
   * @default 'en'
   */
  readonly language = input<'en' | 'ar'>('en');

  /**
   * Emits when a specific filter chip is removed
   * Provides the filter key to remove
   */
  readonly removeFilter = output<string>();

  /**
   * Emits when "Clear All" is clicked
   */
  readonly clearAll = output<void>();

  /**
   * Syrian region labels for display
   */
  private readonly regionLabels: { [key: string]: { en: string; ar: string } } = {
    'damascus': { en: 'Damascus', ar: 'دمشق' },
    'aleppo': { en: 'Aleppo', ar: 'حلب' },
    'homs': { en: 'Homs', ar: 'حمص' },
    'hama': { en: 'Hama', ar: 'حماة' },
    'lattakia': { en: 'Lattakia', ar: 'اللاذقية' },
    'tartus': { en: 'Tartus', ar: 'طرطوس' },
    'daraa': { en: 'Daraa', ar: 'درعا' },
    'deir-ez-zor': { en: 'Deir ez-Zor', ar: 'دير الزور' }
  };

  /**
   * Computed array of filter chips to display
   */
  filterChips = computed<FilterChip[]>(() => {
    const chips: FilterChip[] = [];
    const filterState = this.filters();

    // Price Range Chip
    if (filterState.priceRange) {
      const { min, max } = filterState.priceRange;
      chips.push({
        key: 'priceRange',
        label: `Price: $${min} - $${max}`,
        labelAr: `السعر: $${min} - $${max}`,
        value: filterState.priceRange,
        type: 'price'
      });
    }

    // Rating Chips
    if (filterState.ratings && filterState.ratings.length > 0) {
      filterState.ratings.forEach(rating => {
        chips.push({
          key: `rating-${rating}`,
          label: `${rating} Stars & Up`,
          labelAr: `${this.convertToArabicNumber(rating)} نجوم وأكثر`,
          value: rating,
          type: 'rating'
        });
      });
    }

    // Authenticity Chips
    if (filterState.authenticity) {
      if (filterState.authenticity.unesco) {
        chips.push({
          key: 'authenticity-unesco',
          label: 'UNESCO Recognition',
          labelAr: 'اعتراف اليونسكو',
          value: true,
          type: 'authenticity'
        });
      }
      if (filterState.authenticity.handmade) {
        chips.push({
          key: 'authenticity-handmade',
          label: 'Handmade',
          labelAr: 'صناعة يدوية',
          value: true,
          type: 'authenticity'
        });
      }
      if (filterState.authenticity.regional) {
        chips.push({
          key: 'authenticity-regional',
          label: 'Regional Specialty',
          labelAr: 'تخصص إقليمي',
          value: true,
          type: 'authenticity'
        });
      }
    }

    // Availability Chips
    if (filterState.availability) {
      if (filterState.availability.inStock) {
        chips.push({
          key: 'availability-inStock',
          label: 'In Stock',
          labelAr: 'متوفر',
          value: true,
          type: 'availability'
        });
      }
      if (filterState.availability.outOfStock) {
        chips.push({
          key: 'availability-outOfStock',
          label: 'Out of Stock',
          labelAr: 'غير متوفر',
          value: true,
          type: 'availability'
        });
      }
    }

    // Region Chips
    if (filterState.regions && filterState.regions.length > 0) {
      filterState.regions.forEach(region => {
        const regionLabel = this.regionLabels[region] || { en: region, ar: region };
        chips.push({
          key: `region-${region}`,
          label: regionLabel.en,
          labelAr: regionLabel.ar,
          value: region,
          type: 'region'
        });
      });
    }

    return chips;
  });

  /**
   * Computed property to check if any filters are active
   */
  hasActiveFilters = computed(() => this.filterChips().length > 0);

  /**
   * Converts English number to Arabic numerals
   * @param num - Number to convert
   * @returns Arabic numeral string
   */
  private convertToArabicNumber(num: number): string {
    const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return num.toString().split('').map(digit => arabicNumbers[parseInt(digit)]).join('');
  }

  /**
   * Gets translated label for chip
   * @param chip - Filter chip
   * @returns Localized label
   */
  getChipLabel(chip: FilterChip): string {
    return this.language() === 'ar' ? chip.labelAr : chip.label;
  }

  /**
   * Handles chip removal
   * @param chip - Filter chip to remove
   */
  onRemoveChip(chip: FilterChip): void {
    this.removeFilter.emit(chip.key);
  }

  /**
   * Handles clear all filters action
   */
  onClearAll(): void {
    this.clearAll.emit();
  }

  /**
   * Gets icon for chip type
   * @param type - Filter type
   * @returns Material icon name
   */
  getChipIcon(type: FilterChip['type']): string {
    switch (type) {
      case 'price':
        return 'attach_money';
      case 'rating':
        return 'star';
      case 'authenticity':
        return 'verified';
      case 'availability':
        return 'inventory_2';
      case 'region':
        return 'location_on';
      default:
        return 'filter_alt';
    }
  }

  /**
   * Gets Clear All button label
   * @returns Localized clear all text
   */
  getClearAllLabel(): string {
    return this.language() === 'ar' ? 'مسح الكل' : 'Clear All';
  }

  /**
   * Gets active filters count text
   * @returns Localized count text
   */
  getActiveFiltersText(): string {
    const count = this.filterChips().length;
    const lang = this.language();

    if (lang === 'ar') {
      const arabicCount = this.convertToArabicNumber(count);
      return count === 1
        ? `${arabicCount} تصفية نشطة`
        : `${arabicCount} تصفيات نشطة`;
    }

    return count === 1
      ? `${count} active filter`
      : `${count} active filters`;
  }
}
