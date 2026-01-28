import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { map, tap, catchError, retry, delay } from 'rxjs/operators';
import { PermissionStore } from './permission.store';
import { PermissionQuery } from './permission.query';
import { PermissionsResponse, UserWithRoles, Role } from './permission.model';

/**
 * Permission Service
 *
 * Handles HTTP requests and business logic for permission management.
 * Integrates with backend API and updates Akita store.
 *
 * Features:
 * - Fetch user permissions from backend
 * - Auto-refresh stale permissions
 * - Error handling with retry logic
 * - Cache management
 * - Integration with authentication
 *
 * API Endpoints:
 * - GET /api/admin/users/:id/permissions - Fetch permissions
 * - GET /api/admin/users/:id - Fetch user with roles
 *
 * Caching Strategy:
 * - Cache duration: 5 minutes
 * - Auto-refresh: On route navigation if stale
 * - Manual refresh: Available via refreshPermissions()
 * - Clear cache: On logout or role change
 *
 * Error Handling:
 * - Retry failed requests 3 times with exponential backoff
 * - Log errors to console
 * - Update store with error state
 * - Preserve previous permissions on error
 *
 * Usage:
 * ```typescript
 * @Component({...})
 * export class MyComponent {
 *   constructor(private permissionService: PermissionService) {}
 *
 *   ngOnInit() {
 *     // Fetch permissions on component init
 *     this.permissionService.ensureFreshPermissions().subscribe();
 *   }
 *
 *   onLogout() {
 *     this.permissionService.clearPermissions();
 *   }
 * }
 * ```
 *
 * Integration with Auth:
 * ```typescript
 * // In auth.service.ts
 * login(email: string, password: string): Observable<LoginResponse> {
 *   return this.http.post<LoginResponse>('/api/auth/login', { email, password })
 *     .pipe(
 *       tap(response => {
 *         this.storeToken(response.accessToken);
 *         this.permissionService.fetchUserPermissions(response.user.id).subscribe();
 *       })
 *     );
 * }
 * ```
 *
 * @swagger
 * components:
 *   schemas:
 *     PermissionService:
 *       type: object
 *       description: Service for managing user permissions via HTTP API
 */
@Injectable({ providedIn: 'root' })
export class PermissionService {
  private readonly http = inject(HttpClient);
  private readonly store = inject(PermissionStore);
  private readonly query = inject(PermissionQuery);

  /**
   * Cache duration in milliseconds (5 minutes)
   *
   * Permissions are considered stale after this duration.
   * Adjust based on your security requirements.
   */
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Retry configuration
   *
   * Failed requests are retried with exponential backoff:
   * - Retry 1: 1 second delay
   * - Retry 2: 2 seconds delay
   * - Retry 3: 4 seconds delay
   */
  private readonly RETRY_CONFIG = {
    count: 3,
    delay: 1000,
  };

  /**
   * Fetch User Permissions
   *
   * Fetches permissions from the backend API and updates the store.
   * Automatically handles loading states, errors, and caching.
   *
   * API Endpoint: GET /api/admin/users/:id/permissions
   *
   * Response:
   * ```json
   * {
   *   "permissions": ["manage_users", "view_products"],
   *   "roles": [...]
   * }
   * ```
   *
   * State Flow:
   * 1. Set loading: true
   * 2. Make HTTP request
   * 3. Retry on failure (3 attempts)
   * 4. Update store with response
   * 5. Set loaded: true, lastFetched: now
   * 6. Handle errors if all retries fail
   *
   * @param userId - User ID to fetch permissions for
   * @returns Observable<void> - Completes when permissions are loaded
   *
   * @example
   * ```typescript
   * // Fetch permissions after login
   * this.permissionService.fetchUserPermissions(user.id)
   *   .subscribe({
   *     next: () => console.log('Permissions loaded'),
   *     error: (err) => console.error('Failed to load permissions', err)
   *   });
   * ```
   *
   * @throws HttpErrorResponse - If API request fails after retries
   */
  fetchUserPermissions(userId: number): Observable<void> {
    this.store.setLoading(true);

    return this.http.get<PermissionsResponse>(`/api/admin/users/${userId}/permissions`).pipe(
      // Retry on failure with exponential backoff
      retry({
        count: this.RETRY_CONFIG.count,
        delay: (error, retryCount) => {
          console.warn(`Retry attempt ${retryCount} for permissions fetch`);
          return of(error).pipe(delay(Math.pow(2, retryCount - 1) * this.RETRY_CONFIG.delay));
        },
      }),

      // Update store with response
      tap(response => {
        this.store.setPermissions(
          response.permissions,
          response.roles || []
        );
        console.log('Permissions loaded:', response.permissions.length);
      }),

      // Handle errors
      catchError(error => {
        this.handleError(error);
        return throwError(() => error);
      }),

      // Convert to void
      map(() => void 0)
    );
  }

