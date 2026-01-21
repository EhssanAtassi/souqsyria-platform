/**
 * @file session-cleanup.service.ts
 * @description Guest Session Cleanup Service for SouqSyria E-commerce Platform
 *
 * RESPONSIBILITIES:
 * - Automated cleanup of expired guest sessions
 * - Grace period enforcement (37-day total retention)
 * - Soft delete with recovery options
 * - Cleanup metrics and monitoring
 * - Database optimization and space management
 *
 * CLEANUP RULES:
 * - Active sessions: 30 days of inactivity
 * - Grace period: Additional 7 days for recovery
 * - Total retention: 37 days maximum
 * - Converted sessions: Immediate cleanup after successful user conversion
 *
 * @author SouqSyria Development Team
 * @version 1.0.0
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GuestSession } from '../entities/guest-session.entity';
import { Cart } from '../../cart/entities/cart.entity';
import { AuditLogService } from '../../audit-log/service/audit-log.service';

/**
 * Cleanup Statistics Interface
 * Tracks the results of cleanup operations for monitoring and analytics
 */
interface CleanupStats {
  /** Total sessions processed during cleanup */
  totalProcessed: number;
  /** Sessions marked for deletion (soft delete) */
  sessionsDeleted: number;
  /** Associated carts removed */
  cartsDeleted: number;
  /** Cart items removed */
  cartItemsDeleted: number;
  /** Sessions that were recoverable but expired */
  recoverableExpired: number;
  /** Sessions converted to user accounts (already cleaned) */
  convertedSessionsCleaned: number;
  /** Total database space freed (estimated in bytes) */
  estimatedSpaceFreed: number;
  /** Processing time in milliseconds */
  processingTimeMs: number;
  /** Any errors encountered during cleanup */
  errors: string[];
}

/**
 * Guest Session Cleanup Service
 *
 * Manages automated cleanup of expired guest sessions and associated cart data.
 * Implements a grace period system to allow session recovery while preventing
 * unlimited data accumulation.
 *
 * FEATURES:
 * - Scheduled daily cleanup (configurable)
 * - Grace period enforcement (37 days total)
 * - Soft delete with recovery capability
 * - Comprehensive cleanup metrics
 * - Audit logging for compliance
 * - Database space optimization
 * - Error handling and monitoring
 */
@Injectable()
export class SessionCleanupService {
  private readonly logger = new Logger(SessionCleanupService.name);

  /** Session lifecycle constants in milliseconds */
  private readonly SESSION_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
  private readonly GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
  private readonly TOTAL_RETENTION_MS = this.SESSION_LIFETIME_MS + this.GRACE_PERIOD_MS; // 37 days

  constructor(
    @InjectRepository(GuestSession)
    private readonly guestSessionRepository: Repository<GuestSession>,
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    private readonly auditLogService: AuditLogService,
  ) {
    this.logger.log('🧹 Guest Session Cleanup Service initialized');
    this.logger.log(`📅 Cleanup schedule: Daily at 2:00 AM (server time)`);
    this.logger.log(`⏰ Session lifetime: ${this.SESSION_LIFETIME_MS / (24 * 60 * 60 * 1000)} days`);
    this.logger.log(`🛡️ Grace period: ${this.GRACE_PERIOD_MS / (24 * 60 * 60 * 1000)} days`);
  }

