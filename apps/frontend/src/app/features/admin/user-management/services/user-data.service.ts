/**
 * User Data Service
 *
 * @description
 * HTTP layer service for User Management API calls.
 * Pure HTTP service with no state management - delegates to UserManagementService.
 *
 * All methods return Observable<T> and handle:
 * - HTTP request construction
 * - Query parameter serialization
 * - Response typing
 * - Basic error propagation (handled by interceptors)
 *
 * @module UserManagement/Services
 * @version 1.0.0
 *
 * @swagger
 * Provides typed HTTP methods for all User Management API endpoints.
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ManagedUser,
  UsersListParams,
  UsersListResponse,
  BanUserRequest,
  SuspendUserRequest,
  UpdateRolesRequest,
  ResetPasswordRequest,
  ResetPasswordResponse,
  UserEffectivePermissions,
  BulkBanRequest,
  BulkSuspendRequest,
  BulkUpdateRolesRequest,
  BulkOperationResponse,
  UserUpdateResponse
} from '../models';
import { UserActivity } from '../models/user-activity.model';

/**
 * Base API URL for User Management endpoints
 */
const API_BASE = '/api/admin/users';

/**
 * User Data Service
 *
 * @description
 * HTTP data service for User Management operations.
 * All methods are pure HTTP calls with no side effects or state management.
 *
 * Available Operations:
 * - List users with pagination/filters
 * - Get single user details
 * - Update user profile
 * - Ban/unban users
 * - Suspend/unsuspend users
 * - Assign roles
 * - Reset passwords
 * - Fetch user activity logs
 * - Fetch user permissions
 * - Bulk operations
 *
 * @class UserDataService
 *
 * @example
 * ```typescript
 * constructor(private userDataService: UserDataService) {}
 *
 * // Fetch users
 * this.userDataService.getUsers({ page: 1, limit: 10 })
 *   .subscribe(response => {
 *     console.log('Users:', response.data);
 *   });
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class UserDataService {
  private readonly http = inject(HttpClient);

  // ==========================================================================
  // USER LIST & DETAIL
  // ==========================================================================

  /**
   * Get Users List
   *
   * @description
   * Fetches paginated list of users with optional filters.
   * Endpoint: GET /api/admin/users
   *
   * @param {UsersListParams} params - Query parameters (page, limit, filters, etc.)
   * @returns {Observable<UsersListResponse>} Paginated users response
   *
   * @swagger
   * GET /api/admin/users
   * @apiParam {number} page - Page number (1-indexed)
   * @apiParam {number} limit - Items per page (max 100)
   * @apiParam {string} [search] - Search query
   * @apiParam {string} [status] - Filter by status
   * @apiParam {string} [businessRole] - Filter by business role
   * @apiParam {string} [adminRole] - Filter by admin role
   * @apiParam {string} [sortBy] - Sort column
   * @apiParam {string} [sortOrder] - Sort direction (asc/desc)
   * @apiSuccess {ManagedUser[]} data - User array
   * @apiSuccess {number} total - Total count
   * @apiSuccess {number} page - Current page
   * @apiSuccess {number} limit - Page size
   * @apiSuccess {number} totalPages - Total pages
   */
  getUsers(params: UsersListParams): Observable<UsersListResponse> {
    const httpParams = this.buildHttpParams(params);
    return this.http.get<UsersListResponse>(API_BASE, { params: httpParams });
  }

  /**
   * Get User By ID
   *
   * @description
   * Fetches detailed information for a single user.
   * Endpoint: GET /api/admin/users/:id
   *
   * @param {number} id - User ID
   * @returns {Observable<ManagedUser>} User entity
   *
   * @swagger
   * GET /api/admin/users/:id
   * @apiParam {number} id - User ID (path parameter)
   * @apiSuccess {ManagedUser} - Full user entity with stats
   */
  getUserById(id: number): Observable<ManagedUser> {
    return this.http.get<ManagedUser>(`${API_BASE}/${id}`);
  }

  /**
   * Update User
   *
   * @description
   * Updates user profile information.
   * Endpoint: PUT /api/admin/users/:id
   *
   * @param {number} id - User ID
   * @param {Partial<ManagedUser>} updates - Fields to update
   * @returns {Observable<UserUpdateResponse>} Updated user entity
   *
   * @swagger
   * PUT /api/admin/users/:id
   * @apiParam {number} id - User ID (path parameter)
   * @apiBody {object} updates - Fields to update
   * @apiSuccess {UserUpdateResponse} - Updated user with metadata
   */
  updateUser(id: number, updates: Partial<ManagedUser>): Observable<UserUpdateResponse> {
    return this.http.put<UserUpdateResponse>(`${API_BASE}/${id}`, updates);
  }

  // ==========================================================================
  // USER ACTIONS
  // ==========================================================================

  /**
   * Ban User
   *
   * @description
   * Bans a user account permanently or temporarily.
   * Endpoint: POST /api/admin/users/:id/ban
   *
   * @param {number} id - User ID
   * @param {BanUserRequest} request - Ban details
   * @returns {Observable<ManagedUser>} Updated user entity
   *
   * @swagger
   * POST /api/admin/users/:id/ban
   * @apiParam {number} id - User ID (path parameter)
   * @apiBody {BanUserRequest} request - Ban reason and options
   * @apiSuccess {ManagedUser} - Updated user entity
   */
  banUser(id: number, request: BanUserRequest): Observable<ManagedUser> {
    return this.http.post<ManagedUser>(`${API_BASE}/${id}/ban`, request);
  }

  /**
   * Unban User
   *
   * @description
   * Removes ban from a user account.
   * Endpoint: POST /api/admin/users/:id/unban
   *
   * @param {number} id - User ID
   * @returns {Observable<ManagedUser>} Updated user entity
   *
   * @swagger
   * POST /api/admin/users/:id/unban
   * @apiParam {number} id - User ID (path parameter)
   * @apiSuccess {ManagedUser} - Updated user entity
   */
  unbanUser(id: number): Observable<ManagedUser> {
    return this.http.post<ManagedUser>(`${API_BASE}/${id}/unban`, {});
  }

  /**
   * Suspend User
   *
   * @description
   * Suspends a user account temporarily.
   * Endpoint: POST /api/admin/users/:id/suspend
   *
   * @param {number} id - User ID
   * @param {SuspendUserRequest} request - Suspension details
   * @returns {Observable<ManagedUser>} Updated user entity
   *
   * @swagger
   * POST /api/admin/users/:id/suspend
   * @apiParam {number} id - User ID (path parameter)
   * @apiBody {SuspendUserRequest} request - Suspension reason and duration
   * @apiSuccess {ManagedUser} - Updated user entity
   */
  suspendUser(id: number, request: SuspendUserRequest): Observable<ManagedUser> {
    return this.http.post<ManagedUser>(`${API_BASE}/${id}/suspend`, request);
  }

  /**
   * Unsuspend User
   *
   * @description
   * Removes suspension from a user account.
   * Endpoint: POST /api/admin/users/:id/unsuspend
   *
   * @param {number} id - User ID
   * @returns {Observable<ManagedUser>} Updated user entity
   *
   * @swagger
   * POST /api/admin/users/:id/unsuspend
   * @apiParam {number} id - User ID (path parameter)
   * @apiSuccess {ManagedUser} - Updated user entity
   */
  unsuspendUser(id: number): Observable<ManagedUser> {
    return this.http.post<ManagedUser>(`${API_BASE}/${id}/unsuspend`, {});
  }

  /**
   * Assign Roles
   *
   * @description
   * Updates user roles (business role and/or admin role).
   * Endpoint: PUT /api/admin/users/:id/roles
   *
   * @param {number} id - User ID
   * @param {UpdateRolesRequest} request - Role updates
   * @returns {Observable<ManagedUser>} Updated user entity
   *
   * @swagger
   * PUT /api/admin/users/:id/roles
   * @apiParam {number} id - User ID (path parameter)
   * @apiBody {UpdateRolesRequest} request - Role assignments
   * @apiSuccess {ManagedUser} - Updated user entity
   */
  assignRoles(id: number, request: UpdateRolesRequest): Observable<ManagedUser> {
    return this.http.put<ManagedUser>(`${API_BASE}/${id}/roles`, request);
  }

  /**
   * Reset Password
   *
   * @description
   * Initiates password reset for a user.
   * Endpoint: POST /api/admin/users/:id/reset-password
   *
   * @param {number} id - User ID
   * @param {ResetPasswordRequest} request - Reset options
   * @returns {Observable<ResetPasswordResponse>} Reset result with optional temp password
   *
   * @swagger
   * POST /api/admin/users/:id/reset-password
   * @apiParam {number} id - User ID (path parameter)
   * @apiBody {ResetPasswordRequest} request - Reset options
   * @apiSuccess {ResetPasswordResponse} - Reset result
   */
  resetPassword(id: number, request: ResetPasswordRequest = {}): Observable<ResetPasswordResponse> {
    return this.http.post<ResetPasswordResponse>(`${API_BASE}/${id}/reset-password`, request);
  }

  // ==========================================================================
  // USER ACTIVITY & PERMISSIONS
  // ==========================================================================

  /**
   * Get User Activity
   *
   * @description
   * Fetches activity logs for a user.
   * Endpoint: GET /api/admin/users/:id/activity
   *
   * @param {number} id - User ID
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Observable<{ data: UserActivity[], total: number }>} Activity logs
   *
   * @swagger
   * GET /api/admin/users/:id/activity
   * @apiParam {number} id - User ID (path parameter)
   * @apiParam {number} [page=1] - Page number
   * @apiParam {number} [limit=20] - Items per page
   * @apiParam {string} [type] - Filter by activity type
   * @apiSuccess {UserActivity[]} data - Activity array
   * @apiSuccess {number} total - Total count
   */
  getUserActivity(
    id: number,
    page: number = 1,
    limit: number = 20
  ): Observable<{ data: UserActivity[]; total: number }> {
    const httpParams = this.buildHttpParams({ page, limit });
    return this.http.get<{ data: UserActivity[]; total: number }>(
      `${API_BASE}/${id}/activity`,
      { params: httpParams }
    );
  }

  /**
   * Get User Permissions
   *
   * @description
   * Fetches effective permissions for a user.
   * Endpoint: GET /api/admin/users/:id/permissions
   *
   * @param {number} id - User ID
   * @returns {Observable<UserEffectivePermissions>} User permissions
   *
   * @swagger
   * GET /api/admin/users/:id/permissions
   * @apiParam {number} id - User ID (path parameter)
   * @apiSuccess {UserEffectivePermissions} - Permissions and roles
   */
  getUserPermissions(id: number): Observable<UserEffectivePermissions> {
    return this.http.get<UserEffectivePermissions>(`${API_BASE}/${id}/permissions`);
  }

  // ==========================================================================
  // BULK OPERATIONS
  // ==========================================================================

  /**
   * Bulk Ban Users
   *
   * @description
   * Bans multiple users at once.
   * Endpoint: POST /api/admin/users/bulk/ban
   *
   * @param {BulkBanRequest} request - Bulk ban request
   * @returns {Observable<BulkOperationResponse>} Bulk operation result
   *
   * @swagger
   * POST /api/admin/users/bulk/ban
   * @apiBody {BulkBanRequest} request - User IDs and ban details
   * @apiSuccess {BulkOperationResponse} - Success/failure counts
   */
  bulkBanUsers(request: BulkBanRequest): Observable<BulkOperationResponse> {
    return this.http.post<BulkOperationResponse>(`${API_BASE}/bulk/ban`, request);
  }

  /**
   * Bulk Suspend Users
   *
   * @description
   * Suspends multiple users at once.
   * Endpoint: POST /api/admin/users/bulk/suspend
   *
   * @param {BulkSuspendRequest} request - Bulk suspend request
   * @returns {Observable<BulkOperationResponse>} Bulk operation result
   */
  bulkSuspendUsers(request: BulkSuspendRequest): Observable<BulkOperationResponse> {
    return this.http.post<BulkOperationResponse>(`${API_BASE}/bulk/suspend`, request);
  }

  /**
   * Bulk Update Roles
   *
   * @description
   * Updates roles for multiple users at once.
   * Endpoint: POST /api/admin/users/bulk/roles
   *
   * @param {BulkUpdateRolesRequest} request - Bulk role update request
   * @returns {Observable<BulkOperationResponse>} Bulk operation result
   */
  bulkUpdateRoles(request: BulkUpdateRolesRequest): Observable<BulkOperationResponse> {
    return this.http.post<BulkOperationResponse>(`${API_BASE}/bulk/roles`, request);
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  /**
   * Build HTTP Params
   *
   * @description
   * Converts object to HttpParams, filtering out null/undefined values.
   *
   * @param {Record<string, any>} obj - Parameters object
   * @returns {HttpParams} HTTP parameters
   *
   * @private
   */
  private buildHttpParams(obj: Record<string, any>): HttpParams {
    let params = new HttpParams();

    Object.keys(obj).forEach(key => {
      const value = obj[key];

      if (value !== null && value !== undefined) {
        // Convert arrays to comma-separated strings
        if (Array.isArray(value)) {
          params = params.set(key, value.join(','));
        }
        // Convert dates to ISO strings
        else if (value instanceof Date) {
          params = params.set(key, value.toISOString());
        }
        // Convert other values to strings
        else {
          params = params.set(key, String(value));
        }
      }
    });

    return params;
  }
}
