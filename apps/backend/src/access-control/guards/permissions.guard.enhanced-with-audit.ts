/**
 * @file permissions.guard.enhanced-with-audit.ts
 * @description Enhanced PermissionsGuard with integrated SecurityAuditService logging.
 * This is an example integration showing how to add security audit logging to the existing guard.
 *
 * USAGE INSTRUCTIONS:
 * 1. Review this implementation to understand the integration pattern
 * 2. Apply the same pattern to your existing permissions.guard.ts
 * 3. Key changes:
 *    - Inject SecurityAuditService in constructor
 *    - Add fire-and-forget logging calls (don't await to avoid blocking)
 *    - Log both successful and failed permission checks
 *    - Include rich context in metadata
 *
 * PERFORMANCE IMPACT:
 * - Async logging: <10ms overhead (fire-and-forget pattern)
 * - No blocking of HTTP requests
 * - Database writes happen in background
 *
 * This file serves as a reference implementation. To integrate into your existing guard:
 * ```typescript
 * // 1. Add import
 * import { SecurityAuditService } from '../security-audit/security-audit.service';
 * import { SecurityAuditAction, ResourceType } from '../entities/security-audit-log.entity';
 *
 * // 2. Inject in constructor
 * constructor(
 *   // ... existing dependencies
 *   private readonly securityAuditService: SecurityAuditService,
 * ) {}
 *
 * // 3. Add logging calls at key points (see examples below)
 * ```
 *
 * @author SouqSyria Security Team
 * @version 1.0.0
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
import { SecurityAuditService } from '../security-audit/security-audit.service';
import {
  SecurityAuditAction,
  ResourceType,
} from '../entities/security-audit-log.entity';

/**
 * EnhancedPermissionsGuard with Security Audit Logging
 *
 * This guard extends the standard PermissionsGuard functionality with
 * comprehensive security audit logging. Every authorization decision
 * (success or failure) is logged asynchronously for compliance and monitoring.
 *
 * Key Features:
 * - Logs all permission checks (success and failure)
 * - Logs security alerts (banned users, suspicious activity)
 * - Non-blocking async logging (fire-and-forget)
 * - Rich metadata for forensic analysis
 * - Performance monitoring and alerting
 *
 * Integration Steps:
 * 1. Ensure SecurityAuditModule is imported in AccessControlModule
 * 2. Inject SecurityAuditService in constructor
 * 3. Add logging calls after each authorization decision
 * 4. Use fire-and-forget pattern (.catch() for error handling)
 */
@Injectable()
export class EnhancedPermissionsGuard implements CanActivate {
  private readonly logger = new Logger(EnhancedPermissionsGuard.name);

  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(Route)
    private readonly routeRepository: Repository<Route>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    // NEW: Inject SecurityAuditService for audit logging
    private readonly securityAuditService: SecurityAuditService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const startTime = Date.now();
    const request = context.switchToHttp().getRequest();
    const jwtUser = request.user; // From JWT: { id: 2, role: "admin", email: "..." }
    const clientIP =
      request.ip || request.connection?.remoteAddress || 'unknown';
    const userAgent = request.headers['user-agent'] || 'unknown';

    this.logger.log(
      `🔐 ACL Check Started - IP: ${clientIP}, User-Agent: ${userAgent.substring(0, 50)}...`,
    );

