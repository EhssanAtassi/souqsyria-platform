import { Routes } from '@angular/router';

/**
 * @description Product feature routes configuration
 * Lazy-loaded route definitions for the products browsing feature
 */
export const productsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/product-list/product-list-page.component').then(
        (m) => m.ProductListPageComponent,
      ),
    title: 'Products - SouqSyria | المنتجات',
  },
  {
    path: 'compare',
    loadComponent: () =>
      import('./pages/product-compare/product-compare-page.component').then(
        (m) => m.ProductComparePageComponent,
      ),
    title: 'Compare Products - SouqSyria | مقارنة المنتجات',
  },
  {
    path: ':productSlug',
    loadComponent: () =>
      import('./pages/product-detail/product-detail-page.component').then(
        (m) => m.ProductDetailPageComponent,
      ),
    title: 'Product Details - SouqSyria | تفاصيل المنتج',
  },
];
