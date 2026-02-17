/**
 * @file guest-session.controller.ts
 * @description Guest Session Controller for SouqSyria E-commerce Platform
 *
 * PUBLIC ENDPOINTS:
 * - POST /auth/guest-session/init - Create new guest session
 * - GET /auth/guest-session/validate - Validate existing session
 *
 * SECURITY:
 * - All endpoints marked @Public() (no JWT authentication required)
 * - Session tokens stored in HTTP-only cookies
 * - Secure flag enabled in production (HTTPS-only)
 * - SameSite=Lax for CSRF protection
 *
 * COOKIE SETTINGS:
 * - Name: guest_session_id
 * - Max-Age: 30 days (2,592,000 seconds)
 * - HttpOnly: true (prevent XSS)
 * - Secure: true in production (HTTPS only)
 * - SameSite: Lax (CSRF protection)
 * - Path: / (available on all routes)
 *
 * INTEGRATION:
 * - Works with GuestSessionMiddleware for automatic session management
 * - Used by frontend for explicit session initialization
 * - Enables guest cart persistence across browser sessions
 *
 * @author SouqSyria Development Team
 * @since 2026-02-15
 * @version 1.0.0
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  HttpStatus,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { GuestSessionService } from '../service/guest-session.service';
import {
  CreateGuestSessionDto,
  GuestSessionDto,
  GuestSessionValidationDto,
} from '../dto/guest-session.dto';
import { Public } from '../../common/decorators/public.decorator';
import { extractIpAddress } from '../../common/utils/request.utils';

/**
 * GuestSessionController
 *
 * Handles guest session initialization and validation for anonymous users.
 * Provides public endpoints for session management without authentication.
 */
@ApiTags('Auth - Guest Sessions')
@Controller('auth/guest-session')
@Public() // All endpoints are public (no JWT authentication required)
export class GuestSessionController {
  private readonly logger = new Logger(GuestSessionController.name);
  private readonly COOKIE_NAME = 'guest_session_id';
  private readonly COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

  constructor(private readonly guestSessionService: GuestSessionService) {
    this.logger.log('✅ GuestSessionController initialized');
  }