    // CASE 1: No JWT user (unauthenticated access attempt)
    if (!jwtUser || !jwtUser.id) {
      this.logger.error('❌ SECURITY ALERT: No user found in JWT token');

      // NEW: Log unauthenticated access attempt
      this.securityAuditService
        .logPermissionCheck({
          userId: null, // Anonymous attempt
          action: SecurityAuditAction.ACCESS_DENIED,
          resourceType: ResourceType.ROUTE,
          permissionRequired: null,
          success: false,
          failureReason: 'No user found in JWT token - unauthenticated attempt',
          ipAddress: clientIP,
          userAgent,
          requestPath: this.getCleanPath(request),
          requestMethod: request.method,
          metadata: {
            originalUrl: request.originalUrl || request.url,
            referrer: request.headers.referer || null,
          },
        })
        .catch((err) =>
          this.logger.error('Failed to log unauthenticated attempt', err),
        );

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

    // CASE 2: User not found in database (stale JWT)
    if (!user) {
      this.logger.error(
        `❌ SECURITY ALERT: User ${jwtUser.id} not found in database`,
      );

      // NEW: Log user not found (potential security issue)
      this.securityAuditService
        .logPermissionCheck({
          userId: jwtUser.id,
          action: SecurityAuditAction.ACCESS_DENIED,
          resourceType: ResourceType.SYSTEM,
          permissionRequired: null,
          success: false,
          failureReason: `User ${jwtUser.id} not found in database - stale or invalid JWT`,
          ipAddress: clientIP,
          userAgent,
          requestPath: this.getCleanPath(request),
          requestMethod: request.method,
          metadata: {
            jwtEmail: jwtUser.email,
            jwtRole: jwtUser.role,
          },
        })
        .catch((err) => this.logger.error('Failed to log user not found', err));

      throw new ForbiddenException('Access denied. User not found.');
    }

    this.logger.log(
      `📋 User Details: ID=${user.id}, Email=${user.email}, Verified=${user.isVerified}, Banned=${user.isBanned}, Suspended=${user.isSuspended}`,
    );
    this.logger.log(
      `🎭 Business Role: ${user.role?.name || 'none'}, Admin Role: ${user.assignedRole?.name || 'none'}`,
    );

    // CASE 3: Banned user (security block)
    if (user.isBanned) {
      this.logger.error(
        `🚫 SECURITY ALERT: Banned user ${user.id} (${user.email}) attempted access from IP: ${clientIP}`,
      );

      // NEW: Log banned user access attempt (high severity)
      this.securityAuditService
        .logPermissionCheck({
          userId: user.id,
          action: SecurityAuditAction.USER_BANNED,
          resourceType: ResourceType.USER,
          resourceId: user.id,
          permissionRequired: null,
          success: false,
          failureReason: 'User account is banned - access denied',
          ipAddress: clientIP,
          userAgent,
          requestPath: this.getCleanPath(request),
          requestMethod: request.method,
          metadata: {
            userEmail: user.email,
            businessRole: user.role?.name,
            adminRole: user.assignedRole?.name,
            isBanned: true,
            bannedAttemptTimestamp: new Date().toISOString(),
          },
        })
        .catch((err) =>
          this.logger.error('Failed to log banned user attempt', err),
        );

      throw new ForbiddenException('Access denied. Account is banned.');
    }

    // CASE 4: Suspended user (warning only, allow access but log)
    if (user.isSuspended) {
      this.logger.warn(
        `⚠️ Suspended user ${user.id} (${user.email}) attempted access from IP: ${clientIP}`,
      );

      // NEW: Log suspended user access (for monitoring)
      this.securityAuditService
        .logPermissionCheck({
          userId: user.id,
          action: SecurityAuditAction.USER_SUSPENDED,
          resourceType: ResourceType.USER,
          resourceId: user.id,
          permissionRequired: null,
          success: true, // Allow access but log for monitoring
          failureReason: null,
          ipAddress: clientIP,
          userAgent,
          requestPath: this.getCleanPath(request),
          requestMethod: request.method,
          metadata: {
            userEmail: user.email,
            isSuspended: true,
            suspendedAccessTimestamp: new Date().toISOString(),
          },
        })
        .catch((err) =>
          this.logger.error('Failed to log suspended user access', err),
        );
    }

    // Get clean request path (without query params)
    const requestPath = this.getCleanPath(request);
    const requestMethod = request.method;
    const originalUrl = request.originalUrl || request.url;

    this.logger.log(
      `🌐 Request: ${requestMethod} ${originalUrl} → Normalized: ${requestPath}`,
    );

    // Try to find the route in DB
    const routeLoadStart = Date.now();
    const route = await this.routeRepository.findOne({
      where: { path: requestPath, method: requestMethod },
      relations: ['permission'],
    });
    const routeLoadTime = Date.now() - routeLoadStart;
    this.logger.debug(`📊 Route lookup completed in ${routeLoadTime}ms`);

    // CASE 5: No route mapping (public route)
    if (!route) {
      const totalTime = Date.now() - startTime;
      this.logger.log(
        `✅ PUBLIC ACCESS: No route mapping for ${requestMethod} ${requestPath} - Access granted (${totalTime}ms)`,
      );

      // NEW: Log public route access (for monitoring traffic patterns)
      this.securityAuditService
        .logPermissionCheck({
          userId: user.id,
          action: SecurityAuditAction.PERMISSION_CHECK,
          resourceType: ResourceType.ROUTE,
          resourceId: null,
          permissionRequired: null,
          success: true,
          failureReason: null,
          ipAddress: clientIP,
          userAgent,
          requestPath,
          requestMethod,
          metadata: {
            routeType: 'public',
            noRouteMapping: true,
            requestDuration: totalTime,
            userEmail: user.email,
            businessRole: user.role?.name,
            adminRole: user.assignedRole?.name,
          },
        })
        .catch((err) =>
          this.logger.error('Failed to log public route access', err),
        );

      return true;
    }

    this.logger.log(
      `🗺️ Route Found: ID=${route.id}, Path=${route.path}, Method=${route.method}`,
    );

    // CASE 6: Route exists but no permission required (public route)
    if (!route.permission) {
      const totalTime = Date.now() - startTime;
      this.logger.log(
        `✅ PUBLIC ROUTE: Route found but no permission required for ${requestMethod} ${requestPath} (${totalTime}ms)`,
      );

      // NEW: Log public route access
      this.securityAuditService
        .logPermissionCheck({
          userId: user.id,
          action: SecurityAuditAction.PERMISSION_CHECK,
          resourceType: ResourceType.ROUTE,
          resourceId: route.id,
          permissionRequired: null,
          success: true,
          failureReason: null,
          ipAddress: clientIP,
          userAgent,
          requestPath,
          requestMethod,
          metadata: {
            routeType: 'public',
            routeId: route.id,
            noPermissionRequired: true,
            requestDuration: totalTime,
            userEmail: user.email,
          },
        })
        .catch((err) =>
          this.logger.error('Failed to log public route access', err),
        );

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

    // CASE 7: Permission denied (most important security event)
    if (!hasPermission) {
      this.logger.error(
        `❌ ACCESS DENIED: User ${user.id} (${user.email}) from IP ${clientIP} missing permission: ${requiredPermission} for ${requestMethod} ${requestPath} (${totalTime}ms)`,
      );
      this.logger.error(
        `🔍 Permission Check Details: Required=[${requiredPermission}], Available=[${userPermissionNames.join(', ')}]`,
      );

      // NEW: Log access denied (critical security event)
      this.securityAuditService
        .logPermissionCheck({
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
            routeId: route.id,
            requestDuration: totalTime,
            userEmail: user.email,
            businessRole: user.role?.name,
            adminRole: user.assignedRole?.name,
            requiredPermission,
            availablePermissions: userPermissionNames,
            businessPermissions,
            adminPermissions,
            permissionGap: requiredPermission, // The specific missing permission
          },
        })
        .catch((err) => this.logger.error('Failed to log access denied', err));

      throw new ForbiddenException(
        `Access denied. Missing permission: ${requiredPermission}`,
      );
    }

    // CASE 8: Permission granted (successful authorization)
    this.logger.log(
      `✅ ACCESS GRANTED: User ${user.id} (${user.email}) accessed ${requestMethod} ${requestPath} with permission: ${requiredPermission} (${totalTime}ms)`,
    );

    // NEW: Log successful access (for audit trail and analytics)
    this.securityAuditService
      .logPermissionCheck({
        userId: user.id,
        action: SecurityAuditAction.ACCESS_GRANTED,
        resourceType: ResourceType.ROUTE,
        resourceId: route.id,
        permissionRequired: requiredPermission,
        success: true,
        failureReason: null,
        ipAddress: clientIP,
        userAgent,
        requestPath,
        requestMethod,
        metadata: {
          routeId: route.id,
          requestDuration: totalTime,
          userEmail: user.email,
          businessRole: user.role?.name,
          adminRole: user.assignedRole?.name,
          permissionUsed: requiredPermission,
          totalPermissions: userPermissionNames.length,
          userLoadTime,
          routeLoadTime,
        },
      })
      .catch((err) => this.logger.error('Failed to log access granted', err));

    // Performance warning for slow permission checks
    if (totalTime > 500) {
      this.logger.warn(
        `⚠️ PERFORMANCE: Slow permission check took ${totalTime}ms for user ${user.id}`,
      );

      // NEW: Log performance issue
      this.securityAuditService
        .logPermissionCheck({
          userId: user.id,
          action: SecurityAuditAction.SUSPICIOUS_ACTIVITY,
          resourceType: ResourceType.SYSTEM,
          permissionRequired: null,
          success: true,
          failureReason: null,
          ipAddress: clientIP,
          userAgent,
          requestPath,
          requestMethod,
          metadata: {
            performanceIssue: true,
            slowCheckDuration: totalTime,
            threshold: 500,
            userEmail: user.email,
          },
        })
        .catch((err) =>
          this.logger.error('Failed to log performance issue', err),
        );
    }

    return true;
  }

  /**
   * Get clean path without query parameters and normalize route parameters
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
   */
  private normalizeRouteParams(path: string): string {
    // Replace numeric IDs with :id parameter
    // /api/admin/routes/123 → /api/admin/routes/:id
    return path.replace(/\/\d+/g, '/:id');
  }

  /**
   * Get all permissions from both user roles (business role + assigned admin role)
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
}
