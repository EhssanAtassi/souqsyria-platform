/**
 * @file clv-analytics.routes.ts
 * @description Routing configuration for Customer Lifetime Value (CLV) analytics module.
 *              Implements lazy loading for all CLV components with role-based access control.
 * @module AdminDashboard/Analytics/CLV
 */

import { Routes } from '@angular/router';

/**
 * CLV Analytics Routes
 * @description Lazy-loaded routes for CLV dashboard and sub-components.
 *              All routes require admin or analyst role access.
 *
 * Route Structure:
 * - /admin/analytics/clv                → CLV Dashboard (overview)
 * - /admin/analytics/clv/segments       → Customer Segments breakdown
 * - /admin/analytics/clv/predictions    → CLV Predictions & forecasting
 * - /admin/analytics/clv/top-customers  → High-value customers list
 *
 * @example
 * ```typescript
 * // In analytics.routes.ts
 * {
 *   path: 'clv',
 *   loadChildren: () => import('./clv/clv-analytics.routes')
 *     .then(m => m.CLV_ANALYTICS_ROUTES)
 * }
 * ```
 */
export const CLV_ANALYTICS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./clv-dashboard.component')
      .then(m => m.ClvDashboardComponent),
    data: {
      title: 'CLV Analytics',
      breadcrumb: 'CLV Analytics',
      permissions: ['analytics:view', 'clv:view']
    },
    children: [
      {
        path: '',
        redirectTo: 'overview',
        pathMatch: 'full'
      },
      {
        path: 'overview',
        loadComponent: () => import('./components/clv-overview/clv-overview.component')
          .then(m => m.ClvOverviewComponent),
        data: {
          title: 'CLV Overview',
          breadcrumb: 'Overview'
        }
      },
      {
        path: 'segments',
        loadComponent: () => import('./components/customer-segments/customer-segments.component')
          .then(m => m.CustomerSegmentsComponent),
        data: {
          title: 'Customer Segments',
          breadcrumb: 'Segments'
        }
      },
      {
        path: 'predictions',
        loadComponent: () => import('./components/clv-predictions/clv-predictions.component')
          .then(m => m.ClvPredictionsComponent),
        data: {
          title: 'CLV Predictions',
          breadcrumb: 'Predictions'
        }
      },
      {
        path: 'top-customers',
        loadComponent: () => import('./components/top-customers/top-customers.component')
          .then(m => m.TopCustomersComponent),
        data: {
          title: 'Top Customers',
          breadcrumb: 'Top Customers'
        }
      }
    ]
  }
];
