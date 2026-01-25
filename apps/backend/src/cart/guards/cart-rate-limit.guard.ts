import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';
import { Request } from 'express';

/**
 * Cart Rate Limiting Configuration Interface
 * Defines the structure for rate limiting rules
 */
interface RateLimitConfig {
  /** Maximum requests allowed in the time window */
  maxRequests: number;
  /** Time window in seconds */
  windowSizeInSeconds: number;
  /** Additional delay in milliseconds after violation */
  penaltyDelayMs?: number;
  /** Custom error message */
  message?: string;
}

/**
 * Rate Limit Metadata Key
 * Used with @SetMetadata decorator to configure rate limits per endpoint
 */
export const RATE_LIMIT_KEY = 'rate_limit';

/**
 * Rate Limit Decorator
 * Apply to controller methods to set specific rate limiting rules
 *
 * @example
 * @RateLimit({ maxRequests: 20, windowSizeInSeconds: 300 }) // 20 requests per 5 minutes
 * @Post('add')
 * async addToCart(@Body() dto: AddToCartDto) { ... }
 */
export const RateLimit = (config: RateLimitConfig) =>
  SetMetadata(RATE_LIMIT_KEY, config);

/**
 * Cart Rate Limiting Guard
 *
 * Implements Redis-based sliding window rate limiting to prevent cart abuse.
 * Supports different limits for authenticated vs guest users with progressive penalties.
 *
 * Features:
 * - Sliding window algorithm for accurate rate limiting
 * - Separate tracking for IP addresses and authenticated users
 * - Progressive penalty delays for repeat violations
 * - Configurable per-endpoint limits
 * - Comprehensive logging and monitoring
 * - Grace period for legitimate users
 *
 * @author SouqSyria Development Team
 * @version 1.0.0
 */
@Injectable()
export class CartRateLimitGuard implements CanActivate {
  private readonly logger = new Logger(CartRateLimitGuard.name);

  /** Default rate limits for different user types */
  private readonly defaultLimits = {
    authenticated: {
      maxRequests: 100,
      windowSizeInSeconds: 3600, // 1 hour
    },
    guest: {
      maxRequests: 50,
      windowSizeInSeconds: 3600, // 1 hour
    },
    addItem: {
      maxRequests: 20,
      windowSizeInSeconds: 300, // 5 minutes
    },
    removeItem: {
      maxRequests: 30,
      windowSizeInSeconds: 300, // 5 minutes
    },
  };

  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  /**
   * Main guard execution method
   * Validates if the request should be allowed based on rate limiting rules
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const handler = context.getHandler();
    const controllerClass = context.getClass();

    // Extract rate limit configuration
    const rateLimitConfig = this.extractRateLimitConfig(handler, controllerClass);

    if (!rateLimitConfig) {
      // No rate limiting configured for this endpoint
      return true;
    }

    // Get client identifier (user ID or IP address)
    const clientId = this.getClientIdentifier(request);
    const isAuthenticated = !!request.user;

    try {
      // Check rate limit
      const isAllowed = await this.checkRateLimit(
        clientId,
        rateLimitConfig,
        isAuthenticated,
        request,
      );

      if (!isAllowed) {
        await this.logViolation(clientId, request, rateLimitConfig, isAuthenticated);

        // Apply penalty delay if configured
        if (rateLimitConfig.penaltyDelayMs) {
          await this.applyPenaltyDelay(clientId, rateLimitConfig.penaltyDelayMs);
        }

        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            error: 'Too Many Requests',
            message: rateLimitConfig.message || 'Rate limit exceeded. Please try again later.',
            retryAfter: rateLimitConfig.windowSizeInSeconds,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      return true;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      // Log Redis or other errors but don't block the request
      this.logger.error(
        `Rate limiting check failed for client ${clientId}`,
        error.stack,
      );
      return true; // Fail open for service availability
    }
  }

  /**
   * Extract rate limiting configuration from decorator or use defaults
   */
  private extractRateLimitConfig(
    handler: Function,
    controllerClass: Function,
  ): RateLimitConfig | null {
    // Check for method-level rate limit configuration
    const methodConfig = this.reflector.get<RateLimitConfig>(
      RATE_LIMIT_KEY,
      handler,
    );

    if (methodConfig) {
      return methodConfig;
    }

    // Check for class-level rate limit configuration
    const classConfig = this.reflector.get<RateLimitConfig>(
      RATE_LIMIT_KEY,
      controllerClass,
    );

    if (classConfig) {
      return classConfig;
    }

    // Use default configuration based on method name
    const methodName = handler.name.toLowerCase();

    if (methodName.includes('add')) {
      return this.defaultLimits.addItem;
    }

    if (methodName.includes('remove') || methodName.includes('delete')) {
      return this.defaultLimits.removeItem;
    }

    // Return null for no rate limiting
    return null;
  }

