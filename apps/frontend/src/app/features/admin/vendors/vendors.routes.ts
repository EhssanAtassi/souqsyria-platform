/**
 * @file vendors.routes.ts
 * @description Route configuration for the Vendor Management module.
 *              Handles vendor listing, verification, and payout management.
 * @module AdminDashboard/Vendors
 */

import { Routes } from '@angular/router';

/**
 * Vendor Management Routes
 * @description Defines routes for vendor management features
 *
 * @routes
 * - '' - Vendor list with filters and statistics
 * - 'verifications' - Pending verification queue
 * - 'payouts' - Payout request management
 * - ':id' - Vendor detail view with performance metrics
 *
 * @example
 * ```typescript
 * // Routes are loaded via admin.routes.ts
 * {
 *   path: 'vendors',
 *   loadChildren: () => import('./vendors/vendors.routes').then(m => m.vendorsRoutes)
 * }
 * ```
 */
export const vendorsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/vendor-list/vendor-list.component').then(
        m => m.VendorListComponent
      ),
    title: 'SouqSyria Admin | Vendors',
    data: {
      breadcrumb: 'Vendors',
      roles: ['super_admin', 'admin', 'vendor_manager']
    }
  },
  {
    path: 'verifications',
    loadComponent: () =>
      import('./components/verification-queue/verification-queue.component').then(
        m => m.VerificationQueueComponent
      ),
    title: 'SouqSyria Admin | Vendor Verifications',
    data: {
      breadcrumb: 'Verification Queue',
      roles: ['super_admin', 'admin', 'vendor_manager']
    }
  },
  {
    path: 'payouts',
    loadComponent: () =>
      import('./components/payout-list/payout-list.component').then(
        m => m.PayoutListComponent
      ),
    title: 'SouqSyria Admin | Vendor Payouts',
    data: {
      breadcrumb: 'Payouts',
      roles: ['super_admin', 'admin']
    }
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./components/vendor-detail/vendor-detail.component').then(
        m => m.VendorDetailComponent
      ),
    title: 'SouqSyria Admin | Vendor Details',
    data: {
      breadcrumb: 'Vendor Details',
      roles: ['super_admin', 'admin', 'vendor_manager']
    }
  }
];
