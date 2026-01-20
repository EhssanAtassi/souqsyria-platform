/**
 * @fileoverview Guards Index
 * @description Central export for all route guards in the Syrian marketplace
 * @swagger
 * components:
 *   schemas:
 *     Guards:
 *       type: object
 *       description: Collection of all route guards for Syrian marketplace
 */

// Authentication Guards
export {
  authGuard,
  guestGuard,
  emailVerifiedGuard,
  phoneVerifiedGuard,
  membershipTierGuard
} from './auth.guard';

// Admin Guards
export { adminGuard } from './admin.guard';

// Form Guards
export {
  unsavedChangesGuard,
  ComponentCanDeactivate,
  createBeforeunloadHandler,
  DirtyFormTracker,
  AsyncDataTracker
} from './unsaved-changes.guard';

/**
 * Guard provider array for easier imports and injection
 */
export const GUARDS = [
  // Note: Functional guards don't need to be provided
  // They are used directly in routes with canActivate/canDeactivate
] as const;
