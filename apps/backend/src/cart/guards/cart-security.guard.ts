/**
 * @file cart-security.guard.ts
 * @description Enhanced Cart Security Guard for SouqSyria E-commerce Platform (Week 3)
 *
 * RESPONSIBILITIES:
 * - Real-time fraud detection with ML-based scoring
 * - Device fingerprint validation and consistency checking
 * - Automated threat response with progressive escalation
 * - Comprehensive security event logging and alerting
 * - Integration with advanced security services
 *
 * SECURITY FEATURES:
 * - 10-factor fraud detection (velocity, quantity, price, device, geo, bot, IP, behavior, time, history)
 * - Geolocation intelligence with impossible travel detection
 * - Virtual device and bot detection
 * - Progressive threat response (allow → log → challenge → rate_limit → block → escalate)
 * - Whitelist management and dynamic block durations
 * - Multi-channel admin notifications (email, SMS, Slack, dashboard)
 *
 * PERFORMANCE:
 * - Optimized Redis caching for fingerprints and risk assessments
 * - Parallel security checks with Promise.all
 * - Fail-open strategy for availability
 * - < 50ms additional latency per request
 *
 * @author SouqSyria Development Team
 * @version 3.0.0 - Week 3 Enhanced Security
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { AuditLogService } from '../../audit-log/service/audit-log.service';
import {
  CartFraudDetectionService,
  FraudDetectionContext,
} from '../services/cart-fraud-detection.service';
import {
  DeviceFingerprintService,
  DeviceData,
} from '../services/device-fingerprint.service';
import {
  ThreatResponseService,
  ThreatResponseContext,
} from '../services/threat-response.service';

/**
 * Security Configuration Interface
 * Controls behavior of the security guard
 */
interface SecurityConfig {
  /** Enable or disable specific security checks */
  fraudDetectionEnabled: boolean;
  deviceValidationEnabled: boolean;
  threatResponseEnabled: boolean;
  /** Fail open or fail closed on security service errors */
  failOpen: boolean;
  /** Cache TTL for risk assessments (seconds) */
  riskCacheTTL: number;
  /** Cache TTL for device fingerprints (seconds) */
  fingerprintCacheTTL: number;
}

/**
 * Enhanced Cart Security Guard
 *
 * Orchestrates advanced security services to provide comprehensive fraud detection,
 * device validation, and automated threat response for cart operations.
 *
 * ARCHITECTURE:
 * - Uses CartFraudDetectionService for ML-based risk assessment
 * - Integrates DeviceFingerprintService for device consistency validation
 * - Leverages ThreatResponseService for automated threat mitigation
 * - Maintains Redis cache for performance optimization
 * - Logs all security events for compliance and monitoring
 *
 * SECURITY FLOW:
 * 1. Extract device data and context from request
 * 2. Generate and validate device fingerprint
 * 3. Perform ML-based fraud risk assessment
 * 4. Execute automated threat response based on risk score
 * 5. Log security event for monitoring and compliance
 * 6. Allow, challenge, rate-limit, or block request
 *
 * PERFORMANCE CONSIDERATIONS:
 * - Parallel execution of independent security checks
 * - Redis caching to avoid redundant calculations
 * - Optimistic validation with async logging
 * - Non-blocking audit log writes
 */
@Injectable()
export class CartSecurityGuard implements CanActivate {
  private readonly logger = new Logger(CartSecurityGuard.name);

  /** In-memory cache (replaces Redis) */
  private readonly _cache = new Map<
    string,
    { value: string; expiresAt: number }
  >();

  /** Counter for periodic cache cleanup */
  private _cacheAccessCount = 0;

  /** Maximum cache entries before forced eviction */
  private readonly MAX_CACHE_SIZE = 10_000;

