/**
 * @file guest-session.middleware.ts
 * @description Guest Session Middleware for SouqSyria E-commerce Platform
 *
 * RESPONSIBILITIES:
 * - Automatic guest session creation for anonymous users
 * - Secure cookie management with HTTP-only, Secure, SameSite flags
 * - Session token validation and renewal
 * - Sliding expiration window (30-day session lifetime)
 * - Device fingerprinting for security and analytics
 * - IP address tracking for fraud detection
 *
 * SECURITY FEATURES:
 * - HTTP-only cookies prevent XSS attacks
 * - Secure flag ensures HTTPS-only transmission
 * - SameSite=Lax provides CSRF protection
 * - SHA256 hashed session tokens
 * - Automatic session expiration and cleanup
 *
 * FLOW:
 * 1. Check if guest session cookie exists
 * 2. If no cookie, create new guest session and set cookie
 * 3. If cookie exists, validate session in database
 * 4. Refresh session expiration on every request (sliding window)
 * 5. Attach session to request object for controller access
 *
 * @author SouqSyria Development Team
 * @since 2025-11-12
 * @version 1.0.0
 */

import {
  Injectable,
  NestMiddleware,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { GuestSession } from '../../cart/entities/guest-session.entity';
import { extractIpAddress } from '../utils/request.utils';
import { GuestSessionService } from '../../auth/service/guest-session.service';

/**
 * Extended Request interface to include guest session
 */
export interface RequestWithSession extends Request {
  guestSession?: GuestSession;
  guestSessionId?: string;
}

/**
 * GuestSessionMiddleware
 *
 * Handles automatic guest session creation and management for anonymous users.
 * Integrates with cart system to enable guest cart persistence.
 */
@Injectable()
export class GuestSessionMiddleware implements NestMiddleware {
  private readonly logger = new Logger(GuestSessionMiddleware.name);
  private readonly COOKIE_NAME = 'guest_session_id';
  private readonly COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

  constructor(
    private readonly guestSessionService: GuestSessionService,
  ) {
    this.logger.log('🍪 Guest Session Middleware initialized');
  }

  /**
   * Middleware execution function
   * Called on every request to cart routes
   *
   * @param req - Express Request object
   * @param res - Express Response object
   * @param next - Express NextFunction callback
   */
  async use(
    req: RequestWithSession,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // Extract session ID from cookie
      const sessionIdFromCookie = req.cookies?.[this.COOKIE_NAME];

      if (sessionIdFromCookie) {
        // Validate existing session
        await this.validateExistingSession(
          req,
          res,
          sessionIdFromCookie,
        );
      } else {
        // Create new session for first-time visitor
        await this.createNewSession(req, res);
      }

      // Continue to next middleware/controller
      next();
    } catch (error: unknown) {
      this.logger.error(
        `❌ Guest session middleware error: ${(error as Error).message}`,
        (error as Error).stack,
      );

      // Don't block request on session errors - create fallback session
      try {
        await this.createNewSession(req, res);
        next();
      } catch (fallbackError) {
        this.logger.error(
          `❌ Fallback session creation failed: ${fallbackError.message}`,
        );
        // Allow request to continue without session
        next();
      }
    }
  }

  /**
   * Validate existing guest session from cookie
   *
   * Uses GuestSessionService to ensure consistent validation logic
   * across the application.
   *
   * @param req - Express Request object
   * @param res - Express Response object
   * @param sessionId - Session ID from cookie
   */
  private async validateExistingSession(
    req: RequestWithSession,
    res: Response,
    sessionId: string,
  ): Promise<void> {
    this.logger.debug(`🔍 Validating guest session: ${sessionId}`);

    // Use service layer for session retrieval
    const session = await this.guestSessionService.getSession(sessionId);

    if (!session) {
      this.logger.warn(`⚠️ Guest session not found or expired: ${sessionId}`);
      // Clear invalid cookie and create new session
      res.clearCookie(this.COOKIE_NAME);
      await this.createNewSession(req, res);
      return;
    }

    // Refresh session activity with current IP and fingerprint
    // Service will log warnings if significant changes detected (hijacking indicator)
    const currentIp = extractIpAddress(req);
    const currentFingerprint = this.extractDeviceFingerprint(req);
    await this.guestSessionService.refreshActivity(
      sessionId,
      currentIp,
      currentFingerprint,
    );

    // Attach session to request
    req.guestSession = session;
    req.guestSessionId = session.id;

    this.logger.log(
      `✅ Guest session validated and refreshed: ${sessionId}`,
    );
  }

  /**
   * Create new guest session for anonymous user
   *
   * Uses GuestSessionService to ensure consistent session creation logic.
   *
   * @param req - Express Request object
   * @param res - Express Response object
   */
  private async createNewSession(
    req: RequestWithSession,
    res: Response,
  ): Promise<void> {
    this.logger.log('🆕 Creating new guest session');

    // Prepare session metadata
    const metadata = {
      ...this.extractDeviceFingerprint(req),
      ipAddress: extractIpAddress(req),
    };

    // Use service layer for session creation
    const session = await this.guestSessionService.createSession({
      metadata,
    });

    // Set secure HTTP-only cookie
    res.cookie(this.COOKIE_NAME, session.id, {
      httpOnly: true, // Prevent XSS attacks
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'lax', // CSRF protection
      maxAge: this.COOKIE_MAX_AGE,
      path: '/', // Available on all routes
    });

    // Attach session to request
    req.guestSession = session;
    req.guestSessionId = session.id;

    this.logger.log(
      `✅ New guest session created: ${session.id}`,
    );
  }

  /**
   * Extract device fingerprint from request headers
   * Used for security and analytics
   *
   * @param req - Express Request object
   * @returns Device fingerprint object
   */
  private extractDeviceFingerprint(req: Request): {
    userAgent?: string;
    platform?: string;
    language?: string;
    acceptLanguage?: string;
    acceptEncoding?: string;
  } {
    return {
      userAgent: req.headers['user-agent'] || undefined,
      platform: req.headers['sec-ch-ua-platform'] as string | undefined,
      language: req.headers['accept-language']?.split(',')[0] || undefined,
      acceptLanguage: req.headers['accept-language'] || undefined,
      acceptEncoding: Array.isArray(req.headers['accept-encoding'])
        ? req.headers['accept-encoding'].join(', ')
        : req.headers['accept-encoding'] || '',
    };
  }
}
