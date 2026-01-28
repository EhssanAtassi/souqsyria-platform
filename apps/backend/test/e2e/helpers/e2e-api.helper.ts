/**
 * @file e2e-api.helper.ts
 * @description API request helper utilities for E2E testing
 *
 * This module provides comprehensive helper functions for making authenticated
 * API requests during E2E tests including role management, user management,
 * permission operations, and security audit log access.
 *
 * Features:
 * - Authenticated HTTP request utilities (GET, POST, PUT, PATCH, DELETE)
 * - Role management operations (create, update, delete, assign permissions)
 * - User management operations (create, ban, suspend, unban, unsuspend)
 * - Permission management operations
 * - Security audit log retrieval
 * - Error handling and response validation
 *
 * Performance Targets:
 * - API requests: <300ms average
 * - Bulk operations: <1000ms
 *
 * @author SouqSyria Development Team
 * @version 1.0.0
 * @since 2025-01-23
 */

import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

/**
 * Interface for creating a new role
 * @description Data required to create a role
 */
export interface CreateRoleDto {
  /** Unique role name (snake_case) */
  name: string;
  /** Human-readable display name */
  displayName?: string;
  /** Role description */
  description?: string;
  /** Role type: 'business' or 'admin' */
  type?: 'business' | 'admin';
  /** Role priority (higher = more privileged) */
  priority?: number;
}

/**
 * Interface for role entity
 * @description Full role data structure
 */
export interface Role {
  /** Role ID */
  id: number;
  /** Role name */
  name: string;
  /** Role description */
  description?: string;
  /** Whether this is a default role */
  isDefault: boolean;
  /** Role type */
  type?: string;
  /** Role priority */
  priority: number;
  /** Associated permissions */
  rolePermissions?: any[];
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * Interface for creating a new user
 * @description Data required to create a user
 */
export interface CreateUserDto {
  /** User email address */
  email: string;
  /** User password */
  password?: string;
  /** User full name */
  fullName?: string;
  /** Primary role ID */
  roleId?: number;
  /** Assigned admin role ID */
  assignedRoleId?: number;
}

/**
 * Interface for user entity
 * @description Full user data structure
 */
export interface User {
  /** User ID */
  id: number;
  /** User email */
  email: string;
  /** User full name */
  fullName?: string;
  /** Primary role */
  role?: Role;
  /** Assigned admin role */
  assignedRole?: Role;
  /** Whether user is verified */
  isVerified: boolean;
  /** Whether user is banned */
  isBanned: boolean;
  /** Whether user is suspended */
  isSuspended: boolean;
  /** Ban reason */
  banReason?: string;
  /** Creation timestamp */
  createdAt: Date;
}

/**
 * Interface for security audit log entry
 * @description Structure of audit log records
 */
export interface SecurityAuditLog {
  /** Log entry ID */
  id: number;
  /** User ID who performed the action */
  userId: number | null;
  /** Action type */
  action: string;
  /** Resource type */
  resourceType: string;
  /** Resource ID */
  resourceId: number | null;
  /** Whether the action was successful */
  success: boolean;
  /** Failure reason if unsuccessful */
  failureReason?: string;
  /** Client IP address */
  ipAddress: string;
  /** User agent string */
  userAgent: string;
  /** Request path */
  requestPath: string;
  /** HTTP method */
  requestMethod: string;
  /** Additional metadata */
  metadata?: Record<string, any>;
  /** Creation timestamp */
  createdAt: Date;
}

/**
 * E2E API Helper Class
 * @description Provides API utilities for E2E testing
 */
export class E2EApiHelper {
  private app: INestApplication;

  /**
   * Creates an instance of E2EApiHelper
   * @param app - NestJS application instance
   */
  constructor(app: INestApplication) {
    this.app = app;
  }

  /**
   * Get HTTP server for request
   * @returns HTTP server instance
   */
  private getServer() {
    return this.app.getHttpServer();
  }

  // ============================================================
  // GENERIC HTTP METHODS
  // ============================================================

  /**
   * Make authenticated GET request
   * @description Sends a GET request with authorization header
   *
   * @param token - JWT access token
   * @param url - API endpoint URL
   * @returns Promise resolving to supertest response
   *
   * @example
   * ```typescript
   * const response = await apiHelper.get(token, '/api/users');
   * ```
   */
  async get(token: string, url: string): Promise<request.Response> {
    return request(this.getServer())
      .get(url)
      .set('Authorization', `Bearer ${token}`);
  }

