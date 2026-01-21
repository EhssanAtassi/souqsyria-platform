/**
 * @file admin-vendors.service.ts
 * @description Service for vendor management API operations.
 *              Handles vendor listing, verification workflow, commission management,
 *              and payout processing.
 * @module AdminDashboard/Services
 */

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { AdminApiService } from './admin-api.service';
import {
  PaginatedResponse,
  VendorListItem,
  VendorDetails,
  VendorListQuery,
  VendorVerificationItem,
  UpdateVendorVerificationRequest,
  UpdateVendorCommissionRequest,
  ProcessPayoutRequest,
  PayoutRequestItem,
  VendorVerificationStatus,
  VendorAccountStatus
} from '../interfaces';

/**
 * Admin Vendors Service
 * @description Provides API operations for vendor management in the admin dashboard.
 *              Supports vendor listing, 9-state verification workflow, commission management,
 *              and payout processing.
 *
 * @example
 * ```typescript
 * // Get pending verifications
 * this.vendorsService.getPendingVerifications({ page: 1, limit: 20 })
 *   .subscribe(response => console.log('Pending:', response.items));
 *
 * // Approve a vendor
 * this.vendorsService.updateVerification(vendorId, {
 *   status: 'approved',
 *   notes: 'All documents verified'
 * }).subscribe(() => console.log('Vendor approved'));
 * ```
 */
@Injectable({ providedIn: 'root' })
export class AdminVendorsService {
  /**
   * Base API service for HTTP operations
   */
  private readonly api = inject(AdminApiService);

  /**
   * Base endpoint for vendor management
   */
  private readonly endpoint = 'vendors';

  // =========================================================================
  // VENDOR LISTING & DETAILS
  // =========================================================================

  /**
   * Get paginated list of vendors
   * @description Retrieves vendors with filtering, sorting, and pagination
   * @param query - Query parameters for filtering and pagination
   * @returns Observable of paginated vendor list
   *
   * @example
   * ```typescript
   * // Get verified vendors
   * this.vendorsService.getVendors({ verificationStatus: 'approved', page: 1 });
   *
   * // Get vendors by rating
   * this.vendorsService.getVendors({ minRating: 4.0, sortBy: 'rating', sortOrder: 'desc' });
   * ```
   */
  getVendors(query: VendorListQuery = {}): Observable<PaginatedResponse<VendorListItem>> {
    return this.api.getPaginated<VendorListItem>(this.endpoint, query);
  }

  /**
   * Get vendor details by ID
   * @description Retrieves complete vendor information including metrics and history
   * @param vendorId - Vendor ID
   * @returns Observable of vendor details
   */
  getVendorById(vendorId: number): Observable<VendorDetails> {
    return this.api.get<VendorDetails>(`${this.endpoint}/${vendorId}`);
  }

  /**
   * Get vendor statistics summary
   * @description Retrieves aggregated statistics for all vendors
   * @returns Observable of vendor statistics
   */
  getVendorStatistics(): Observable<{
    total: number;
    active: number;
    inactive: number;
    suspended: number;
    pendingVerification: number;
    verifiedThisMonth: number;
    averageRating: number;
    totalSales: number;
    totalCommissions: number;
  }> {
    return this.api.get(`${this.endpoint}/statistics`);
  }

  // =========================================================================
  // VERIFICATION WORKFLOW (9-State)
  // =========================================================================

  /**
   * Get vendors pending verification
   * @description Retrieves list of vendors awaiting verification review
   * @param query - Pagination and filter parameters
   * @returns Observable of paginated verification list
   */
  getPendingVerifications(query: {
    page?: number;
    limit?: number;
    status?: VendorVerificationStatus;
    sortOrder?: 'asc' | 'desc';
  } = {}): Observable<PaginatedResponse<VendorVerificationItem>> {
    return this.api.getPaginated<VendorVerificationItem>(`${this.endpoint}/verification/pending`, query);
  }

