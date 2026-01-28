/**
 * Permission State Management Models
 *
 * Defines TypeScript interfaces for permission-based access control (PBAC)
 * in the SouqSyria e-commerce platform.
 *
 * Architecture:
 * - Users have Roles (business role + assigned admin role)
 * - Roles contain Permissions
 * - Permissions are checked for route access and feature visibility
 *
 * @module PermissionModels
 */

/**
 * Permission State Interface
 *
 * Represents the complete permission state in the Akita store.
 * This is the single source of truth for user permissions.
 *
 * State Management:
 * - `permissions`: Flattened array of permission names for fast lookup
 * - `roles`: Complete role objects with nested permissions
 * - `loading`: Indicates ongoing HTTP request
 * - `loaded`: Indicates if data has been fetched at least once
 * - `error`: Error message from failed requests
 * - `lastFetched`: Timestamp for cache staleness detection
 *
 * @example
 * ```typescript
 * const state: PermissionState = {
 *   permissions: ['manage_users', 'view_products', 'edit_products'],
 *   roles: [businessRole, adminRole],
 *   loading: false,
 *   loaded: true,
 *   error: null,
 *   lastFetched: Date.now()
 * };
 * ```
 *
 * @swagger
 * components:
 *   schemas:
 *     PermissionState:
 *       type: object
 *       description: Complete permission state for authenticated user
 *       properties:
 *         permissions:
 *           type: array
 *           items:
 *             type: string
 *           description: Flattened array of permission names
 *           example: ['manage_users', 'view_products', 'edit_products']
 *         roles:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Role'
 *           description: User roles with nested permissions
 *         loading:
 *           type: boolean
 *           description: Indicates if permissions are being fetched
 *         loaded:
 *           type: boolean
 *           description: Indicates if permissions have been fetched
 *         error:
 *           type: string
 *           nullable: true
 *           description: Error message from failed requests
 *         lastFetched:
 *           type: number
 *           nullable: true
 *           description: Unix timestamp of last successful fetch
 */
export interface PermissionState {
  /** Flattened array of permission names for fast O(n) lookup */
  permissions: string[];

  /** User's roles (business role + assigned admin role) */
  roles: Role[];

  /** Loading state - true during HTTP requests */
  loading: boolean;

  /** Loaded state - true if data has been fetched at least once */
  loaded: boolean;

  /** Error message from failed API requests */
  error: string | null;

  /** Unix timestamp of last successful fetch (for cache staleness) */
  lastFetched: number | null;
}

/**
 * Role Interface
 *
 * Represents a user role with associated permissions.
 * Roles can be:
 * - Business roles: customer, seller, admin
 * - Assigned roles: Additional admin-level roles
 *
 * @example
 * ```typescript
 * const role: Role = {
 *   id: 1,
 *   name: 'seller',
 *   description: 'Seller with product management access',
 *   rolePermissions: [
 *     { permission: { id: 1, name: 'manage_products', ... } },
 *     { permission: { id: 2, name: 'view_orders', ... } }
 *   ]
 * };
 * ```
 *
 * @swagger
 * components:
 *   schemas:
 *     Role:
 *       type: object
 *       description: User role with associated permissions
 *       required:
 *         - id
 *         - name
 *         - description
 *       properties:
 *         id:
 *           type: integer
 *           description: Unique role identifier
 *           example: 1
 *         name:
 *           type: string
 *           description: Role name (snake_case)
 *           example: 'seller'
 *         description:
 *           type: string
 *           description: Human-readable role description
 *           example: 'Seller with product management access'
 *         rolePermissions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/RolePermission'
 *           description: Permissions associated with this role
 */
export interface Role {
  /** Unique role identifier */
  id: number;

  /** Role name (e.g., 'customer', 'seller', 'admin') */
  name: string;

  /** Human-readable role description */
  description: string;

  /** Associated permissions (optional, may not be loaded) */
  rolePermissions?: RolePermission[];
}

/**
 * RolePermission Interface
 *
 * Junction table entity connecting roles to permissions.
 * Represents the many-to-many relationship between Role and Permission.
 *
 * @example
 * ```typescript
 * const rolePermission: RolePermission = {
 *   permission: {
 *     id: 1,
 *     name: 'manage_users',
 *     description: 'Create, update, delete users',
 *     resource: 'users',
 *     action: 'manage',
 *     isSystem: false
 *   }
 * };
 * ```
 *
 * @swagger
 * components:
 *   schemas:
 *     RolePermission:
 *       type: object
 *       description: Junction entity connecting roles to permissions
 *       required:
 *         - permission
 *       properties:
 *         permission:
 *           $ref: '#/components/schemas/Permission'
 */
export interface RolePermission {
  /** Permission entity */
  permission: Permission;
}