  /**
   * Make authenticated POST request
   * @description Sends a POST request with authorization header and body
   *
   * @param token - JWT access token
   * @param url - API endpoint URL
   * @param body - Request body
   * @returns Promise resolving to supertest response
   *
   * @example
   * ```typescript
   * const response = await apiHelper.post(token, '/api/roles', { name: 'editor' });
   * ```
   */
  async post(token: string, url: string, body: any = {}): Promise<request.Response> {
    return request(this.getServer())
      .post(url)
      .set('Authorization', `Bearer ${token}`)
      .send(body);
  }

  /**
   * Make authenticated PUT request
   * @description Sends a PUT request with authorization header and body
   *
   * @param token - JWT access token
   * @param url - API endpoint URL
   * @param body - Request body
   * @returns Promise resolving to supertest response
   */
  async put(token: string, url: string, body: any = {}): Promise<request.Response> {
    return request(this.getServer())
      .put(url)
      .set('Authorization', `Bearer ${token}`)
      .send(body);
  }

  /**
   * Make authenticated PATCH request
   * @description Sends a PATCH request with authorization header and body
   *
   * @param token - JWT access token
   * @param url - API endpoint URL
   * @param body - Request body
   * @returns Promise resolving to supertest response
   */
  async patch(token: string, url: string, body: any = {}): Promise<request.Response> {
    return request(this.getServer())
      .patch(url)
      .set('Authorization', `Bearer ${token}`)
      .send(body);
  }

  /**
   * Make authenticated DELETE request
   * @description Sends a DELETE request with authorization header
   *
   * @param token - JWT access token
   * @param url - API endpoint URL
   * @returns Promise resolving to supertest response
   */
  async delete(token: string, url: string): Promise<request.Response> {
    return request(this.getServer())
      .delete(url)
      .set('Authorization', `Bearer ${token}`);
  }

  /**
   * Make authenticated request with custom method
   * @description Generic method for making authenticated requests
   *
   * @param method - HTTP method
   * @param token - JWT access token
   * @param url - API endpoint URL
   * @param body - Optional request body
   * @returns Promise resolving to supertest response
   */
  async makeAuthRequest(
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    token: string,
    url: string,
    body?: any,
  ): Promise<request.Response> {
    const req = request(this.getServer())[method](url).set('Authorization', `Bearer ${token}`);

    if (body && ['post', 'put', 'patch'].includes(method)) {
      return req.send(body);
    }

    return req;
  }

  // ============================================================
  // ROLE MANAGEMENT
  // ============================================================

  /**
   * Create a new role
   * @description Creates a role with specified permissions
   *
   * @param token - Admin JWT token
   * @param data - Role creation data
   * @returns Promise resolving to created role
   *
   * @example
   * ```typescript
   * const role = await apiHelper.createRole(adminToken, {
   *   name: 'content_editor',
   *   displayName: 'Content Editor',
   *   description: 'Can create and edit content'
   * });
   * ```
   */
  async createRole(token: string, data: CreateRoleDto): Promise<Role> {
    const response = await this.post(token, '/roles', data);
    if (response.status !== 201) {
      throw new Error(`Failed to create role: ${response.status} - ${JSON.stringify(response.body)}`);
    }
    return response.body;
  }

  /**
   * Get role by ID
   * @description Retrieves role details including permissions
   *
   * @param token - JWT token
   * @param roleId - Role ID
   * @returns Promise resolving to role entity
   */
  async getRole(token: string, roleId: number): Promise<Role> {
    const response = await this.get(token, `/roles/${roleId}`);
    if (response.status !== 200) {
      throw new Error(`Failed to get role: ${response.status}`);
    }
    return response.body;
  }

  /**
   * Update role
   * @description Updates role metadata
   *
   * @param token - Admin JWT token
   * @param roleId - Role ID
   * @param data - Update data
   * @returns Promise resolving to updated role
   */
  async updateRole(token: string, roleId: number, data: Partial<CreateRoleDto>): Promise<Role> {
    const response = await this.patch(token, `/roles/${roleId}`, data);
    if (response.status !== 200) {
      throw new Error(`Failed to update role: ${response.status}`);
    }
    return response.body;
  }

  /**
   * Delete role
   * @description Soft deletes a role
   *
   * @param token - Admin JWT token
   * @param roleId - Role ID
   * @returns Promise resolving when deletion is complete
   */
  async deleteRole(token: string, roleId: number): Promise<void> {
    const response = await this.delete(token, `/roles/${roleId}`);
    if (response.status !== 204 && response.status !== 200) {
      throw new Error(`Failed to delete role: ${response.status}`);
    }
  }

