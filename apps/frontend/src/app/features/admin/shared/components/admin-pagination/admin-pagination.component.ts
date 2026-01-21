/**
 * @file admin-pagination.component.ts
 * @description Reusable pagination component for admin data tables and lists.
 *              Supports page navigation, page size selection, and keyboard navigation.
 * @module AdminDashboard/SharedComponents
 */

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output
} from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * Page change event
 * @description Emitted when the current page changes
 */
export interface PageChangeEvent {
  /** New page number (1-indexed) */
  page: number;
  /** Current page size */
  pageSize: number;
  /** Total number of items */
  totalItems: number;
}

/**
 * Admin Pagination Component
 * @description A comprehensive pagination component with page navigation,
 *              page size selection, and accessibility features.
 *
 * @example
 * ```html
 * <!-- Basic usage -->
 * <app-admin-pagination
 *   [currentPage]="1"
 *   [pageSize]="20"
 *   [totalItems]="500"
 *   (pageChange)="onPageChange($event)"
 * />
 *
 * <!-- With custom page sizes -->
 * <app-admin-pagination
 *   [currentPage]="currentPage()"
 *   [pageSize]="pageSize()"
 *   [totalItems]="totalItems()"
 *   [pageSizeOptions]="[10, 25, 50, 100]"
 *   [showPageSizeSelector]="true"
 *   [showPageInfo]="true"
 *   (pageChange)="onPageChange($event)"
 *   (pageSizeChange)="onPageSizeChange($event)"
 * />
 * ```
 */
@Component({
  standalone: true,
  selector: 'app-admin-pagination',
  templateUrl: './admin-pagination.component.html',
  styleUrls: ['./admin-pagination.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgFor, NgIf, NgClass, FormsModule]
})
export class AdminPaginationComponent {
  /**
   * Current page number (1-indexed)
   * @description The currently active page
   */
  readonly currentPage = input.required<number>();

  /**
   * Items per page
   * @description Number of items shown per page
   */
  readonly pageSize = input.required<number>();

  /**
   * Total number of items
   * @description Total count of items across all pages
   */
  readonly totalItems = input.required<number>();

  /**
   * Page size options
   * @description Available page size options for the selector
   * @default [10, 20, 50, 100]
   */
  readonly pageSizeOptions = input<number[]>([10, 20, 50, 100]);

  /**
   * Show page size selector
   * @description Whether to display the page size dropdown
   * @default true
   */
  readonly showPageSizeSelector = input<boolean>(true);

  /**
   * Show page info
   * @description Whether to display "Showing X-Y of Z items" info
   * @default true
   */
  readonly showPageInfo = input<boolean>(true);

  /**
   * Show first/last buttons
   * @description Whether to show buttons for jumping to first/last page
   * @default true
   */
  readonly showFirstLast = input<boolean>(true);

  /**
   * Maximum visible page buttons
   * @description Maximum number of page buttons to show at once
   * @default 5
   */
  readonly maxVisiblePages = input<number>(5);

  /**
   * Compact mode
   * @description Use a more compact layout for smaller spaces
   * @default false
   */
  readonly compact = input<boolean>(false);

  /**
   * Disabled state
   * @description Disable all pagination controls
   * @default false
   */
  readonly disabled = input<boolean>(false);

  /**
   * Page change event emitter
   * @description Emitted when navigating to a different page
   */
  readonly pageChange = output<PageChangeEvent>();

  /**
   * Page size change event emitter
   * @description Emitted when the page size is changed
   */
  readonly pageSizeChange = output<number>();

  /**
   * Total number of pages
   * @description Calculated total pages based on items and page size
   */
  readonly totalPages = computed(() => {
    const total = this.totalItems();
    const size = this.pageSize();
    return Math.ceil(total / size) || 1;
  });

  /**
   * Whether first page is active
   * @description True when on the first page
   */
  readonly isFirstPage = computed(() => this.currentPage() === 1);

  /**
   * Whether last page is active
   * @description True when on the last page
   */
  readonly isLastPage = computed(() => this.currentPage() >= this.totalPages());

  /**
   * First item index (1-indexed)
   * @description Index of the first item on the current page
   */
  readonly firstItemIndex = computed(() => {
    const page = this.currentPage();
    const size = this.pageSize();
    return (page - 1) * size + 1;
  });

  /**
   * Last item index (1-indexed)
   * @description Index of the last item on the current page
   */
  readonly lastItemIndex = computed(() => {
    const first = this.firstItemIndex();
    const size = this.pageSize();
    const total = this.totalItems();
    return Math.min(first + size - 1, total);
  });

  /**
   * Visible page numbers
   * @description Array of page numbers to display as buttons
   */
  readonly visiblePages = computed(() => {
    const current = this.currentPage();
    const total = this.totalPages();
    const max = this.maxVisiblePages();

    if (total <= max) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const half = Math.floor(max / 2);
    let start = Math.max(1, current - half);
    let end = Math.min(total, start + max - 1);

    if (end - start + 1 < max) {
      start = Math.max(1, end - max + 1);
    }

    const pages: (number | 'ellipsis')[] = [];

    if (start > 1) {
      pages.push(1);
      if (start > 2) {
        pages.push('ellipsis');
      }
    }

    for (let i = start; i <= end; i++) {
      if (i !== 1 && i !== total) {
        pages.push(i);
      }
    }

    if (end < total) {
      if (end < total - 1) {
        pages.push('ellipsis');
      }
      pages.push(total);
    }

    return pages;
  });

  /**
   * Navigate to a specific page
   * @param page - Target page number
   */
  goToPage(page: number): void {
    if (this.disabled()) return;

    const validPage = Math.max(1, Math.min(page, this.totalPages()));

    if (validPage !== this.currentPage()) {
      this.pageChange.emit({
        page: validPage,
        pageSize: this.pageSize(),
        totalItems: this.totalItems()
      });
    }
  }

  /**
   * Navigate to the first page
   */
  goToFirst(): void {
    this.goToPage(1);
  }

  /**
   * Navigate to the last page
   */
  goToLast(): void {
    this.goToPage(this.totalPages());
  }

  /**
   * Navigate to the previous page
   */
  goToPrevious(): void {
    this.goToPage(this.currentPage() - 1);
  }

  /**
   * Navigate to the next page
   */
  goToNext(): void {
    this.goToPage(this.currentPage() + 1);
  }

  /**
   * Handle page size change
   * @param newSize - New page size value
   */
  onPageSizeChange(newSize: number): void {
    if (this.disabled()) return;
    this.pageSizeChange.emit(newSize);
  }

  /**
   * Check if a page item is an ellipsis
   * @param item - Page item to check
   * @returns True if the item is an ellipsis marker
   */
  isEllipsis(item: number | 'ellipsis'): item is 'ellipsis' {
    return item === 'ellipsis';
  }

  /**
   * Track function for ngFor
   * @param index - Array index
   * @param item - Page item
   * @returns Unique identifier for the item
   */
  trackByPage(index: number, item: number | 'ellipsis'): string | number {
    return item === 'ellipsis' ? `ellipsis-${index}` : item;
  }
}
