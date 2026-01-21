/**
 * @file admin-api.service.ts
 * @description Base HTTP service for admin dashboard API communication.
 *              Provides common functionality including authentication headers,
 *              error transformation, and request/response handling.
 * @module AdminDashboard/Services
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
import { AdminAuthService } from '../../../shared/services/admin-auth.service';
import { PaginatedResponse, PaginationQuery } from '../interfaces';

/**
 * API error response structure
 * @description Standard error response from the backend
 */
export interface ApiError {
  /** HTTP status code */
  statusCode: number;
  /** Error message */
  message: string;
  /** Error code for programmatic handling */
  error?: string;
  /** Field-specific validation errors */
  validationErrors?: Record<string, string[]>;
  /** Timestamp of the error */
  timestamp?: string;
}

/**
 * Request options for API calls
 * @description Configuration options for HTTP requests
 */
export interface RequestOptions {
  /** Additional HTTP headers */
  headers?: Record<string, string>;
  /** Whether to include authentication token */
  authenticated?: boolean;
  /** Response type */
  responseType?: 'json' | 'blob' | 'text';
}

/**
 * Base Admin API Service
 * @description Provides HTTP communication layer for all admin dashboard API calls.
 *              Handles authentication, error transformation, and common request patterns.
 *
 * @example
 * ```typescript
 * // In a derived service
 * this.adminApi.get<UserListItem[]>('users').subscribe(users => {
 *   console.log('Users:', users);
 * });
 *
 * // With query parameters
 * this.adminApi.get<PaginatedResponse<UserListItem>>('users', {
 *   page: 1,
 *   limit: 20,
 *   status: 'active'
 * }).subscribe(response => {
 *   console.log('Page:', response.page, 'Total:', response.total);
 * });
 * ```
 */
@Injectable({ providedIn: 'root' })
export class AdminApiService {
  /**
   * Base URL for admin dashboard API endpoints
   * @description Constructed from environment configuration
   */
  private readonly baseUrl = `${environment.apiUrl}/admin-dashboard`;

  /**
   * HTTP client for making requests
   */
  private readonly http = inject(HttpClient);

  /**
   * Admin authentication service for token management
   */
  private readonly authService = inject(AdminAuthService);

