/**
 * Quick Navigation Configuration
 *
 * @description Configuration for quick navigation menu on Syrian marketplace homepage
 * This file follows the PROJECT_STRUCTURE_BLUEPRINT pattern of extracting all
 * configurations from components into dedicated config files.
 *
 * @swagger
 * components:
 *   schemas:
 *     QuickNavigationItem:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Navigation item name in English
 *         icon:
 *           type: string
 *           description: Material icon name
 *         active:
 *           type: boolean
 *           description: Whether this item is currently active
 *         route:
 *           type: string
 *           description: Navigation route path
 */

/**
 * Quick navigation item configuration interface
 * @description Type-safe configuration for sticky navigation menu items
 */
export interface QuickNavigationItemConfig {
  /** Display name in English */
  name: string;
  /** Material Design icon identifier */
  icon: string;
  /** Active state indicator */
  active: boolean;
  /** Navigation route path */
  route: string;
}

/**
 * Quick navigation categories for sticky menu
 *
 * @description Compact navigation menu with icons for Syrian marketplace quick access
 * These items appear in a sticky horizontal menu bar that allows users to quickly
 * navigate to key marketplace sections without scrolling.
 *
 * @remarks
 * - Displays as sticky navigation bar below header
 * - Uses Material Design icons for visual identification
 * - Active state highlights current section
 * - Optimized for both desktop and mobile viewing
 *
 * @example
 * ```typescript
 * // In component:
 * import { QUICK_NAVIGATION_CONFIG } from './config/quick-navigation.config';
 *
 * quickNavCategories = [...QUICK_NAVIGATION_CONFIG]; // Clone for mutability
 * ```
 */
export const QUICK_NAVIGATION_CONFIG: readonly QuickNavigationItemConfig[] = [
  {
    name: 'Featured',
    icon: 'star',
    active: true,
    route: '/featured'
  },
  {
    name: 'Special Offers',
    icon: 'local_offer',
    active: false,
    route: '/campaigns/special-offers'
  },
  {
    name: 'New Arrivals',
    icon: 'new_releases',
    active: false,
    route: '/new-arrivals'
  },
  {
    name: 'Damascus Steel',
    icon: 'carpenter',
    active: false,
    route: '/category/damascus-steel'
  },
  {
    name: 'Beauty & Wellness',
    icon: 'spa',
    active: false,
    route: '/category/beauty-wellness'
  },
  {
    name: 'Textiles',
    icon: 'texture',
    active: false,
    route: '/category/textiles-fabrics'
  },
  {
    name: 'Food & Spices',
    icon: 'restaurant_menu',
    active: false,
    route: '/category/food-spices'
  },
  {
    name: 'Traditional Crafts',
    icon: 'handyman',
    active: false,
    route: '/category/traditional-crafts'
  },
  {
    name: 'Sweets',
    icon: 'cake',
    active: false,
    route: '/category/sweets-desserts'
  }
] as const;

/**
 * Helper function to get a quick navigation item by name
 * @param name - Navigation item name to search for (case-insensitive)
 * @returns Quick navigation item configuration or undefined if not found
 */
export function getQuickNavItemByName(name: string): QuickNavigationItemConfig | undefined {
  return QUICK_NAVIGATION_CONFIG.find(
    item => item.name.toLowerCase() === name.toLowerCase()
  );
}

/**
 * Helper function to get the default active navigation item
 * @returns The navigation item marked as active, or the first item if none active
 */
export function getDefaultActiveNavItem(): QuickNavigationItemConfig {
  return QUICK_NAVIGATION_CONFIG.find(item => item.active) || QUICK_NAVIGATION_CONFIG[0];
}

/**
 * Helper function to create a mutable copy of quick navigation config
 * @description Useful when component needs to update active states
 * @returns Mutable array of navigation items
 */
export function getQuickNavigationMutableCopy(): QuickNavigationItemConfig[] {
  return QUICK_NAVIGATION_CONFIG.map(item => ({ ...item }));
}

/**
 * Helper function to set active item and deactivate others
 * @param items - Array of navigation items to modify
 * @param activeName - Name of item to set as active
 * @returns Updated array with new active state
 */
export function setActiveQuickNavItem(
  items: QuickNavigationItemConfig[],
  activeName: string
): QuickNavigationItemConfig[] {
  return items.map(item => ({
    ...item,
    active: item.name.toLowerCase() === activeName.toLowerCase()
  }));
}
