/**
 * @file funnel-analytics.routes.ts
 * @description Routing configuration for Conversion Funnel analytics module.
 *              Implements lazy loading for all funnel analysis components.
 * @module AdminDashboard/Analytics/Funnel
 */

import { Routes } from '@angular/router';

/**
 * Funnel Analytics Routes
 * @description Lazy-loaded routes for conversion funnel analysis.
 *
 * Route Structure:
 * - /admin/analytics/bi/funnel             → Funnel Dashboard (overview)
 * - /admin/analytics/bi/funnel/stages      → Stage-by-stage breakdown
 * - /admin/analytics/bi/funnel/devices     → Device-specific funnel analysis
 * - /admin/analytics/bi/funnel/dropoffs    → Drop-off point analysis
 *
 * @example
 * ```typescript
 * // In analytics.routes.ts
 * {
 *   path: 'bi/funnel',
 *   loadChildren: () => import('./funnel/funnel-analytics.routes')
 *     .then(m => m.FUNNEL_ANALYTICS_ROUTES)
 * }
 * ```
 */
export const FUNNEL_ANALYTICS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./funnel-dashboard.component')
      .then(m => m.FunnelDashboardComponent),
    data: {
      title: 'Conversion Funnel',
      breadcrumb: 'Conversion Funnel',
      permissions: ['analytics:view', 'funnel:view']
    },
    children: [
      {
        path: '',
        redirectTo: 'overview',
        pathMatch: 'full'
      },
      {
        path: 'overview',
        loadComponent: () => import('./components/funnel-overview/funnel-overview.component')
          .then(m => m.FunnelOverviewComponent),
        data: {
          title: 'Funnel Overview',
          breadcrumb: 'Overview'
        }
      },
      {
        path: 'stages',
        loadComponent: () => import('./components/funnel-stages/funnel-stages.component')
          .then(m => m.FunnelStagesComponent),
        data: {
          title: 'Funnel Stages',
          breadcrumb: 'Stages'
        }
      },
      {
        path: 'devices',
        loadComponent: () => import('./components/funnel-devices/funnel-devices.component')
          .then(m => m.FunnelDevicesComponent),
        data: {
          title: 'Funnel by Device',
          breadcrumb: 'Devices'
        }
      },
      {
        path: 'dropoffs',
        loadComponent: () => import('./components/funnel-dropoffs/funnel-dropoffs.component')
          .then(m => m.FunnelDropoffsComponent),
        data: {
          title: 'Drop-off Analysis',
          breadcrumb: 'Drop-offs'
        }
      }
    ]
  }
];
