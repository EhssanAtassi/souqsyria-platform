/**
 * @file analytics.routes.ts
 * @description Route configuration for the Analytics & Reporting module.
 *              Handles sales dashboards, user analytics, and export management.
 * @module AdminDashboard/Analytics
 */

import { Routes } from '@angular/router';

/**
 * Analytics Routes
 * @description Defines routes for analytics, reporting, and Business Intelligence features.
 *              Includes advanced BI dashboards with CLV, funnel, abandonment, and cohort analysis.
 *
 * @routes
 * - '' - Sales dashboard with revenue charts
 * - 'users' - User analytics and engagement metrics
 * - 'commissions' - Commission reports and vendor earnings
 * - 'exports' - Export manager for generating reports
 * - 'bi' - Business Intelligence dashboard (overview)
 * - 'bi/clv' - Customer Lifetime Value analytics
 * - 'bi/funnel' - Conversion funnel analysis
 * - 'bi/abandonment' - Cart abandonment tracking
 * - 'bi/cohort' - Cohort retention analysis
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
  },
  // =========================================================================
  // BUSINESS INTELLIGENCE ROUTES
  // =========================================================================

  {
    path: 'bi',
    loadComponent: () =>
      import('./bi-dashboard/bi-dashboard.component').then(
        m => m.BIDashboardComponent
      ),
    title: 'SouqSyria Admin | Business Intelligence',
    data: {
      breadcrumb: 'Business Intelligence',
      roles: ['super_admin', 'admin'],
      description: 'Advanced BI dashboard with CLV analytics, conversion funnel, cart abandonment, and cohort analysis'
    }
  },

  // CLV Analytics Module (lazy-loaded with child routes)
  {
    path: 'bi/clv',
    loadChildren: () =>
      import('./clv/clv-analytics.routes').then(m => m.CLV_ANALYTICS_ROUTES),
    title: 'SouqSyria Admin | Customer Lifetime Value',
    data: {
      breadcrumb: 'CLV Analytics',
      roles: ['super_admin', 'admin']
    }
  },

  // Conversion Funnel Analytics Module (lazy-loaded with child routes)
  {
    path: 'bi/funnel',
    loadChildren: () =>
      import('./funnel/funnel-analytics.routes').then(m => m.FUNNEL_ANALYTICS_ROUTES),
    title: 'SouqSyria Admin | Conversion Funnel',
    data: {
      breadcrumb: 'Conversion Funnel',
      roles: ['super_admin', 'admin']
    }
  },

  // Cart Abandonment Analytics Module (lazy-loaded with child routes)
  {
    path: 'bi/abandonment',
    loadChildren: () =>
      import('./abandonment/abandonment-analytics.routes').then(m => m.ABANDONMENT_ANALYTICS_ROUTES),
    title: 'SouqSyria Admin | Cart Abandonment',
    data: {
      breadcrumb: 'Cart Abandonment',
      roles: ['super_admin', 'admin']
    }
  },

  // Cohort Analysis Module (lazy-loaded with child routes)
  {
    path: 'bi/cohort',
    loadChildren: () =>
      import('./cohort/cohort-analytics.routes').then(m => m.COHORT_ANALYTICS_ROUTES),
    title: 'SouqSyria Admin | Cohort Analysis',
    data: {
      breadcrumb: 'Cohort Analysis',
      roles: ['super_admin', 'admin']
    }
  }
];
