import { Routes } from '@angular/router';

/**
 * Account module routes configuration
 *
 * Defines routes for user account management features
 * including dashboard, profile settings, orders, etc.
 *
 * @swagger
 * components:
 *   schemas:
 *     AccountRoutes:
 *       type: object
 *       description: Account management routes for Syrian marketplace
 *       properties:
 *         dashboard:
 *           type: string
 *           description: Main account dashboard route
 *         profile:
 *           type: string
 *           description: Profile settings management route
 */
export const accountRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./account-dashboard.component').then(m => m.AccountDashboardComponent),
    title: 'Account Dashboard - SouqSyria'
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent),
    title: 'Profile - SouqSyria'
  },
  {
    path: 'profile/edit',
    loadComponent: () => import('./pages/profile-edit/profile-edit.component').then(m => m.ProfileEditComponent),
    title: 'Edit Profile - SouqSyria'
  },
  {
    path: 'security',
    loadComponent: () => import('./pages/security/security.component').then(m => m.SecurityComponent),
    title: 'Security - SouqSyria'
  },
  {
    path: 'wishlist',
    loadComponent: () => import('./wishlist.component').then(m => m.WishlistComponent),
    title: 'My Wishlist - SouqSyria'
  },
  {
    path: 'orders',
    loadComponent: () => import('./orders/order-history.component').then(m => m.OrderHistoryComponent),
    title: 'Order History - SouqSyria'
  },
  {
    path: 'addresses',
    loadComponent: () => import('./addresses/pages/address-list/address-list.component').then(m => m.AddressListComponent),
    title: 'Address Book - SouqSyria'
  },
  {
    path: 'preferences',
    loadComponent: () => import('./pages/preferences/preferences.component').then(m => m.PreferencesComponent),
    title: 'Preferences - SouqSyria'
  },
  {
    path: 'offers',
    loadComponent: () => import('./promotional-offers.component').then(m => m.PromotionalOffersComponent),
    title: 'Promotional Offers - SouqSyria'
  }
];
