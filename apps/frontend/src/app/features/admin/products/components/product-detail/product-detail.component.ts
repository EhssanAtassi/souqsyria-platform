/**
 * @file product-detail.component.ts
 * @description Product detail component for viewing complete product information.
 *              Shows product details, images, variants, sales metrics, and approval history.
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
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { Subject, takeUntil, finalize } from 'rxjs';

import { AdminProductsService } from '../../../services';
import { AdminStatusBadgeComponent, CurrencyFormatPipe } from '../../../shared';
import {
  ProductDetails,
  ProductApprovalStatus,
  ProductStatus
} from '../../../interfaces';
import { ProductStatusDialogComponent } from '../product-status-dialog/product-status-dialog.component';

/**
 * Product Detail Component
 * @description Displays complete product information including:
 * - Product overview with images
 * - Pricing and inventory details
 * - Vendor information
 * - Sales metrics
 * - Approval history
 * - Product variants
 *
 * @example
 * ```html
 * <!-- Routed via /admin/products/:id -->
 * <app-product-detail></app-product-detail>
 * ```
 */
@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatTabsModule,
    AdminStatusBadgeComponent,
    CurrencyFormatPipe
  ],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  // =========================================================================
  // DEPENDENCIES
  // =========================================================================

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productsService = inject(AdminProductsService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroy$ = new Subject<void>();

  // =========================================================================
  // STATE SIGNALS
  // =========================================================================

  /** Product ID from route */
  readonly productId = signal<number | null>(null);

  /** Loading state */
  readonly isLoading = signal(false);

  /** Error message */
  readonly errorMessage = signal<string | null>(null);

  /** Product details */
  readonly product = signal<ProductDetails | null>(null);

  /** Active tab index */
  readonly activeTab = signal(0);

  /** Selected image index for gallery */
  readonly selectedImageIndex = signal(0);

  /** Image modal state */
  readonly showImageModal = signal(false);

  // =========================================================================
  // COMPUTED PROPERTIES
  // =========================================================================

  /** Primary product image */
  readonly primaryImage = computed(() => {
    const product = this.product();
    if (!product?.images?.length) return null;
    const primary = product.images.find(img => img.isPrimary);
    return primary || product.images[0];
  });

  /** Product images sorted by order */
  readonly sortedImages = computed(() => {
    const product = this.product();
    if (!product?.images?.length) return [];
    return [...product.images].sort((a, b) => a.sortOrder - b.sortOrder);
  });

  /** Has sale price */
  readonly hasDiscount = computed(() => {
    const product = this.product();
    return product?.salePrice && product.salePrice < product.price;
  });

  /** Discount percentage */
  readonly discountPercent = computed(() => {
    const product = this.product();
    if (!product?.salePrice || product.salePrice >= product.price) return 0;
    return Math.round((1 - product.salePrice / product.price) * 100);
  });

  /** Stock status text */
  readonly stockStatus = computed(() => {
    const product = this.product();
    if (!product) return '';
    if (product.stock === 0) return 'Out of Stock';
    if (product.stock < 10) return 'Low Stock';
    return 'In Stock';
  });

  /** Stock status class */
  readonly stockClass = computed(() => {
    const product = this.product();
    if (!product) return '';
    if (product.stock === 0) return 'out';
    if (product.stock < 10) return 'low';
    return 'good';
  });

  // =========================================================================
  // LIFECYCLE HOOKS
  // =========================================================================

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = parseInt(params['id'], 10);
      if (!isNaN(id)) {
        this.productId.set(id);
        this.loadProductDetails();
      } else {
        this.router.navigate(['/admin/products']);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // =========================================================================
  // DATA LOADING
  // =========================================================================

  /**
   * Load product details
   * @description Fetches complete product information
   */
  loadProductDetails(): void {
    const productId = this.productId();
    if (!productId) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.productsService
      .getProductById(productId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (product) => {
          this.product.set(product);
        },
        error: (error) => {
          console.error('Error loading product:', error);
          this.errorMessage.set('Failed to load product details. Please try again.');
        }
      });
  }

  // =========================================================================
  // TAB HANDLING
  // =========================================================================

  /**
   * Handle tab change
   * @param index - New tab index
   */
  onTabChange(index: number): void {
    this.activeTab.set(index);
  }

  // =========================================================================
  // IMAGE GALLERY
  // =========================================================================

  /**
   * Select image in gallery
   * @param index - Image index
   */
  selectImage(index: number): void {
    this.selectedImageIndex.set(index);
  }

  /**
   * Open image modal
   * @param index - Image index to show
   */
  openImageModal(index: number): void {
    this.selectedImageIndex.set(index);
    this.showImageModal.set(true);
  }

  /**
   * Close image modal
   */
  closeImageModal(): void {
    this.showImageModal.set(false);
  }

  /**
   * Navigate to previous image
   */
  previousImage(): void {
    const images = this.sortedImages();
    const current = this.selectedImageIndex();
    const newIndex = current > 0 ? current - 1 : images.length - 1;
    this.selectedImageIndex.set(newIndex);
  }

  /**
   * Navigate to next image
   */
  nextImage(): void {
    const images = this.sortedImages();
    const current = this.selectedImageIndex();
    const newIndex = current < images.length - 1 ? current + 1 : 0;
    this.selectedImageIndex.set(newIndex);
  }

  // =========================================================================
  // PRODUCT ACTIONS
  // =========================================================================

  /**
   * Approve product
   */
  approveProduct(): void {
    const productId = this.productId();
    if (!productId) return;

    this.productsService
      .approveProduct(productId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('Product approved successfully', 'Close', { duration: 3000 });
          this.loadProductDetails();
        },
        error: (error) => {
          console.error('Approval failed:', error);
          this.snackBar.open('Failed to approve product', 'Close', { duration: 3000 });
        }
      });
  }

  /**
   * Reject product
   * @param reason - Rejection reason
   */
  rejectProduct(reason: string): void {
    const productId = this.productId();
    if (!productId || !reason) return;

    this.productsService
      .rejectProduct(productId, {
        reason,
        allowResubmission: true
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('Product rejected', 'Close', { duration: 3000 });
          this.loadProductDetails();
        },
        error: (error) => {
          console.error('Rejection failed:', error);
          this.snackBar.open('Failed to reject product', 'Close', { duration: 3000 });
        }
      });
  }

  /**
   * Open status change dialog
   */
  openStatusDialog(): void {
    const product = this.product();
    if (!product) return;

    const dialogRef = this.dialog.open(ProductStatusDialogComponent, {
      width: '450px',
      data: { product },
      disableClose: true
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result?.success) {
          this.snackBar.open('Product status updated', 'Close', { duration: 3000 });
          this.loadProductDetails();
        }
      });
  }

  /**
   * Toggle featured status
   */
  toggleFeatured(): void {
    const product = this.product();
    if (!product) return;

    const isFeatured = (product as any).isFeatured || false;

    this.productsService
      .setFeatured(product.id, !isFeatured)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open(
            isFeatured ? 'Removed from featured' : 'Added to featured',
            'Close',
            { duration: 3000 }
          );
          this.loadProductDetails();
        },
        error: (error) => {
          console.error('Toggle featured failed:', error);
          this.snackBar.open('Failed to update featured status', 'Close', { duration: 3000 });
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
   * Format date for display
   * @param date - Date to format
   * @returns Formatted date string
   */
  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
    this.loadProductDetails();
  }
}
