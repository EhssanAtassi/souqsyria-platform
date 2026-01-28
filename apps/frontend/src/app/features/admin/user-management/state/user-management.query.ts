/**
 * User Management - Akita Query
 *
 * @description
 * Akita Query service for selecting and deriving data from the User Management Store.
 * Provides 30+ reactive observables and synchronous getters for accessing state.
 *
 * Features:
 * - Observable selectors with automatic change detection
 * - Computed/derived selectors with memoization
 * - Client-side filtering based on filter criteria
 * - Synchronous getters for immediate access
 * - Type-safe selection methods
 *
 * @module UserManagement/State
 * @version 1.0.0
 *
 * @see https://opensource.salesforce.com/akita/docs/entities/entity-query
 *
 * @swagger
 * Provides reactive queries for the User Management dashboard state.
 * All observables emit on state changes and complete on service destroy.
 */

import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { Observable } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { UserManagementStore, UserManagementState } from './user-management.store';
import { ManagedUser, UserFilter, PaginationState, UserActivity, UserStatus } from '../models';

/**
 * User Management Query Service
 *
 * @description
 * Query service for reactive state selection from UserManagementStore.
 * Extends Akita's QueryEntity to provide user-specific selectors.
 *
 * Observable Properties (30+):
 * - Entity selectors (users$, selectedUser$)
 * - UI state selectors (loading$, operations$)
 * - Filter selectors (filters$, hasActiveFilters$)
 * - Pagination selectors (pagination$, currentPage$)
 * - Derived selectors (filteredUsers$, paginatedUsers$)
 * - Cache selectors (cachedActivities$, cachedPermissions$)
 *
 * Synchronous Getters:
 * - getSelectedUser()
 * - isUserSelected()
 * - getBulkSelectedIds()
 * - hasActiveFilters()
 *
 * @class UserManagementQuery
 * @extends {QueryEntity<UserManagementState, ManagedUser>}
 *
 * @example
 * ```typescript
 * constructor(private query: UserManagementQuery) {}
 *
 * ngOnInit() {
 *   // Subscribe to users
 *   this.query.users$.subscribe(users => {
 *     console.log('Users:', users);
 *   });
 *
 *   // Get selected user synchronously
 *   const user = this.query.getSelectedUser();
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class UserManagementQuery extends QueryEntity<UserManagementState, ManagedUser> {
  constructor(protected override store: UserManagementStore) {
    super(store);
  }

  // ==========================================================================
  // ENTITY SELECTORS
  // ==========================================================================

  /**
   * All Users Observable
   *
   * @description
   * Emits all users from the store as an array.
   * Emits on any user entity change.
   *
   * @returns {Observable<ManagedUser[]>} Array of all users
   */
  users$: Observable<ManagedUser[]> = this.selectAll();

  /**
   * Users Count Observable
   *
   * @description
   * Emits the count of users in the store.
   *
   * @returns {Observable<number>} Number of users
   */
  usersCount$: Observable<number> = this.selectCount();

  /**
   * Has Users Observable
   *
   * @description
   * Emits true if store has any users.
   *
   * @returns {Observable<boolean>} True if users exist
   */
  hasUsers$: Observable<boolean> = this.usersCount$.pipe(
    map(count => count > 0),
    distinctUntilChanged()
  );

  /**
   * Selected User Observable
   *
   * @description
   * Emits the currently selected user entity.
   * Emits undefined if no user is selected.
   *
   * @returns {Observable<ManagedUser | undefined>} Selected user or undefined
   */
  selectedUser$: Observable<ManagedUser | undefined> = this.select(state => state.ui.selectedUserId).pipe(
    distinctUntilChanged(),
    map(userId => userId ? this.getEntity(userId) : undefined)
  );

  /**
   * Has Selected User Observable
   *
   * @description
   * Emits true if a user is currently selected.
   *
   * @returns {Observable<boolean>} True if user selected
   */
  hasSelectedUser$: Observable<boolean> = this.select(state => state.ui.selectedUserId !== null).pipe(
    distinctUntilChanged()
  );

  // ==========================================================================
  // UI STATE SELECTORS
  // ==========================================================================

  /**
   * Loading State Observable
   *
   * @description
   * Emits global loading state.
   *
   * @returns {Observable<boolean>} Loading state
   */
  loading$: Observable<boolean> = this.select(state => state.ui.loading).pipe(
    distinctUntilChanged()
  );

  /**
   * Operations Loading State Observable
   *
   * @description
   * Emits loading states for all operations.
   *
   * @returns {Observable<UserManagementState['ui']['operations']>} Operations state
   */
  operations$: Observable<UserManagementState['ui']['operations']> = this.select(
    state => state.ui.operations
  );

  /**
   * Loading Detail Observable
   *
   * @description
   * Emits loading state for user detail.
   *
   * @returns {Observable<boolean>} Loading detail state
   */
  loadingDetail$: Observable<boolean> = this.select(
    state => state.ui.operations.loadingDetail
  ).pipe(distinctUntilChanged());

  /**
   * Loading Activity Observable
   *
   * @description
   * Emits loading state for activity logs.
   *
   * @returns {Observable<boolean>} Loading activity state
   */
  loadingActivity$: Observable<boolean> = this.select(
    state => state.ui.operations.loadingActivity
  ).pipe(distinctUntilChanged());

  /**
   * Performing Ban Observable
   *
   * @description
   * Emits loading state for ban operation.
   *
   * @returns {Observable<boolean>} Performing ban state
   */
  performingBan$: Observable<boolean> = this.select(
    state => state.ui.operations.performingBan
  ).pipe(distinctUntilChanged());

  /**
   * Bulk Selected IDs Observable
   *
   * @description
   * Emits array of user IDs selected for bulk operations.
   *
   * @returns {Observable<number[]>} Bulk selected user IDs
   */
  bulkSelectedIds$: Observable<number[]> = this.select(state => state.ui.bulkSelectedIds);

  /**
   * Bulk Selected Count Observable
   *
   * @description
   * Emits count of users selected for bulk operations.
   *
   * @returns {Observable<number>} Number of selected users
   */
  bulkSelectedCount$: Observable<number> = this.bulkSelectedIds$.pipe(
    map(ids => ids.length),
    distinctUntilChanged()
  );

  /**
   * Has Bulk Selection Observable
   *
   * @description
   * Emits true if any users are selected for bulk operations.
   *
   * @returns {Observable<boolean>} True if bulk selection exists
   */
  hasBulkSelection$: Observable<boolean> = this.bulkSelectedCount$.pipe(
    map(count => count > 0),
    distinctUntilChanged()
  );

  /**
   * Bulk Selected Users Observable
   *
   * @description
   * Emits full user entities for bulk selected IDs.
   *
   * @returns {Observable<ManagedUser[]>} Bulk selected users
   */
  bulkSelectedUsers$: Observable<ManagedUser[]> = this.bulkSelectedIds$.pipe(
    map(ids => ids.map(id => this.getEntity(id)).filter((u): u is ManagedUser => !!u))
  );

  // ==========================================================================
  // FILTER SELECTORS
  // ==========================================================================

  /**
   * Filters Observable
   *
   * @description
   * Emits current filter criteria.
   *
   * @returns {Observable<UserFilter>} Current filters
   */
  filters$: Observable<UserFilter> = this.select(state => state.filters);

  /**
   * Has Active Filters Observable
   *
   * @description
   * Emits true if any filters are active (non-null).
   *
   * @returns {Observable<boolean>} True if filters active
   */
  hasActiveFilters$: Observable<boolean> = this.filters$.pipe(
    map(filters => Object.values(filters).some(value => value !== null)),
    distinctUntilChanged()
  );

  /**
   * Active Filters Count Observable
   *
   * @description
   * Emits count of active filters.
   *
   * @returns {Observable<number>} Number of active filters
   */
  activeFiltersCount$: Observable<number> = this.filters$.pipe(
    map(filters => Object.values(filters).filter(value => value !== null).length),
    distinctUntilChanged()
  );

  /**
   * Filtered Users Observable
   *
   * @description
   * Emits users after applying client-side filters.
   * Filters are applied in this order:
   * 1. Status filter
   * 2. Business role filter
   * 3. Admin role filter
   * 4. Verification filters
   * 5. Date range filter
   *
   * @returns {Observable<ManagedUser[]>} Filtered users
   */
  filteredUsers$: Observable<ManagedUser[]> = this.selectAll({
    filterBy: (user: ManagedUser) => {
      const filters = this.getValue().filters;

      // Status filter
      if (filters.status !== null && user.status !== filters.status) {
        return false;
      }

      // Business role filter
      if (filters.businessRole !== null && user.businessRole !== filters.businessRole) {
        return false;
      }

      // Admin role filter
      if (filters.adminRole !== undefined && user.adminRole !== filters.adminRole) {
        return false;
      }

      // Email verification filter
      if (filters.isEmailVerified !== null && user.isEmailVerified !== filters.isEmailVerified) {
        return false;
      }

      // Phone verification filter
      if (filters.isPhoneVerified !== null && user.isPhoneVerified !== filters.isPhoneVerified) {
        return false;
      }

      // Two-factor filter
      if (filters.hasTwoFactor !== null && user.twoFactorEnabled !== filters.hasTwoFactor) {
        return false;
      }

      // Date range filter
      if (filters.dateRange !== null) {
        const userDate = new Date(user.createdAt);
        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);

        if (userDate < startDate || userDate > endDate) {
          return false;
        }
      }

      return true;
    }
  });

  /**
   * Filtered Users Count Observable
   *
   * @description
   * Emits count of users after filtering.
   *
   * @returns {Observable<number>} Filtered users count
   */
  filteredUsersCount$: Observable<number> = this.filteredUsers$.pipe(
    map(users => users.length),
    distinctUntilChanged()
  );

  // ==========================================================================
  // PAGINATION SELECTORS
  // ==========================================================================

  /**
   * Pagination Observable
   *
   * @description
   * Emits current pagination state.
   *
   * @returns {Observable<PaginationState>} Pagination state
   */
  pagination$: Observable<PaginationState> = this.select(state => state.pagination);

  /**
   * Current Page Observable
   *
   * @description
   * Emits current page number.
   *
   * @returns {Observable<number>} Current page
   */
  currentPage$: Observable<number> = this.select(state => state.pagination.page).pipe(
    distinctUntilChanged()
  );

  /**
   * Page Size Observable
   *
   * @description
   * Emits current page size (items per page).
   *
   * @returns {Observable<number>} Page size
   */
  pageSize$: Observable<number> = this.select(state => state.pagination.limit).pipe(
    distinctUntilChanged()
  );

  /**
   * Total Count Observable
   *
   * @description
   * Emits total count from API (not filtered count).
   *
   * @returns {Observable<number>} Total count
   */
  totalCount$: Observable<number> = this.select(state => state.pagination.total).pipe(
    distinctUntilChanged()
  );

  /**
   * Total Pages Observable
   *
   * @description
   * Emits total number of pages.
   *
   * @returns {Observable<number>} Total pages
   */
  totalPages$: Observable<number> = this.select(state => state.pagination.totalPages).pipe(
    distinctUntilChanged()
  );

  /**
   * Sort By Observable
   *
   * @description
   * Emits current sort column.
   *
   * @returns {Observable<string>} Sort column
   */
  sortBy$: Observable<string> = this.select(state => state.pagination.sortBy).pipe(
    distinctUntilChanged()
  );

  /**
   * Sort Order Observable
   *
   * @description
   * Emits current sort direction.
   *
   * @returns {Observable<'asc' | 'desc'>} Sort direction
   */
  sortOrder$: Observable<'asc' | 'desc'> = this.select(state => state.pagination.sortOrder).pipe(
    distinctUntilChanged()
  );

  /**
   * Pagination Info Observable
   *
   * @description
   * Emits formatted pagination info for display.
   *
   * @returns {Observable<string>} Pagination info (e.g., "1-10 of 1250")
   */
  paginationInfo$: Observable<string> = this.pagination$.pipe(
    map(pagination => {
      const start = (pagination.page - 1) * pagination.limit + 1;
      const end = Math.min(pagination.page * pagination.limit, pagination.total);
      return `${start}-${end} of ${pagination.total}`;
    })
  );

  // ==========================================================================
  // CACHE SELECTORS
  // ==========================================================================

  /**
   * Last Fetched Timestamp Observable
   *
   * @description
   * Emits timestamp of last successful fetch.
   *
   * @returns {Observable<number | null>} Last fetched timestamp
   */
  lastFetched$: Observable<number | null> = this.select(state => state.cache.lastFetched).pipe(
    distinctUntilChanged()
  );

  /**
   * Is Cache Valid Observable
   *
   * @description
   * Emits true if cache is still valid (within TTL).
   * Uses 5-minute TTL by default.
   *
   * @param {number} ttl - Cache TTL in milliseconds (default: 5 minutes)
   * @returns {Observable<boolean>} True if cache is valid
   */
  isCacheValid$(ttl: number = 5 * 60 * 1000): Observable<boolean> {
    return this.lastFetched$.pipe(
      map(lastFetched => {
        if (lastFetched === null) return false;
        return Date.now() - lastFetched < ttl;
      }),
      distinctUntilChanged()
    );
  }

  /**
   * Cached Activity Logs Observable
   *
   * @description
   * Emits cached activity logs for a specific user.
   *
   * @param {number} userId - User ID
   * @returns {Observable<UserActivity[]>} Cached activities or empty array
   */
  getCachedActivities$(userId: number): Observable<UserActivity[]> {
    return this.select(state => state.cache.activityLogs[userId] || []);
  }

  /**
   * Cached Permissions Observable
   *
   * @description
   * Emits cached permissions for a specific user.
   *
   * @param {number} userId - User ID
   * @returns {Observable<string[]>} Cached permissions or empty array
   */
  getCachedPermissions$(userId: number): Observable<string[]> {
    return this.select(state => state.cache.userPermissions[userId] || []);
  }

  // ==========================================================================
  // DERIVED/COMPUTED SELECTORS
  // ==========================================================================

  /**
   * Users By Status Observable
   *
   * @description
   * Emits users grouped by status.
   *
   * @returns {Observable<Record<UserStatus, ManagedUser[]>>} Users by status
   */
  usersByStatus$: Observable<Record<UserStatus, ManagedUser[]>> = this.users$.pipe(
    map(users => {
      const grouped: Record<UserStatus, ManagedUser[]> = {
        active: [],
        inactive: [],
        pending: [],
        suspended: [],
        banned: []
      };

      users.forEach(user => {
        grouped[user.status].push(user);
      });

      return grouped;
    })
  );

  /**
   * Status Counts Observable
   *
   * @description
   * Emits count of users for each status.
   *
   * @returns {Observable<Record<UserStatus, number>>} Status counts
   */
  statusCounts$: Observable<Record<UserStatus, number>> = this.usersByStatus$.pipe(
    map(grouped => ({
      active: grouped.active.length,
      inactive: grouped.inactive.length,
      pending: grouped.pending.length,
      suspended: grouped.suspended.length,
      banned: grouped.banned.length
    }))
  );

  /**
   * Is All Selected Observable
   *
   * @description
   * Emits true if all visible users are selected.
   *
   * @returns {Observable<boolean>} True if all selected
   */
  isAllSelected$: Observable<boolean> = this.filteredUsers$.pipe(
    map(users => {
      const selectedIds = this.getValue().ui.bulkSelectedIds;
      if (users.length === 0 || selectedIds.length === 0) return false;
      return users.every(user => selectedIds.includes(user.id));
    })
  );

  // ==========================================================================
  // SYNCHRONOUS GETTERS
  // ==========================================================================

  /**
   * Get Selected User (Sync)
   *
   * @description
   * Synchronously returns the currently selected user.
   *
   * @returns {ManagedUser | undefined} Selected user or undefined
   */
  getSelectedUser(): ManagedUser | undefined {
    const userId = this.getValue().ui.selectedUserId;
    return userId ? this.getEntity(userId) : undefined;
  }

  /**
   * Is User Selected (Sync)
   *
   * @description
   * Synchronously checks if a user is selected.
   *
   * @param {number} userId - User ID to check
   * @returns {boolean} True if user is selected
   */
  isUserSelected(userId: number): boolean {
    return this.getValue().ui.selectedUserId === userId;
  }

  /**
   * Get Bulk Selected IDs (Sync)
   *
   * @description
   * Synchronously returns bulk selected user IDs.
   *
   * @returns {number[]} Array of selected user IDs
   */
  getBulkSelectedIds(): number[] {
    return this.getValue().ui.bulkSelectedIds;
  }

  /**
   * Is User In Bulk Selection (Sync)
   *
   * @description
   * Synchronously checks if a user is in bulk selection.
   *
   * @param {number} userId - User ID to check
   * @returns {boolean} True if user is in bulk selection
   */
  isUserInBulkSelection(userId: number): boolean {
    return this.getValue().ui.bulkSelectedIds.includes(userId);
  }

  /**
   * Has Active Filters (Sync)
   *
   * @description
   * Synchronously checks if any filters are active.
   *
   * @returns {boolean} True if filters are active
   */
  hasActiveFilters(): boolean {
    const filters = this.getValue().filters;
    return Object.values(filters).some(value => value !== null);
  }

  /**
   * Get Current Filters (Sync)
   *
   * @description
   * Synchronously returns current filter state.
   *
   * @returns {UserFilter} Current filters
   */
  getCurrentFilters(): UserFilter {
    return this.getValue().filters;
  }

  /**
   * Get Current Pagination (Sync)
   *
   * @description
   * Synchronously returns current pagination state.
   *
   * @returns {PaginationState} Current pagination
   */
  getCurrentPagination(): PaginationState {
    return this.getValue().pagination;
  }
}