  /**
   * Get verification details
   * @description Retrieves detailed verification information including documents
   * @param vendorId - Vendor ID
   * @returns Observable of verification details
   */
  getVerificationDetails(vendorId: number): Observable<{
    id: number;
    vendorId: number;
    shopName: string;
    ownerName: string;
    ownerEmail: string;
    status: VendorVerificationStatus;
    documents: {
      type: string;
      name: string;
      url: string;
      uploadedAt: Date;
      verified: boolean;
    }[];
    businessInfo: {
      registrationNumber?: string;
      taxId?: string;
      address: string;
      phoneNumber: string;
    };
    bankInfo: {
      bankName: string;
      accountNumber: string;
      accountHolder: string;
    };
    appliedAt: Date;
    verificationHistory: {
      status: VendorVerificationStatus;
      timestamp: Date;
      notes?: string;
      reviewedBy?: string;
    }[];
  }> {
    return this.api.get(`${this.endpoint}/${vendorId}/verification`);
  }

  /**
   * Update vendor verification status
   * @description Advances vendor through the 9-state verification workflow
   * @param vendorId - Vendor ID
   * @param request - Verification status update request
   * @returns Observable of updated vendor details
   *
   * @example
   * ```typescript
   * // Move to under review
   * this.vendorsService.updateVerification(123, {
   *   status: 'under_review',
   *   notes: 'Starting document review'
   * });
   *
   * // Request additional documents
   * this.vendorsService.updateVerification(123, {
   *   status: 'documents_requested',
   *   requestedDocuments: ['business_license', 'tax_certificate'],
   *   notes: 'Please provide these additional documents'
   * });
   *
   * // Approve vendor
   * this.vendorsService.updateVerification(123, {
   *   status: 'approved',
   *   notes: 'All documents verified successfully',
   *   notifyVendor: true
   * });
   * ```
   */
  updateVerification(
    vendorId: number,
    request: UpdateVendorVerificationRequest
  ): Observable<VendorDetails> {
    return this.api.patch<VendorDetails>(`${this.endpoint}/${vendorId}/verification`, request);
  }

  /**
   * Approve vendor
   * @description Convenience method to approve a vendor
   * @param vendorId - Vendor ID
   * @param notes - Approval notes
   * @returns Observable of updated vendor details
   */
  approveVendor(vendorId: number, notes?: string): Observable<VendorDetails> {
    return this.updateVerification(vendorId, {
      status: 'approved',
      notes,
      notifyVendor: true
    });
  }

  /**
   * Reject vendor
   * @description Convenience method to reject a vendor application
   * @param vendorId - Vendor ID
   * @param reason - Rejection reason
   * @returns Observable of updated vendor details
   */
  rejectVendor(vendorId: number, reason: string): Observable<VendorDetails> {
    return this.updateVerification(vendorId, {
      status: 'rejected',
      rejectionReason: reason,
      notifyVendor: true
    });
  }

  /**
   * Request documents
   * @description Requests additional documents from vendor
   * @param vendorId - Vendor ID
   * @param documents - List of required document types
   * @param notes - Instructions for vendor
   * @returns Observable of updated vendor details
   */
  requestDocuments(
    vendorId: number,
    documents: string[],
    notes?: string
  ): Observable<VendorDetails> {
    return this.updateVerification(vendorId, {
      status: 'documents_requested',
      requestedDocuments: documents,
      notes,
      notifyVendor: true
    });
  }

  // =========================================================================
  // ACCOUNT STATUS MANAGEMENT
  // =========================================================================

  /**
   * Update vendor account status
   * @description Changes vendor account status (active, inactive, suspended, banned)
   * @param vendorId - Vendor ID
   * @param status - New account status
   * @param reason - Reason for status change
   * @returns Observable of updated vendor details
   */
  updateAccountStatus(
    vendorId: number,
    status: VendorAccountStatus,
    reason?: string
  ): Observable<VendorDetails> {
    return this.api.patch<VendorDetails>(`${this.endpoint}/${vendorId}/status`, { status, reason });
  }

