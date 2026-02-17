/**
 * @file product-list.component.ts
 * @description Product listing component for admin product management.
 *              Provides paginated product list with filtering, bulk actions,
 *              and quick status management.
 * @module AdminDashboard/Products/Components
 */

import {
  Component,
  OnInit,
  DestroyRef,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  Subject,
  debounceTime,
  distinctUntilChanged,
  finalize
} from 'rxjs';

import { AdminProductsService } from '../../../services';
import { AdminProductsApiService, AdminProductListItem } from '../../services/admin-products-api.service';
import { AdminStatusBadgeComponent, CurrencyFormatPipe } from '../../../shared';
import {
  ProductListItem,
  ProductListQuery,
  ProductApprovalStatus,
  ProductStatus,
  ProductSortField,
  PaginatedResponse
} from '../../../interfaces';
import { ProductStatusDialogComponent } from '../product-status-dialog/product-status-dialog.component';

/**
 * Product statistics for header display
 */
interface ProductStatistics {
  /** Total products */
  total: number;
  /** Active products */
  active: number;
  /** Inactive products */
  inactive: number;
  /** Out of stock products */
  outOfStock: number;
  /** Pending approval */
  pendingApproval: number;
  /** Low stock count */
  lowStockCount: number;
}

/**
 * Filter state for product listing
 */
interface ProductFilters {
  /** Approval status filter */
  approvalStatus?: ProductApprovalStatus | '';
  /** Product status filter */
  status?: ProductStatus | '';
  /** Category ID filter */
  categoryId?: number;
  /** Vendor ID filter */
  vendorId?: number;
  /** Low stock filter */
  lowStock?: boolean;
}

/**
 * Product List Component
 * @description Main component for product administration featuring:
 * - Paginated product listing with search and filters
 * - Bulk actions (activate, deactivate, approve, reject)
 * - Quick status management
 * - Export functionality
 *
 * @example
 * ```html
 * <!-- Routed via /admin/products -->
 * <app-product-list></app-product-list>
 * ```
 */