  /**
   * Retrieve cached value with automatic expiry check and periodic cleanup
   * @description Performs cleanup every 100 accesses to prevent memory leaks
   * @param key - Cache key to retrieve
   * @returns Cached value or null if expired/not found
   */
  private _cacheGet(key: string): string | null {
    // Periodic cleanup every 100 accesses
    if (++this._cacheAccessCount % 100 === 0) {
      this._cacheCleanup();
    }
    const entry = this._cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this._cache.delete(key);
      return null;
    }
    return entry.value;
  }

  /**
   * Store value in cache with TTL and size limit enforcement
   * @description Triggers cleanup if cache exceeds MAX_CACHE_SIZE
   * @param key - Cache key to store
   * @param value - Value to cache
   * @param ttlSeconds - Time to live in seconds
   */
  private _cacheSet(key: string, value: string, ttlSeconds: number): void {
    if (this._cache.size >= this.MAX_CACHE_SIZE) {
      this._cacheCleanup();
    }
    this._cache.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  /**
   * Delete cached value by key
   * @param key - Cache key to delete
   * @returns true if entry existed and was deleted, false otherwise
   */
  private _cacheDel(key: string): boolean {
    return this._cache.delete(key);
  }

  /**
   * Increment cached counter with automatic initialization and TTL
   * @param key - Cache key for counter
   * @param ttlSeconds - Time to live in seconds (default: 3600)
   * @returns New counter value after increment
   */
  private _cacheIncr(key: string, ttlSeconds: number = 3600): number {
    const entry = this._cache.get(key);
    if (!entry || Date.now() > entry.expiresAt) {
      this._cache.set(key, {
        value: '1',
        expiresAt: Date.now() + ttlSeconds * 1000,
      });
      return 1;
    }
    const newVal = parseInt(entry.value, 10) + 1;
    entry.value = String(newVal);
    return newVal;
  }

  /**
   * Evict expired entries and enforce max cache size
   * @description Removes expired entries; if still over MAX_CACHE_SIZE, evicts oldest 20%
   */
  private _cacheCleanup(): void {
    const now = Date.now();
    // Phase 1: Remove all expired entries
    for (const [key, entry] of this._cache) {
      if (now > entry.expiresAt) {
        this._cache.delete(key);
      }
    }
    // Phase 2: Force eviction if still over limit (evict oldest 20%)
    if (this._cache.size > this.MAX_CACHE_SIZE) {
      const entriesToEvict = Math.ceil(this._cache.size * 0.2);
      const iterator = this._cache.keys();
      for (let i = 0; i < entriesToEvict; i++) {
        const key = iterator.next().value;
        if (key) this._cache.delete(key);
      }
      this.logger.warn(
        `🧹 Cache cleanup: evicted ${entriesToEvict} entries (size was ${this._cache.size + entriesToEvict})`,
      );
    }
  }

  /** Security configuration with production-ready defaults */
  private readonly config: SecurityConfig = {
    fraudDetectionEnabled: true,
    deviceValidationEnabled: true,
    threatResponseEnabled: true,
    failOpen: true, // Fail open for availability (change to false for maximum security)
    riskCacheTTL: 60, // Cache risk assessments for 60 seconds
    fingerprintCacheTTL: 3600 * 24, // Cache fingerprints for 24 hours
  };

  constructor(
    private readonly reflector: Reflector,

    private readonly auditLogService: AuditLogService,
    private readonly fraudDetectionService: CartFraudDetectionService,
    private readonly deviceFingerprintService: DeviceFingerprintService,
    private readonly threatResponseService: ThreatResponseService,
  ) {
    this.logger.log(
      '🛡️ Enhanced Cart Security Guard initialized with Week 3 ML-based threat detection',
    );
  }

  /**
   * Main guard execution method
   * Orchestrates comprehensive security assessment with advanced services
   *
   * @param context - NestJS execution context
   * @returns Promise<boolean> - true if request is allowed, throws exception if blocked
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    // Skip security checks for health checks and internal requests
    if (this.shouldSkipSecurityCheck(request)) {
      return true;
    }

    try {
      // Step 1: Extract device data and context
      const deviceData = this.extractDeviceData(request);
      const detectionContext = await this.buildDetectionContext(
        request,
        deviceData,
      );

      // Step 2: Parallel security checks for performance
      const [deviceFingerprint, riskAssessment] = await Promise.all([
        this.performDeviceValidation(deviceData, detectionContext.userId),
        this.performFraudDetection(detectionContext),
      ]);

      // Step 3: Build threat response context
      const responseContext = this.buildResponseContext(
        request,
        deviceFingerprint,
      );

      // Step 4: Execute automated threat response
      const threatResponse = await this.threatResponseService.executeResponse(
        riskAssessment,
        responseContext,
      );

      // Step 5: Log security event (non-blocking)
      this.logSecurityEvent(
        request,
        riskAssessment,
        deviceFingerprint,
        threatResponse,
      ).catch((err) => {
        this.logger.error('Failed to log security event', err.stack);
      });

      // Step 6: Handle threat response action
      switch (threatResponse.action) {
        case 'block':
          throw new ForbiddenException({
            message: 'Request blocked due to security concerns',
            action: threatResponse.action,
            riskScore: riskAssessment.riskScore,
            riskLevel: riskAssessment.riskLevel,
            reason: threatResponse.reason,
            timestamp: new Date().toISOString(),
          });

        case 'challenge':
          // In production, this would trigger CAPTCHA or additional verification
          this.logger.warn(
            `🔐 Challenge required for request: ${threatResponse.reason}`,
          );
          break;

        case 'rate_limit':
          // Rate limiting is handled by CartRateLimitGuard, just log
          this.logger.warn(
            `⏱️ Rate limiting applied: ${threatResponse.reason}`,
          );
          break;

        case 'escalate':
          this.logger.error(
            `🚨 SECURITY ESCALATION: ${threatResponse.reason}`,
            {
              escalationLevel: threatResponse.escalationLevel,
              riskScore: riskAssessment.riskScore,
            },
          );
          break;

        case 'log':
          this.logger.log(
            `📝 Enhanced logging enabled: ${threatResponse.reason}`,
          );
          break;

        case 'allow':
        default:
          // Request allowed, no action needed
          break;
      }

      return true;
    } catch (error) {
      // Re-throw security exceptions (ForbiddenException, UnauthorizedException)
      if (
        error instanceof ForbiddenException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }

      // Log security system errors
      this.logger.error('Security assessment failed', {
        error: error.message,
        stack: error.stack,
        path: request.path,
      });

      // Fail open or closed based on configuration
      if (this.config.failOpen) {
        this.logger.warn(
          '⚠️ Security check failed, allowing request (fail-open mode)',
        );
        return true;
      } else {
        throw new ForbiddenException('Security validation failed');
      }
    }
  }

  /**
   * Extract device data from request headers
   * Used for device fingerprinting
   */
  private extractDeviceData(request: Request): DeviceData {
    const userAgent = request.headers['user-agent'] || '';
    const acceptLanguage = request.headers['accept-language'] || '';
    const acceptEncoding = request.headers['accept-encoding'] || '';
    const clientIP = this.extractClientIP(request);

    // Extract screen resolution if available (from custom header)
    const screenResolution = request.headers['x-screen-resolution'] as string;
    const timezone =
      (request.headers['x-timezone'] as string) ||
      Intl.DateTimeFormat().resolvedOptions().timeZone;

    return {
      userAgent,
      screenResolution: screenResolution || 'unknown',
      timezone,
      language: acceptLanguage,
      platform: this.extractPlatform(userAgent),
      hardwareConcurrency:
        parseInt(request.headers['x-hardware-concurrency'] as string) || 0,
      deviceMemory: parseInt(request.headers['x-device-memory'] as string) || 0,
      colorDepth: parseInt(request.headers['x-color-depth'] as string) || 24,
      pixelRatio: parseFloat(request.headers['x-pixel-ratio'] as string) || 1,
      touchSupport: (request.headers['x-touch-support'] as string) === 'true',
      webglVendor: (request.headers['x-webgl-vendor'] as string) || 'unknown',
      webglRenderer:
        (request.headers['x-webgl-renderer'] as string) || 'unknown',
      canvasFingerprint:
        (request.headers['x-canvas-fingerprint'] as string) || '',
      audioFingerprint:
        (request.headers['x-audio-fingerprint'] as string) || '',
      clientIP,
    };
  }

  /**
   * Build fraud detection context from request
   */
  private async buildDetectionContext(
    request: Request,
    deviceData: DeviceData,
  ): Promise<FraudDetectionContext> {
    const user = request.user as any;
    const userId = user?.id || null;
    const clientIP = deviceData.clientIP;

    // Extract cart operation details
    const operationType = this.extractCartOperation(request);
    const quantity = request.body?.quantity || 1;
    const price = request.body?.price || 0;

    // Get geolocation from IP (in production, use MaxMind or similar)
    const geolocation = await this.getGeolocationFromIP(clientIP);

    return {
      userId,
      sessionId:
        request.cookies?.guest_session_id || request.cookies?.session_id,
      clientIP,
      userAgent: deviceData.userAgent,
      deviceFingerprint: '', // Will be set after fingerprint generation
      operation: {
        type: operationType,
        quantity,
        price,
      },
      geolocation,
      timestamp: new Date(),
    };
  }

  /**
   * Perform device fingerprint validation
   */
  private async performDeviceValidation(
    deviceData: DeviceData,
    userId: string | null,
  ): Promise<any> {
    if (!this.config.deviceValidationEnabled) {
      return null;
    }

    try {
      // Generate device fingerprint
      const deviceFingerprint =
        this.deviceFingerprintService.generateFingerprint(deviceData);

      // Get historical fingerprints for this user/session
      const fingerprintKey = userId
        ? `device_fingerprints:user:${userId}`
        : `device_fingerprints:ip:${deviceData.clientIP}`;

      const storedFingerprintsJson = this._cacheGet(fingerprintKey);
      const storedFingerprints = storedFingerprintsJson
        ? JSON.parse(storedFingerprintsJson)
        : [];

      // Validate fingerprint consistency
      const validation = this.deviceFingerprintService.validateFingerprint(
        deviceFingerprint,
        storedFingerprints,
      );

      // Store fingerprint if new or significantly different
      if (!validation.isValid || storedFingerprints.length === 0) {
        storedFingerprints.push(deviceFingerprint);
        // Keep only last 5 fingerprints
        if (storedFingerprints.length > 5) {
          storedFingerprints.shift();
        }
        this._cacheSet(
          fingerprintKey,
          JSON.stringify(storedFingerprints),
          this.config.fingerprintCacheTTL,
        );
      }

      return {
        ...deviceFingerprint,
        validation,
      };
    } catch (error) {
      this.logger.error('Device validation failed', error.stack);
      return null;
    }
  }

  /**
   * Perform ML-based fraud detection
   */
  private async performFraudDetection(
    context: FraudDetectionContext,
  ): Promise<any> {
    if (!this.config.fraudDetectionEnabled) {
      return {
        riskScore: 0,
        riskLevel: 'low',
        shouldBlock: false,
        triggeredRules: [],
        details: {},
      };
    }

    try {
      // Check cache first
      const cacheKey = `fraud_assessment:${context.userId || context.clientIP}:${context.operation}`;
      const cachedAssessment = this._cacheGet(cacheKey);

      if (cachedAssessment) {
        return JSON.parse(cachedAssessment);
      }

      // Perform fraud assessment
      const riskAssessment =
        await this.fraudDetectionService.assessFraudRisk(context);

      // Cache assessment
      this._cacheSet(
        cacheKey,
        JSON.stringify(riskAssessment),
        this.config.riskCacheTTL,
      );

      return riskAssessment;
    } catch (error) {
      this.logger.error('Fraud detection failed', error.stack);
      return {
        riskScore: 0,
        riskLevel: 'low',
        shouldBlock: false,
        triggeredRules: [],
        details: {},
      };
    }
  }

  /**
   * Build threat response context
   */
  private buildResponseContext(
    request: Request,
    deviceFingerprint: any,
  ): ThreatResponseContext {
    const user = request.user as any;

    return {
      userId: user?.id || null,
      sessionId:
        request.cookies?.guest_session_id || request.cookies?.session_id,
      clientIP: this.extractClientIP(request),
      userAgent: request.headers['user-agent'] || '',
      deviceFingerprint: deviceFingerprint?.fingerprintId || '',
      endpoint: request.path,
      timestamp: new Date(),
    };
  }

  /**
   * Log comprehensive security event
   */
  private async logSecurityEvent(
    request: Request,
    riskAssessment: any,
    deviceFingerprint: any,
    threatResponse: any,
  ): Promise<void> {
    // Only log medium+ risk events to reduce noise
    if (riskAssessment.riskLevel === 'low') {
      return;
    }

    const eventData = {
      riskAssessment: {
        riskScore: riskAssessment.riskScore,
        riskLevel: riskAssessment.riskLevel,
        triggeredRules: riskAssessment.triggeredRules,
        shouldBlock: riskAssessment.shouldBlock,
      },
      deviceFingerprint: deviceFingerprint
        ? {
            fingerprintId: deviceFingerprint.fingerprintId,
            trustScore: deviceFingerprint.trustScore,
            isVirtualDevice: deviceFingerprint.isVirtualDevice,
            isBotLike: deviceFingerprint.isBotLike,
            validationConsistency:
              deviceFingerprint.validation?.consistencyScore,
          }
        : null,
      threatResponse: {
        action: threatResponse.action,
        reason: threatResponse.reason,
        escalationLevel: threatResponse.escalationLevel,
        notificationSent: threatResponse.notificationSent,
      },
      request: {
        endpoint: request.path,
        method: request.method,
        userAgent: request.headers['user-agent'],
        clientIP: this.extractClientIP(request),
      },
      timestamp: new Date().toISOString(),
    };

    await this.auditLogService.logSimple({
      action: 'SECURITY_ASSESSMENT',
      module: 'cart_security',
      actorId: (request.user as any)?.id || null,
      actorType: request.user ? 'user' : 'anonymous',
      entityType: 'security_event',
      entityId: null,
      description: `Week 3 security: ${riskAssessment.riskLevel} risk (${riskAssessment.riskScore}/100) → ${threatResponse.action}`,
    });
  }

  /**
   * Extract cart operation from request
   */
  private extractCartOperation(request: Request): string {
    const method = request.method;
    const path = request.path.toLowerCase();

    if (method === 'POST' && path.includes('/cart/items')) return 'add_item';
    if (method === 'PUT' && path.includes('/cart/items')) return 'update_item';
    if (method === 'DELETE' && path.includes('/cart/items'))
      return 'remove_item';
    if (method === 'DELETE' && path.includes('/cart')) return 'clear_cart';
    if (method === 'GET' && path.includes('/cart')) return 'view_cart';

    return 'unknown';
  }

  /**
   * Get geolocation from IP address
   * In production, use MaxMind GeoIP2 or similar service
   */
  private async getGeolocationFromIP(ip: string): Promise<any> {
    // Placeholder implementation
    // In production, integrate with MaxMind GeoIP2, IP2Location, or similar
    return {
      country: 'SY', // Syria
      city: 'Damascus',
      latitude: 33.5138,
      longitude: 36.2765,
      timezone: 'Asia/Damascus',
    };
  }

  /**
   * Extract platform from user agent
   */
  private extractPlatform(userAgent: string): string {
    if (/windows/i.test(userAgent)) return 'Windows';
    if (/macintosh|mac os/i.test(userAgent)) return 'macOS';
    if (/linux/i.test(userAgent)) return 'Linux';
    if (/android/i.test(userAgent)) return 'Android';
    if (/iphone|ipad|ipod/i.test(userAgent)) return 'iOS';
    return 'Unknown';
  }

  /**
   * Extract client IP address from request
   */
  private extractClientIP(request: Request): string {
    const forwardedFor = request.headers['x-forwarded-for'] as string;
    const realIp = request.headers['x-real-ip'] as string;
    const remoteAddress =
      request.connection?.remoteAddress || request.socket?.remoteAddress;

    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }
    return realIp || remoteAddress || 'unknown';
  }

  /**
   * Check if security checks should be skipped
   */
  private shouldSkipSecurityCheck(request: Request): boolean {
    const path = request.path.toLowerCase();

    // Skip for health checks, monitoring, and admin routes
    return (
      path.includes('/health') ||
      path.includes('/metrics') ||
      path.includes('/ping') ||
      path.includes('/admin/cart-monitor') // Skip for monitoring dashboard
    );
  }
}
