/**
 * Role Management - Akita Query
 *
 * @description
 * Akita Query service for selecting and deriving data from the Role Management Store.
 * Provides 30+ reactive observables and synchronous getters for accessing state.
 *
 * @module RoleManagement/State
 * @version 1.0.0
 */

import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { Observable } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { RoleManagementStore, RoleManagementState } from './role-management.store';
import { Role, Permission, RoleTemplate, PaginationState } from '../models';

/**
 * Role Management Query Service
 *
 * @description
 * Query service for reactive state selection from RoleManagementStore.
 *
 * @class RoleManagementQuery
 * @extends {QueryEntity<RoleManagementState, Role>}
 */
@Injectable({ providedIn: 'root' })
export class RoleManagementQuery extends QueryEntity<RoleManagementState, Role> {
  constructor(protected override store: RoleManagementStore) {
    super(store);
  }

  // ==========================================================================
  // ENTITY SELECTORS
  // ==========================================================================

  /**
   * All Roles Observable
   */
  roles$: Observable<Role[]> = this.selectAll();

  /**
   * Roles Count Observable
   */
  rolesCount$: Observable<number> = this.selectCount();

  /**
   * Has Roles Observable
   */
  hasRoles$: Observable<boolean> = this.rolesCount$.pipe(
    map(count => count > 0),
    distinctUntilChanged()
  );

  /**
   * Selected Role Observable
   */
  selectedRole$: Observable<Role | undefined> = this.select(state => state.ui.selectedRoleId).pipe(
    distinctUntilChanged(),
    map(roleId => roleId ? this.getEntity(roleId) : undefined)
  );

  /**
   * Has Selected Role Observable
   */
  hasSelectedRole$: Observable<boolean> = this.select(state => state.ui.selectedRoleId !== null).pipe(
    distinctUntilChanged()
  );

  /**
   * Selected Role ID Observable
   *
   * @description
   * Observable that emits the currently selected role ID.
   * Used for tracking which role is active in the UI.
   */
  selectedRoleId$: Observable<number | null> = this.select(state => state.ui.selectedRoleId).pipe(
    distinctUntilChanged()
  );

  // ==========================================================================
  // UI STATE SELECTORS
  // ==========================================================================

  /**
   * Loading State Observable
   */
  loading$: Observable<boolean> = this.select(state => state.ui.loading).pipe(
    distinctUntilChanged()
  );

  /**
   * Operations Loading State Observable
   */
  operations$: Observable<RoleManagementState['ui']['operations']> = this.select(
    state => state.ui.operations
  );

  /**
   * Loading Detail Observable
   */
  loadingDetail$: Observable<boolean> = this.select(
    state => state.ui.operations.loadingDetail
  ).pipe(distinctUntilChanged());

  /**
   * Loading Permissions Observable
   */
  loadingPermissions$: Observable<boolean> = this.select(
    state => state.ui.operations.loadingPermissions
  ).pipe(distinctUntilChanged());

  /**
   * Loading Templates Observable
   */
  loadingTemplates$: Observable<boolean> = this.select(
    state => state.ui.operations.loadingTemplates
  ).pipe(distinctUntilChanged());

  /**
   * Bulk Selected IDs Observable
   */
  bulkSelectedIds$: Observable<number[]> = this.select(state => state.ui.bulkSelectedIds);

  /**
   * Bulk Selected Count Observable
   */
  bulkSelectedCount$: Observable<number> = this.bulkSelectedIds$.pipe(
    map(ids => ids.length),
    distinctUntilChanged()
  );

  /**
   * Has Bulk Selection Observable
   */
  hasBulkSelection$: Observable<boolean> = this.bulkSelectedCount$.pipe(
    map(count => count > 0),
    distinctUntilChanged()
  );

  /**
   * Bulk Selected Roles Observable
   */
  bulkSelectedRoles$: Observable<Role[]> = this.bulkSelectedIds$.pipe(
    map(ids => ids.map(id => this.getEntity(id)).filter((r): r is Role => !!r))
  );

  // ==========================================================================
  // FILTER SELECTORS
  // ==========================================================================

  /**
   * Filters Observable
   */
  filters$: Observable<RoleManagementState['filters']> = this.select(state => state.filters);

  /**
   * Has Active Filters Observable
   */
  hasActiveFilters$: Observable<boolean> = this.filters$.pipe(
    map(filters => Object.values(filters).some(value => value !== null)),
    distinctUntilChanged()
  );

  /**
   * Active Filters Count Observable
   */
  activeFiltersCount$: Observable<number> = this.filters$.pipe(
    map(filters => Object.values(filters).filter(value => value !== null).length),
    distinctUntilChanged()
  );

  /**
   * Filtered Roles Observable
   */
  filteredRoles$: Observable<Role[]> = this.selectAll({
    filterBy: (role: Role) => {
      const filters = this.getValue().filters;

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          role.name.toLowerCase().includes(searchLower) ||
          role.displayName.toLowerCase().includes(searchLower) ||
          role.description.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Active filter
      if (filters.isActive !== null && role.isActive !== filters.isActive) {
        return false;
      }

      // System filter
      if (filters.isSystem !== null && role.isSystem !== filters.isSystem) {
        return false;
      }

      // Priority range filter
      if (filters.minPriority !== null && role.priority < filters.minPriority) {
        return false;
      }

      if (filters.maxPriority !== null && role.priority > filters.maxPriority) {
        return false;
      }

      return true;
    }
  });

