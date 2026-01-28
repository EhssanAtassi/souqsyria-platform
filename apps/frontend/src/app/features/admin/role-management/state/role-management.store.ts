/**
 * Role Management - Akita Store
 *
 * @description
 * Akita Entity Store for managing role management state.
 * Stores role entities, permissions, templates, UI state, filters, pagination, and cache.
 *
 * Features:
 * - Entity storage for roles with normalized structure
 * - Permissions and templates caching
 * - UI state (loading, selection, bulk actions)
 * - Filter criteria
 * - Pagination state
 * - Client-side cache with TTL (5 minutes)
 *
 * @module RoleManagement/State
 * @version 1.0.0
 *
 * @see https://opensource.salesforce.com/akita/docs/entities/entity-store
 */

import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { Role, Permission, RoleTemplate, PaginationState, createInitialPagination } from '../models';

// ============================================================================
// STATE INTERFACE
// ============================================================================

/**
 * Role Management State Interface
 *
 * @description
 * Complete state shape for the role management feature.
 * Extends Akita's EntityState to include roles as entities.
 *
 * @interface RoleManagementState
 * @extends {EntityState<Role, number>}
 */
export interface RoleManagementState extends EntityState<Role, number> {
  /**
   * UI-specific state
   */
  ui: {
    /** Global loading indicator */
    loading: boolean;

    /** Currently selected role ID (for detail panel) */
    selectedRoleId: number | null;

    /** IDs of roles selected for bulk operations */
    bulkSelectedIds: number[];

    /** Loading state for specific operations */
    operations: {
      /** Loading detail for specific role */
      loadingDetail: boolean;

      /** Loading permissions */
      loadingPermissions: boolean;

      /** Loading templates */
      loadingTemplates: boolean;

      /** Loading users with role */
      loadingUsers: boolean;

      /** Performing clone */
      performingClone: boolean;

      /** Updating permissions */
      updatingPermissions: boolean;

      /** Updating priority */
      updatingPriority: boolean;
    };
  };

  /**
   * Current filter criteria
   */
  filters: {
    /** Search query */
    search: string | null;

    /** Filter by active status */
    isActive: boolean | null;

    /** Filter by system flag */
    isSystem: boolean | null;

    /** Minimum priority */
    minPriority: number | null;

    /** Maximum priority */
    maxPriority: number | null;
  };

  /**
   * Pagination state
   */
  pagination: PaginationState;

  /**
   * Cache data
   */
  cache: {
    /** Timestamp of last successful fetch (null if never fetched) */
    lastFetched: number | null;

    /** Cached permissions */
    permissions: Permission[];

    /** Cached role templates */
    templates: RoleTemplate[];

    /** Users by role ID */
    usersByRole: Record<number, Array<{
      id: number;
      email: string;
      firstName: string;
      lastName: string;
      avatarUrl?: string;
    }>>;
  };
}

/**
 * Initial Filters Factory
 */
function createInitialFilters(): RoleManagementState['filters'] {
  return {
    search: null,
    isActive: null,
    isSystem: null,
    minPriority: null,
    maxPriority: null
  };
}

/**
 * Initial UI State Factory
 */
function createInitialUIState(): RoleManagementState['ui'] {
  return {
    loading: false,
    selectedRoleId: null,
    bulkSelectedIds: [],
    operations: {
      loadingDetail: false,
      loadingPermissions: false,
      loadingTemplates: false,
      loadingUsers: false,
      performingClone: false,
      updatingPermissions: false,
      updatingPriority: false
    }
  };
}

/**
 * Initial Cache State Factory
 */
function createInitialCacheState(): RoleManagementState['cache'] {
  return {
    lastFetched: null,
    permissions: [],
    templates: [],
    usersByRole: {}
  };
}

/**
 * Initial State Factory
 */
export function createInitialState(): RoleManagementState {
  return {
    ui: createInitialUIState(),
    filters: createInitialFilters(),
    pagination: createInitialPagination(10),
    cache: createInitialCacheState()
  };
}

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

/**
 * Role Management Store
 *
 * @description
 * Akita Entity Store for role management state.
 * Provides methods to update state immutably.
 *
 * @class RoleManagementStore
 * @extends {EntityStore<RoleManagementState, Role>}
 */
@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'role-management', idKey: 'id', resettable: true })
export class RoleManagementStore extends EntityStore<RoleManagementState, Role> {
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
   * Updates the global loading state for the entire role management module.
   * Overrides the base EntityStore setLoading method.
   *
   * @param loading - Loading state
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
   */
  setOperationLoading(
    operation: keyof RoleManagementState['ui']['operations'],
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
   * Set Selected Role
   */
  setSelectedRole(roleId: number | null): void {
    this.update(state => ({
      ui: {
        ...state.ui,
        selectedRoleId: roleId
      }
    }));
  }

  /**
   * Set Bulk Selected Roles
   */
  setBulkSelected(roleIds: number[]): void {
    this.update(state => ({
      ui: {
        ...state.ui,
        bulkSelectedIds: roleIds
      }
    }));
  }

  /**
   * Toggle Bulk Selection
   */
  toggleBulkSelection(roleId: number): void {
    this.update(state => {
      const bulkSelectedIds = [...state.ui.bulkSelectedIds];
      const index = bulkSelectedIds.indexOf(roleId);

      if (index === -1) {
        bulkSelectedIds.push(roleId);
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
   */
  updateFilters(filters: Partial<RoleManagementState['filters']>): void {
    this.update(state => ({
      filters: {
        ...state.filters,
        ...filters
      }
    }));
  }

  /**
   * Reset Filters
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
   * Cache Permissions
   */
  cachePermissions(permissions: Permission[]): void {
    this.update(state => ({
      cache: {
        ...state.cache,
        permissions
      }
    }));
  }

  /**
   * Cache Templates
   */
  cacheTemplates(templates: RoleTemplate[]): void {
    this.update(state => ({
      cache: {
        ...state.cache,
        templates
      }
    }));
  }

  /**
   * Cache Users for Role
   */
  cacheUsersForRole(roleId: number, users: any[]): void {
    this.update(state => ({
      cache: {
        ...state.cache,
        usersByRole: {
          ...state.cache.usersByRole,
          [roleId]: users
        }
      }
    }));
  }

  /**
   * Clear Cache
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
   * Resets the store to its initial state.
   * Overrides the base EntityStore reset method.
   */
  override reset(): void {
    this.set([]);
    this.update(createInitialState());
  }
}
