import { Routes } from '@angular/router';

import { permissionGuard } from '../../core/guards/permission.guard';
import { AdminGuard } from '../../shared/guards/admin.guard';

/**
 * Admin Module Routes Configuration
 *
 * @description
 * Complete routing configuration for the SouqSyria Admin Panel.
 * Implements Router-First Architecture with permission-based access control.
 *
 * All routes are protected by multiple guard layers:
 * 1. AdminGuard: Handles authentication and session management
 * 2. permissionGuard: Checks specific permissions for each route
 *
 * @module AdminRoutes
 * @version 2.0.0
 *
 * Route Hierarchy:
 * - /admin/login           -> Public admin login page
 * - /admin/unauthorized    -> Access denied page
 * - /admin                  -> Protected admin layout
 *   - /admin/dashboard     -> Main overview dashboard
 *   - /admin/users         -> User management (requires: manage_users)
 *   - /admin/roles         -> Role management (requires: manage_roles)
 *   - /admin/routes        -> Route-permission mapping (requires: manage_routes)
 *   - /admin/security      -> Security audit (requires: view_audit_logs)
 *   - /admin/profile       -> Admin profile settings
 *   - /admin/settings      -> System settings (requires: super_admin, admin)
 *
 * Permission Hierarchy:
 * - access_admin_panel: Required for ALL admin routes (enforced by AdminGuard)
 * - manage_users: User management dashboard
 * - manage_roles: Role management dashboard
 * - manage_routes: Route-permission mapping dashboard
 * - view_audit_logs: Security audit dashboard
 *
 * @swagger
 * paths:
 *   /admin:
 *     get:
 *       summary: Admin panel entry point
 *       security:
 *         - AdminAuth: [access_admin_panel]
 *       responses:
 *         200:
 *           description: Admin layout loaded
 *         401:
 *           description: Not authenticated
 *         403:
 *           description: Insufficient permissions
 *
 * @example
 * ```typescript
 * // In app.routes.ts
 * {
 *   path: 'admin',
 *   loadChildren: () => import('./features/admin/admin.routes')
 *     .then(m => m.adminRoutes)
 * }
 * ```
 */
