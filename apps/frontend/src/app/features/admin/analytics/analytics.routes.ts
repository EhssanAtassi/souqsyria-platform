/**
 * @file analytics.routes.ts
 * @description Route configuration for the Analytics & Reporting module.
 *              Handles sales dashboards, user analytics, and export management.
 * @module AdminDashboard/Analytics
 */

import { Routes } from '@angular/router';

/**
 * Analytics Routes
 * @description Defines routes for analytics and reporting features
 *
 * @routes
 * - '' - Sales dashboard with revenue charts
 * - 'users' - User analytics and engagement metrics
 * - 'commissions' - Commission reports and vendor earnings
 * - 'exports' - Export manager for generating reports
 *
 * @example
 * ```typescript
 * // Routes are loaded via admin.routes.ts
 * {
 *   path: 'analytics',
 *   loadChildren: () => import('./analytics/analytics.routes').then(m => m.analyticsRoutes)
 * }
 * ```
 */
export const analyticsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/sales-dashboard/sales-dashboard.component').then(
        m => m.SalesDashboardComponent
      ),
    title: 'SouqSyria Admin | Sales Analytics',
    data: {
      breadcrumb: 'Analytics',
      roles: ['super_admin', 'admin']
    }
  },
  {
    path: 'users',
    loadComponent: () =>
      import('./components/user-analytics/user-analytics.component').then(
        m => m.UserAnalyticsComponent
      ),
    title: 'SouqSyria Admin | User Analytics',
    data: {
      breadcrumb: 'User Analytics',
      roles: ['super_admin', 'admin']
    }
  },
  {
    path: 'commissions',
    loadComponent: () =>
      import('./components/commission-reports/commission-reports.component').then(
        m => m.CommissionReportsComponent
      ),
    title: 'SouqSyria Admin | Commission Reports',
    data: {
      breadcrumb: 'Commissions',
      roles: ['super_admin', 'admin']
    }
  },
  {
    path: 'exports',
    loadComponent: () =>
      import('./components/export-manager/export-manager.component').then(
        m => m.ExportManagerComponent
      ),
    title: 'SouqSyria Admin | Export Manager',
    data: {
      breadcrumb: 'Exports',
      roles: ['super_admin', 'admin']
    }
  }
];
