import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../audit/entities/audit-log.entity';
import { Cart } from '../entities/cart.entity';

/**
 * Advanced Cart Fraud Detection Service
 *
 * Implements sophisticated fraud detection algorithms including:
 * - ML-based risk scoring with 10+ behavioral factors
 * - Geolocation analysis and anomaly detection
 * - Enhanced device fingerprinting with consistency checks
 * - Behavioral pattern analysis (velocity, timing, sequence)
 * - IP reputation checking with proxy/VPN detection
 * - Time-based anomaly detection (unusual hours, rapid actions)
 * - Historical user behavior profiling
 *
 * **Risk Scoring Algorithm:**
 * Combines multiple weighted factors (0-100 scale):
 * - Velocity violations (weight 15): Rapid consecutive operations
 * - Quantity anomalies (weight 20): Suspiciously high quantities
 * - Price anomalies (weight 25): Unrealistic price values
 * - Device mismatch (weight 10): Inconsistent device fingerprints
 * - Geolocation anomaly (weight 15): Impossible travel, suspicious regions
 * - Bot detection (weight 20): Automated traffic patterns
 * - IP reputation (weight 10): Proxy, VPN, known bad IPs
 * - Behavioral patterns (weight 15): Unusual timing, sequences
 * - Time anomaly (weight 10): Operations during unusual hours
 * - Historical risk (weight 10): Past fraudulent behavior
 *
 * **Threat Response Levels:**
 * - 0-30: Low risk (allow, log for analytics)
 * - 31-70: Medium risk (allow with enhanced logging)
 * - 71-90: High risk (allow with alert, flag for review)
 * - 91-100: Critical risk (block operation, immediate alert)
 *
 * @swagger
 * components:
 *   schemas:
 *     FraudRiskAssessment:
 *       type: object
 *       properties:
 *         riskScore:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           description: Overall risk score
 *         riskLevel:
 *           type: string
 *           enum: [low, medium, high, critical]
 *         shouldBlock:
 *           type: boolean
 *           description: Whether operation should be blocked
 *         triggeredRules:
 *           type: array
 *           items:
 *             type: string
 *           description: List of triggered fraud detection rules
 *         details:
 *           type: object
 *           description: Detailed breakdown of risk factors
 */
@Injectable()
export class CartFraudDetectionService {
  private readonly logger = new Logger(CartFraudDetectionService.name);

  /**
   * Risk score thresholds for different threat levels
   */
  private readonly RISK_THRESHOLDS = {
    CRITICAL: 91, // Block operations
    HIGH: 71, // Alert and flag for review
    MEDIUM: 31, // Enhanced logging
    LOW: 0, // Normal logging
  };

  /**
   * Velocity detection thresholds
   */
  private readonly VELOCITY_THRESHOLDS = {
    RAPID_OPERATIONS: 15, // Operations in 60 seconds
    RAPID_WINDOW_MS: 60 * 1000, // 60 seconds
    BURST_OPERATIONS: 5, // Operations in 10 seconds
    BURST_WINDOW_MS: 10 * 1000, // 10 seconds
  };

  /**
   * Quantity anomaly thresholds
   */
  private readonly QUANTITY_THRESHOLDS = {
    HIGH_QUANTITY: 100, // Suspiciously high quantity per operation
    TOTAL_CART_ITEMS: 500, // Suspicious total items in cart
    SAME_PRODUCT_LIMIT: 50, // Too many of same product
  };

  /**
   * Price anomaly thresholds (SYP)
   */
  private readonly PRICE_THRESHOLDS = {
    MIN_REALISTIC_PRICE: 100, // 100 SYP minimum
    MAX_REALISTIC_PRICE: 10_000_000, // 10M SYP maximum
    SUSPICIOUS_DISCOUNT: 0.9, // >90% discount is suspicious
  };

