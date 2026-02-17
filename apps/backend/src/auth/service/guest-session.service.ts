/**
 * @file guest-session.service.ts
 * @description Guest Session Service for SouqSyria E-commerce Platform
 *
 * RESPONSIBILITIES:
 * - Create and manage anonymous user sessions
 * - Validate session tokens and expiration
 * - Associate carts with guest sessions
 * - Convert guest sessions to authenticated users
 * - Cleanup expired sessions via scheduled cron job
 *
 * SECURITY:
 * - SHA256 hashed session tokens
 * - 30-day expiration with sliding window
 * - 7-day grace period for session recovery
 * - Automatic cleanup of stale sessions
 *
 * PERFORMANCE:
 * - Efficient database queries with indexes
 * - Batch deletion for expired sessions
 * - Minimal overhead on session validation
 *
 * @author SouqSyria Development Team
 * @since 2026-02-15
 * @version 1.0.0
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { GuestSession } from '../../cart/entities/guest-session.entity';
import {
  CreateGuestSessionDto,
  GuestSessionStatus,
} from '../dto/guest-session.dto';

/**
 * GuestSessionService
 *
 * Manages guest user sessions for anonymous shopping functionality.
 * Handles session lifecycle from creation through conversion or expiration.
 */
@Injectable()
export class GuestSessionService {
  private readonly logger = new Logger(GuestSessionService.name);

  /**
   * Session duration: 30 days in milliseconds
   */
  private readonly SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

  /**
   * Grace period: 7 days in milliseconds
   * Expired sessions are kept for this duration before permanent deletion
   */
  private readonly GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000;

  constructor(
    @InjectRepository(GuestSession)
    private readonly guestSessionRepo: Repository<GuestSession>,
  ) {
    this.logger.log('✅ GuestSessionService initialized');
  }

  /**
   * Create a new guest session
   *
   * Generates a secure session with SHA256 hashed token.
   * Sets 30-day expiration and initializes device metadata.
   *
   * @param createDto - Session creation data with optional device metadata
   * @returns Promise<GuestSession> - Created session entity
   *
   * @example
   * ```typescript
   * const session = await this.guestSessionService.createSession({
   *   metadata: {
   *     userAgent: req.headers['user-agent'],
   *     platform: 'Win32',
   *     language: 'en-US'
   *   }
   * });
   * // Returns: { id: 'uuid', sessionToken: 'sha256-hash', ... }
   * ```
   */
  async createSession(
    createDto: CreateGuestSessionDto = {},
  ): Promise<GuestSession> {
    this.logger.debug('🆕 Creating new guest session');

    // Create session entity with metadata
    const session = this.guestSessionRepo.create({
      deviceFingerprint: createDto.metadata || {},
      status: GuestSessionStatus.ACTIVE,
    });

    // Save to database (triggers BeforeInsert hook for token generation)
    const savedSession = await this.guestSessionRepo.save(session);

    this.logger.log(`✅ Guest session created: ${savedSession.id}`);

    return savedSession;
  }

  /**
   * Get session by ID with expiration validation
   *
   * Retrieves session from database and checks expiration status.
   * Returns null if session is expired beyond grace period.
   *
   * @param sessionId - Session UUID
   * @returns Promise<GuestSession | null> - Session entity or null if expired
   *
   * @example
   * ```typescript
   * const session = await this.guestSessionService.getSession(sessionId);
   * if (!session) {
   *   throw new NotFoundException('Session expired or not found');
   * }
   * ```
   */
  async getSession(sessionId: string): Promise<GuestSession | null> {
    this.logger.debug(`🔍 Fetching guest session: ${sessionId}`);

    // Find session by ID
    const session = await this.guestSessionRepo.findOne({
      where: { id: sessionId },
      relations: ['cart'], // Include cart relation for hasCart flag
    });

    if (!session) {
      this.logger.warn(`⚠️ Guest session not found: ${sessionId}`);
      return null;
    }

    // Check expiration and grace period
    if (session.isExpired() && !session.isInGracePeriod()) {
      this.logger.warn(
        `⏰ Guest session expired beyond grace period: ${sessionId}`,
      );
      return null;
    }

    this.logger.debug(`✅ Guest session retrieved: ${sessionId}`);
    return session;
  }

