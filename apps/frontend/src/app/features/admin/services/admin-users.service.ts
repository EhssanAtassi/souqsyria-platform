/**
 * @file admin-users.service.ts
 * @description Service for user management API operations.
 *              Handles user listing, status updates, role assignment, and KYC verification.
 * @module AdminDashboard/Services
 */

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { AdminApiService } from './admin-api.service';
import {
  PaginatedResponse,
  UserListItem,
  UserDetails,
  UserListQuery,
  UpdateUserStatusRequest,
  AssignUserRolesRequest,
  ReviewKycRequest,
  KycVerificationItem,
  UserRole,
  KycStatus
} from '../interfaces';

/**
 * Admin Users Service
 * @description Provides API operations for user management in the admin dashboard.
 *              Supports user listing, filtering, status management, role assignment,
 *              and KYC verification workflows.
 *
 * @example
 * ```typescript
 * // Get paginated user list
 * this.usersService.getUsers({ page: 1, limit: 20, status: 'active' })
 *   .subscribe(response => console.log('Users:', response.items));
 *
 * // Update user status
 * this.usersService.updateUserStatus(userId, { status: 'suspended', reason: 'TOS violation' })
 *   .subscribe(() => console.log('User suspended'));
 * ```
 */
@Injectable({ providedIn: 'root' })
export class AdminUsersService {
  /**
   * Base API service for HTTP operations
   */
  private readonly api = inject(AdminApiService);

  /**
   * Base endpoint for user management
   */
  private readonly endpoint = 'users';

  // =========================================================================
  // USER LISTING & DETAILS
  // =========================================================================

  /**
   * Get paginated list of users
   * @description Retrieves users with filtering, sorting, and pagination
   * @param query - Query parameters for filtering and pagination
   * @returns Observable of paginated user list
   *
   * @example
   * ```typescript
   * // Get active users
   * this.usersService.getUsers({ status: 'active', page: 1, limit: 20 });
   *
   * // Search users
   * this.usersService.getUsers({ search: 'ahmad', sortBy: 'createdAt', sortOrder: 'desc' });
   * ```
   */
  getUsers(query: UserListQuery = {}): Observable<PaginatedResponse<UserListItem>> {
    return this.api.getPaginated<UserListItem>(this.endpoint, query);
  }

  /**
   * Get user details by ID
   * @description Retrieves complete user information including activity history
   * @param userId - User ID
   * @returns Observable of user details
   */
  getUserById(userId: number): Observable<UserDetails> {
    return this.api.get<UserDetails>(`${this.endpoint}/${userId}`);
  }

  /**
   * Get user statistics summary
   * @description Retrieves aggregated statistics for all users
   * @returns Observable of user statistics
   */
  getUserStatistics(): Observable<{
    total: number;
    active: number;
    suspended: number;
    banned: number;
    pendingVerification: number;
    newThisMonth: number;
  }> {
    return this.api.get(`${this.endpoint}/statistics`);
  }

  // =========================================================================
  // USER STATUS MANAGEMENT
  // =========================================================================

  /**
   * Update user account status
   * @description Changes user status (active, suspended, banned, etc.)
   * @param userId - User ID
   * @param request - Status update request with reason
   * @returns Observable of updated user details
   *
   * @example
   * ```typescript
   * // Suspend a user
   * this.usersService.updateUserStatus(123, {
   *   status: 'suspended',
   *   reason: 'Violation of community guidelines',
   *   notifyUser: true
   * });
   * ```
   */
  updateUserStatus(userId: number, request: UpdateUserStatusRequest): Observable<UserDetails> {
    return this.api.patch<UserDetails>(`${this.endpoint}/${userId}/status`, request);
  }

  /**
   * Suspend user account
   * @description Convenience method to suspend a user
   * @param userId - User ID
   * @param reason - Reason for suspension
   * @param notifyUser - Whether to send email notification
   * @returns Observable of updated user details
   */
  suspendUser(userId: number, reason: string, notifyUser = true): Observable<UserDetails> {
    return this.updateUserStatus(userId, {
      status: 'suspended',
      reason,
      notifyUser
    });
  }

  /**
   * Ban user account
   * @description Permanently bans a user account
   * @param userId - User ID
   * @param reason - Reason for ban
   * @param notifyUser - Whether to send email notification
   * @returns Observable of updated user details
   */
  banUser(userId: number, reason: string, notifyUser = true): Observable<UserDetails> {
    return this.updateUserStatus(userId, {
      status: 'banned',
      reason,
      notifyUser
    });
  }

  /**
   * Activate user account
   * @description Reactivates a suspended or inactive user
   * @param userId - User ID
   * @returns Observable of updated user details
   */
  activateUser(userId: number): Observable<UserDetails> {
    return this.updateUserStatus(userId, {
      status: 'active'
    });
  }

  // =========================================================================
  // ROLE MANAGEMENT
  // =========================================================================

  /**
   * Get all available roles
   * @description Retrieves list of assignable roles
   * @returns Observable of role list
   */
  getAvailableRoles(): Observable<UserRole[]> {
    return this.api.get<UserRole[]>('roles');
  }

  /**
   * Assign roles to a user
   * @description Updates user role assignments
   * @param userId - User ID
   * @param request - Role assignment request
   * @returns Observable of updated user details
   *
   * @example
   * ```typescript
   * // Add roles to existing
   * this.usersService.assignRoles(123, { roleIds: [2, 3], replaceExisting: false });
   *
   * // Replace all roles
   * this.usersService.assignRoles(123, { roleIds: [1], replaceExisting: true });
   * ```
   */
  assignRoles(userId: number, request: AssignUserRolesRequest): Observable<UserDetails> {
    return this.api.patch<UserDetails>(`${this.endpoint}/${userId}/roles`, request);
  }

