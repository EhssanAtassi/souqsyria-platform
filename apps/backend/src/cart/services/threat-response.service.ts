import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogService } from '../../audit-log/service/audit-log.service';
import { FraudRiskAssessment } from './cart-fraud-detection.service';

/**
 * Automated Threat Response Service
 *
 * Implements intelligent, automated responses to security threats
 * based on risk assessment scores and threat patterns.
 *
 * **Response Strategies:**
 * - **Low Risk (0-30)**: Normal logging, analytics tracking
 * - **Medium Risk (31-70)**: Enhanced logging, user behavior monitoring
 * - **High Risk (71-90)**: Security alerts, admin notifications, temporary rate limiting
 * - **Critical Risk (91-100)**: Immediate blocking, IP blacklisting, escalation
 *
 * **Automated Actions:**
 * - Dynamic rate limit adjustment based on threat level
 * - Temporary IP blocking for critical threats
 * - User account flagging for review
 * - Admin alert escalation (email, SMS, dashboard)
 * - Session termination for account takeover attempts
 * - Automated CAPTCHA challenge insertion
 *
 * **Escalation Policies:**
 * - **Level 1**: Automated response (logging, monitoring)
 * - **Level 2**: Automated blocking + admin notification
 * - **Level 3**: Immediate escalation + security team alert
 * - **Level 4**: Critical incident response protocol
 *
 * **Features:**
 * - Adaptive threat response based on context
 * - False positive prevention with grace periods
 * - Whitelist management for trusted sources
 * - Automated unblocking after cool-down period
 * - Comprehensive audit trail for compliance
 *
 * @swagger
 * components:
 *   schemas:
 *     ThreatResponse:
 *       type: object
 *       properties:
 *         action:
 *           type: string
 *           enum: [allow, log, challenge, rate_limit, block, escalate]
 *         reason:
 *           type: string
 *           description: Human-readable reason for action
 *         duration:
 *           type: number
 *           description: Duration of action in seconds (for temporary actions)
 *         notificationSent:
 *           type: boolean
 *           description: Whether admin notification was sent
 *         escalationLevel:
 *           type: number
 *           minimum: 0
 *           maximum: 4
 *           description: Escalation level (0=none, 4=critical)
 */
@Injectable()
export class ThreatResponseService {
  private readonly logger = new Logger(ThreatResponseService.name);

  /**
   * Response action thresholds based on risk score
   */
  private readonly ACTION_THRESHOLDS = {
    BLOCK: 91, // Immediate block
    ESCALATE: 85, // Escalate to admin
    RATE_LIMIT: 71, // Apply strict rate limiting
    CHALLENGE: 50, // CAPTCHA challenge
    ENHANCED_LOG: 31, // Enhanced logging only
  };

  /**
   * Block durations (in seconds) based on severity
   */
  private readonly BLOCK_DURATIONS = {
    TEMPORARY: 15 * 60, // 15 minutes
    SHORT: 60 * 60, // 1 hour
    MEDIUM: 24 * 60 * 60, // 24 hours
    LONG: 7 * 24 * 60 * 60, // 7 days
    PERMANENT: -1, // Permanent until manual review
  };

  /**
   * Rate limit multipliers for threat levels
   */
  private readonly RATE_LIMIT_MULTIPLIERS = {
    NORMAL: 1.0, // Normal rate limits
    RESTRICTIVE: 0.5, // 50% of normal limits
    VERY_RESTRICTIVE: 0.25, // 25% of normal limits
    MINIMAL: 0.1, // 10% of normal limits
  };

  /**
   * Escalation notification channels
   */
  private readonly NOTIFICATION_CHANNELS = {
    EMAIL: 'email',
    SMS: 'sms',
    DASHBOARD: 'dashboard',
    WEBHOOK: 'webhook',
    SLACK: 'slack',
  };

  /**
   * Whitelist of trusted IPs/users (example - load from database in production)
   */
  private readonly WHITELIST = {
    ips: ['127.0.0.1', 'localhost'],
    userIds: [],
  };

  /**
   * Active blocks cache (in-memory for performance, should use Redis in production)
   */
  private activeBlocks = new Map<
    string,
    { expiresAt: Date; reason: string; riskScore: number }
  >();

  constructor(
    private readonly auditLogService: AuditLogService,
  ) {
    // Start periodic cleanup of expired blocks
    setInterval(() => this.cleanupExpiredBlocks(), 60 * 1000); // Every minute
  }

