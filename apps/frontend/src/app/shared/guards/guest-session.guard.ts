import { inject } from '@angular/core';
import { Router, CanActivateFn, UrlTree } from '@angular/router';
import { GuestSessionService } from '../../features/auth/services/guest-session.service';

/**
 * Guest Session Guard
 *
 * @description
 * Protects routes that require a valid guest session in the Syrian marketplace.
 * Redirects users with expired or missing sessions to the homepage where a new
 * session will be automatically initialized.
 *
 * Features:
 * - Signal-based session check using GuestSessionService
 * - Automatic redirect to homepage for session re-initialization
 * - Session expiry validation
 * - Support for guest shopping experiences (cart, wishlist, browsing)
 *
 * Use Cases:
 * - Guest checkout flows
 * - Guest cart management
 * - Guest wishlist access
 * - Any feature requiring session tracking without user authentication
 *
 * @example
 * ```typescript
 * // In app.routes.ts
 * {
 *   path: 'cart',
 *   canActivate: [guestSessionGuard],
 *   loadComponent: () => import('./features/cart/cart.component')
 * }
 *
 * {
 *   path: 'checkout/guest',
 *   canActivate: [guestSessionGuard],
 *   loadComponent: () => import('./features/checkout/guest-checkout.component')
 * }
 * ```
 *
 * @swagger
 * components:
 *   securitySchemes:
 *     GuestSession:
 *       type: apiKey
 *       in: cookie
 *       name: guest_session_id
 *       description: Guest session identifier stored in HttpOnly cookie
 *
 *   schemas:
 *     GuestSessionGuard:
 *       type: object
 *       description: Route guard for guest session validation
 *       properties:
 *         canActivate:
 *           type: boolean
 *           description: Whether guest has a valid session
 *         redirectUrl:
 *           type: string
 *           description: URL to redirect users without valid sessions
 *           example: /
 *
 * security:
 *   - GuestSession: []
 */
export const guestSessionGuard: CanActivateFn = (route, state): boolean | UrlTree => {
  const guestSessionService = inject(GuestSessionService);
  const router = inject(Router);

  // Check if guest session is active using computed signal
  const isSessionActive = guestSessionService.isSessionActive();

  if (isSessionActive) {
    // Guest session is valid and active, allow access
    return true;
  }

  // No valid guest session, redirect to homepage
  // The APP_INITIALIZER will create a new session automatically
  const homeUrl = router.createUrlTree(['/']);

  console.warn('[GuestSessionGuard] No valid guest session. Redirecting to homepage...', {
    requestedUrl: state.url,
    isSessionActive: false
  });

  return homeUrl;
};

/**
 * Authenticated or Guest Guard
 *
 * @description
 * Allows access to routes for both authenticated users AND valid guest sessions.
 * Useful for features like cart and wishlist that support both user types.
 * Redirects only if BOTH authentication and guest session are missing.
 *
 * @example
 * ```typescript
 * // In app.routes.ts
 * {
 *   path: 'cart',
 *   canActivate: [authenticatedOrGuestGuard],
 *   loadComponent: () => import('./features/cart/cart.component')
 * }
 * ```
 *
 * @swagger
 * components:
 *   schemas:
 *     AuthenticatedOrGuestGuard:
 *       type: object
 *       description: Route guard for authenticated users or valid guest sessions
 *       properties:
 *         canActivate:
 *           type: boolean
 *         redirectUrl:
 *           type: string
 *           example: /
 */
export const authenticatedOrGuestGuard: CanActivateFn = (route, state): boolean | UrlTree => {
  const guestSessionService = inject(GuestSessionService);
  const router = inject(Router);

  // Check guest session
  const hasGuestSession = guestSessionService.isSessionActive();

  // TODO: When user authentication is implemented, also check:
  // const userService = inject(UserService);
  // const isAuthenticated = userService.isAuthenticated();
  // if (isAuthenticated || hasGuestSession) { return true; }

  if (hasGuestSession) {
    // Either authenticated user OR valid guest session exists
    return true;
  }

  // No valid session of any kind, redirect to homepage
  const homeUrl = router.createUrlTree(['/']);

  console.warn('[AuthenticatedOrGuestGuard] No valid session. Redirecting to homepage...', {
    requestedUrl: state.url,
    hasGuestSession: false
  });

  return homeUrl;
};
