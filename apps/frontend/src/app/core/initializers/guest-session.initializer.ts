/**
 * @fileoverview Guest Session APP_INITIALIZER
 * @description Factory function that initializes guest sessions on application bootstrap.
 * Ensures every user (authenticated or not) has a valid session before the app fully loads.
 * This enables cart, wishlist, and browsing tracking for all users.
 * @module GuestSessionInitializer
 */

import { inject } from '@angular/core';
import { GuestSessionService } from '../../features/auth/services/guest-session.service';
import { Observable, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';

/**
 * @function initializeGuestSession
 * @description APP_INITIALIZER factory that creates or validates guest session on app bootstrap.
 * Angular will wait for the returned Promise/Observable to complete before finishing app initialization.
 * @returns {() => Observable<void>} Factory function that returns an Observable
 *
 * @example
 * ```typescript
 * // In app.config.ts
 * import { APP_INITIALIZER } from '@angular/core';
 * import { initializeGuestSession } from './core/initializers/guest-session.initializer';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     // ... other providers
 *     {
 *       provide: APP_INITIALIZER,
 *       useFactory: initializeGuestSession,
 *       multi: true
 *     }
 *   ]
 * };
 * ```
 *
 * @swagger
 * components:
 *   schemas:
 *     GuestSessionInitializer:
 *       type: object
 *       description: APP_INITIALIZER for guest session bootstrap
 *       properties:
 *         timing:
 *           type: string
 *           description: When initialization occurs
 *           example: "On app bootstrap, before components render"
 *         behavior:
 *           type: string
 *           description: What happens during initialization
 *           example: "Validates existing session or creates new one"
 */
export function initializeGuestSession(): () => Observable<void> {
  return () => {
    const guestSessionService = inject(GuestSessionService);

    console.log('[GuestSessionInitializer] Starting guest session initialization...');

    return guestSessionService.initializeSession().pipe(
      tap(session => {
        console.log('[GuestSessionInitializer] Guest session initialized:', {
          sessionUUID: session.sessionUUID,
          expiresAt: session.expiresAt
        });
      }),
      catchError(error => {
        console.error('[GuestSessionInitializer] Failed to initialize guest session:', error);
        // Don't block app initialization on guest session failure
        // The user can still browse, and session will be created on first cart/wishlist action
        return of(undefined);
      }),
      // Convert to void for APP_INITIALIZER compatibility
      map(() => undefined)
    );
  };
}

/**
 * @constant GUEST_SESSION_INITIALIZER_PROVIDER
 * @description Pre-configured provider object for guest session initialization.
 * Use this constant to easily add the initializer to app.config.ts providers array.
 *
 * @example
 * ```typescript
 * // In app.config.ts
 * import { GUEST_SESSION_INITIALIZER_PROVIDER } from './core/initializers/guest-session.initializer';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     // ... other providers
 *     GUEST_SESSION_INITIALIZER_PROVIDER
 *   ]
 * };
 * ```
 */
export const GUEST_SESSION_INITIALIZER_PROVIDER = {
  provide: 'APP_INITIALIZER',
  useFactory: initializeGuestSession,
  multi: true
};