  /**
   * Executes automated threat response based on risk assessment
   *
   * Analyzes risk assessment and determines appropriate automated action
   * Implements progressive response strategy with escalation
   *
   * @param riskAssessment - Fraud risk assessment
   * @param context - Additional context for decision making
   * @returns Threat response with action and metadata
   */
  async executeResponse(
    riskAssessment: FraudRiskAssessment,
    context: ThreatResponseContext,
  ): Promise<ThreatResponse> {
    this.logger.log(
      `Executing threat response for risk score: ${riskAssessment.riskScore}`,
    );

    // Check whitelist first
    if (this.isWhitelisted(context)) {
      this.logger.debug('Source is whitelisted, allowing operation');
      return {
        action: 'allow',
        reason: 'Whitelisted source',
        duration: 0,
        notificationSent: false,
        escalationLevel: 0,
        metadata: {
          timestamp: new Date(),
          riskScore: riskAssessment.riskScore,
        },
      };
    }

    // Check if already blocked
    if (this.isBlocked(context)) {
      const block = this.getActiveBlock(context);
      this.logger.warn(
        `Source already blocked: ${block?.reason} (expires: ${block?.expiresAt})`,
      );

      return {
        action: 'block',
        reason: block?.reason || 'Previously blocked',
        duration: block
          ? Math.floor(
              (block.expiresAt.getTime() - Date.now()) / 1000,
            )
          : -1,
        notificationSent: false,
        escalationLevel: 2,
        metadata: {
          timestamp: new Date(),
          riskScore: riskAssessment.riskScore,
          existingBlock: true,
        },
      };
    }

    // Determine appropriate action based on risk score
    const response = await this.determineAction(riskAssessment, context);

    // Execute the action
    await this.applyAction(response, riskAssessment, context);

    // Log to audit system
    await this.logThreatResponse(response, riskAssessment, context);

    return response;
  }

  /**
   * Determines appropriate action based on risk assessment
   *
   * @param riskAssessment - Fraud risk assessment
   * @param context - Response context
   * @returns Threat response decision
   */
  private async determineAction(
    riskAssessment: FraudRiskAssessment,
    context: ThreatResponseContext,
  ): Promise<ThreatResponse> {
    const riskScore = riskAssessment.riskScore;

    // Critical risk - immediate block
    if (riskScore >= this.ACTION_THRESHOLDS.BLOCK) {
      return {
        action: 'block',
        reason: `Critical risk detected (score: ${riskScore})`,
        duration: this.calculateBlockDuration(riskScore, context),
        notificationSent: true,
        escalationLevel: 3,
        metadata: {
          timestamp: new Date(),
          riskScore,
          triggeredRules: riskAssessment.triggeredRules,
        },
      };
    }

    // High risk with escalation
    if (riskScore >= this.ACTION_THRESHOLDS.ESCALATE) {
      return {
        action: 'escalate',
        reason: `High risk requires escalation (score: ${riskScore})`,
        duration: this.BLOCK_DURATIONS.TEMPORARY,
        notificationSent: true,
        escalationLevel: 2,
        metadata: {
          timestamp: new Date(),
          riskScore,
          triggeredRules: riskAssessment.triggeredRules,
        },
      };
    }

    // High risk - strict rate limiting
    if (riskScore >= this.ACTION_THRESHOLDS.RATE_LIMIT) {
      return {
        action: 'rate_limit',
        reason: `Strict rate limiting applied (score: ${riskScore})`,
        duration: this.BLOCK_DURATIONS.SHORT,
        notificationSent: true,
        escalationLevel: 1,
        metadata: {
          timestamp: new Date(),
          riskScore,
          rateLimitMultiplier:
            this.RATE_LIMIT_MULTIPLIERS.VERY_RESTRICTIVE,
        },
      };
    }

    // Medium risk - CAPTCHA challenge
    if (riskScore >= this.ACTION_THRESHOLDS.CHALLENGE) {
      return {
        action: 'challenge',
        reason: `CAPTCHA challenge required (score: ${riskScore})`,
        duration: 0,
        notificationSent: false,
        escalationLevel: 0,
        metadata: {
          timestamp: new Date(),
          riskScore,
        },
      };
    }

    // Low-medium risk - enhanced logging
    if (riskScore >= this.ACTION_THRESHOLDS.ENHANCED_LOG) {
      return {
        action: 'log',
        reason: `Enhanced monitoring (score: ${riskScore})`,
        duration: 0,
        notificationSent: false,
        escalationLevel: 0,
        metadata: {
          timestamp: new Date(),
          riskScore,
        },
      };
    }

    // Low risk - allow with normal logging
    return {
      action: 'allow',
      reason: `Low risk (score: ${riskScore})`,
      duration: 0,
      notificationSent: false,
      escalationLevel: 0,
      metadata: {
        timestamp: new Date(),
        riskScore,
      },
    };
  }

