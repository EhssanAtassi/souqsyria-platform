/**
 * @file abandonment-analytics.routes.ts
 * @description Routing configuration for Cart Abandonment Analytics module.
 *              Implements lazy loading for abandonment analysis components.
 * @module AdminDashboard/Analytics/Abandonment
 */

import { Routes } from '@angular/router';

/**
 * Cart Abandonment Analytics Routes
 * @description Lazy-loaded routes for cart abandonment analysis.
 *
 * Route Structure:
 * - /admin/analytics/bi/abandonment              → Abandonment Dashboard (overview)
 * - /admin/analytics/bi/abandonment/carts        → Active abandoned carts
 * - /admin/analytics/bi/abandonment/recovery     → Recovery campaign analysis
 * - /admin/analytics/bi/abandonment/products     → Products in abandoned carts
 * - /admin/analytics/bi/abandonment/trends       → Abandonment trends over time
 */
export const ABANDONMENT_ANALYTICS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./abandonment-dashboard.component')
      .then(m => m.AbandonmentDashboardComponent),
    data: {
      title: 'Cart Abandonment Analytics',
      breadcrumb: 'Cart Abandonment',
      permissions: ['analytics:view', 'abandonment:view']
    },
    children: [
      {
        path: '',
        redirectTo: 'overview',
        pathMatch: 'full'
      },
      {
        path: 'overview',
        loadComponent: () => import('./components/abandonment-overview/abandonment-overview.component')
          .then(m => m.AbandonmentOverviewComponent),
        data: {
          title: 'Abandonment Overview',
          breadcrumb: 'Overview'
        }
      },
      {
        path: 'carts',
        loadComponent: () => import('./components/abandoned-carts/abandoned-carts.component')
          .then(m => m.AbandonedCartsComponent),
        data: {
          title: 'Abandoned Carts',
          breadcrumb: 'Carts'
        }
      },
      {
        path: 'recovery',
        loadComponent: () => import('./components/recovery-analysis/recovery-analysis.component')
          .then(m => m.RecoveryAnalysisComponent),
        data: {
          title: 'Recovery Analysis',
          breadcrumb: 'Recovery'
        }
      },
      {
        path: 'products',
        loadComponent: () => import('./components/abandoned-products/abandoned-products.component')
          .then(m => m.AbandonedProductsComponent),
        data: {
          title: 'Abandoned Products',
          breadcrumb: 'Products'
        }
      },
      {
        path: 'trends',
        loadComponent: () => import('./components/abandonment-trends/abandonment-trends.component')
          .then(m => m.AbandonmentTrendsComponent),
        data: {
          title: 'Abandonment Trends',
          breadcrumb: 'Trends'
        }
      }
    ]
  }
];
