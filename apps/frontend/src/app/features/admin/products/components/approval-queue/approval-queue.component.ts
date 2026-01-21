/**
 * @file approval-queue.component.ts
 * @description Product approval queue component for reviewing pending products.
 *              Displays pending products in a card-based layout with quick
 *              approve/reject actions.
 * @module AdminDashboard/Products/Components
 */

import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil, finalize } from 'rxjs';

import { AdminProductsService } from '../../../services';
import { AdminStatusBadgeComponent, CurrencyFormatPipe } from '../../../shared';
import { PendingProductItem, PaginatedResponse } from '../../../interfaces';

/**
 * Rejection dialog data
 */
interface RejectionData {
  productId: number;
  productName: string;
}

/**
 * Approval Queue Component
 * @description Displays pending products awaiting admin approval.
 *
 * @features
 * - Card-based product display
 * - Quick approve/reject actions
 * - Bulk approval
 * - Filter by vendor or category
 * - Rejection with reason dialog
 *
 * @example
 * ```html
 * <!-- Routed via /admin/products/pending -->
 * <app-approval-queue></app-approval-queue>
 * ```
 */
@Component({
  selector: 'app-approval-queue',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
    AdminStatusBadgeComponent,
    CurrencyFormatPipe
  ],
  templateUrl: './approval-queue.component.html',
  styleUrl: './approval-queue.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ApprovalQueueComponent implements OnInit, OnDestroy {
  // =========================================================================
  // DEPENDENCIES
  // =========================================================================

  private readonly productsService = inject(AdminProductsService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroy$ = new Subject<void>();

  // =========================================================================
  // STATE SIGNALS
  // =========================================================================

  /** Loading state */
  readonly isLoading = signal(false);

  /** Pending products list */
  readonly pendingProducts = signal<PendingProductItem[]>([]);

  /** Pagination state */
  readonly pagination = signal({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  });

  /** Selected product IDs for bulk actions */
  readonly selectedProductIds = signal<Set<number>>(new Set());

  /** Sort order */
  readonly sortOrder = signal<'asc' | 'desc'>('asc');

  /** Rejection dialog state */
  readonly showRejectionDialog = signal(false);

  /** Product being rejected */
  readonly rejectingProduct = signal<RejectionData | null>(null);

  /** Rejection reason */
  rejectionReason = '';

  /** Allow resubmission toggle */
  allowResubmission = true;

  // =========================================================================
  // COMPUTED PROPERTIES
  // =========================================================================

  /** Whether all products on current page are selected */
  readonly allSelected = computed(() => {
    const products = this.pendingProducts();
    const selected = this.selectedProductIds();
    return products.length > 0 && products.every(p => selected.has(p.id));
  });

  /** Number of selected products */
  readonly selectedCount = computed(() => this.selectedProductIds().size);

  /** Whether bulk actions should be shown */
  readonly showBulkActions = computed(() => this.selectedCount() > 0);

  /** Pagination display text */
  readonly paginationText = computed(() => {
    const { page, limit, total } = this.pagination();
    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, total);
    return `${start}-${end} of ${total}`;
  });

  // =========================================================================
  // LIFECYCLE HOOKS
  // =========================================================================

  ngOnInit(): void {
    this.loadPendingProducts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // =========================================================================
  // DATA LOADING
  // =========================================================================

  /**
   * Load pending products
   * @description Fetches products awaiting approval
   */
  loadPendingProducts(): void {
    this.isLoading.set(true);

    this.productsService
      .getPendingProducts({
        page: this.pagination().page,
        limit: this.pagination().limit,
        sortOrder: this.sortOrder()
      })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (response: PaginatedResponse<PendingProductItem>) => {
          this.pendingProducts.set(response.items);
          this.pagination.update(p => ({
            ...p,
            total: response.total,
            totalPages: response.totalPages
          }));
          this.clearSelection();
        },
        error: (error) => {
          console.error('Error loading pending products:', error);
          this.snackBar.open('Failed to load pending products', 'Close', { duration: 3000 });
        }
      });
  }

  // =========================================================================
  // SELECTION HANDLERS
  // =========================================================================

  /**
   * Toggle all products selection
   */
  toggleSelectAll(): void {
    if (this.allSelected()) {
      this.selectedProductIds.set(new Set());
    } else {
      const allIds = new Set(this.pendingProducts().map(p => p.id));
      this.selectedProductIds.set(allIds);
    }
  }

  /**
   * Toggle single product selection
   * @param productId - Product ID to toggle
   */
  toggleSelection(productId: number): void {
    this.selectedProductIds.update(selected => {
      const newSet = new Set(selected);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  }

  /**
   * Check if a product is selected
   * @param productId - Product ID to check
   * @returns Whether the product is selected
   */
  isSelected(productId: number): boolean {
    return this.selectedProductIds().has(productId);
  }

  /**
   * Clear selection
   */
  clearSelection(): void {
    this.selectedProductIds.set(new Set());
  }

  // =========================================================================
  // PAGINATION HANDLERS
  // =========================================================================

  /**
   * Go to previous page
   */
  previousPage(): void {
    const current = this.pagination().page;
    if (current > 1) {
      this.pagination.update(p => ({ ...p, page: p.page - 1 }));
      this.loadPendingProducts();
    }
  }

  /**
   * Go to next page
   */
  nextPage(): void {
    const { page, totalPages } = this.pagination();
    if (page < totalPages) {
      this.pagination.update(p => ({ ...p, page: p.page + 1 }));
      this.loadPendingProducts();
    }
  }

  // =========================================================================
  // SORT HANDLERS
  // =========================================================================

  /**
   * Toggle sort order
   */
  toggleSortOrder(): void {
    this.sortOrder.update(o => (o === 'asc' ? 'desc' : 'asc'));
    this.pagination.update(p => ({ ...p, page: 1 }));
    this.loadPendingProducts();
  }

  // =========================================================================
  // APPROVAL ACTIONS
  // =========================================================================

  /**
   * Approve a product
   * @param product - Product to approve
   */
  approveProduct(product: PendingProductItem): void {
    this.productsService
      .approveProduct(product.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open(`"${product.name}" approved`, 'Close', { duration: 3000 });
          this.loadPendingProducts();
        },
        error: (error) => {
          console.error('Approval failed:', error);
          this.snackBar.open('Failed to approve product', 'Close', { duration: 3000 });
        }
      });
  }

  /**
   * Open rejection dialog
   * @param product - Product to reject
   */
  openRejectionDialog(product: PendingProductItem): void {
    this.rejectingProduct.set({
      productId: product.id,
      productName: product.name
    });
    this.rejectionReason = '';
    this.allowResubmission = true;
    this.showRejectionDialog.set(true);
  }

  /**
   * Close rejection dialog
   */
  closeRejectionDialog(): void {
    this.showRejectionDialog.set(false);
    this.rejectingProduct.set(null);
    this.rejectionReason = '';
  }

  /**
   * Confirm rejection
   */
  confirmRejection(): void {
    const product = this.rejectingProduct();
    if (!product || !this.rejectionReason.trim()) return;

    this.productsService
      .rejectProduct(product.productId, {
        reason: this.rejectionReason,
        allowResubmission: this.allowResubmission
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open(`"${product.productName}" rejected`, 'Close', { duration: 3000 });
          this.closeRejectionDialog();
          this.loadPendingProducts();
        },
        error: (error) => {
          console.error('Rejection failed:', error);
          this.snackBar.open('Failed to reject product', 'Close', { duration: 3000 });
        }
      });
  }

  // =========================================================================
  // BULK ACTIONS
  // =========================================================================

  /**
   * Bulk approve selected products
   */
  bulkApprove(): void {
    const productIds = Array.from(this.selectedProductIds());

    this.productsService
      .bulkApproval({
        productIds,
        action: 'approve',
        notifyVendors: true
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.snackBar.open(
            `${result.successful} products approved`,
            'Close',
            { duration: 3000 }
          );
          this.loadPendingProducts();
        },
        error: (error) => {
          console.error('Bulk approval failed:', error);
          this.snackBar.open('Bulk approval failed', 'Close', { duration: 3000 });
        }
      });
  }

  /**
   * Bulk reject selected products
   * @param reason - Rejection reason
   */
  bulkReject(reason: string): void {
    const productIds = Array.from(this.selectedProductIds());

    this.productsService
      .bulkApproval({
        productIds,
        action: 'reject',
        reason,
        notifyVendors: true
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.snackBar.open(
            `${result.successful} products rejected`,
            'Close',
            { duration: 3000 }
          );
          this.loadPendingProducts();
        },
        error: (error) => {
          console.error('Bulk rejection failed:', error);
          this.snackBar.open('Bulk rejection failed', 'Close', { duration: 3000 });
        }
      });
  }

  // =========================================================================
  // NAVIGATION
  // =========================================================================

  /**
   * View product details
   * @param productId - Product ID
   */
  viewProduct(productId: number): void {
    this.router.navigate(['/admin/products', productId]);
  }

  /**
   * Navigate back to product list
   */
  goBack(): void {
    this.router.navigate(['/admin/products']);
  }

  /**
   * Refresh data
   */
  refresh(): void {
    this.loadPendingProducts();
  }

  // =========================================================================
  // UTILITY METHODS
  // =========================================================================

  /**
   * Get urgency class based on days pending
   * @param days - Days pending
   * @returns CSS class name
   */
  getUrgencyClass(days: number): string {
    if (days >= 7) return 'urgent';
    if (days >= 3) return 'warning';
    return 'normal';
  }

  /**
   * Track products by ID for ngFor optimization
   * @param index - Index in the list
   * @param product - Product item
   * @returns Product ID
   */
  trackByProductId(index: number, product: PendingProductItem): number {
    return product.id;
  }
}
