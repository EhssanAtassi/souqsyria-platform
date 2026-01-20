import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

/**
 * Authenticity filter state interface
 */
export interface AuthenticityState {
  unesco?: boolean;
  handmade?: boolean;
  regional?: boolean;
}

/**
 * Authenticity option interface for Syrian heritage filtering
 */
export interface AuthenticityOption {
  key: keyof AuthenticityState;
  label: string;
  labelAr: string;
  icon: string;
  description: string;
  descriptionAr: string;
  color: string;
}

/**
 * Authenticity Filter Component
 *
 * Provides Syrian cultural authenticity filtering options.
 * Includes UNESCO recognition, handmade crafts, and regional specialty filters.
 * Highlights Syrian heritage and cultural significance of products.
 *
 * @description
 * This component emphasizes Syrian authenticity markers:
 * - UNESCO Recognition: Products with UNESCO cultural heritage status
 * - Handmade: Traditional handcrafted items by Syrian artisans
 * - Regional Specialty: Products unique to specific Syrian regions
 *
 * Each option includes icon, description, and tooltip for user education.
 * Supports RTL layout and full Arabic translations.
 *
 * @example
 * ```html
 * <app-authenticity-filter
 *   [language]="'en'"
 *   [selectedAuthenticity]="{ unesco: true, handmade: false }"
 *   (authenticityChange)="onAuthenticityChange($event)">
 * </app-authenticity-filter>
 * ```
 *
 * @swagger
 * components:
 *   schemas:
 *     AuthenticityFilterComponent:
 *       type: object
 *       description: Syrian authenticity and heritage filter component
 *       properties:
 *         language:
 *           type: string
 *           enum: [en, ar]
 *         selectedAuthenticity:
 *           $ref: '#/components/schemas/AuthenticityState'
 */
@Component({
  selector: 'app-authenticity-filter',
  standalone: true,
  imports: [
    CommonModule,
    MatCheckboxModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './authenticity-filter.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,

  styleUrl: './authenticity-filter.component.scss'
})
export class AuthenticityFilterComponent {
  /**
   * Display language for translations
   * @default 'en'
   */
  readonly language = input<'en' | 'ar'>('en');

  /**
   * Currently selected authenticity filters
   * @default {}
   */
  readonly selectedAuthenticity = input<AuthenticityState>({});

  /**
   * Emits when authenticity selection changes
   * Provides complete authenticity state object
   */
  readonly authenticityChange = output<AuthenticityState>();

  /**
   * Authenticity filter options (Syrian cultural markers)
   */
  readonly authenticityOptions: AuthenticityOption[] = [
    {
      key: 'unesco',
      label: 'UNESCO Recognition',
      labelAr: 'اعتراف اليونسكو',
      icon: 'verified_user',
      description: 'Products recognized by UNESCO for cultural significance',
      descriptionAr: 'منتجات معترف بها من قبل اليونسكو للأهمية الثقافية',
      color: '#2196F3' // UNESCO Blue
    },
    {
      key: 'handmade',
      label: 'Traditional Handmade',
      labelAr: 'صناعة يدوية تقليدية',
      icon: 'pan_tool',
      description: 'Handcrafted by Syrian master artisans using traditional methods',
      descriptionAr: 'مصنوعة يدوياً من قبل الحرفيين السوريين باستخدام الطرق التقليدية',
      color: '#FF9800' // Artisan Orange
    },
    {
      key: 'regional',
      label: 'Regional Specialty',
      labelAr: 'تخصص إقليمي',
      icon: 'location_city',
      description: 'Unique to specific Syrian regions (Damascus, Aleppo, etc.)',
      descriptionAr: 'فريدة من نوعها لمناطق سورية محددة (دمشق، حلب، إلخ)',
      color: '#4CAF50' // Regional Green
    }
  ];

  /**
   * Internal authenticity state
   */
  private currentState = signal<AuthenticityState>({});

  /**
   * Checks if an authenticity option is selected
   * @param key - Authenticity option key
   * @returns true if option is selected
   */
  isSelected(key: keyof AuthenticityState): boolean {
    return this.selectedAuthenticity()[key] || false;
  }

  /**
   * Handles authenticity checkbox change
   * @param key - Authenticity option key
   * @param checked - Whether checkbox is now checked
   */
  onAuthenticityChange(key: keyof AuthenticityState, checked: boolean): void {
    const current = { ...this.selectedAuthenticity() };

    if (checked) {
      current[key] = true;
    } else {
      delete current[key];
    }

    this.currentState.set(current);
    this.authenticityChange.emit(current);
  }

  /**
   * Gets translated label for option
   * @param option - Authenticity option
   * @returns Localized label
   */
  getLabel(option: AuthenticityOption): string {
    return this.language() === 'ar' ? option.labelAr : option.label;
  }

  /**
   * Gets translated description for option
   * @param option - Authenticity option
   * @returns Localized description
   */
  getDescription(option: AuthenticityOption): string {
    return this.language() === 'ar' ? option.descriptionAr : option.description;
  }

  /**
   * Gets count of selected authenticity filters
   * @returns Number of active filters
   */
  getSelectedCount(): number {
    const state = this.selectedAuthenticity();
    return Object.values(state).filter(v => v === true).length;
  }

  /**
   * Checks if any authenticity filters are selected
   * @returns true if at least one filter is active
   */
  hasSelectedFilters(): boolean {
    return this.getSelectedCount() > 0;
  }
}
