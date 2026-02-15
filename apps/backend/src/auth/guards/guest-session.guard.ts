/**
 * @file guest-session.guard.ts
 * @description Guest Session Guard for SouqSyria E-commerce Platform
 *
 * RESPONSIBILITIES:
 * - Validate guest session cookies on cart and checkout routes
 * - Allow authenticated users to bypass guest session requirement
 * - Attach session to request object for controller access
 * - Block requests without valid session or authentication
 *
 * AUTHENTICATION PRIORITY:
 * - If user is authenticated (JWT token), skip guest session check
 * - If user is not authenticated, require valid guest session
 * - Enables seamless transition from guest to authenticated user
 *
 * USAGE:
 * Apply to routes that require either authentication OR guest session:
 * - Cart operations (add to cart, update quantity)
 * - Checkout initiation
 * - Order creation
 *
 * DO NOT apply to:
 * - Public product browsing
 * - Category listings
 * - Search endpoints
 *
 * @author SouqSyria Development Team
 * @since 2026-02-15
 * @version 1.0.0
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { GuestSessionService } from '../service/guest-session.service';
import { GuestSession } from '../../cart/entities/guest-session.entity';

/**
 * JWT User Interface
 * Standard structure of authenticated user from JWT token
 */
interface JwtUser {
  id: string;
  email: string;
  role: string;
}

/**
 * Extended Request interface with guest session
 * Properly typed for guest session and authenticated user
 */
export interface RequestWithGuestSession extends Request {
  guestSession?: GuestSession;
  user?: JwtUser;
}

/**
 * GuestSessionGuard
 *
 * Ensures that cart and checkout operations have either:
 * 1. Authenticated user (req.user from JWT)
 * 2. Valid guest session (cookie-based)
 *
 * This allows both authenticated and anonymous users to use cart functionality.
 */
@Injectable()
export class GuestSessionGuard implements CanActivate {
  private readonly logger = new Logger(GuestSessionGuard.name);
  private readonly COOKIE_NAME = 'guest_session_id';

  constructor(private readonly guestSessionService: GuestSessionService) {
    this.logger.log('✅ GuestSessionGuard initialized');
  }

  /**
   * Guard activation method
   *
   * Validates that request has either authenticated user or valid guest session.
   * Attaches session to request object for controller access.
   *
   * @param context - Execution context with request object
   * @returns boolean - True if request can proceed, throws error otherwise
   * @throws BadRequestException if no valid session or authentication
   *
   * @example
   * ```typescript
   * // In controller:
   * @UseGuards(GuestSessionGuard)
   * @Post('cart/add')
   * async addToCart(@Req() req: Request, @Body() dto: AddToCartDto) {
   *   // Either req.user (authenticated) or req.guestSession exists
   *   const userId = req.user?.id;
   *   const guestSessionId = req.guestSession?.id;
   * }
   * ```
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<RequestWithGuestSession>();

    // PRIORITY 1: If user is authenticated, skip guest session requirement
    if (request.user) {
      this.logger.debug(
        `✅ Authenticated user detected (ID: ${request.user.id}), skipping guest session check`,
      );
      return true;
    }

    // PRIORITY 2: Validate guest session for anonymous users
    const sessionIdFromCookie = request.cookies?.[this.COOKIE_NAME];

    if (!sessionIdFromCookie) {
      this.logger.warn('❌ No guest session cookie found and user not authenticated');
      throw new BadRequestException(
        'No valid session found. Please initialize a guest session or login.',
      );
    }

    try {
      // Validate session exists and is not expired
      const session = await this.guestSessionService.getSession(
        sessionIdFromCookie,
      );

      if (!session) {
        this.logger.warn(
          `❌ Guest session not found or expired: ${sessionIdFromCookie}`,
        );
        throw new BadRequestException(
          'Guest session has expired. Please refresh the page to start a new session.',
        );
      }

      // Attach session to request for controller access
      request.guestSession = session;

      this.logger.debug(
        `✅ Guest session validated: ${session.id}`,
      );

      return true;
    } catch (error) {
      this.logger.error(
        `❌ Guest session validation error: ${error.message}`,
        error.stack,
      );

      // Re-throw BadRequestException as-is
      if (error instanceof BadRequestException) {
        throw error;
      }

      // Wrap other errors
      throw new BadRequestException(
        'Failed to validate guest session. Please try again.',
      );
    }
  }
}
