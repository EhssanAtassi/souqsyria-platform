/**
 * @fileoverview Authentication HTTP Interceptor
 * @description Functional HTTP interceptor that handles JWT token injection,
 * 401 response handling with automatic token refresh, and request queuing
 * during refresh operations. Replaces legacy apiInterceptor auth logic.
 * @module AuthInterceptor
 */

import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
  HttpEvent
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { TokenService } from '../services/token.service';
import { AuthActions } from '../store/auth.actions';

/**
 * @description Flag indicating if token refresh is currently in progress
 */
let isRefreshing = false;

/**
 * @description Subject that emits when token refresh completes successfully
 */
const refreshTokenSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

/**
 * @description Authentication HTTP Interceptor Function
 * Intercepts all HTTP requests to:
 * - Add JWT Bearer token from TokenService
 * - Add Content-Type and Accept headers for JSON
 * - Enable credentials for cart requests
 * - Handle 401 errors with automatic token refresh
 * - Queue and retry failed requests after successful refresh
 * @param {HttpRequest<unknown>} req - The outgoing HTTP request
 * @param {HttpHandlerFn} next - The next handler in the chain
 * @returns {Observable<HttpEvent<unknown>>} Observable of the HTTP event stream
 */
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const tokenService = inject(TokenService);
  const store = inject(Store);

  /**
   * @description Clone and modify the request with authentication headers
   * @param {HttpRequest<unknown>} request - Original request
   * @param {string | null} token - JWT token to attach
   * @returns {HttpRequest<unknown>} Cloned request with headers
   */
  const addAuthHeaders = (
    request: HttpRequest<unknown>,
    token: string | null
  ): HttpRequest<unknown> => {
    const headers: { [key: string]: string } = {
      'Accept': 'application/json',
    };

    // Only set Content-Type for non-FormData requests to allow
    // the browser to set the multipart boundary automatically
    if (!(request.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Enable credentials for cart and guest-session requests to send HTTP-only cookie
    const needsCredentials = request.url.includes('/cart') || request.url.includes('/guest-session');

    const clonedRequest = request.clone({
      setHeaders: headers,
      withCredentials: needsCredentials
    });

    // Log in development mode
    if (!window.location.href.includes('production')) {
      console.log(`[AuthInterceptor] ${request.method} ${request.url}`, {
        hasToken: !!token,
        withCredentials: clonedRequest.withCredentials,
        headers: clonedRequest.headers.keys()
      });
    }

    return clonedRequest;
  };

  /**
   * @description Handle 401 Unauthorized errors with token refresh
   * @param {HttpErrorResponse} error - The HTTP error response
   * @returns {Observable<HttpEvent<unknown>>} Observable that retries or throws error
   */
  const handle401Error = (
    error: HttpErrorResponse
  ): Observable<HttpEvent<unknown>> => {
    const isAuthRequest = req.url.includes('/auth/refresh-token') || req.url.includes('/auth/login');

    // Pass through auth endpoint errors without refresh attempt
    if (isAuthRequest) {
      if (!window.location.href.includes('production')) {
        console.log('[AuthInterceptor] Auth endpoint error, passing through:', req.url);
      }
      return throwError(() => error);
    }

    // Start token refresh process
    if (!isRefreshing) {
      isRefreshing = true;
      refreshTokenSubject.next(false);

      if (!window.location.href.includes('production')) {
        console.log('[AuthInterceptor] Token refresh initiated');
      }

      // Dispatch refresh action (do NOT clear tokens — the effect needs the refresh token)
      store.dispatch(AuthActions.refreshToken());

      // Wait for refresh to complete
      return refreshTokenSubject.pipe(
        filter(refreshed => refreshed === true),
        take(1),
        switchMap(() => {
          isRefreshing = false;
          const newToken = tokenService.getAccessToken();

          if (!window.location.href.includes('production')) {
            console.log('[AuthInterceptor] Token refreshed, retrying request');
          }

          // Retry original request with new token
          return next(addAuthHeaders(req, newToken));
        }),
        catchError(refreshError => {
          isRefreshing = false;
          refreshTokenSubject.next(false);

          if (!window.location.href.includes('production')) {
            console.error('[AuthInterceptor] Token refresh failed, logging out');
          }

          // Logout on refresh failure
          store.dispatch(AuthActions.logout());
          return throwError(() => refreshError);
        })
      );
    } else {
      // Queue request until refresh completes
      if (!window.location.href.includes('production')) {
        console.log('[AuthInterceptor] Request queued, waiting for token refresh');
      }

      return refreshTokenSubject.pipe(
        filter(refreshed => refreshed === true),
        take(1),
        switchMap(() => {
          const newToken = tokenService.getAccessToken();
          return next(addAuthHeaders(req, newToken));
        })
      );
    }
  };

  // Get current token
  const token = tokenService.getAccessToken();

  // H3 fix: Proactive token refresh when token expires within 2 minutes
  const isAuthRequest = req.url.includes('/auth/refresh-token') || req.url.includes('/auth/login');
  if (token && !isAuthRequest && !isRefreshing && tokenService.isTokenExpired(120)) {
    // Token is about to expire — trigger silent refresh
    isRefreshing = true;
    refreshTokenSubject.next(false);

    if (!window.location.href.includes('production')) {
      console.log('[AuthInterceptor] Proactive token refresh — token expires within 2 minutes');
    }

    store.dispatch(AuthActions.refreshToken());

    // Wait for refresh to complete, then send request with new token
    return refreshTokenSubject.pipe(
      filter(refreshed => refreshed === true),
      take(1),
      switchMap(() => {
        isRefreshing = false;
        const newToken = tokenService.getAccessToken();
        return next(addAuthHeaders(req, newToken)).pipe(
          catchError((error: HttpErrorResponse) => {
            if (error.status === 401) {
              return handle401Error(error);
            }
            return throwError(() => error);
          })
        );
      }),
      catchError(() => {
        isRefreshing = false;
        // Fallback: send with current token if refresh fails
        return next(addAuthHeaders(req, token)).pipe(
          catchError((error: HttpErrorResponse) => {
            if (error.status === 401) {
              return handle401Error(error);
            }
            return throwError(() => error);
          })
        );
      })
    );
  }

  // Add auth headers to request
  const authReq = addAuthHeaders(req, token);

  // Handle response and errors
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        return handle401Error(error);
      }

      // Log non-401 errors in development
      if (!window.location.href.includes('production')) {
        console.error(`[AuthInterceptor] HTTP Error ${error.status}:`, error.message);
      }

      return throwError(() => error);
    })
  );
};

/**
 * @description Notify that token refresh completed successfully
 * Call this from auth effects after successful token refresh
 * @param {boolean} success - Whether refresh was successful
 * @returns {void}
 */
export const notifyTokenRefreshed = (success: boolean): void => {
  refreshTokenSubject.next(success);
  if (success) {
    isRefreshing = false;
  }
};
