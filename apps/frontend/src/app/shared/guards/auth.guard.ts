import { inject } from '@angular/core';
import { Router, CanActivateFn, UrlTree } from '@angular/router';
import { UserService } from '../services/user.service';

/**
 * Authentication Guard
 *
 * @description
 * Protects routes that require user authentication in the Syrian marketplace.
 * Redirects unauthenticated users to the login page while preserving the
 * intended destination for post-login navigation.
 *
 * Features:
 * - Signal-based authentication check using UserService
 * - Automatic redirect to login with return URL preservation
 * - Session validation on every route activation
 * - Support for both authenticated and guest users
 *
 * @example
 * ```typescript
 * // In app.routes.ts
 * {
 *   path: 'account',
 *   canActivate: [authGuard],
 *   loadChildren: () => import('./features/account/account.routes')
 * }
 *
 * {
 *   path: 'checkout',
 *   canActivate: [authGuard],
 *   loadComponent: () => import('./features/checkout/checkout.component')
 * }
 * ```
 *
 * @swagger
 * components:
 *   securitySchemes:
 *     UserAuth:
 *       type: http
 *       scheme: bearer
 *       description: User authentication guard for protected routes
 *
 *   schemas:
 *     AuthGuard:
 *       type: object
 *       description: Route guard for user authentication
 *       properties:
 *         canActivate:
 *           type: boolean
 *           description: Whether user can access the protected route
 *         redirectUrl:
 *           type: string
 *           description: URL to redirect unauthenticated users
 *           example: /login?returnUrl=/account/profile
 *
 * security:
 *   - UserAuth: []
 */
export const authGuard: CanActivateFn = (route, state): boolean | UrlTree => {
  const userService = inject(UserService);
  const router = inject(Router);

  // Check authentication status using signal
  const isAuthenticated = userService.isAuthenticated();

  if (isAuthenticated) {
    // User is authenticated, allow access
    return true;
  }

  // User is not authenticated, redirect to login with return URL
  const returnUrl = state.url;
  const loginUrl = router.createUrlTree(['/auth/login'], {
    queryParams: { returnUrl }
  });

  console.warn('[AuthGuard] Access denied. Redirecting to login...', {
    requestedUrl: returnUrl,
    isAuthenticated: false
  });

  return loginUrl;
};

/**
 * Guest Guard (Inverse Authentication Guard)
 *
 * @description
 * Protects routes that should only be accessible to non-authenticated users.
 * Redirects authenticated users to the account dashboard.
 * Useful for login, registration, and password reset pages.
 *
 * @example
 * ```typescript
 * // In app.routes.ts
 * {
 *   path: 'login',
 *   canActivate: [guestGuard],
 *   loadComponent: () => import('./features/auth/login.component')
 * }
 *
 * {
 *   path: 'register',
 *   canActivate: [guestGuard],
 *   loadComponent: () => import('./features/auth/register.component')
 * }
 * ```
 *
 * @swagger
 * components:
 *   schemas:
 *     GuestGuard:
 *       type: object
 *       description: Route guard for guest-only routes
 *       properties:
 *         canActivate:
 *           type: boolean
 *           description: Whether guest can access the route
 *         redirectUrl:
 *           type: string
 *           description: URL to redirect authenticated users
 *           example: /account/dashboard
 */
export const guestGuard: CanActivateFn = (route, state): boolean | UrlTree => {
  const userService = inject(UserService);
  const router = inject(Router);

  // Check authentication status using signal
  const isAuthenticated = userService.isAuthenticated();

  if (!isAuthenticated) {
    // User is not authenticated (guest), allow access
    return true;
  }

  // User is already authenticated, redirect to account dashboard
  const dashboardUrl = router.createUrlTree(['/account/dashboard']);

  console.info('[GuestGuard] User already authenticated. Redirecting to dashboard...', {
    requestedUrl: state.url,
    isAuthenticated: true
  });

  return dashboardUrl;
};

/**
 * Email Verified Guard
 *
 * @description
 * Ensures the user has verified their email address before accessing certain features.
 * Redirects users with unverified emails to the email verification page.
 *
 * @example
 * ```typescript
 * // In app.routes.ts
 * {
 *   path: 'account/addresses',
 *   canActivate: [authGuard, emailVerifiedGuard],
 *   loadComponent: () => import('./features/account/addresses.component')
 * }
 * ```
 *
 * @swagger
 * components:
 *   schemas:
 *     EmailVerifiedGuard:
 *       type: object
 *       description: Route guard for email verification requirement
 *       properties:
 *         canActivate:
 *           type: boolean
 *           description: Whether user's email is verified
 *         redirectUrl:
 *           type: string
 *           description: URL to redirect users with unverified emails
 *           example: /account/verify-email
 */
