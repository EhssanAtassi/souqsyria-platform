/**
 * Mock Data System - Central Export
 *
 * Barrel export for the unified Syrian marketplace mock data system
 * Provides easy imports for all factories, configs, data, and services
 *
 * @fileoverview Central export for mock data system
 * @description Single import point for all mock data functionality
 *
 * @example
 * // Import everything
 * import { ProductFactory, syrianColors, MockDataService } from '@core/mock-data';
 *
 * // Or import specific items
 * import { ProductFactory } from '@core/mock-data';
 * import { syrianColors } from '@core/mock-data';
 */

// ==========================================
// CONFIGURATION EXPORTS
// ==========================================

export * from './config/syrian-colors.config';
export * from './config/design-tokens.config';
export * from './config/category-themes.config';

// ==========================================
// FACTORY EXPORTS
// ==========================================

export * from './factories/base.factory';
export * from './factories/product.factory';
export * from './factories/seller.factory';
export * from './factories/category.factory';
export * from './factories/campaign.factory';

// ==========================================
// DATA EXPORTS
// ==========================================

export * from './data/syrian-products.data';
export * from './data/syrian-sellers.data';
export * from './data/syrian-categories.data';
export * from './data/syrian-regions.data';

// ==========================================
// SERVICE EXPORTS
// ==========================================

export * from './mock-data.service';

// ==========================================
// CONVENIENCE RE-EXPORTS
// ==========================================

/**
 * Quick access to commonly used factories
 */
export { BaseFactory } from './factories/base.factory';
export { ProductFactory } from './factories/product.factory';
export { SellerFactory } from './factories/seller.factory';
export { CategoryFactory } from './factories/category.factory';
export { CampaignFactory } from './factories/campaign.factory';

/**
 * Quick access to color and design configs
 */
export { syrianColors } from './config/syrian-colors.config';
export { designTokens } from './config/design-tokens.config';
export { categoryThemes } from './config/category-themes.config';

/**
 * Quick access to mock data service
 */
export { MockDataService } from './mock-data.service';
