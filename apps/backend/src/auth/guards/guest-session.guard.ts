/**
 * @file guest-session.guard.ts
 * @description Guest Session Guard for SS-AUTH-009
 *
 * RESPONSIBILITIES:
 * - Validate guest session from cookie
 * - Skip validation if user is authenticated (JWT exists)
 * - Attach guest session to request object
 * - Allow unauthenticated access with valid guest session
 *
 * USAGE:
 * Apply to routes that support both authenticated and guest users:
 * @UseGuards(GuestSessionGuard)
 *
 * FLOW:
 * 1. Check if user is authenticated via JWT (req.user exists)
 * 2. If authenticated, skip guest session validation
 * 3. If not authenticated, extract session UUID from cookie
 * 4. Validate session and attach to request
 * 5. Allow request to proceed
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { GuestSessionService } from '../service/guest-session.service';
import { GuestSession } from '../../cart/entities/guest-session.entity';

/**
 * Extended Request interface with guest session
 */
export interface RequestWithGuestSession extends Request {
  user?: { id: number; email: string }; // JWT user from JwtAuthGuard
  guestSession?: GuestSession;
  guestSessionId?: string;
}

/**
 * Guest Session Guard
 *
 * Validates guest sessions from cookies for unauthenticated users.
 * Skips validation if user is already authenticated via JWT.
 */
@Injectable()
export class GuestSessionGuard implements CanActivate {
  private readonly logger = new Logger(GuestSessionGuard.name);
  private readonly COOKIE_NAME = 'guest_session_id';

  constructor(private readonly guestSessionService: GuestSessionService) {}

  /**
   * Guard execution method
   *
   * @param context - Execution context
   * @returns True if authenticated user OR valid guest session exists
   * @throws UnauthorizedException if no valid session
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithGuestSession>();

    // Skip guest session validation if user is authenticated
    if (request.user && request.user.id) {
      this.logger.debug('User is authenticated, skipping guest session validation');
      return true;
    }

    // Extract session UUID from cookie
    const sessionUUID = request.cookies?.[this.COOKIE_NAME];

    if (!sessionUUID) {
      this.logger.warn('No guest session cookie found');
      throw new UnauthorizedException('Guest session required. Please create a session first.');
    }

    try {
      // Validate guest session
      const session = await this.guestSessionService.getSession(sessionUUID);

      // Attach session to request
      request.guestSession = session;
      request.guestSessionId = session.id;

      this.logger.debug(`Guest session validated: ${session.id}`);
      return true;
    } catch (error) {
      this.logger.error(`Guest session validation failed: ${error.message}`);
      throw new UnauthorizedException('Invalid or expired guest session');
    }
  }
}
