/**
 * @file e2e-auth.helper.ts
 * @description Authentication helper utilities for E2E testing
 *
 * This module provides comprehensive helper functions for authentication operations
 * during E2E tests including login, token management, and user session handling.
 *
 * Features:
 * - Login utilities for various user types (admin, vendor, buyer)
 * - JWT token generation and verification helpers
 * - Expired token generation for testing
 * - Token refresh utilities
 * - Session management helpers
 *
 * Performance Targets:
 * - Login operations: <200ms
 * - Token generation: <50ms
 * - Token verification: <10ms
 *
 * @author SouqSyria Development Team
 * @version 1.0.0
 * @since 2025-01-23
 */

import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as request from 'supertest';

/**
 * Interface for login credentials
 * @description Represents the required fields for user authentication
 */
export interface LoginCredentials {
  /** User email address */
  email: string;
  /** User password */
  password: string;
}

/**
 * Interface for authentication tokens
 * @description Contains access and refresh tokens returned after successful authentication
 */
export interface AuthTokens {
  /** JWT access token for API authentication */
  accessToken: string;
  /** JWT refresh token for token renewal (optional) */
  refreshToken?: string;
}

/**
 * Interface for JWT payload
 * @description Structure of the JWT token payload
 */
export interface JwtPayload {
  /** User ID (subject) */
  sub: number;
  /** User email */
  email: string;
  /** User role name */
  role: string;
  /** Role ID */
  role_id: number;
  /** Token issued at timestamp */
  iat?: number;
  /** Token expiration timestamp */
  exp?: number;
}

/**
 * E2E Authentication Helper Class
 * @description Provides authentication utilities for E2E testing
 */
export class E2EAuthHelper {
  private app: INestApplication;
  private jwtService?: JwtService;

  /**
   * Creates an instance of E2EAuthHelper
   * @param app - NestJS application instance
   */
  constructor(app: INestApplication) {
    this.app = app;
    try {
      this.jwtService = this.app.get(JwtService);
    } catch {
      // JwtService might not be available in all test configurations
      console.warn('JwtService not available - some helpers will be limited');
    }
  }

  /**
   * Login with email and password credentials
   * @description Authenticates a user and returns JWT tokens
   *
   * @param credentials - Login credentials (email and password)
   * @returns Promise resolving to access token string
   * @throws Error if login fails
   *
   * @example
   * ```typescript
   * const token = await authHelper.login({
   *   email: 'admin@example.com',
   *   password: 'SecurePassword123!'
   * });
   * ```
   */
  async login(credentials: LoginCredentials): Promise<string> {
    const response = await request(this.app.getHttpServer())
      .post('/auth/email-login')
      .send(credentials)
      .expect((res) => {
        if (res.status !== 200) {
          throw new Error(`Login failed with status ${res.status}: ${JSON.stringify(res.body)}`);
        }
      });

    return response.body.accessToken;
  }

  /**
   * Login as admin user
   * @description Authenticates using predefined admin credentials
   *
   * @param email - Admin email (defaults to 'admin@example.com')
   * @param password - Admin password (defaults to 'AdminPass123!')
   * @returns Promise resolving to admin access token
   *
   * @example
   * ```typescript
   * const adminToken = await authHelper.loginAsAdmin();
   * // Or with custom credentials
   * const adminToken = await authHelper.loginAsAdmin('custom.admin@example.com', 'CustomPass!');
   * ```
   */
  async loginAsAdmin(
    email: string = 'admin@example.com',
    password: string = 'AdminPass123!',
  ): Promise<string> {
    return this.login({ email, password });
  }

  /**
   * Login as regular user
   * @description Authenticates using predefined buyer/customer credentials
   *
   * @param email - User email (defaults to 'user@example.com')
   * @param password - User password (defaults to 'UserPass123!')
   * @returns Promise resolving to user access token
   *
   * @example
   * ```typescript
   * const userToken = await authHelper.loginAsUser();
   * ```
   */
  async loginAsUser(
    email: string = 'user@example.com',
    password: string = 'UserPass123!',
  ): Promise<string> {
    return this.login({ email, password });
  }

