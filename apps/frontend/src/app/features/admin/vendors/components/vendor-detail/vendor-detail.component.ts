/**
 * @file vendor-detail.component.ts
 * @description Vendor detail view component for admin dashboard.
 *              Displays comprehensive vendor information with tabs for different sections.
 * @module AdminDashboard/Vendors/Components
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
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { Subject, takeUntil, finalize, switchMap, filter } from 'rxjs';

import { AdminVendorsService } from '../../../services';
import { CurrencyFormatPipe } from '../../../shared';
import {
  VendorDetails,
  VendorVerificationStatus,
  VendorAccountStatus,
  UpdateVendorCommissionRequest
} from '../../../interfaces';

/**
 * Vendor performance data structure
 */
interface VendorPerformance {
  sales: {
    totalRevenue: number;
    orderCount: number;
    itemsSold: number;
    averageOrderValue: number;
    revenueGrowth: number;
  };
  ratings: {
    averageRating: number;
    totalReviews: number;
    ratingDistribution: { stars: number; count: number }[];
  };
  fulfillment: {
    fulfillmentRate: number;
    onTimeDeliveryRate: number;
    returnRate: number;
    cancelRate: number;
  };
  topProducts: {
    productId: number;
    name: string;
    unitsSold: number;
    revenue: number;
  }[];
}

/**
 * Vendor Detail Component
 * @description Displays comprehensive vendor information including profile,
 *              verification history, commission settings, and performance metrics.
 *
 * @features
 * - Vendor profile overview
 * - Verification status and history
 * - Commission rate management
 * - Performance metrics dashboard
 * - Account status management
 * - Tabbed navigation
 *
 * @example
 * ```html
 * <!-- Routed via /admin/vendors/:id -->
 * <app-vendor-detail></app-vendor-detail>
 * ```
 */
