/**
 * @file guest-session.service.ts
 * @description Guest Session Service for SS-AUTH-009
 *
 * RESPONSIBILITIES:
 * - Create and manage guest sessions for anonymous users
 * - Validate session tokens and expiration
 * - Associate carts with guest sessions
 * - Clean up expired sessions
 * - Convert guest sessions to user accounts
 *
 * FEATURES:
 * - Automatic session token generation (SHA256 hash)
 * - 30-day sliding expiration window
 * - 7-day grace period for session recovery
 * - Device fingerprinting for security
 * - Scheduled cleanup of expired sessions
 */

import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GuestSession } from '../../cart/entities/guest-session.entity';
import { CreateGuestSessionDto, GuestSessionDto, DeviceFingerprintDto } from '../dto/guest-session.dto';

@Injectable()
export class GuestSessionService {
  private readonly logger = new Logger(GuestSessionService.name);

  constructor(
    @InjectRepository(GuestSession)
    private readonly guestSessionRepo: Repository<GuestSession>,
  ) {}

  /**
   * Create a new guest session
   *
   * @param createDto - Session creation data (optional metadata)
   * @returns Created guest session entity
   *
   * @example
   * const session = await service.createSession({
   *   ipAddress: '192.168.1.100',
   *   deviceFingerprint: { userAgent: 'Mozilla/5.0...', platform: 'macOS' }
   * });
   */
  async createSession(createDto?: CreateGuestSessionDto): Promise<GuestSession> {
    this.logger.log('Creating new guest session');

    const session = this.guestSessionRepo.create({
      ipAddress: createDto?.ipAddress,
      deviceFingerprint: createDto?.deviceFingerprint,
      status: 'active',
    });

    const savedSession = await this.guestSessionRepo.save(session);

    this.logger.log(`Guest session created: ${savedSession.id}`);
    return savedSession;
  }

  /**
   * Get guest session by UUID
   *
   * @param sessionUUID - Session UUID
   * @returns Guest session entity if valid
   * @throws NotFoundException if session not found
   * @throws BadRequestException if session expired
   *
   * @example
   * const session = await service.getSession('550e8400-e29b-41d4-a716-446655440000');
   */
  async getSession(sessionUUID: string): Promise<GuestSession> {
    this.logger.debug(`Fetching guest session: ${sessionUUID}`);

    const session = await this.guestSessionRepo.findOne({
      where: { id: sessionUUID },
      relations: ['cart'],
    });

    if (!session) {
      throw new NotFoundException(`Guest session not found: ${sessionUUID}`);
    }

    // Check expiration
    if (session.isExpired() && !session.isInGracePeriod()) {
      // Mark as expired and remove
      session.status = 'expired';
      await this.guestSessionRepo.save(session);

      this.logger.warn(`Guest session expired: ${sessionUUID}`);
      throw new BadRequestException('Guest session has expired. Please create a new session.');
    }

    // Refresh expiration if in grace period
    if (session.isExpired() && session.isInGracePeriod()) {
      this.logger.log(`Recovering guest session from grace period: ${sessionUUID}`);
      session.refreshExpiration();
      await this.guestSessionRepo.save(session);
    }

    return session;
  }

  /**
   * Get guest session by session token (SHA256 hash)
   *
   * @param sessionToken - SHA256 hashed session token from cookie
   * @returns Guest session entity if valid
   * @throws NotFoundException if session not found
   *
   * @example
   * const session = await service.getSessionByToken('a3f5b2c1d4e6f7a8...');
   */
  async getSessionByToken(sessionToken: string): Promise<GuestSession> {
    this.logger.debug('Fetching guest session by token');

    const session = await this.guestSessionRepo.findOne({
      where: { sessionToken },
      relations: ['cart'],
    });

    if (!session) {
      throw new NotFoundException('Guest session not found');
    }

    // Check expiration
    if (session.isExpired() && !session.isInGracePeriod()) {
      session.status = 'expired';
      await this.guestSessionRepo.save(session);

      this.logger.warn(`Guest session expired (by token): ${session.id}`);
      throw new BadRequestException('Guest session has expired. Please create a new session.');
    }

    // Refresh if in grace period
    if (session.isExpired() && session.isInGracePeriod()) {
      this.logger.log(`Recovering guest session from grace period (by token): ${session.id}`);
      session.refreshExpiration();
      await this.guestSessionRepo.save(session);
    }

    return session;
  }

