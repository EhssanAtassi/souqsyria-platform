/**
 * @file guest-session.controller.ts
 * @description Guest Session Controller for SS-AUTH-009
 *
 * ENDPOINTS:
 * - POST /api/auth/guest-session/init - Create new guest session
 * - GET /api/auth/guest-session/validate - Validate existing session
 * - POST /api/auth/guest-session/refresh - Refresh session expiration
 *
 * FEATURES:
 * - Automatic session creation with secure cookies
 * - Session validation and expiration checking
 * - Cookie management (HTTP-only, Secure, SameSite)
 * - Device fingerprinting support
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  Req,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { Response, Request } from 'express';
import { GuestSessionService } from '../service/guest-session.service';
import {
  CreateGuestSessionDto,
  GuestSessionDto,
  GuestSessionValidationDto,
  GuestSessionStatus,
} from '../dto/guest-session.dto';
import { Public } from '../../common/decorators/public.decorator';
import { GuestSession } from '../../cart/entities/guest-session.entity';

@ApiTags('Guest Sessions')
@Controller('auth/guest-session')
export class GuestSessionController {
  private readonly logger = new Logger(GuestSessionController.name);
  private readonly COOKIE_NAME = 'guest_session_id';
  private readonly COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

  constructor(private readonly guestSessionService: GuestSessionService) {}

  /**
   * Create new guest session and set cookie
   *
   * @param createDto - Optional session metadata (device fingerprint)
   * @param res - Express response for setting cookie
   * @param req - Express request for IP extraction
   * @returns Created guest session details
   */
  @Post('init')
  @Public()
  @ApiOperation({
    summary: 'Initialize guest session',
    description: `
      Creates a new guest session for anonymous users and sets an HTTP-only cookie.
      This endpoint should be called on first visit to enable guest cart functionality.

      **Security Features:**
      - HTTP-only cookie (prevents XSS)
      - Secure flag in production (HTTPS only)
      - SameSite=strict (CSRF protection)
      - 30-day session lifetime with sliding expiration

      **Use Cases:**
      - First-time visitor to the site
      - Expired session recovery
      - Guest checkout flow initialization
    `,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Guest session created successfully',
    type: GuestSessionDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid request data',
  })
  async initializeSession(
    @Body() createDto: CreateGuestSessionDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ): Promise<GuestSessionDto> {
    this.logger.log('Initializing new guest session');

    // Create session via service
    const session = await this.guestSessionService.createSession(createDto);

    // Set HTTP-only cookie
    res.cookie(this.COOKIE_NAME, session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: this.COOKIE_MAX_AGE,
      path: '/',
    });

    this.logger.log(`Guest session initialized: ${session.id}`);

    return this.mapSessionToDto(session);
  }

  /**
   * Validate existing guest session from cookie
   *
   * @param req - Express request with cookie
   * @returns Validation result with session details
   */
  @Get('validate')
  @Public()
  @ApiOperation({
    summary: 'Validate guest session',
    description: `
      Validates the guest session from the HTTP-only cookie.
      Returns session details if valid, or error if expired/invalid.

      **Validation Checks:**
      - Session exists in database
      - Session is not expired (30-day window)
      - Session is within grace period if expired (7-day recovery)
    `,
  })
  @ApiCookieAuth('guest_session_id')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Session validation result',
    type: GuestSessionValidationDto,
  })
  @ApiBadRequestResponse({
    description: 'Session expired or invalid',
  })
  async validateSession(
    @Req() req: Request,
  ): Promise<GuestSessionValidationDto> {
    this.logger.debug('Validating guest session from cookie');

    const sessionUUID = req.cookies?.[this.COOKIE_NAME];

    if (!sessionUUID) {
      return {
        exists: false,
        isValid: false,
      };
    }

    try {
      const session = await this.guestSessionService.getSession(sessionUUID);

      if (!session) {
        return {
          exists: false,
          isValid: false,
        };
      }

      return {
        exists: true,
        isValid: true,
        expiresAt: session.expiresAt,
        status: session.status as GuestSessionStatus,
      };
    } catch (error) {
      this.logger.warn(
        `Session validation failed: ${(error as Error).message}`,
      );

      return {
        exists: false,
        isValid: false,
      };
    }
  }

  /**
   * Refresh guest session expiration (sliding window)
   *
   * @param req - Express request with cookie
   * @returns Updated guest session details
   */
  @Post('refresh')
  @Public()
  @ApiOperation({
    summary: 'Refresh guest session',
    description: `
      Extends the guest session expiration by 30 days from current time (sliding window).
      This endpoint should be called periodically during user activity to keep the session alive.

      **Behavior:**
      - Resets expiresAt to 30 days from now
      - Updates lastActivityAt timestamp
      - Recovers session if within grace period

      **Use Cases:**
      - Cart updates
      - Product browsing
      - Any user interaction during shopping
    `,
  })
  @ApiCookieAuth('guest_session_id')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Session refreshed successfully',
    type: GuestSessionDto,
  })
  @ApiNotFoundResponse({
    description: 'Guest session not found',
  })
  @ApiBadRequestResponse({
    description: 'Session expired beyond grace period',
  })
  async refreshSession(@Req() req: Request): Promise<GuestSessionDto> {
    this.logger.debug('Refreshing guest session');

    const sessionUUID = req.cookies?.[this.COOKIE_NAME];

    if (!sessionUUID) {
      throw new BadRequestException('No guest session cookie found');
    }

    // Refresh session activity (updates expiration)
    const ipAddress = this.extractIpAddress(req);
    await this.guestSessionService.refreshActivity(sessionUUID, ipAddress);

    // Fetch updated session
    const session = await this.guestSessionService.getSession(sessionUUID);
    if (!session) {
      throw new BadRequestException('Guest session not found after refresh');
    }

    this.logger.log(`Guest session refreshed: ${session.id}`);

    return this.mapSessionToDto(session);
  }

  /**
   * Map GuestSession entity to GuestSessionDto response
   *
   * @param session - GuestSession entity from database
   * @returns GuestSessionDto for API response
   */
  private mapSessionToDto(session: GuestSession): GuestSessionDto {
    return {
      sessionId: session.id,
      expiresAt: session.expiresAt,
      metadata: session.deviceFingerprint,
      status: session.status as GuestSessionStatus,
      isValid: !session.isExpired(),
      hasCart: !!session.cart,
    };
  }

  /**
   * Extract client IP address from request headers
   *
   * @param req - Express request
   * @returns IP address string
   */
  private extractIpAddress(req: Request): string {
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
      const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
      return ips.split(',')[0].trim();
    }

    const realIp = req.headers['x-real-ip'];
    if (realIp) {
      return Array.isArray(realIp) ? realIp[0] : realIp;
    }

    return req.ip || req.socket.remoteAddress || 'unknown';
  }
}