  /**
   * Clone a role
   * @description Creates a copy of an existing role with all its permissions
   *
   * @param token - Admin JWT token
   * @param roleId - Role ID to clone
   * @returns Promise resolving to cloned role
   */
  async cloneRole(token: string, roleId: number): Promise<Role> {
    const response = await this.post(token, `/roles/${roleId}/clone`);
    if (response.status !== 201) {
      throw new Error(`Failed to clone role: ${response.status}`);
    }
    return response.body;
  }

  /**
   * Assign permissions to role
   * @description Bulk assigns permission IDs to a role (replaces existing)
   *
   * @param token - Admin JWT token
   * @param roleId - Role ID
   * @param permissionIds - Array of permission IDs to assign
   * @returns Promise resolving to updated role
   *
   * @example
   * ```typescript
   * await apiHelper.assignPermissionsToRole(adminToken, roleId, [1, 2, 3, 5, 8]);
   * ```
   */
  async assignPermissionsToRole(
    token: string,
    roleId: number,
    permissionIds: number[],
  ): Promise<Role> {
    const response = await this.post(token, `/roles/${roleId}/permissions`, {
      permissionIds,
    });
    if (response.status !== 200 && response.status !== 201) {
      throw new Error(`Failed to assign permissions: ${response.status} - ${JSON.stringify(response.body)}`);
    }
    return response.body;
  }

  /**
   * Assign permissions to role by name
   * @description Assigns permissions to a role using permission names instead of IDs
   *
   * @param token - Admin JWT token
   * @param roleId - Role ID
   * @param permissionNames - Array of permission names
   * @returns Promise resolving when assignment is complete
   */
  async assignPermissionsByName(
    token: string,
    roleId: number,
    permissionNames: string[],
  ): Promise<void> {
    // First get all permissions
    const permResponse = await this.get(token, '/access-control/permissions');
    const allPermissions = permResponse.body.data || permResponse.body;

    // Map names to IDs
    const permissionIds = permissionNames
      .map((name) => {
        const perm = allPermissions.find((p: any) => p.name === name);
        return perm?.id;
      })
      .filter((id): id is number => id !== undefined);

    if (permissionIds.length !== permissionNames.length) {
      const foundNames = permissionIds.map((id) =>
        allPermissions.find((p: any) => p.id === id)?.name,
      );
      const missing = permissionNames.filter((n) => !foundNames.includes(n));
      console.warn(`Warning: Some permissions not found: ${missing.join(', ')}`);
    }

    await this.assignPermissionsToRole(token, roleId, permissionIds);
  }

  /**
   * Remove permission from role
   * @description Removes a single permission from a role
   *
   * @param token - Admin JWT token
   * @param roleId - Role ID
   * @param permissionId - Permission ID to remove
   * @returns Promise resolving when removal is complete
   */
  async removePermissionFromRole(
    token: string,
    roleId: number,
    permissionId: number,
  ): Promise<void> {
    const response = await this.delete(token, `/roles/${roleId}/permissions/${permissionId}`);
    if (response.status !== 204 && response.status !== 200) {
      throw new Error(`Failed to remove permission: ${response.status}`);
    }
  }

  /**
   * Get all permissions
   * @description Retrieves list of all available permissions
   *
   * @param token - JWT token
   * @returns Promise resolving to array of permissions
   */
  async getAllPermissions(token: string): Promise<any[]> {
    const response = await this.get(token, '/access-control/permissions');
    return response.body.data || response.body;
  }

  // ============================================================
  // USER MANAGEMENT
  // ============================================================

  /**
   * Create a new user (admin only)
   * @description Creates a user via admin endpoint
   *
   * @param token - Admin JWT token
   * @param data - User creation data
   * @returns Promise resolving to created user
   *
   * @example
   * ```typescript
   * const user = await apiHelper.createUser(adminToken, {
   *   email: 'newuser@example.com',
   *   fullName: 'New User'
   * });
   * ```
   */
  async createUser(token: string, data: CreateUserDto): Promise<User> {
    // Use auth register endpoint for creating users
    const response = await request(this.getServer())
      .post('/auth/register')
      .send({
        email: data.email,
        password: data.password || 'DefaultPass123!',
        fullName: data.fullName,
      });

    if (response.status !== 201) {
      throw new Error(`Failed to create user: ${response.status} - ${JSON.stringify(response.body)}`);
    }

    // If role assignments needed, do them separately
    if (data.roleId || data.assignedRoleId) {
      const userId = response.body.user?.id;
      if (userId) {
        await this.assignRolesToUser(token, userId, {
          roleId: data.roleId,
          assignedRoleId: data.assignedRoleId,
        });
      }
    }

    return response.body.user || response.body;
  }

