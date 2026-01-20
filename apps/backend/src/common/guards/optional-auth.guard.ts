/**
 * @file optional-auth.guard.ts
 * @description Optional Authentication Guard for SouqSyria E-commerce Platform
 *
 * PURPOSE:
 * - Allow cart access for BOTH authenticated users AND guest sessions
 * - Never reject requests (unlike standard AuthGuard)
 * - Attach userId if JWT is present and valid
 * - Attach guestSessionId if guest session cookie exists
 * - Enable seamless guest-to-user cart transition on login
 *
 * USE CASES:
 * - Cart operations (add, update, remove, view)
 * - Product browsing with cart context
 * - Checkout flow (guest or authenticated)
 * - Wishlist features (optional login)
 *
 * BEHAVIOR:
 * 1. Check for JWT Authorization header
 * 2. If JWT exists and valid → Attach user to request
 * 3. If JWT missing or invalid → Check for guest session
 * 4. If guest session exists → Attach session to request
 * 5. If neither exists → Allow request anyway (create session in middleware)
 * 6. NEVER throw Unauthorized exception
 *
 * @author SouqSyria Development Team
 * @since 2025-11-12
 * @version 1.0.0
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { GuestSession } from '../../cart/entities/guest-session.entity';

/**
 * Extended Request interface with optional authentication
 */
export interface RequestWithOptionalAuth extends Request {
  user?: {
    id: number;
    email?: string;
    role?: string;
    [key: string]: any;
  };
  guestSession?: GuestSession;
  guestSessionId?: string;
}

/**
 * OptionalAuthGuard
 *
 * Enables endpoints to accept BOTH authenticated users and guest sessions.
 * Unlike standard AuthGuard, this never rejects requests - it simply
 * enriches the request object with authentication context when available.
 */
@Injectable()
export class OptionalAuthGuard implements CanActivate {
  private readonly logger = new Logger(OptionalAuthGuard.name);

  constructor(private readonly jwtService: JwtService) {
    this.logger.log('🔓 Optional Auth Guard initialized');
  }

  /**
   * Can Activate - Always returns true, but enriches request with auth context
   *
   * @param context - Execution context containing request
   * @returns boolean - Always true (never blocks requests)
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<RequestWithOptionalAuth>();

    try {
      // Attempt to extract and validate JWT token
      const token = this.extractTokenFromHeader(request);

      if (token) {
        try {
          // Verify JWT token
          const payload = await this.jwtService.verifyAsync(token, {
            secret: process.env.JWT_SECRET || 'default-secret-key',
          });

          // Attach user to request
          request.user = {
            id: payload.sub || payload.id,
            email: payload.email,
            role: payload.role,
            ...payload,
          };

          request['isAuthenticatedUser'] = true;
          request['isGuest'] = false;

          this.logger.debug(
            `✅ Authenticated user detected: ${request.user.id}`,
          );
        } catch (jwtError) {
          // JWT is invalid but don't block request
          this.logger.debug(
            `⚠️ Invalid JWT token: ${jwtError.message}`,
          );
          this.handleGuestSession(request);
        }
      } else {
        // No JWT token - treat as guest
        this.handleGuestSession(request);
      }
    } catch (error) {
      // Any error - still allow request as guest
      this.logger.warn(
        `⚠️ Optional auth error: ${error.message}`,
      );
      this.handleGuestSession(request);
    }

    // ALWAYS return true - never block requests
    return true;
  }

  /**
   * Extract JWT token from Authorization header
   *
   * @param request - Express Request object
   * @returns JWT token string or undefined
   */
  private extractTokenFromHeader(
    request: Request,
  ): string | undefined {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return undefined;
    }

    // Support both "Bearer <token>" and raw token formats
    const [type, token] = authHeader.split(' ');

    if (type === 'Bearer' && token) {
      return token;
    }

    // If no "Bearer" prefix, treat entire header as token
    return authHeader;
  }

  /**
   * Handle guest session detection
   * Called when JWT is not present or invalid
   *
   * @param request - Express Request object
   */
  private handleGuestSession(
    request: RequestWithOptionalAuth,
  ): void {
    // Guest session should be attached by GuestSessionMiddleware
    if (request.guestSessionId || request.guestSession) {
      request['isAuthenticatedUser'] = false;
      request['isGuest'] = true;

      this.logger.debug(
        `🎭 Guest session detected: ${request.guestSessionId || 'middleware-pending'}`,
      );
    } else {
      // No authentication and no guest session yet (will be created by middleware)
      request['isAuthenticatedUser'] = false;
      request['isGuest'] = true;

      this.logger.debug(
        '🎭 No authentication or guest session - will be created by middleware',
      );
    }
  }

  /**
   * Static helper: Get user ID from request (authenticated or guest)
   *
   * @param request - Express Request object
   * @returns User ID or Guest Session ID
   */
  static getUserIdentifier(
    request: RequestWithOptionalAuth,
  ): { userId?: number; guestSessionId?: string } {
    if (request['isAuthenticatedUser'] && request.user) {
      return { userId: request.user.id };
    }

    if (request['isGuest'] && request.guestSessionId) {
      return { guestSessionId: request.guestSessionId };
    }

    return {};
  }

  /**
   * Static helper: Check if request is authenticated
   *
   * @param request - Express Request object
   * @returns boolean - True if user is authenticated (not guest)
   */
  static isAuthenticated(
    request: RequestWithOptionalAuth,
  ): boolean {
    return request['isAuthenticatedUser'] === true;
  }

  /**
   * Static helper: Check if request is guest
   *
   * @param request - Express Request object
   * @returns boolean - True if user is guest (not authenticated)
   */
  static isGuest(request: RequestWithOptionalAuth): boolean {
    return request['isGuest'] === true;
  }
}
