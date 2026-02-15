import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { GuestSessionService } from '../services/guest-session.service';

/**
 * @fileoverview Guest Session Route Guard
 * @description Ensures that a valid guest session exists before allowing access to routes.
 * Initializes a new session if none exists instead of blocking navigation.
 * @module GuestSessionGuard
 */

/**
 * @function guestSessionGuard
 * @description Route guard that ensures a valid guest session exists for cart and checkout flows.
 * If no session exists, it triggers session initialization and allows navigation to proceed.
 * This guard does NOT block navigation - it ensures sessions exist for guest users.
 *
 * Features:
 * - Validates guest session existence and expiry
 * - Initializes session if none exists (non-blocking)
 * - Works alongside authGuard for hybrid protection
 * - Supports guest-to-user cart migration
 *
 * Use Cases:
 * - Guest checkout flows
 * - Anonymous cart management
 * - Product browsing with session tracking
 * - Temporary wish lists for guests
 *
 * @example
 * ```typescript
 * // In app.routes.ts - Guest-only cart route
 * {
 *   path: 'cart',
 *   canActivate: [guestSessionGuard],
 *   loadComponent: () => import('./features/cart/cart.component')
 * }
 *
 * // Hybrid route - both guests and authenticated users
 * {
 *   path: 'checkout',
 *   canActivate: [guestSessionGuard], // Ensures session exists
 *   loadComponent: () => import('./features/checkout/checkout.component')
 * }
 * ```
 *
 * @returns {Observable<boolean>} Observable that emits true to allow navigation
 */
export const guestSessionGuard: CanActivateFn = () => {
  const guestSessionService = inject(GuestSessionService);
  const session = guestSessionService.getCurrentSession();

  if (session?.isValid) {
    // Session exists and is valid
    return true;
  }

  // Initialize session and allow navigation after
  return guestSessionService.initializeSession().pipe(
    map(() => true),
    catchError(() => of(true)) // Don't block navigation on session failure
  );
};