  /**
   * Filtered Roles Count Observable
   */
  filteredRolesCount$: Observable<number> = this.filteredRoles$.pipe(
    map(roles => roles.length),
    distinctUntilChanged()
  );

  // ==========================================================================
  // PAGINATION SELECTORS
  // ==========================================================================

  /**
   * Pagination Observable
   */
  pagination$: Observable<PaginationState> = this.select(state => state.pagination);

  /**
   * Current Page Observable
   */
  currentPage$: Observable<number> = this.select(state => state.pagination.page).pipe(
    distinctUntilChanged()
  );

  /**
   * Page Size Observable
   */
  pageSize$: Observable<number> = this.select(state => state.pagination.limit).pipe(
    distinctUntilChanged()
  );

  /**
   * Total Count Observable
   */
  totalCount$: Observable<number> = this.select(state => state.pagination.total).pipe(
    distinctUntilChanged()
  );

  /**
   * Total Pages Observable
   */
  totalPages$: Observable<number> = this.select(state => state.pagination.totalPages).pipe(
    distinctUntilChanged()
  );

  /**
   * Sort By Observable
   */
  sortBy$: Observable<string> = this.select(state => state.pagination.sortBy).pipe(
    distinctUntilChanged()
  );

  /**
   * Sort Order Observable
   */
  sortOrder$: Observable<'asc' | 'desc'> = this.select(state => state.pagination.sortOrder).pipe(
    distinctUntilChanged()
  );

  /**
   * Pagination Info Observable
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
   */
  lastFetched$: Observable<number | null> = this.select(state => state.cache.lastFetched).pipe(
    distinctUntilChanged()
  );

  /**
   * Is Cache Valid Observable
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
   * Cached Permissions Observable
   */
  cachedPermissions$: Observable<Permission[]> = this.select(state => state.cache.permissions);

  /**
   * Cached Templates Observable
   */
  cachedTemplates$: Observable<RoleTemplate[]> = this.select(state => state.cache.templates);

  /**
   * Get Cached Users for Role Observable
   */
  getCachedUsersForRole$(roleId: number): Observable<any[]> {
    return this.select(state => state.cache.usersByRole[roleId] || []);
  }

  // ==========================================================================
  // DERIVED/COMPUTED SELECTORS
  // ==========================================================================

  /**
   * Roles by Priority Observable
   */
  rolesByPriority$: Observable<Role[]> = this.roles$.pipe(
    map(roles => [...roles].sort((a, b) => b.priority - a.priority))
  );

  /**
   * Active Roles Observable
   */
  activeRoles$: Observable<Role[]> = this.selectAll({
    filterBy: role => role.isActive
  });

  /**
   * System Roles Observable
   */
  systemRoles$: Observable<Role[]> = this.selectAll({
    filterBy: role => role.isSystem
  });

  /**
   * Custom Roles Observable
   */
  customRoles$: Observable<Role[]> = this.selectAll({
    filterBy: role => !role.isSystem
  });

  /**
   * Roles Summary Observable
   */
  rolesSummary$: Observable<{
    total: number;
    active: number;
    inactive: number;
    system: number;
    custom: number;
  }> = this.roles$.pipe(
    map(roles => ({
      total: roles.length,
      active: roles.filter(r => r.isActive).length,
      inactive: roles.filter(r => !r.isActive).length,
      system: roles.filter(r => r.isSystem).length,
      custom: roles.filter(r => !r.isSystem).length
    }))
  );

  /**
   * Is All Selected Observable
   */
  isAllSelected$: Observable<boolean> = this.filteredRoles$.pipe(
    map(roles => {
      const selectedIds = this.getValue().ui.bulkSelectedIds;
      if (roles.length === 0 || selectedIds.length === 0) return false;
      return roles.every(role => selectedIds.includes(role.id));
    })
  );

  // ==========================================================================
  // SYNCHRONOUS GETTERS
  // ==========================================================================

  /**
   * Get Selected Role (Sync)
   */
  getSelectedRole(): Role | undefined {
    const roleId = this.getValue().ui.selectedRoleId;
    return roleId ? this.getEntity(roleId) : undefined;
  }

  /**
   * Is Role Selected (Sync)
   */
  isRoleSelected(roleId: number): boolean {
    return this.getValue().ui.selectedRoleId === roleId;
  }

  /**
   * Get Bulk Selected IDs (Sync)
   */
  getBulkSelectedIds(): number[] {
    return this.getValue().ui.bulkSelectedIds;
  }

  /**
   * Is Role In Bulk Selection (Sync)
   */
  isRoleInBulkSelection(roleId: number): boolean {
    return this.getValue().ui.bulkSelectedIds.includes(roleId);
  }

  /**
   * Has Active Filters (Sync)
   */
  hasActiveFilters(): boolean {
    const filters = this.getValue().filters;
    return Object.values(filters).some(value => value !== null);
  }

  /**
   * Get Current Filters (Sync)
   */
  getCurrentFilters(): RoleManagementState['filters'] {
    return this.getValue().filters;
  }

  /**
   * Get Current Pagination (Sync)
   */
  getCurrentPagination(): PaginationState {
    return this.getValue().pagination;
  }

  /**
   * Get Cached Permissions (Sync)
   */
  getCachedPermissions(): Permission[] {
    return this.getValue().cache.permissions;
  }

  /**
   * Get Cached Templates (Sync)
   */
  getCachedTemplates(): RoleTemplate[] {
    return this.getValue().cache.templates;
  }
}
