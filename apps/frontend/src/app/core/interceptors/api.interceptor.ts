import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

/**
 * API HTTP Interceptor
 *
 * Handles:
 * - Adding JWT authentication tokens to requests
 * - Global error handling
 * - Request/response logging in development
 *
 * @swagger
 * description: HTTP interceptor for API requests to NestJS backend
 */
export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  // Get JWT token from localStorage (if exists)
  const token = localStorage.getItem('auth_token');

  // Clone request and add authorization header if token exists
  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // Add default headers and enable credentials for cart API (guest session cookies)
  const headers: any = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  // Enable credentials (cookies) for cart API requests to include guest_session_id
  const withCredentials = req.url.includes('/cart');

  authReq = authReq.clone({
    setHeaders: headers,
    withCredentials: withCredentials
  });

  // Log request in development
  if (!window.location.href.includes('production')) {
    console.log('[HTTP]', authReq.method, authReq.url);
  }

  // Handle response and errors
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An error occurred';

      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = `Error: ${error.error.message}`;
      } else {
        // Server-side error
        switch (error.status) {
          case 0:
            errorMessage = 'Network error - Unable to connect to server. Please check if backend is running on http://localhost:3000';
            break;
          case 400:
            errorMessage = error.error?.message || 'Bad request';
            break;
          case 401:
            errorMessage = 'Unauthorized - Please login';
            // Clear invalid token
            localStorage.removeItem('auth_token');
            break;
          case 403:
            errorMessage = 'Forbidden - You don\'t have permission';
            break;
          case 404:
            errorMessage = error.error?.message || 'Resource not found';
            break;
          case 500:
            errorMessage = 'Server error - Please try again later';
            break;
          default:
            errorMessage = error.error?.message || `HTTP Error ${error.status}`;
        }
      }

      // Log error in development
      console.error('[HTTP Error]', error.status, errorMessage, error);

      return throwError(() => new Error(errorMessage));
    })
  );
};
