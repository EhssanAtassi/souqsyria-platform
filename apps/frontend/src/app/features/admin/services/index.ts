/**
 * @file Admin Services Barrel Export
 * @description Re-exports all admin dashboard services for convenient importing.
 * @module AdminDashboard/Services
 */

// Base API Service
export { AdminApiService } from './admin-api.service';

// Domain Services
export { AdminUsersService } from './admin-users.service';
export { AdminProductsService } from './admin-products.service';
export { AdminOrdersService } from './admin-orders.service';
export { AdminVendorsService } from './admin-vendors.service';
export { AdminAnalyticsService } from './admin-analytics.service';
