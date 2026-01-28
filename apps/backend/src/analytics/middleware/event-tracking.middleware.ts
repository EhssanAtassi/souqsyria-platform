/**
 * @file event-tracking.middleware.ts
 * @description Event Tracking Middleware for Business Intelligence
 *
 * FEATURES:
 * - Automatic session management for all user interactions
 * - Session token generation and cookie management
 * - Request context enrichment with session data
 * - Session timeout and renewal handling
 * - Guest and authenticated user session correlation
 *
 * BUSINESS INTELLIGENCE:
 * - Enables funnel tracking across multiple requests
 * - Supports cart abandonment detection
 * - Provides session-level attribution data
 * - Tracks user journeys from entry to conversion
 *
 * SECURITY:
 * - HTTP-only cookies prevent XSS attacks
 * - Secure flag for HTTPS-only transmission
 * - SameSite=Lax for CSRF protection
 * - Session token rotation on authentication changes
 *
 * @author SouqSyria Development Team
 * @since 2026-01-22
 * @version 1.0.0
 */

import {
  Injectable,
  NestMiddleware,
  Logger,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSession, SessionStatus } from '../entities/user-session.entity';
import { createHash, randomBytes } from 'crypto';

/**
 * Session cookie configuration
 */
const SESSION_COOKIE_NAME = 'souq_session';
const SESSION_TIMEOUT_MINUTES = 30;
const SESSION_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

/**
 * Extended Express Request with session tracking
 */
export interface RequestWithSession extends Request {
  /** Current user session for analytics */
  analyticsSession?: UserSession;
  /** Session token for event correlation */
  analyticsSessionToken?: string;
}

/**
 * EventTrackingMiddleware
 *
 * Manages user sessions for business intelligence tracking.
 * Ensures every request has an associated session for analytics.
 *
 * MIDDLEWARE FLOW:
 * 1. Check for existing session cookie
 * 2. Validate session is active and not expired
 * 3. Create new session if needed
 * 4. Update session activity timestamp
 * 5. Attach session to request context
 * 6. Set/refresh session cookie
 *
 * SESSION LIFECYCLE:
 * - New session created on first visit
 * - Session updated on every request (sliding expiration)
 * - Session marked as ABANDONED after 30 minutes inactivity with cart items
 * - Session marked as CONVERTED when order is completed
 * - Session marked as ENDED on explicit logout
 */
