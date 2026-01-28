/**
 * Role Management Service
 *
 * @description
 * Orchestrates HTTP calls and state updates for role management operations.
 * Implements optimistic updates, error handling, and user feedback.
 *
 * @module RoleManagement/State
 * @version 1.0.0
 */

import { Injectable, inject } from '@angular/core';
import { Observable, EMPTY, throwError, forkJoin } from 'rxjs';
import { tap, catchError, map, switchMap, finalize } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';

import { RoleManagementStore } from './role-management.store';
import { RoleManagementQuery } from './role-management.query';
import { RoleDataService } from '../services/role-data.service';
import {
  Role,
  CreateRoleDto,
  UpdateRoleDto,
  CloneRoleDto,
  AssignPermissionsDto,
  UpdatePriorityDto,
  QueryRolesDto,
  Permission,
  RoleTemplate
} from '../models';

/**
 * Role Management Service
 *
 * @description
 * Central service that coordinates between HTTP API, state management, and UI feedback.
 *
 * @class RoleManagementService
 *
 * @example
 * ```typescript
 * constructor(private roleService: RoleManagementService) {}
 *
 * ngOnInit() {
 *   this.roleService.fetchRoles({ page: 1, limit: 25 }).subscribe();
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class RoleManagementService {
  private readonly store = inject(RoleManagementStore);
  private readonly query = inject(RoleManagementQuery);
  private readonly dataService = inject(RoleDataService);
  private readonly snackBar = inject(MatSnackBar);

  // ==========================================================================
  // ROLE CRUD OPERATIONS
  // ==========================================================================

  /**
   * Fetch Roles with Pagination and Filters
   *
   * @description
   * Retrieves paginated role list and updates store with results.
   *
   * @param params - Query parameters (page, limit, filters, sort)
   * @returns Observable that completes when fetch is successful
   *
   * @example
   * ```typescript
   * this.roleService.fetchRoles({
   *   page: 1,
   *   limit: 25,
   *   isActive: true,
   *   sortBy: 'priority',
   *   sortOrder: 'DESC'
   * }).subscribe();
   * ```
   */
  fetchRoles(params?: QueryRolesDto): Observable<void> {
    this.store.setLoading(true);

    return this.dataService.getRoles(params).pipe(
      tap(response => {
        this.store.set(response.items);
        this.store.updatePagination({
          page: response.page,
          limit: response.limit,
          total: response.total,
          totalPages: response.totalPages
        });
        this.store.updateCacheTimestamp(Date.now());
      }),
      catchError(error => {
        this.handleError('Failed to fetch roles', error);
        return EMPTY;
      }),
      finalize(() => this.store.setLoading(false)),
      map(() => void 0)
    );
  }

  /**
   * Fetch Single Role by ID
   *
   * @description
   * Retrieves detailed role information and adds/updates in store.
   *
   * @param id - Role ID
   * @returns Observable that emits the role and completes
   *
   * @example
   * ```typescript
   * this.roleService.fetchRoleById(5).subscribe(role => {
   *   console.log('Role loaded:', role);
   * });
   * ```
   */
  fetchRoleById(id: number): Observable<Role> {
    this.store.setOperationLoading('loadingDetail', true);

    return this.dataService.getRoleById(id).pipe(
      tap(role => {
        this.store.upsert(id, role);
      }),
      catchError(error => {
        this.handleError('Failed to fetch role details', error);
        return throwError(() => error);
      }),
      finalize(() => this.store.setOperationLoading('loadingDetail', false))
    );
  }

  /**
   * Create Role
   *
   * @description
   * Creates a new role and adds it to the store.
   *
   * @param dto - Create role payload
   * @returns Observable that completes when create is successful
   *
   * @example
   * ```typescript
   * this.roleService.createRole({
   *   name: 'content_moderator',
   *   displayName: 'Content Moderator',
   *   description: 'Moderates user content',
   *   priority: 50,
   *   permissionIds: [10, 11, 12]
   * }).subscribe();
   * ```
   */
  createRole(dto: CreateRoleDto): Observable<void> {
    this.store.setLoading(true);

    return this.dataService.createRole(dto).pipe(
      tap(role => {
        this.store.add(role);
        this.snackBar.open('Role created successfully', 'Close', {
          duration: 3000,
          panelClass: 'success-snackbar'
        });
      }),
      catchError(error => {
        this.handleError('Failed to create role', error);
        return EMPTY;
      }),
      finalize(() => this.store.setLoading(false)),
      map(() => void 0)
    );
  }

  /**
   * Update Role
   *
   * @description
   * Updates role with optimistic update. Reverts on failure.
   *
   * @param id - Role ID
   * @param dto - Update role payload
   * @returns Observable that completes when update is successful
   *
   * @example
   * ```typescript
   * this.roleService.updateRole(5, {
   *   displayName: 'Senior Moderator',
   *   priority: 55
   * }).subscribe();
   * ```
   */
  updateRole(id: number, dto: UpdateRoleDto): Observable<void> {
    this.store.setLoading(true);

    // Store original for rollback
    const originalRole = this.query.getEntity(id);
    if (!originalRole) {
      this.handleError('Role not found in store', null);
      return EMPTY;
    }

    // Optimistic update
    this.store.update(id, dto);

    return this.dataService.updateRole(id, dto).pipe(
      tap(updatedRole => {
        this.store.upsert(id, updatedRole);
        this.snackBar.open('Role updated successfully', 'Close', {
          duration: 3000,
          panelClass: 'success-snackbar'
        });
      }),
      catchError(error => {
        // Rollback on error
        this.store.upsert(id, originalRole);
        this.handleError('Failed to update role', error);
        return EMPTY;
      }),
      finalize(() => this.store.setLoading(false)),
      map(() => void 0)
    );
  }

  /**
   * Delete Role
   *
   * @description
   * Deletes role with optimistic removal. Restores on failure.
   *
   * @param id - Role ID
   * @returns Observable that completes when delete is successful
   *
   * @example
   * ```typescript
   * this.roleService.deleteRole(5).subscribe();
   * ```
   */
  deleteRole(id: number): Observable<void> {
    this.store.setLoading(true);

    // Store original for rollback
    const originalRole = this.query.getEntity(id);
    if (!originalRole) {
      this.handleError('Role not found in store', null);
      return EMPTY;
    }

    // Optimistic delete
    this.store.remove(id);

    return this.dataService.deleteRole(id).pipe(
      tap(response => {
        this.snackBar.open(response.message || 'Role deleted successfully', 'Close', {
          duration: 3000,
          panelClass: 'success-snackbar'
        });
      }),
      catchError(error => {
        // Rollback on error
        this.store.add(originalRole);
        this.handleError('Failed to delete role', error);
        return EMPTY;
      }),
      finalize(() => this.store.setLoading(false)),
      map(() => void 0)
    );
  }

  // ==========================================================================
  // ENHANCED OPERATIONS
  // ==========================================================================

  /**
   * Clone Role
   *
   * @description
   * Creates a copy of an existing role with a new name.
   *
   * @param id - Original role ID
   * @param dto - Clone role payload
   * @returns Observable that completes when clone is successful
   *
   * @example
   * ```typescript
   * this.roleService.cloneRole(3, {
   *   newName: 'senior_moderator',
   *   newDisplayName: 'Senior Moderator'
   * }).subscribe();
   * ```
   */
  cloneRole(id: number, dto: CloneRoleDto): Observable<void> {
    this.store.setOperationLoading('performingClone', true);

    return this.dataService.cloneRole(id, dto).pipe(
      tap(clonedRole => {
        this.store.add(clonedRole);
        this.snackBar.open('Role cloned successfully', 'Close', {
          duration: 3000,
          panelClass: 'success-snackbar'
        });
      }),
      catchError(error => {
        this.handleError('Failed to clone role', error);
        return EMPTY;
      }),
      finalize(() => this.store.setOperationLoading('performingClone', false)),
      map(() => void 0)
    );
  }

  /**
   * Bulk Assign Permissions
   *
   * @description
   * Assigns multiple permissions to a role (replaces existing).
   *
   * @param id - Role ID
   * @param dto - Permission IDs to assign
   * @returns Observable that completes when assignment is successful
   *
   * @example
   * ```typescript
   * this.roleService.bulkAssignPermissions(5, {
   *   permissionIds: [10, 11, 12, 15, 18]
   * }).subscribe();
   * ```
   */
  bulkAssignPermissions(id: number, dto: AssignPermissionsDto): Observable<void> {
    this.store.setOperationLoading('updatingPermissions', true);

    // Store original for rollback
    const originalRole = this.query.getEntity(id);
    if (!originalRole) {
      this.handleError('Role not found in store', null);
      return EMPTY;
    }

    // Optimistic update
    this.store.update(id, { permissionIds: dto.permissionIds });

    return this.dataService.bulkAssignPermissions(id, dto).pipe(
      tap(updatedRole => {
        this.store.upsert(id, updatedRole);
        this.snackBar.open('Permissions assigned successfully', 'Close', {
          duration: 3000,
          panelClass: 'success-snackbar'
        });
      }),
      catchError(error => {
        // Rollback on error
        this.store.upsert(id, originalRole);
        this.handleError('Failed to assign permissions', error);
        return EMPTY;
      }),
      finalize(() => this.store.setOperationLoading('updatingPermissions', false)),
      map(() => void 0)
    );
  }

  /**
   * Remove Permission from Role
   *
   * @description
   * Removes a single permission from a role.
   *
   * @param roleId - Role ID
   * @param permissionId - Permission ID to remove
   * @returns Observable that completes when removal is successful
   */
  removePermission(roleId: number, permissionId: number): Observable<void> {
    this.store.setOperationLoading('updatingPermissions', true);

    // Store original for rollback
    const originalRole = this.query.getEntity(roleId);
    if (!originalRole) {
      this.handleError('Role not found in store', null);
      return EMPTY;
    }

    // Optimistic update
    const updatedPermissionIds = originalRole.permissionIds.filter(id => id !== permissionId);
    this.store.update(roleId, { permissionIds: updatedPermissionIds });

    return this.dataService.removePermission(roleId, permissionId).pipe(
      tap(updatedRole => {
        this.store.upsert(roleId, updatedRole);
        this.snackBar.open('Permission removed successfully', 'Close', {
          duration: 3000,
          panelClass: 'success-snackbar'
        });
      }),
      catchError(error => {
        // Rollback on error
        this.store.upsert(roleId, originalRole);
        this.handleError('Failed to remove permission', error);
        return EMPTY;
      }),
      finalize(() => this.store.setOperationLoading('updatingPermissions', false)),
      map(() => void 0)
    );
  }

  /**
   * Update Role Priority
   *
   * @description
   * Updates the priority level of a role.
   *
   * @param id - Role ID
   * @param dto - New priority level
   * @returns Observable that completes when update is successful
   */
  updateRolePriority(id: number, dto: UpdatePriorityDto): Observable<void> {
    this.store.setOperationLoading('updatingPriority', true);

    // Store original for rollback
    const originalRole = this.query.getEntity(id);
    if (!originalRole) {
      this.handleError('Role not found in store', null);
      return EMPTY;
    }

    // Optimistic update
    this.store.update(id, { priority: dto.priority });

    return this.dataService.updateRolePriority(id, dto).pipe(
      tap(updatedRole => {
        this.store.upsert(id, updatedRole);
        this.snackBar.open('Priority updated successfully', 'Close', {
          duration: 3000,
          panelClass: 'success-snackbar'
        });
      }),
      catchError(error => {
        // Rollback on error
        this.store.upsert(id, originalRole);
        this.handleError('Failed to update priority', error);
        return EMPTY;
      }),
      finalize(() => this.store.setOperationLoading('updatingPriority', false)),
      map(() => void 0)
    );
  }

  /**
   * Fetch Users with Role
   *
   * @description
   * Retrieves all users assigned to a specific role.
   *
   * @param id - Role ID
   * @returns Observable that emits users and completes
   */
  fetchUsersWithRole(id: number): Observable<any[]> {
    this.store.setOperationLoading('loadingUsers', true);

    return this.dataService.getUsersWithRole(id).pipe(
      tap(response => {
        this.store.cacheUsersForRole(id, response.users);
      }),
      map(response => response.users),
      catchError(error => {
        this.handleError('Failed to fetch users with role', error);
        return throwError(() => error);
      }),
      finalize(() => this.store.setOperationLoading('loadingUsers', false))
    );
  }

  // ==========================================================================
  // PERMISSION AND TEMPLATE OPERATIONS
  // ==========================================================================

  /**
   * Fetch Permissions
   *
   * @description
   * Retrieves all permissions and caches them.
   * Uses cache if valid (within TTL).
   *
   * @param forceRefresh - Force refresh even if cache is valid
   * @returns Observable that completes when fetch is successful
   *
   * @example
   * ```typescript
   * this.roleService.fetchPermissions().subscribe();
   * ```
   */
  fetchPermissions(forceRefresh = false): Observable<void> {
    // Check cache validity
    if (!forceRefresh && this.query.getCachedPermissions().length > 0) {
      return EMPTY;
    }

    this.store.setOperationLoading('loadingPermissions', true);

    return this.dataService.getPermissions().pipe(
      tap(permissions => {
        this.store.cachePermissions(permissions);
      }),
      catchError(error => {
        this.handleError('Failed to fetch permissions', error);
        return EMPTY;
      }),
      finalize(() => this.store.setOperationLoading('loadingPermissions', false)),
      map(() => void 0)
    );
  }

  /**
   * Fetch Role Templates
   *
   * @description
   * Retrieves pre-configured role templates and caches them.
   * Uses cache if valid (within TTL).
   *
   * @param forceRefresh - Force refresh even if cache is valid
   * @returns Observable that completes when fetch is successful
   *
   * @example
   * ```typescript
   * this.roleService.fetchTemplates().subscribe();
   * ```
   */
  fetchTemplates(forceRefresh = false): Observable<void> {
    // Check cache validity
    if (!forceRefresh && this.query.getCachedTemplates().length > 0) {
      return EMPTY;
    }

    this.store.setOperationLoading('loadingTemplates', true);

    return this.dataService.getRoleTemplates().pipe(
      tap(templates => {
        this.store.cacheTemplates(templates);
      }),
      catchError(error => {
        this.handleError('Failed to fetch templates', error);
        return EMPTY;
      }),
      finalize(() => this.store.setOperationLoading('loadingTemplates', false)),
      map(() => void 0)
    );
  }

  /**
   * Initialize Dashboard Data
   *
   * @description
   * Fetches all necessary data for dashboard initialization.
   * Runs roles, permissions, and templates fetch in parallel.
   *
   * @returns Observable that completes when all data is loaded
   *
   * @example
   * ```typescript
   * this.roleService.initializeDashboard().subscribe();
   * ```
   */
  initializeDashboard(): Observable<void> {
    return forkJoin({
      roles: this.fetchRoles({ page: 1, limit: 25 }),
      permissions: this.fetchPermissions(),
      templates: this.fetchTemplates()
    }).pipe(
      map(() => void 0),
      catchError(error => {
        this.handleError('Failed to initialize dashboard', error);
        return EMPTY;
      })
    );
  }

  // ==========================================================================
  // FILTER AND PAGINATION
  // ==========================================================================

  /**
   * Apply Filters
   *
   * @description
   * Updates filter state and refetches roles.
   *
   * @param filters - Filter criteria
   * @returns Observable that completes when roles are refetched
   */
  applyFilters(filters: Partial<any>): Observable<void> {
    this.store.updateFilters(filters);

    const queryParams: QueryRolesDto = {
      page: 1, // Reset to first page
      limit: this.query.getCurrentPagination().limit,
      ...filters
    };

    return this.fetchRoles(queryParams);
  }

  /**
   * Clear Filters
   *
   * @description
   * Resets all filters and refetches roles.
   *
   * @returns Observable that completes when roles are refetched
   */
  clearFilters(): Observable<void> {
    this.store.resetFilters();
    return this.fetchRoles({ page: 1, limit: this.query.getCurrentPagination().limit });
  }

  /**
   * Refresh Roles
   *
   * @description
   * Refetches current page with existing filters.
   *
   * @returns Observable that completes when roles are refetched
   */
  refresh(): Observable<void> {
    const state = this.query.getValue();
    const queryParams: QueryRolesDto = {
      page: state.pagination.page,
      limit: state.pagination.limit,
      ...state.filters
    };

    return this.fetchRoles(queryParams);
  }

  // ==========================================================================
  // UI HELPERS
  // ==========================================================================

  /**
   * Select Role
   *
   * @description
   * Sets active role ID in store for detail panel.
   *
   * @param id - Role ID to select (null to clear)
   */
  selectRole(id: number | null): void {
    this.store.setSelectedRole(id);
  }

  /**
   * Toggle Bulk Selection
   *
   * @description
   * Toggles role in bulk selection.
   *
   * @param id - Role ID to toggle
   */
  toggleBulkSelection(id: number): void {
    this.store.toggleBulkSelection(id);
  }

  /**
   * Clear Bulk Selection
   *
   * @description
   * Clears all bulk selections.
   */
  clearBulkSelection(): void {
    this.store.clearBulkSelection();
  }

  // ==========================================================================
  // ERROR HANDLING
  // ==========================================================================

  /**
   * Handle Error with User Feedback
   *
   * @description
   * Logs error and shows snackbar message.
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
