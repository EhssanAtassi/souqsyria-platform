import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';

/**
 * Rating option interface for displaying star ratings
 */
export interface RatingOption {
  value: number;
  label: string;
  labelAr: string;
  count?: number;
}

/**
 * Rating Filter Component
 *
 * Provides star rating filter with checkboxes for each rating level (5 to 1 stars).
 * Displays visual star representation and product count for each rating.
 * Supports multiple selection for flexible filtering.
 *
 * @description
 * Shows 5 rating options (5 stars to 1 star) with visual star icons.
 * Each option displays "X stars & up" with product count if available.
 * Supports RTL layout with proper Arabic translations.
 * Emits array of selected rating values to parent component.
 *
 * @example
 * ```html
 * <app-rating-filter
 *   [language]="'en'"
 *   [selectedRatings]="[4, 5]"
 *   [showCounts]="true"
 *   (ratingsChange)="onRatingChange($event)">
 * </app-rating-filter>
 * ```
 *
 * @swagger
 * components:
 *   schemas:
 *     RatingFilterComponent:
 *       type: object
 *       description: Star rating filter with checkbox selection
 *       properties:
 *         language:
 *           type: string
 *           enum: [en, ar]
 *         selectedRatings:
 *           type: array
 *           items:
 *             type: number
 *         showCounts:
 *           type: boolean
 *           default: true
 *         ratingCounts:
 *           type: object
 *           additionalProperties:
 *             type: number
 */
@Component({
  selector: 'app-rating-filter',
  standalone: true,
  imports: [
    CommonModule,
    MatCheckboxModule,
    MatIconModule
  ],
  templateUrl: './rating-filter.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,

  styleUrl: './rating-filter.component.scss'
})
export class RatingFilterComponent {
  /**
   * Display language for translations
   * @default 'en'
   */
  readonly language = input<'en' | 'ar'>('en');

  /**
   * Currently selected rating values
   * @default []
   */
  readonly selectedRatings = input<number[]>([]);

  /**
   * Whether to show product counts for each rating
   * @default true
   */
  readonly showCounts = input<boolean>(true);

  /**
   * Product counts for each rating level
   * Key is rating value, value is product count
   * @default {}
   */
  readonly ratingCounts = input<{ [key: number]: number }>({});

  /**
   * Emits when rating selection changes
   * Provides array of selected rating values
   */
  readonly ratingsChange = output<number[]>();

  /**
   * Rating options (5 stars to 1 star)
   */
  readonly ratingOptions: RatingOption[] = [
    { value: 5, label: '5 Stars', labelAr: '٥ نجوم' },
    { value: 4, label: '4 Stars & Up', labelAr: '٤ نجوم وأكثر' },
    { value: 3, label: '3 Stars & Up', labelAr: '٣ نجوم وأكثر' },
    { value: 2, label: '2 Stars & Up', labelAr: '٢ نجوم وأكثر' },
    { value: 1, label: '1 Star & Up', labelAr: 'نجمة وأكثر' }
  ];

  /**
   * Internal selected ratings state
   */
  private selectedRatingsSet = signal<Set<number>>(new Set());

  /**
   * Checks if a rating is currently selected
   * @param rating - Rating value to check
   * @returns true if rating is selected
   */
  isRatingSelected(rating: number): boolean {
    return this.selectedRatings().includes(rating);
  }

  /**
   * Handles rating checkbox change
   * @param rating - Rating value that was toggled
   * @param checked - Whether checkbox is now checked
   */
  onRatingChange(rating: number, checked: boolean): void {
    const current = new Set(this.selectedRatings());

    if (checked) {
      current.add(rating);
    } else {
      current.delete(rating);
    }

    this.selectedRatingsSet.set(current);
    this.ratingsChange.emit(Array.from(current).sort((a, b) => b - a));
  }

  /**
   * Generates array of star counts for visual display
   * @param rating - Rating value (1-5)
   * @returns Array of numbers representing filled stars
   */
  getStarArray(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => i + 1);
  }

  /**
   * Determines if star should be filled for given rating
   * @param starIndex - Star position (1-5)
   * @param rating - Rating value
   * @returns true if star should be filled (gold)
   */
  isStarFilled(starIndex: number, rating: number): boolean {
    return starIndex <= rating;
  }

  /**
   * Gets product count for specific rating
   * @param rating - Rating value
   * @returns Product count or undefined
   */
  getRatingCount(rating: number): number | undefined {
    return this.ratingCounts()[rating];
  }

  /**
   * Gets translated label for rating option
   * @param option - Rating option
   * @returns Localized label
   */
  getLabel(option: RatingOption): string {
    return this.language() === 'ar' ? option.labelAr : option.label;
  }

  /**
   * Formats count display text
   * @param count - Number of products
   * @returns Formatted count string with localization
   */
  formatCount(count: number | undefined): string {
    if (count === undefined) return '';

    const lang = this.language();
    if (lang === 'ar') {
      return `(${count.toLocaleString('ar-SY')})`;
    }
    return `(${count.toLocaleString('en-US')})`;
  }
}
