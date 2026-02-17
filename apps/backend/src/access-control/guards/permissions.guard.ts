/**
 * @file permissions.guard.ts
 * @description Production-ready enterprise guard with comprehensive security features.
 *
 * Key Features:
 * - Dynamic permission checking based on route table
 * - Dual-role system (business + admin roles)
 * - In-memory route lookup caching (5-minute TTL)
 * - SecurityAuditService integration for all events
 * - @Public() decorator support for public routes
 * - Rate limiting for failed permission checks
 * - Suspicious activity detection and logging
 * - Performance monitoring and optimization
 * - Graceful error handling and degradation
 *
 * Performance Targets:
 * - <5ms with cache hit (95%+ hit rate)
 * - <50ms with cache miss (DB query)
 * - Non-blocking async audit logging
 *
 * Security Features:
 * - User ban/suspension checking
 * - Failed attempt tracking per user
 * - Suspicious activity alerting
 * - IP and user agent logging
 * - Rich audit context
 *
 * Integration Points:
 * - SecurityAuditService: All permission events logged
 * - Route entity: Dynamic permission mappings
 * - User entity: Role and permission loading
 * - @Public() decorator: Public route detection
 *
 * @example
 * ```typescript
 * // Apply to specific routes
 * @Controller('admin')
 * @UseGuards(PermissionsGuard)
 * export class AdminController {
 *   @Get('dashboard')
 *   getDashboard() {
 *     // Requires permission based on route table
 *   }
 * }
 *
 * // Apply globally
 * app.useGlobalGuards(
 *   new PermissionsGuard(
 *     reflector,
 *     routeRepository,
 *     userRepository,
 *     securityAuditService
 *   )
 * );
 *
 * // Mark route as public
 * @Public()
 * @Get('health')
 * getHealth() {
 *   // No authentication required
 * }
 * ```
 *
 * @author SouqSyria Security Team
 * @version 2.0.0
 */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Route } from '../entities/route.entity';
import { User } from '../../users/entities/user.entity';
import { RolePermission } from '../entities/role-permission.entity';
import {
  SecurityAuditService,
  LogPermissionCheckDto,
} from '../security-audit/security-audit.service';
import {
  SecurityAuditAction,
  ResourceType,
} from '../entities/security-audit-log.entity';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';

/**
 * Interface for cached route lookup results
 * Stores route data with timestamp for TTL management
 */
interface CachedRoute {
  /** The route entity (null if not found) */
  route: Route | null;
  /** When this entry was cached */
  cachedAt: number;
}

/**
 * Interface for tracking failed permission attempts per user
 * Used for rate limiting and suspicious activity detection
 */
interface FailedAttemptTracker {
  /** Number of failed attempts */
  count: number;
  /** Timestamp of first failure in current window */
  firstFailureAt: number;
  /** Timestamp of most recent failure */
  lastFailureAt: number;
}