  /**
   * Get user by ID
   * @description Retrieves user details with roles
   *
   * @param token - JWT token
   * @param userId - User ID
   * @returns Promise resolving to user entity
   */
  async getUser(token: string, userId: number): Promise<User> {
    const response = await this.get(token, `/admin/users/${userId}`);
    if (response.status !== 200) {
      throw new Error(`Failed to get user: ${response.status}`);
    }
    return response.body;
  }

  /**
   * Assign roles to user
   * @description Assigns business and/or admin roles to a user
   *
   * @param token - Admin JWT token
   * @param userId - User ID
   * @param roles - Role assignment data
   * @returns Promise resolving to updated user
   *
   * @example
   * ```typescript
   * await apiHelper.assignRolesToUser(adminToken, userId, {
   *   roleId: buyerRoleId,
   *   assignedRoleId: moderatorRoleId
   * });
   * ```
   */
  async assignRolesToUser(
    token: string,
    userId: number,
    roles: { roleId?: number; assignedRoleId?: number },
  ): Promise<User> {
    const response = await this.put(token, `/admin/users/${userId}/roles`, roles);
    if (response.status !== 200) {
      throw new Error(`Failed to assign roles: ${response.status} - ${JSON.stringify(response.body)}`);
    }
    return response.body;
  }

  /**
   * Assign role to user (shorthand)
   * @description Assigns a single role to a user
   *
   * @param token - Admin JWT token
   * @param userId - User ID
   * @param roleId - Role ID to assign
   * @returns Promise resolving to updated user
   */
  async assignRoleToUser(token: string, userId: number, roleId: number): Promise<User> {
    return this.assignRolesToUser(token, userId, { assignedRoleId: roleId });
  }

  /**
   * Ban a user
   * @description Bans a user account with a reason
   *
   * @param token - Admin JWT token
   * @param userId - User ID
   * @param reason - Ban reason
   * @returns Promise resolving when ban is complete
   *
   * @example
   * ```typescript
   * await apiHelper.banUser(adminToken, userId, 'Spam violation');
   * ```
   */
  async banUser(token: string, userId: number, reason: string): Promise<void> {
    const response = await this.post(token, `/admin/users/${userId}/ban`, { reason });
    if (response.status !== 200 && response.status !== 201) {
      throw new Error(`Failed to ban user: ${response.status} - ${JSON.stringify(response.body)}`);
    }
  }

  /**
   * Unban a user
   * @description Removes ban from a user account
   *
   * @param token - Admin JWT token
   * @param userId - User ID
   * @returns Promise resolving when unban is complete
   */
  async unbanUser(token: string, userId: number): Promise<void> {
    const response = await this.post(token, `/admin/users/${userId}/unban`);
    if (response.status !== 200 && response.status !== 201) {
      throw new Error(`Failed to unban user: ${response.status}`);
    }
  }

  /**
   * Suspend a user
   * @description Temporarily suspends a user account
   *
   * @param token - Admin JWT token
   * @param userId - User ID
   * @param reason - Suspension reason
   * @param duration - Optional duration in days
   * @returns Promise resolving when suspension is complete
   *
   * @example
   * ```typescript
   * await apiHelper.suspendUser(adminToken, userId, 'Policy violation', 7);
   * ```
   */
  async suspendUser(
    token: string,
    userId: number,
    reason: string,
    duration?: number,
  ): Promise<void> {
    const response = await this.post(token, `/admin/users/${userId}/suspend`, {
      reason,
      duration,
    });
    if (response.status !== 200 && response.status !== 201) {
      throw new Error(`Failed to suspend user: ${response.status}`);
    }
  }

  /**
   * Unsuspend a user
   * @description Removes suspension from a user account
   *
   * @param token - Admin JWT token
   * @param userId - User ID
   * @returns Promise resolving when unsuspension is complete
   */
  async unsuspendUser(token: string, userId: number): Promise<void> {
    const response = await this.post(token, `/admin/users/${userId}/unsuspend`);
    if (response.status !== 200 && response.status !== 201) {
      throw new Error(`Failed to unsuspend user: ${response.status}`);
    }
  }