export const emailVerifiedGuard: CanActivateFn = (route, state): boolean | UrlTree => {
  const userService = inject(UserService);
  const router = inject(Router);

  // Check if user is authenticated first
  const isAuthenticated = userService.isAuthenticated();
  if (!isAuthenticated) {
    // Let authGuard handle this
    return router.createUrlTree(['/auth/login'], {
      queryParams: { returnUrl: state.url }
    });
  }

  // Check email verification status
  const currentUser = userService.currentUser();
  const isEmailVerified = currentUser?.isEmailVerified || false;

  if (isEmailVerified) {
    // Email is verified, allow access
    return true;
  }

  // Email not verified, redirect to verification page
  const verifyEmailUrl = router.createUrlTree(['/account/verify-email'], {
    queryParams: { returnUrl: state.url }
  });

  console.warn('[EmailVerifiedGuard] Email verification required. Redirecting...', {
    requestedUrl: state.url,
    userId: currentUser?.id,
    isEmailVerified: false
  });

  return verifyEmailUrl;
};

/**
 * Phone Verified Guard
 *
 * @description
 * Ensures the user has verified their phone number before accessing certain features.
 * Important for Syrian marketplace where phone verification is crucial for delivery.
 *
 * @example
 * ```typescript
 * // In app.routes.ts
 * {
 *   path: 'checkout',
 *   canActivate: [authGuard, phoneVerifiedGuard],
 *   loadComponent: () => import('./features/checkout/checkout.component')
 * }
 * ```
 *
 * @swagger
 * components:
 *   schemas:
 *     PhoneVerifiedGuard:
 *       type: object
 *       description: Route guard for phone verification requirement
 *       properties:
 *         canActivate:
 *           type: boolean
 *           description: Whether user's phone is verified
 *         redirectUrl:
 *           type: string
 *           description: URL to redirect users with unverified phones
 *           example: /account/verify-phone
 */
export const phoneVerifiedGuard: CanActivateFn = (route, state): boolean | UrlTree => {
  const userService = inject(UserService);
  const router = inject(Router);

  // Check if user is authenticated first
  const isAuthenticated = userService.isAuthenticated();
  if (!isAuthenticated) {
    // Let authGuard handle this
    return router.createUrlTree(['/auth/login'], {
      queryParams: { returnUrl: state.url }
    });
  }

  // Check phone verification status
  const currentUser = userService.currentUser();
  const isPhoneVerified = currentUser?.isPhoneVerified || false;

  if (isPhoneVerified) {
    // Phone is verified, allow access
    return true;
  }

  // Phone not verified, redirect to verification page
  const verifyPhoneUrl = router.createUrlTree(['/account/verify-phone'], {
    queryParams: { returnUrl: state.url }
  });

  console.warn('[PhoneVerifiedGuard] Phone verification required. Redirecting...', {
    requestedUrl: state.url,
    userId: currentUser?.id,
    isPhoneVerified: false
  });

  return verifyPhoneUrl;
};

/**
 * Membership Tier Guard Factory
 *
 * @description
 * Creates a guard that checks if user has a specific membership tier or higher.
 * Useful for protecting premium features in the Syrian marketplace loyalty program.
 *
 * Membership Tiers (in order):
 * - bronze: Basic tier (default for new users)
 * - silver: Mid-tier (spending >= 100,000 SYP)
 * - gold: High-tier (spending >= 500,000 SYP)
 * - platinum: Premium tier (spending >= 2,000,000 SYP)
 * - vip: Exclusive tier (by invitation or spending >= 10,000,000 SYP)
 *
 * @param requiredTier - Minimum required membership tier
 * @returns CanActivateFn guard function
 *
 * @example
 * ```typescript
 * // In app.routes.ts
 * {
 *   path: 'account/vip-lounge',
 *   canActivate: [authGuard, membershipTierGuard('platinum')],
 *   loadComponent: () => import('./features/account/vip-lounge.component')
 * }
 * ```
 *
 * @swagger
 * components:
 *   schemas:
 *     MembershipTierGuard:
 *       type: object
 *       description: Route guard for membership tier requirements
 *       properties:
 *         requiredTier:
 *           type: string
 *           enum: [bronze, silver, gold, platinum, vip]
 *         canActivate:
 *           type: boolean
 *         redirectUrl:
 *           type: string
 *           example: /account/membership
 */
export function membershipTierGuard(
  requiredTier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'vip'
): CanActivateFn {
  return (route, state): boolean | UrlTree => {
    const userService = inject(UserService);
    const router = inject(Router);

    // Check if user is authenticated first
    const isAuthenticated = userService.isAuthenticated();
    if (!isAuthenticated) {
      return router.createUrlTree(['/auth/login'], {
        queryParams: { returnUrl: state.url }
      });
    }

    // Define tier hierarchy
    const tierHierarchy: { [key: string]: number } = {
      'bronze': 1,
      'silver': 2,
      'gold': 3,
      'platinum': 4,
      'vip': 5
    };

    const currentUser = userService.currentUser();
    const userTier = currentUser?.membershipTier || 'bronze';
    const userTierLevel = tierHierarchy[userTier] || 1;
    const requiredTierLevel = tierHierarchy[requiredTier];

    if (userTierLevel >= requiredTierLevel) {
      // User has required tier or higher, allow access
      return true;
    }

    // User doesn't have required tier, redirect to membership page
    const membershipUrl = router.createUrlTree(['/account/membership'], {
      queryParams: {
        requiredTier,
        returnUrl: state.url
      }
    });

    console.warn('[MembershipTierGuard] Insufficient membership tier. Redirecting...', {
      requestedUrl: state.url,
      userId: currentUser?.id,
      userTier,
      requiredTier
    });

    return membershipUrl;
  };
}
