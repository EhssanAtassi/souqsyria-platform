/**
 * User Management Models - Barrel Export
 *
 * @description
 * Central export point for all user management model interfaces.
 * Import from this file to access all models.
 *
 * @example
 * ```typescript
 * import {
 *   ManagedUser,
 *   UserStatus,
 *   UserFilter,
 *   UserActivity,
 *   BanUserRequest
 * } from '../models';
 * ```
 *
 * @module UserManagement/Models
 */

// User entity and related types
export * from './user.model';

// Filter, pagination, and list types
export * from './user-filter.model';

// Activity and audit log types
export * from './user-activity.model';

// API request/response types
export * from './api-response.model';

// Type aliases for DTOs (backwards compatibility)
export type { UsersListParams as QueryUsersDto } from './user-filter.model';
export type { BanUserRequest as BanUserDto } from './api-response.model';
export type { SuspendUserRequest as SuspendUserDto } from './api-response.model';
export type { UpdateRolesRequest as AssignRolesDto } from './api-response.model';
export type { ManagedUser as UpdateUserDto } from './user.model';
export type { ManagedUser as User } from './user.model';
export type { UserEffectivePermissions as UserPermissions } from './api-response.model';
