import { Injectable, inject } from '@angular/core';
import { Observable, EMPTY, throwError } from 'rxjs';
import { tap, catchError, map, switchMap, finalize } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';

import { UserManagementStore } from './user-management.store';
import { UserManagementQuery } from './user-management.query';
import { UserDataService } from '../services/user-data.service';
import {
  QueryUsersDto,
  BanUserDto,
  SuspendUserDto,
  AssignRolesDto,
  UpdateUserDto,
  UserFilter,
  User,
  UserActivity,
  UserPermissions,
  UserStatus,
  UsersListResponse,
  ManagedUser
} from '../models';

/**
 * User Management Service
 * 
 * Orchestrates HTTP calls and state updates for user management operations.
 * Implements optimistic updates, error handling, and user feedback.
 * 
 * @description Central service that coordinates between:
 * - HTTP API calls (UserDataService)
 * - State management (UserManagementStore)
 * - State queries (UserManagementQuery)
 * - User feedback (MatSnackBar)
 * 
 * @example
 * ```typescript
 * constructor(private userService: UserManagementService) {}
 * 
 * ngOnInit() {
 *   this.userService.fetchUsers({ page: 1, limit: 10 }).subscribe();
 * }
 * ```
 */
@Injectable()
export class UserManagementService {
  private readonly store = inject(UserManagementStore);
  private readonly query = inject(UserManagementQuery);
  private readonly dataService = inject(UserDataService);
  private readonly snackBar = inject(MatSnackBar);

  /**
   * Fetch users with pagination and filters
   * 
   * @description Retrieves paginated user list and updates store with results.
   * Updates pagination metadata and cache timestamp.
   * 
   * @param params - Query parameters (page, limit, filters, sort)
   * @returns Observable that completes when fetch is successful
   * 
   * @example
   * ```typescript
   * this.userService.fetchUsers({
   *   page: 1,
   *   limit: 25,
   *   status: UserStatus.ACTIVE,
   *   sortBy: 'createdAt',
   *   sortOrder: 'DESC'
   * }).subscribe();
   * ```
   */
  fetchUsers(params?: QueryUsersDto): Observable<void> {
    this.store.setLoading(true);

    return this.dataService.getUsers(params || { page: 1, limit: 10 }).pipe(
      tap((response: UsersListResponse) => {
        this.store.set(response.data);
        this.store.updatePagination({
          page: response.page,
          limit: response.limit,
          total: response.total,
          totalCount: response.total,
          totalPages: response.totalPages
        });
        this.store.update(state => ({
          cache: {
            ...state.cache,
            lastFetched: Date.now()
          }
        }));
      }),
      catchError(error => {
        this.handleError('Failed to fetch users', error);
        return EMPTY;
      }),
      finalize(() => this.store.setLoading(false)),
      map(() => void 0)
    );
  }

  /**
   * Fetch single user by ID
   * 
   * @description Retrieves detailed user information and adds/updates in store.
   * Useful for loading details when user clicks on a row.
   * 
   * @param id - User ID
   * @returns Observable that emits the user and completes
   * 
   * @example
   * ```typescript
   * this.userService.fetchUserById(123).subscribe(user => {
   *   console.log('User loaded:', user);
   * });
   * ```
   */
  fetchUserById(id: number): Observable<User> {
    this.store.setOperationLoading('loadingDetail', true);

    return this.dataService.getUserById(id).pipe(
      tap((user: ManagedUser) => {
        this.store.upsert(id, user);
      }),
      catchError(error => {
        this.handleError('Failed to fetch user details', error);
        return throwError(() => error);
      }),
      finalize(() => this.store.setOperationLoading('loadingDetail', false))
    );
  }

  /**
   * Update user information
   * 
   * @description Updates user profile with optimistic update.
   * Reverts changes if API call fails.
   * 
   * @param id - User ID
   * @param dto - Updated user data
   * @returns Observable that completes when update is successful
   * 
   * @example
   * ```typescript
   * this.userService.updateUser(123, {
   *   name: 'John Doe',
   *   email: 'john@example.com',
   *   phoneNumber: '+1234567890'
   * }).subscribe();
   * ```
   */
  updateUser(id: number, dto: UpdateUserDto): Observable<void> {
    this.store.setOperationLoading('updatingRoles', true);

    // Store original state for rollback
    const originalUser = this.query.getEntity(id);
    if (!originalUser) {
      this.handleError('User not found in store', null);
      return EMPTY;
    }

    // Optimistic update
    this.store.update(id, dto as Partial<ManagedUser>);

    return this.dataService.updateUser(id, dto as Partial<ManagedUser>).pipe(
      tap((response: any) => {
        const updatedUser = response as ManagedUser;
        this.store.upsert(id, updatedUser);
        this.snackBar.open('User updated successfully', 'Close', {
          duration: 3000,
          panelClass: 'success-snackbar'
        });
      }),
      catchError(error => {
        // Rollback on error
        this.store.upsert(id, originalUser);
        this.handleError('Failed to update user', error);
        return EMPTY;
      }),
      finalize(() => this.store.setOperationLoading('updatingRoles', false)),
      map(() => void 0)
    );
  }

