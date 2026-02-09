/**
 * NgRx Auth Effects for SouqSyria marketplace
 *
 * @description Functional NgRx effects handling all authentication side effects.
 * Uses the Angular 18 inject-based createEffect pattern (functional: true).
 * Each effect listens for a specific action, performs async work via
 * AuthApiService/TokenService/Router, and dispatches success or failure actions.
 *
 * @swagger
 * components:
 *   schemas:
 *     AuthEffects:
 *       type: object
 *       description: NgRx side-effect handlers for auth feature
 */

import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import {
  catchError,
  exhaustMap,
  map,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { AuthUser } from '../models/auth.models';
import { AuthApiService } from '../services/auth-api.service';
import { TokenService } from '../services/token.service';
import { notifyTokenRefreshed } from '../interceptors/auth.interceptor';
import { AuthActions } from './auth.actions';
import { CartSessionService } from '../../../store/cart/cart-session.service';
import { CartSyncService } from '../../../store/cart/cart-sync.service';

// ─── Login ────────────────────────────────────────────────────────

/**
 * Login effect
 *
 * @description Calls AuthApiService.login() with email/password credentials.
 * On success, stores the access token via TokenService and dispatches
 * loginSuccess. On failure, extracts the error message and dispatches
 * loginFailure.
 */
export const login$ = createEffect(
  (
    actions$ = inject(Actions),
    authApiService = inject(AuthApiService),
    tokenService = inject(TokenService),
  ) =>
    actions$.pipe(
      ofType(AuthActions.login),
      exhaustMap(({ email, password, rememberMe }) =>
        authApiService.login({ email, password, rememberMe }).pipe(
          map((response) => {
            tokenService.setTokens(response.accessToken, response.refreshToken);
            tokenService.setRememberMe(rememberMe);
            return AuthActions.loginSuccess({
              accessToken: response.accessToken,
            });
          }),
          catchError((error) => {
            const body = error.error;
            return of(
              AuthActions.loginFailure({
                error: body?.message || error.message || 'Login failed',
                errorCode: body?.errorCode,
                remainingAttempts: body?.remainingAttempts,
                lockedUntilMinutes: body?.lockedUntilMinutes,
              }),
            );
          }),
        ),
      ),
    ),
  { functional: true },
);

// ─── Cart Merge on Login ────────────────────────────────────────

/**
 * Merge guest cart into authenticated user cart after login
 *
 * @description After successful login, checks for an existing guest session
 * and merges the guest cart into the authenticated user's cart.
 * Fire-and-forget: errors are logged but don't affect the login flow.
 */
export const mergeGuestCartOnLogin$ = createEffect(
  (
    actions$ = inject(Actions),
    tokenService = inject(TokenService),
    cartSessionService = inject(CartSessionService),
    cartSyncService = inject(CartSyncService),
  ) =>
    actions$.pipe(
      ofType(AuthActions.loginSuccess),
      tap(() => {
        const sessionId = cartSessionService.getSessionId();
        if (!sessionId) {
          return;
        }

        const token = tokenService.getAccessToken();
        const payload = token ? tokenService.decodeToken(token) : null;
        const userId = payload?.['sub'] || '';

        if (!userId) {
          return;
        }

        cartSyncService.mergeGuestCart(userId, sessionId).subscribe({
          next: () => {
            cartSessionService.clearCachedSession();
            console.log('[Auth] Guest cart merged successfully after login');
          },
          error: (err) => {
            console.error('[Auth] Failed to merge guest cart (non-blocking):', err);
          },
        });
      }),
    ),
  { functional: true, dispatch: false },
);

// ─── Login Success Navigation ─────────────────────────────────────

/**
 * Login success navigation effect
 *
 * @description After successful login, navigates the user to the stored
 * returnUrl query parameter (if present) or to the home page '/'.
 * This is a non-dispatching effect (dispatch: false).
 */
/**
 * Login success: populate user from JWT and navigate
 *
 * @description After successful login, dispatches loadUserFromToken to
 * decode the JWT and populate the user in NgRx state, then navigates
 * to the returnUrl or home page.
 */
export const loginSuccess$ = createEffect(
  (
    actions$ = inject(Actions),
    router = inject(Router),
    store = inject(Store),
  ) =>
    actions$.pipe(
      ofType(AuthActions.loginSuccess),
      tap(() => {
        // Populate user data from the JWT before navigating
        store.dispatch(AuthActions.loadUserFromToken());
        const returnUrl =
          router.routerState.snapshot.root.queryParams['returnUrl'] || '/';
        router.navigateByUrl(returnUrl);
      }),
    ),
  { functional: true, dispatch: false },
);

// ─── Register ─────────────────────────────────────────────────────

/**
 * Register effect
 *
 * @description Calls AuthApiService.register() with email/password.
 * On success, stores both access and refresh tokens via TokenService
 * and dispatches registerSuccess with user data and tokens.
 * On failure, dispatches registerFailure with the error message.
 */
export const register$ = createEffect(
  (
    actions$ = inject(Actions),
    authApiService = inject(AuthApiService),
    tokenService = inject(TokenService),
  ) =>
    actions$.pipe(
      ofType(AuthActions.register),
      exhaustMap(({ email, password, fullName }) =>
        authApiService.register({ email, password, fullName }).pipe(
          map((response) => {
            tokenService.setTokens(response.accessToken, response.refreshToken);
            return AuthActions.registerSuccess({
              user: response.user,
              accessToken: response.accessToken,
              refreshToken: response.refreshToken,
            });
          }),
          catchError((error) =>
            of(
              AuthActions.registerFailure({
                error:
                  error.error?.message ||
                  error.message ||
                  'Registration failed',
              }),
            ),
          ),
        ),
      ),
    ),
  { functional: true },
);

// ─── Register Success Navigation ──────────────────────────────────

/**
 * Register success navigation effect
 *
 * @description After successful registration, navigates the user to
 * the OTP verification page. The OTP email is stored in NgRx state
 * by the reducer so the verify-otp component can read it.
 * Non-dispatching effect.
 */
export const registerSuccess$ = createEffect(
  (actions$ = inject(Actions), router = inject(Router)) =>
    actions$.pipe(
      ofType(AuthActions.registerSuccess),
      tap(() => {
        router.navigate(['/auth/verify-otp']);
      }),
    ),
  { functional: true, dispatch: false },
);

// ─── Verify OTP ───────────────────────────────────────────────────

/**
 * Verify OTP effect
 *
 * @description Calls AuthApiService.verifyOtp() with the email and OTP code.
 * On success, dispatches verifyOtpSuccess. On failure, dispatches
 * verifyOtpFailure with the error message.
 */
export const verifyOtp$ = createEffect(
  (
    actions$ = inject(Actions),
    authApiService = inject(AuthApiService),
  ) =>
    actions$.pipe(
      ofType(AuthActions.verifyOtp),
      exhaustMap(({ email, otpCode }) =>
        authApiService.verifyOtp({ email, otpCode }).pipe(
          map(() => AuthActions.verifyOtpSuccess()),
          catchError((error) =>
            of(
              AuthActions.verifyOtpFailure({
                error:
                  error.error?.message ||
                  error.message ||
                  'OTP verification failed',
              }),
            ),
          ),
        ),
      ),
    ),
  { functional: true },
);

// ─── Verify OTP Success Navigation ───────────────────────────────

/**
 * Verify OTP success navigation effect
 *
 * @description After successful OTP verification, navigates the user
 * to the login page with a queryParam indicating verification success.
 * Non-dispatching effect.
 */
export const verifyOtpSuccess$ = createEffect(
  (actions$ = inject(Actions), router = inject(Router)) =>
    actions$.pipe(
      ofType(AuthActions.verifyOtpSuccess),
      tap(() => {
        router.navigate(['/auth/login'], {
          queryParams: { verified: true },
        });
      }),
    ),
  { functional: true, dispatch: false },
);

// ─── Resend OTP ───────────────────────────────────────────────────

/**
 * Resend OTP effect
 *
 * @description Calls AuthApiService.resendOtp() with the user's email.
 * On success, dispatches resendOtpSuccess. On failure, dispatches
 * resendOtpFailure with the error message.
 */
export const resendOtp$ = createEffect(
  (
    actions$ = inject(Actions),
    authApiService = inject(AuthApiService),
  ) =>
    actions$.pipe(
      ofType(AuthActions.resendOtp),
      exhaustMap(({ email }) =>
        authApiService.resendOtp({ email }).pipe(
          map(() => AuthActions.resendOtpSuccess()),
          catchError((error) =>
            of(
              AuthActions.resendOtpFailure({
                error:
                  error.error?.message ||
                  error.message ||
                  'Failed to resend OTP',
              }),
            ),
          ),
        ),
      ),
    ),
  { functional: true },
);

// ─── Forgot Password ─────────────────────────────────────────────

/**
 * Forgot password effect
 *
 * @description Calls AuthApiService.forgotPassword() with the user's email.
 * On success, dispatches forgotPasswordSuccess. On failure, dispatches
 * forgotPasswordFailure with the error message.
 */
export const forgotPassword$ = createEffect(
  (
    actions$ = inject(Actions),
    authApiService = inject(AuthApiService),
  ) =>
    actions$.pipe(
      ofType(AuthActions.forgotPassword),
      exhaustMap(({ email }) =>
        authApiService.forgotPassword({ email }).pipe(
          map(() => AuthActions.forgotPasswordSuccess()),
          catchError((error) =>
            of(
              AuthActions.forgotPasswordFailure({
                error:
                  error.error?.message ||
                  error.message ||
                  'Failed to send reset email',
              }),
            ),
          ),
        ),
      ),
    ),
  { functional: true },
);

// ─── Reset Password ──────────────────────────────────────────────

/**
 * Reset password effect
 *
 * @description Calls AuthApiService.resetPassword() with the reset token
 * and new password. On success, dispatches resetPasswordSuccess. On failure,
 * dispatches resetPasswordFailure with the error message.
 */
export const resetPassword$ = createEffect(
  (
    actions$ = inject(Actions),
    authApiService = inject(AuthApiService),
  ) =>
    actions$.pipe(
      ofType(AuthActions.resetPassword),
      exhaustMap(({ resetToken, newPassword }) =>
        authApiService.resetPassword({ resetToken, newPassword }).pipe(
          map(() => AuthActions.resetPasswordSuccess()),
          catchError((error) =>
            of(
              AuthActions.resetPasswordFailure({
                error:
                  error.error?.message ||
                  error.message ||
                  'Failed to reset password',
              }),
            ),
          ),
        ),
      ),
    ),
  { functional: true },
);

// ─── Reset Password Success Navigation ───────────────────────────

/**
 * Reset password success navigation effect
 *
 * @description After successful password reset, navigates the user
 * to the login page with a queryParam indicating the password was reset.
 * Non-dispatching effect.
 */
export const resetPasswordSuccess$ = createEffect(
  (actions$ = inject(Actions), router = inject(Router)) =>
    actions$.pipe(
      ofType(AuthActions.resetPasswordSuccess),
      tap(() => {
        router.navigate(['/auth/login'], {
          queryParams: { passwordReset: true },
        });
      }),
    ),
  { functional: true, dispatch: false },
);

// ─── Refresh Token ────────────────────────────────────────────────

/**
 * Refresh token effect
 *
 * @description Reads the current access token from TokenService and calls
 * AuthApiService.refreshToken(). On success, stores the new access token
 * and dispatches refreshTokenSuccess. On failure, dispatches
 * refreshTokenFailure.
 */
export const refreshToken$ = createEffect(
  (
    actions$ = inject(Actions),
    authApiService = inject(AuthApiService),
    tokenService = inject(TokenService),
  ) =>
    actions$.pipe(
      ofType(AuthActions.refreshToken),
      switchMap(() => {
        const token = tokenService.getRefreshToken();
        if (!token) {
          return of(
            AuthActions.refreshTokenFailure({
              error: 'No refresh token available',
            }),
          );
        }
        return authApiService.refreshToken({ token }).pipe(
          map((response) => {
            /** Store both new access token and rotated refresh token */
            tokenService.setTokens(response.accessToken, response.refreshToken);
            return AuthActions.refreshTokenSuccess({
              accessToken: response.accessToken,
            });
          }),
          catchError((error) =>
            of(
              AuthActions.refreshTokenFailure({
                error:
                  error.error?.message ||
                  error.message ||
                  'Token refresh failed',
              }),
            ),
          ),
        );
      }),
    ),
  { functional: true },
);

// ─── Refresh Token → Interceptor Bridge ──────────────────────────

/**
 * Notify interceptor after token refresh completes
 *
 * @description Bridges NgRx refresh actions back to the HTTP interceptor's
 * BehaviorSubject. On refreshTokenSuccess, signals the interceptor to
 * release queued requests with the new token. On refreshTokenFailure,
 * signals failure so queued requests can propagate the error.
 * Non-dispatching effect.
 */
export const refreshTokenBridgeSuccess$ = createEffect(
  (actions$ = inject(Actions)) =>
    actions$.pipe(
      ofType(AuthActions.refreshTokenSuccess),
      tap(() => {
        notifyTokenRefreshed(true);
      }),
    ),
  { functional: true, dispatch: false },
);

/**
 * Notify interceptor after token refresh fails
 *
 * @description Signals the interceptor's BehaviorSubject with false
 * so queued requests can propagate the refresh failure error
 * instead of hanging indefinitely. Non-dispatching effect.
 */
export const refreshTokenBridgeFailure$ = createEffect(
  (actions$ = inject(Actions)) =>
    actions$.pipe(
      ofType(AuthActions.refreshTokenFailure),
      tap(() => {
        notifyTokenRefreshed(false);
      }),
    ),
  { functional: true, dispatch: false },
);

// ─── Logout ───────────────────────────────────────────────────────

/**
 * Logout effect
 *
 * @description Calls AuthApiService.logout() to invalidate the session
 * server-side. Regardless of the server response (success or error),
 * always clears tokens client-side and dispatches logoutSuccess.
 * This ensures the user is always logged out locally even if the
 * server is unreachable.
 */
export const logout$ = createEffect(
  (
    actions$ = inject(Actions),
    authApiService = inject(AuthApiService),
    tokenService = inject(TokenService),
  ) =>
    actions$.pipe(
      ofType(AuthActions.logout),
      exhaustMap(() =>
        authApiService.logout({}).pipe(
          map(() => {
            tokenService.clearTokens();
            return AuthActions.logoutSuccess();
          }),
          catchError(() => {
            tokenService.clearTokens();
            return of(AuthActions.logoutSuccess());
          }),
        ),
      ),
    ),
  { functional: true },
);

// ─── Logout Success Navigation ────────────────────────────────────

/**
 * Logout success navigation effect
 *
 * @description After successful logout (tokens cleared), navigates
 * the user to the home page '/'. Non-dispatching effect.
 */
export const logoutSuccess$ = createEffect(
  (actions$ = inject(Actions), router = inject(Router)) =>
    actions$.pipe(
      ofType(AuthActions.logoutSuccess),
      tap(() => {
        router.navigateByUrl('/');
      }),
    ),
  { functional: true, dispatch: false },
);

// ─── Load User From Token ─────────────────────────────────────────

/**
 * Load user from token effect
 *
 * @description Checks if a valid (non-expired) JWT access token exists
 * in localStorage via TokenService. If found, decodes the token payload
 * to extract user information (sub, email, role) and dispatches
 * loadUserFromTokenSuccess with a partial AuthUser object.
 * If no valid token is found, dispatches loadUserFromTokenFailure.
 */
export const loadUserFromToken$ = createEffect(
  (
    actions$ = inject(Actions),
    tokenService = inject(TokenService),
  ) =>
    actions$.pipe(
      ofType(AuthActions.loadUserFromToken),
      map(() => {
        const token = tokenService.getAccessToken();

        if (!token || tokenService.isTokenExpired()) {
          return AuthActions.loadUserFromTokenFailure();
        }

        const payload = tokenService.decodeToken(token);

        if (!payload) {
          return AuthActions.loadUserFromTokenFailure();
        }

        /**
         * Build a partial AuthUser from the JWT payload claims.
         * The backend JWT includes: sub (user id), email, role.
         */
        const user: AuthUser = {
          id: payload['sub'],
          email: payload['email'] || '',
          role: payload['role'] || 'customer',
          fullName: payload['fullName'] || null,
          phone: null,
          isVerified: payload['isVerified'] ?? false,
          isBanned: false,
          isSuspended: false,
          lastLoginAt: null,
          createdAt: new Date(),
        };

        return AuthActions.loadUserFromTokenSuccess({
          user,
          accessToken: token,
        });
      }),
    ),
  { functional: true },
);