  /**
   * Initialize new guest session
   *
   * Creates a new guest session with optional device metadata.
   * Sets HTTP-only cookie with session ID for future requests.
   *
   * Use Cases:
   * - First visit to website (before adding to cart)
   * - Explicit session initialization from frontend
   * - Session recovery after expiration
   *
   * Cookie Behavior:
   * - Stored as HTTP-only (not accessible via JavaScript)
   * - Secure flag in production (HTTPS only)
   * - 30-day expiration with sliding window
   *
   * SECURITY:
   * - Rate limited to 5 requests per minute to prevent session flooding attacks
   *
   * @param createDto - Optional device metadata for fingerprinting
   * @param req - Express Request object
   * @param res - Express Response object for cookie setting
   * @returns GuestSessionDto with session details
   *
   * @example
   * POST /auth/guest-session/init
   * Body: {
   *   "metadata": {
   *     "userAgent": "Mozilla/5.0...",
   *     "platform": "Win32",
   *     "language": "en-US"
   *   }
   * }
   *
   * Response:
   * {
   *   "sessionId": "550e8400-e29b-41d4-a716-446655440000",
   *   "expiresAt": "2026-03-17T12:00:00.000Z",
   *   "status": "active",
   *   "isValid": true,
   *   "hasCart": false
   * }
   *
   * Cookies Set:
   * guest_session_id=550e8400-e29b-41d4-a716-446655440000; HttpOnly; Secure; SameSite=Lax
   */
  @Post('init')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  @ApiOperation({
    summary: 'Initialize new guest session',
    description:
      'Creates a new guest session for anonymous users. Returns session details and sets HTTP-only cookie. Used for guest cart persistence before authentication.',
  })
  @ApiBody({
    type: CreateGuestSessionDto,
    description: 'Optional device metadata for security and analytics',
    required: false,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Guest session created successfully',
    type: GuestSessionDto,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to create guest session',
  })
  async initGuestSession(
    @Body() createDto: CreateGuestSessionDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<GuestSessionDto> {
    this.logger.log(
      '📥 POST /auth/guest-session/init - Creating guest session',
    );

    try {
      // Extract IP address from request using shared utility
      const ipAddress = extractIpAddress(req);

      // Merge device metadata with IP address
      const metadata = {
        ...createDto.metadata,
        ipAddress,
      };

      // Create session in database
      const session = await this.guestSessionService.createSession({
        metadata,
      });

      // Set HTTP-only cookie with session ID
      res.cookie(this.COOKIE_NAME, session.id, {
        httpOnly: true, // Prevent XSS attacks
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        sameSite: 'lax', // CSRF protection
        maxAge: this.COOKIE_MAX_AGE, // 30 days
        path: '/', // Available on all routes
      });

      this.logger.log(`✅ Guest session created: ${session.id}`);

      // Return session details
      return {
        sessionId: session.id,
        expiresAt: session.expiresAt,
        metadata: session.deviceFingerprint,
        status: session.status,
        isValid: !session.isExpired(),
        hasCart: !!session.cart,
      };
    } catch (error) {
      this.logger.error(
        `❌ Failed to create guest session: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to create guest session');
    }
  }

  /**
   * Validate existing guest session
   *
   * Checks if guest session cookie is valid and not expired.
   * Returns session status and expiration information.
   *
   * Use Cases:
   * - Frontend session validation on page load
   * - Check before cart operations
   * - Session health monitoring
   *
   * Authentication:
   * - Reads session ID from guest_session_id cookie
   * - No authentication required (public endpoint)
   *
   * @param req - Express Request object with cookies
   * @returns GuestSessionValidationDto with validation status
   *
   * @example
   * GET /auth/guest-session/validate
   *
   * Response (Valid Session):
   * {
   *   "exists": true,
   *   "isValid": true,
   *   "expiresAt": "2026-03-17T12:00:00.000Z",
   *   "status": "active"
   * }
   *
   * Response (Expired Session):
   * {
   *   "exists": true,
   *   "isValid": false,
   *   "expiresAt": "2026-02-01T12:00:00.000Z",
   *   "status": "expired"
   * }
   *
   * Response (No Session):
   * {
   *   "exists": false,
   *   "isValid": false
   * }
   */
  @Get('validate')
  @ApiOperation({
    summary: 'Validate existing guest session',
    description:
      'Checks if guest session cookie is valid and not expired. Returns session status without requiring authentication.',
  })
  @ApiCookieAuth('guest_session_id')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Session validation completed',
    type: GuestSessionValidationDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'No session cookie found',
  })
  async validateGuestSession(
    @Req() req: Request,
  ): Promise<GuestSessionValidationDto> {
    this.logger.log('📥 GET /auth/guest-session/validate - Validating session');

    // Extract session ID from cookie
    const sessionIdFromCookie = req.cookies?.[this.COOKIE_NAME];

    if (!sessionIdFromCookie) {
      this.logger.warn('⚠️ No guest session cookie found');
      return {
        exists: false,
        isValid: false,
      };
    }

    try {
      // Validate session in database
      const session =
        await this.guestSessionService.getSession(sessionIdFromCookie);

      if (!session) {
        this.logger.warn(
          `⚠️ Guest session not found or expired: ${sessionIdFromCookie}`,
        );
        return {
          exists: false,
          isValid: false,
        };
      }

      this.logger.log(`✅ Guest session validated: ${session.id}`);

      return {
        exists: true,
        isValid: !session.isExpired(),
        expiresAt: session.expiresAt,
        status: session.status,
      };
    } catch (error) {
      // Only return exists:false for NOT_FOUND cases
      // Re-throw actual database/infrastructure errors
      if (error.message?.includes('not found')) {
        this.logger.warn(`⚠️ Guest session not found: ${sessionIdFromCookie}`);
        return {
          exists: false,
          isValid: false,
        };
      }

      // Real errors (database failures, etc.) should bubble up as 500s
      this.logger.error(
        `❌ Session validation error: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Session validation failed');
    }
  }
}
