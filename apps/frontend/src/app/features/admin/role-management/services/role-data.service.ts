/**
 * Role Management - HTTP Data Service
 *
 * @description
 * Pure HTTP layer for role management API endpoints.
 * Handles all API communication without state management.
 *
 * Endpoints:
 * - GET    /api/roles                           - List roles (paginated)
 * - GET    /api/roles/:id                       - Get role details
 * - POST   /api/roles                           - Create role
 * - PUT    /api/roles/:id                       - Update role
 * - DELETE /api/roles/:id                       - Delete role
 * - GET    /api/admin/roles/templates           - Get role templates
 * - POST   /api/admin/roles/:id/clone           - Clone role
 * - POST   /api/admin/roles/:id/permissions     - Bulk assign permissions
 * - DELETE /api/admin/roles/:id/permissions/:id - Remove permission
 * - GET    /api/admin/roles/:id/users           - Get users with role
 * - PUT    /api/admin/roles/:id/priority        - Update priority
 * - GET    /api/permissions                     - List all permissions
 * - GET    /api/permissions/:id                 - Get permission details
 *
 * @module RoleManagement/Services
 * @version 1.0.0
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  Role,
  CreateRoleDto,
  UpdateRoleDto,
  CloneRoleDto,
  AssignPermissionsDto,
  UpdatePriorityDto,
  QueryRolesDto,
  Permission,
  RoleTemplate,
  RolesPaginatedResponse,
  PermissionsPaginatedResponse,
  UsersWithRoleResponse,
  CloneRoleResponse,
  DeleteRoleResponse,
  RoleTemplatesResponse
} from '../models';

/**
 * Role Data Service
 *
 * @description
 * HTTP service for role management API.
 * All methods return cold observables that must be subscribed to.
 *
 * @example
 * ```typescript
 * constructor(private roleDataService: RoleDataService) {}
 *
 * ngOnInit() {
 *   this.roleDataService.getRoles({ page: 1, limit: 25 }).subscribe(response => {
 *     console.log('Roles:', response.items);
 *   });
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class RoleDataService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/roles';
  private readonly adminBaseUrl = '/api/admin/roles';
  private readonly permissionsUrl = '/api/permissions';

  // ==========================================================================
  // ROLE CRUD OPERATIONS
  // ==========================================================================

  /**
   * Get Roles (Paginated)
   *
   * @description
   * Retrieves paginated list of roles with filtering and sorting.
   *
   * @param params - Query parameters (page, limit, filters, sort)
   * @returns Observable<RolesPaginatedResponse> - Paginated roles
   *
   * @example
   * ```typescript
   * this.roleDataService.getRoles({
   *   page: 1,
   *   limit: 25,
   *   isActive: true,
   *   sortBy: 'priority',
   *   sortOrder: 'DESC'
   * }).subscribe(response => {
   *   console.log('Roles:', response.items);
   * });
   * ```
   */
  getRoles(params?: QueryRolesDto): Observable<RolesPaginatedResponse> {
    let httpParams = new HttpParams();

    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.search) httpParams = httpParams.set('search', params.search);
      if (params.isActive !== undefined && params.isActive !== null) httpParams = httpParams.set('isActive', params.isActive.toString());
      if (params.isSystem !== undefined && params.isSystem !== null) httpParams = httpParams.set('isSystem', params.isSystem.toString());
      if (params.minPriority !== undefined && params.minPriority !== null) httpParams = httpParams.set('minPriority', params.minPriority.toString());
      if (params.maxPriority !== undefined && params.maxPriority !== null) httpParams = httpParams.set('maxPriority', params.maxPriority.toString());
      if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
      if (params.sortOrder) httpParams = httpParams.set('sortOrder', params.sortOrder);
    }

    return this.http.get<RolesPaginatedResponse>(this.baseUrl, { params: httpParams });
  }

  /**
   * Get Role by ID
   *
   * @description
   * Retrieves detailed information for a specific role.
   *
   * @param id - Role ID
   * @returns Observable<Role> - Role entity
   *
   * @example
   * ```typescript
   * this.roleDataService.getRoleById(5).subscribe(role => {
   *   console.log('Role:', role.displayName);
   * });
   * ```
   */
  getRoleById(id: number): Observable<Role> {
    return this.http.get<Role>(`${this.baseUrl}/${id}`);
  }

  /**
   * Create Role
   *
   * @description
   * Creates a new role.
   *
   * @param dto - Create role payload
   * @returns Observable<Role> - Created role
   *
   * @example
   * ```typescript
   * this.roleDataService.createRole({
   *   name: 'content_moderator',
   *   displayName: 'Content Moderator',
   *   description: 'Moderates user content',
   *   priority: 50,
   *   permissionIds: [10, 11, 12]
   * }).subscribe(role => {
   *   console.log('Created:', role.id);
   * });
   * ```
   */
  createRole(dto: CreateRoleDto): Observable<Role> {
    return this.http.post<Role>(this.baseUrl, dto);
  }

  /**
   * Update Role
   *
   * @description
   * Updates an existing role.
   *
   * @param id - Role ID
   * @param dto - Update role payload
   * @returns Observable<Role> - Updated role
   *
   * @example
   * ```typescript
   * this.roleDataService.updateRole(5, {
   *   displayName: 'Senior Moderator',
   *   priority: 55
   * }).subscribe(role => {
   *   console.log('Updated:', role.displayName);
   * });
   * ```
   */
  updateRole(id: number, dto: UpdateRoleDto): Observable<Role> {
    return this.http.put<Role>(`${this.baseUrl}/${id}`, dto);
  }

  /**
   * Delete Role
   *
   * @description
   * Deletes a role. Cannot delete system roles.
   *
   * @param id - Role ID
   * @returns Observable<DeleteRoleResponse> - Deletion result
   *
   * @example
   * ```typescript
   * this.roleDataService.deleteRole(5).subscribe(response => {
   *   console.log('Deleted:', response.message);
   * });
   * ```
   */
  deleteRole(id: number): Observable<DeleteRoleResponse> {
    return this.http.delete<DeleteRoleResponse>(`${this.baseUrl}/${id}`);
  }

  // ==========================================================================
  // ENHANCED ROLE OPERATIONS
  // ==========================================================================

  /**
   * Get Role Templates
   *
   * @description
   * Retrieves pre-configured role templates.
   *
   * @returns Observable<RoleTemplate[]> - Array of role templates
   *
   * @example
   * ```typescript
   * this.roleDataService.getRoleTemplates().subscribe(templates => {
   *   console.log('Templates:', templates.length);
   * });
   * ```
   */
  getRoleTemplates(): Observable<RoleTemplate[]> {
    return this.http.get<RoleTemplatesResponse>(`${this.adminBaseUrl}/templates`).pipe(
      map(response => response.templates)
    );
  }

  /**
   * Clone Role
   *
   * @description
   * Creates a copy of an existing role with a new name.
   *
   * @param id - Original role ID
   * @param dto - Clone role payload
   * @returns Observable<CloneRoleResponse> - Cloned role
   *
   * @example
   * ```typescript
   * this.roleDataService.cloneRole(3, {
   *   newName: 'senior_moderator',
   *   newDisplayName: 'Senior Moderator'
   * }).subscribe(role => {
   *   console.log('Cloned:', role.id);
   * });
   * ```
   */
  cloneRole(id: number, dto: CloneRoleDto): Observable<CloneRoleResponse> {
    return this.http.post<CloneRoleResponse>(`${this.adminBaseUrl}/${id}/clone`, dto);
  }

  /**
   * Bulk Assign Permissions
   *
   * @description
   * Assigns multiple permissions to a role (replaces existing).
   *
   * @param id - Role ID
   * @param dto - Permission IDs to assign
   * @returns Observable<Role> - Updated role
   *
   * @example
   * ```typescript
   * this.roleDataService.bulkAssignPermissions(5, {
   *   permissionIds: [10, 11, 12, 15, 18]
   * }).subscribe(role => {
   *   console.log('Permissions assigned:', role.permissionIds.length);
   * });
   * ```
   */
  bulkAssignPermissions(id: number, dto: AssignPermissionsDto): Observable<Role> {
    return this.http.post<Role>(`${this.adminBaseUrl}/${id}/permissions`, dto);
  }

  /**
   * Remove Permission from Role
   *
   * @description
   * Removes a single permission from a role.
   *
   * @param roleId - Role ID
   * @param permissionId - Permission ID to remove
   * @returns Observable<Role> - Updated role
   *
   * @example
   * ```typescript
   * this.roleDataService.removePermission(5, 12).subscribe(role => {
   *   console.log('Permission removed');
   * });
   * ```
   */
  removePermission(roleId: number, permissionId: number): Observable<Role> {
    return this.http.delete<Role>(`${this.adminBaseUrl}/${roleId}/permissions/${permissionId}`);
  }

  /**
   * Get Users with Role
   *
   * @description
   * Retrieves all users assigned to a specific role.
   *
   * @param id - Role ID
   * @returns Observable<UsersWithRoleResponse> - Users with this role
   *
   * @example
   * ```typescript
   * this.roleDataService.getUsersWithRole(5).subscribe(response => {
   *   console.log('Users:', response.users.length);
   * });
   * ```
   */
  getUsersWithRole(id: number): Observable<UsersWithRoleResponse> {
    return this.http.get<UsersWithRoleResponse>(`${this.adminBaseUrl}/${id}/users`);
  }

  /**
   * Update Role Priority
   *
   * @description
   * Updates the priority level of a role.
   *
   * @param id - Role ID
   * @param dto - New priority level
   * @returns Observable<Role> - Updated role
   *
   * @example
   * ```typescript
   * this.roleDataService.updateRolePriority(5, { priority: 75 }).subscribe(role => {
   *   console.log('Priority updated:', role.priority);
   * });
   * ```
   */
  updateRolePriority(id: number, dto: UpdatePriorityDto): Observable<Role> {
    return this.http.put<Role>(`${this.adminBaseUrl}/${id}/priority`, dto);
  }

  // ==========================================================================
  // PERMISSION OPERATIONS
  // ==========================================================================

  /**
   * Get All Permissions
   *
   * @description
   * Retrieves all available permissions.
   * This endpoint is not paginated.
   *
   * @returns Observable<Permission[]> - Array of all permissions
   *
   * @example
   * ```typescript
   * this.roleDataService.getPermissions().subscribe(permissions => {
   *   console.log('Permissions:', permissions.length);
   * });
   * ```
   */
  getPermissions(): Observable<Permission[]> {
    return this.http.get<Permission[]>(this.permissionsUrl);
  }

  /**
   * Get Permission by ID
   *
   * @description
   * Retrieves detailed information for a specific permission.
   *
   * @param id - Permission ID
   * @returns Observable<Permission> - Permission entity
   *
   * @example
   * ```typescript
   * this.roleDataService.getPermissionById(10).subscribe(permission => {
   *   console.log('Permission:', permission.displayName);
   * });
   * ```
   */
  getPermissionById(id: number): Observable<Permission> {
    return this.http.get<Permission>(`${this.permissionsUrl}/${id}`);
  }
}
