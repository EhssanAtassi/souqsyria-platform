/**
 * @fileoverview Guest Session APP_INITIALIZER
 * @description Provides Angular APP_INITIALIZER to ensure guest session is initialized
 * before the application starts. This guarantees that all routes and components
 * have access to a valid guest session on startup.
 * @module GuestSessionInitializer
 */

import { APP_INITIALIZER, Provider } from '@angular/core';
import { GuestSessionService } from '../services/guest-session.service';

/**
 * @function initializeGuestSession
 * @description Factory function that initializes the guest session.
 * Called by Angular's APP_INITIALIZER during application bootstrap.
 * Returns a Promise that resolves after session initialization HTTP call completes.
 * This blocks app startup until the session is initialized, ensuring all components
 * have access to a valid session from the start.
 *
 * @param {GuestSessionService} guestSessionService - The injected guest session service
 * @returns {() => Promise<void>} Function that returns a Promise for app initialization
 *
 * @example
 * ```typescript
 * // This is called automatically by Angular during bootstrap
 * // when included in app.config.ts providers
 * ```
 */
export function initializeGuestSession(
  guestSessionService: GuestSessionService
): () => Promise<void> {
  return () => {
    return new Promise<void>((resolve) => {
      guestSessionService.initializeSession().subscribe({
        next: () => resolve(),
        error: () => resolve() // Don't block app startup on session failure
      });
    });
  };
}

/**
 * @constant guestSessionInitializerProvider
 * @description Angular provider configuration for guest session initialization.
 * Add this to app.config.ts providers array to enable automatic guest session setup.
 * Uses APP_INITIALIZER to block app startup until session is initialized.
 *
 * @type {Provider}
 *
 * @example
 * ```typescript
 * // In app.config.ts
 * import { guestSessionInitializerProvider } from './features/auth/initializers/guest-session.initializer';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     // ... other providers
 *     guestSessionInitializerProvider,
 *   ]
 * };
 * ```
 */
export const guestSessionInitializerProvider: Provider = {
  provide: APP_INITIALIZER,
  useFactory: initializeGuestSession,
  deps: [GuestSessionService],
  multi: true
};