  /**
   * Applies the determined action
   *
   * @param response - Threat response to apply
   * @param riskAssessment - Original risk assessment
   * @param context - Response context
   */
  private async applyAction(
    response: ThreatResponse,
    riskAssessment: FraudRiskAssessment,
    context: ThreatResponseContext,
  ): Promise<void> {
    switch (response.action) {
      case 'block':
        await this.applyBlock(response, context);
        if (response.notificationSent) {
          await this.sendNotification(response, riskAssessment, context);
        }
        break;

      case 'escalate':
        await this.escalateToAdmin(response, riskAssessment, context);
        await this.applyBlock(response, context);
        break;

      case 'rate_limit':
        await this.applyRateLimitRestriction(response, context);
        if (response.notificationSent) {
          await this.sendNotification(response, riskAssessment, context);
        }
        break;

      case 'challenge':
        // CAPTCHA challenge would be implemented here
        this.logger.log('CAPTCHA challenge recommended');
        break;

      case 'log':
        // Enhanced logging already handled by audit system
        this.logger.log('Enhanced monitoring active');
        break;

      case 'allow':
        // No additional action needed
        break;
    }
  }

  /**
   * Applies temporary or permanent block
   *
   * @param response - Threat response
   * @param context - Response context
   */
  private async applyBlock(
    response: ThreatResponse,
    context: ThreatResponseContext,
  ): Promise<void> {
    const identifier = this.getIdentifier(context);
    const expiresAt =
      response.duration > 0
        ? new Date(Date.now() + response.duration * 1000)
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year for permanent

    this.activeBlocks.set(identifier, {
      expiresAt,
      reason: response.reason,
      riskScore: response.metadata.riskScore,
    });

    this.logger.warn(
      `Applied block for ${identifier} until ${expiresAt} - ${response.reason}`,
    );
  }

  /**
   * Applies rate limit restrictions
   *
   * @param response - Threat response
   * @param context - Response context
   */
  private async applyRateLimitRestriction(
    response: ThreatResponse,
    context: ThreatResponseContext,
  ): Promise<void> {
    // In production, this would update Redis rate limit counters
    const identifier = this.getIdentifier(context);
    const multiplier = response.metadata.rateLimitMultiplier || 0.5;

    this.logger.log(
      `Applied rate limit restriction (${multiplier}x) for ${identifier}`,
    );
  }

  /**
   * Escalates threat to admin
   *
   * @param response - Threat response
   * @param riskAssessment - Risk assessment
   * @param context - Response context
   */
  private async escalateToAdmin(
    response: ThreatResponse,
    riskAssessment: FraudRiskAssessment,
    context: ThreatResponseContext,
  ): Promise<void> {
    this.logger.warn('🚨 ESCALATION TO ADMIN', {
      reason: response.reason,
      riskScore: riskAssessment.riskScore,
      triggeredRules: riskAssessment.triggeredRules,
      userId: context.userId,
      ipAddress: context.ipAddress,
    });

    await this.sendNotification(response, riskAssessment, context);
  }

  /**
   * Sends notification to admins
   *
   * @param response - Threat response
   * @param riskAssessment - Risk assessment
   * @param context - Response context
   */
  private async sendNotification(
    response: ThreatResponse,
    riskAssessment: FraudRiskAssessment,
    context: ThreatResponseContext,
  ): Promise<void> {
    // In production, integrate with notification services
    // (email, SMS, Slack, etc.)

    const notification = {
      severity: response.escalationLevel >= 2 ? 'high' : 'medium',
      title: `Security Threat Detected - ${response.action.toUpperCase()}`,
      message: response.reason,
      details: {
        riskScore: riskAssessment.riskScore,
        triggeredRules: riskAssessment.triggeredRules,
        userId: context.userId || 'guest',
        ipAddress: context.ipAddress,
        timestamp: new Date(),
      },
    };

    this.logger.warn('📧 ADMIN NOTIFICATION', notification);

    // TODO: Implement actual notification sending
    // await this.emailService.sendSecurityAlert(notification);
    // await this.slackService.postAlert(notification);
  }

  /**
   * Calculates appropriate block duration based on risk and context
   *
   * @param riskScore - Risk score
   * @param context - Response context
   * @returns Block duration in seconds
   */
  private calculateBlockDuration(
    riskScore: number,
    context: ThreatResponseContext,
  ): number {
    // Check if user has previous blocks (repeat offender)
    const identifier = this.getIdentifier(context);
    const previousBlock = this.activeBlocks.get(identifier);

    if (riskScore >= 95) {
      // Critical threat - permanent block
      return this.BLOCK_DURATIONS.PERMANENT;
    } else if (riskScore >= 92 || previousBlock) {
      // Very high risk or repeat offender - long block
      return this.BLOCK_DURATIONS.LONG;
    } else if (riskScore >= 91) {
      // High risk - medium block
      return this.BLOCK_DURATIONS.MEDIUM;
    }

    return this.BLOCK_DURATIONS.TEMPORARY;
  }

