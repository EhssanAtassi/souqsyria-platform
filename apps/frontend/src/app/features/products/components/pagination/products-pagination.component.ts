import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { ProductListMeta } from '../../models/product-list.interface';

/**
 * @description Products pagination component
 * Displays pagination controls with page numbers and items per page selector
 */
@Component({
  selector: 'app-products-pagination',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    FormsModule,
  ],
  templateUrl: './products-pagination.component.html',
  styleUrls: ['./products-pagination.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsPaginationComponent {
  /** Pagination metadata */
  meta = input.required<ProductListMeta>();

  /** Current UI language */
  language = input<'en' | 'ar'>('en');

  /** Emits when page number changes */
  pageChange = output<number>();

  /** Emits when items per page changes */
  limitChange = output<number>();

  /** Available items per page options */
  readonly limitOptions = [20, 40, 60];

  /** Computed showing range text */
  showingText = computed(() => {
    const m = this.meta();
    const lang = this.language();
    const start = (m.page - 1) * m.limit + 1;
    const end = Math.min(m.page * m.limit, m.total);

    if (lang === 'ar') {
      return `عرض ${start}-${end} من ${m.total} منتج`;
    }
    return `Showing ${start}-${end} of ${m.total} products`;
  });

  /** Computed items per page label */
  itemsPerPageLabel = computed(() => {
    const lang = this.language();
    return lang === 'ar' ? 'عناصر لكل صفحة' : 'Items per page';
  });

  /** Computed previous button label */
  previousLabel = computed(() => {
    const lang = this.language();
    return lang === 'ar' ? 'السابق' : 'Previous';
  });

  /** Computed next button label */
  nextLabel = computed(() => {
    const lang = this.language();
    return lang === 'ar' ? 'التالي' : 'Next';
  });

  /** Computed whether previous button should be disabled */
  isPreviousDisabled = computed(() => {
    return this.meta().page <= 1;
  });

  /** Computed whether next button should be disabled */
  isNextDisabled = computed(() => {
    const m = this.meta();
    return m.page >= m.totalPages;
  });

  /** Computed array of page numbers to display */
  pageNumbers = computed(() => {
    const m = this.meta();
    const current = m.page;
    const total = m.totalPages;
    const pages: Array<number | 'ellipsis'> = [];

    if (total <= 7) {
      // Show all pages if total is 7 or less
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      // Calculate range around current page
      let start = Math.max(2, current - 1);
      let end = Math.min(total - 1, current + 1);

      // Add ellipsis after first page if needed
      if (start > 2) {
        pages.push('ellipsis');
        start = Math.max(start, current - 1);
      }

      // Add pages around current
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // Add ellipsis before last page if needed
      if (end < total - 1) {
        pages.push('ellipsis');
      }

      // Always show last page
      pages.push(total);
    }

    return pages;
  });

  /**
   * @description Handles page number click
   * @param page - Page number to navigate to
   */
  onPageClick(page: number): void {
    if (page !== this.meta().page) {
      this.pageChange.emit(page);
    }
  }

  /**
   * @description Handles previous button click
   */
  onPreviousClick(): void {
    const currentPage = this.meta().page;
    if (currentPage > 1) {
      this.pageChange.emit(currentPage - 1);
    }
  }

  /**
   * @description Handles next button click
   */
  onNextClick(): void {
    const m = this.meta();
    if (m.page < m.totalPages) {
      this.pageChange.emit(m.page + 1);
    }
  }

  /**
   * @description Handles items per page selection change
   * @param limit - New items per page limit
   */
  onLimitChange(limit: number): void {
    this.limitChange.emit(limit);
  }

  /**
   * @description Determines if a page number is the current page
   * @param page - Page number to check
   * @returns True if page is current page
   */
  isCurrentPage(page: number | 'ellipsis'): boolean {
    return typeof page === 'number' && page === this.meta().page;
  }
}
