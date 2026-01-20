/**
 * @file permissions.guard.ts
 * @description Enterprise-grade guard that dynamically checks permissions based on route table at runtime.
 * Supports dual-role system, proper user loading, and comprehensive permission checking.
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

@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly logger = new Logger(PermissionsGuard.name);

  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(Route)
    private readonly routeRepository: Repository<Route>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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

    if (!jwtUser || !jwtUser.id) {
      this.logger.error('❌ SECURITY ALERT: No user found in JWT token');
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
      this.logger.error(
        `❌ SECURITY ALERT: User ${jwtUser.id} not found in database`,
      );
      throw new ForbiddenException('Access denied. User not found.');
    }

    this.logger.log(
      `📋 User Details: ID=${user.id}, Email=${user.email}, Verified=${user.isVerified}, Banned=${user.isBanned}, Suspended=${user.isSuspended}`,
    );
    this.logger.log(
      `🎭 Business Role: ${user.role?.name || 'none'}, Admin Role: ${user.assignedRole?.name || 'none'}`,
    );

    // Check if user is banned or suspended
    if (user.isBanned) {
      this.logger.error(
        `🚫 SECURITY ALERT: Banned user ${user.id} (${user.email}) attempted access from IP: ${clientIP}`,
      );
      throw new ForbiddenException('Access denied. Account is banned.');
    }

    if (user.isSuspended) {
      this.logger.warn(
        `⚠️ Suspended user ${user.id} (${user.email}) attempted access from IP: ${clientIP}`,
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

    if (!route) {
      // No route mapping found = public route (allow access)
      const totalTime = Date.now() - startTime;
      this.logger.log(
        `✅ PUBLIC ACCESS: No route mapping for ${requestMethod} ${requestPath} - Access granted (${totalTime}ms)`,
      );
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
      throw new ForbiddenException(
        `Access denied. Missing permission: ${requiredPermission}`,
      );
    }

    this.logger.log(
      `✅ ACCESS GRANTED: User ${user.id} (${user.email}) accessed ${requestMethod} ${requestPath} with permission: ${requiredPermission} (${totalTime}ms)`,
    );

    // Performance warning for slow permission checks
    if (totalTime > 500) {
      this.logger.warn(
        `⚠️ PERFORMANCE: Slow permission check took ${totalTime}ms for user ${user.id}`,
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