  /**
   * Fetch User with Roles
   *
   * Alternative method to fetch permissions via user endpoint.
   * Use this if the permissions endpoint is not available.
   *
   * API Endpoint: GET /api/admin/users/:id
   *
   * Response:
   * ```json
   * {
   *   "id": 1,
   *   "email": "user@example.com",
   *   "role": { "id": 2, "name": "seller", ... },
   *   "assignedRole": { "id": 5, "name": "admin", ... },
   *   "rolePermissions": [...]
   * }
   * ```
   *
   * @param userId - User ID to fetch
   * @returns Observable<void> - Completes when permissions are loaded
   *
   * @example
   * ```typescript
   * this.permissionService.fetchUserWithRoles(user.id).subscribe();
   * ```
   */
  fetchUserWithRoles(userId: number): Observable<void> {
    this.store.setLoading(true);

    return this.http.get<UserWithRoles>(`/api/admin/users/${userId}`).pipe(
      retry({
        count: this.RETRY_CONFIG.count,
        delay: (error, retryCount) => {
          console.warn(`Retry attempt ${retryCount} for user fetch`);
          return of(error).pipe(delay(Math.pow(2, retryCount - 1) * this.RETRY_CONFIG.delay));
        },
      }),

      tap(user => {
        // Extract permissions from roles
        const permissions = this.extractPermissionsFromUser(user);
        const roles = [user.role, user.assignedRole].filter(Boolean) as Role[];

        this.store.setPermissions(permissions, roles);
        console.log('Permissions loaded from user:', permissions.length);
      }),

      catchError(error => {
        this.handleError(error);
        return throwError(() => error);
      }),

      map(() => void 0)
    );
  }

  /**
   * Refresh Permissions
   *
   * Force re-fetch permissions from backend.
   * Use when you know permissions have changed (e.g., after role update).
   *
   * Note: This bypasses the cache and always makes an HTTP request.
   *
   * @returns Observable<void> - Completes when permissions are refreshed
   *
   * @example
   * ```typescript
   * // After updating user role
   * this.userService.updateRole(userId, newRole).pipe(
   *   switchMap(() => this.permissionService.refreshPermissions())
   * ).subscribe();
   * ```
   */
  refreshPermissions(): Observable<void> {
    // Get current user ID from auth service
    // TODO: Inject AuthService and get current user ID
    const userId = this.getCurrentUserId();

    if (!userId) {
      console.warn('Cannot refresh permissions: No user logged in');
      return of(void 0);
    }

    return this.fetchUserPermissions(userId);
  }

  /**
   * Clear Permissions
   *
   * Resets the store to empty state.
   * Call this on user logout to prevent permission leakage.
   *
   * Security:
   * - Prevents unauthorized access after logout
   * - Clears all cached permission data
   * - Forces re-fetch on next login
   *
   * @example
   * ```typescript
   * // In auth.service.ts
   * logout(): void {
   *   this.removeToken();
   *   this.permissionService.clearPermissions();
   *   this.router.navigate(['/login']);
   * }
   * ```
   */
  clearPermissions(): void {
    this.store.clearPermissions();
    console.log('Permissions cleared');
  }

  /**
   * Check if Permissions are Stale
   *
   * Determines if cached permissions need to be refreshed.
   * Permissions are stale if:
   * - Never fetched (lastFetched === null)
   * - Older than CACHE_DURATION (5 minutes)
   *
   * @returns boolean - true if permissions need refresh
   *
   * @example
   * ```typescript
   * if (this.permissionService.arePermissionsStale()) {
   *   this.permissionService.refreshPermissions().subscribe();
   * }
   * ```
   */
  arePermissionsStale(): boolean {
    const lastFetched = this.query.getLastFetched();

    if (!lastFetched) {
      return true; // Never fetched
    }

    const age = Date.now() - lastFetched;
    return age > this.CACHE_DURATION;
  }

