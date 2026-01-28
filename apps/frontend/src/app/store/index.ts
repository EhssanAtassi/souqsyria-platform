/**
 * Akita State Management Barrel Exports
 *
 * Centralized exports for all Akita stores, queries, and services.
 * Import from this file for cleaner imports in components.
 *
 * @example
 * // Instead of:
 * import { ProductsService } from './store/products/products.service';
 * import { CartQuery } from './store/cart/cart.query';
 *
 * // Use:
 * import { ProductsService, CartQuery } from './store';
 */

// Products Store
export * from './products/products.store';
export * from './products/products.query';
export * from './products/products.service';

// Cart Store
export * from './cart/cart.store';
export * from './cart/cart.query';
export * from './cart/cart.service';

// User Store
export * from './user/user.store';
export * from './user/user.query';
export * from './user/user.service';

// UI Store
export * from './ui/ui.store';
export * from './ui/ui.query';
export * from './ui/ui.service';

// Permission Store
export * from './permissions/permission.store';
export * from './permissions/permission.query';
export * from './permissions/permission.service';
export * from './permissions/permission.model';
