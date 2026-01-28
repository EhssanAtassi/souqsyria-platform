/**
 * @file cohort-analytics.routes.ts
 * @description Routing configuration for Cohort Analysis module.
 *              Implements lazy loading for cohort analysis components.
 * @module AdminDashboard/Analytics/Cohort
 */

import { Routes } from '@angular/router';

/**
 * Cohort Analytics Routes
 * @description Lazy-loaded routes for cohort analysis.
 *
 * Route Structure:
 * - /admin/analytics/bi/cohort             → Cohort Dashboard (overview)
 * - /admin/analytics/bi/cohort/retention   → Retention analysis
 * - /admin/analytics/bi/cohort/revenue     → Revenue by cohort
 * - /admin/analytics/bi/cohort/behavior    → Behavioral patterns
 */
export const COHORT_ANALYTICS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./cohort-dashboard.component')
      .then(m => m.CohortDashboardComponent),
    data: {
      title: 'Cohort Analysis',
      breadcrumb: 'Cohort Analysis',
      permissions: ['analytics:view', 'cohort:view']
    },
    children: [
      {
        path: '',
        redirectTo: 'overview',
        pathMatch: 'full'
      },
      {
        path: 'overview',
        loadComponent: () => import('./components/cohort-overview/cohort-overview.component')
          .then(m => m.CohortOverviewComponent),
        data: {
          title: 'Cohort Overview',
          breadcrumb: 'Overview'
        }
      },
      {
        path: 'retention',
        loadComponent: () => import('./components/cohort-retention/cohort-retention.component')
          .then(m => m.CohortRetentionComponent),
        data: {
          title: 'Retention Analysis',
          breadcrumb: 'Retention'
        }
      },
      {
        path: 'revenue',
        loadComponent: () => import('./components/cohort-revenue/cohort-revenue.component')
          .then(m => m.CohortRevenueComponent),
        data: {
          title: 'Cohort Revenue',
          breadcrumb: 'Revenue'
        }
      },
      {
        path: 'behavior',
        loadComponent: () => import('./components/cohort-behavior/cohort-behavior.component')
          .then(m => m.CohortBehaviorComponent),
        data: {
          title: 'Behavioral Patterns',
          breadcrumb: 'Behavior'
        }
      }
    ]
  }
];