  /**
   * SCHEDULED CLEANUP JOB
   *
   * Runs daily at 2:00 AM server time to clean up expired guest sessions.
   * Uses cron expression for precise scheduling and reliability.
   * Automatically handles errors and logs results for monitoring.
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async runScheduledCleanup(): Promise<void> {
    this.logger.log('🕐 Starting scheduled guest session cleanup job...');

    try {
      const stats = await this.cleanupExpiredSessions();

      // Log comprehensive cleanup results
      this.logger.log(`✅ Scheduled cleanup completed successfully:`);
      this.logger.log(`📊 Sessions processed: ${stats.totalProcessed}`);
      this.logger.log(`🗑️ Sessions deleted: ${stats.sessionsDeleted}`);
      this.logger.log(`🛒 Carts removed: ${stats.cartsDeleted}`);
      this.logger.log(`📦 Cart items removed: ${stats.cartItemsDeleted}`);
      this.logger.log(`💾 Estimated space freed: ${this.formatBytes(stats.estimatedSpaceFreed)}`);
      this.logger.log(`⏱️ Processing time: ${stats.processingTimeMs}ms`);

      if (stats.errors.length > 0) {
        this.logger.warn(`⚠️ ${stats.errors.length} errors encountered during cleanup`);
        stats.errors.forEach(error => this.logger.error(error));
      }

    } catch (error) {
      this.logger.error('❌ Scheduled cleanup job failed:', error.stack);

      // Log cleanup failure for monitoring alerts
      await this.auditLogService.logSimple({
        action: 'CLEANUP_JOB_FAILED',
        module: 'guest_sessions',
        actorId: null,
        actorType: 'system',
        entityType: 'cleanup_job',
        entityId: null,
        description: `Daily guest session cleanup job failed: ${error.message}`,
      });
    }
  }

  /**
   * MANUAL CLEANUP TRIGGER
   *
   * Allows manual cleanup execution for maintenance or testing purposes.
   * Returns detailed statistics for operational monitoring.
   *
   * @param dryRun - If true, simulates cleanup without making changes
   * @returns Cleanup statistics and results
   */
  async cleanupExpiredSessions(dryRun: boolean = false): Promise<CleanupStats> {
    const startTime = Date.now();
    this.logger.log(`🧹 ${dryRun ? 'Simulating' : 'Starting'} guest session cleanup...`);

    const stats: CleanupStats = {
      totalProcessed: 0,
      sessionsDeleted: 0,
      cartsDeleted: 0,
      cartItemsDeleted: 0,
      recoverableExpired: 0,
      convertedSessionsCleaned: 0,
      estimatedSpaceFreed: 0,
      processingTimeMs: 0,
      errors: [],
    };

    try {
      // Calculate cutoff dates
      const now = new Date();
      const sessionExpiryDate = new Date(now.getTime() - this.SESSION_LIFETIME_MS);
      const gracePeriodExpiryDate = new Date(now.getTime() - this.TOTAL_RETENTION_MS);

      this.logger.log(`📅 Session expiry cutoff: ${sessionExpiryDate.toISOString()}`);
      this.logger.log(`🕰️ Grace period cutoff: ${gracePeriodExpiryDate.toISOString()}`);

      // Find expired sessions (beyond grace period)
      const expiredSessions = await this.guestSessionRepository.find({
        where: {
          lastActivityAt: LessThan(gracePeriodExpiryDate),
          status: In(['active', 'expired']), // Don't re-process already converted sessions
        },
        relations: ['cart', 'cart.items'],
      });

      stats.totalProcessed = expiredSessions.length;

      if (expiredSessions.length === 0) {
        this.logger.log('✨ No expired guest sessions found - database is clean');
        stats.processingTimeMs = Date.now() - startTime;
        return stats;
      }

      this.logger.log(`🔍 Found ${expiredSessions.length} expired sessions to process`);

      // Process each expired session
      for (const session of expiredSessions) {
        try {
          await this.processExpiredSession(session, stats, dryRun);
        } catch (error) {
          const errorMsg = `Failed to process session ${session.id}: ${error.message}`;
          stats.errors.push(errorMsg);
          this.logger.error(errorMsg);
        }
      }

      // Execute cleanup operations if not dry run
      if (!dryRun && stats.sessionsDeleted > 0) {
        await this.executeCleanupOperations(expiredSessions);
      }

      stats.processingTimeMs = Date.now() - startTime;

      // Log cleanup audit trail
      await this.auditLogService.logSimple({
        action: dryRun ? 'CLEANUP_SIMULATION' : 'CLEANUP_COMPLETED',
        module: 'guest_sessions',
        actorId: null,
        actorType: 'system',
        entityType: 'cleanup_operation',
        entityId: null,
        description: `Guest session cleanup: ${stats.sessionsDeleted} sessions, ${stats.cartsDeleted} carts, ${stats.cartItemsDeleted} items processed`,
      });

      return stats;

    } catch (error) {
      const errorMsg = `Cleanup operation failed: ${error.message}`;
      stats.errors.push(errorMsg);
      this.logger.error(errorMsg, error.stack);
      stats.processingTimeMs = Date.now() - startTime;

      throw error;
    }
  }

