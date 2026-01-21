/**
 * @file orders.routes.ts
 * @description Route configuration for the Order Management module.
 *              Handles order listing, details, and refund queue.
 * @module AdminDashboard/Orders
 */

import { Routes } from '@angular/router';

/**
 * Order Management Routes
 * @description Defines routes for order management features
 *
 * @routes
 * - '' - Order list with filters and bulk actions
 * - 'refunds' - Pending refund request queue
 * - ':id' - Order detail view with timeline
 *
 * @example
 * ```typescript
 * // Routes are loaded via admin.routes.ts
 * {
 *   path: 'orders',
 *   loadChildren: () => import('./orders/orders.routes').then(m => m.ordersRoutes)
 * }
 * ```
 */
export const ordersRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/order-list/order-list.component').then(
        m => m.OrderListComponent
      ),
    title: 'SouqSyria Admin | Orders',
    data: {
      breadcrumb: 'Orders',
      roles: ['super_admin', 'admin', 'moderator', 'customer_service']
    }
  },
  {
    path: 'refunds',
    loadComponent: () =>
      import('./components/refund-queue/refund-queue.component').then(
        m => m.RefundQueueComponent
      ),
    title: 'SouqSyria Admin | Refund Queue',
    data: {
      breadcrumb: 'Refund Queue',
      roles: ['super_admin', 'admin', 'customer_service']
    }
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./components/order-detail/order-detail.component').then(
        m => m.OrderDetailComponent
      ),
    title: 'SouqSyria Admin | Order Details',
    data: {
      breadcrumb: 'Order Details',
      roles: ['super_admin', 'admin', 'moderator', 'customer_service']
    }
  }
];
