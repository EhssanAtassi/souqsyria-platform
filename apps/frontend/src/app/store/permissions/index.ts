/**
 * Permission State Management Module
 *
 * Barrel export file for permission-related classes and interfaces.
 * Provides centralized imports for the permission management system.
 *
 * Usage:
 * ```typescript
 * import {
 *   PermissionStore,
 *   PermissionQuery,
 *   PermissionService,
 *   PermissionState,
 *   Role,
 *   Permission
 * } from '@app/store/permissions';
 * ```
 *
 * Architecture:
 * - Store: Manages state (PermissionStore)
 * - Query: Reactive queries (PermissionQuery)
 * - Service: HTTP integration (PermissionService)
 * - Models: TypeScript interfaces
 *
 * @module PermissionModule
 */

// Store
export { PermissionStore } from './permission.store';

// Query
export { PermissionQuery } from './permission.query';

// Service
export { PermissionService } from './permission.service';

// Models
export {
  PermissionState,
  Role,
  RolePermission,
  Permission,
  PermissionsResponse,
  UserWithRoles,
  PermissionCheckResult,
} from './permission.model';
