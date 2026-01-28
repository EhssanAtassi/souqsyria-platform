/**
 * User Management - Akita Store
 *
 * @description
 * Akita Entity Store for managing user management state.
 * Stores user entities, UI state, filters, pagination, and cache.
 *
 * Features:
 * - Entity storage for users with normalized structure
 * - UI state (loading, selection, bulk actions)
 * - Filter criteria
 * - Pagination state
 * - Client-side cache with TTL
 *
 * @module UserManagement/State
 * @version 1.0.0
 *
 * @see https://opensource.salesforce.com/akita/docs/entities/entity-store
 *
 * @swagger
 * Manages the client-side state for the User Management dashboard.
 * All state updates are immutable and reactive.
 */

import { Injectable } from '@angular/core';
import { EntityState, EntityStore, Store, StoreConfig } from '@datorama/akita';
import { ManagedUser, UserFilter, PaginationState, UserActivity } from '../models';
import { createInitialFilters, createInitialPagination } from '../models/user-filter.model';

// ============================================================================
// STATE INTERFACE
// ============================================================================

/**
 * User Management State Interface
 *
 * @description
 * Complete state shape for the user management feature.
 * Extends Akita's EntityState to include users as entities.
 *
 * @interface UserManagementState
 * @extends {EntityState<ManagedUser>}
 *
 * @property {ManagedUser[]} ids - Entity IDs (inherited from EntityState)
 * @property {Record<number, ManagedUser>} entities - Entity map (inherited from EntityState)
 * @property {UIState} ui - UI-specific state
 * @property {UserFilter} filters - Current filter criteria
 * @property {PaginationState} pagination - Pagination state
 * @property {CacheState} cache - Cache metadata
 */
export interface UserManagementState extends EntityState<ManagedUser, number> {
  /**
   * UI-specific state
   *
   * Tracks loading states, user selection, and bulk operations
   */
  ui: {
    /** Global loading indicator */
    loading: boolean;

    /** Currently selected user ID (for detail panel) */
    selectedUserId: number | null;

    /** IDs of users selected for bulk operations */
    bulkSelectedIds: number[];

    /** Loading state for specific operations */
    operations: {
      /** Loading detail for specific user */
      loadingDetail: boolean;

      /** Loading activity logs */
      loadingActivity: boolean;

      /** Loading permissions */
      loadingPermissions: boolean;

      /** Performing ban/unban */
      performingBan: boolean;

      /** Performing suspend/unsuspend */
      performingSuspend: boolean;

      /** Updating roles */
      updatingRoles: boolean;
    };
  };

  /**
   * Current filter criteria
   *
   * Applied to the user list for filtering
   */
  filters: UserFilter;

  /**
   * Pagination state
   *
   * Tracks current page, page size, total count, and sorting
   */
  pagination: PaginationState;

  /**
   * Search query
   *
   * Current search text query
   */
  search?: string;

  /**
   * Cache metadata
   *
   * Tracks when data was last fetched and caches activity logs
   */
  cache: {
    /** Timestamp of last successful fetch (null if never fetched) */
    lastFetched: number | null;

    /** Cached activity logs by user ID */
    activityLogs: Record<number, UserActivity[]>;

    /** Cached permissions by user ID */
    userPermissions: Record<number, string[]>;
  };
}

/**
 * Initial UI State
 *
 * @description
 * Factory function to create initial UI state.
 *
 * @returns {UserManagementState['ui']} Initial UI state
 */
function createInitialUIState(): UserManagementState['ui'] {
  return {
    loading: false,
    selectedUserId: null,
    bulkSelectedIds: [],
    operations: {
      loadingDetail: false,
      loadingActivity: false,
      loadingPermissions: false,
      performingBan: false,
      performingSuspend: false,
      updatingRoles: false
    }
  };
}

/**
 * Initial Cache State
 *
 * @description
 * Factory function to create initial cache state.
 *
 * @returns {UserManagementState['cache']} Initial cache state
 */