  /**
   * Login as vendor user
   * @description Authenticates using predefined vendor credentials
   *
   * @param email - Vendor email (defaults to 'vendor@example.com')
   * @param password - Vendor password (defaults to 'VendorPass123!')
   * @returns Promise resolving to vendor access token
   *
   * @example
   * ```typescript
   * const vendorToken = await authHelper.loginAsVendor();
   * ```
   */
  async loginAsVendor(
    email: string = 'vendor@example.com',
    password: string = 'VendorPass123!',
  ): Promise<string> {
    return this.login({ email, password });
  }

  /**
   * Login with limited permissions user
   * @description Authenticates a user with restricted permissions for testing access control
   *
   * @param email - Limited user email (defaults to 'limited@example.com')
   * @param password - Limited user password (defaults to 'LimitedPass123!')
   * @returns Promise resolving to limited user access token
   *
   * @example
   * ```typescript
   * const limitedToken = await authHelper.loginAsLimitedUser();
   * // Use for testing permission denials
   * ```
   */
  async loginAsLimitedUser(
    email: string = 'limited@example.com',
    password: string = 'LimitedPass123!',
  ): Promise<string> {
    return this.login({ email, password });
  }

  /**
   * Register a new user
   * @description Creates a new user account and returns authentication tokens
   *
   * @param userData - User registration data
   * @returns Promise resolving to authentication result with tokens
   *
   * @example
   * ```typescript
   * const result = await authHelper.register({
   *   email: 'newuser@example.com',
   *   password: 'SecurePass123!'
   * });
   * console.log(result.accessToken);
   * ```
   */
  async register(userData: {
    email: string;
    password: string;
    fullName?: string;
  }): Promise<{ accessToken: string; refreshToken: string; user: any }> {
    const response = await request(this.app.getHttpServer())
      .post('/auth/register')
      .send(userData)
      .expect(201);

    return {
      accessToken: response.body.accessToken,
      refreshToken: response.body.refreshToken,
      user: response.body.user,
    };
  }

  /**
   * Refresh access token
   * @description Exchanges a refresh token for a new access token
   *
   * @param refreshToken - The refresh token to exchange
   * @returns Promise resolving to new access token
   *
   * @example
   * ```typescript
   * const newToken = await authHelper.refreshToken(oldRefreshToken);
   * ```
   */
  async refreshToken(refreshToken: string): Promise<string> {
    const response = await request(this.app.getHttpServer())
      .post('/auth/refresh')
      .send({ token: refreshToken })
      .expect(200);

    return response.body.accessToken;
  }