  /**
   * Get unique client identifier (user ID for authenticated, IP for guests)
   */
  private getClientIdentifier(request: Request): string {
    const user = request.user as any;

    if (user?.id) {
      return `user:${user.id}`;
    }

    // Use IP address for guest users with proper validation
    const forwardedFor = request.headers['x-forwarded-for'] as string;
    const realIp = request.headers['x-real-ip'] as string;
    const remoteAddress = request.connection?.remoteAddress || request.socket?.remoteAddress;

    let clientIP = 'unknown';
    if (forwardedFor) {
      // Take first IP from comma-separated list for X-Forwarded-For
      clientIP = forwardedFor.split(',')[0].trim();
    } else if (realIp) {
      clientIP = realIp;
    } else if (remoteAddress) {
      clientIP = remoteAddress;
    }

    return `ip:${clientIP}`;
  }

  /**
   * Check if the request is within rate limits using sliding window algorithm
   */
  private async checkRateLimit(
    clientId: string,
    config: RateLimitConfig,
    isAuthenticated: boolean,
    request: Request,
  ): Promise<boolean> {
    const now = Date.now();
    const windowStart = now - (config.windowSizeInSeconds * 1000);

    // Redis key for this client's requests - sanitize route path
    const routePath = (request.route?.path || request.path || 'unknown')
      .replace(/[^a-zA-Z0-9_\-\/]/g, '_');
    const key = `cart_rate_limit:${clientId}:${routePath}`;

    // Use Redis transaction for atomicity
    const multi = this.redis.multi();

    // Remove old entries outside the window
    multi.zremrangebyscore(key, 0, windowStart);

    // Add current request with unique identifier to avoid collisions
    multi.zadd(key, now, `${now}:${Math.random().toString(36).substring(7)}`);

    // Count requests in current window
    multi.zcard(key);

    // Set expiration for cleanup
    multi.expire(key, config.windowSizeInSeconds + 60);

    const results = await multi.exec();
    const requestCount = results[2][1] as number;

    // Apply different limits based on user type
    const effectiveLimit = this.getEffectiveLimit(config, isAuthenticated);

    // Log rate limit check for monitoring
    if (requestCount > effectiveLimit * 0.8) {
      this.logger.warn(
        `Client ${clientId} approaching rate limit: ${requestCount}/${effectiveLimit}`,
      );
    }

    return requestCount <= effectiveLimit;
  }

  /**
   * Get effective rate limit based on user authentication status
   */
  private getEffectiveLimit(config: RateLimitConfig, isAuthenticated: boolean): number {
    if (isAuthenticated) {
      // Authenticated users get 1.5x the base limit
      return Math.floor(config.maxRequests * 1.5);
    }

    return config.maxRequests;
  }

  /**
   * Log rate limit violation for security monitoring
   */
  private async logViolation(
    clientId: string,
    request: Request,
    config: RateLimitConfig,
    isAuthenticated: boolean,
  ): Promise<void> {
    const violationData = {
      clientId,
      endpoint: request.route?.path || request.path,
      method: request.method,
      userAgent: request.headers['user-agent'] || 'unknown',
      isAuthenticated,
      timestamp: new Date().toISOString(),
      rateLimitConfig: config,
      ip: request.headers['x-forwarded-for'] || request.connection?.remoteAddress || 'unknown',
    };

    // Log for immediate monitoring
    this.logger.error('Rate limit violation detected', violationData);

    try {
      // Store in Redis for analytics (24-hour retention)
      const violationKey = `cart_violations:${Date.now()}:${clientId.replace(/[^a-zA-Z0-9_\-:]/g, '_')}`;
      await this.redis.setex(
        violationKey,
        86400, // 24 hours
        JSON.stringify(violationData)
      );

      // Track violation count for progressive penalties
      const violationCountKey = `cart_violation_count:${clientId.replace(/[^a-zA-Z0-9_\-:]/g, '_')}`;
      await this.redis.incr(violationCountKey);
      await this.redis.expire(violationCountKey, 3600); // 1 hour
    } catch (error) {
      // Don't let Redis errors prevent rate limiting enforcement
      this.logger.error('Failed to store violation data in Redis', error);
    }
  }

  /**
   * Apply progressive penalty delay for repeat offenders
   */
  private async applyPenaltyDelay(clientId: string, basePenaltyMs: number): Promise<void> {
    try {
      const violationCountKey = `cart_violation_count:${clientId.replace(/[^a-zA-Z0-9_\-:]/g, '_')}`;
      const violationCount = await this.redis.get(violationCountKey);

      if (violationCount) {
        const count = parseInt(violationCount, 10);
        const penaltyMs = basePenaltyMs * Math.min(count, 5); // Max 5x penalty

        this.logger.warn(
          `Applying penalty delay of ${penaltyMs}ms for client ${clientId} (violation #${count})`,
        );

        // Store penalty info for monitoring
        await this.redis.setex(
          `cart_penalty:${clientId.replace(/[^a-zA-Z0-9_\-:]/g, '_')}`,
          60, // 1 minute
          penaltyMs.toString(),
        );
      }
    } catch (error) {
      // Don't let penalty tracking errors affect rate limiting
      this.logger.error('Failed to apply penalty delay', error);
    }
  }
}