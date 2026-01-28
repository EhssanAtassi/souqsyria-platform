/**
 * Role Management Routes Configuration
 *
 * @description
 * Routing configuration for the Role Management feature.
 * Uses lazy loading for optimal performance.
 *
 * Note: Permission checking is handled at the parent level in admin.routes.ts
 * using permissionGuard with 'manage_roles' permission requirement.
 *
 * Route Structure:
 * - /admin/roles           -> Role management dashboard with grid and filters
 * - /admin/roles/templates -> Browse and preview pre-built role templates
 * - /admin/roles/new       -> Full-page role creation form
 * - /admin/roles/:id/edit  -> Full-page role editor form
 *
 * @module RoleManagement
 * @version 2.0.0
 *
 * @swagger
 * paths:
 *   /admin/roles:
 *     get:
 *       summary: Role management dashboard
 *       description: Main role management interface with grid and filters
 *       tags: [Admin, Roles]
 *       security:
 *         - AdminAuth: [manage_roles]
 *       responses:
 *         200:
 *           description: Role management page loaded
 *         403:
 *           description: Insufficient permissions
 *
 *   /admin/roles/templates:
 *     get:
 *       summary: Role templates gallery
 *       description: Browse and preview pre-built role templates
 *       tags: [Admin, Roles]
 *       security:
 *         - AdminAuth: [manage_roles]
 *
 *   /admin/roles/new:
 *     get:
 *       summary: Create new role
 *       description: Full-page role creation form
 *       tags: [Admin, Roles]
 *       security:
 *         - AdminAuth: [manage_roles]
 *
 *   /admin/roles/{id}/edit:
 *     get:
 *       summary: Edit existing role
 *       description: Full-page role editor form
 *       tags: [Admin, Roles]
 *       parameters:
 *         - name: id
 *           in: path
 *           required: true
 *           schema:
 *             type: integer
 *           description: Role ID to edit
 *       security:
 *         - AdminAuth: [manage_roles]
 */

import { Routes } from '@angular/router';

/**
 * Role Management Feature Routes
 *
 * @description
 * Route configuration with lazy-loaded components for better performance.
 * Each route includes breadcrumb data for navigation and title for page header.
 *
 * @type {Routes}
 *
 * @example
 * ```typescript
 * // In admin.routes.ts
 * {
 *   path: 'roles',
 *   canActivate: [permissionGuard],
 *   data: {
 *     requiredPermissions: ['manage_roles'],
 *     breadcrumb: 'Roles'
 *   },
 *   loadChildren: () => import('./role-management/role-management.routes')
 *     .then(m => m.ROLE_MANAGEMENT_ROUTES)
 * }
 * ```
 */
export const ROLE_MANAGEMENT_ROUTES: Routes = [
  /**
   * Main Role List Route
   *
   * @description
   * Primary role management interface with card grid, filters,
   * and role statistics overview.
   */
  {
    path: '',
    loadComponent: () =>
      import('./role-management.component').then((m) => m.RoleManagementComponent),
    title: 'SouqSyria Admin | Role Management',
    data: {
      /** Breadcrumb - inherits 'Roles' from parent */
      breadcrumb: null,

      /** Route animation trigger */
      animation: 'RoleManagementPage',

      /** Feature identifier */
      feature: 'role-management',
    },
  },

  /**
   * Role Templates Gallery Route
   *
   * @description
   * Browse and preview pre-built role templates.
   * Templates provide quick-start configurations for common roles.
   */
  {
    path: 'templates',
    loadComponent: () =>
      import('./pages/role-templates-page/role-templates-page.component').then(
        (m) => m.RoleTemplatesPageComponent
      ),
    title: 'SouqSyria Admin | Role Templates',
    data: {
      /** Breadcrumb label */
      breadcrumb: 'Templates',

      /** Route animation trigger */
      animation: 'RoleTemplatesPage',

      /** Feature description */
      description: 'Pre-built role templates for common use cases',
    },
  },

  /**
   * Create New Role Route
   *
   * @description
   * Full-page role creation form with permission selector.
   * Mode is set to 'create' in route data.
   */
  {
    path: 'new',
    loadComponent: () =>
      import('./pages/role-editor-page/role-editor-page.component').then(
        (m) => m.RoleEditorPageComponent
      ),
    title: 'SouqSyria Admin | Create Role',
    data: {
      /** Breadcrumb label */
      breadcrumb: 'New Role',

      /** Route animation trigger */
      animation: 'RoleEditorPage',

      /** Editor mode - create vs edit */
      mode: 'create',

      /** Feature description */
      description: 'Create a new role with custom permissions',
    },
  },

  /**
   * Edit Existing Role Route
   *
   * @description
   * Full-page role editor form with current role data pre-loaded.
   * Mode is set to 'edit' in route data.
   * Role ID is extracted from route params.
   */
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./pages/role-editor-page/role-editor-page.component').then(
        (m) => m.RoleEditorPageComponent
      ),
    title: 'SouqSyria Admin | Edit Role',
    data: {
      /** Breadcrumb label */
      breadcrumb: 'Edit Role',

      /** Route animation trigger */
      animation: 'RoleEditorPage',

      /** Editor mode - create vs edit */
      mode: 'edit',

      /** Feature description */
      description: 'Modify role permissions and settings',
    },
  },
];

/**
 * Role Management Route Paths
 *
 * @description
 * Constants for route paths used in navigation and testing.
 * Centralized here to avoid magic strings throughout the codebase.
 */
export const ROLE_MANAGEMENT_ROUTE_PATHS = {
  /** Base path for role management */
  BASE: '/admin/roles',

  /** Role templates path */
  TEMPLATES: '/admin/roles/templates',

  /** New role creation path */
  NEW: '/admin/roles/new',

  /** Role edit path (with placeholder) */
  EDIT: '/admin/roles/:id/edit',

  /**
   * Generate role edit path
   * @param roleId - Role ID
   * @returns Full route path
   */
  getRoleEditPath: (roleId: number | string): string => `/admin/roles/${roleId}/edit`,

  /**
   * Generate role view path (uses edit page in view mode)
   * @param roleId - Role ID
   * @returns Full route path
   */
  getRoleViewPath: (roleId: number | string): string => `/admin/roles/${roleId}/edit`,
} as const;

/**
 * Role Management Required Permissions
 *
 * @description
 * Permission constants for role management feature.
 * Note: Main permission is checked at parent route level.
 */
export const ROLE_MANAGEMENT_PERMISSIONS = {
  /** Permission to view roles list */
  VIEW: 'view_roles',

  /** Permission to create new roles */
  CREATE: 'create_roles',

  /** Permission to edit existing roles */
  EDIT: 'edit_roles',

  /** Permission to delete roles */
  DELETE: 'delete_roles',

  /** Combined permission for full role management */
  MANAGE: 'manage_roles',
} as const;