  /**
   * Validate session and return summary
   *
   * Checks session existence and expiration status.
   * Returns detailed session information for API responses.
   *
   * @param sessionId - Session UUID
   * @returns Promise<object> - Session validation summary
   * @throws NotFoundException if session not found or expired
   *
   * @example
   * ```typescript
   * const summary = await this.guestSessionService.validateSession(sessionId);
   * // Returns: {
   * //   id: 'uuid',
   * //   status: 'active',
   * //   isExpired: false,
   * //   expiresAt: Date,
   * //   hasCart: false
   * // }
   * ```
   */
  async validateSession(sessionId: string): Promise<{
    id: string;
    status: GuestSessionStatus;
    isExpired: boolean;
    isInGracePeriod: boolean;
    lastActivity: Date;
    expiresAt: Date;
    hasCart: boolean;
  }> {
    this.logger.debug(`🔍 Validating guest session: ${sessionId}`);

    const session = await this.getSession(sessionId);

    if (!session) {
      throw new NotFoundException(
        'Guest session not found or has expired beyond recovery period',
      );
    }

    const summary = session.getSummary();

    this.logger.log(`✅ Guest session validated: ${sessionId}`);

    return summary;
  }

  /**
   * Associate a cart with a guest session
   *
   * Links a shopping cart to the guest session.
   * Used when guest adds items to cart for the first time.
   *
   * NOTE: The association is actually managed by the Cart entity's sessionId field.
   * This method validates the session exists before cart creation/update.
   *
   * @param sessionId - Session UUID
   * @param cartId - Cart entity ID
   * @returns Promise<void>
   * @throws NotFoundException if session not found
   *
   * @example
   * ```typescript
   * await this.guestSessionService.associateCart(sessionId, cart.id);
   * ```
   */
  async associateCart(sessionId: string, cartId: number): Promise<void> {
    this.logger.debug(
      `🛒 Validating cart ${cartId} association with guest session ${sessionId}`,
    );

    const session = await this.getSession(sessionId);

    if (!session) {
      throw new NotFoundException('Guest session not found or expired');
    }

    // The cart-session association is managed by the Cart entity's sessionId field.
    // This validation ensures the session exists and is valid before cart operations.
    // The actual relationship is handled by TypeORM through the Cart.sessionId column.

    this.logger.log(
      `✅ Validated session ${sessionId} for cart ${cartId} association`,
    );
  }

  /**
   * Convert guest session to authenticated user
   *
   * Marks session as converted when guest registers or logs in.
   * Preserves session data for analytics and cart migration.
   *
   * @param sessionId - Session UUID
   * @param userId - User account ID after authentication
   * @returns Promise<GuestSession> - Updated session entity
   * @throws NotFoundException if session not found
   *
   * @example
   * ```typescript
   * // After user registration/login with existing cart
   * await this.guestSessionService.convertToUser(sessionId, user.id);
   * // Session status changes to 'converted'
   * // Cart ownership transfers to user account
   * ```
   */
  async convertToUser(
    sessionId: string,
    userId: number,
  ): Promise<GuestSession> {
    this.logger.debug(
      `🔄 Converting guest session ${sessionId} to user ${userId}`,
    );

    const session = await this.guestSessionRepo.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Guest session not found');
    }

    // Mark session as converted
    session.markAsConverted(userId);

    // Save updated session
    const updatedSession = await this.guestSessionRepo.save(session);

    this.logger.log(
      `✅ Guest session ${sessionId} converted to user ${userId}`,
    );

