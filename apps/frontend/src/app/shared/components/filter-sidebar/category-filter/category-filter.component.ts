/**
 * @file category-filter.component.ts
 * @description Category Filter Component for product filtering sidebar
 *
 * Displays hierarchical category tree with checkboxes for multi-select filtering.
 * Fetches categories from GET /api/categories/tree endpoint.
 * Supports parent-child hierarchy with collapsible sections.
 *
 * @swagger
 * components:
 *   schemas:
 *     CategoryFilterComponent:
 *       type: object
 *       description: Hierarchical category filter with product counts
 *       properties:
 *         language:
 *           type: string
 *           enum: [en, ar]
 *         selectedCategoryIds:
 *           type: array
 *           items:
 *             type: number
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
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../../../environments/environment';

/**
 * Category Tree Item Interface
 * Represents a category node in the 3-level tree hierarchy
 *
 * @swagger
 * components:
 *   schemas:
 *     CategoryTreeItem:
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
 *         productCount:
 *           type: number
 *         children:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CategoryTreeItem'
 */
export interface CategoryTreeItem {
  id: number;
  name: string;
  nameAr: string;
  slug: string;
  productCount: number;
  children?: CategoryTreeItem[];
}

/**
 * API Response Interface for Category Tree
 */
interface CategoryTreeResponse {
  data: CategoryTreeItem[];
}

/**
 * Category Filter Component
 *
 * Provides hierarchical category filtering with 3 levels (parent > child > grandchild).
 * Displays product counts next to each category.
 * Supports collapsible parent categories and multi-select checkboxes.
 * Fetches data from /api/categories/tree on component initialization.
 *
 * @description
 * This component displays the complete category tree for filtering products.
 * - Root categories are always visible
 * - Child categories are collapsible under parents
 * - Grandchild categories shown when parent is expanded
 * - Product counts shown in gray next to each category name
 * - Emits array of selected category IDs to parent
 * - Uses Angular signals for reactive state
 * - OnPush change detection for performance
 *
 * @example
 * ```html
 * <app-category-filter
 *   [language]="'en'"
 *   [selectedCategoryIds]="[1, 5]"
 *   (categoryChange)="onCategoryChange($event)">
 * </app-category-filter>
 * ```
 *
 * @swagger
 * components:
 *   schemas:
 *     CategoryFilterComponent:
 *       type: object
 *       description: Hierarchical category filter component
 *       properties:
 *         language:
 *           type: string
 *           enum: [en, ar]
 *         selectedCategoryIds:
 *           type: array
 *           items:
 *             type: number
 */
@Component({
  selector: 'app-category-filter',
  standalone: true,
  imports: [
    CommonModule,
    MatCheckboxModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './category-filter.component.html',
  styleUrls: ['./category-filter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryFilterComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Display language for category names
   * @default 'en'
   */
  readonly language = input<'en' | 'ar'>('en');

  /**
   * Currently selected category IDs
   * @default []
   */
  readonly selectedCategoryIds = input<number[]>([]);

  /**
   * Emits when category selection changes
   * Provides array of selected category IDs
   */
  readonly categoryChange = output<number[]>();

  /**
   * Category tree data from API
   */
  categories = signal<CategoryTreeItem[]>([]);

  /**
   * Loading state while fetching categories
   */
  loading = signal(true);

  /**
   * Error message if API call fails
   */
  error = signal<string | null>(null);

  /**
   * Map of expanded parent category IDs
   * Used to track which parent categories are expanded
   */
  expandedCategories = signal<Set<number>>(new Set());

  /**
   * Lifecycle hook - fetches categories on component initialization
   */
  ngOnInit(): void {
    this.loadCategories();
  }

  /**
   * Fetches category tree from API
   * Endpoint: GET ${environment.apiUrl}/categories/tree
   */
  private loadCategories(): void {
    this.loading.set(true);
    this.error.set(null);

    this.http
      .get<CategoryTreeResponse>(`${environment.apiUrl}/categories/tree`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.categories.set(response.data);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Failed to load categories:', err);
          this.error.set('Failed to load categories');
          this.loading.set(false);
        },
      });
  }

  /**
   * Checks if a category is currently selected
   * @param categoryId - Category ID to check
   * @returns true if category is in selected list
   */
  isCategorySelected(categoryId: number): boolean {
    return this.selectedCategoryIds().includes(categoryId);
  }

  /**
   * Handles category checkbox change
   * @param categoryId - ID of category that was toggled
   * @param checked - Whether checkbox is now checked
   */
  onCategoryToggle(categoryId: number, checked: boolean): void {
    const current = [...this.selectedCategoryIds()];

    if (checked) {
      // Add category if not already present
      if (!current.includes(categoryId)) {
        current.push(categoryId);
      }
    } else {
      // Remove category
      const index = current.indexOf(categoryId);
      if (index > -1) {
        current.splice(index, 1);
      }
    }

    this.categoryChange.emit(current);
  }

  /**
   * Toggles expansion state of a parent category
   * @param categoryId - Parent category ID to toggle
   */
  toggleExpanded(categoryId: number): void {
    this.expandedCategories.update((expanded) => {
      const newSet = new Set(expanded);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  }

  /**
   * Checks if a parent category is expanded
   * @param categoryId - Parent category ID to check
   * @returns true if category is expanded
   */
  isExpanded(categoryId: number): boolean {
    return this.expandedCategories().has(categoryId);
  }

  /**
   * Gets localized category name based on current language
   * @param category - Category object
   * @returns Localized category name
   */
  getCategoryName(category: CategoryTreeItem): string {
    return this.language() === 'ar' ? category.nameAr : category.name;
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