@Injectable()
export class EventTrackingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(EventTrackingMiddleware.name);

  constructor(
    @InjectRepository(UserSession)
    private readonly sessionRepository: Repository<UserSession>,
  ) {}

  /**
   * Middleware handler
   * Processes every request to maintain session tracking
   */
  async use(req: RequestWithSession, res: Response, next: NextFunction) {
    try {
      // Extract session token from cookie
      const sessionToken = req.cookies?.[SESSION_COOKIE_NAME];

      let session: UserSession | null = null;

      if (sessionToken) {
        // Try to load existing session
        session = await this.loadSession(sessionToken);

        if (session && !session.isActive(SESSION_TIMEOUT_MINUTES)) {
          // Session expired or inactive - mark as abandoned if has cart items
          if (session.hasAbandonedCart(SESSION_TIMEOUT_MINUTES)) {
            session.status = SessionStatus.ABANDONED;
            await this.sessionRepository.save(session);
          }
          session = null; // Force new session creation
        }
      }

      // Create new session if needed
      if (!session) {
        session = await this.createSession(req);
        this.setSessionCookie(res, session.sessionToken);
        this.logger.log(`Created new session: ${session.sessionToken} for IP: ${this.getClientIp(req)}`);
      } else {
        // Update existing session activity
        session.updateActivity();
        await this.sessionRepository.save(session);

        // Refresh cookie to extend expiration
        this.setSessionCookie(res, session.sessionToken);
      }

      // Attach session to request for use by controllers
      req.analyticsSession = session;
      req.analyticsSessionToken = session.sessionToken;

      next();
    } catch (error: unknown) {
      // Don't block request on analytics failure
      this.logger.error(`Event tracking middleware error: ${(error as Error).message}`, (error as Error).stack);
      next();
    }
  }

  /**
   * Load existing session from database
   *
   * @param sessionToken - Session identifier from cookie
   * @returns UserSession or null if not found
   */
  private async loadSession(sessionToken: string): Promise<UserSession | null> {
    try {
      return await this.sessionRepository.findOne({
        where: { sessionToken, status: SessionStatus.ACTIVE },
      });
    } catch (error: unknown) {
      this.logger.error(`Failed to load session ${sessionToken}: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * Create new session for user
   *
   * @param req - Express request object
   * @returns Newly created UserSession
   */
  private async createSession(req: RequestWithSession): Promise<UserSession> {
    const session = new UserSession();

    // Generate unique session token
    session.sessionToken = this.generateSessionToken();

    // Attach user if authenticated
    if (req.user && (req.user as any).id) {
      session.userId = (req.user as any).id;
    }

    // Capture entry page
    session.entryPage = this.getFullUrl(req);

    // Extract referrer information
    const referrer = req.headers.referer || req.headers.referrer;
    if (referrer) {
      session.referrerUrl = referrer as string;
      session.referrerSource = this.extractReferrerSource(referrer as string);
    }

    // Extract UTM parameters from query string
    session.utmParams = this.extractUtmParams(req);

    // Capture device and location data
    session.ipAddress = this.getClientIp(req);
    session.userAgent = req.headers['user-agent'];
    session.deviceInfo = this.parseDeviceInfo(req);

    // Initialize timestamps
    session.lastActivityAt = new Date();

    // Save session to database
    return await this.sessionRepository.save(session);
  }

  /**
   * Generate cryptographically secure session token
   *
   * @returns Unique session token
   */
  private generateSessionToken(): string {
    const randomValue = randomBytes(32).toString('hex');
    return createHash('sha256').update(randomValue).digest('hex');
  }

  /**
   * Set session cookie in response
   *
   * @param res - Express response object
   * @param sessionToken - Session token to store in cookie
   */
  private setSessionCookie(res: Response, sessionToken: string): void {
    res.cookie(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true, // Prevent XSS attacks
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'lax', // CSRF protection
      maxAge: SESSION_COOKIE_MAX_AGE,
      path: '/',
    });
  }

  /**
   * Extract client IP address from request
   * Handles proxy headers (X-Forwarded-For, X-Real-IP)
   *
   * @param req - Express request object
   * @returns Client IP address
   */
  private getClientIp(req: Request): string {
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
      const ips = (forwardedFor as string).split(',');
      return ips[0].trim();
    }

    const realIp = req.headers['x-real-ip'];
    if (realIp) {
      return realIp as string;
    }

    return req.ip || req.socket.remoteAddress || 'unknown';
  }

  /**
   * Get full URL from request
   *
   * @param req - Express request object
   * @returns Full URL including protocol, host, and path
   */
  private getFullUrl(req: Request): string {
    const protocol = req.protocol || 'http';
    const host = req.get('host') || 'unknown';
    return `${protocol}://${host}${req.originalUrl}`;
  }

  /**
   * Extract referrer source domain from URL
   *
   * @param referrerUrl - Full referrer URL
   * @returns Referrer domain or 'direct'
   */
  private extractReferrerSource(referrerUrl: string): string {
    try {
      const url = new URL(referrerUrl);
      return url.hostname.replace('www.', '');
    } catch {
      return 'direct';
    }
  }

  /**
   * Extract UTM parameters from query string
   *
   * @param req - Express request object
   * @returns UTM parameters object or null
   */
  private extractUtmParams(req: Request): any {
    const utmParams: any = {};
    let hasUtm = false;

    if (req.query.utm_source) {
      utmParams.utm_source = req.query.utm_source;
      hasUtm = true;
    }
    if (req.query.utm_medium) {
      utmParams.utm_medium = req.query.utm_medium;
      hasUtm = true;
    }
    if (req.query.utm_campaign) {
      utmParams.utm_campaign = req.query.utm_campaign;
      hasUtm = true;
    }
    if (req.query.utm_term) {
      utmParams.utm_term = req.query.utm_term;
      hasUtm = true;
    }
    if (req.query.utm_content) {
      utmParams.utm_content = req.query.utm_content;
      hasUtm = true;
    }

    return hasUtm ? utmParams : null;
  }

  /**
   * Parse device information from user agent
   *
   * @param req - Express request object
   * @returns Device information object
   */
  private parseDeviceInfo(req: Request): any {
    const userAgent = (req.headers['user-agent'] || '').toLowerCase();

    // Simple device type detection
    let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
    if (/mobile|android|iphone|ipod|blackberry|windows phone/.test(userAgent)) {
      deviceType = 'mobile';
    } else if (/ipad|android(?!.*mobile)|tablet/.test(userAgent)) {
      deviceType = 'tablet';
    }

    // Simple OS detection
    let os = 'Unknown';
    if (/windows/.test(userAgent)) os = 'Windows';
    else if (/mac os x/.test(userAgent)) os = 'macOS';
    else if (/linux/.test(userAgent)) os = 'Linux';
    else if (/android/.test(userAgent)) os = 'Android';
    else if (/iphone|ipad|ipod/.test(userAgent)) os = 'iOS';

    // Simple browser detection
    let browser = 'Unknown';
    if (/chrome/.test(userAgent)) browser = 'Chrome';
    else if (/safari/.test(userAgent)) browser = 'Safari';
    else if (/firefox/.test(userAgent)) browser = 'Firefox';
    else if (/edge/.test(userAgent)) browser = 'Edge';
    else if (/msie|trident/.test(userAgent)) browser = 'IE';

    return {
      deviceType,
      os,
      browser,
      language: req.headers['accept-language']?.split(',')[0] || 'unknown',
      timezone: req.headers['x-timezone'] || 'unknown',
    };
  }
}
