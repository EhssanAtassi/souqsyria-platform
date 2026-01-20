import { Injectable } from '@angular/core';

/**
 * Cart Session Service
 *
 * Manages guest session cookies for anonymous cart persistence.
 * Reads and stores session IDs from HTTP-only cookies set by the backend.
 *
 * Features:
 * - Parse guest session cookie from browser
 * - Determine if user is guest or authenticated
 * - Session ID retrieval for cart API calls
 *
 * Backend Integration:
 * - Backend sets HTTP-only cookie: `guest_session_id={uuid}; Max-Age=2592000; Path=/; Secure; SameSite=Lax`
 * - Cookie lifetime: 30 days with sliding expiration
 * - Frontend reads cookie to attach to cart API requests
 *
 * Usage:
 * ```typescript
 * constructor(private sessionService: CartSessionService) {}
 *
 * ngOnInit() {
 *   const sessionId = this.sessionService.getSessionId();
 *   if (this.sessionService.isGuestSession()) {
 *     console.log('Guest user with session:', sessionId);
 *     this.cartSync.fetchGuestCart(sessionId);
 *   }
 * }
 * ```
 *
 * @swagger
 * components:
 *   schemas:
 *     CartSessionService:
 *       type: object
 *       description: Service for managing guest session cookies
 */
@Injectable({ providedIn: 'root' })
export class CartSessionService {
  /** Cookie name set by backend */
  private readonly COOKIE_NAME = 'guest_session_id';

  /** Cached session ID */
  private cachedSessionId: string | null = null;

  /**
   * Get Guest Session ID
   *
   * Reads session ID from browser cookie.
   * Caches the value to avoid repeated cookie parsing.
   *
   * @returns Session ID or null if not found
   */
  getSessionId(): string | null {
    // Return cached value if available
    if (this.cachedSessionId) {
      return this.cachedSessionId;
    }

    // Parse cookies to find session ID
    const sessionId = this.getCookie(this.COOKIE_NAME);

    if (sessionId) {
      this.cachedSessionId = sessionId;
      console.log('Guest session ID:', sessionId);
    }

    return sessionId;
  }

  /**
   * Check if Guest Session
   *
   * Determines if the current user is a guest (has session ID but no auth token).
   *
   * @returns True if guest session exists, false otherwise
   */
  isGuestSession(): boolean {
    const sessionId = this.getSessionId();
    const hasAuthToken = this.hasAuthenticationToken();

    return !!sessionId && !hasAuthToken;
  }

  /**
   * Check if Authenticated
   *
   * Determines if user is logged in with JWT token.
   *
   * @returns True if authenticated, false otherwise
   */
  isAuthenticated(): boolean {
    return this.hasAuthenticationToken();
  }

  /**
   * Clear Cached Session
   *
   * Clears the cached session ID (useful after login when migrating to authenticated cart).
   */
  clearCachedSession(): void {
    this.cachedSessionId = null;
    console.log('Guest session cache cleared');
  }

  /**
   * Set Session ID (Testing/Development)
   *
   * Manually set session ID for testing purposes.
   * In production, session ID should only come from backend cookie.
   *
   * @param sessionId - Session ID to set
   */
  setSessionIdForTesting(sessionId: string): void {
    this.cachedSessionId = sessionId;
    console.warn('Session ID set manually (testing only):', sessionId);
  }

  /**
   * Get Cookie by Name
   *
   * Parses document.cookie to extract a specific cookie value.
   *
   * @param name - Cookie name
   * @returns Cookie value or null if not found
   */
  private getCookie(name: string): string | null {
    // document.cookie format: "name1=value1; name2=value2; name3=value3"
    const cookies = document.cookie.split(';');

    for (const cookie of cookies) {
      const [cookieName, cookieValue] = cookie.trim().split('=');

      if (cookieName === name) {
        return decodeURIComponent(cookieValue);
      }
    }

    return null;
  }

  /**
   * Check for Authentication Token
   *
   * Checks if JWT token exists in localStorage.
   * Assumes token is stored at key 'auth_token' or 'access_token'.
   *
   * @returns True if token exists, false otherwise
   */
  private hasAuthenticationToken(): boolean {
    const token =
      localStorage.getItem('auth_token') ||
      localStorage.getItem('access_token') ||
      sessionStorage.getItem('auth_token') ||
      sessionStorage.getItem('access_token');

    return !!token;
  }

  /**
   * Get All Cookies (Debug)
   *
   * Returns all browser cookies for debugging.
   *
   * @returns Array of cookie key-value pairs
   */
  getAllCookies(): { name: string; value: string }[] {
    const cookies = document.cookie.split(';');
    return cookies.map(cookie => {
      const [name, value] = cookie.trim().split('=');
      return { name, value: decodeURIComponent(value || '') };
    });
  }
}
