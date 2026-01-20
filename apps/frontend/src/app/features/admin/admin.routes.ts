import { Routes } from '@angular/router';

import { AdminGuard } from '../../shared/guards/admin.guard';

/**
 * Admin panel route configuration.
 *
 * Sets up the base layout wrapper and lazy child routes. Additional
 * feature routes (products, orders, vendors, etc.) will be attached in
 * subsequent phases.
 */
export const adminRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./auth/admin-login.component').then(m => m.AdminLoginComponent),
    title: 'SouqSyria Admin | Login'
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./auth/admin-unauthorized.component').then(m => m.AdminUnauthorizedComponent),
    title: 'SouqSyria Admin | Access Restricted'
  },
  {
    path: '',
    canActivate: [AdminGuard],
    canActivateChild: [AdminGuard],
    loadComponent: () => import('./layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
        title: 'SouqSyria Admin | Dashboard'
      },
      {
        path: 'profile',
        loadComponent: () => import('./profile/admin-profile.component').then(m => m.AdminProfileComponent),
        title: 'SouqSyria Admin | Profile'
      },
      {
        path: 'settings',
        loadComponent: () => import('./settings/admin-settings.component').then(m => m.AdminSettingsComponent),
        title: 'SouqSyria Admin | Settings',
        data: {
          roles: ['super_admin', 'admin']
        }
      }
    ]
  }
];
