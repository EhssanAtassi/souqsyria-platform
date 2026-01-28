/**
 * Role Management - Permission Model Interfaces
 *
 * @description
 * Defines TypeScript interfaces for permission entities and tree structures.
 *
 * @module RoleManagement/Models
 * @version 1.0.0
 */

// ============================================================================
// PERMISSION INTERFACE
// ============================================================================

/**
 * Permission Entity Interface
 *
 * @description
 * Represents a single permission in the system.
 *
 * @example
 * ```typescript
 * const permission: Permission = {
 *   id: 10,
 *   name: 'manage_users',
 *   displayName: 'Manage Users',
 *   description: 'Can view, create, edit, and delete users',
 *   category: 'user_management',
 *   resource: 'users',
 *   action: 'manage',
 *   isSystem: true,
 *   createdAt: new Date('2024-01-01')
 * };
 * ```
 */
export interface Permission {
  /** Unique permission identifier */
  id: number;

  /** Permission name (unique, lowercase_underscore format) */
  name: string;

  /** Human-readable display name */
  displayName: string;

  /** Description of what this permission allows */
  description: string;

  /** Permission category (for grouping in UI) */
  category: string;

  /** Resource this permission applies to */
  resource: string;

  /** Action type (view, create, edit, delete, manage, etc.) */
  action: string;

  /** Whether permission is system-defined (cannot be deleted) */
  isSystem: boolean;

  /** When permission was created */
  createdAt: Date;
}

// ============================================================================
// PERMISSION TREE STRUCTURES
// ============================================================================

/**
 * Permission Category Tree Node
 *
 * @description
 * Represents a category node in the permission tree.
 * Categories group related permissions for UI display.
 *
 * @example
 * ```typescript
 * const category: PermissionCategory = {
 *   name: 'user_management',
 *   displayName: 'User Management',
 *   permissions: [
 *     { id: 10, name: 'manage_users', ... },
 *     { id: 11, name: 'view_users', ... }
 *   ]
 * };
 * ```
 */
export interface PermissionCategory {
  /** Category identifier */
  name: string;

  /** Human-readable category name */
  displayName: string;

  /** Permissions in this category */
  permissions: Permission[];

  /** Icon for UI display */
  icon?: string;

  /** Description of this category */
  description?: string;
}

/**
 * Permission Tree for Hierarchical Display
 *
 * @description
 * Tree structure for permission selection UI.
 * Organizes permissions by category and resource.
 */
export interface PermissionTree {
  /** All categories with their permissions */
  categories: PermissionCategory[];

  /** Total permission count */
  totalCount: number;
}

// ============================================================================
// PERMISSION FILTER INTERFACE
// ============================================================================

/**
 * Permission Filter Criteria
 *
 * @description
 * Filter options for permission list.
 */
export interface PermissionFilter {
  /** Search query (searches name, displayName, description) */
  search?: string;

  /** Filter by category */
  category?: string;

  /** Filter by resource */
  resource?: string;

  /** Filter by action type */
  action?: string;

  /** Filter by system flag */
  isSystem?: boolean;
}

// ============================================================================
// PERMISSION SELECTION STATE
// ============================================================================

/**
 * Permission Selection State
 *
 * @description
 * Tracks which permissions are selected in the UI.
 * Used for role creation/editing forms.
 */
export interface PermissionSelectionState {
  /** IDs of selected permissions */
  selectedIds: number[];

  /** Whether all permissions are selected */
  allSelected: boolean;

  /** Whether selection is indeterminate (some selected) */
  indeterminate: boolean;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Permission Summary Type
 *
 * @description
 * Minimal permission info for badges, chips, etc.
 */
export type PermissionSummary = Pick<Permission, 'id' | 'name' | 'displayName'>;