  /**
   * Ban user with reason
   * 
   * @description Bans user with optimistic status update.
   * Reverts status if API call fails.
   * 
   * @param id - User ID
   * @param dto - Ban reason and permanent flag
   * @returns Observable that completes when ban is successful
   * 
   * @example
   * ```typescript
   * this.userService.banUser(123, {
   *   reason: 'Violated terms of service',
   *   permanent: true
   * }).subscribe();
   * ```
   */
  banUser(id: number, dto: BanUserDto): Observable<void> {
    this.store.setOperationLoading('performingBan', true);

    // Store original status for rollback
    const originalUser = this.query.getEntity(id);
    if (!originalUser) {
      this.handleError('User not found in store', null);
      return EMPTY;
    }

    // Optimistic update
    this.store.update(id, { status: 'banned' as UserStatus });

    return this.dataService.banUser(id, dto).pipe(
      tap((updatedUser: ManagedUser) => {
        this.store.upsert(id, updatedUser);
        this.snackBar.open('User banned successfully', 'Close', {
          duration: 3000,
          panelClass: 'success-snackbar'
        });
      }),
      catchError(error => {
        // Rollback on error
        this.store.update(id, { status: originalUser.status });
        this.handleError('Failed to ban user', error);
        return EMPTY;
      }),
      finalize(() => this.store.setOperationLoading('performingBan', false)),
      map(() => void 0)
    );
  }

  /**
   * Unban user
   * 
   * @description Removes ban from user with optimistic status update.
   * Reverts status if API call fails.
   * 
   * @param id - User ID
   * @returns Observable that completes when unban is successful
   * 
   * @example
   * ```typescript
   * this.userService.unbanUser(123).subscribe();
   * ```
   */
  unbanUser(id: number): Observable<void> {
    this.store.setOperationLoading('performingBan', true);

    // Store original status for rollback
    const originalUser = this.query.getEntity(id);
    if (!originalUser) {
      this.handleError('User not found in store', null);
      return EMPTY;
    }

    // Optimistic update
    this.store.update(id, { status: 'active' as UserStatus });

    return this.dataService.unbanUser(id).pipe(
      tap((updatedUser: ManagedUser) => {
        this.store.upsert(id, updatedUser);
        this.snackBar.open('User unbanned successfully', 'Close', {
          duration: 3000,
          panelClass: 'success-snackbar'
        });
      }),
      catchError(error => {
        // Rollback on error
        this.store.update(id, { status: originalUser.status });
        this.handleError('Failed to unban user', error);
        return EMPTY;
      }),
      finalize(() => this.store.setOperationLoading('performingBan', false)),
      map(() => void 0)
    );
  }

  /**
   * Suspend user with reason and duration
   *
   * @description Suspends user with optimistic status update.
   * Reverts status if API call fails.
   *
   * @param id - User ID
   * @param dto - Suspend reason and end date
   * @returns Observable that completes when suspension is successful
   *
   * @example
   * ```typescript
   * this.userService.suspendUser(123, {
   *   reason: 'Temporary suspension for review',
   *   suspensionEndDate: new Date('2024-12-31')
   * }).subscribe();
   * ```
   */
  suspendUser(id: number, dto: SuspendUserDto): Observable<void> {
    this.store.setOperationLoading('performingSuspend', true);

    // Store original status for rollback
    const originalUser = this.query.getEntity(id);
    if (!originalUser) {
      this.handleError('User not found in store', null);
      return EMPTY;
    }

    // Optimistic update
    this.store.update(id, { status: 'suspended' as UserStatus });

    return this.dataService.suspendUser(id, dto).pipe(
      tap((updatedUser: ManagedUser) => {
        this.store.upsert(id, updatedUser);
        this.snackBar.open('User suspended successfully', 'Close', {
          duration: 3000,
          panelClass: 'success-snackbar'
        });
      }),
      catchError(error => {
        // Rollback on error
        this.store.update(id, { status: originalUser.status });
        this.handleError('Failed to suspend user', error);
        return EMPTY;
      }),
      finalize(() => this.store.setOperationLoading('performingSuspend', false)),
      map(() => void 0)
    );
  }

