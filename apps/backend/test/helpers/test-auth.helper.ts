/**
 * @file test-auth.helper.ts
 * @description JWT token generation utilities for integration tests
 *
 * Provides helper methods for:
 * - Generating valid JWT tokens for test users
 * - Creating tokens with custom payloads
 * - Generating expired or invalid tokens for error testing
 *
 * @author SouqSyria Development Team
 * @version 1.0.0
 * @since 2025-01-23
 */

import { JwtService } from '@nestjs/jwt';
import { User } from '../../src/users/entities/user.entity';

/**
 * Interface for JWT payload structure
 * Matches the payload structure expected by JwtStrategy
 */
export interface JwtPayload {
  /** User ID (subject) */
  sub: number;
  /** User email */
  email: string;
  /** Role ID or role name (optional) */
  role_id?: number;
  role?: string;
  /** Token issued at timestamp */
  iat?: number;
  /** Token expiration timestamp */
  exp?: number;
}

/**
 * Interface for token generation options
 */
export interface TokenGenerationOptions {
  /** Custom expiration time in seconds (default: 3600) */
  expiresIn?: number;
  /** Override the secret key (for invalid token tests) */
  secretOverride?: string;
  /** Include role information */
  includeRole?: boolean;
  /** Additional custom claims */
  additionalClaims?: Record<string, any>;
}

/**
 * TestAuthHelper
 *
 * Helper class for JWT token generation in integration tests.
 * Provides methods to create valid, expired, and invalid tokens
 * for testing various authentication scenarios.
 *
 * @example
 * ```typescript
 * const authHelper = new TestAuthHelper(jwtService);
 *
 * // Generate valid token
 * const token = authHelper.generateToken(user);
 *
 * // Generate expired token
 * const expiredToken = authHelper.generateExpiredToken(user);
 *
 * // Make authenticated request
 * await request(app.getHttpServer())
 *   .get('/api/protected')
 *   .set('Authorization', `Bearer ${token}`);
 * ```
 */
export class TestAuthHelper {
  /** Default token expiration in seconds (1 hour) */
  private readonly DEFAULT_EXPIRES_IN = 3600;

  /** Test secret key for generating tokens */
  private readonly testSecret: string;

  constructor(private readonly jwtService: JwtService) {
    // Use the same secret as the application or a test secret
    this.testSecret = process.env.JWT_SECRET || 'test-secret-key-for-integration-tests';
  }

  /**
   * Generate a valid JWT token for a user
   *
   * @param user - User entity to generate token for
   * @param options - Token generation options
   * @returns JWT token string
   *
   * @example
   * ```typescript
   * const token = authHelper.generateToken(user);
   * // Use token in Authorization header
   * ```
   */
  generateToken(user: User, options: TokenGenerationOptions = {}): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };

    // Include role information if requested
    if (options.includeRole !== false && user.role) {
      payload.role_id = user.role.id;
      payload.role = user.role.name;
    }

    // Add additional custom claims
    if (options.additionalClaims) {
      Object.assign(payload, options.additionalClaims);
    }

    return this.jwtService.sign(payload, {
      expiresIn: options.expiresIn || this.DEFAULT_EXPIRES_IN,
      secret: options.secretOverride || this.testSecret,
    });
  }

  /**
   * Generate a JWT token with custom payload
   *
   * @param payload - Custom payload to encode
   * @param options - Token generation options
   * @returns JWT token string
   *
   * @example
   * ```typescript
   * const token = authHelper.generateCustomToken({
   *   sub: 123,
   *   email: 'custom@test.com',
   *   customClaim: 'value'
   * });
   * ```
   */
  generateCustomToken(
    payload: Partial<JwtPayload> & Record<string, any>,
    options: TokenGenerationOptions = {},
  ): string {
    return this.jwtService.sign(payload, {
      expiresIn: options.expiresIn || this.DEFAULT_EXPIRES_IN,
      secret: options.secretOverride || this.testSecret,
    });
  }

  /**
   * Generate an expired JWT token for testing token expiration handling
   *
   * @param user - User entity to generate token for
   * @returns Expired JWT token string
   *
   * @example
   * ```typescript
   * const expiredToken = authHelper.generateExpiredToken(user);
   * // Request should fail with 401 Unauthorized
   * ```
   */
  generateExpiredToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      iat: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
      exp: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
    };

    // Sign with very short expiry (already expired)
    return this.jwtService.sign(payload, {
      expiresIn: -3600, // Negative to make it expired
      secret: this.testSecret,
    });
  }

  /**
   * Generate an invalid JWT token (signed with wrong secret)
   *
   * @param user - User entity to generate token for
   * @returns Invalid JWT token string
   *
   * @example
   * ```typescript
   * const invalidToken = authHelper.generateInvalidToken(user);
   * // Request should fail with 401 Unauthorized
   * ```
   */
  generateInvalidToken(user: User): string {
    return this.generateToken(user, {
      secretOverride: 'wrong-secret-key-for-invalid-token',
    });
  }

  /**
   * Generate a malformed token (not a valid JWT)
   *
   * @returns Malformed token string
   *
   * @example
   * ```typescript
   * const malformedToken = authHelper.generateMalformedToken();
   * // Request should fail with 401 Unauthorized
   * ```
   */
  generateMalformedToken(): string {
    return 'not.a.valid.jwt.token';
  }

  /**
   * Generate a token with missing required claims
   *
   * @param partialPayload - Partial payload missing required claims
   * @returns JWT token string with missing claims
   */
  generateTokenWithMissingClaims(
    partialPayload: Partial<JwtPayload> = {},
  ): string {
    return this.jwtService.sign(partialPayload, {
      expiresIn: this.DEFAULT_EXPIRES_IN,
      secret: this.testSecret,
    });
  }

  /**
   * Decode a JWT token (without verification)
   *
   * @param token - JWT token to decode
   * @returns Decoded payload or null if invalid
   */
  decodeToken(token: string): JwtPayload | null {
    try {
      return this.jwtService.decode(token) as JwtPayload;
    } catch {
      return null;
    }
  }

  /**
   * Verify a JWT token
   *
   * @param token - JWT token to verify
   * @returns Verified payload
   * @throws Error if token is invalid
   */
  verifyToken(token: string): JwtPayload {
    return this.jwtService.verify(token, {
      secret: this.testSecret,
    });
  }

  /**
   * Check if a token is expired
   *
   * @param token - JWT token to check
   * @returns True if token is expired
   */
  isTokenExpired(token: string): boolean {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) return true;
    return decoded.exp * 1000 < Date.now();
  }

  /**
   * Get the Authorization header value for a token
   *
   * @param token - JWT token
   * @returns Authorization header value
   */
  getAuthHeader(token: string): string {
    return `Bearer ${token}`;
  }

  /**
   * Create headers object with Authorization
   *
   * @param token - JWT token
   * @returns Headers object with Authorization
   */
  getAuthHeaders(token: string): Record<string, string> {
    return {
      Authorization: this.getAuthHeader(token),
    };
  }
}

/**
 * Helper function to create an auth helper instance
 * Useful for quick setup in tests
 */
export function createAuthHelper(jwtService: JwtService): TestAuthHelper {
  return new TestAuthHelper(jwtService);
}

/**
 * Helper function to generate a quick test token
 * Useful for one-off token generation without instantiating the helper
 */
export function generateQuickToken(
  jwtService: JwtService,
  user: User,
): string {
  const helper = new TestAuthHelper(jwtService);
  return helper.generateToken(user);
}
