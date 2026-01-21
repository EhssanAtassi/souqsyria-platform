/**
 * @file users.routes.ts
 * @description Route configuration for the User Management module.
 *              Provides routes for user listing, details, and KYC review workflows.
 * @module AdminDashboard/Users/Routes
 */

import { Routes } from '@angular/router';

/**
 * User Management Routes
 * @description Routes for user administration features.
 *
 * Route structure:
 * - /admin/users - User list with search/filter
 * - /admin/users/:id - User detail view
 * - /admin/users/kyc - KYC verification queue
 * - /admin/users/kyc/:id - KYC detail review
 *
 * @example
 * ```typescript
 * // Access via admin routes
 * { path: 'users', loadChildren: () => import('./users/users.routes').then(m => m.usersRoutes) }
 * ```
 */
export const usersRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/user-list/user-list.component').then(m => m.UserListComponent),
    title: 'SouqSyria Admin | Users',
    data: {
      breadcrumb: 'Users',
      roles: ['super_admin', 'admin', 'customer_service']
    }
  },
  {
    path: 'kyc',
    loadComponent: () => import('./components/kyc-review/kyc-review.component').then(m => m.KycReviewComponent),
    title: 'SouqSyria Admin | KYC Verification',
    data: {
      breadcrumb: 'KYC Verification',
      roles: ['super_admin', 'admin', 'customer_service']
    }
  },
  {
    path: 'kyc/:id',
    loadComponent: () => import('./components/kyc-detail/kyc-detail.component').then(m => m.KycDetailComponent),
    title: 'SouqSyria Admin | KYC Review',
    data: {
      breadcrumb: 'KYC Review',
      roles: ['super_admin', 'admin', 'customer_service']
    }
  },
  {
    path: ':id',
    loadComponent: () => import('./components/user-detail/user-detail.component').then(m => m.UserDetailComponent),
    title: 'SouqSyria Admin | User Details',
    data: {
      breadcrumb: 'User Details',
      roles: ['super_admin', 'admin', 'customer_service']
    }
  }
];
