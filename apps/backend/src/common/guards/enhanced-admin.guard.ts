/**
 * @file enhanced-admin.guard.ts
 * @description Enhanced security guard for admin operations.
 * 
 * This guard provides additional security layers for administrative endpoints:
 * - IP whitelisting (optional, configurable)
 * - Enhanced rate limiting for admin operations
 * - Suspicious activity detection
 * - Session validation
 * - Detailed audit logging for admin actions
 * 
 * @author SouqSyria Development Team
 * @since 2026-01-20
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

/**
 * Decorator key for skipping IP whitelist check
 */
export const SKIP_IP_WHITELIST_KEY = 'skipIpWhitelist';

/**
 * Decorator key for requiring 2FA
 */
export const REQUIRE_2FA_KEY = 'require2FA';

/**
 * Decorator key for sensitive operation marking
 */
export const SENSITIVE_OPERATION_KEY = 'sensitiveOperation';

/**
 * Enhanced Admin Guard
 * 
 * Provides additional security for administrative operations beyond
 * basic JWT authentication and role-based access control.
 */
@Injectable()
export class EnhancedAdminGuard implements CanActivate {
  private readonly logger = new Logger(EnhancedAdminGuard.name);
  
  /**
   * Default allowed IPs for admin access
   * Can be overridden via environment configuration
   */
  private readonly defaultAllowedIps: string[] = [
    '127.0.0.1',
    '::1',
    'localhost',
  ];
  
  /**
   * Track failed attempts for rate limiting
   * In production, this should use Redis for distributed tracking
   */
  private readonly failedAttempts: Map<string, { count: number; lastAttempt: Date }> = new Map();
  
  /**
   * Maximum failed attempts before temporary block
   */
  private readonly maxFailedAttempts = 5;
  
  /**
   * Block duration in milliseconds (15 minutes)
   */
  private readonly blockDurationMs = 15 * 60 * 1000;
  
  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {}
  
  /**
   * Validates admin access with enhanced security checks
   * 
   * @param context - The execution context
   * @returns True if access is granted
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as any).user;
    
    // 1. Verify user is authenticated
    if (!user) {
      throw new UnauthorizedException('Authentication required for admin access');
    }
    
    // 2. Verify user has admin role
    const userRole = user.role?.name || user.role;
    const allowedRoles = ['owner', 'admin', 'super_admin'];
    if (!allowedRoles.includes(userRole)) {
      this.logSecurityEvent(request, user, 'UNAUTHORIZED_ADMIN_ACCESS', {
        attemptedRole: userRole,
        requiredRoles: allowedRoles,
      });
      throw new ForbiddenException('Admin access required');
    }
    
    // 3. Check IP whitelist if enabled
    const skipIpCheck = this.reflector.get<boolean>(
      SKIP_IP_WHITELIST_KEY,
      context.getHandler(),
    );
    if (!skipIpCheck && this.isIpWhitelistEnabled()) {
      await this.validateIpAddress(request, user);
    }
    
    // 4. Check for rate limiting (failed attempts)
    await this.checkRateLimiting(request);
    
    // 5. Check for suspicious activity patterns
    await this.checkSuspiciousActivity(request, user);
    
    // 6. Check if 2FA is required for this endpoint
    const require2FA = this.reflector.get<boolean>(
      REQUIRE_2FA_KEY,
      context.getHandler(),
    );
    if (require2FA && !this.isUser2FAVerified(user)) {
      throw new ForbiddenException('Two-factor authentication required for this operation');
    }
    
    // 7. Log successful admin access for sensitive operations
    const isSensitive = this.reflector.get<boolean>(
      SENSITIVE_OPERATION_KEY,
      context.getHandler(),
    );
    if (isSensitive) {
      this.logSecurityEvent(request, user, 'SENSITIVE_OPERATION_ACCESS', {
        endpoint: request.url,
        method: request.method,
      });
    }
    
    return true;
  }
  
  /**
   * Checks if IP whitelist is enabled
   */
  private isIpWhitelistEnabled(): boolean {
    return this.configService.get<boolean>('ADMIN_IP_WHITELIST_ENABLED', false);
  }
  
  /**
   * Gets the configured IP whitelist
   */
  private getIpWhitelist(): string[] {
    const configuredIps = this.configService.get<string>('ADMIN_IP_WHITELIST', '');
    if (!configuredIps) {
      return this.defaultAllowedIps;
    }
    return [...this.defaultAllowedIps, ...configuredIps.split(',').map(ip => ip.trim())];
  }
  
  /**
   * Validates the request IP against the whitelist
   */
  private async validateIpAddress(request: Request, user: any): Promise<void> {
    const clientIp = this.getClientIp(request);
    const allowedIps = this.getIpWhitelist();
    
    // Check if IP is in whitelist or matches CIDR pattern
    const isAllowed = allowedIps.some(ip => {
      if (ip.includes('/')) {
        return this.matchCIDR(clientIp, ip);
      }
      return ip === clientIp;
    });
    
    if (!isAllowed) {
      this.logSecurityEvent(request, user, 'IP_WHITELIST_VIOLATION', {
        clientIp,
        allowedIps,
      });
      throw new ForbiddenException('Admin access not allowed from this IP address');
    }
  }
  
  /**
   * Gets the client IP address from the request
   */
  private getClientIp(request: Request): string {
    const forwardedFor = request.headers['x-forwarded-for'];
    if (forwardedFor) {
      const ips = (forwardedFor as string).split(',').map(ip => ip.trim());
      return ips[0];
    }
    
    const realIp = request.headers['x-real-ip'];
    if (realIp) {
      return realIp as string;
    }
    
    return request.ip || request.connection?.remoteAddress || 'unknown';
  }
  
