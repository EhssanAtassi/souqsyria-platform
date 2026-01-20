/**
 * @fileoverview Shared Module Index
 * @description Main barrel export for the entire shared module in Syrian marketplace
 * @swagger
 * components:
 *   schemas:
 *     SharedModule:
 *       type: object
 *       description: Central export for all shared functionality in Syrian marketplace
 */

// Import dependencies first
import { SHARED_COMPONENT_IMPORTS } from './components';
import { SHARED_SERVICE_PROVIDERS } from './services';

// Components
export * from './components';

// Services
export * from './services';

// Interfaces
export * from './interfaces';

// Data
export * from './data/syrian-categories.data';

/**
 * Enterprise-grade shared module utilities
 * Provides centralized access to all shared functionality
 */
export class SharedModule {
  /**
   * Returns all shared component imports for feature modules
   */
  static get componentImports() {
    return SHARED_COMPONENT_IMPORTS;
  }

  /**
   * Returns all shared service providers for dependency injection
   */
  static get serviceProviders() {
    return SHARED_SERVICE_PROVIDERS;
  }
}