export const adminRoutes: Routes = [
  /**
   * Admin Login Route
   *
   * @description
   * Public route for admin authentication.
   * Does not require any guards.
   */
  {
    path: 'login',
    loadComponent: () =>
      import('./auth/admin-login.component').then((m) => m.AdminLoginComponent),
    title: 'SouqSyria Admin | Login',
    data: {
      breadcrumb: 'Login',
      hideInNavigation: true,
    },
  },

  /**
   * Unauthorized Access Route
   *
   * @description
   * Displayed when user lacks required permissions.
   * Accessible to all authenticated admin users.
   */
  {
    path: 'unauthorized',
    loadComponent: () =>
      import('./auth/admin-unauthorized.component').then((m) => m.AdminUnauthorizedComponent),
    title: 'SouqSyria Admin | Access Restricted',
    data: {
      breadcrumb: 'Access Denied',
      hideInNavigation: true,
    },
  },

  /**
   * Protected Admin Layout
   *
   * @description
   * Main admin layout wrapper with sidebar and header.
   * All child routes require authentication via AdminGuard.
   */
  {
    path: '',
    canActivate: [AdminGuard],
    canActivateChild: [AdminGuard],
    loadComponent: () =>
      import('./layout/admin-layout.component').then((m) => m.AdminLayoutComponent),
    children: [
      /**
       * Default redirect to dashboard
       */
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },

      /**
       * Admin Dashboard Overview
       *
       * @description
       * Main dashboard with KPIs, activity feed, and quick links.
       * Accessible to all authenticated admin users.
       */
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/admin-dashboard.component').then((m) => m.AdminDashboardComponent),
        title: 'SouqSyria Admin | Dashboard',
        data: {
          breadcrumb: 'Dashboard',
          animation: 'DashboardPage',
          /** Dashboard accessible to all authenticated admin roles */
          roles: ['super_admin', 'admin', 'moderator', 'vendor_manager', 'customer_service']
        },
      },

      /**
       * User Management Routes
       *
       * @description
       * Complete user management functionality.
       * Requires: manage_users permission
       *
       * Sub-routes:
       * - /admin/users         -> User list with filters
       * - /admin/users/:userId -> User detail view
       */
      {
        path: 'users',
        canActivate: [permissionGuard],
        data: {
          requiredPermissions: ['manage_users'],
          permissionMode: 'all',
          breadcrumb: 'Users',
        },
        loadChildren: () =>
          import('./user-management/user-management.routes').then((m) => m.USER_MANAGEMENT_ROUTES),
      },

      /**
       * Role Management Routes
       *
       * @description
       * Role creation, editing, and template management.
       * Requires: manage_roles permission
       *
       * Sub-routes:
       * - /admin/roles           -> Role grid with filters
       * - /admin/roles/templates -> Pre-built role templates
       * - /admin/roles/new       -> Create new role
       * - /admin/roles/:id/edit  -> Edit existing role
       */
      {
        path: 'roles',
        canActivate: [permissionGuard],
        data: {
          requiredPermissions: ['manage_roles'],
          permissionMode: 'all',
          breadcrumb: 'Roles',
        },
        loadChildren: () =>
          import('./role-management/role-management.routes').then((m) => m.ROLE_MANAGEMENT_ROUTES),
      },

      /**
       * Route-Permission Mapping Routes
       *
       * @description
       * API route and permission mapping management.
       * Requires: manage_routes permission
       *
       * Sub-routes:
       * - /admin/routes         -> Default (redirects to list)
       * - /admin/routes/list    -> Table view of routes
       * - /admin/routes/tree    -> Hierarchical tree view
       * - /admin/routes/matrix  -> Permission coverage matrix
       */
      {
        path: 'routes',
        canActivate: [permissionGuard],
        data: {
          requiredPermissions: ['manage_routes'],
          permissionMode: 'all',
          breadcrumb: 'Route Mapping',
        },
        loadChildren: () =>
          import('./route-management/route-management.routes').then(
            (m) => m.ROUTE_MANAGEMENT_ROUTES
          ),
      },

      /**
       * Security Audit Routes
       *
       * @description
       * Security monitoring and audit log viewing.
       * Requires: view_audit_logs permission
       *
       * Features:
       * - Audit log viewer with filters
       * - Failed login attempts monitoring
       * - Suspicious activity detection
       */
      {
        path: 'security',
        canActivate: [permissionGuard],
        data: {
          requiredPermissions: ['view_audit_logs'],
          permissionMode: 'all',
          breadcrumb: 'Security',
        },
        loadChildren: () =>
          import('./security-audit/security-audit.routes').then((m) => m.SECURITY_AUDIT_ROUTES),
      },

      /**
       * Admin Profile Route
       *
       * @description
       * Personal profile settings for the logged-in admin.
       * Accessible to all authenticated admin users.
       */
      {
        path: 'profile',
        loadComponent: () =>
          import('./profile/admin-profile.component').then((m) => m.AdminProfileComponent),
        title: 'SouqSyria Admin | Profile',
        data: {
          breadcrumb: 'Profile',
          animation: 'ProfilePage',
          /** Profile accessible to all authenticated admin roles */
          roles: ['super_admin', 'admin', 'moderator', 'vendor_manager', 'customer_service'],
        },
      },

      // =========================================================================
      // SYSTEM SETTINGS MODULE
      // =========================================================================
      /**
       * System Settings Route
       *
       * @description
       * Global system configuration settings.
       * Restricted to super_admin and admin roles.
       */
      {
        path: 'settings',
        loadChildren: () => import('./settings/settings.routes').then((m) => m.settingsRoutes),
        title: 'SouqSyria Admin | Settings',
        data: {
          roles: ['super_admin', 'admin'],
          breadcrumb: 'Settings',
          animation: 'SettingsPage',
        },
      },

      // =========================================================================
      // PRODUCT CATALOG MODULE
      // =========================================================================
      /**
       * Product Management Routes
       *
       * @description
       * Product catalog management including inventory and categories.
       * Requires product management roles.
       */
      {
        path: 'products',
        loadChildren: () => import('./products/products.routes').then((m) => m.productsRoutes),
        title: 'SouqSyria Admin | Products',
        data: {
          roles: ['super_admin', 'admin', 'moderator', 'vendor_manager'],
          breadcrumb: 'Products',
        },
      },

      // =========================================================================
      // ORDER MANAGEMENT MODULE
      // =========================================================================
      /**
       * Order Management Routes
       *
       * @description
       * Order processing, refunds, and fulfillment management.
       * Requires order management roles.
       */
      {
        path: 'orders',
        loadChildren: () => import('./orders/orders.routes').then((m) => m.ordersRoutes),
        title: 'SouqSyria Admin | Orders',
        data: {
          roles: ['super_admin', 'admin', 'customer_service'],
          breadcrumb: 'Orders',
        },
      },

      // =========================================================================
      // VENDOR MANAGEMENT MODULE
      // =========================================================================
      /**
       * Vendor Management Routes
       *
       * @description
       * Vendor onboarding, verification, and payout management.
       * Requires vendor management roles.
       */
      {
        path: 'vendors',
        loadChildren: () => import('./vendors/vendors.routes').then((m) => m.vendorsRoutes),
        title: 'SouqSyria Admin | Vendors',
        data: {
          roles: ['super_admin', 'admin', 'vendor_manager'],
          breadcrumb: 'Vendors',
        },
      },

      // =========================================================================
      // ANALYTICS & REPORTING MODULE
      // =========================================================================
      /**
       * Analytics Dashboard Routes
       *
       * @description
       * Business intelligence, sales reports, and user analytics.
       * Restricted to super_admin and admin roles.
       */
      {
        path: 'analytics',
        loadChildren: () => import('./analytics/analytics.routes').then((m) => m.analyticsRoutes),
        title: 'SouqSyria Admin | Analytics',
        data: {
          roles: ['super_admin', 'admin'],
          breadcrumb: 'Analytics',
        },
      },
    ],
  },
];

