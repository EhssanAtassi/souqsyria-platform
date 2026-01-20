/**
 * @fileoverview Category Navigation Components Index
 * @description Exports all category navigation related components and utilities
 * @author SouqSyria Development Team
 * @version 1.0.0
 */

// Main Components
import { CategoryNavigationComponent } from './category-navigation.component';
// import { CategoryMegaMenuComponent } from './category-mega-menu.component'; // Temporarily disabled
import { CategoryItemComponent } from './category-item.component';
import { MobileCategoryMenuComponent } from './mobile-category-menu.component';
import { CategoryIconComponent } from './category-icon.component';

export { CategoryNavigationComponent } from './category-navigation.component';
// export { CategoryMegaMenuComponent } from './category-mega-menu.component'; // Temporarily disabled
export { CategoryItemComponent, type CategoryDisplayMode } from './category-item.component';
export { MobileCategoryMenuComponent } from './mobile-category-menu.component';
export { CategoryIconComponent, type IconSize, type IconColor } from './category-icon.component';

// Type exports for mega menu
// export { type MegaMenuLayout } from './category-mega-menu.component'; // Temporarily disabled

// Component array for easier imports
export const CATEGORY_NAVIGATION_COMPONENTS = [
  CategoryNavigationComponent,
  // CategoryMegaMenuComponent, // Temporarily disabled
  CategoryItemComponent,
  MobileCategoryMenuComponent,
  CategoryIconComponent
] as const;