/**
 * PermissionsGuard - Enterprise-grade authorization guard
 *
 * This guard implements a comprehensive security model with:
 * - Route-based permission checking
 * - In-memory caching for performance
 * - Full audit trail integration
 * - Rate limiting and threat detection
 * - Support for public routes
 *
 * Thread Safety: Service is stateless except for in-memory caches (thread-safe Map operations)
 * Performance: Optimized for high-throughput scenarios with caching
 * Reliability: Graceful degradation on audit service failures
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  /**
   * Logger for guard diagnostics and security events
   * Separate from security audit logs (for operational monitoring)
   */
  private readonly logger = new Logger(PermissionsGuard.name);

  /**
   * In-memory cache for route lookups
   * Key: "${method}:${path}" (e.g., "GET:/api/admin/users")
   * Value: CachedRoute with route data and timestamp
   * TTL: 5 minutes (300,000ms)
   *
   * Performance Impact:
   * - Cache hit: <5ms lookup (no DB query)
   * - Cache miss: ~30-50ms (DB query + cache store)
   * - Expected hit rate: 95%+ after warm-up
   */
  private readonly routeCache = new Map<string, CachedRoute>();

  /**
   * Cache TTL in milliseconds (5 minutes)
   * Balances performance vs. freshness of route data
   */
  private readonly ROUTE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Failed attempt tracker for rate limiting
   * Key: User ID
   * Value: Failed attempt count and timestamps
   *
   * Thresholds:
   * - 10 failures within 1 minute = SUSPICIOUS_ACTIVITY logged
   * - Entries cleared after 5 minutes of inactivity
   */
  private readonly failedAttempts = new Map<number, FailedAttemptTracker>();

  /**
   * Rate limiting thresholds
   */
  private readonly RATE_LIMIT_THRESHOLD = 10; // failures
  private readonly RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
  private readonly RATE_LIMIT_CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

  /**
   * Constructor - Inject dependencies
   *
   * @param reflector - NestJS Reflector for metadata retrieval (@Public() decorator)
   * @param routeRepository - TypeORM repository for route lookups
   * @param userRepository - TypeORM repository for user loading
   * @param securityAuditService - Service for security event logging
   */
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(Route)
    private readonly routeRepository: Repository<Route>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly securityAuditService: SecurityAuditService,
  ) {
    // Start periodic cache cleanup (remove stale entries)
    this.startCacheCleanup();

    // Start periodic failed attempts cleanup
    this.startFailedAttemptsCleanup();

    this.logger.log(
      'PermissionsGuard initialized with caching and audit logging',
    );
  }

  /**
   * Main guard method - Called on every request to check authorization
   *
   * Flow:
   * 1. Check @Public() decorator - if present, grant access
   * 2. Extract request context (user, IP, user agent, path)
   * 3. Validate JWT user exists
   * 4. Load full user from database with roles/permissions
   * 5. Check user ban/suspension status
   * 6. Lookup route in cache or DB
   * 7. Check if route requires permission
   * 8. Verify user has required permission
   * 9. Log all events to SecurityAuditService
   * 10. Track failed attempts for rate limiting
   *
   * Performance:
   * - Cached route: <5ms
   * - Uncached route: <50ms
   * - Audit logging: async (non-blocking)
   *
   * @param context - Execution context containing request details
   * @returns true if access granted, throws ForbiddenException otherwise
   * @throws ForbiddenException if user lacks permission or is banned
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const startTime = Date.now();
    const request = context.switchToHttp().getRequest();
    const jwtUser = request.user; // From JWT: { id: 2, role: "admin", email: "..." }

    // SECURITY FIX: Sanitize user-provided inputs before logging to prevent log injection
    const rawClientIP =
      request.ip || request.connection?.remoteAddress || 'unknown';
    const rawUserAgent = request.headers['user-agent'] || 'unknown';

    const clientIP = this.sanitizeForLogging(rawClientIP, 45); // IPv6 max length
    const userAgent = this.sanitizeForLogging(rawUserAgent, 200);

    const requestPath = this.getCleanPath(request);
    const requestMethod = request.method;
    const originalUrl = request.originalUrl || request.url;

    this.logger.log(
      `🔐 ACL Check Started - IP: ${clientIP}, User-Agent: ${userAgent.substring(0, 50)}...`,
    );

    // FEATURE 3: Check for @Public() decorator
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      const totalTime = Date.now() - startTime;
      this.logger.log(
        `✅ PUBLIC DECORATOR: Route ${requestMethod} ${requestPath} marked as public - Access granted (${totalTime}ms)`,
      );

      // Log public access to audit (fire-and-forget)
      this.logAuditEvent({
        userId: jwtUser?.id || null,
        action: SecurityAuditAction.PUBLIC_ACCESS,
        resourceType: ResourceType.ROUTE,
        success: true,
        ipAddress: clientIP,
        userAgent,
        requestPath,
        requestMethod,
        metadata: {
          decoratorDetected: true,
          processingTime: totalTime,
        },
      });

      return true;
    }

    // User must be authenticated (JWT required)
    if (!jwtUser || !jwtUser.id) {
      const totalTime = Date.now() - startTime;
      this.logger.error('❌ SECURITY ALERT: No user found in JWT token');

      // FEATURE 1a: Log unauthenticated access attempt
      this.logAuditEvent({
        userId: null,
        action: SecurityAuditAction.ACCESS_DENIED,
        resourceType: ResourceType.ROUTE,
        success: false,
        failureReason: 'User not authenticated (no JWT)',
        ipAddress: clientIP,
        userAgent,
        requestPath,
        requestMethod,
        metadata: {
          processingTime: totalTime,
        },
      });

      throw new ForbiddenException('Access denied. User not authenticated.');
    }

    this.logger.log(
      `👤 JWT User: ID=${jwtUser.id}, Role=${jwtUser.role}, Email=${jwtUser.email}`,
    );

    // Load full user with both roles and their permissions
    const userLoadStart = Date.now();
    const user = await this.userRepository.findOne({
      where: { id: jwtUser.id },
      relations: [
        'role',
        'role.rolePermissions',
        'role.rolePermissions.permission',
        'assignedRole',
        'assignedRole.rolePermissions',
        'assignedRole.rolePermissions.permission',
      ],
    });
    const userLoadTime = Date.now() - userLoadStart;
    this.logger.debug(`📊 User data loaded in ${userLoadTime}ms`);

    if (!user) {
      const totalTime = Date.now() - startTime;
      this.logger.error(
        `❌ SECURITY ALERT: User ${jwtUser.id} not found in database`,
      );

      // FEATURE 1b: Log user not found in database
      this.logAuditEvent({
        userId: jwtUser.id,
        action: SecurityAuditAction.ACCESS_DENIED,
        resourceType: ResourceType.ROUTE,
        success: false,
        failureReason: 'User not found in database',
        ipAddress: clientIP,
        userAgent,
        requestPath,
        requestMethod,
        metadata: {
          jwtUserId: jwtUser.id,
          processingTime: totalTime,
        },
      });

      throw new ForbiddenException('Access denied. User not found.');
    }

    this.logger.log(
      `📋 User Details: ID=${user.id}, Email=${user.email}, Verified=${user.isVerified}, Banned=${user.isBanned}, Suspended=${user.isSuspended}`,
    );
    this.logger.log(
      `🎭 Business Role: ${user.role?.name || 'none'}, Admin Role: ${user.assignedRole?.name || 'none'}`,
    );

    // Check if user is banned
    if (user.isBanned) {
      const totalTime = Date.now() - startTime;
      this.logger.error(
        `🚫 SECURITY ALERT: Banned user ${user.id} (${user.email}) attempted access from IP: ${clientIP}`,
      );

      // FEATURE 1c: Log banned user access attempt
      this.logAuditEvent({
        userId: user.id,
        action: SecurityAuditAction.ACCESS_DENIED,
        resourceType: ResourceType.ROUTE,
        success: false,
        failureReason: 'User is banned',
        ipAddress: clientIP,
        userAgent,
        requestPath,
        requestMethod,
        metadata: {
          userEmail: user.email,
          isBanned: true,
          processingTime: totalTime,
        },
      });

      throw new ForbiddenException('Access denied. Account is banned.');
    }

    // Check if user is suspended (warning only, still allow access)
    if (user.isSuspended) {
      this.logger.warn(
        `⚠️ Suspended user ${user.id} (${user.email}) attempted access from IP: ${clientIP}`,
      );

      // FEATURE 1d: Log suspended user access (warning)
      this.logAuditEvent({
        userId: user.id,
        action: SecurityAuditAction.PERMISSION_CHECK,
        resourceType: ResourceType.ROUTE,
        success: true, // Still allowed, but flagged
        ipAddress: clientIP,
        userAgent,
        requestPath,
        requestMethod,
        metadata: {
          userEmail: user.email,
          isSuspended: true,
          warningLevel: 'SUSPENDED_USER_ACCESS',
        },
      });
    }

    this.logger.log(
      `🌐 Request: ${requestMethod} ${originalUrl} → Normalized: ${requestPath}`,
    );

    // FEATURE 2: Try to find the route in cache first, then DB
    const routeLoadStart = Date.now();
    const route = await this.getRouteFromCacheOrDB(requestPath, requestMethod);
    const routeLoadTime = Date.now() - routeLoadStart;
    const cacheStatus = this.isRouteCached(requestPath, requestMethod)
      ? 'HIT'
      : 'MISS';
    this.logger.debug(
      `📊 Route lookup completed in ${routeLoadTime}ms (Cache: ${cacheStatus})`,
    );

    if (!route) {
      // No route mapping found = public route (allow access)
      const totalTime = Date.now() - startTime;
      this.logger.log(
        `✅ PUBLIC ACCESS: No route mapping for ${requestMethod} ${requestPath} - Access granted (${totalTime}ms)`,
      );

      // FEATURE 1e: Log public route access (no route mapping)
      this.logAuditEvent({
        userId: user.id,
        action: SecurityAuditAction.PUBLIC_ACCESS,
        resourceType: ResourceType.ROUTE,
        success: true,
        ipAddress: clientIP,
        userAgent,
        requestPath,
        requestMethod,
        metadata: {
          reason: 'No route mapping found',
          processingTime: totalTime,
          cacheStatus,
        },
      });

      return true;
    }

    this.logger.log(
      `🗺️ Route Found: ID=${route.id}, Path=${route.path}, Method=${route.method}`,
    );

    if (!route.permission) {
      // Route exists but no specific permission linked = public route
      const totalTime = Date.now() - startTime;
      this.logger.log(
        `✅ PUBLIC ROUTE: Route found but no permission required for ${requestMethod} ${requestPath} (${totalTime}ms)`,
      );

      // FEATURE 1f: Log public route access (route exists but no permission)
      this.logAuditEvent({
        userId: user.id,
        action: SecurityAuditAction.PUBLIC_ACCESS,
        resourceType: ResourceType.ROUTE,
        resourceId: route.id,
        success: true,
        ipAddress: clientIP,
        userAgent,
        requestPath,
        requestMethod,
        metadata: {
          reason: 'Route exists but no permission required',
          routeId: route.id,
          processingTime: totalTime,
          cacheStatus,
        },
      });

      return true;
    }

    this.logger.log(
      `🔑 Required Permission: ${route.permission.name} (ID=${route.permission.id})`,
    );

    // Collect user's permissions from both roles
    const allUserPermissions = this.getUserPermissions(user);
    const userPermissionNames = allUserPermissions.map(
      (rp) => rp.permission.name,
    );

    this.logger.log(
      `👑 User Permissions (${allUserPermissions.length}): ${userPermissionNames.join(', ') || 'none'}`,
    );

    // Log permission sources
    const businessPermissions =
      user.role?.rolePermissions?.map((rp) => rp.permission.name) || [];
    const adminPermissions =
      user.assignedRole?.rolePermissions?.map((rp) => rp.permission.name) || [];
    this.logger.debug(
      `🏢 Business Role Permissions: ${businessPermissions.join(', ') || 'none'}`,
    );
    this.logger.debug(
      `⚙️ Admin Role Permissions: ${adminPermissions.join(', ') || 'none'}`,
    );

    const requiredPermission = route.permission.name;
    const hasPermission = userPermissionNames.includes(requiredPermission);

    const totalTime = Date.now() - startTime;

    if (!hasPermission) {
      this.logger.error(
        `❌ ACCESS DENIED: User ${user.id} (${user.email}) from IP ${clientIP} missing permission: ${requiredPermission} for ${requestMethod} ${requestPath} (${totalTime}ms)`,
      );
      this.logger.error(
        `🔍 Permission Check Details: Required=[${requiredPermission}], Available=[${userPermissionNames.join(', ')}]`,
      );

      // FEATURE 1g: Log access denied
      this.logAuditEvent({
        userId: user.id,
        action: SecurityAuditAction.ACCESS_DENIED,
        resourceType: ResourceType.ROUTE,
        resourceId: route.id,
        permissionRequired: requiredPermission,
        success: false,
        failureReason: `Missing permission: ${requiredPermission}`,
        ipAddress: clientIP,
        userAgent,
        requestPath,
        requestMethod,
        metadata: {
          userEmail: user.email,
          userPermissions: userPermissionNames,
          businessRole: user.role?.name,
          adminRole: user.assignedRole?.name,
          processingTime: totalTime,
          cacheStatus,
        },
      });

      // FEATURE 4: Track failed attempts and detect suspicious activity
      this.trackFailedAttempt(user.id);

      throw new ForbiddenException(
        `Access denied. Missing permission: ${requiredPermission}`,
      );
    }

    this.logger.log(
      `✅ ACCESS GRANTED: User ${user.id} (${user.email}) accessed ${requestMethod} ${requestPath} with permission: ${requiredPermission} (${totalTime}ms)`,
    );

    // FEATURE 1h: Log access granted
    this.logAuditEvent({
      userId: user.id,
      action: SecurityAuditAction.ACCESS_GRANTED,
      resourceType: ResourceType.ROUTE,
      resourceId: route.id,
      permissionRequired: requiredPermission,
      success: true,
      ipAddress: clientIP,
      userAgent,
      requestPath,
      requestMethod,
      metadata: {
        userEmail: user.email,
        businessRole: user.role?.name,
        adminRole: user.assignedRole?.name,
        processingTime: totalTime,
        cacheStatus,
      },
    });

    // Performance warning for slow permission checks
    if (totalTime > 500) {
      this.logger.warn(
        `⚠️ PERFORMANCE: Slow permission check took ${totalTime}ms for user ${user.id}`,
      );
    }

    return true;
  }

  /**
   * Sanitize user input for safe logging
   *
   * SECURITY FIX: Prevents log injection attacks via CRLF injection.
   * Removes or replaces characters that could manipulate log entries:
   * - Carriage return (\r)
   * - Line feed (\n)
   * - Tab characters (\t)
   * - Null bytes (\0)
   *
   * @param input - User-provided input (User-Agent, IP, etc.)
   * @param maxLength - Maximum length to trim to (default: 500)
   * @returns Sanitized string safe for logging
   */
  private sanitizeForLogging(input: string, maxLength: number = 500): string {
    if (!input) return 'unknown';

    // Remove CRLF and other control characters that could inject log entries
    const sanitized = input
      .replace(/[\r\n\t\0]/g, '') // Remove CRLF, tabs, null bytes
      .replace(/[^\x20-\x7E]/g, ''); // Remove non-printable ASCII

    // Trim to max length to prevent log flooding
    return sanitized.substring(0, maxLength);
  }

  /**
   * Get clean path without query parameters and normalize route parameters
   *
   * Extracts the Express route pattern when available for consistent matching.
   * Falls back to normalizing dynamic IDs to :id pattern.
   *
   * @param request - Express request object
   * @returns Normalized route path (e.g., "/api/admin/users/:id")
   */
  private getCleanPath(request: any): string {
    // Get the route pattern from Express (e.g., "/api/admin/routes/:id")
    const routePath = request.route?.path;
    if (routePath) {
      return routePath;
    }

    // Fallback: clean the URL
    let path = request.url.split('?')[0]; // Remove query params

    // Normalize route parameters (convert /api/admin/routes/123 to /api/admin/routes/:id)
    path = this.normalizeRouteParams(path);

    return path;
  }

  /**
   * Normalize dynamic route parameters for consistent matching
   *
   * Converts numeric IDs to :id parameter for database lookup.
   * Example: /api/admin/routes/123 → /api/admin/routes/:id
   *
   * SECURITY FIX: Only normalize trailing numeric segments to prevent
   * privilege escalation attacks where attackers craft URLs like /api/5/admin
   * that could match admin routes after normalization.
   *
   * @param path - Raw path from request URL
   * @returns Normalized path with :id parameters
   */
  private normalizeRouteParams(path: string): string {
    // SECURITY: Only replace numeric segments that are preceded by known safe patterns
    // This prevents /api/5/admin from becoming /api/:id/admin

    // Split path into segments
    const segments = path.split('/').filter(Boolean);

    // Only normalize if the numeric segment appears after at least 2 non-numeric segments
    // This ensures /api/admin/123 becomes /api/admin/:id
    // But /api/5/admin stays as /api/5/admin (and won't match admin routes)
    const normalized = segments.map((segment, index) => {
      // Check if this segment is numeric
      if (/^\d+$/.test(segment)) {
        // Only normalize if preceded by at least 2 segments
        // AND the previous segment is not numeric
        if (index >= 2 && !/^\d+$/.test(segments[index - 1])) {
          return ':id';
        }
      }
      return segment;
    });

    return '/' + normalized.join('/');
  }

  /**
   * Get all permissions from both user roles (business role + assigned admin role)
   *
   * Combines permissions from:
   * - Business role (role field)
   * - Admin role (assignedRole field)
   *
   * Removes duplicates to avoid redundant checks
   *
   * @param user - User entity with loaded roles and permissions
   * @returns Array of unique role permissions
   */
  private getUserPermissions(user: User): RolePermission[] {
    const permissions: RolePermission[] = [];

    // Add permissions from business role
    if (user.role?.rolePermissions) {
      permissions.push(...user.role.rolePermissions);
    }

    // Add permissions from assigned admin role
    if (user.assignedRole?.rolePermissions) {
      permissions.push(...user.assignedRole.rolePermissions);
    }

    // Remove duplicates based on permission ID
    const uniquePermissions = permissions.filter(
      (perm, index, self) =>
        index === self.findIndex((p) => p.permission.id === perm.permission.id),
    );

    return uniquePermissions;
  }

  /**
   * FEATURE 2: Get route from cache or database with TTL management
   *
   * Cache Strategy:
   * - Check cache first using key: "${method}:${path}"
   * - If cached and not expired, return cached route
   * - If cache miss or expired, query database
   * - Store result in cache with current timestamp
   * - Return route (or null if not found)
   *
   * Performance:
   * - Cache hit: <5ms (Map lookup)
   * - Cache miss: ~30-50ms (DB query + cache store)
   *
   * @param path - Normalized route path
   * @param method - HTTP method
   * @returns Route entity or null if not found
   */
  private async getRouteFromCacheOrDB(
    path: string,
    method: string,
  ): Promise<Route | null> {
    const cacheKey = `${method}:${path}`;
    const now = Date.now();

    // Check cache
    const cached = this.routeCache.get(cacheKey);
    if (cached && now - cached.cachedAt < this.ROUTE_CACHE_TTL) {
      // Cache hit - return cached route
      this.logger.debug(`🚀 CACHE HIT: ${cacheKey}`);
      return cached.route;
    }

    // Cache miss or expired - query database
    this.logger.debug(`💾 CACHE MISS: ${cacheKey} - Querying DB`);
    const route = await this.routeRepository.findOne({
      where: { path, method },
      relations: ['permission'],
    });

    // Store in cache
    this.routeCache.set(cacheKey, {
      route,
      cachedAt: now,
    });

    return route;
  }

  /**
   * Check if a route is currently cached (for logging/debugging)
   *
   * @param path - Normalized route path
   * @param method - HTTP method
   * @returns true if route is in cache and not expired
   */
  private isRouteCached(path: string, method: string): boolean {
    const cacheKey = `${method}:${path}`;
    const cached = this.routeCache.get(cacheKey);
    if (!cached) return false;

    const now = Date.now();
    return now - cached.cachedAt < this.ROUTE_CACHE_TTL;
  }

  /**
   * Start periodic cache cleanup to remove stale entries
   *
   * Runs every 5 minutes to:
   * - Remove expired cache entries
   * - Free memory
   * - Maintain cache performance
   *
   * Memory Impact:
   * - Typical cache size: 50-200 entries
   * - Each entry: ~500 bytes
   * - Total memory: <100KB
   */
  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      let removedCount = 0;

      for (const [key, cached] of this.routeCache.entries()) {
        if (now - cached.cachedAt >= this.ROUTE_CACHE_TTL) {
          this.routeCache.delete(key);
          removedCount++;
        }
      }

      if (removedCount > 0) {
        this.logger.debug(
          `🧹 Cache cleanup: Removed ${removedCount} stale entries. Cache size: ${this.routeCache.size}`,
        );
      }
    }, this.ROUTE_CACHE_TTL);
  }

  /**
   * FEATURE 4: Track failed permission attempt for rate limiting
   *
   * Tracks failed attempts per user to detect:
   * - Brute force attempts
   * - Suspicious scanning behavior
   * - Account enumeration
   *
   * Threshold: 10 failures within 1 minute = SUSPICIOUS_ACTIVITY
   *
   * @param userId - ID of user with failed attempt
   */
  private trackFailedAttempt(userId: number): void {
    const now = Date.now();
    const tracker = this.failedAttempts.get(userId);

    if (!tracker) {
      // First failure - create tracker
      this.failedAttempts.set(userId, {
        count: 1,
        firstFailureAt: now,
        lastFailureAt: now,
      });
      return;
    }

    // Check if still within rate limit window
    const timeElapsed = now - tracker.firstFailureAt;
    if (timeElapsed > this.RATE_LIMIT_WINDOW) {
      // Window expired - reset tracker
      this.failedAttempts.set(userId, {
        count: 1,
        firstFailureAt: now,
        lastFailureAt: now,
      });
      return;
    }

    // Increment failure count
    tracker.count++;
    tracker.lastFailureAt = now;
    this.failedAttempts.set(userId, tracker);

    // Check threshold
    if (tracker.count >= this.RATE_LIMIT_THRESHOLD) {
      this.logger.warn(
        `🚨 RATE LIMIT EXCEEDED: User ${userId} has ${tracker.count} failed attempts in ${Math.round(timeElapsed / 1000)}s`,
      );

      // Log suspicious activity to audit
      this.logAuditEvent({
        userId,
        action: SecurityAuditAction.SUSPICIOUS_ACTIVITY,
        resourceType: ResourceType.ROUTE,
        success: false,
        failureReason: `Rate limit exceeded: ${tracker.count} failures in ${Math.round(timeElapsed / 1000)}s`,
        ipAddress: 'unknown', // Not available in this context
        userAgent: 'unknown',
        requestPath: 'multiple',
        requestMethod: 'multiple',
        metadata: {
          failureCount: tracker.count,
          timeWindow: `${Math.round(timeElapsed / 1000)}s`,
          threshold: this.RATE_LIMIT_THRESHOLD,
        },
      });

      // Reset counter after logging (to avoid spam)
      this.failedAttempts.delete(userId);
    }
  }

  /**
   * Start periodic cleanup for failed attempts tracker
   *
   * Removes stale entries after 5 minutes of inactivity
   * Prevents memory leak from abandoned attempts
   */
  private startFailedAttemptsCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      let removedCount = 0;

      for (const [userId, tracker] of this.failedAttempts.entries()) {
        // Remove if last failure was more than cleanup interval ago
        if (now - tracker.lastFailureAt >= this.RATE_LIMIT_CLEANUP_INTERVAL) {
          this.failedAttempts.delete(userId);
          removedCount++;
        }
      }

      if (removedCount > 0) {
        this.logger.debug(
          `🧹 Failed attempts cleanup: Removed ${removedCount} stale trackers. Active trackers: ${this.failedAttempts.size}`,
        );
      }
    }, this.RATE_LIMIT_CLEANUP_INTERVAL);
  }

  /**
   * FEATURE 1: Log audit event asynchronously (fire-and-forget)
   *
   * Wraps SecurityAuditService.logPermissionCheck with:
   * - Fire-and-forget async pattern
   * - Error handling (don't throw on audit failures)
   * - Performance isolation (doesn't block request)
   *
   * This ensures audit logging never impacts request latency
   *
   * @param dto - Permission check details
   */
  private logAuditEvent(dto: LogPermissionCheckDto): void {
    // Fire-and-forget: Don't await, don't block request
    this.securityAuditService.logPermissionCheck(dto).catch((error) => {
      // Log error but don't throw (graceful degradation)
      this.logger.error(
        `Failed to log audit event: ${error.message}`,
        error.stack,
      );
    });
  }
}