@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatDialogModule,
    MatSnackBarModule,
    MatMenuModule,
    MatTooltipModule,
    AdminStatusBadgeComponent,
    CurrencyFormatPipe
  ],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductListComponent implements OnInit {
  // =========================================================================
  // DEPENDENCIES
  // =========================================================================

  private readonly productsService = inject(AdminProductsService);
  private readonly adminProductsApi = inject(AdminProductsApiService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchSubject$ = new Subject<string>();

  // =========================================================================
  // STATE SIGNALS
  // =========================================================================

  /** Loading state */
  readonly isLoading = signal(false);

  /** Loading state for statistics */
  readonly isLoadingStats = signal(false);

  /** Products list */
  readonly products = signal<ProductListItem[]>([]);

  /** Pagination state */
  readonly pagination = signal({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  /** Product statistics */
  readonly statistics = signal<ProductStatistics | null>(null);

  /** Selected product IDs for bulk actions */
  readonly selectedProductIds = signal<Set<number>>(new Set());

  /** Search term */
  readonly searchTerm = signal('');

  /** Current filters */
  readonly currentFilters = signal<ProductFilters>({});

  /** Sort field - typed to ProductSortField for type safety */
  readonly sortField = signal<ProductSortField>('createdAt');

  /** Sort order */
  readonly sortOrder = signal<'asc' | 'desc'>('desc');

  // =========================================================================
  // COMPUTED PROPERTIES
  // =========================================================================

  /** Whether all products on current page are selected */
  readonly allSelected = computed(() => {
    const products = this.products();
    const selected = this.selectedProductIds();
    return products.length > 0 && products.every(p => selected.has(p.id));
  });

  /** Whether some products are selected */
  readonly someSelected = computed(() => {
    const selected = this.selectedProductIds();
    return selected.size > 0 && !this.allSelected();
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
  // FILTER OPTIONS
  // =========================================================================

  /** Approval status options */
  readonly approvalStatusOptions: { value: ProductApprovalStatus | ''; label: string }[] = [
    { value: '', label: 'All Approvals' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'requires_changes', label: 'Requires Changes' }
  ];

  /** Product status options */
  readonly statusOptions: { value: ProductStatus | ''; label: string }[] = [
    { value: '', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'out_of_stock', label: 'Out of Stock' },
    { value: 'discontinued', label: 'Discontinued' },
    { value: 'draft', label: 'Draft' }
  ];

  // =========================================================================
  // LIFECYCLE HOOKS
  // =========================================================================

  ngOnInit(): void {
    this.setupSearchDebounce();
    this.loadProducts();
    this.loadStatistics();
  }

  // =========================================================================
  // SEARCH SETUP
  // =========================================================================

  /**
   * Set up debounced search
   * @description Debounces search input to prevent excessive API calls
   */
  private setupSearchDebounce(): void {
    this.searchSubject$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(term => {
        this.searchTerm.set(term);
        this.pagination.update(p => ({ ...p, page: 1 }));
        this.loadProducts();
      });
  }

  // =========================================================================
  // DATA LOADING
  // =========================================================================

  /**
   * Load products with current filters
   * @description Fetches paginated product list based on current query parameters
   */
  loadProducts(): void {
    this.isLoading.set(true);

    const params = {
      page: this.pagination().page,
      limit: this.pagination().limit,
    };

    // Add search term
    const search = this.searchTerm();
    if (search) {
      Object.assign(params, { search });
    }

    // Add filters from currentFilters (map to admin API params)
    const filters = this.currentFilters();
    if (filters.categoryId) {
      Object.assign(params, { categoryId: filters.categoryId });
    }
    if (filters.vendorId) {
      Object.assign(params, { vendorId: filters.vendorId });
    }

    // Use admin API service
    this.adminProductsApi
      .getProducts(params)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (response) => {
          // Map backend response to component state
          this.products.set(response.data as any);
          this.pagination.update(p => ({
            ...p,
            total: response.meta.total,
            totalPages: response.meta.totalPages
          }));
          this.clearSelection();
        },
        error: (error) => {
          console.error('Error loading products:', error);
          this.snackBar.open('Failed to load products', 'Close', { duration: 3000 });
        }
      });
  }

  /**
   * Load product statistics
   * @description Fetches aggregated product statistics for header display
   */
  loadStatistics(): void {
    this.isLoadingStats.set(true);

    this.productsService
      .getProductStatistics()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoadingStats.set(false))
      )
      .subscribe({
        next: (stats) => {
          this.statistics.set(stats);
        },
        error: (error) => {
          console.error('Error loading statistics:', error);
        }
      });
  }

  // =========================================================================
  // SEARCH & FILTER HANDLERS
  // =========================================================================

  /**
   * Handle search input
   * @param event - Input event
   */
  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject$.next(value);
  }

  /**
   * Clear search input
   * @description Clears the search term and resets the search
   */
  clearSearch(): void {
    this.searchSubject$.next('');
  }

  /**
   * Handle filter change
   * @param filterName - Name of the filter
   * @param value - New filter value
   */
  onFilterChange(filterName: keyof ProductFilters, value: any): void {
    this.currentFilters.update(f => ({
      ...f,
      [filterName]: value || undefined
    }));
    this.pagination.update(p => ({ ...p, page: 1 }));
    this.loadProducts();
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.currentFilters.set({});
    this.searchTerm.set('');
    this.pagination.update(p => ({ ...p, page: 1 }));
    this.loadProducts();
  }

  /**
   * Handle sort change
   * @param field - Sort field (typed for compile-time safety)
   */
  onSortChange(field: ProductSortField): void {
    if (this.sortField() === field) {
      this.sortOrder.update(o => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortField.set(field);
      this.sortOrder.set('desc');
    }
    this.loadProducts();
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
      const allIds = new Set(this.products().map(p => p.id));
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
   * Go to specific page
   * @param page - Page number
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.pagination().totalPages) {
      this.pagination.update(p => ({ ...p, page }));
      this.loadProducts();
    }
  }

  /**
   * Go to previous page
   */
  previousPage(): void {
    this.goToPage(this.pagination().page - 1);
  }

  /**
   * Go to next page
   */
  nextPage(): void {
    this.goToPage(this.pagination().page + 1);
  }

  /**
   * Change page size
   * @param size - New page size
   */
  changePageSize(size: number): void {
    this.pagination.update(p => ({ ...p, limit: size, page: 1 }));
    this.loadProducts();
  }

  // =========================================================================
  // BULK ACTIONS
  // =========================================================================

  /**
   * Bulk activate selected products
   */
  bulkActivate(): void {
    this.performBulkStatusUpdate({ isActive: true });
  }

  /**
   * Bulk deactivate selected products
   */
  bulkDeactivate(): void {
    this.performBulkStatusUpdate({ isActive: false });
  }

  /**
   * Bulk publish selected products
   */
  bulkPublish(): void {
    this.performBulkStatusUpdate({ isPublished: true });
  }

  /**
   * Bulk unpublish selected products
   */
  bulkUnpublish(): void {
    this.performBulkStatusUpdate({ isPublished: false });
  }

  /**
   * Bulk approve selected products (legacy - kept for compatibility)
   */
  bulkApprove(): void {
    const productIds = Array.from(this.selectedProductIds());

    this.productsService
      .bulkApproval({
        productIds,
        action: 'approve',
        notifyVendors: true
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.snackBar.open(
            `${result.successful} products approved`,
            'Close',
            { duration: 3000 }
          );
          this.loadProducts();
          this.loadStatistics();
        },
        error: (error) => {
          console.error('Bulk approval failed:', error);
          this.snackBar.open('Bulk approval failed', 'Close', { duration: 3000 });
        }
      });
  }

  /**
   * Perform bulk status update using admin API
   * @param statusUpdate - Status fields to update
   */
  private performBulkStatusUpdate(statusUpdate: { isActive?: boolean; isPublished?: boolean }): void {
    const productIds = Array.from(this.selectedProductIds());

    this.adminProductsApi
      .bulkUpdateStatus({
        ids: productIds,
        ...statusUpdate
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.snackBar.open(result.message, 'Close', { duration: 3000 });
          this.loadProducts();
          this.loadStatistics();
        },
        error: (error) => {
          console.error('Bulk status update failed:', error);
          this.snackBar.open('Bulk update failed', 'Close', { duration: 3000 });
        }
      });
  }

  // =========================================================================
  // SINGLE PRODUCT ACTIONS
  // =========================================================================

  /**
   * View product details
   * @param productId - Product ID
   */
  viewProduct(productId: number): void {
    this.router.navigate(['/admin/products', productId]);
  }

  /**
   * Quick approve a product
   * @param product - Product to approve
   * @param event - Mouse event (to prevent row click)
   */
  quickApprove(product: ProductListItem, event: MouseEvent): void {
    event.stopPropagation();

    this.productsService
      .approveProduct(product.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.snackBar.open('Product approved', 'Close', { duration: 3000 });
          this.loadProducts();
          this.loadStatistics();
        },
        error: (error) => {
          console.error('Approval failed:', error);
          this.snackBar.open('Approval failed', 'Close', { duration: 3000 });
        }
      });
  }

  /**
   * Open status change dialog
   * @param product - Product to update
   * @param event - Mouse event (to prevent row click)
   */
  openStatusDialog(product: ProductListItem, event: MouseEvent): void {
    event.stopPropagation();

    const dialogRef = this.dialog.open(ProductStatusDialogComponent, {
      width: '450px',
      data: { product },
      disableClose: true
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        if (result?.success) {
          this.snackBar.open('Product status updated', 'Close', { duration: 3000 });
          this.loadProducts();
          this.loadStatistics();
        }
      });
  }

  /**
   * Toggle featured status
   * @param product - Product to toggle
   * @param event - Mouse event (to prevent row click)
   */
  toggleFeatured(product: ProductListItem, event: MouseEvent): void {
    event.stopPropagation();

    // isFeatured is now properly typed in ProductListItem interface
    const isFeatured = product.isFeatured ?? false;

    this.productsService
      .setFeatured(product.id, !isFeatured)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.snackBar.open(
            isFeatured ? 'Removed from featured' : 'Added to featured',
            'Close',
            { duration: 3000 }
          );
          this.loadProducts();
        },
        error: (error) => {
          console.error('Toggle featured failed:', error);
          this.snackBar.open('Failed to update featured status', 'Close', { duration: 3000 });
        }
      });
  }

  // =========================================================================
  // EXPORT
  // =========================================================================

  /**
   * Export products to file
   * @param format - Export format (csv or xlsx)
   */
  exportProducts(format: 'csv' | 'xlsx'): void {
    const filters = this.currentFilters();
    const query: ProductListQuery = {
      // Only include non-empty filter values
      ...(filters.approvalStatus ? { approvalStatus: filters.approvalStatus } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
      ...(filters.vendorId ? { vendorId: filters.vendorId } : {}),
      ...(filters.lowStock !== undefined ? { lowStock: filters.lowStock } : {})
    };
    const search = this.searchTerm();
    if (search) {
      query.search = search;
    }

    this.productsService
      .exportProducts(format, query)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `products-${new Date().toISOString().split('T')[0]}.${format}`;
          link.click();
          window.URL.revokeObjectURL(url);
        },
        error: (error) => {
          console.error('Export failed:', error);
          this.snackBar.open('Export failed', 'Close', { duration: 3000 });
        }
      });
  }

  // =========================================================================
  // UTILITY METHODS
  // =========================================================================

  /**
   * Get approval status badge variant
   * @param status - Approval status
   * @returns Badge variant
   */
  getApprovalVariant(status: ProductApprovalStatus): string {
    const variantMap: Record<ProductApprovalStatus, string> = {
      pending: 'warning',
      approved: 'success',
      rejected: 'danger',
      requires_changes: 'info'
    };
    return variantMap[status] || 'secondary';
  }

  /**
   * Get product status badge variant
   * @param status - Product status
   * @returns Badge variant
   */
  getStatusVariant(status: ProductStatus): string {
    const variantMap: Record<ProductStatus, string> = {
      active: 'success',
      inactive: 'secondary',
      out_of_stock: 'warning',
      discontinued: 'danger',
      draft: 'info'
    };
    return variantMap[status] || 'secondary';
  }

  /**
   * Get sort icon
   * @param field - Field to check
   * @returns Icon name
   */
  getSortIcon(field: string): string {
    if (this.sortField() !== field) {
      return 'unfold_more';
    }
    return this.sortOrder() === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  /**
   * Refresh data
   */
  refresh(): void {
    this.loadProducts();
    this.loadStatistics();
  }

  /**
   * Track products by ID for ngFor optimization
   * @param index - Index in the list
   * @param product - Product item
   * @returns Product ID
   */
  trackByProductId(index: number, product: ProductListItem): number {
    return product.id;
  }
}