  /**
   * Matches an IP against a CIDR notation
   * Basic implementation - for production, use a proper CIDR library
   */
  private matchCIDR(ip: string, cidr: string): boolean {
    // Simple implementation for /24 and /16 blocks
    const [network, bits] = cidr.split('/');
    const maskBits = parseInt(bits);
    
    const ipParts = ip.split('.').map(Number);
    const networkParts = network.split('.').map(Number);
    
    const octetsToCheck = Math.floor(maskBits / 8);
    
    for (let i = 0; i < octetsToCheck; i++) {
      if (ipParts[i] !== networkParts[i]) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Checks rate limiting based on failed attempts
   */
  private async checkRateLimiting(request: Request): Promise<void> {
    const clientIp = this.getClientIp(request);
    const attempts = this.failedAttempts.get(clientIp);
    
    if (attempts) {
      const timeSinceLastAttempt = Date.now() - attempts.lastAttempt.getTime();
      
      // Reset counter if block duration has passed
      if (timeSinceLastAttempt > this.blockDurationMs) {
        this.failedAttempts.delete(clientIp);
        return;
      }
      
      // Check if max attempts exceeded
      if (attempts.count >= this.maxFailedAttempts) {
        const remainingBlockTime = Math.ceil(
          (this.blockDurationMs - timeSinceLastAttempt) / 60000,
        );
        throw new ForbiddenException(
          `Too many failed attempts. Try again in ${remainingBlockTime} minutes.`,
        );
      }
    }
  }
  
  /**
   * Records a failed attempt
   */
  public recordFailedAttempt(request: Request): void {
    const clientIp = this.getClientIp(request);
    const current = this.failedAttempts.get(clientIp) || { count: 0, lastAttempt: new Date() };
    
    this.failedAttempts.set(clientIp, {
      count: current.count + 1,
      lastAttempt: new Date(),
    });
    
    this.logger.warn(`Failed admin attempt from IP: ${clientIp}, count: ${current.count + 1}`);
  }
  
  /**
   * Checks for suspicious activity patterns
   */
  private async checkSuspiciousActivity(request: Request, user: any): Promise<void> {
    // Check for rapid succession of requests (potential automation)
    const lastAccessTime = (request as any).lastAdminAccessTime;
    if (lastAccessTime) {
      const timeDiff = Date.now() - lastAccessTime;
      if (timeDiff < 100) { // Less than 100ms between requests
        this.logSecurityEvent(request, user, 'RAPID_REQUEST_DETECTED', {
          timeDiffMs: timeDiff,
        });
        // Don't block, just log for analysis
      }
    }
    
    // Check for unusual user agent
    const userAgent = request.headers['user-agent'] || '';
    if (this.isUnusualUserAgent(userAgent)) {
      this.logSecurityEvent(request, user, 'UNUSUAL_USER_AGENT', {
        userAgent,
      });
      // Don't block, just log for analysis
    }
    
    // Track this access time
    (request as any).lastAdminAccessTime = Date.now();
  }
  
  /**
   * Checks if user agent is unusual for admin access
   */
  private isUnusualUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [
      /curl/i,
      /wget/i,
      /python-requests/i,
      /postman/i, // Allow Postman in development
      /insomnia/i,
    ];
    
    // In development, allow these
    if (process.env.NODE_ENV === 'development') {
      return false;
    }
    
    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }
  
  /**
   * Checks if user has completed 2FA verification
   */
  private isUser2FAVerified(user: any): boolean {
    // Check if user has 2FA session flag
    // This should be set after successful 2FA verification
    return user.twoFactorVerified === true;
  }
  
  /**
   * Logs security events for monitoring and alerting
   */
  private logSecurityEvent(
    request: Request,
    user: any,
    eventType: string,
    details: any,
  ): void {
    const logEntry = {
      eventType,
      timestamp: new Date().toISOString(),
      userId: user?.id,
      userEmail: user?.email,
      userRole: user?.role?.name || user?.role,
      ip: this.getClientIp(request),
      userAgent: request.headers['user-agent'],
      endpoint: request.url,
      method: request.method,
      details,
    };
    
    // Log with appropriate level based on event type
    switch (eventType) {
      case 'UNAUTHORIZED_ADMIN_ACCESS':
      case 'IP_WHITELIST_VIOLATION':
        this.logger.error(`🚨 SECURITY: ${eventType}`, JSON.stringify(logEntry));
        break;
      case 'RAPID_REQUEST_DETECTED':
      case 'UNUSUAL_USER_AGENT':
        this.logger.warn(`⚠️ SECURITY: ${eventType}`, JSON.stringify(logEntry));
        break;
      default:
        this.logger.log(`🔒 SECURITY: ${eventType}`, JSON.stringify(logEntry));
    }
    
    // TODO: In production, also send to external monitoring (Sentry, ELK, etc.)
  }
}

// =============================================================================
// DECORATORS
// =============================================================================

/**
 * Decorator to skip IP whitelist check for specific endpoints
 */
export function SkipIpWhitelist(): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(SKIP_IP_WHITELIST_KEY, true, descriptor.value);
    return descriptor;
  };
}

/**
 * Decorator to require 2FA for specific endpoints
 */
export function Require2FA(): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(REQUIRE_2FA_KEY, true, descriptor.value);
    return descriptor;
  };
}

/**
 * Decorator to mark sensitive operations (for audit logging)
 */
export function SensitiveOperation(): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(SENSITIVE_OPERATION_KEY, true, descriptor.value);
    return descriptor;
  };
}