  /**
   * Suspend vendor
   * @description Temporarily suspends a vendor account
   * @param vendorId - Vendor ID
   * @param reason - Suspension reason
   * @returns Observable of updated vendor details
   */
  suspendVendor(vendorId: number, reason: string): Observable<VendorDetails> {
    return this.updateAccountStatus(vendorId, 'suspended', reason);
  }

  /**
   * Activate vendor
   * @description Reactivates a suspended or inactive vendor
   * @param vendorId - Vendor ID
   * @returns Observable of updated vendor details
   */
  activateVendor(vendorId: number): Observable<VendorDetails> {
    return this.updateAccountStatus(vendorId, 'active');
  }

  /**
   * Ban vendor
   * @description Permanently bans a vendor account
   * @param vendorId - Vendor ID
   * @param reason - Ban reason
   * @returns Observable of updated vendor details
   */
  banVendor(vendorId: number, reason: string): Observable<VendorDetails> {
    return this.updateAccountStatus(vendorId, 'banned', reason);
  }

  // =========================================================================
  // COMMISSION MANAGEMENT
  // =========================================================================

  /**
   * Get global commission settings
   * @description Retrieves platform-wide commission configuration
   * @returns Observable of commission settings
   */
  getCommissionSettings(): Observable<{
    defaultRate: number;
    categoryRates: { categoryId: number; categoryName: string; rate: number }[];
    minRate: number;
    maxRate: number;
  }> {
    return this.api.get('commissions/settings');
  }

  /**
   * Update vendor commission rate
   * @description Sets custom commission rate for a vendor
   * @param vendorId - Vendor ID
   * @param request - Commission update request
   * @returns Observable of updated vendor details
   *
   * @example
   * ```typescript
   * this.vendorsService.updateCommission(123, {
   *   commissionRate: 8,
   *   effectiveDate: '2024-02-01',
   *   reason: 'Promotional rate for high-volume seller'
   * });
   * ```
   */
  updateCommission(
    vendorId: number,
    request: UpdateVendorCommissionRequest
  ): Observable<VendorDetails> {
    return this.api.patch<VendorDetails>(`${this.endpoint}/${vendorId}/commission`, request);
  }

  /**
   * Get vendor commission history
   * @description Retrieves commission rate change history for a vendor
   * @param vendorId - Vendor ID
   * @returns Observable of commission history
   */
  getCommissionHistory(vendorId: number): Observable<{
    vendorId: number;
    currentRate: number;
    history: {
      rate: number;
      effectiveDate: Date;
      endDate?: Date;
      reason?: string;
      changedBy?: string;
    }[];
  }> {
    return this.api.get(`${this.endpoint}/${vendorId}/commission/history`);
  }

  /**
   * Get vendor earnings summary
   * @description Retrieves earnings and commission summary for a vendor
   * @param vendorId - Vendor ID
   * @param query - Date range parameters
   * @returns Observable of earnings summary
   */
  getVendorEarnings(vendorId: number, query: {
    startDate?: string;
    endDate?: string;
  } = {}): Observable<{
    vendorId: number;
    period: { startDate: string; endDate: string };
    grossSales: number;
    commissionAmount: number;
    netEarnings: number;
    refundAmount: number;
    orderCount: number;
    itemsSold: number;
    breakdown: {
      date: string;
      grossSales: number;
      commission: number;
      net: number;
    }[];
  }> {
    return this.api.get(`${this.endpoint}/${vendorId}/earnings`, query);
  }

  // =========================================================================
  // PAYOUT MANAGEMENT
  // =========================================================================