    return updatedSession;
  }

  /**
   * Cleanup expired sessions (Manual Trigger)
   *
   * Deletes sessions expired beyond grace period.
   * Keeps database clean and prevents unbounded growth.
   *
   * NOTE: The scheduled cron job is handled by SessionCleanupService in guest-sessions module.
   * This method is kept for manual cleanup triggers or testing.
   *
   * Grace Period Policy:
   * - Sessions expire after 30 days of inactivity
   * - 7-day grace period for potential recovery
   * - Total retention: 37 days from last activity
   *
   * Performance:
   * - Uses efficient bulk delete query
   * - Logs cleanup statistics
   *
   * @returns Promise<void>
   *
   * @example
   * // Manual cleanup trigger:
   * await this.guestSessionService.cleanupExpiredSessions();
   */
  async cleanupExpiredSessions(): Promise<void> {
    this.logger.log('🧹 Starting manual cleanup of expired guest sessions');

    try {
      // Calculate cutoff date: 37 days ago (30 days + 7 day grace period)
      const cutoffDate = new Date(
        Date.now() - this.SESSION_DURATION_MS - this.GRACE_PERIOD_MS,
      );

      this.logger.debug(`Deleting sessions expired before: ${cutoffDate}`);

      // Delete sessions where expiresAt is older than cutoff
      const result = await this.guestSessionRepo.delete({
        expiresAt: LessThan(cutoffDate),
        status: GuestSessionStatus.EXPIRED,
      });

      const deletedCount = result.affected || 0;

      if (deletedCount > 0) {
        this.logger.log(
          `✅ Cleaned up ${deletedCount} expired guest session(s)`,
        );
      } else {
        this.logger.debug('No expired sessions to clean up');
      }
    } catch (error) {
      this.logger.error(
        `❌ Failed to cleanup expired sessions: ${error.message}`,
        error.stack,
      );
      // Don't throw - cleanup errors should not crash the application
    }
  }

  /**
   * Update session activity timestamp
   *
   * Refreshes lastActivityAt and extends expiration (sliding window).
   * Called by middleware on every guest request.
   *
   * SECURITY: Logs warnings if significant changes detected (potential session hijacking).
   *
   * @param sessionId - Session UUID
   * @param newIpAddress - Optional new IP address to update
   * @param newFingerprint - Optional new device fingerprint to update
   * @returns Promise<void>
   * @throws NotFoundException if session not found
   *
   * @example
   * ```typescript
   * // Called by GuestSessionMiddleware on every cart operation
   * await this.guestSessionService.refreshActivity(sessionId, ipAddress, fingerprint);
   * ```
   */
  async refreshActivity(
    sessionId: string,
    newIpAddress?: string,
    newFingerprint?: Record<string, any>,
  ): Promise<void> {
    this.logger.debug(`🔄 Refreshing activity for session: ${sessionId}`);

    const session = await this.guestSessionRepo.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Guest session not found');
    }

    // Check for IP address changes (potential session hijacking indicator)
    if (newIpAddress && session.ipAddress !== newIpAddress) {
      this.logger.warn(
        `🚨 IP address changed for session ${sessionId}: ${session.ipAddress} → ${newIpAddress} (possible session hijacking)`,
      );
      session.ipAddress = newIpAddress;
    }

    // Check for significant fingerprint changes
    if (
      newFingerprint &&
      this.hasSignificantFingerprintChange(
        session.deviceFingerprint,
        newFingerprint,
      )
    ) {
      this.logger.warn(
        `🚨 Device fingerprint changed significantly for session ${sessionId} (possible session hijacking)`,
      );
      session.deviceFingerprint = newFingerprint;
    } else if (newFingerprint) {
      // Minor fingerprint changes (browser updates, etc.) are silently updated
      session.deviceFingerprint = newFingerprint;
    }

    // Update activity timestamp and expiration
    session.refreshExpiration();

    await this.guestSessionRepo.save(session);

    this.logger.debug(`✅ Session activity refreshed: ${sessionId}`);
  }

  /**
   * Check if device fingerprint has changed significantly
   *
   * Detects major changes that could indicate session hijacking:
   * - User agent change (different browser)
   * - Platform change (different OS)
   * - Multiple field changes simultaneously
   *
   * Minor changes (language, encoding) are tolerated.
   *
   * @param oldFingerprint - Previous fingerprint
   * @param newFingerprint - New fingerprint
   * @returns boolean - True if change is significant
   *
   * @private
   */
  private hasSignificantFingerprintChange(
    oldFingerprint: Record<string, any> | undefined,
    newFingerprint: Record<string, any>,
  ): boolean {
    if (!oldFingerprint) return false;

    // Check critical fields
    const criticalFieldsChanged =
      oldFingerprint.userAgent !== newFingerprint.userAgent ||
      oldFingerprint.platform !== newFingerprint.platform;

    // Count total changed fields
    const allFields = new Set([
      ...Object.keys(oldFingerprint),
      ...Object.keys(newFingerprint),
    ]);

    let changedFields = 0;
    for (const field of allFields) {
      if (oldFingerprint[field] !== newFingerprint[field]) {
        changedFields++;
      }
    }

    // Significant if: critical field changed OR 3+ fields changed
    return criticalFieldsChanged || changedFields >= 3;
  }
}