  /**
   * Remove all roles from a user
   * @description Clears all role assignments
   * @param userId - User ID
   * @returns Observable of updated user details
   */
  removeAllRoles(userId: number): Observable<UserDetails> {
    return this.api.delete<UserDetails>(`${this.endpoint}/${userId}/roles`);
  }

  // =========================================================================
  // KYC VERIFICATION
  // =========================================================================

  /**
   * Get pending KYC verifications
   * @description Retrieves list of KYC submissions awaiting review
   * @param query - Pagination parameters
   * @returns Observable of paginated KYC verification list
   */
  getPendingKycVerifications(query: {
    page?: number;
    limit?: number;
    sortOrder?: 'asc' | 'desc';
  } = {}): Observable<PaginatedResponse<KycVerificationItem>> {
    return this.api.getPaginated<KycVerificationItem>('kyc/pending', query);
  }

  /**
   * Get KYC submission details
   * @description Retrieves detailed KYC submission with documents
   * @param kycId - KYC submission ID
   * @returns Observable of KYC details including document URLs
   */
  getKycDetails(kycId: number): Observable<{
    id: number;
    userId: number;
    userName: string;
    userEmail: string;
    status: KycStatus;
    documentType: string;
    documents: { type: string; url: string; uploadedAt: Date }[];
    submittedAt: Date;
    reviewHistory: { action: string; timestamp: Date; reviewer?: string; notes?: string }[];
  }> {
    return this.api.get(`kyc/${kycId}`);
  }

  /**
   * Review KYC submission
   * @description Approves, rejects, or requests resubmission of KYC documents
   * @param kycId - KYC submission ID
   * @param request - Review decision and notes
   * @returns Observable of operation result
   *
   * @example
   * ```typescript
   * // Approve KYC
   * this.usersService.reviewKyc(123, {
   *   decision: 'approved',
   *   notes: 'All documents verified successfully'
   * });
   *
   * // Request resubmission
   * this.usersService.reviewKyc(123, {
   *   decision: 'requires_resubmission',
   *   notes: 'ID document is blurry',
   *   fieldsToResubmit: ['id_document']
   * });
   * ```
   */
  reviewKyc(kycId: number, request: ReviewKycRequest): Observable<{ success: boolean; message: string }> {
    return this.api.post(`kyc/${kycId}/review`, request);
  }

  /**
   * Approve KYC submission
   * @description Convenience method to approve KYC
   * @param kycId - KYC submission ID
   * @param notes - Optional approval notes
   * @returns Observable of operation result
   */
  approveKyc(kycId: number, notes?: string): Observable<{ success: boolean; message: string }> {
    return this.reviewKyc(kycId, { decision: 'approved', notes });
  }

  /**
   * Reject KYC submission
   * @description Convenience method to reject KYC
   * @param kycId - KYC submission ID
   * @param notes - Rejection reason
   * @returns Observable of operation result
   */
  rejectKyc(kycId: number, notes: string): Observable<{ success: boolean; message: string }> {
    return this.reviewKyc(kycId, { decision: 'rejected', notes });
  }

  // =========================================================================
  // USER ACTIVITY & HISTORY
  // =========================================================================

  /**
   * Get user activity log
   * @description Retrieves activity history for a specific user
   * @param userId - User ID
   * @param query - Pagination parameters
   * @returns Observable of user activity entries
   */
  getUserActivity(userId: number, query: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  } = {}): Observable<PaginatedResponse<{
    id: number;
    action: string;
    resource: string;
    resourceId?: string;
    timestamp: Date;
    ipAddress?: string;
    userAgent?: string;
    details?: any;
  }>> {
    return this.api.getPaginated(`${this.endpoint}/${userId}/activity`, query);
  }

  /**
   * Get user orders summary
   * @description Retrieves order history summary for a user
   * @param userId - User ID
   * @returns Observable of order summary
   */
  getUserOrdersSummary(userId: number): Observable<{
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    lastOrderDate?: Date;
    ordersByStatus: { status: string; count: number }[];
  }> {
    return this.api.get(`${this.endpoint}/${userId}/orders/summary`);
  }

  // =========================================================================
  // BULK OPERATIONS
  // =========================================================================

  /**
   * Bulk update user status
   * @description Updates status for multiple users at once
   * @param userIds - Array of user IDs
   * @param status - New status to apply
   * @param reason - Reason for status change
   * @returns Observable of bulk operation result
   */
  bulkUpdateStatus(
    userIds: number[],
    status: 'active' | 'suspended' | 'banned',
    reason?: string
  ): Observable<{
    totalProcessed: number;
    successful: number;
    failed: number;
    results: { userId: number; success: boolean; error?: string }[];
  }> {
    return this.api.post(`${this.endpoint}/bulk/status`, {
      userIds,
      status,
      reason
    });
  }

  /**
   * Export users to file
   * @description Generates downloadable export of user data
   * @param format - Export format (csv, xlsx)
   * @param query - Filter query to determine which users to export
   * @returns Observable of export file blob
   */
  exportUsers(format: 'csv' | 'xlsx', query: UserListQuery = {}): Observable<Blob> {
    return this.api.downloadFile(`${this.endpoint}/export`, {
      ...query,
      format
    });
  }
}