  /**
   * Get pending payout requests
   * @description Retrieves list of payout requests awaiting processing
   * @param query - Pagination parameters
   * @returns Observable of paginated payout request list
   */
  getPendingPayouts(query: {
    page?: number;
    limit?: number;
    sortOrder?: 'asc' | 'desc';
  } = {}): Observable<PaginatedResponse<PayoutRequestItem>> {
    return this.api.getPaginated<PayoutRequestItem>('payouts/pending', query);
  }

  /**
   * Get payout request details
   * @description Retrieves detailed payout request information
   * @param payoutId - Payout request ID
   * @returns Observable of payout details
   */
  getPayoutDetails(payoutId: number): Observable<{
    id: number;
    vendorId: number;
    shopName: string;
    amount: number;
    paymentMethod: string;
    bankDetails?: {
      bankName: string;
      accountNumber: string;
      accountHolder: string;
    };
    status: string;
    requestedAt: Date;
    processedAt?: Date;
    transactionReference?: string;
    notes?: string;
    processedBy?: string;
  }> {
    return this.api.get(`payouts/${payoutId}`);
  }

  /**
   * Process a payout request
   * @description Processes and completes a vendor payout
   * @param payoutId - Payout request ID
   * @param request - Payout processing request
   * @returns Observable of operation result
   *
   * @example
   * ```typescript
   * this.vendorsService.processPayout(123, {
   *   amount: 500000,
   *   paymentMethod: 'bank_transfer',
   *   transactionReference: 'TRX-2024-001234',
   *   notes: 'Processed via BEMO Bank'
   * });
   * ```
   */
  processPayout(payoutId: number, request: ProcessPayoutRequest): Observable<{
    success: boolean;
    message: string;
    transactionId?: string;
  }> {
    return this.api.post(`payouts/${payoutId}/process`, request);
  }

  /**
   * Reject a payout request
   * @description Rejects a vendor payout request
   * @param payoutId - Payout request ID
   * @param reason - Rejection reason
   * @returns Observable of operation result
   */
  rejectPayout(payoutId: number, reason: string): Observable<{ success: boolean; message: string }> {
    return this.api.post(`payouts/${payoutId}/reject`, { reason });
  }

  /**
   * Hold a payout request
   * @description Places a payout request on hold
   * @param payoutId - Payout request ID
   * @param reason - Hold reason
   * @returns Observable of operation result
   */
  holdPayout(payoutId: number, reason: string): Observable<{ success: boolean; message: string }> {
    return this.api.post(`payouts/${payoutId}/hold`, { reason });
  }

  /**
   * Get payout history
   * @description Retrieves payout history for a vendor
   * @param vendorId - Vendor ID
   * @param query - Pagination parameters
   * @returns Observable of paginated payout history
   */
  getPayoutHistory(vendorId: number, query: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  } = {}): Observable<PaginatedResponse<PayoutRequestItem>> {
    return this.api.getPaginated(`${this.endpoint}/${vendorId}/payouts`, query);
  }

  // =========================================================================
  // VENDOR PERFORMANCE & REPORTS
  // =========================================================================

  /**
   * Get vendor performance metrics
   * @description Retrieves detailed performance data for a vendor
   * @param vendorId - Vendor ID
   * @param query - Date range parameters
   * @returns Observable of performance metrics
   */
  getVendorPerformance(vendorId: number, query: {
    startDate?: string;
    endDate?: string;
  } = {}): Observable<{
    vendorId: number;
    period: { startDate: string; endDate: string };
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
  }> {
    return this.api.get(`${this.endpoint}/${vendorId}/performance`, query);
  }

  /**
   * Export vendors to file
   * @description Generates downloadable export of vendor data
   * @param format - Export format (csv, xlsx)
   * @param query - Filter query to determine which vendors to export
   * @returns Observable of export file blob
   */
  exportVendors(format: 'csv' | 'xlsx', query: VendorListQuery = {}): Observable<Blob> {
    return this.api.downloadFile(`${this.endpoint}/export`, {
      ...query,
      format
    });
  }
}