@Component({
  selector: 'app-vendor-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatMenuModule,
    MatDividerModule,
    CurrencyFormatPipe
  ],
  templateUrl: './vendor-detail.component.html',
  styleUrl: './vendor-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VendorDetailComponent implements OnInit, OnDestroy {
  // =========================================================================
  // DEPENDENCIES
  // =========================================================================

  private readonly vendorsService = inject(AdminVendorsService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroy$ = new Subject<void>();

  // =========================================================================
  // STATE SIGNALS
  // =========================================================================

  /** Loading state */
  readonly isLoading = signal(true);

  /** Vendor details */
  readonly vendor = signal<VendorDetails | null>(null);

  /** Vendor performance data */
  readonly performance = signal<VendorPerformance | null>(null);

  /** Active tab */
  readonly activeTab = signal<'overview' | 'verification' | 'commission' | 'performance'>('overview');

  /** Show commission edit dialog */
  readonly showCommissionDialog = signal(false);

  /** Show status change dialog */
  readonly showStatusDialog = signal(false);

  /** Show verification action dialog */
  readonly showVerificationDialog = signal(false);

  /** Commission form values */
  newCommissionRate = 0;
  commissionEffectiveDate = '';
  commissionReason = '';

  /** Status change values */
  newStatus: VendorAccountStatus = 'active';
  statusReason = '';

  /** Verification action values */
  verificationAction: 'approve' | 'reject' | 'request_docs' = 'approve';
  verificationNotes = '';
  requestedDocuments: string[] = [];

  /** Loading state for actions */
  readonly isProcessing = signal(false);

  // =========================================================================
  // COMPUTED PROPERTIES
  // =========================================================================

  /** Vendor ID */
  readonly vendorId = computed(() => {
    const vendorData = this.vendor();
    return vendorData?.id || 0;
  });

  /** Can edit commission */
  readonly canEditCommission = computed(() => {
    const vendorData = this.vendor();
    return vendorData?.verificationStatus === 'approved' && vendorData?.accountStatus === 'active';
  });

  /** Can change status */
  readonly canChangeStatus = computed(() => {
    const vendorData = this.vendor();
    return vendorData && vendorData.accountStatus !== 'banned';
  });

  /** Has pending verification */
  readonly hasPendingVerification = computed(() => {
    const vendorData = this.vendor();
    if (!vendorData) return false;
    const pendingStatuses: VendorVerificationStatus[] = ['pending', 'under_review', 'documents_requested', 'documents_resubmitted'];
    return pendingStatuses.includes(vendorData.verificationStatus);
  });

  // =========================================================================
  // CONSTANTS
  // =========================================================================

  /** Account status options */
  readonly accountStatuses: { value: VendorAccountStatus; label: string }[] = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'banned', label: 'Banned' }
  ];

  /** Document types for verification */
  readonly documentTypes = [
    { value: 'business_license', label: 'Business License' },
    { value: 'tax_certificate', label: 'Tax Certificate' },
    { value: 'identity_document', label: 'Identity Document' },
    { value: 'bank_statement', label: 'Bank Statement' },
    { value: 'address_proof', label: 'Address Proof' }
  ];

  // =========================================================================
  // LIFECYCLE HOOKS
  // =========================================================================

  ngOnInit(): void {
    // Load vendor when route param changes
    this.route.params
      .pipe(
        filter(params => !!params['id']),
        switchMap(params => {
          this.isLoading.set(true);
          return this.vendorsService.getVendorById(+params['id']);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (vendorData) => {
          this.vendor.set(vendorData);
          this.newCommissionRate = vendorData.commission.currentRate;
          this.isLoading.set(false);
          this.loadPerformance();
        },
        error: (error) => {
          console.error('Error loading vendor:', error);
          this.snackBar.open('Failed to load vendor details', 'Close', { duration: 3000 });
          this.isLoading.set(false);
          this.router.navigate(['/admin/vendors']);
        }
      });

    // Check for tab query param
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const tab = params['tab'];
        if (tab && ['overview', 'verification', 'commission', 'performance'].includes(tab)) {
          this.activeTab.set(tab);
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
   * Load vendor performance data
   */
  loadPerformance(): void {
    const vendorData = this.vendor();
    if (!vendorData) return;

    this.vendorsService
      .getVendorPerformance(vendorData.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.performance.set(data);
        },
        error: (error) => {
          console.error('Error loading performance:', error);
        }
      });
  }

  /**
   * Refresh vendor data
   */
  refresh(): void {
    const vendorData = this.vendor();
    if (!vendorData) return;

    this.isLoading.set(true);
    this.vendorsService
      .getVendorById(vendorData.id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (data) => {
          this.vendor.set(data);
          this.snackBar.open('Data refreshed', 'Close', { duration: 2000 });
        },
        error: (error) => {
          console.error('Refresh failed:', error);
          this.snackBar.open('Failed to refresh data', 'Close', { duration: 3000 });
        }
      });
  }

  // =========================================================================
  // NAVIGATION
  // =========================================================================

  /**
   * Go back to vendor list
   */
  goBack(): void {
    this.router.navigate(['/admin/vendors']);
  }

  /**
   * Set active tab
   * @param tab - Tab to activate
   */
  setActiveTab(tab: 'overview' | 'verification' | 'commission' | 'performance'): void {
    this.activeTab.set(tab);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge'
    });
  }

  // =========================================================================
  // COMMISSION MANAGEMENT
  // =========================================================================

  /**
   * Open commission edit dialog
   */
  openCommissionDialog(): void {
    const vendorData = this.vendor();
    if (!vendorData) return;

    this.newCommissionRate = vendorData.commission.currentRate;
    this.commissionEffectiveDate = new Date().toISOString().split('T')[0];
    this.commissionReason = '';
    this.showCommissionDialog.set(true);
  }

  /**
   * Close commission dialog
   */
  closeCommissionDialog(): void {
    this.showCommissionDialog.set(false);
  }

  /**
   * Submit commission update
   */
  submitCommissionUpdate(): void {
    const vendorData = this.vendor();
    if (!vendorData) return;

    this.isProcessing.set(true);

    const request: UpdateVendorCommissionRequest = {
      commissionRate: this.newCommissionRate,
      effectiveDate: this.commissionEffectiveDate,
      reason: this.commissionReason || undefined
    };

    this.vendorsService
      .updateCommission(vendorData.id, request)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isProcessing.set(false))
      )
      .subscribe({
        next: (updatedVendor) => {
          this.vendor.set(updatedVendor);
          this.snackBar.open('Commission rate updated successfully', 'Close', { duration: 3000 });
          this.closeCommissionDialog();
        },
        error: (error) => {
          console.error('Commission update failed:', error);
          this.snackBar.open('Failed to update commission rate', 'Close', { duration: 3000 });
        }
      });
  }

  // =========================================================================
  // STATUS MANAGEMENT
  // =========================================================================

  /**
   * Open status change dialog
   */
  openStatusDialog(): void {
    const vendorData = this.vendor();
    if (!vendorData) return;

    this.newStatus = vendorData.accountStatus;
    this.statusReason = '';
    this.showStatusDialog.set(true);
  }

  /**
   * Close status dialog
   */
  closeStatusDialog(): void {
    this.showStatusDialog.set(false);
  }

  /**
   * Submit status change
   */
  submitStatusChange(): void {
    const vendorData = this.vendor();
    if (!vendorData) return;

    const requiresReason = this.newStatus === 'suspended' || this.newStatus === 'banned';
    if (requiresReason && !this.statusReason.trim()) {
      this.snackBar.open('Please provide a reason', 'Close', { duration: 3000 });
      return;
    }

    this.isProcessing.set(true);

    this.vendorsService
      .updateAccountStatus(vendorData.id, this.newStatus, this.statusReason || undefined)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isProcessing.set(false))
      )
      .subscribe({
        next: (updatedVendor) => {
          this.vendor.set(updatedVendor);
          this.snackBar.open('Account status updated successfully', 'Close', { duration: 3000 });
          this.closeStatusDialog();
        },
        error: (error) => {
          console.error('Status update failed:', error);
          this.snackBar.open('Failed to update account status', 'Close', { duration: 3000 });
        }
      });
  }

  // =========================================================================
  // VERIFICATION MANAGEMENT
  // =========================================================================

  /**
   * Open verification action dialog
   * @param action - Action type
   */
  openVerificationDialog(action: 'approve' | 'reject' | 'request_docs'): void {
    this.verificationAction = action;
    this.verificationNotes = '';
    this.requestedDocuments = [];
    this.showVerificationDialog.set(true);
  }

  /**
   * Close verification dialog
   */
  closeVerificationDialog(): void {
    this.showVerificationDialog.set(false);
  }

  /**
   * Toggle document selection
   * @param docType - Document type value
   */
  toggleDocument(docType: string): void {
    const index = this.requestedDocuments.indexOf(docType);
    if (index > -1) {
      this.requestedDocuments.splice(index, 1);
    } else {
      this.requestedDocuments.push(docType);
    }
  }

  /**
   * Submit verification action
   */
  submitVerificationAction(): void {
    const vendorData = this.vendor();
    if (!vendorData) return;

    this.isProcessing.set(true);

    let action$;

    switch (this.verificationAction) {
      case 'approve':
        action$ = this.vendorsService.approveVendor(vendorData.id, { notes: this.verificationNotes });
        break;
      case 'reject':
        if (!this.verificationNotes.trim()) {
          this.snackBar.open('Please provide a rejection reason', 'Close', { duration: 3000 });
          this.isProcessing.set(false);
          return;
        }
        action$ = this.vendorsService.rejectVendor(vendorData.id, { reason: this.verificationNotes });
        break;
      case 'request_docs':
        if (this.requestedDocuments.length === 0) {
          this.snackBar.open('Please select documents to request', 'Close', { duration: 3000 });
          this.isProcessing.set(false);
          return;
        }
        action$ = this.vendorsService.requestDocuments(vendorData.id, {
          documents: this.requestedDocuments,
          notes: this.verificationNotes,
          notifyVendor: true
        });
        break;
    }

    action$
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isProcessing.set(false))
      )
      .subscribe({
        next: (updatedVendor) => {
          this.vendor.set(updatedVendor);
          const actionLabel = this.verificationAction === 'approve' ? 'approved' :
                             this.verificationAction === 'reject' ? 'rejected' : 'documents requested';
          this.snackBar.open(`Vendor ${actionLabel} successfully`, 'Close', { duration: 3000 });
          this.closeVerificationDialog();
        },
        error: (error) => {
          console.error('Verification action failed:', error);
          this.snackBar.open('Failed to process verification', 'Close', { duration: 3000 });
        }
      });
  }

  // =========================================================================
  // UTILITY METHODS
  // =========================================================================

  /**
   * Get verification status class
   * @param status - Verification status
   * @returns CSS class name
   */
  getVerificationClass(status: VendorVerificationStatus): string {
    const classMap: Record<VendorVerificationStatus, string> = {
      pending: 'warning',
      under_review: 'info',
      documents_requested: 'warning',
      documents_resubmitted: 'info',
      requires_resubmission: 'warning',
      business_verification: 'info',
      final_review: 'info',
      approved: 'success',
      rejected: 'danger',
      suspended: 'danger',
      expired: 'secondary',
      revoked: 'danger'
    };
    return classMap[status] || 'secondary';
  }

  /**
   * Get verification status label
   * @param status - Verification status
   * @returns Human-readable label
   */
  getVerificationLabel(status: VendorVerificationStatus): string {
    const labelMap: Record<VendorVerificationStatus, string> = {
      pending: 'Pending Review',
      under_review: 'Under Review',
      documents_requested: 'Documents Requested',
      documents_resubmitted: 'Documents Resubmitted',
      requires_resubmission: 'Requires Resubmission',
      business_verification: 'Business Verification',
      final_review: 'Final Review',
      approved: 'Approved',
      rejected: 'Rejected',
      suspended: 'Suspended',
      expired: 'Expired',
      revoked: 'Revoked'
    };
    return labelMap[status] || status;
  }

  /**
   * Get account status class
   * @param status - Account status
   * @returns CSS class name
   */
  getAccountClass(status: VendorAccountStatus): string {
    const classMap: Record<VendorAccountStatus, string> = {
      active: 'success',
      inactive: 'secondary',
      suspended: 'warning',
      banned: 'danger'
    };
    return classMap[status] || 'secondary';
  }

  /**
   * Get account status label
   * @param status - Account status
   * @returns Human-readable label
   */
  getAccountLabel(status: VendorAccountStatus): string {
    const labelMap: Record<VendorAccountStatus, string> = {
      active: 'Active',
      inactive: 'Inactive',
      suspended: 'Suspended',
      banned: 'Banned'
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Format short date
   * @param date - Date to format
   * @returns Formatted date string
   */
  formatShortDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  /**
   * Get rating stars array
   * @param rating - Rating value (0-5)
   * @returns Array of star types
   */
  getRatingStars(rating: number): string[] {
    const stars: string[] = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push('star');
    }
    if (hasHalfStar) {
      stars.push('star_half');
    }
    while (stars.length < 5) {
      stars.push('star_border');
    }

    return stars;
  }
}
