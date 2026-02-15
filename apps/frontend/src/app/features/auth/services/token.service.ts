import { Injectable } from '@angular/core';

/**
 * Token Service for SouqSyria authentication
 *
 * @description Manages JWT access and refresh tokens in localStorage.
 * Handles token storage, retrieval, clearing, and expiry checking.
 * Works with the auth interceptor for automatic token attachment.
 *
 * @swagger
 * components:
 *   schemas:
 *     TokenService:
 *       type: object
 *       description: JWT token management service
 */
@Injectable({
  providedIn: 'root'
})
export class TokenService {
  /** LocalStorage key for the JWT access token */
  private readonly ACCESS_TOKEN_KEY = 'auth_token';

  /** LocalStorage key for the JWT refresh token */
  private readonly REFRESH_TOKEN_KEY = 'auth_refresh_token';

  /** LocalStorage key for the remember-me preference */
  private readonly REMEMBER_ME_KEY = 'auth_remember_me';

  /** LocalStorage key for session start timestamp (absolute timeout) */
  private readonly SESSION_STARTED_AT_KEY = 'auth_session_started_at';

  /** Maximum session duration in days for remember-me sessions */
  private readonly MAX_SESSION_DAYS = 30;

  /** Maximum session duration in days for non-remember-me sessions */
  private readonly DEFAULT_SESSION_DAYS = 1;

  /**
   * Get the stored access token
   *
   * @description Retrieves the JWT access token from localStorage
   * @returns The access token string or null if not stored
   */
  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  /**
   * Get the stored refresh token
   *
   * @description Retrieves the JWT refresh token from localStorage
   * @returns The refresh token string or null if not stored
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Store access and refresh tokens
   *
   * @description Persists both tokens to localStorage after login or register
   * @param accessToken - JWT access token from the backend
   * @param refreshToken - JWT refresh token from the backend (optional)
   */
  setTokens(accessToken: string, refreshToken?: string): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    }
  }

  /**
   * Clear all stored tokens and session data
   *
   * @description Removes access token, refresh token, remember-me flag,
   * and session start timestamp from localStorage.
   * Called on logout or when tokens are invalidated.
   */
  clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.REMEMBER_ME_KEY);
    localStorage.removeItem(this.SESSION_STARTED_AT_KEY);
  }

  /**
   * Store the remember-me preference
   *
   * @description Persists the user's "remember me" choice to localStorage
   * so it can be restored when the login form reloads.
   * @param value - Whether "remember me" was selected
   */
  setRememberMe(value: boolean): void {
    localStorage.setItem(this.REMEMBER_ME_KEY, JSON.stringify(value));
  }

  /**
   * Get the stored remember-me preference
   *
   * @description Retrieves the remember-me flag from localStorage
   * @returns True if remember-me was previously selected, false otherwise
   */
  getRememberMe(): boolean {
    const stored = localStorage.getItem(this.REMEMBER_ME_KEY);
    return stored ? JSON.parse(stored) : false;
  }

  /**
   * Check if an access token exists
   *
   * @description Quick check for token presence (not validity)
   * @returns True if an access token is stored
   */
  hasToken(): boolean {
    return !!this.getAccessToken();
  }

  /**
   * Decode a JWT token payload without verification
   *
   * @description Extracts the payload from a JWT token by base64-decoding
   * the middle segment. Does NOT verify the signature.
   * @param token - JWT token string to decode
   * @returns Decoded payload object or null if decoding fails
   */
  decodeToken(token: string): Record<string, any> | null {
    try {
      const payload = token.split('.')[1];
      const decoded = atob(payload);
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }

  /**
   * Check if the access token is expired or near expiry
   *
   * @description Decodes the token to read the `exp` claim and compares
   * against current time. Returns true if expired or within the buffer.
   * @param bufferSeconds - Seconds before actual expiry to consider "expired" (default 120 = 2 minutes)
   * @returns True if token is expired or will expire within the buffer window
   */
  isTokenExpired(bufferSeconds: number = 120): boolean {
    const token = this.getAccessToken();
    if (!token) {
      return true;
    }

    const payload = this.decodeToken(token);
    if (!payload || !payload['exp']) {
      return true;
    }

    const expiryTime = payload['exp'] * 1000;
    const now = Date.now();
    return now >= expiryTime - (bufferSeconds * 1000);
  }

  /**
   * Get the time remaining until token expiry in seconds
   *
   * @description Useful for scheduling automatic token refresh
   * @returns Seconds until expiry, or 0 if token is missing/expired
   */
  getTokenExpirySeconds(): number {
    const token = this.getAccessToken();
    if (!token) {
      return 0;
    }

    const payload = this.decodeToken(token);
    if (!payload || !payload['exp']) {
      return 0;
    }

    const remaining = (payload['exp'] * 1000) - Date.now();
    return Math.max(0, Math.floor(remaining / 1000));
  }

  /**
   * Record the current time as the session start
   *
   * @description Stores a Unix timestamp in localStorage. Used in conjunction
   * with isSessionExpired() to enforce an absolute session ceiling.
   * Called once when the user logs in.
   */
  setSessionStartedAt(): void {
    localStorage.setItem(this.SESSION_STARTED_AT_KEY, String(Date.now()));
  }

  /**
   * Check if the session has exceeded its absolute maximum duration
   *
   * @description Compares the stored session start timestamp against the
   * configured maximum duration. Remember-me sessions last 30 days;
   * regular sessions last 1 day.
   * @returns true if the session has expired or no start timestamp exists
   */
  isSessionExpired(): boolean {
    const startedAt = localStorage.getItem(this.SESSION_STARTED_AT_KEY);
    if (!startedAt) {
      return false; // No timestamp means legacy session — let JWT expiry handle it
    }

    const maxDays = this.getRememberMe()
      ? this.MAX_SESSION_DAYS
      : this.DEFAULT_SESSION_DAYS;
    const maxMs = maxDays * 24 * 60 * 60 * 1000;
    return Date.now() - Number(startedAt) > maxMs;
  }

  /**
   * Get the user ID from the stored access token
   *
   * @description Extracts the `sub` claim from the JWT payload
   * @returns User ID number or null if token is missing/invalid
   */
  getUserIdFromToken(): number | null {
    const token = this.getAccessToken();
    if (!token) {
      return null;
    }

    const payload = this.decodeToken(token);
    return payload?.['sub'] ?? null;
  }
}
