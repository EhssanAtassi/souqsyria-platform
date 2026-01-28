import { Routes } from '@angular/router';

/**
 * User Management Feature Routes
 *
 * @description
 * Defines all routes for the User Management feature module.
 * Uses lazy-loaded standalone components for optimal performance.
 *
 * Note: Permission checking is handled at the parent level in admin.routes.ts
 * using permissionGuard with 'manage_users' permission requirement.
 *
 * Route Structure:
 * - /admin/users           -> User list with table, filters, and detail panel
 * - /admin/users/:userId   -> Direct access to user detail (opens detail panel)
 *
 * Data:
 * - breadcrumb: Breadcrumb trail label
 * - animation: Route animation identifier
 * - openDetailPanel: Whether to auto-open detail panel (for :userId routes)
 *
 * Router-First Architecture:
 * Routes are defined before component implementation. This ensures:
 * - Clear navigation structure
 * - Proper lazy loading boundaries
 * - Consistent permission enforcement
 *
 * @module UserManagement
 * @version 2.0.0
 *
 * @example
 * ```typescript
 * // In admin.routes.ts
 * {
 *   path: 'users',
 *   canActivate: [permissionGuard],
 *   data: {
 *     requiredPermissions: ['manage_users'],
 *     breadcrumb: 'Users'
 *   },
 *   loadChildren: () => import('./user-management/user-management.routes')
 *     .then(m => m.USER_MANAGEMENT_ROUTES)
 * }
 * ```
 *
 * @swagger
 * paths:
 *   /admin/users:
 *     get:
 *       summary: User management dashboard
 *       description: Main page for managing users with table, filters, and search
 *       tags: [Admin, Users]
 *       security:
 *         - AdminAuth: [manage_users]
 *       responses:
 *         200:
 *           description: User management page loaded
 *         401:
 *           description: Not authenticated
 *         403:
 *           description: Insufficient permissions
 *
 *   /admin/users/{userId}:
 *     get:
 *       summary: User detail view
 *       description: Direct link to user detail panel
 *       tags: [Admin, Users]
 *       parameters:
 *         - name: userId
 *           in: path
 *           required: true
 *           schema:
 *             type: integer
 *           description: User ID to display
 *       security:
 *         - AdminAuth: [manage_users]
 *       responses:
 *         200:
 *           description: User detail loaded
 *         404:
 *           description: User not found
 */
export const USER_MANAGEMENT_ROUTES: Routes = [
  /**
   * Main User List Route
   *
   * @description
   * Primary user management interface with data table, filters,
   * search functionality, and side panel for details.
   */
  {
    path: '',
    loadComponent: () =>
      import('./user-management.component').then((m) => m.UserManagementComponent),
    title: 'SouqSyria Admin | User Management',
    data: {
      /** Breadcrumb configuration - inherits 'Users' from parent */
      breadcrumb: null,

      /** Route animation trigger */
      animation: 'UserManagementPage',

      /** Feature identifier */
      feature: 'user-management',

      /** SEO/meta (for admin panel) */
      meta: {
        title: 'User Management - SouqSyria Admin',
        description: 'Manage user accounts, roles, and permissions',
      },
    },
  },

  /**
   * Direct User Detail Route
   *
   * @description
   * Provides a direct URL to open a specific user's detail panel.
   * Loads the main component with the detail panel pre-opened.
   *
   * Use Case:
   * - Direct links from notifications
   * - Bookmarking specific users
   * - Sharing user profiles between admins
   *
   * Route Data:
   * - openDetailPanel: true - Signals component to auto-open panel
   * - userId from route params - Identifies which user to load
   */
  {
    path: ':userId',
    loadComponent: () =>
      import('./user-management.component').then((m) => m.UserManagementComponent),
    title: 'SouqSyria Admin | User Details',
    data: {
      /** Breadcrumb label */
      breadcrumb: 'User Details',

      /** Route animation trigger */
      animation: 'UserDetailPage',

      /** Signal to component to open detail panel on load */
      openDetailPanel: true,
    },
  },
];

/**
 * User Management Route Paths
 *
 * @description
 * Constants for route paths used in navigation and testing.
 * Centralized here to avoid magic strings throughout the codebase.
 */
export const USER_MANAGEMENT_ROUTES_PATHS = {
  /** Base path for user management */
  BASE: '/admin/users',

  /** User detail route (with placeholder) */
  USER_DETAIL: '/admin/users/:userId',

  /**
   * Generate user detail path
   * @param userId - User ID
   * @returns Full route path
   */
  getUserDetailPath: (userId: number | string): string => `/admin/users/${userId}`,
} as const;

/**
 * User Management Required Permissions
 *
 * @description
 * Permission constants for user management feature.
 * Note: Main permission is checked at parent route level.
 */
export const USER_MANAGEMENT_PERMISSIONS = {
  /** Permission to view users list */
  VIEW: 'view_users',

  /** Permission to create new users */
  CREATE: 'create_users',

  /** Permission to edit existing users */
  EDIT: 'edit_users',

  /** Permission to delete users */
  DELETE: 'delete_users',

  /** Combined permission for full user management */
  MANAGE: 'manage_users',
} as const;
