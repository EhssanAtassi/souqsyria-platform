import { Component, ChangeDetectionStrategy, input, output, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSliderModule } from '@angular/material/slider';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

/**
 * Price Range Filter Component
 *
 * Provides dual-slider interface for price range filtering.
 * Supports min/max price selection with live updates.
 * Displays price values in USD format with proper localization.
 *
 * @description
 * Uses Material slider for smooth price range selection.
 * Emits changes when user adjusts min or max values.
 * Supports RTL layout and Arabic number formatting.
 *
 * @example
 * ```html
 * <app-price-range-filter
 *   [language]="'en'"
 *   [initialMin]="0"
 *   [initialMax]="1000"
 *   [minLimit]="0"
 *   [maxLimit]="5000"
 *   (rangeChange)="onPriceChange($event)">
 * </app-price-range-filter>
 * ```
 *
 * @swagger
 * components:
 *   schemas:
 *     PriceRangeFilterComponent:
 *       type: object
 *       description: Price range slider filter component
 *       properties:
 *         language:
 *           type: string
 *           enum: [en, ar]
 *         initialMin:
 *           type: number
 *           default: 0
 *         initialMax:
 *           type: number
 *           default: 1000
 *         minLimit:
 *           type: number
 *           default: 0
 *         maxLimit:
 *           type: number
 *           default: 10000
 */
@Component({
  selector: 'app-price-range-filter',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatSliderModule,
    MatInputModule,
    MatFormFieldModule
  ],
  templateUrl: './price-range-filter.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,

  styleUrl: './price-range-filter.component.scss'
})
export class PriceRangeFilterComponent {
  /**
   * Display language for number formatting
   * @default 'en'
   */
  readonly language = input<'en' | 'ar'>('en');

  /**
   * Initial minimum price value
   * @default 0
   */
  readonly initialMin = input<number>(0);

  /**
   * Initial maximum price value
   * @default 10000000
   */
  readonly initialMax = input<number>(10000000);

  /**
   * Minimum allowed price (slider lower bound)
   * @default 0
   */
  readonly minLimit = input<number>(0);

  /**
   * Maximum allowed price (slider upper bound)
   * @default 50000000
   */
  readonly maxLimit = input<number>(50000000);

  /**
   * Currency to display
   * @default 'SYP'
   */
  readonly currency = input<'USD' | 'EUR' | 'SYP'>('SYP');

  /**
   * Emits when price range changes
   * Provides { min, max } object
   */
  readonly rangeChange = output<{ min: number; max: number }>();

  /**
   * Current minimum price
   */
  minPrice = signal<number>(0);

  /**
   * Current maximum price
   */
  maxPrice = signal<number>(10000000);

  /**
   * Slider step value
   */
  readonly step = 100000;

  constructor() {
    // Initialize from inputs when component loads
    effect(() => {
      this.minPrice.set(this.initialMin());
      this.maxPrice.set(this.initialMax());
    }, { allowSignalWrites: true });
  }

  /**
   * Handles minimum price slider change
   * Ensures min doesn't exceed max
   */
  onMinChange(value: number): void {
    const max = this.maxPrice();
    const newMin = Math.min(value, max - this.step);
    this.minPrice.set(newMin);
    this.emitChange();
  }

  /**
   * Handles maximum price slider change
   * Ensures max doesn't go below min
   */
  onMaxChange(value: number): void {
    const min = this.minPrice();
    const newMax = Math.max(value, min + this.step);
    this.maxPrice.set(newMax);
    this.emitChange();
  }

  /**
   * Handles direct input for minimum price
   */
  onMinInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = parseInt(input.value, 10);

    if (!isNaN(value)) {
      this.onMinChange(value);
    }
  }

  /**
   * Handles direct input for maximum price
   */
  onMaxInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = parseInt(input.value, 10);

    if (!isNaN(value)) {
      this.onMaxChange(value);
    }
  }

  /**
   * Emits current price range to parent
   */
  private emitChange(): void {
    this.rangeChange.emit({
      min: this.minPrice(),
      max: this.maxPrice()
    });
  }

  /**
   * Formats price value for display
   * @param value - Price value to format
   * @returns Formatted price string with currency
   */
  formatPrice(value: number): string {
    const currency = this.currency();

    switch (currency) {
      case 'USD':
        return `$${value.toLocaleString('en-US')}`;
      case 'EUR':
        return `€${value.toLocaleString('en-US')}`;
      case 'SYP':
        return `${value.toLocaleString('ar-SY')} ل.س`;
      default:
        return `$${value}`;
    }
  }

  /**
   * Gets currency symbol based on current currency setting
   * @returns Currency symbol string
   */
  getCurrencySymbol(): string {
    switch (this.currency()) {
      case 'USD':
        return '$';
      case 'EUR':
        return '€';
      case 'SYP':
        return 'ل.س';
      default:
        return '$';
    }
  }

  /**
   * Gets localized label for "Min" based on language
   * @returns Localized min label
   */
  getMinLabel(): string {
    return this.language() === 'ar' ? 'الحد الأدنى' : 'Min';
  }

  /**
   * Gets localized label for "Max" based on language
   * @returns Localized max label
   */
  getMaxLabel(): string {
    return this.language() === 'ar' ? 'الحد الأقصى' : 'Max';
  }
}