  /**
   * Unsuspend user
   *
   * @description Removes suspension from user with optimistic status update.
   * Reverts status if API call fails.
   *
   * @param id - User ID
   * @returns Observable that completes when unsuspension is successful
   *
   * @example
   * ```typescript
   * this.userService.unsuspendUser(123).subscribe();
   * ```
   */
  unsuspendUser(id: number): Observable<void> {
    this.store.setOperationLoading('performingSuspend', true);

    // Store original status for rollback
    const originalUser = this.query.getEntity(id);
    if (!originalUser) {
      this.handleError('User not found in store', null);
      return EMPTY;
    }

    // Optimistic update
    this.store.update(id, { status: 'active' as UserStatus });

    return this.dataService.unsuspendUser(id).pipe(
      tap((updatedUser: ManagedUser) => {
        this.store.upsert(id, updatedUser);
        this.snackBar.open('User unsuspended successfully', 'Close', {
          duration: 3000,
          panelClass: 'success-snackbar'
        });
      }),
      catchError(error => {
        // Rollback on error
        this.store.update(id, { status: originalUser.status });
        this.handleError('Failed to unsuspend user', error);
        return EMPTY;
      }),
      finalize(() => this.store.setOperationLoading('performingSuspend', false)),
      map(() => void 0)
    );
  }

  /**
   * Assign roles to user
   * 
   * @description Updates user's business role and admin role.
   * Optimistically updates roles in store.
   * 
   * @param id - User ID
   * @param dto - Business role and admin role ID
   * @returns Observable that completes when roles are assigned
   * 
   * @example
   * ```typescript
   * this.userService.assignRoles(123, {
   *   businessRole: BusinessRole.MERCHANT,
   *   adminRoleId: 5
   * }).subscribe();
   * ```
   */
  assignRoles(id: number, dto: AssignRolesDto): Observable<void> {
    this.store.setOperationLoading('updatingRoles', true);

    // Store original roles for rollback
    const originalUser = this.query.getEntity(id);
    if (!originalUser) {
      this.handleError('User not found in store', null);
      return EMPTY;
    }

    // Optimistic update
    this.store.update(id, {
      businessRole: dto.businessRole,
      adminRole: dto.adminRole
    });

    return this.dataService.assignRoles(id, dto).pipe(
      tap((updatedUser: ManagedUser) => {
        this.store.upsert(id, updatedUser);
        this.snackBar.open('Roles assigned successfully', 'Close', {
          duration: 3000,
          panelClass: 'success-snackbar'
        });
      }),
      catchError(error => {
        // Rollback on error
        this.store.update(id, {
          businessRole: originalUser.businessRole,
          adminRole: originalUser.adminRole
        });
        this.handleError('Failed to assign roles', error);
        return EMPTY;
      }),
      finalize(() => this.store.setOperationLoading('updatingRoles', false)),
      map(() => void 0)
    );
  }

  /**
   * Reset user password
   *
   * @description Sends password reset email to user.
   *
   * @param id - User ID
   * @returns Observable that completes when reset email is sent
   *
   * @example
   * ```typescript
   * this.userService.resetPassword(123).subscribe();
   * ```
   */
  resetPassword(id: number): Observable<void> {
    this.store.setOperationLoading('updatingRoles', true);

    return this.dataService.resetPassword(id).pipe(
      tap(() => {
        this.snackBar.open('Password reset email sent', 'Close', {
          duration: 3000,
          panelClass: 'success-snackbar'
        });
      }),
      catchError(error => {
        this.handleError('Failed to reset password', error);
        return EMPTY;
      }),
      finalize(() => this.store.setOperationLoading('updatingRoles', false)),
      map(() => void 0)
    );
  }

  /**
   * Fetch user activity log
   *
   * @description Retrieves paginated activity history for user.
   *
   * @param id - User ID
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 20)
   * @returns Observable that emits activity items and completes
   *
   * @example
   * ```typescript
   * this.userService.fetchUserActivity(123, 1, 20).subscribe(activity => {
   *   console.log('Activity:', activity.items);
   * });
   * ```
   */
  fetchUserActivity(id: number, page = 1, limit = 20): Observable<any> {
    this.store.setOperationLoading('loadingActivity', true);

    return this.dataService.getUserActivity(id, page, limit).pipe(
      catchError(error => {
        this.handleError('Failed to fetch user activity', error);
        return throwError(() => error);
      }),
      finalize(() => this.store.setOperationLoading('loadingActivity', false))
    );
  }

