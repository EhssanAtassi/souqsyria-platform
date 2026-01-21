/**
 * @file products.routes.ts
 * @description Route configuration for Product Catalog management module.
 *              Provides routes for product listing, details, approval queue,
 *              and category management.
 * @module AdminDashboard/Products/Routes
 */

import { Routes } from '@angular/router';

/**
 * Product Management Routes
 * @description Route configuration for the product catalog module.
 *
 * @routes
 * - `/admin/products` - Product listing with filtering
 * - `/admin/products/pending` - Approval queue for pending products
 * - `/admin/products/categories` - Category management
 * - `/admin/products/inventory` - Inventory management
 * - `/admin/products/:id` - Product detail view
 *
 * @example
 * ```typescript
 * // In admin.routes.ts
 * {
 *   path: 'products',
 *   loadChildren: () => import('./products/products.routes').then(m => m.productsRoutes)
 * }
 * ```
 */
export const productsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/product-list/product-list.component').then(
        m => m.ProductListComponent
      ),
    title: 'SouqSyria Admin | Products',
    data: {
      breadcrumb: 'Products',
      roles: ['super_admin', 'admin', 'moderator', 'vendor_manager']
    }
  },
  {
    path: 'pending',
    loadComponent: () =>
      import('./components/approval-queue/approval-queue.component').then(
        m => m.ApprovalQueueComponent
      ),
    title: 'SouqSyria Admin | Product Approval Queue',
    data: {
      breadcrumb: 'Approval Queue',
      roles: ['super_admin', 'admin', 'moderator']
    }
  },
  {
    path: 'categories',
    loadComponent: () =>
      import('./components/category-manager/category-manager.component').then(
        m => m.CategoryManagerComponent
      ),
    title: 'SouqSyria Admin | Categories',
    data: {
      breadcrumb: 'Categories',
      roles: ['super_admin', 'admin']
    }
  },
  {
    path: 'inventory',
    loadComponent: () =>
      import('./components/inventory-manager/inventory-manager.component').then(
        m => m.InventoryManagerComponent
      ),
    title: 'SouqSyria Admin | Inventory',
    data: {
      breadcrumb: 'Inventory',
      roles: ['super_admin', 'admin', 'vendor_manager']
    }
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./components/product-detail/product-detail.component').then(
        m => m.ProductDetailComponent
      ),
    title: 'SouqSyria Admin | Product Details',
    data: {
      breadcrumb: 'Product Details',
      roles: ['super_admin', 'admin', 'moderator', 'vendor_manager']
    }
  }
];
