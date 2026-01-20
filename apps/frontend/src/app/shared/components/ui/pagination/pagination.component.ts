import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Pagination Component for Product Lists
 *
 * Golden Wheat themed pagination with Previous/Next buttons and page numbers.
 * Supports responsive design and RTL layout for Arabic interface.
 *
 * @swagger
 * components:
 *   schemas:
 *     PaginationComponent:
 *       type: object
 *       description: Page navigation control with Golden Wheat styling
 *       properties:
 *         currentPage:
 *           type: number
 *           description: Current active page number (1-based)
 *         totalPages:
 *           type: number
 *           description: Total number of pages
 *         maxVisiblePages:
 *           type: number
 *           description: Maximum page buttons to display (default 5)
 *         pageChange:
 *           type: event
 *           description: Emits new page number when user navigates
 *
 * @example
 * ```typescript
 * currentPage = 1;
 * totalPages = 10;
 *
 * onPageChange(page: number) {
 *   this.currentPage = page;
 *   // Load products for new page
 * }
 * ```
 *
 * ```html
 * <app-pagination
 *   [currentPage]="currentPage"
 *   [totalPages]="totalPages"
 *   (pageChange)="onPageChange($event)">
 * </app-pagination>
 * ```
 */
@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaginationComponent {
  /**
   * Current active page number (1-based index)
   */
  @Input() set currentPage(value: number) {
    this._currentPage.set(value);
  }

  /**
   * Total number of pages
   */
  @Input() set totalPages(value: number) {
    this._totalPages.set(value);
  }

  /**
   * Maximum number of page buttons to display
   * Default: 5 (shows ... ellipsis for remaining pages)
   */
  @Input() maxVisiblePages: number = 5;

  /**
   * Event emitted when page changes
   * Emits the new page number (1-based)
   */
  @Output() pageChange = new EventEmitter<number>();

  // Internal signals for reactive state
  private _currentPage = signal<number>(1);
  private _totalPages = signal<number>(1);

  /**
   * Computed array of page numbers to display
   * Handles ellipsis logic for large page counts
   */
  visiblePages = computed(() => {
    const current = this._currentPage();
    const total = this._totalPages();
    const max = this.maxVisiblePages;

    // If total pages fit within max visible, show all
    if (total <= max) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    // Calculate range around current page
    const pages: (number | string)[] = [];
    const halfVisible = Math.floor(max / 2);

    let startPage = Math.max(current - halfVisible, 1);
    let endPage = Math.min(startPage + max - 1, total);

    // Adjust if we're near the end
    if (endPage - startPage < max - 1) {
      startPage = Math.max(endPage - max + 1, 1);
    }

    // Add first page and ellipsis if needed
    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push('...');
      }
    }

    // Add visible page range
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    // Add last page and ellipsis if needed
    if (endPage < total) {
      if (endPage < total - 1) {
        pages.push('...');
      }
      pages.push(total);
    }

    return pages;
  });

  /**
   * Check if previous button should be disabled
   */
  get isPrevDisabled(): boolean {
    return this._currentPage() <= 1;
  }

  /**
   * Check if next button should be disabled
   */
  get isNextDisabled(): boolean {
    return this._currentPage() >= this._totalPages();
  }

  /**
   * Navigate to specific page
   */
  goToPage(page: number | string): void {
    if (typeof page === 'string') return; // Ignore ellipsis clicks

    if (page >= 1 && page <= this._totalPages() && page !== this._currentPage()) {
      this.pageChange.emit(page);
    }
  }

  /**
   * Navigate to previous page
   */
  previousPage(): void {
    if (!this.isPrevDisabled) {
      this.goToPage(this._currentPage() - 1);
    }
  }

  /**
   * Navigate to next page
   */
  nextPage(): void {
    if (!this.isNextDisabled) {
      this.goToPage(this._currentPage() + 1);
    }
  }

  /**
   * Check if page is currently active
   */
  isActive(page: number | string): boolean {
    return page === this._currentPage();
  }

  /**
   * Check if value is ellipsis
   */
  isEllipsis(value: number | string): boolean {
    return value === '...';
  }
}