  /**
   * Associate a cart with guest session
   *
   * @param sessionUUID - Session UUID
   * @param cartId - Cart ID to associate
   * @returns Updated guest session
   * @throws NotFoundException if session not found
   *
   * @example
   * const session = await service.associateCart('550e8400-...', 789);
   */
  async associateCart(sessionUUID: string, cartId: number): Promise<GuestSession> {
    this.logger.log(`Associating cart ${cartId} with guest session ${sessionUUID}`);

    const session = await this.getSession(sessionUUID);

    // Note: Cart association is handled via the Cart entity's relationship
    // This method serves as a validation point and can trigger business logic

    this.logger.log(`Cart ${cartId} associated with guest session ${sessionUUID}`);
    return session;
  }

  /**
   * Refresh session expiration (sliding window)
   *
   * @param sessionUUID - Session UUID
   * @returns Updated guest session
   * @throws NotFoundException if session not found
   *
   * @example
   * const session = await service.refreshSession('550e8400-...');
   */
  async refreshSession(sessionUUID: string): Promise<GuestSession> {
    this.logger.debug(`Refreshing guest session: ${sessionUUID}`);

    const session = await this.getSession(sessionUUID);
    session.refreshExpiration();

    return await this.guestSessionRepo.save(session);
  }

  /**
   * Convert guest session to user account
   *
   * @param sessionUUID - Session UUID
   * @param userId - User ID after registration/login
   * @returns Updated guest session
   * @throws NotFoundException if session not found
   *
   * @example
   * const session = await service.convertToUser('550e8400-...', 12345);
   */
  async convertToUser(sessionUUID: string, userId: number): Promise<GuestSession> {
    this.logger.log(`Converting guest session ${sessionUUID} to user ${userId}`);

    const session = await this.getSession(sessionUUID);
    session.markAsConverted(userId);

    const updatedSession = await this.guestSessionRepo.save(session);

    this.logger.log(`Guest session ${sessionUUID} converted to user ${userId}`);
    return updatedSession;
  }

  /**
   * Update device fingerprint for session
   *
   * @param sessionUUID - Session UUID
   * @param fingerprint - Updated device fingerprint
   * @returns Updated guest session
   *
   * @example
   * const session = await service.updateDeviceFingerprint('550e8400-...', {...});
   */
  async updateDeviceFingerprint(
    sessionUUID: string,
    fingerprint: DeviceFingerprintDto,
  ): Promise<GuestSession> {
    this.logger.debug(`Updating device fingerprint for session: ${sessionUUID}`);

    const session = await this.getSession(sessionUUID);
    session.deviceFingerprint = fingerprint;

    return await this.guestSessionRepo.save(session);
  }

  /**
   * Clean up expired guest sessions (scheduled task)
   * Runs daily at 2 AM to remove sessions beyond grace period
   *
   * CRON: 0 2 * * * (Every day at 2:00 AM)
   *
   * @returns Number of sessions cleaned up
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupExpiredSessions(): Promise<number> {
    this.logger.log('Starting guest session cleanup job');

    // Calculate grace period cutoff (7 days ago)
    const gracePeriodCutoff = new Date();
    gracePeriodCutoff.setDate(gracePeriodCutoff.getDate() - 37); // 30 days + 7 grace period

    // Find sessions beyond grace period
    const expiredSessions = await this.guestSessionRepo.find({
      where: [
        { expiresAt: LessThan(gracePeriodCutoff), status: 'expired' },
        { expiresAt: LessThan(gracePeriodCutoff), status: 'active' },
      ],
    });

    if (expiredSessions.length === 0) {
      this.logger.log('No expired guest sessions to clean up');
      return 0;
    }

    // Delete expired sessions
    const sessionIds = expiredSessions.map((s) => s.id);
    await this.guestSessionRepo.delete(sessionIds);

    this.logger.log(`Cleaned up ${expiredSessions.length} expired guest sessions`);
    return expiredSessions.length;
  }

  /**
   * Map GuestSession entity to DTO for API responses
   *
   * @param session - GuestSession entity
   * @returns GuestSessionDto for API response
   */
  mapToDto(session: GuestSession): GuestSessionDto {
    return {
      id: session.id,
      sessionToken: session.sessionToken,
      status: session.status,
      isExpired: session.isExpired(),
      isInGracePeriod: session.isInGracePeriod(),
      lastActivityAt: session.lastActivityAt,
      expiresAt: session.expiresAt,
      ipAddress: session.ipAddress,
      deviceFingerprint: session.deviceFingerprint,
      hasCart: !!session.cart,
      convertedUserId: session.convertedUserId,
    };
  }
}
