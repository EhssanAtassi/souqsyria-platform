/**
 * @fileoverview Shared Components Index
 * @description Central export for all shared components in the Syrian marketplace
 * @swagger
 * components:
 *   schemas:
 *     SharedComponents:
 *       type: object
 *       description: Collection of all shared Angular components for Syrian marketplace
 */

// Category navigation components
export * from './category-navigation';

// Product components
export { ProductCardComponent } from './product-card/product-card.component';
export { ProductGridComponent } from './product-grid/product-grid.component';
export { ProductRecommendationsComponent } from './product-recommendations';

// Header components
export { HeaderComponent } from './header/header.component';

// Loading components
export { SkeletonLoaderComponent } from './skeleton-loader/skeleton-loader.component';

// Component arrays for easier imports
import { CATEGORY_NAVIGATION_COMPONENTS } from './category-navigation';
import { ProductCardComponent } from './product-card/product-card.component';
import { ProductGridComponent } from './product-grid/product-grid.component';
import { ProductRecommendationsComponent } from './product-recommendations';
import { HeaderComponent } from './header/header.component';
import { SkeletonLoaderComponent } from './skeleton-loader/skeleton-loader.component';

/**
 * All shared components for easy module imports
 */
export const SHARED_COMPONENTS = [
  ...CATEGORY_NAVIGATION_COMPONENTS,
  ProductCardComponent,
  ProductGridComponent,
  ProductRecommendationsComponent,
  HeaderComponent,
  SkeletonLoaderComponent
] as const;

/**
 * Shared component imports for Angular modules
 */
export const SHARED_COMPONENT_IMPORTS = [
  ...CATEGORY_NAVIGATION_COMPONENTS,
  ProductCardComponent,
  ProductGridComponent,
  ProductRecommendationsComponent,
  HeaderComponent,
  SkeletonLoaderComponent
];

// Components are already exported above, no need for separate type exports