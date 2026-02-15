/**
 * Category Feature Routes
 *
 * @description Router-First route definitions for the category feature.
 * Provides lazy-loaded routes with feature-scoped providers.
 *
 * @pattern Router-First Architecture
 * - Feature routes defined in dedicated file
 * - Lazy-loaded via loadChildren from app.routes.ts
 * - Feature-scoped providers for facade and analytics services
 * - Extensible for future child routes (reviews, sellers, etc.)
 *
 * @swagger
 * components:
 *   schemas:
 *     CategoryRoutes:
 *       type: object
 *       description: Category feature route configuration
 */

import { Routes } from '@angular/router';
import { CategoryFacadeService } from './services/category-facade.service';
import { CategoryAnalyticsService } from './services/category-analytics.service';

/**
 * Category feature routes
 *
 * @description Defines routing for category browsing pages.
 * The main route loads CategoryComponent as the smart container.
 * Feature-scoped providers ensure facade and analytics are only
 * instantiated when the category route is active.
 */
export const CATEGORY_ROUTES: Routes = [
  {
    path: ':categorySlug',
    loadComponent: () =>
      import('./component/category.component').then(
        (m) => m.CategoryComponent
      ),
    title: 'Category - SouqSyria',
    data: {
      breadcrumb: 'Category',
    },
    providers: [
      CategoryFacadeService,
      CategoryAnalyticsService,
    ],
  },
  // Future child routes:
  // {
  //   path: ':categorySlug/sellers',
  //   loadComponent: () => import('./components/category-sellers/category-sellers.component')
  //     .then(m => m.CategorySellersComponent),
  //   title: 'Category Sellers - SouqSyria'
  // },
];
