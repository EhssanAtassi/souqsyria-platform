/**
 * @file settings.routes.ts
 * @description Route configuration for the System Configuration module.
 *              Handles settings, role management, and audit logs.
 * @module AdminDashboard/Settings
 */

import { Routes } from '@angular/router';

/**
 * Settings Routes
 * @description Defines routes for system configuration features
 *
 * @routes
 * - '' - Settings overview/hub page
 * - 'general' - General platform settings
 * - 'roles' - Role management
 * - 'roles/:id' - Role detail/edit view
 * - 'audit-log' - Audit log viewer
 * - 'feature-flags' - Feature flag management
 *
 * @example
 * ```typescript
 * // Routes are loaded via admin.routes.ts
 * {
 *   path: 'settings',
 *   loadChildren: () => import('./settings/settings.routes').then(m => m.settingsRoutes)
 * }
 * ```
 */
export const settingsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/settings-hub/settings-hub.component').then(
        m => m.SettingsHubComponent
      ),
    title: 'SouqSyria Admin | Settings',
    data: {
      breadcrumb: 'Settings',
      roles: ['super_admin', 'admin']
    }
  },
  {
    path: 'general',
    loadComponent: () =>
      import('./components/general-settings/general-settings.component').then(
        m => m.GeneralSettingsComponent
      ),
    title: 'SouqSyria Admin | General Settings',
    data: {
      breadcrumb: 'General',
      roles: ['super_admin', 'admin']
    }
  },
  {
    path: 'roles',
    loadComponent: () =>
      import('./components/role-management/role-list.component').then(
        m => m.RoleListComponent
      ),
    title: 'SouqSyria Admin | Role Management',
    data: {
      breadcrumb: 'Roles',
      roles: ['super_admin']
    }
  },
  {
    path: 'roles/:id',
    loadComponent: () =>
      import('./components/role-management/role-detail.component').then(
        m => m.RoleDetailComponent
      ),
    title: 'SouqSyria Admin | Role Details',
    data: {
      breadcrumb: 'Role Details',
      roles: ['super_admin']
    }
  },
  {
    path: 'audit-log',
    loadComponent: () =>
      import('./components/audit-log/audit-log.component').then(
        m => m.AuditLogComponent
      ),
    title: 'SouqSyria Admin | Audit Log',
    data: {
      breadcrumb: 'Audit Log',
      roles: ['super_admin', 'admin']
    }
  },
  {
    path: 'feature-flags',
    loadComponent: () =>
      import('./components/feature-flags/feature-flags.component').then(
        m => m.FeatureFlagsComponent
      ),
    title: 'SouqSyria Admin | Feature Flags',
    data: {
      breadcrumb: 'Feature Flags',
      roles: ['super_admin']
    }
  }
];