  /**
   * Ensure Fresh Permissions
   *
   * Auto-refresh permissions if stale or not loaded.
   * Use this in route resolvers or component initialization.
   *
   * Behavior:
   * - If not loaded: Fetch permissions
   * - If stale: Refresh permissions
   * - If fresh: Return immediately (no HTTP call)
   *
   * @returns Observable<void> - Completes when permissions are fresh
   *
   * @example
   * ```typescript
   * // In route resolver
   * resolve(): Observable<void> {
   *   return this.permissionService.ensureFreshPermissions();
   * }
   *
   * // In component
   * ngOnInit() {
   *   this.permissionService.ensureFreshPermissions().subscribe({
   *     next: () => this.initializeComponent(),
   *     error: (err) => this.handleError(err)
   *   });
   * }
   * ```
   */
  ensureFreshPermissions(): Observable<void> {
    const loaded = this.query.isLoaded();

    if (!loaded || this.arePermissionsStale()) {
      const userId = this.getCurrentUserId();

      if (!userId) {
        console.warn('Cannot ensure fresh permissions: No user logged in');
        return of(void 0);
      }

      return this.fetchUserPermissions(userId);
    }

    return of(void 0);
  }

  /**
   * Set Permissions Directly
   *
   * Manually set permissions without making an HTTP request.
   * Use this when permissions are already available (e.g., in login response).
   *
   * @param permissions - Array of permission names
   * @param roles - Array of role objects
   *
   * @example
   * ```typescript
   * // After login, if response includes permissions
   * const loginResponse = { user: {...}, permissions: [...], roles: [...] };
   * this.permissionService.setPermissions(
   *   loginResponse.permissions,
   *   loginResponse.roles
   * );
   * ```
   */
  setPermissions(permissions: string[], roles: Role[]): void {
    this.store.setPermissions(permissions, roles);
    console.log('Permissions set manually:', permissions.length);
  }

  /**
   * Handle Error
   *
   * Processes HTTP errors and updates store.
   * Logs error details to console for debugging.
   *
   * @param error - Error object from HTTP request
   *
   * @internal
   */
  handleError(error: HttpErrorResponse): void {
    let errorMessage = 'Failed to load permissions';

    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    } else if (error.status) {
      switch (error.status) {
        case 401:
          errorMessage = 'Unauthorized: Please login again';
          break;
        case 403:
          errorMessage = 'Forbidden: Insufficient permissions';
          break;
        case 404:
          errorMessage = 'User not found';
          break;
        case 500:
          errorMessage = 'Server error: Please try again later';
          break;
        default:
          errorMessage = `HTTP Error ${error.status}: ${error.statusText}`;
      }
    }

    this.store.setError(errorMessage);
    console.error('Permission Service Error:', {
      message: errorMessage,
      status: error.status,
      url: error.url,
      error: error.error,
    });
  }

  /**
   * Extract Permissions from User Object
   *
   * Extracts flattened permission names from user roles.
   * Combines permissions from business role and assigned role.
   *
   * @param user - User object with roles
   * @returns string[] - Flattened permission names
   *
   * @internal
   */
  private extractPermissionsFromUser(user: UserWithRoles): string[] {
    const permissions = new Set<string>();

    // Extract from business role
    if (user.role?.rolePermissions) {
      user.role.rolePermissions.forEach(rp => {
        permissions.add(rp.permission.name);
      });
    }

    // Extract from assigned role
    if (user.assignedRole?.rolePermissions) {
      user.assignedRole.rolePermissions.forEach(rp => {
        permissions.add(rp.permission.name);
      });
    }

    // Extract from top-level rolePermissions
    if (user.rolePermissions) {
      user.rolePermissions.forEach(rp => {
        permissions.add(rp.permission.name);
      });
    }

    return Array.from(permissions);
  }

  /**
   * Get Current User ID
   *
   * Retrieves current user ID from auth service.
   * TODO: Implement proper auth service integration.
   *
   * @returns number | null - User ID or null if not authenticated
   *
   * @internal
   * @todo Inject AuthService and implement proper user ID retrieval
   */
  private getCurrentUserId(): number | null {
    // TODO: Inject AuthService and get current user ID
    // return this.authService.getCurrentUserId();

    // Temporary implementation - read from localStorage or token
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.id;
      } catch (e) {
        console.error('Failed to parse user from localStorage', e);
      }
    }

    return null;
  }
}