  /**
   * Get user permissions
   * @description Retrieves effective permissions for a user (combined from all roles)
   *
   * @param token - JWT token
   * @param userId - User ID
   * @returns Promise resolving to array of permission names
   */
  async getUserPermissions(token: string, userId: number): Promise<string[]> {
    const response = await this.get(token, `/admin/users/${userId}/permissions`);
    if (response.status !== 200) {
      throw new Error(`Failed to get user permissions: ${response.status}`);
    }
    return response.body;
  }

  // ============================================================
  // SECURITY AUDIT LOGS
  // ============================================================

  /**
   * Get security audit logs
   * @description Retrieves security audit log entries with optional filtering
   *
   * @param token - Admin JWT token
   * @param filters - Optional filters (userId, action, resourceType, etc.)
   * @returns Promise resolving to array of audit log entries
   *
   * @example
   * ```typescript
   * const logs = await apiHelper.getAuditLogs(adminToken, {
   *   userId: 42,
   *   action: 'ACCESS_DENIED'
   * });
   * ```
   */
  async getAuditLogs(
    token: string,
    filters: {
      userId?: number;
      action?: string;
      resourceType?: string;
      success?: boolean;
      limit?: number;
      page?: number;
    } = {},
  ): Promise<SecurityAuditLog[]> {
    const queryParams = new URLSearchParams();
    if (filters.userId) queryParams.append('userId', filters.userId.toString());
    if (filters.action) queryParams.append('action', filters.action);
    if (filters.resourceType) queryParams.append('resourceType', filters.resourceType);
    if (filters.success !== undefined) queryParams.append('success', filters.success.toString());
    if (filters.limit) queryParams.append('limit', filters.limit.toString());
    if (filters.page) queryParams.append('page', filters.page.toString());

    const url = `/access-control/security-events?${queryParams.toString()}`;
    const response = await this.get(token, url);

    if (response.status !== 200) {
      throw new Error(`Failed to get audit logs: ${response.status}`);
    }

    return response.body.logs || response.body.data || response.body;
  }

  /**
   * Get security audit logs (alias)
   * @description Alias for getAuditLogs focused on security events
   */
  async getSecurityAuditLogs(token: string): Promise<SecurityAuditLog[]> {
    return this.getAuditLogs(token, { limit: 100 });
  }

  /**
   * Get user activity from audit logs
   * @description Retrieves activity history for a specific user
   *
   * @param token - Admin JWT token
   * @param userId - User ID
   * @param limit - Maximum number of entries (default: 50)
   * @returns Promise resolving to array of audit log entries
   */
  async getUserActivity(
    token: string,
    userId: number,
    limit: number = 50,
  ): Promise<SecurityAuditLog[]> {
    const response = await this.get(token, `/admin/users/${userId}/activity?limit=${limit}`);
    if (response.status !== 200) {
      // Fallback to general audit log filter
      return this.getAuditLogs(token, { userId, limit });
    }
    return response.body;
  }

  // ============================================================
  // ROUTE MANAGEMENT
  // ============================================================

  /**
   * Get all routes
   * @description Retrieves list of all API routes with permissions
   *
   * @param token - JWT token
   * @returns Promise resolving to array of routes
   */
  async getRoutes(token: string): Promise<any[]> {
    const response = await this.get(token, '/access-control/routes');
    return response.body.data || response.body;
  }

  /**
   * Update route permissions
   * @description Updates the required permission for a route
   *
   * @param token - Admin JWT token
   * @param routeId - Route ID
   * @param permissionId - Permission ID to require
   * @returns Promise resolving to updated route
   */
  async updateRoutePermission(
    token: string,
    routeId: number,
    permissionId: number | null,
  ): Promise<any> {
    const response = await this.patch(token, `/access-control/routes/${routeId}`, {
      permissionId,
    });
    if (response.status !== 200) {
      throw new Error(`Failed to update route permission: ${response.status}`);
    }
    return response.body;
  }
}

/**
 * Create E2E API Helper instance
 * @description Factory function to create API helper
 *
 * @param app - NestJS application instance
 * @returns E2EApiHelper instance
 *
 * @example
 * ```typescript
 * const apiHelper = createE2EApiHelper(app);
 * const role = await apiHelper.createRole(token, { name: 'editor' });
 * ```
 */
export function createE2EApiHelper(app: INestApplication): E2EApiHelper {
  return new E2EApiHelper(app);
}