  /**
   * Fetch user effective permissions
   *
   * @description Retrieves computed permissions based on user's roles.
   *
   * @param id - User ID
   * @returns Observable that emits permissions and completes
   *
   * @example
   * ```typescript
   * this.userService.fetchUserPermissions(123).subscribe(permissions => {
   *   console.log('Effective permissions:', permissions.effectivePermissions);
   * });
   * ```
   */
  fetchUserPermissions(id: number): Observable<UserPermissions> {
    this.store.setOperationLoading('loadingPermissions', true);

    return this.dataService.getUserPermissions(id).pipe(
      catchError(error => {
        this.handleError('Failed to fetch user permissions', error);
        return throwError(() => error);
      }),
      finalize(() => this.store.setOperationLoading('loadingPermissions', false))
    );
  }

  /**
   * Select user
   * 
   * @description Sets active user ID in store for detail panel.
   * 
   * @param id - User ID to select
   * 
   * @example
   * ```typescript
   * this.userService.selectUser(123);
   * ```
   */
  selectUser(id: number | null): void {
    this.store.setActive(id);
  }

  /**
   * Apply filters
   * 
   * @description Updates filter state and refetches users.
   * 
   * @param filter - Filter criteria
   * @returns Observable that completes when users are refetched
   * 
   * @example
   * ```typescript
   * this.userService.applyFilters({
   *   status: [UserStatus.ACTIVE],
   *   roles: [BusinessRole.MERCHANT],
   *   createdAfter: new Date('2024-01-01')
   * }).subscribe();
   * ```
   */
  applyFilters(filter: UserFilter): Observable<void> {
    this.store.updateFilters(filter);

    // Convert filter to query params
    const queryParams: QueryUsersDto = {
      page: 1, // Reset to first page
      limit: this.query.getValue().pagination.limit,
      status: filter.status || undefined,
      role: filter.role || undefined,
      adminRole: filter.adminRole || undefined
    };

    return this.fetchUsers(queryParams);
  }

  /**
   * Apply search query
   * 
   * @description Updates search state and refetches users.
   * 
   * @param query - Search query string
   * @returns Observable that completes when users are refetched
   * 
   * @example
   * ```typescript
   * this.userService.applySearch('john@example.com').subscribe();
   * ```
   */
  applySearch(query: string): Observable<void> {
    this.store.updateSearch(query);

    const queryParams: QueryUsersDto = {
      page: 1, // Reset to first page
      limit: this.query.getValue().pagination.limit,
      search: query
    };

    return this.fetchUsers(queryParams);
  }

  /**
   * Clear filters
   * 
   * @description Resets all filters to default state and refetches users.
   * 
   * @returns Observable that completes when users are refetched
   * 
   * @example
   * ```typescript
   * this.userService.clearFilters().subscribe();
   * ```
   */
  clearFilters(): Observable<void> {
    this.store.resetFilters();
    this.store.updateSearch('');

    return this.fetchUsers({ page: 1, limit: this.query.getValue().pagination.limit });
  }

  /**
   * Refresh users
   * 
   * @description Refetches current page with existing filters.
   * 
   * @returns Observable that completes when users are refetched
   * 
   * @example
   * ```typescript
   * this.userService.refresh().subscribe();
   * ```
   */
  refresh(): Observable<void> {
    const state = this.query.getValue();
    const queryParams: QueryUsersDto = {
      page: state.pagination.page,
      limit: state.pagination.limit,
      search: state.search || undefined,
      status: state.filters.status || undefined,
      role: state.filters.role || undefined,
      adminRole: state.filters.adminRole || undefined
    };

    return this.fetchUsers(queryParams);
  }

  /**
   * Handle error with user feedback
   * 
   * @description Logs error and shows snackbar message.
   * Resets loading state.
   * 
   * @param message - User-friendly error message
   * @param error - Error object from HTTP call
   * 
   * @private
   */
  private handleError(message: string, error: any): void {
    console.error(message, error);
    
    const errorMessage = error?.error?.message || error?.message || message;
    
    this.snackBar.open(errorMessage, 'Close', {
      duration: 5000,
      panelClass: 'error-snackbar'
    });
    
    this.store.setLoading(false);
  }
}
