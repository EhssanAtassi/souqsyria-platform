/**
 * @file brand-filter.component.ts
 * @description Brand Filter Component for product filtering sidebar
 *
 * Displays list of brands with checkboxes for multi-select filtering.
 * Fetches brands from GET /api/brands endpoint.
 * Shows product count next to each brand name.
 *
 * @swagger
 * components:
 *   schemas:
 *     BrandFilterComponent:
 *       type: object
 *       description: Brand filter with checkboxes and product counts
 *       properties:
 *         language:
 *           type: string
 *           enum: [en, ar]
 *         selectedBrandIds:
 *           type: string
 *           description: Comma-separated brand IDs (e.g., "1,2,5")
 */
import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  inject,
  DestroyRef,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../../../environments/environment';

/**
 * Brand Item Interface
 * Represents a single brand from the API
 *
 * @swagger
 * components:
 *   schemas:
 *     BrandItem:
 *       type: object
 *       properties:
 *         id:
 *           type: number
 *         name:
 *           type: string
 *         nameAr:
 *           type: string
 *         slug:
 *           type: string
 *         logoUrl:
 *           type: string
 *         productCount:
 *           type: number
 */
export interface BrandItem {
  id: number;
  name: string;
  nameAr: string;
  slug: string;
  logoUrl?: string;
  productCount: number;
}

/**
 * API Response Interface for Brands
 */
interface BrandListResponse {
  data: BrandItem[];
}

/**
 * Brand Filter Component
 *
 * Provides brand filtering with checkboxes and product counts.
 * Displays brands ordered by popularity (product count descending).
 * Supports bilingual brand names (English/Arabic).
 * Fetches data from /api/brands on component initialization.
 *
 * @description
 * This component displays a list of active brands for filtering products.
 * - Brands sorted by product count (most popular first)
 * - Product counts shown in gray next to each brand name
 * - Emits comma-separated brand IDs string to parent
 * - Uses Angular signals for reactive state
 * - OnPush change detection for performance
 *
 * @example
 * ```html
 * <app-brand-filter
 *   [language]="'en'"
 *   [selectedBrandIds]="'1,5'"
 *   (brandChange)="onBrandChange($event)">
 * </app-brand-filter>
 * ```
 *
 * @swagger
 * components:
 *   schemas:
 *     BrandFilterComponent:
 *       type: object
 *       description: Brand filter component with checkboxes
 *       properties:
 *         language:
 *           type: string
 *           enum: [en, ar]
 *         selectedBrandIds:
 *           type: string
 *           description: Comma-separated brand IDs
 */
@Component({
  selector: 'app-brand-filter',
  standalone: true,
  imports: [
    CommonModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  templateUrl: './brand-filter.component.html',
  styleUrls: ['./brand-filter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrandFilterComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Display language for brand names
   * @default 'en'
   */
  readonly language = input<'en' | 'ar'>('en');

  /**
   * Currently selected brand IDs as comma-separated string
   * @default ''
   * @example '1,2,5'
   */
  readonly selectedBrandIds = input<string>('');

  /**
   * Emits when brand selection changes
   * Provides comma-separated brand IDs string
   */
  readonly brandChange = output<string>();

  /**
   * Brand list data from API
   */
  brands = signal<BrandItem[]>([]);

  /**
   * Loading state while fetching brands
   */
  loading = signal(true);

  /**
   * Error message if API call fails
   */
  error = signal<string | null>(null);

  /**
   * Lifecycle hook - fetches brands on component initialization
   */
  ngOnInit(): void {
    this.loadBrands();
  }

  /**
   * Fetches brand list from API
   * Endpoint: GET ${environment.apiUrl}/brands
   */
  private loadBrands(): void {
    this.loading.set(true);
    this.error.set(null);

    this.http
      .get<BrandListResponse>(`${environment.apiUrl}/brands`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.brands.set(response.data);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Failed to load brands:', err);
          this.error.set('Failed to load brands');
          this.loading.set(false);
        },
      });
  }

  /**
   * Checks if a brand is currently selected
   * @param brandId - Brand ID to check
   * @returns true if brand ID is in selected list
   */
  isBrandSelected(brandId: number): boolean {
    const selectedIds = this.getSelectedIdsArray();
    return selectedIds.includes(brandId);
  }

  /**
   * Converts comma-separated string to array of numbers
   * @returns Array of selected brand IDs
   */
  private getSelectedIdsArray(): number[] {
    const idsString = this.selectedBrandIds();
    if (!idsString) return [];

    return idsString
      .split(',')
      .map((id) => parseInt(id.trim(), 10))
      .filter((id) => !isNaN(id));
  }

  /**
   * Handles brand checkbox change
   * @param brandId - ID of brand that was toggled
   * @param checked - Whether checkbox is now checked
   */
  onBrandToggle(brandId: number, checked: boolean): void {
    const currentIds = this.getSelectedIdsArray();

    if (checked) {
      // Add brand if not already present
      if (!currentIds.includes(brandId)) {
        currentIds.push(brandId);
      }
    } else {
      // Remove brand
      const index = currentIds.indexOf(brandId);
      if (index > -1) {
        currentIds.splice(index, 1);
      }
    }

    // Convert back to comma-separated string
    const idsString = currentIds.length > 0 ? currentIds.join(',') : '';
    this.brandChange.emit(idsString);
  }

  /**
   * Gets localized brand name based on current language
   * @param brand - Brand object
   * @returns Localized brand name
   */
  getBrandName(brand: BrandItem): string {
    return this.language() === 'ar' ? brand.nameAr : brand.name;
  }

  /**
   * Formats product count for display
   * @param count - Number of products
   * @returns Formatted count string with localization
   */
  formatCount(count: number): string {
    const lang = this.language();
    if (lang === 'ar') {
      return `(${count.toLocaleString('ar-SY')})`;
    }
    return `(${count.toLocaleString('en-US')})`;
  }
}
