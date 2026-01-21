/**
 * @file inventory-manager.component.ts
 * @description Inventory management component for tracking product stock levels.
 *              Provides stock alerts, bulk updates, and inventory history.
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
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { Subject, takeUntil, finalize, debounceTime, distinctUntilChanged } from 'rxjs';

import { AdminProductsService } from '../../../services';
import { CurrencyFormatPipe } from '../../../shared';

/**
 * Inventory item interface
 * @description Represents a product's inventory information
 */
interface InventoryItem {
  id: number;
  productId: number;
  productName: string;
  sku: string;
  thumbnail: string | null;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  minStockLevel: number;
  maxStockLevel: number;
  reorderPoint: number;
  vendorName: string;
  categoryName: string;
  lastUpdated: Date;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstock';
}

/**
 * Stock filter options
 * @description Filter by stock status
 */
type StockFilter = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstock';

/**
 * Inventory Manager Component
 * @description Manages product inventory with stock tracking and alerts.
 *
 * @features
 * - Stock level overview with status indicators
 * - Low stock alerts and reorder suggestions
 * - Bulk stock updates
 * - Stock adjustment history
 * - Export inventory report
 *
 * @example
 * ```html
 * <!-- Routed via /admin/products/inventory -->
 * <app-inventory-manager></app-inventory-manager>
 * ```
 */
