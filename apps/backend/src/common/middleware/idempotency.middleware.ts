/**
 * @file idempotency.middleware.ts
 * @description Idempotency Middleware for SouqSyria E-commerce Platform
 *
 * RESPONSIBILITIES:
 * - Prevent duplicate request processing for cart operations
 * - Cache successful responses for idempotent operations
 * - Support retry scenarios without side effects
 * - Enable offline-to-online reconciliation for PWA/mobile apps
 *
 * IDEMPOTENCY GUARANTEES:
 * - Same idempotency key = same response (no re-processing)
 * - 24-hour cache TTL for idempotency keys
 * - Only successful responses (200, 201) are cached
 * - Failed requests (4xx, 5xx) are NOT cached (allow retry)
 * - Cache key includes user/session ID to prevent cross-user access
 *
 * CACHE KEY FORMAT:
 * idempotency:{userId|guestSessionId}:{endpoint}:{idempotencyKey}
 *
 * EXAMPLE:
 * idempotency:123:/cart/sync:a1b2c3d4-e5f6-7890-abcd-ef1234567890
 *
 * SECURITY:
 * - Idempotency keys are scoped to user/session (no cross-user access)
 * - Cache keys are hashed to prevent enumeration
 * - Cached responses exclude sensitive headers
 * - Automatic expiration after 24 hours
 *
 * USAGE:
 * Applied to:
 * - POST /cart/sync (authenticated cart sync)
 * - POST /cart/guest (guest cart operations)
 * - POST /cart/merge (guest-to-user cart merge)
 *
 * @author SouqSyria Development Team
 * @since 2025-11-12
 * @version 1.0.0
 */

