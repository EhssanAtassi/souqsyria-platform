/**
 * Verification Queue Component
 * @description Manages vendor verification workflow - review, approve, reject, request documents
 * @module VendorsModule
 */
import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';

import { AdminVendorsService } from '../../../services/admin-vendors.service';
import {
  VendorVerificationItem,
  VendorVerificationStatus,
  UpdateVendorVerificationRequest,
  PaginatedResponse
} from '../../../interfaces/api-response.interface';
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';

/**
 * Statistics interface for verification queue
 * @description Tracks counts by verification status
 */
interface VerificationStats {
  /** Total pending verifications */
  pending: number;
  /** Under review count */
  underReview: number;
  /** Documents requested count */
  documentsRequested: number;
  /** Resubmissions count */
  resubmissions: number;
  /** Average wait time in days */
  avgWaitDays: number;
}

/**
 * Document type definition for request
 * @description Available document types for verification
 */
interface DocumentType {
  /** Document identifier */
  id: string;
  /** Display label */
  label: string;
  /** Whether it's selected */
  selected: boolean;
}

/**
 * Verification Queue Component
 * @description Handles vendor verification workflow with filtering and batch operations
 */
@Component({
  selector: 'app-verification-queue',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatSnackBarModule,
    MatTooltipModule,
    MatMenuModule,
    CurrencyFormatPipe
  ],
  templateUrl: './verification-queue.component.html',
  styleUrls: ['./verification-queue.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VerificationQueueComponent implements OnInit, OnDestroy {
  // ===========================================================================
  // DEPENDENCIES
  // ===========================================================================
  private readonly vendorsService = inject(AdminVendorsService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  // ===========================================================================
  // STATE SIGNALS
  // ===========================================================================

  /** List of pending verifications */
  readonly verifications = signal<VendorVerificationItem[]>([]);

  /** Loading state */
  readonly isLoading = signal<boolean>(true);

  /** Processing state for actions */
  readonly isProcessing = signal<boolean>(false);

  /** Statistics for the queue */
  readonly stats = signal<VerificationStats>({
    pending: 0,
    underReview: 0,
    documentsRequested: 0,
    resubmissions: 0,
    avgWaitDays: 0
  });

  /** Current status filter */
  readonly statusFilter = signal<VendorVerificationStatus | 'all'>('all');

  /** Sort option */
  readonly sortBy = signal<string>('oldest');

  /** Search term */
  readonly searchTerm = signal<string>('');

  /** Pagination state */
  readonly pagination = signal<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0
  });

  /** Selected verification for detail view */
  readonly selectedVerification = signal<VendorVerificationItem | null>(null);

  /** Show detail dialog */
  readonly showDetailDialog = signal<boolean>(false);

  /** Show action dialog */
  readonly showActionDialog = signal<boolean>(false);

  /** Current action type */
  readonly actionType = signal<'approve' | 'reject' | 'request_documents'>('approve');

  /** Action form data */
  readonly actionFormData = signal<{
    notes: string;
    rejectionReason: string;
    requestedDocuments: DocumentType[];
    notifyVendor: boolean;
  }>({
    notes: '',
    rejectionReason: '',
    requestedDocuments: [],
    notifyVendor: true
  });

  // ===========================================================================
  // COMPUTED PROPERTIES
  // ===========================================================================

  /** Filtered verifications based on search and status */
  readonly filteredVerifications = computed(() => {
    let items = this.verifications();
    const status = this.statusFilter();
    const search = this.searchTerm().toLowerCase();
    const sort = this.sortBy();

    // Apply status filter
    if (status !== 'all') {
      items = items.filter(v => v.status === status);
    }

    // Apply search filter
    if (search) {
      items = items.filter(v =>
        v.shopName.toLowerCase().includes(search) ||
        v.ownerName.toLowerCase().includes(search) ||
        v.ownerEmail.toLowerCase().includes(search)
      );
    }

    // Apply sorting
    items = [...items].sort((a, b) => {
      switch (sort) {
        case 'oldest':
          return new Date(a.appliedAt).getTime() - new Date(b.appliedAt).getTime();
        case 'newest':
          return new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime();
        case 'name':
          return a.shopName.localeCompare(b.shopName);
        default:
          return 0;
      }
    });

    return items;
  });

  /** Pages array for pagination */
  readonly pagesArray = computed(() => {
    const totalPages = this.pagination().totalPages;
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  });

  /** Count of active filters */
  readonly activeFiltersCount = computed(() => {
    let count = 0;
    if (this.statusFilter() !== 'all') count++;
    if (this.searchTerm()) count++;
    return count;
  });

  // ===========================================================================
  // STATIC DATA
  // ===========================================================================

  /** Status filter options */
  readonly statusOptions: Array<{ value: VendorVerificationStatus | 'all'; label: string }> = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'documents_requested', label: 'Documents Requested' },
    { value: 'documents_resubmitted', label: 'Documents Resubmitted' },
    { value: 'business_verification', label: 'Business Verification' },
    { value: 'final_review', label: 'Final Review' }
  ];

  /** Sort options */
  readonly sortOptions: Array<{ value: string; label: string }> = [
    { value: 'oldest', label: 'Oldest First (Priority)' },
    { value: 'newest', label: 'Newest First' },
    { value: 'name', label: 'Shop Name (A-Z)' }
  ];

  /** Available document types */
  readonly availableDocuments: DocumentType[] = [
    { id: 'business_license', label: 'Business License', selected: false },
    { id: 'tax_registration', label: 'Tax Registration Certificate', selected: false },
    { id: 'id_proof', label: 'ID Proof (Owner)', selected: false },
    { id: 'address_proof', label: 'Address Proof', selected: false },
    { id: 'bank_statement', label: 'Bank Statement', selected: false },
    { id: 'product_samples', label: 'Product Samples/Photos', selected: false },
    { id: 'category_certification', label: 'Category Certification', selected: false }
  ];

  // ===========================================================================
  // LIFECYCLE HOOKS
  // ===========================================================================

  ngOnInit(): void {
    this.loadVerifications();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===========================================================================
  // DATA LOADING
  // ===========================================================================

  /**
   * Load pending verifications from API
   * @description Fetches verification queue with current filters
   */
  loadVerifications(): void {
    this.isLoading.set(true);

    this.vendorsService.getPendingVerifications({
      page: this.pagination().page,
      limit: this.pagination().limit,
      status: this.statusFilter() !== 'all' ? this.statusFilter() as VendorVerificationStatus : undefined
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (response: PaginatedResponse<VendorVerificationItem>) => {
          this.verifications.set(response.data);
          this.pagination.set({
            page: response.page,
            limit: response.limit,
            total: response.total,
            totalPages: response.totalPages
          });
          this.calculateStats(response.data);
        },
        error: (error) => {
          console.error('Error loading verifications:', error);
          this.snackBar.open('Failed to load verification queue', 'Close', {
            duration: 5000,
            panelClass: 'error-snackbar'
          });
        }
      });
  }

  /**
   * Calculate queue statistics
   * @param items - Verification items to analyze
   */
  private calculateStats(items: VendorVerificationItem[]): void {
    const stats: VerificationStats = {
      pending: items.filter(v => v.status === 'pending').length,
      underReview: items.filter(v => v.status === 'under_review').length,
      documentsRequested: items.filter(v => v.status === 'documents_requested').length,
      resubmissions: items.filter(v => v.isResubmission).length,
      avgWaitDays: items.length > 0
        ? Math.round(items.reduce((sum, v) => sum + (v.daysPending || 0), 0) / items.length)
        : 0
    };
    this.stats.set(stats);
  }

  // ===========================================================================
  // FILTER ACTIONS
  // ===========================================================================

  /**
   * Apply status filter
   * @param status - Status to filter by
   */
  applyStatusFilter(status: VendorVerificationStatus | 'all'): void {
    this.statusFilter.set(status);
    this.pagination.set({ ...this.pagination(), page: 1 });
    this.loadVerifications();
  }

  /**
   * Apply sort option
   * @param sortBy - Sort field
   */
  applySort(sortBy: string): void {
    this.sortBy.set(sortBy);
  }

  /**
   * Handle search input
   * @param event - Input event
   */
  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.statusFilter.set('all');
    this.searchTerm.set('');
    this.sortBy.set('oldest');
    this.pagination.set({ ...this.pagination(), page: 1 });
    this.loadVerifications();
  }

  /**
   * Refresh the queue
   */
  refresh(): void {
    this.loadVerifications();
  }

  // ===========================================================================
  // PAGINATION
  // ===========================================================================

  /**
   * Navigate to specific page
   * @param page - Page number
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.pagination().totalPages) {
      this.pagination.set({ ...this.pagination(), page });
      this.loadVerifications();
    }
  }

  /**
   * Change page size
   * @param size - New page size
   */
  changePageSize(size: number): void {
    this.pagination.set({ ...this.pagination(), limit: size, page: 1 });
    this.loadVerifications();
  }

  // ===========================================================================
  // DETAIL DIALOG
  // ===========================================================================

  /**
   * View verification details
   * @param verification - Verification item to view
   */
  viewDetails(verification: VendorVerificationItem): void {
    this.selectedVerification.set(verification);
    this.showDetailDialog.set(true);
  }

  /**
   * Close detail dialog
   */
  closeDetailDialog(): void {
    this.showDetailDialog.set(false);
    this.selectedVerification.set(null);
  }

  /**
   * Navigate to full vendor detail page
   * @param vendorId - Vendor ID
   */
  goToVendorDetail(vendorId: number): void {
    this.closeDetailDialog();
    this.router.navigate(['/admin/vendors', vendorId], { queryParams: { tab: 'verification' } });
  }

  // ===========================================================================
  // ACTION DIALOG
  // ===========================================================================

  /**
   * Open action dialog for verification decision
   * @param verification - Verification to act on
   * @param action - Action type
   */
  openActionDialog(
    verification: VendorVerificationItem,
    action: 'approve' | 'reject' | 'request_documents'
  ): void {
    this.selectedVerification.set(verification);
    this.actionType.set(action);
    this.resetActionForm();
    this.showActionDialog.set(true);
    this.showDetailDialog.set(false);
  }

  /**
   * Close action dialog
   */
  closeActionDialog(): void {
    this.showActionDialog.set(false);
    this.resetActionForm();
  }

  /**
   * Reset action form to defaults
   */
  private resetActionForm(): void {
    this.actionFormData.set({
      notes: '',
      rejectionReason: '',
      requestedDocuments: this.availableDocuments.map(d => ({ ...d, selected: false })),
      notifyVendor: true
    });
  }

  /**
   * Toggle document selection
   * @param docId - Document ID to toggle
   */
  toggleDocument(docId: string): void {
    const current = this.actionFormData();
    const updated = current.requestedDocuments.map(d =>
      d.id === docId ? { ...d, selected: !d.selected } : d
    );
    this.actionFormData.set({ ...current, requestedDocuments: updated });
  }

  /**
   * Submit verification action
   */
  submitAction(): void {
    const verification = this.selectedVerification();
    if (!verification) return;

    const action = this.actionType();
    const formData = this.actionFormData();

    // Validate form
    if (action === 'reject' && !formData.rejectionReason.trim()) {
      this.snackBar.open('Please provide a rejection reason', 'Close', { duration: 3000 });
      return;
    }

    if (action === 'request_documents') {
      const selectedDocs = formData.requestedDocuments.filter(d => d.selected);
      if (selectedDocs.length === 0) {
        this.snackBar.open('Please select at least one document to request', 'Close', { duration: 3000 });
        return;
      }
    }

    this.isProcessing.set(true);

    // Execute appropriate action
    let actionObservable;
    const selectedDocs = formData.requestedDocuments
      .filter(d => d.selected)
      .map(d => d.id);

    switch (action) {
      case 'approve':
        actionObservable = this.vendorsService.approveVendor(verification.id, {
          notes: formData.notes,
          notifyVendor: formData.notifyVendor
        });
        break;
      case 'reject':
        actionObservable = this.vendorsService.rejectVendor(verification.id, {
          reason: formData.rejectionReason,
          notes: formData.notes,
          notifyVendor: formData.notifyVendor
        });
        break;
      case 'request_documents':
        actionObservable = this.vendorsService.requestDocuments(verification.id, {
          documents: selectedDocs,
          notes: formData.notes,
          notifyVendor: formData.notifyVendor
        });
        break;
    }

    actionObservable
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isProcessing.set(false))
      )
      .subscribe({
        next: () => {
          const actionLabel = action === 'approve' ? 'approved' :
                             action === 'reject' ? 'rejected' : 'documents requested';
          this.snackBar.open(`Vendor ${actionLabel} successfully`, 'Close', {
            duration: 3000,
            panelClass: 'success-snackbar'
          });
          this.closeActionDialog();
          this.loadVerifications();
        },
        error: (error) => {
          console.error('Error processing verification:', error);
          this.snackBar.open('Failed to process verification', 'Close', {
            duration: 5000,
            panelClass: 'error-snackbar'
          });
        }
      });
  }

  // ===========================================================================
  // QUICK ACTIONS
  // ===========================================================================

  /**
   * Quick approve verification
   * @param verification - Verification to approve
   */
  quickApprove(verification: VendorVerificationItem): void {
    if (!confirm(`Approve ${verification.shopName}? This will allow them to start selling.`)) {
      return;
    }

    this.isProcessing.set(true);
    this.vendorsService.approveVendor(verification.id, {
      notes: 'Quick approval from verification queue',
      notifyVendor: true
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isProcessing.set(false))
      )
      .subscribe({
        next: () => {
          this.snackBar.open(`${verification.shopName} approved successfully`, 'Close', {
            duration: 3000,
            panelClass: 'success-snackbar'
          });
          this.loadVerifications();
        },
        error: (error) => {
          console.error('Error approving vendor:', error);
          this.snackBar.open('Failed to approve vendor', 'Close', {
            duration: 5000,
            panelClass: 'error-snackbar'
          });
        }
      });
  }

  /**
   * Start review - mark as under review
   * @param verification - Verification to start reviewing
   */
  startReview(verification: VendorVerificationItem): void {
    this.isProcessing.set(true);
    this.vendorsService.updateVerification(verification.id, {
      status: 'under_review',
      notes: 'Review started',
      notifyVendor: false
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isProcessing.set(false))
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Review started', 'Close', { duration: 2000 });
          this.loadVerifications();
        },
        error: (error) => {
          console.error('Error starting review:', error);
          this.snackBar.open('Failed to start review', 'Close', {
            duration: 5000,
            panelClass: 'error-snackbar'
          });
        }
      });
  }

  // ===========================================================================
  // UTILITY METHODS
  // ===========================================================================

  /**
   * Format date for display
   * @param date - Date to format
   * @returns Formatted date string
   */
  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Get status display label
   * @param status - Verification status
   * @returns Human-readable label
   */
  getStatusLabel(status: VendorVerificationStatus): string {
    const labels: Record<VendorVerificationStatus, string> = {
      pending: 'Pending',
      under_review: 'Under Review',
      documents_requested: 'Docs Requested',
      documents_resubmitted: 'Docs Resubmitted',
      business_verification: 'Business Verification',
      final_review: 'Final Review',
      approved: 'Approved',
      rejected: 'Rejected',
      suspended: 'Suspended',
      expired: 'Expired',
      revoked: 'Revoked'
    };
    return labels[status] || status;
  }

  /**
   * Get status icon
   * @param status - Verification status
   * @returns Material icon name
   */
  getStatusIcon(status: VendorVerificationStatus): string {
    const icons: Record<VendorVerificationStatus, string> = {
      pending: 'schedule',
      under_review: 'rate_review',
      documents_requested: 'description',
      documents_resubmitted: 'refresh',
      business_verification: 'business',
      final_review: 'checklist',
      approved: 'verified',
      rejected: 'cancel',
      suspended: 'pause_circle',
      expired: 'timer_off',
      revoked: 'block'
    };
    return icons[status] || 'help_outline';
  }

  /**
   * Get urgency level based on wait time
   * @param days - Days pending
   * @returns Urgency level
   */
  getUrgencyLevel(days: number): 'normal' | 'warning' | 'critical' {
    if (days >= 7) return 'critical';
    if (days >= 3) return 'warning';
    return 'normal';
  }

  /**
   * Track by function for verification list
   * @param index - Item index
   * @param item - Verification item
   * @returns Unique identifier
   */
  trackByVerificationId(index: number, item: VendorVerificationItem): number {
    return item.id;
  }

  /**
   * Navigate back to vendor list
   */
  goToVendorList(): void {
    this.router.navigate(['/admin/vendors']);
  }
}
