import { Routes } from '@angular/router';

/**
 * Route Management Feature Routes
 *
 * @description
 * Defines the routing configuration for the Route-Permission Mapping Dashboard.
 * Uses child routes to display different views via router-outlet in the container.
 *
 * Note: Permission checking is handled at the parent level in admin.routes.ts
 * using permissionGuard with 'manage_routes' permission requirement.
 *
 * Route Structure:
 * - /admin/routes         -> Container (redirects to list)
 * - /admin/routes/list    -> List view with sortable table
 * - /admin/routes/tree    -> Tree view grouped by controller
 * - /admin/routes/matrix  -> Matrix view showing permission coverage
 *
 * @module RouteManagement
 * @version 2.0.0
 *
 * @swagger
 * paths:
 *   /admin/routes:
 *     get:
 *       summary: Route-permission mapping dashboard
 *       description: Container for route management views
 *       tags: [Admin, Routes]
 *       security:
 *         - AdminAuth: [manage_routes]
 *       responses:
 *         200:
 *           description: Route management container loaded
 *         403:
 *           description: Insufficient permissions
 *
 *   /admin/routes/list:
 *     get:
 *       summary: Route list view
 *       description: Tabular view of all routes with sorting and filtering
 *       tags: [Admin, Routes]
 *       security:
 *         - AdminAuth: [manage_routes]
 *
 *   /admin/routes/tree:
 *     get:
 *       summary: Route tree view
 *       description: Hierarchical view of routes grouped by controller
 *       tags: [Admin, Routes]
 *       security:
 *         - AdminAuth: [manage_routes]
 *
 *   /admin/routes/matrix:
 *     get:
 *       summary: Permission matrix view
 *       description: Heat map showing permission coverage across routes
 *       tags: [Admin, Routes]
 *       security:
 *         - AdminAuth: [manage_routes]
 *
 * @example
 * ```typescript
 * // In admin.routes.ts
 * {
 *   path: 'routes',
 *   canActivate: [permissionGuard],
 *   data: {
 *     requiredPermissions: ['manage_routes'],
 *     breadcrumb: 'Route Mapping'
 *   },
 *   loadChildren: () => import('./route-management/route-management.routes')
 *     .then(m => m.ROUTE_MANAGEMENT_ROUTES)
 * }
 * ```
 */
export const ROUTE_MANAGEMENT_ROUTES: Routes = [
  /**
   * Route Management Container
   *
   * @description
   * Parent container with view switcher tabs.
   * Houses the router-outlet for child views.
   */
  {
    path: '',
    loadComponent: () =>
      import('./route-management.component').then(
        (m) => m.RouteManagementComponent
      ),
    title: 'SouqSyria Admin | Route-Permission Mapping',
    data: {
      /** Breadcrumb - inherits 'Route Mapping' from parent */
      breadcrumb: null,

      /** Route animation trigger */
      animation: 'RouteManagementPage',

      /** Feature identifier */
      feature: 'route-management',
    },
    children: [
      /**
       * Default redirect to list view
       */
      {
        path: '',
        redirectTo: 'list',
        pathMatch: 'full',
      },

      /**
       * List View Route
       *
       * @description
       * Tabular view of all routes with sorting, filtering,
       * and inline permission editing capabilities.
       */
      {
        path: 'list',
        loadComponent: () =>
          import('./views/route-list-view/route-list-view.component').then(
            (m) => m.RouteListViewComponent
          ),
        title: 'SouqSyria Admin | Route List',
        data: {
          /** Breadcrumb label */
          breadcrumb: 'List View',

          /** View mode identifier */
          viewMode: 'list',

          /** Route animation trigger */
          animation: 'RouteListView',

          /** Feature description */
          description: 'Tabular view of all routes with sorting and filtering',
        },
      },

      /**
       * Tree View Route
       *
       * @description
       * Hierarchical tree view of routes grouped by controller.
       * Provides visual representation of route organization.
       */
      {
        path: 'tree',
        loadComponent: () =>
          import('./views/route-tree-view/route-tree-view.component').then(
            (m) => m.RouteTreeViewComponent
          ),
        title: 'SouqSyria Admin | Route Tree',
        data: {
          /** Breadcrumb label */
          breadcrumb: 'Tree View',

          /** View mode identifier */
          viewMode: 'tree',

          /** Route animation trigger */
          animation: 'RouteTreeView',

          /** Feature description */
          description: 'Hierarchical view grouped by controller',
        },
      },

      /**
       * Matrix View Route
       *
       * @description
       * Permission coverage heat map showing which routes
       * have which permissions assigned.
       */
      {
        path: 'matrix',
        loadComponent: () =>
          import('./views/route-matrix-view/route-matrix-view.component').then(
            (m) => m.RouteMatrixViewComponent
          ),
        title: 'SouqSyria Admin | Permission Matrix',
        data: {
          /** Breadcrumb label */
          breadcrumb: 'Matrix View',

          /** View mode identifier */
          viewMode: 'matrix',

          /** Route animation trigger */
          animation: 'RouteMatrixView',

          /** Feature description */
          description: 'Permission coverage heat map',
        },
      },
    ],
  },
];

/**
 * Route Management Route Paths
 *
 * @description
 * Constants for route paths used in navigation and testing.
 * Centralized here to avoid magic strings throughout the codebase.
 */
export const ROUTE_MANAGEMENT_ROUTE_PATHS = {
  /** Base path for route management */
  BASE: '/admin/routes',

  /** List view path */
  LIST: '/admin/routes/list',

  /** Tree view path */
  TREE: '/admin/routes/tree',

  /** Matrix view path */
  MATRIX: '/admin/routes/matrix',

  /**
   * Get path for specific view mode
   * @param mode - View mode (list, tree, matrix)
   * @returns Full route path
   */
  getViewPath: (mode: 'list' | 'tree' | 'matrix'): string => `/admin/routes/${mode}`,
} as const;

/**
 * Route Management View Modes
 *
 * @description
 * Available view modes for route management dashboard.
 * Used for view switching and URL generation.
 */
export const ROUTE_MANAGEMENT_VIEW_MODES = {
  /** Tabular list view */
  LIST: 'list',

  /** Hierarchical tree view */
  TREE: 'tree',

  /** Permission coverage matrix */
  MATRIX: 'matrix',
} as const;

/**
 * Route Management Required Permissions
 *
 * @description
 * Permission constants for route management feature.
 * Note: Main permission is checked at parent route level.
 */
export const ROUTE_MANAGEMENT_PERMISSIONS = {
  /** Permission to view routes list */
  VIEW: 'view_routes',

  /** Permission to create new route mappings */
  CREATE: 'create_routes',

  /** Permission to edit route permissions */
  EDIT: 'edit_routes',

  /** Permission to delete route mappings */
  DELETE: 'delete_routes',

  /** Combined permission for full route management */
  MANAGE: 'manage_routes',
} as const;