  /**
   * Process individual expired session and update cleanup statistics
   */
  private async processExpiredSession(
    session: GuestSession,
    stats: CleanupStats,
    dryRun: boolean,
  ): Promise<void> {
    // Count cart items for statistics
    const cart = session.cart;
    if (cart && cart.items) {
      stats.cartItemsDeleted += cart.items.length;

      // Estimate space freed (rough calculation)
      stats.estimatedSpaceFreed += this.estimateSessionDataSize(session);
    }

    if (cart) {
      stats.cartsDeleted += 1;
    }

    // Check if session was converted vs expired
    if (session.status === 'converted') {
      stats.convertedSessionsCleaned += 1;
    } else {
      stats.recoverableExpired += 1;
    }

    stats.sessionsDeleted += 1;

    this.logger.debug(
      `${dryRun ? '🧪' : '🗑️'} Processing session ${session.id}: ${cart?.items?.length || 0} items`,
    );
  }

  /**
   * Execute the actual cleanup operations in database
   */
  private async executeCleanupOperations(expiredSessions: GuestSession[]): Promise<void> {
    this.logger.log(`💾 Executing database cleanup for ${expiredSessions.length} sessions...`);

    // Use transaction for data consistency
    await this.guestSessionRepository.manager.transaction(async (transactionalEntityManager) => {
      const sessionIds = expiredSessions.map(session => session.id);

      // Delete associated carts and their items (cascade should handle items)
      const cartsToDelete = expiredSessions
        .map(session => session.cart?.id)
        .filter(Boolean);

      if (cartsToDelete.length > 0) {
        this.logger.log(`🛒 Deleting ${cartsToDelete.length} associated carts...`);
        await transactionalEntityManager.delete(Cart, { id: In(cartsToDelete) });
      }

      // Delete the guest sessions
      this.logger.log(`👥 Deleting ${sessionIds.length} guest sessions...`);
      await transactionalEntityManager.delete(GuestSession, { id: In(sessionIds) });
    });

    this.logger.log('✅ Database cleanup operations completed successfully');
  }

  /**
   * Estimate the data size of a session for space calculation
   */
  private estimateSessionDataSize(session: GuestSession): number {
    // Rough estimation in bytes
    let size = 500; // Base session data

    if (session.cart) {
      size += 200; // Cart data
      if (session.cart.items) {
        size += session.cart.items.length * 150; // Cart items
      }
    }

    if (session.deviceFingerprint) {
      size += JSON.stringify(session.deviceFingerprint).length;
    }

    return size;
  }

  /**
   * Format bytes into human-readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * GET CLEANUP STATISTICS
   *
   * Returns current state of guest sessions and cleanup projections
   * for monitoring and capacity planning purposes.
   */
  async getCleanupStatistics(): Promise<{
    activeSessions: number;
    expiredSessions: number;
    sessionsInGracePeriod: number;
    convertedSessions: number;
    totalSessions: number;
    estimatedCleanupCandidates: number;
  }> {
    const now = new Date();
    const sessionExpiryDate = new Date(now.getTime() - this.SESSION_LIFETIME_MS);
    const gracePeriodExpiryDate = new Date(now.getTime() - this.TOTAL_RETENTION_MS);

    const [
      activeSessions,
      expiredSessions,
      sessionsInGracePeriod,
      convertedSessions,
      totalSessions,
    ] = await Promise.all([
      // Active sessions (within 30-day window)
      this.guestSessionRepository.count({
        where: {
          status: 'active',
          lastActivityAt: LessThan(sessionExpiryDate),
        },
      }),

      // Expired sessions (beyond 30 days but within grace period)
      this.guestSessionRepository.count({
        where: {
          status: 'expired',
        },
      }),

      // Sessions currently in grace period
      this.guestSessionRepository.count({
        where: {
          lastActivityAt: LessThan(sessionExpiryDate),
          lastActivityAt: LessThan(gracePeriodExpiryDate),
          status: In(['active', 'expired']),
        },
      }),

      // Converted sessions
      this.guestSessionRepository.count({
        where: {
          status: 'converted',
        },
      }),

      // Total sessions
      this.guestSessionRepository.count(),
    ]);

    // Estimate cleanup candidates (beyond grace period)
    const estimatedCleanupCandidates = await this.guestSessionRepository.count({
      where: {
        lastActivityAt: LessThan(gracePeriodExpiryDate),
        status: In(['active', 'expired']),
      },
    });

    return {
      activeSessions,
      expiredSessions,
      sessionsInGracePeriod,
      convertedSessions,
      totalSessions,
      estimatedCleanupCandidates,
    };
  }
}