/**
 * Permission Interface
 *
 * Represents a granular permission in the system.
 * Permissions follow the pattern: `{action}_{resource}` (e.g., 'view_products', 'manage_users')
 *
 * Permission Structure:
 * - `resource`: Entity being accessed (e.g., 'users', 'products', 'orders')
 * - `action`: Operation being performed (e.g., 'view', 'create', 'update', 'delete', 'manage')
 * - `isSystem`: Protected permissions that cannot be modified
 *
 * @example
 * ```typescript
 * const permission: Permission = {
 *   id: 1,
 *   name: 'manage_users',
 *   description: 'Full access to user management',
 *   resource: 'users',
 *   action: 'manage',
 *   isSystem: false
 * };
 * ```
 *
 * @swagger
 * components:
 *   schemas:
 *     Permission:
 *       type: object
 *       description: Granular permission for access control
 *       required:
 *         - id
 *         - name
 *         - description
 *         - isSystem
 *       properties:
 *         id:
 *           type: integer
 *           description: Unique permission identifier
 *           example: 1
 *         name:
 *           type: string
 *           description: Permission name (action_resource)
 *           example: 'manage_users'
 *         description:
 *           type: string
 *           description: Human-readable permission description
 *           example: 'Full access to user management'
 *         resource:
 *           type: string
 *           nullable: true
 *           description: Resource entity (e.g., 'users', 'products')
 *           example: 'users'
 *         action:
 *           type: string
 *           nullable: true
 *           description: Action type (e.g., 'view', 'create', 'manage')
 *           example: 'manage'
 *         isSystem:
 *           type: boolean
 *           description: Protected system permission flag
 *           example: false
 */
export interface Permission {
  /** Unique permission identifier */
  id: number;

  /** Permission name (action_resource format) */
  name: string;

  /** Human-readable permission description */
  description: string;

  /** Resource entity (e.g., 'users', 'products', 'orders') */
  resource?: string;

  /** Action type (e.g., 'view', 'create', 'update', 'delete', 'manage') */
  action?: string;

  /** System permission flag (protected from modification) */
  isSystem: boolean;
}

/**
 * Permissions Response Interface
 *
 * API response structure from GET /api/admin/users/:id/permissions
 *
 * @example
 * ```typescript
 * const response: PermissionsResponse = {
 *   permissions: ['manage_users', 'view_products', 'edit_products'],
 *   roles: [businessRole, adminRole]
 * };
 * ```
 *
 * @swagger
 * components:
 *   schemas:
 *     PermissionsResponse:
 *       type: object
 *       description: API response containing user permissions
 *       required:
 *         - permissions
 *       properties:
 *         permissions:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of permission names
 *           example: ['manage_users', 'view_products']
 *         roles:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Role'
 *           description: Optional array of role objects
 */
export interface PermissionsResponse {
  /** Array of permission names */
  permissions: string[];

  /** Optional array of role objects with nested permissions */
  roles?: Role[];
}

/**
 * User with Roles Interface
 *
 * Extended user object from GET /api/admin/users/:id
 * Includes business role and assigned admin role.
 *
 * @example
 * ```typescript
 * const user: UserWithRoles = {
 *   id: 1,
 *   email: 'seller@souqsyria.com',
 *   role: { id: 2, name: 'seller', description: 'Seller role' },
 *   assignedRole: { id: 5, name: 'product_manager', description: 'Product Manager' },
 *   rolePermissions: [...]
 * };
 * ```
 *
 * @swagger
 * components:
 *   schemas:
 *     UserWithRoles:
 *       type: object
 *       description: User entity with business and assigned roles
 *       required:
 *         - id
 *         - email
 *       properties:
 *         id:
 *           type: integer
 *           description: Unique user identifier
 *           example: 1
 *         email:
 *           type: string
 *           format: email
 *           description: User email address
 *           example: 'seller@souqsyria.com'
 *         role:
 *           $ref: '#/components/schemas/Role'
 *           description: Business role (customer, seller, admin)
 *         assignedRole:
 *           $ref: '#/components/schemas/Role'
 *           nullable: true
 *           description: Additional admin-assigned role
 *         rolePermissions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/RolePermission'
 *           description: Combined permissions from all roles
 */
export interface UserWithRoles {
  /** Unique user identifier */
  id: number;

  /** User email address */
  email: string;

  /** Business role (customer, seller, admin) */
  role?: Role;

  /** Additional admin-assigned role */
  assignedRole?: Role;

  /** Combined permissions from all roles */
  rolePermissions?: RolePermission[];
}

/**
 * Permission Check Result Interface
 *
 * Result object for complex permission checks.
 * Used internally for debugging and logging.
 *
 * @internal
 */
export interface PermissionCheckResult {
  /** Permission name that was checked */
  permission: string;

  /** Whether user has the permission */
  hasPermission: boolean;

  /** Source of the permission (role name) */
  source?: string;

  /** Timestamp of the check */
  timestamp: number;
}