  /**
   * Logout user
   * @description Invalidates the current access token
   *
   * @param accessToken - The access token to invalidate
   * @returns Promise resolving when logout is complete
   *
   * @example
   * ```typescript
   * await authHelper.logout(currentToken);
   * ```
   */
  async logout(accessToken: string): Promise<void> {
    await request(this.app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})
      .expect(200);
  }

  /**
   * Generate an expired JWT token for testing
   * @description Creates a token that has already expired (useful for testing token expiry handling)
   *
   * @param payload - Token payload data
   * @returns Expired JWT token string
   *
   * @example
   * ```typescript
   * const expiredToken = authHelper.generateExpiredToken({
   *   sub: 1,
   *   email: 'user@example.com',
   *   role: 'buyer',
   *   role_id: 1
   * });
   * // Use for testing expired token rejection
   * ```
   */
  generateExpiredToken(payload: Partial<JwtPayload> = {}): string {
    if (!this.jwtService) {
      // Return a mock expired token structure if JwtService not available
      return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsInJvbGUiOiJidXllciIsImlhdCI6MTYwMDAwMDAwMCwiZXhwIjoxNjAwMDAwMDAxfQ.expired_signature';
    }

    const defaultPayload: JwtPayload = {
      sub: 1,
      email: 'expired@example.com',
      role: 'buyer',
      role_id: 1,
      ...payload,
    };

    // Generate token with past expiration (1 second in the past)
    return this.jwtService.sign(defaultPayload, {
      expiresIn: '-1s',
    });
  }

  /**
   * Generate a valid JWT token for testing
   * @description Creates a valid token without going through login flow (useful for unit tests)
   *
   * @param payload - Token payload data
   * @param expiresIn - Token expiration time (defaults to '1d')
   * @returns Valid JWT token string
   *
   * @example
   * ```typescript
   * const token = authHelper.generateToken({
   *   sub: 42,
   *   email: 'test@example.com',
   *   role: 'admin',
   *   role_id: 1
   * });
   * ```
   */
  generateToken(payload: Partial<JwtPayload>, expiresIn: string = '1d'): string {
    if (!this.jwtService) {
      throw new Error('JwtService not available - cannot generate token');
    }

    const defaultPayload: JwtPayload = {
      sub: 1,
      email: 'test@example.com',
      role: 'buyer',
      role_id: 1,
      ...payload,
    };

    return this.jwtService.sign(defaultPayload, { expiresIn });
  }

  /**
   * Verify and decode a JWT token
   * @description Validates a token and returns its decoded payload
   *
   * @param token - JWT token to verify
   * @returns Decoded token payload or null if invalid
   *
   * @example
   * ```typescript
   * const payload = await authHelper.verifyToken(token);
   * if (payload) {
   *   console.log(`Token belongs to user ${payload.sub}`);
   * }
   * ```
   */
  verifyToken(token: string): JwtPayload | null {
    if (!this.jwtService) {
      throw new Error('JwtService not available - cannot verify token');
    }

    try {
      return this.jwtService.verify(token);
    } catch {
      return null;
    }
  }

  /**
   * Decode a JWT token without verification
   * @description Decodes token payload without validating signature (useful for debugging)
   *
   * @param token - JWT token to decode
   * @returns Decoded token payload
   *
   * @example
   * ```typescript
   * const payload = authHelper.decodeToken(token);
   * console.log(payload);
   * ```
   */
  decodeToken(token: string): JwtPayload | null {
    if (!this.jwtService) {
      // Manual decode without jwtService
      try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const payload = Buffer.from(parts[1], 'base64').toString('utf8');
        return JSON.parse(payload);
      } catch {
        return null;
      }
    }

    return this.jwtService.decode(token) as JwtPayload;
  }

  /**
   * Get user profile using access token
   * @description Retrieves the authenticated user's profile
   *
   * @param token - Access token
   * @returns Promise resolving to user profile
   *
   * @example
   * ```typescript
   * const profile = await authHelper.getProfile(token);
   * console.log(profile.email);
   * ```
   */
  async getProfile(token: string): Promise<any> {
    const response = await request(this.app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    return response.body;
  }

  /**
   * Check if user is authenticated with valid token
   * @description Validates that a token allows access to protected resources
   *
   * @param token - Access token to validate
   * @returns Promise resolving to true if authenticated, false otherwise
   *
   * @example
   * ```typescript
   * const isValid = await authHelper.isAuthenticated(token);
   * expect(isValid).toBe(true);
   * ```
   */
  async isAuthenticated(token: string): Promise<boolean> {
    try {
      const response = await request(this.app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${token}`);

      return response.status === 200;
    } catch {
      return false;
    }
  }
}

/**
 * Create E2E Auth Helper instance
 * @description Factory function to create auth helper
 *
 * @param app - NestJS application instance
 * @returns E2EAuthHelper instance
 *
 * @example
 * ```typescript
 * const authHelper = createE2EAuthHelper(app);
 * const token = await authHelper.loginAsAdmin();
 * ```
 */
export function createE2EAuthHelper(app: INestApplication): E2EAuthHelper {
  return new E2EAuthHelper(app);
}