function createInitialCacheState(): UserManagementState['cache'] {
  return {
    lastFetched: null,
    activityLogs: {},
    userPermissions: {}
  };
}

/**
 * Initial State Factory
 *
 * @description
 * Creates the complete initial state for the store.
 *
 * @returns {UserManagementState} Initial state object
 */
export function createInitialState(): UserManagementState {
  return {
    ui: createInitialUIState(),
    filters: createInitialFilters(),
    pagination: createInitialPagination(10),
    search: '',
    cache: createInitialCacheState()
  };
}

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

/**
 * User Management Store
 *
 * @description
 * Akita Entity Store for user management state.
 * Provides methods to update state immutably.
 *
 * Key Features:
 * - Entity management (add, update, remove users)
 * - UI state management
 * - Filter and pagination updates
 * - Cache management
 * - Bulk selection
 *
 * @class UserManagementStore
 * @extends {EntityStore<UserManagementState, ManagedUser>}
 *
 * @example
 * ```typescript
 * // Inject in service
 * constructor(private store: UserManagementStore) {}
 *
 * // Add users from API
 * this.store.set(users);
 *
 * // Update a single user
 * this.store.update(userId, { status: 'active' });
 *
 * // Set loading state
 * this.store.setLoading(true);
 * ```
 */
@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'user-management', idKey: 'id', resettable: true })
export class UserManagementStore extends EntityStore<UserManagementState, ManagedUser> {
  constructor() {
    super(createInitialState());
  }

  // ==========================================================================
  // UI STATE METHODS
  // ==========================================================================

  /**
   * Set Global Loading State
   *
   * @description
   * Updates the global loading indicator.
   *
   * @param {boolean} loading - Loading state
   *
   * @example
   * ```typescript
   * this.store.setLoading(true);
   * // ... API call
   * this.store.setLoading(false);
   * ```
   */
  override setLoading(loading: boolean): void {
    this.update(state => ({
      ui: {
        ...state.ui,
        loading
      }
    }));
  }

  /**
   * Set Operation Loading State
   *
   * @description
   * Updates loading state for specific operations.
   *
   * @param {keyof UserManagementState['ui']['operations']} operation - Operation name
   * @param {boolean} loading - Loading state
   */
  setOperationLoading(
    operation: keyof UserManagementState['ui']['operations'],
    loading: boolean
  ): void {
    this.update(state => ({
      ui: {
        ...state.ui,
        operations: {
          ...state.ui.operations,
          [operation]: loading
        }
      }
    }));
  }

  /**
   * Set Selected User
   *
   * @description
   * Sets the currently selected user for the detail panel.
   * Pass null to clear selection.
   *
   * @param {number | null} userId - User ID or null to clear
   *
   * @example
   * ```typescript
   * // Select user
   * this.store.setSelectedUser(123);
   *
   * // Clear selection
   * this.store.setSelectedUser(null);
   * ```
   */
  setSelectedUser(userId: number | null): void {
    this.update(state => ({
      ui: {
        ...state.ui,
        selectedUserId: userId
      }
    }));
  }

  /**
   * Set Bulk Selected Users
   *
   * @description
   * Sets the array of user IDs selected for bulk operations.
   *
   * @param {number[]} userIds - Array of user IDs
   *
   * @example
   * ```typescript
   * this.store.setBulkSelected([1, 2, 3]);
   * ```
   */
  setBulkSelected(userIds: number[]): void {
    this.update(state => ({
      ui: {
        ...state.ui,
        bulkSelectedIds: userIds
      }
    }));
  }

  /**
   * Toggle Bulk Selection
   *
   * @description
   * Toggles a user in/out of bulk selection.
   *
   * @param {number} userId - User ID to toggle
   */
  toggleBulkSelection(userId: number): void {
    this.update(state => {
      const bulkSelectedIds = [...state.ui.bulkSelectedIds];
      const index = bulkSelectedIds.indexOf(userId);

      if (index === -1) {
        bulkSelectedIds.push(userId);
      } else {
        bulkSelectedIds.splice(index, 1);
      }

      return {
        ui: {
          ...state.ui,
          bulkSelectedIds
        }
      };
    });
  }