  /**
   * Perform a GET request
   * @description Retrieves data from the specified endpoint
   * @template T - Expected response type
   * @param endpoint - API endpoint path (relative to baseUrl)
   * @param params - Optional query parameters
   * @param options - Optional request configuration
   * @returns Observable of the response data
   *
   * @example
   * ```typescript
   * // Simple GET
   * this.adminApi.get<Dashboard>('metrics');
   *
   * // GET with query params
   * this.adminApi.get<UserListItem[]>('users', { status: 'active', page: 1 });
   * ```
   */
  get<T>(
    endpoint: string,
    params?: Record<string, any>,
    options: RequestOptions = {}
  ): Observable<T> {
    const url = this.buildUrl(endpoint);
    const httpParams = this.buildParams(params);
    const httpOptions = this.buildOptions(options);

    return this.http.get<T>(url, { ...httpOptions, params: httpParams }).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Perform a POST request
   * @description Sends data to create a new resource
   * @template T - Expected response type
   * @param endpoint - API endpoint path (relative to baseUrl)
   * @param body - Request payload
   * @param options - Optional request configuration
   * @returns Observable of the response data
   *
   * @example
   * ```typescript
   * this.adminApi.post<User>('users', { email: 'test@example.com', name: 'Test User' });
   * ```
   */
  post<T>(
    endpoint: string,
    body: any,
    options: RequestOptions = {}
  ): Observable<T> {
    const url = this.buildUrl(endpoint);
    const httpOptions = this.buildOptions(options);

    return this.http.post<T>(url, body, httpOptions).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Perform a PUT request
   * @description Updates an existing resource (full replacement)
   * @template T - Expected response type
   * @param endpoint - API endpoint path (relative to baseUrl)
   * @param body - Request payload
   * @param options - Optional request configuration
   * @returns Observable of the response data
   */
  put<T>(
    endpoint: string,
    body: any,
    options: RequestOptions = {}
  ): Observable<T> {
    const url = this.buildUrl(endpoint);
    const httpOptions = this.buildOptions(options);

    return this.http.put<T>(url, body, httpOptions).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Perform a PATCH request
   * @description Partially updates an existing resource
   * @template T - Expected response type
   * @param endpoint - API endpoint path (relative to baseUrl)
   * @param body - Request payload (partial update)
   * @param options - Optional request configuration
   * @returns Observable of the response data
   */
  patch<T>(
    endpoint: string,
    body: any,
    options: RequestOptions = {}
  ): Observable<T> {
    const url = this.buildUrl(endpoint);
    const httpOptions = this.buildOptions(options);

    return this.http.patch<T>(url, body, httpOptions).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Perform a DELETE request
   * @description Removes a resource
   * @template T - Expected response type
   * @param endpoint - API endpoint path (relative to baseUrl)
   * @param options - Optional request configuration
   * @returns Observable of the response data
   */
  delete<T>(endpoint: string, options: RequestOptions = {}): Observable<T> {
    const url = this.buildUrl(endpoint);
    const httpOptions = this.buildOptions(options);

    return this.http.delete<T>(url, httpOptions).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Download a file from the API
   * @description Requests a file download (blob response)
   * @param endpoint - API endpoint path
   * @param params - Optional query parameters
   * @returns Observable of the blob data
   */
  downloadFile(
    endpoint: string,
    params?: Record<string, any>
  ): Observable<Blob> {
    const url = this.buildUrl(endpoint);
    const httpParams = this.buildParams(params);
    const headers = this.getAuthHeaders();

    return this.http.get(url, {
      headers,
      params: httpParams,
      responseType: 'blob'
    }).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Upload a file to the API
   * @description Uploads a file using multipart/form-data
   * @template T - Expected response type
   * @param endpoint - API endpoint path
   * @param file - File to upload
   * @param additionalData - Additional form fields
   * @returns Observable of the response data
   */
  uploadFile<T>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, any>
  ): Observable<T> {
    const url = this.buildUrl(endpoint);
    const formData = new FormData();
    formData.append('file', file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
      });
    }

    const headers = this.getAuthHeaders();
    // Note: Don't set Content-Type header for FormData - browser will set it with boundary

    return this.http.post<T>(url, formData, { headers }).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Build paginated request
   * @description Convenience method for paginated list endpoints
   * @template T - Type of items in the paginated response
   * @param endpoint - API endpoint path
   * @param query - Pagination and filter parameters
   * @returns Observable of paginated response
   */
  getPaginated<T>(
    endpoint: string,
    query: PaginationQuery & Record<string, any> = {}
  ): Observable<PaginatedResponse<T>> {
    return this.get<PaginatedResponse<T>>(endpoint, query);
  }

  /**
   * Build full URL from endpoint
   * @description Combines base URL with endpoint path
   * @param endpoint - Relative endpoint path
   * @returns Full URL string
   */
  private buildUrl(endpoint: string): string {
    // Remove leading slash if present
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${this.baseUrl}/${cleanEndpoint}`;
  }

  /**
   * Build HTTP params from object
   * @description Converts object to HttpParams, filtering out null/undefined values
   * @param params - Object containing query parameters
   * @returns HttpParams instance
   */
  private buildParams(params?: Record<string, any>): HttpParams {
    let httpParams = new HttpParams();

    if (!params) {
      return httpParams;
    }

    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        if (Array.isArray(value)) {
          // Handle array parameters (e.g., roleIds=[1,2,3])
          value.forEach(item => {
            httpParams = httpParams.append(key, String(item));
          });
        } else if (value instanceof Date) {
          // Handle Date objects
          httpParams = httpParams.set(key, value.toISOString());
        } else {
          httpParams = httpParams.set(key, String(value));
        }
      }
    });

    return httpParams;
  }

  /**
   * Build request options
   * @description Constructs HTTP options including headers and response type
   * @param options - Request configuration options
   * @returns Object containing headers and other options
   */
  private buildOptions(options: RequestOptions): { headers: HttpHeaders; responseType?: any } {
    let headers = this.getAuthHeaders();

    // Add custom headers
    if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        headers = headers.set(key, value);
      });
    }

    const result: { headers: HttpHeaders; responseType?: any } = { headers };

    if (options.responseType && options.responseType !== 'json') {
      result.responseType = options.responseType;
    }

    return result;
  }

  /**
   * Get authentication headers
   * @description Builds headers with authorization token if available
   * @returns HttpHeaders instance
   */
  private getAuthHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    // Get token from localStorage (matching AdminAuthService storage pattern)
    const token = localStorage.getItem('admin_access_token');
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  /**
   * Handle HTTP errors
   * @description Transforms HTTP errors into ApiError format
   * @param error - HTTP error response
   * @returns Observable that errors with ApiError
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let apiError: ApiError;

    if (error.error instanceof ErrorEvent) {
      // Client-side error (network issue, etc.)
      apiError = {
        statusCode: 0,
        message: 'Unable to connect to server. Please check your network connection.',
        error: 'NETWORK_ERROR'
      };
    } else {
      // Server-side error
      const serverError = error.error;

      apiError = {
        statusCode: error.status,
        message: this.extractErrorMessage(serverError, error.status),
        error: serverError?.error || this.getDefaultErrorCode(error.status),
        validationErrors: serverError?.validationErrors,
        timestamp: serverError?.timestamp || new Date().toISOString()
      };
    }

    // Log error for debugging (could be sent to a logging service)
    console.error('[Admin API Error]', apiError);

    return throwError(() => apiError);
  }

  /**
   * Extract error message from response
   * @description Attempts to get a user-friendly error message
   * @param serverError - Error response body
   * @param statusCode - HTTP status code
   * @returns Human-readable error message
   */
  private extractErrorMessage(serverError: any, statusCode: number): string {
    if (serverError?.message) {
      return serverError.message;
    }

    if (typeof serverError === 'string') {
      return serverError;
    }

    return this.getDefaultErrorMessage(statusCode);
  }

  /**
   * Get default error message for status code
   * @description Provides fallback error messages
   * @param statusCode - HTTP status code
   * @returns Default error message
   */
  private getDefaultErrorMessage(statusCode: number): string {
    const messages: Record<number, string> = {
      400: 'Invalid request. Please check your input.',
      401: 'Authentication required. Please log in again.',
      403: 'Access denied. You do not have permission to perform this action.',
      404: 'Resource not found.',
      409: 'Conflict. The resource may have been modified by another user.',
      422: 'Validation failed. Please check your input.',
      429: 'Too many requests. Please try again later.',
      500: 'Server error. Please try again later.',
      502: 'Server temporarily unavailable. Please try again later.',
      503: 'Service unavailable. Please try again later.'
    };

    return messages[statusCode] || 'An unexpected error occurred. Please try again.';
  }

  /**
   * Get default error code for status code
   * @description Provides fallback error codes
   * @param statusCode - HTTP status code
   * @returns Default error code string
   */
  private getDefaultErrorCode(statusCode: number): string {
    const codes: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'VALIDATION_ERROR',
      429: 'RATE_LIMITED',
      500: 'INTERNAL_SERVER_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE'
    };

    return codes[statusCode] || 'UNKNOWN_ERROR';
  }
}
