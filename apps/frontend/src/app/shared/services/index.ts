/**
 * @fileoverview Shared Services Index
 * @description Central export for all shared services in the Syrian marketplace
 * @swagger
 * components:
 *   schemas:
 *     SharedServices:
 *       type: object
 *       description: Collection of all shared services for Syrian marketplace
 */

// Import services first
import { CategoryService } from './category.service';
import { NavigationDataService } from './navigation-data.service';
import { MegaMenuDataService } from './mega-menu-data.service';
import { UserService } from './user.service';
import { WishlistService } from './wishlist.service';
import { ShareService } from './share.service';
import { ModalService } from './modal.service';

// Core services - re-export
export { CategoryService } from './category.service';
export { NavigationDataService } from './navigation-data.service';
export { MegaMenuDataService } from './mega-menu-data.service';
export { UserService } from './user.service';

// New services (Phase 1, Day 2-3)
export { WishlistService } from './wishlist.service';
export { ShareService } from './share.service';
export type { ShareData, ShareResult } from './share.service';
export { ModalService } from './modal.service';
export type { DialogData } from './modal.service';

// Note: ProductService and CartService have been migrated to Akita state management
// Import from: src/app/store/products/ and src/app/store/cart/

// Service array for easier imports and injection
export const SHARED_SERVICES = [
  CategoryService,
  NavigationDataService,
  MegaMenuDataService,
  UserService,
  WishlistService,
  ShareService,
  ModalService
] as const;

/**
 * Service provider configuration for dependency injection
 */
export const SHARED_SERVICE_PROVIDERS = [
  CategoryService,
  NavigationDataService,
  MegaMenuDataService,
  UserService,
  WishlistService,
  ShareService,
  ModalService
];

// Services are already exported above, no need for separate type exports