/**
 * Admin Route Paths Constants
 *
 * @description
 * Centralized route path constants for navigation and testing.
 * Prevents magic strings throughout the codebase.
 */
export const ADMIN_ROUTE_PATHS = {
  /** Base admin path */
  BASE: '/admin',

  /** Authentication routes */
  LOGIN: '/admin/login',
  UNAUTHORIZED: '/admin/unauthorized',

  /** Main routes */
  DASHBOARD: '/admin/dashboard',
  USERS: '/admin/users',
  ROLES: '/admin/roles',
  ROUTES: '/admin/routes',
  SECURITY: '/admin/security',
  PROFILE: '/admin/profile',
  SETTINGS: '/admin/settings',

  /**
   * Generate user detail path
   * @param userId - User ID
   * @returns Full route path
   */
  getUserPath: (userId: number | string): string => `/admin/users/${userId}`,

  /**
   * Generate role edit path
   * @param roleId - Role ID
   * @returns Full route path
   */
  getRoleEditPath: (roleId: number | string): string => `/admin/roles/${roleId}/edit`,
} as const;

/**
 * Admin Route Permission Requirements
 *
 * @description
 * Permission mapping for each admin route.
 * Used for navigation menu visibility and route protection.
 */
export const ADMIN_ROUTE_PERMISSIONS = {
  /** Dashboard - accessible to all authenticated admins */
  DASHBOARD: [] as string[],

  /** User management permissions */
  USERS: ['manage_users'],

  /** Role management permissions */
  ROLES: ['manage_roles'],

  /** Route-permission mapping permissions */
  ROUTES: ['manage_routes'],

  /** Security audit permissions */
  SECURITY: ['view_audit_logs'],

  /** Profile - accessible to all authenticated admins */
  PROFILE: [] as string[],

  /** Settings - role-based (not permission-based) */
  SETTINGS: [] as string[],
} as const;

/**
 * Admin Navigation Items
 *
 * @description
 * Navigation configuration for the admin sidebar.
 * Includes icons, labels, and permission requirements.
 */
export const ADMIN_NAVIGATION_ITEMS = [
  {
    path: ADMIN_ROUTE_PATHS.DASHBOARD,
    label: 'Dashboard',
    icon: 'dashboard',
    permissions: ADMIN_ROUTE_PERMISSIONS.DASHBOARD,
  },
  {
    path: ADMIN_ROUTE_PATHS.USERS,
    label: 'User Management',
    icon: 'people',
    permissions: ADMIN_ROUTE_PERMISSIONS.USERS,
  },
  {
    path: ADMIN_ROUTE_PATHS.ROLES,
    label: 'Role Management',
    icon: 'admin_panel_settings',
    permissions: ADMIN_ROUTE_PERMISSIONS.ROLES,
  },
  {
    path: ADMIN_ROUTE_PATHS.ROUTES,
    label: 'Route Mapping',
    icon: 'route',
    permissions: ADMIN_ROUTE_PERMISSIONS.ROUTES,
  },
  {
    path: ADMIN_ROUTE_PATHS.SECURITY,
    label: 'Security Audit',
    icon: 'security',
    permissions: ADMIN_ROUTE_PERMISSIONS.SECURITY,
  },
  {
    path: ADMIN_ROUTE_PATHS.SETTINGS,
    label: 'Settings',
    icon: 'settings',
    permissions: ADMIN_ROUTE_PERMISSIONS.SETTINGS,
    roles: ['super_admin', 'admin'],
  },
] as const;
