/**
 * @fileoverview Category Navigation Components Index
 * @description Exports the category navigation bar and supporting components.
 * Legacy mega menu components (sidebar, fullwidth, category-mega-menu) removed
 * in favor of the unified S1 Sprint MegaMenuComponent.
 */

export { CategoryNavigationComponent } from './category-navigation.component';
export { CategoryItemComponent, type CategoryDisplayMode } from './category-item.component';
export { MobileCategoryMenuComponent } from './mobile-category-menu.component';
export { CategoryIconComponent, type IconSize, type IconColor } from './category-icon.component';

export const CATEGORY_NAVIGATION_COMPONENTS = [
  CategoryNavigationComponent,
  CategoryItemComponent,
  MobileCategoryMenuComponent,
  CategoryIconComponent
] as const;

// Re-import for the const array
import { CategoryNavigationComponent } from './category-navigation.component';
import { CategoryItemComponent } from './category-item.component';
import { MobileCategoryMenuComponent } from './mobile-category-menu.component';
import { CategoryIconComponent } from './category-icon.component';