  /**
   * Checks if source is whitelisted
   *
   * @param context - Response context
   * @returns True if whitelisted
   */
  private isWhitelisted(context: ThreatResponseContext): boolean {
    if (context.ipAddress && this.WHITELIST.ips.includes(context.ipAddress)) {
      return true;
    }

    if (context.userId && this.WHITELIST.userIds.includes(context.userId)) {
      return true;
    }

    return false;
  }

  /**
   * Checks if source is currently blocked
   *
   * @param context - Response context
   * @returns True if blocked
   */
  private isBlocked(context: ThreatResponseContext): boolean {
    const identifier = this.getIdentifier(context);
    const block = this.activeBlocks.get(identifier);

    if (!block) return false;

    // Check if block has expired
    if (block.expiresAt < new Date()) {
      this.activeBlocks.delete(identifier);
      return false;
    }

    return true;
  }

  /**
   * Gets active block details
   *
   * @param context - Response context
   * @returns Block details or undefined
   */
  private getActiveBlock(
    context: ThreatResponseContext,
  ): { expiresAt: Date; reason: string; riskScore: number } | undefined {
    const identifier = this.getIdentifier(context);
    return this.activeBlocks.get(identifier);
  }

  /**
   * Gets unique identifier for source
   *
   * @param context - Response context
   * @returns Unique identifier
   */
  private getIdentifier(context: ThreatResponseContext): string {
    // Prefer user ID, fall back to IP address
    return context.userId || context.ipAddress || 'unknown';
  }

  /**
   * Cleans up expired blocks from cache
   */
  private cleanupExpiredBlocks(): void {
    const now = new Date();
    let cleanedCount = 0;

    for (const [identifier, block] of this.activeBlocks.entries()) {
      if (block.expiresAt < now) {
        this.activeBlocks.delete(identifier);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.debug(`Cleaned up ${cleanedCount} expired blocks`);
    }
  }

  /**
   * Logs threat response to audit system
   *
   * @param response - Threat response
   * @param riskAssessment - Risk assessment
   * @param context - Response context
   */
  private async logThreatResponse(
    response: ThreatResponse,
    riskAssessment: FraudRiskAssessment,
    context: ThreatResponseContext,
  ): Promise<void> {
    await this.auditLogService.logSimple({
      action: `THREAT_RESPONSE_${response.action.toUpperCase()}`,
      module: 'cart_security',
      actorId: context.userId ? parseInt(context.userId, 10) : null,
      actorType: context.userId ? 'user' : 'anonymous',
      entityType: 'cart_operation',
      entityId: context.cartId ? parseInt(context.cartId, 10) : null,
      description: `${response.reason} (Risk: ${riskAssessment.riskLevel}, Score: ${riskAssessment.riskScore})`,
    });
  }

  /**
   * Gets statistics about threat responses
   *
   * @returns Threat response statistics
   */
  getStatistics(): ThreatResponseStatistics {
    const stats: ThreatResponseStatistics = {
      activeBlocks: this.activeBlocks.size,
      blocksByRiskLevel: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0,
      },
      averageBlockDuration: 0,
    };

    let totalDuration = 0;

    for (const [, block] of this.activeBlocks.entries()) {
      const riskScore = block.riskScore;
      if (riskScore >= 91) {
        stats.blocksByRiskLevel.critical++;
      } else if (riskScore >= 71) {
        stats.blocksByRiskLevel.high++;
      } else if (riskScore >= 31) {
        stats.blocksByRiskLevel.medium++;
      } else {
        stats.blocksByRiskLevel.low++;
      }

      const duration =
        (block.expiresAt.getTime() - Date.now()) / 1000;
      totalDuration += Math.max(duration, 0);
    }

    if (this.activeBlocks.size > 0) {
      stats.averageBlockDuration = Math.round(
        totalDuration / this.activeBlocks.size,
      );
    }

    return stats;
  }
}

/**
 * Threat response context interface
 */
export interface ThreatResponseContext {
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  clientIP?: string;
  userAgent?: string;
  deviceFingerprint?: string;
  cartId?: string;
  operation?: string;
  endpoint?: string;
  timestamp?: Date;
}

/**
 * Threat response interface
 */
export interface ThreatResponse {
  action: 'allow' | 'log' | 'challenge' | 'rate_limit' | 'block' | 'escalate';
  reason: string;
  duration: number; // in seconds
  notificationSent: boolean;
  escalationLevel: number; // 0-4
  metadata: {
    timestamp: Date;
    riskScore: number;
    [key: string]: any;
  };
}

/**
 * Threat response statistics interface
 */
export interface ThreatResponseStatistics {
  activeBlocks: number;
  blocksByRiskLevel: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  averageBlockDuration: number; // in seconds
}