@Component({
  selector: 'app-inventory-manager',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatMenuModule,
    CurrencyFormatPipe
  ],
  templateUrl: './inventory-manager.component.html',
  styleUrl: './inventory-manager.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InventoryManagerComponent implements OnInit, OnDestroy {
  // =========================================================================
  // DEPENDENCIES
  // =========================================================================

  private readonly productsService = inject(AdminProductsService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroy$ = new Subject<void>();
  private readonly searchSubject$ = new Subject<string>();

  // =========================================================================
  // STATE SIGNALS
  // =========================================================================

  /** Loading state */
  readonly isLoading = signal(false);

  /** Inventory items */
  readonly inventoryItems = signal<InventoryItem[]>([]);

  /** Pagination state */
  readonly pagination = signal({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  /** Search term */
  readonly searchTerm = signal('');

  /** Stock filter */
  readonly stockFilter = signal<StockFilter>('all');

  /** Selected item IDs for bulk actions */
  readonly selectedIds = signal<Set<number>>(new Set());

  /** Show stock adjustment dialog */
  readonly showAdjustDialog = signal(false);

  /** Item being adjusted */
  readonly adjustingItem = signal<InventoryItem | null>(null);

  /** Adjustment type */
  adjustmentType: 'add' | 'remove' | 'set' = 'add';

  /** Adjustment quantity */
  adjustmentQuantity = 0;

  /** Adjustment reason */
  adjustmentReason = '';

  /** Sort configuration */
  readonly sortConfig = signal({
    field: 'currentStock' as keyof InventoryItem,
    direction: 'asc' as 'asc' | 'desc'
  });

  // =========================================================================
  // COMPUTED PROPERTIES
  // =========================================================================

  /** Inventory statistics */
  readonly stats = computed(() => {
    const items = this.inventoryItems();
    return {
      totalItems: items.length,
      outOfStock: items.filter(i => i.stockStatus === 'out_of_stock').length,
      lowStock: items.filter(i => i.stockStatus === 'low_stock').length,
      overstock: items.filter(i => i.stockStatus === 'overstock').length,
      totalValue: items.reduce((sum, i) => sum + i.currentStock, 0)
    };
  });

  /** Low stock items for alert */
  readonly lowStockItems = computed(() =>
    this.inventoryItems().filter(i =>
      i.stockStatus === 'low_stock' || i.stockStatus === 'out_of_stock'
    ).slice(0, 5)
  );

  /** All items selected */
  readonly allSelected = computed(() => {
    const items = this.inventoryItems();
    const selected = this.selectedIds();
    return items.length > 0 && items.every(i => selected.has(i.id));
  });

  /** Selected count */
  readonly selectedCount = computed(() => this.selectedIds().size);

  /** Show bulk actions */
  readonly showBulkActions = computed(() => this.selectedCount() > 0);

  /** Pagination text */
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
    // Setup search debounce
    this.searchSubject$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(term => {
        this.searchTerm.set(term);
        this.pagination.update(p => ({ ...p, page: 1 }));
        this.loadInventory();
      });

    this.loadInventory();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // =========================================================================
  // DATA LOADING
  // =========================================================================

  /**
   * Load inventory data
   * @description Fetches inventory items with current filters
   */
  loadInventory(): void {
    this.isLoading.set(true);

    this.productsService
      .getInventory({
        page: this.pagination().page,
        limit: this.pagination().limit,
        search: this.searchTerm(),
        stockStatus: this.stockFilter() !== 'all' ? this.stockFilter() : undefined,
        sortBy: this.sortConfig().field,
        sortOrder: this.sortConfig().direction
      })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (response) => {
          this.inventoryItems.set(response.items);
          this.pagination.update(p => ({
            ...p,
            total: response.total,
            totalPages: response.totalPages
          }));
          this.clearSelection();
        },
        error: (error) => {
          console.error('Error loading inventory:', error);
          this.snackBar.open('Failed to load inventory', 'Close', { duration: 3000 });
        }
      });
  }

  // =========================================================================
  // SEARCH & FILTER
  // =========================================================================

  /**
   * Handle search input
   * @param event - Input event
   */
  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject$.next(value);
  }

  /**
   * Clear search
   */
  clearSearch(): void {
    this.searchTerm.set('');
    this.pagination.update(p => ({ ...p, page: 1 }));
    this.loadInventory();
  }

  /**
   * Apply stock filter
   * @param filter - Stock filter value
   */
  applyStockFilter(filter: StockFilter): void {
    this.stockFilter.set(filter);
    this.pagination.update(p => ({ ...p, page: 1 }));
    this.loadInventory();
  }

  // =========================================================================
  // SORTING
  // =========================================================================

  /**
   * Sort by field
   * @param field - Field to sort by
   */
  sortBy(field: keyof InventoryItem): void {
    this.sortConfig.update(config => ({
      field,
      direction: config.field === field && config.direction === 'asc' ? 'desc' : 'asc'
    }));
    this.loadInventory();
  }

  /**
   * Get sort indicator
   * @param field - Field to check
   * @returns Sort indicator icon
   */
  getSortIndicator(field: keyof InventoryItem): string {
    const config = this.sortConfig();
    if (config.field !== field) return '';
    return config.direction === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  // =========================================================================
  // SELECTION
  // =========================================================================

  /**
   * Toggle all selection
   */
  toggleSelectAll(): void {
    if (this.allSelected()) {
      this.selectedIds.set(new Set());
    } else {
      const allIds = new Set(this.inventoryItems().map(i => i.id));
      this.selectedIds.set(allIds);
    }
  }

  /**
   * Toggle item selection
   * @param itemId - Item ID to toggle
   */
  toggleSelection(itemId: number): void {
    this.selectedIds.update(selected => {
      const newSet = new Set(selected);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }

  /**
   * Check if item is selected
   * @param itemId - Item ID to check
   * @returns Whether the item is selected
   */
  isSelected(itemId: number): boolean {
    return this.selectedIds().has(itemId);
  }

  /**
   * Clear selection
   */
  clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  // =========================================================================
  // STOCK ADJUSTMENT
  // =========================================================================

  /**
   * Open stock adjustment dialog
   * @param item - Item to adjust
   */
  openAdjustDialog(item: InventoryItem): void {
    this.adjustingItem.set(item);
    this.adjustmentType = 'add';
    this.adjustmentQuantity = 0;
    this.adjustmentReason = '';
    this.showAdjustDialog.set(true);
  }

  /**
   * Close adjustment dialog
   */
  closeAdjustDialog(): void {
    this.showAdjustDialog.set(false);
    this.adjustingItem.set(null);
  }

  /**
   * Submit stock adjustment
   */
  submitAdjustment(): void {
    const item = this.adjustingItem();
    if (!item || this.adjustmentQuantity <= 0) return;

    let newStock: number;
    switch (this.adjustmentType) {
      case 'add':
        newStock = item.currentStock + this.adjustmentQuantity;
        break;
      case 'remove':
        newStock = Math.max(0, item.currentStock - this.adjustmentQuantity);
        break;
      case 'set':
        newStock = this.adjustmentQuantity;
        break;
    }

    this.productsService
      .updateStock(item.productId, {
        quantity: newStock,
        reason: this.adjustmentReason || `Stock ${this.adjustmentType}: ${this.adjustmentQuantity}`
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('Stock updated successfully', 'Close', { duration: 3000 });
          this.closeAdjustDialog();
          this.loadInventory();
        },
        error: (error) => {
          console.error('Stock update failed:', error);
          this.snackBar.open('Failed to update stock', 'Close', { duration: 3000 });
        }
      });
  }

  // =========================================================================
  // BULK ACTIONS
  // =========================================================================

  /**
   * Bulk stock adjustment
   * @param type - Adjustment type
   * @param quantity - Quantity to adjust
   */
  bulkAdjustStock(type: 'add' | 'remove', quantity: number): void {
    const productIds = Array.from(this.selectedIds());

    this.productsService
      .bulkStockUpdate({
        productIds,
        adjustmentType: type,
        quantity,
        reason: `Bulk ${type}: ${quantity}`
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.snackBar.open(
            `Updated stock for ${result.successful} products`,
            'Close',
            { duration: 3000 }
          );
          this.loadInventory();
        },
        error: (error) => {
          console.error('Bulk stock update failed:', error);
          this.snackBar.open('Bulk stock update failed', 'Close', { duration: 3000 });
        }
      });
  }

  // =========================================================================
  // PAGINATION
  // =========================================================================

  /**
   * Go to previous page
   */
  previousPage(): void {
    const current = this.pagination().page;
    if (current > 1) {
      this.pagination.update(p => ({ ...p, page: p.page - 1 }));
      this.loadInventory();
    }
  }

  /**
   * Go to next page
   */
  nextPage(): void {
    const { page, totalPages } = this.pagination();
    if (page < totalPages) {
      this.pagination.update(p => ({ ...p, page: p.page + 1 }));
      this.loadInventory();
    }
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
   * Refresh data
   */
  refresh(): void {
    this.loadInventory();
  }

  // =========================================================================
  // EXPORT
  // =========================================================================

  /**
   * Export inventory report
   * @param format - Export format
   */
  exportInventory(format: 'csv' | 'xlsx'): void {
    this.productsService
      .exportInventory({
        format,
        stockStatus: this.stockFilter() !== 'all' ? this.stockFilter() : undefined
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `inventory-${new Date().toISOString().split('T')[0]}.${format}`;
          a.click();
          window.URL.revokeObjectURL(url);
          this.snackBar.open('Export completed', 'Close', { duration: 3000 });
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
   * Get stock status class
   * @param status - Stock status
   * @returns CSS class name
   */
  getStockStatusClass(status: string): string {
    const classMap: Record<string, string> = {
      in_stock: 'success',
      low_stock: 'warning',
      out_of_stock: 'danger',
      overstock: 'info'
    };
    return classMap[status] || 'secondary';
  }

  /**
   * Get stock status label
   * @param status - Stock status
   * @returns Status label
   */
  getStockStatusLabel(status: string): string {
    const labelMap: Record<string, string> = {
      in_stock: 'In Stock',
      low_stock: 'Low Stock',
      out_of_stock: 'Out of Stock',
      overstock: 'Overstock'
    };
    return labelMap[status] || status;
  }

  /**
   * Format date
   * @param date - Date to format
   * @returns Formatted date string
   */
  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Track items by ID for ngFor optimization
   * @param index - Index in the list
   * @param item - Inventory item
   * @returns Item ID
   */
  trackByItemId(index: number, item: InventoryItem): number {
    return item.id;
  }
}