  /**
   * Clear Bulk Selection
   *
   * @description
   * Clears all bulk selections.
   */
  clearBulkSelection(): void {
    this.update(state => ({
      ui: {
        ...state.ui,
        bulkSelectedIds: []
      }
    }));
  }

  // ==========================================================================
  // FILTER METHODS
  // ==========================================================================

  /**
   * Update Filters
   *
   * @description
   * Updates filter criteria (partial update).
   *
   * @param {Partial<UserFilter>} filters - Filter updates
   *
   * @example
   * ```typescript
   * this.store.updateFilters({ status: 'active' });
   * this.store.updateFilters({ businessRole: 'seller', status: null });
   * ```
   */
  updateFilters(filters: Partial<UserFilter>): void {
    this.update(state => ({
      filters: {
        ...state.filters,
        ...filters
      }
    }));
  }

  /**
   * Update Search Query
   *
   * @description
   * Updates the search query string.
   *
   * @param {string} query - Search query
   *
   * @example
   * ```typescript
   * this.store.updateSearch('john@example.com');
   * ```
   */
  updateSearch(query: string): void {
    this.update({ search: query });
  }

  /**
   * Reset Filters
   *
   * @description
   * Resets all filters to initial state.
   */
  resetFilters(): void {
    this.update({
      filters: createInitialFilters()
    });
  }

  // ==========================================================================
  // PAGINATION METHODS
  // ==========================================================================

  /**
   * Update Pagination
   *
   * @description
   * Updates pagination state (partial update).
   *
   * @param {Partial<PaginationState>} pagination - Pagination updates
   *
   * @example
   * ```typescript
   * this.store.updatePagination({ page: 2 });
   * this.store.updatePagination({ total: 1250, totalPages: 125 });
   * ```
   */
  updatePagination(pagination: Partial<PaginationState>): void {
    this.update(state => ({
      pagination: {
        ...state.pagination,
        ...pagination
      }
    }));
  }

  /**
   * Reset Pagination
   *
   * @description
   * Resets pagination to initial state (page 1).
   */
  resetPagination(): void {
    this.update(state => ({
      pagination: createInitialPagination(state.pagination.limit)
    }));
  }

  // ==========================================================================
  // CACHE METHODS
  // ==========================================================================

  /**
   * Update Cache Timestamp
   *
   * @description
   * Updates the last fetched timestamp.
   *
   * @param {number} timestamp - Unix timestamp (Date.now())
   */
  updateCacheTimestamp(timestamp: number): void {
    this.update(state => ({
      cache: {
        ...state.cache,
        lastFetched: timestamp
      }
    }));
  }

  /**
   * Cache Activity Logs
   *
   * @description
   * Caches activity logs for a user.
   *
   * @param {number} userId - User ID
   * @param {UserActivity[]} activities - Activity logs
   */
  cacheActivityLogs(userId: number, activities: UserActivity[]): void {
    this.update(state => ({
      cache: {
        ...state.cache,
        activityLogs: {
          ...state.cache.activityLogs,
          [userId]: activities
        }
      }
    }));
  }

  /**
   * Cache User Permissions
   *
   * @description
   * Caches permissions for a user.
   *
   * @param {number} userId - User ID
   * @param {string[]} permissions - Permission array
   */
  cacheUserPermissions(userId: number, permissions: string[]): void {
    this.update(state => ({
      cache: {
        ...state.cache,
        userPermissions: {
          ...state.cache.userPermissions,
          [userId]: permissions
        }
      }
    }));
  }

  /**
   * Clear Cache
   *
   * @description
   * Clears all cached data.
   */
  clearCache(): void {
    this.update({
      cache: createInitialCacheState()
    });
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /**
   * Reset Store
   *
   * @description
   * Resets the entire store to initial state.
   * Useful for logout or feature reset.
   */
  override reset(): void {
    this.set([]);
    this.update(createInitialState());
  }
}