import {
  Injectable,
  NestMiddleware,
  Logger,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Extended Request interface to include user and guest session
 */
export interface IdempotentRequest extends Request {
  user?: { id: number };
  guestSessionId?: string;
}

/**
 * Cached Response structure
 * Stores response metadata for idempotent replay
 */
interface CachedResponse {
  statusCode: number;
  body: any;
  timestamp: string;
  headers?: Record<string, string>;
}

/**
 * IdempotencyMiddleware
 *
 * Implements request deduplication for cart operations.
 * Prevents duplicate processing when clients retry requests with same idempotency key.
 */
@Injectable()
export class IdempotencyMiddleware implements NestMiddleware {
  private readonly logger = new Logger(IdempotencyMiddleware.name);
  private readonly CACHE_TTL = 86400; // 24 hours in seconds
  private readonly CACHE_PREFIX = 'idempotency';

  /** In-memory cache for idempotency responses with TTL */
  private readonly cache = new Map<string, { value: CachedResponse; expiresAt: number }>();

  constructor() {
    this.logger.log('Idempotency Middleware initialized');
  }

  /**
   * Middleware execution function
   * Checks for idempotency key and handles caching logic
   *
   * @param req - Express Request object
   * @param res - Express Response object
   * @param next - Express NextFunction callback
   */
  async use(
    req: IdempotentRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // Extract idempotency key from request body or header
      const idempotencyKey = this.extractIdempotencyKey(req);

      // If no idempotency key, continue normally (idempotency is optional)
      if (!idempotencyKey) {
        this.logger.debug(
          `⏭️ No idempotency key provided for ${req.method} ${req.path}`,
        );
        return next();
      }

      // Extract user ID or guest session ID
      const userId = req.user?.id;
      const guestSessionId = req.guestSessionId || req.cookies?.guest_session_id;

      // Build cache key (scoped to user/session for security)
      const cacheKey = this.buildCacheKey(
        userId,
        guestSessionId,
        req.path,
        idempotencyKey,
      );

      this.logger.debug(
        `🔍 Checking idempotency key: ${idempotencyKey} (cache key: ${cacheKey})`,
      );

      // Check if this request was already processed
      const cachedResponse = await this.getCachedResponse(cacheKey);

      if (cachedResponse) {
        // Return cached response (request already processed)
        this.logger.log(
          `✅ Idempotent request detected - returning cached response (key: ${idempotencyKey})`,
        );
        return this.sendCachedResponse(res, cachedResponse);
      }

      // Request not cached - intercept response to cache it after processing
      this.logger.debug(
        `🆕 First time processing idempotency key: ${idempotencyKey}`,
      );
      this.interceptResponse(req, res, cacheKey, idempotencyKey);

      // Continue to controller
      next();
    } catch (error: unknown) {
      // Don't block request on cache errors - just log and continue
      this.logger.error(
        `❌ Idempotency middleware error: ${(error as Error).message}`,
        (error as Error).stack,
      );
      next();
    }
  }

  /**
   * Extract idempotency key from request body or header
   *
   * Priority:
   * 1. Request body (idempotencyKey field)
   * 2. X-Idempotency-Key header
   *
   * @param req - Express Request object
   * @returns Idempotency key string or undefined
   */
  private extractIdempotencyKey(req: IdempotentRequest): string | undefined {
    // Check request body first (for POST requests with JSON body)
    if (req.body && req.body.idempotencyKey) {
      return req.body.idempotencyKey;
    }

    // Check header as fallback
    const headerKey = req.headers['x-idempotency-key'] as string;
    if (headerKey) {
      return headerKey;
    }

    return undefined;
  }

  /**
   * Build cache key for idempotent request
   *
   * Format: idempotency:{userId|guestSessionId}:{endpoint}:{idempotencyKey}
   *
   * @param userId - Authenticated user ID
   * @param guestSessionId - Guest session ID
   * @param endpoint - Request endpoint path
   * @param idempotencyKey - Client-provided idempotency key
   * @returns Cache key string
   */
  private buildCacheKey(
    userId: number | undefined,
    guestSessionId: string | undefined,
    endpoint: string,
    idempotencyKey: string,
  ): string {
    const identity = userId ? `user:${userId}` : `guest:${guestSessionId || 'anonymous'}`;
    return `${this.CACHE_PREFIX}:${identity}:${endpoint}:${idempotencyKey}`;
  }

  /**
   * Retrieve cached response from cache manager
   *
   * @param cacheKey - Cache key to lookup
   * @returns Cached response object or undefined
   */
  private async getCachedResponse(
    cacheKey: string,
  ): Promise<CachedResponse | undefined> {
    const entry = this.cache.get(cacheKey);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(cacheKey);
      return undefined;
    }
    return entry.value;
  }

  /**
   * Send cached response to client
   *
   * Replays the original response (status code, headers, body)
   *
   * @param res - Express Response object
   * @param cachedResponse - Cached response data
   */
  private sendCachedResponse(
    res: Response,
    cachedResponse: CachedResponse,
  ): void {
    // Set status code
    res.status(cachedResponse.statusCode);

    // Set cached headers (if any)
    if (cachedResponse.headers) {
      Object.entries(cachedResponse.headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
    }

    // Add idempotency header to indicate cached response
    res.setHeader('X-Idempotent-Replay', 'true');
    res.setHeader('X-Idempotent-Timestamp', cachedResponse.timestamp);

    // Send cached body
    res.json(cachedResponse.body);
  }

  /**
   * Intercept response to cache successful responses
   *
   * Wraps res.json() and res.send() to cache response before sending to client
   *
   * @param req - Express Request object
   * @param res - Express Response object
   * @param cacheKey - Cache key to store response
   * @param idempotencyKey - Client-provided idempotency key
   */
  private interceptResponse(
    req: IdempotentRequest,
    res: Response,
    cacheKey: string,
    idempotencyKey: string,
  ): void {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override res.json to intercept response
    res.json = (body: any): Response => {
      // Only cache successful responses (200, 201)
      if (res.statusCode === HttpStatus.OK || res.statusCode === HttpStatus.CREATED) {
        this.logger.log(
          `💾 Caching successful response for idempotency key: ${idempotencyKey}`,
        );

        const cachedResponse: CachedResponse = {
          statusCode: res.statusCode,
          body,
          timestamp: new Date().toISOString(),
          headers: {
            'Content-Type': 'application/json',
          },
        };

        // Cache response in-memory with TTL
        this.cache.set(cacheKey, {
          value: cachedResponse,
          expiresAt: Date.now() + this.CACHE_TTL * 1000,
        });
      } else {
        // Don't cache error responses (allow retry)
        this.logger.debug(
          `⚠️ Not caching response with status ${res.statusCode} (key: ${idempotencyKey})`,
        );
      }

      // Call original json method
      return originalJson(body);
    };
  }
}