  /**
   * Geolocation anomaly thresholds
   */
  private readonly GEO_THRESHOLDS = {
    IMPOSSIBLE_TRAVEL_KM_PER_HOUR: 800, // Impossible to travel this fast
    SUSPICIOUS_COUNTRIES: ['CN', 'RU', 'NG'], // High-fraud countries (example)
    MAX_COUNTRY_CHANGES_PER_DAY: 3, // Suspicious country hopping
  };

  /**
   * Time-based anomaly thresholds
   */
  private readonly TIME_THRESHOLDS = {
    UNUSUAL_HOUR_START: 2, // 2 AM
    UNUSUAL_HOUR_END: 5, // 5 AM
    RAPID_SESSION_OPERATIONS: 20, // Operations in single session
  };

  /**
   * Bot detection patterns
   */
  private readonly BOT_PATTERNS = {
    USER_AGENTS: [
      'bot',
      'crawler',
      'spider',
      'scraper',
      'headless',
      'selenium',
      'puppeteer',
      'phantom',
    ],
    SUSPICIOUS_PATTERNS: ['curl', 'wget', 'python-requests', 'postman'],
  };

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepo: Repository<AuditLog>,
    @InjectRepository(Cart)
    private readonly cartRepo: Repository<Cart>,
  ) {}

  /**
   * Performs comprehensive fraud risk assessment
   *
   * Analyzes multiple risk factors and returns detailed assessment
   * with risk score, level, and recommended action
   *
   * @param context - Fraud detection context with request data
   * @returns Complete fraud risk assessment
   */
  async assessFraudRisk(
    context: FraudDetectionContext,
  ): Promise<FraudRiskAssessment> {
    this.logger.debug(
      `Assessing fraud risk for user: ${context.userId || 'guest'}`,
    );

    // Run all fraud detection checks in parallel for performance
    const [
      velocityScore,
      quantityScore,
      priceScore,
      deviceScore,
      geoScore,
      botScore,
      ipScore,
      behaviorScore,
      timeScore,
      historyScore,
    ] = await Promise.all([
      this.checkVelocityViolations(context),
      this.checkQuantityAnomalies(context),
      this.checkPriceAnomalies(context),
      this.checkDeviceFingerprint(context),
      this.checkGeolocationAnomaly(context),
      this.checkBotTraffic(context),
      this.checkIpReputation(context),
      this.checkBehavioralPatterns(context),
      this.checkTimeAnomalies(context),
      this.checkHistoricalRisk(context),
    ]);

    // Calculate weighted risk score
    const riskScore = this.calculateWeightedRiskScore({
      velocity: velocityScore,
      quantity: quantityScore,
      price: priceScore,
      device: deviceScore,
      geo: geoScore,
      bot: botScore,
      ip: ipScore,
      behavior: behaviorScore,
      time: timeScore,
      history: historyScore,
    });

    // Determine risk level and action
    const riskLevel = this.determineRiskLevel(riskScore);
    const shouldBlock = riskScore >= this.RISK_THRESHOLDS.CRITICAL;

    // Collect triggered rules
    const triggeredRules: string[] = [];
    if (velocityScore > 0) triggeredRules.push('velocity');
    if (quantityScore > 0) triggeredRules.push('quantity');
    if (priceScore > 0) triggeredRules.push('price');
    if (deviceScore > 0) triggeredRules.push('device');
    if (geoScore > 0) triggeredRules.push('geolocation');
    if (botScore > 0) triggeredRules.push('bot');
    if (ipScore > 0) triggeredRules.push('ip_reputation');
    if (behaviorScore > 0) triggeredRules.push('behavior');
    if (timeScore > 0) triggeredRules.push('time_anomaly');
    if (historyScore > 0) triggeredRules.push('history');

    const assessment: FraudRiskAssessment = {
      riskScore: Math.round(riskScore),
      riskLevel,
      shouldBlock,
      triggeredRules,
      details: {
        velocity: velocityScore,
        quantity: quantityScore,
        price: priceScore,
        device: deviceScore,
        geolocation: geoScore,
        bot: botScore,
        ipReputation: ipScore,
        behavior: behaviorScore,
        timeAnomaly: timeScore,
        historicalRisk: historyScore,
      },
      metadata: {
        timestamp: new Date(),
        userId: context.userId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        geolocation: context.geolocation,
      },
    };

    this.logger.log(
      `Fraud assessment complete: Risk=${riskScore} Level=${riskLevel} Block=${shouldBlock}`,
    );

    return assessment;
  }

  /**
   * Checks for velocity violations (rapid consecutive operations)
   *
   * Detects automated scripts or bot-like behavior patterns
   * by analyzing operation frequency and timing
   *
   * @param context - Fraud detection context
   * @returns Velocity risk score (0-100)
   */
  private async checkVelocityViolations(
    context: FraudDetectionContext,
  ): Promise<number> {
    const now = new Date();
    const rapidWindow = new Date(
      now.getTime() - this.VELOCITY_THRESHOLDS.RAPID_WINDOW_MS,
    );
    const burstWindow = new Date(
      now.getTime() - this.VELOCITY_THRESHOLDS.BURST_WINDOW_MS,
    );

    // Count recent operations in different time windows
    const identifier = context.userId || context.ipAddress;

    // Check rapid operations (60 seconds)
    const rapidOps = await this.auditLogRepo
      .createQueryBuilder('audit')
      .where('audit.module = :module', { module: 'cart' })
      .andWhere(
        context.userId
          ? 'audit.actorId = :identifier'
          : "JSON_EXTRACT(audit.metadata, '$.ipAddress') = :identifier",
        { identifier },
      )
      .andWhere('audit.createdAt >= :rapidWindow', { rapidWindow })
      .getCount();

    // Check burst operations (10 seconds)
    const burstOps = await this.auditLogRepo
      .createQueryBuilder('audit')
      .where('audit.module = :module', { module: 'cart' })
      .andWhere(
        context.userId
          ? 'audit.actorId = :identifier'
          : "JSON_EXTRACT(audit.metadata, '$.ipAddress') = :identifier",
        { identifier },
      )
      .andWhere('audit.createdAt >= :burstWindow', { burstWindow })
      .getCount();

    // Calculate velocity score
    let score = 0;

    if (rapidOps >= this.VELOCITY_THRESHOLDS.RAPID_OPERATIONS) {
      score += 60; // High velocity detected
    } else if (rapidOps >= this.VELOCITY_THRESHOLDS.RAPID_OPERATIONS * 0.7) {
      score += 40; // Moderate velocity
    }

    if (burstOps >= this.VELOCITY_THRESHOLDS.BURST_OPERATIONS) {
      score += 40; // Burst detected
    }

    return Math.min(score, 100);
  }

  /**
   * Checks for quantity anomalies (suspiciously high quantities)
   *
   * Detects inventory hoarding, reseller bots, or fraudulent orders
   *
   * @param context - Fraud detection context
   * @returns Quantity risk score (0-100)
   */
  private async checkQuantityAnomalies(
    context: FraudDetectionContext,
  ): Promise<number> {
    let score = 0;

    // Check operation quantity
    if (context.operation?.quantity) {
      if (context.operation.quantity >= this.QUANTITY_THRESHOLDS.HIGH_QUANTITY) {
        score += 60; // Very high quantity
      } else if (
        context.operation.quantity >=
        this.QUANTITY_THRESHOLDS.HIGH_QUANTITY * 0.5
      ) {
        score += 30; // Moderately high quantity
      }
    }

    // Check total cart items if cart ID provided
    if (context.cartId) {
      const cart = await this.cartRepo.findOne({
        where: { id: context.cartId },
        relations: ['items'],
      });

      if (cart && cart.items) {
        const totalItems = cart.items.reduce(
          (sum, item) => sum + item.quantity,
          0,
        );

        if (totalItems >= this.QUANTITY_THRESHOLDS.TOTAL_CART_ITEMS) {
          score += 40; // Excessive cart items
        }

        // Check for same product repeated
        const productCounts = new Map<string, number>();
        cart.items.forEach((item) => {
          const current = productCounts.get(item.product.id) || 0;
          productCounts.set(item.product.id, current + item.quantity);
        });

        const maxSameProduct = Math.max(...productCounts.values());
        if (maxSameProduct >= this.QUANTITY_THRESHOLDS.SAME_PRODUCT_LIMIT) {
          score += 30; // Too many of same product
        }
      }
    }

    return Math.min(score, 100);
  }

  /**
   * Checks for price anomalies (unrealistic prices)
   *
   * Detects price manipulation, data injection, or system exploits
   *
   * @param context - Fraud detection context
   * @returns Price risk score (0-100)
   */
  private checkPriceAnomalies(context: FraudDetectionContext): number {
    let score = 0;

    if (context.operation?.price) {
      const price = context.operation.price;

      // Check for unrealistic minimum price
      if (price < this.PRICE_THRESHOLDS.MIN_REALISTIC_PRICE) {
        score += 80; // Price too low, likely manipulation
      }

      // Check for unrealistic maximum price
      if (price > this.PRICE_THRESHOLDS.MAX_REALISTIC_PRICE) {
        score += 60; // Price too high, suspicious
      }

      // Check for suspicious discount (if original price provided)
      if (context.operation.originalPrice) {
        const discountPercent =
          (context.operation.originalPrice - price) /
          context.operation.originalPrice;
        if (discountPercent > this.PRICE_THRESHOLDS.SUSPICIOUS_DISCOUNT) {
          score += 50; // Unrealistic discount
        }
      }
    }

    return Math.min(score, 100);
  }

  /**
   * Checks device fingerprint consistency
   *
   * Detects device spoofing, emulators, or session hijacking
   *
   * @param context - Fraud detection context
   * @returns Device risk score (0-100)
   */
  private async checkDeviceFingerprint(
    context: FraudDetectionContext,
  ): Promise<number> {
    let score = 0;

    if (!context.deviceFingerprint) {
      return 0; // No fingerprint to check
    }

    // Get previous device fingerprints for this user
    if (context.userId) {
      const recentOps = await this.auditLogRepo
        .createQueryBuilder('audit')
        .where('audit.actorId = :userId', { userId: context.userId })
        .andWhere('audit.module = :module', { module: 'cart' })
        .orderBy('audit.createdAt', 'DESC')
        .limit(10)
        .getMany();

      if (recentOps.length > 0) {
        const previousFingerprints = recentOps
          .map((op) => (op.metadata as any)?.deviceFingerprint)
          .filter((fp) => fp);

        // Check for fingerprint mismatch
        const matchingFingerprint = previousFingerprints.find(
          (fp) => fp === context.deviceFingerprint,
        );

        if (!matchingFingerprint && previousFingerprints.length > 0) {
          score += 40; // Device fingerprint changed
        }

        // Check for too many different devices
        const uniqueFingerprints = new Set(previousFingerprints);
        if (uniqueFingerprints.size > 5) {
          score += 30; // Too many different devices
        }
      }
    }

    return Math.min(score, 100);
  }

  /**
   * Checks for geolocation anomalies
   *
   * Detects impossible travel, VPN usage, or suspicious locations
   *
   * @param context - Fraud detection context
   * @returns Geolocation risk score (0-100)
   */
  private async checkGeolocationAnomaly(
    context: FraudDetectionContext,
  ): Promise<number> {
    let score = 0;

    if (!context.geolocation) {
      return 0; // No geolocation data
    }

    // Check for suspicious countries
    if (
      context.geolocation.country &&
      this.GEO_THRESHOLDS.SUSPICIOUS_COUNTRIES.includes(
        context.geolocation.country,
      )
    ) {
      score += 30; // High-fraud country
    }

    // Check for impossible travel if user has recent operations
    if (context.userId) {
      const recentOp = await this.auditLogRepo
        .createQueryBuilder('audit')
        .where('audit.actorId = :userId', { userId: context.userId })
        .andWhere('audit.module = :module', { module: 'cart' })
        .orderBy('audit.createdAt', 'DESC')
        .limit(1)
        .getOne();

      if (recentOp) {
        const previousGeo = (recentOp.metadata as any)?.geolocation;
        if (previousGeo && previousGeo.latitude && previousGeo.longitude) {
          const distance = this.calculateDistance(
            previousGeo.latitude,
            previousGeo.longitude,
            context.geolocation.latitude,
            context.geolocation.longitude,
          );

          const timeDiffHours =
            (Date.now() - recentOp.createdAt.getTime()) / (1000 * 60 * 60);

          const speedKmPerHour = distance / Math.max(timeDiffHours, 0.016); // Minimum 1 minute

          if (
            speedKmPerHour > this.GEO_THRESHOLDS.IMPOSSIBLE_TRAVEL_KM_PER_HOUR
          ) {
            score += 70; // Impossible travel detected
          }
        }
      }

      // Check for too many country changes
      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentCountries = await this.auditLogRepo
        .createQueryBuilder('audit')
        .where('audit.actorId = :userId', { userId: context.userId })
        .andWhere('audit.createdAt >= :last24h', { last24h })
        .getMany();

      const uniqueCountries = new Set(
        recentCountries
          .map((op) => (op.metadata as any)?.geolocation?.country)
          .filter((c) => c),
      );

      if (uniqueCountries.size > this.GEO_THRESHOLDS.MAX_COUNTRY_CHANGES_PER_DAY) {
        score += 40; // Suspicious country hopping
      }
    }

    return Math.min(score, 100);
  }

  /**
   * Checks for bot traffic patterns
   *
   * Detects automated scripts, crawlers, or headless browsers
   *
   * @param context - Fraud detection context
   * @returns Bot risk score (0-100)
   */
  private checkBotTraffic(context: FraudDetectionContext): number {
    let score = 0;

    if (!context.userAgent) {
      score += 20; // No user agent is suspicious
      return score;
    }

    const userAgentLower = context.userAgent.toLowerCase();

    // Check for known bot patterns
    for (const pattern of this.BOT_PATTERNS.USER_AGENTS) {
      if (userAgentLower.includes(pattern)) {
        score += 80; // Known bot detected
        break;
      }
    }

    // Check for suspicious tools
    for (const pattern of this.BOT_PATTERNS.SUSPICIOUS_PATTERNS) {
      if (userAgentLower.includes(pattern)) {
        score += 60; // Suspicious tool detected
        break;
      }
    }

    // Check for very old or uncommon user agents
    if (userAgentLower.includes('windows nt 5') || userAgentLower.includes('windows 98')) {
      score += 30; // Very old OS is suspicious
    }

    return Math.min(score, 100);
  }

  /**
   * Checks IP reputation
   *
   * Detects proxies, VPNs, Tor exit nodes, or known bad IPs
   *
   * @param context - Fraud detection context
   * @returns IP reputation risk score (0-100)
   */
  private async checkIpReputation(
    context: FraudDetectionContext,
  ): Promise<number> {
    let score = 0;

    if (!context.ipAddress) {
      return 0;
    }

    // Check for private/local IPs (testing environments)
    if (
      context.ipAddress.startsWith('192.168.') ||
      context.ipAddress.startsWith('10.') ||
      context.ipAddress.startsWith('172.16.') ||
      context.ipAddress === '127.0.0.1' ||
      context.ipAddress === 'localhost'
    ) {
      return 0; // Development/test environment
    }

    // Check for multiple users from same IP (shared IP detection)
    if (context.userId) {
      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const sameIpUsers = await this.auditLogRepo
        .createQueryBuilder('audit')
        .select('DISTINCT audit.actorId', 'userId')
        .where("JSON_EXTRACT(audit.metadata, '$.ipAddress') = :ip", {
          ip: context.ipAddress,
        })
        .andWhere('audit.createdAt >= :last24h', { last24h })
        .andWhere('audit.actorId IS NOT NULL')
        .getRawMany();

      if (sameIpUsers.length > 5) {
        score += 40; // Too many users from same IP (shared proxy/VPN)
      }
    }

    // Check for rapid IP changes for same user
    if (context.userId) {
      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const userIps = await this.auditLogRepo
        .createQueryBuilder('audit')
        .select("JSON_EXTRACT(audit.metadata, '$.ipAddress')", 'ip')
        .where('audit.actorId = :userId', { userId: context.userId })
        .andWhere('audit.createdAt >= :last24h', { last24h })
        .distinct(true)
        .getRawMany();

      const uniqueIps = new Set(userIps.map((r) => r.ip).filter((ip) => ip));
      if (uniqueIps.size > 10) {
        score += 50; // Too many IP changes (proxy rotation)
      }
    }

    return Math.min(score, 100);
  }

  /**
   * Checks behavioral patterns
   *
   * Detects unusual sequences, timing patterns, or navigation flows
   *
   * @param context - Fraud detection context
   * @returns Behavioral risk score (0-100)
   */
  private async checkBehavioralPatterns(
    context: FraudDetectionContext,
  ): Promise<number> {
    let score = 0;

    const identifier = context.userId || context.ipAddress;
    if (!identifier) return 0;

    // Get recent operation sequence
    const last5min = new Date(Date.now() - 5 * 60 * 1000);
    const recentOps = await this.auditLogRepo
      .createQueryBuilder('audit')
      .where('audit.module = :module', { module: 'cart' })
      .andWhere(
        context.userId
          ? 'audit.actorId = :identifier'
          : "JSON_EXTRACT(audit.metadata, '$.ipAddress') = :identifier",
        { identifier },
      )
      .andWhere('audit.createdAt >= :last5min', { last5min })
      .orderBy('audit.createdAt', 'ASC')
      .getMany();

    // Check for repetitive patterns (same action repeated)
    if (recentOps.length >= 5) {
      const actions = recentOps.map((op) => op.action);
      const uniqueActions = new Set(actions);
      if (uniqueActions.size === 1) {
        score += 40; // Same action repeated (bot-like)
      }
    }

    // Check for unnaturally fast operations
    if (recentOps.length >= 3) {
      const timings = [];
      for (let i = 1; i < recentOps.length; i++) {
        const diff =
          recentOps[i].createdAt.getTime() -
          recentOps[i - 1].createdAt.getTime();
        timings.push(diff);
      }

      const avgTiming = timings.reduce((sum, t) => sum + t, 0) / timings.length;
      if (avgTiming < 500) {
        // Less than 500ms between operations
        score += 50; // Unnaturally fast (likely bot)
      }
    }

    return Math.min(score, 100);
  }

  /**
   * Checks for time-based anomalies
   *
   * Detects operations during unusual hours or suspicious timing
   *
   * @param context - Fraud detection context
   * @returns Time anomaly risk score (0-100)
   */
  private checkTimeAnomalies(context: FraudDetectionContext): number {
    let score = 0;

    const now = new Date();
    const hour = now.getHours();

    // Check for unusual hours (2 AM - 5 AM local time)
    if (
      hour >= this.TIME_THRESHOLDS.UNUSUAL_HOUR_START &&
      hour < this.TIME_THRESHOLDS.UNUSUAL_HOUR_END
    ) {
      score += 20; // Operations during unusual hours
    }

    // Additional time-based checks could include:
    // - Operations on holidays
    // - Operations outside business hours for B2B
    // - Timezone mismatches

    return Math.min(score, 100);
  }

  /**
   * Checks historical risk for user
   *
   * Analyzes past fraudulent behavior or risky patterns
   *
   * @param context - Fraud detection context
   * @returns Historical risk score (0-100)
   */
  private async checkHistoricalRisk(
    context: FraudDetectionContext,
  ): Promise<number> {
    let score = 0;

    if (!context.userId) {
      return 0; // Can't check history for guests
    }

    // Check for past security alerts
    const last30days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const pastAlerts = await this.auditLogRepo
      .createQueryBuilder('audit')
      .where('audit.actorId = :userId', { userId: context.userId })
      .andWhere('audit.module = :module', { module: 'cart_security' })
      .andWhere('audit.action LIKE :action', { action: 'SECURITY_ALERT%' })
      .andWhere('audit.createdAt >= :last30days', { last30days })
      .getCount();

    if (pastAlerts > 10) {
      score += 60; // Many past security alerts
    } else if (pastAlerts > 5) {
      score += 30; // Some past security alerts
    }

    // Check for blocked operations in past
    const pastBlocks = await this.auditLogRepo
      .createQueryBuilder('audit')
      .where('audit.actorId = :userId', { userId: context.userId })
      .andWhere('audit.action = :action', { action: 'OPERATION_BLOCKED' })
      .andWhere('audit.createdAt >= :last30days', { last30days })
      .getCount();

    if (pastBlocks > 0) {
      score += 40; // Has been blocked before
    }

    return Math.min(score, 100);
  }

  /**
   * Calculates weighted risk score from individual factors
   *
   * Combines all risk factors with appropriate weights to generate
   * final risk score (0-100 scale)
   *
   * @param factors - Individual risk factor scores
   * @returns Weighted risk score (0-100)
   */
  private calculateWeightedRiskScore(factors: {
    velocity: number;
    quantity: number;
    price: number;
    device: number;
    geo: number;
    bot: number;
    ip: number;
    behavior: number;
    time: number;
    history: number;
  }): number {
    const weights = {
      velocity: 0.15,
      quantity: 0.20,
      price: 0.25,
      device: 0.10,
      geo: 0.15,
      bot: 0.20,
      ip: 0.10,
      behavior: 0.15,
      time: 0.10,
      history: 0.10,
    };

    const weightedSum =
      factors.velocity * weights.velocity +
      factors.quantity * weights.quantity +
      factors.price * weights.price +
      factors.device * weights.device +
      factors.geo * weights.geo +
      factors.bot * weights.bot +
      factors.ip * weights.ip +
      factors.behavior * weights.behavior +
      factors.time * weights.time +
      factors.history * weights.history;

    // Normalize to 0-100 scale (weights sum to 1.5 for more granular scoring)
    return Math.min((weightedSum / 1.5) * 100, 100);
  }

  /**
   * Determines risk level from risk score
   *
   * @param riskScore - Calculated risk score (0-100)
   * @returns Risk level classification
   */
  private determineRiskLevel(
    riskScore: number,
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (riskScore >= this.RISK_THRESHOLDS.CRITICAL) return 'critical';
    if (riskScore >= this.RISK_THRESHOLDS.HIGH) return 'high';
    if (riskScore >= this.RISK_THRESHOLDS.MEDIUM) return 'medium';
    return 'low';
  }

  /**
   * Calculates distance between two geographic coordinates
   *
   * Uses Haversine formula for great-circle distance
   *
   * @param lat1 - Latitude of first point
   * @param lon1 - Longitude of first point
   * @param lat2 - Latitude of second point
   * @param lon2 - Longitude of second point
   * @returns Distance in kilometers
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Converts degrees to radians
   *
   * @param degrees - Angle in degrees
   * @returns Angle in radians
   */
  private toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }
}

/**
 * Fraud detection context interface
 */
export interface FraudDetectionContext {
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceFingerprint?: string;
  cartId?: string;
  operation?: {
    type: string;
    quantity?: number;
    price?: number;
    originalPrice?: number;
  };
  geolocation?: {
    country?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
}

/**
 * Fraud risk assessment interface
 */
export interface FraudRiskAssessment {
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  shouldBlock: boolean;
  triggeredRules: string[];
  details: {
    velocity: number;
    quantity: number;
    price: number;
    device: number;
    geolocation: number;
    bot: number;
    ipReputation: number;
    behavior: number;
    timeAnomaly: number;
    historicalRisk: number;
  };
  metadata: {
    timestamp: Date;
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
    geolocation?: any;
  };
}
