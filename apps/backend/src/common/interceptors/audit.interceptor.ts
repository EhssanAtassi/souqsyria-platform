/**
 * ✅ SOUQSYRIA AUTO-LOGGING INTERCEPTOR
 *
 * Automatically logs all API requests using your existing AuditLogService
 * Integrates with your Firebase auth and current user setup
 *
 * @author SouqSyria Engineering Team
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AuditLogService } from '../../audit-log/service/audit-log.service';
import { CreateAuditLogDto } from '../../audit-log/dto/create-audit-log.dto';
import { SimpleAuditLogDto } from '../../audit-log/dto/simple-audit-log.dto';
import {
  SKIP_AUDIT_KEY,
  AUDIT_ACTION_KEY,
  AUDIT_PRIORITY_KEY,
  AUDIT_DETAIL_LEVEL_KEY,
} from '../decorators/audit.decorators';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  // Paths to exclude from auto-logging
  private readonly excludePaths = [
    '/health',
    '/metrics',
    '/api/docs',
    '/swagger',
    '/favicon.ico',
    '/robots.txt',
  ];

  constructor(
    private readonly auditLogService: AuditLogService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // ✅ CHECK IF SHOULD SKIP LOGGING
    if (this.shouldSkipAudit(context, request)) {
      return next.handle();
    }

    // ✅ EXTRACT ALL AUDIT DATA
    const auditData = this.extractAuditData(context, request, startTime);

    return next.handle().pipe(
      // ✅ SUCCESS CASE - Async logging for performance
      tap((responseData) => {
        setImmediate(() => {
          this.logSuccess(auditData, response, responseData, startTime);
        });
      }),

      // ✅ ERROR CASE - Immediate logging for security
      catchError((error) => {
        // Log error immediately but don't block the response
        setImmediate(() => {
          this.logError(auditData, error, startTime);
        });
        throw error; // Re-throw to maintain normal error handling
      }),
    );
  }

  // ================================
  // SKIP LOGIC
  // ================================

  private shouldSkipAudit(context: ExecutionContext, request: any): boolean {
    // Check decorator
    const skipAudit = this.reflector.get<boolean>(
      SKIP_AUDIT_KEY,
      context.getHandler(),
    );
    if (skipAudit) {
      this.logger.debug(
        `🚫 Skipping audit for ${request.method} ${request.url} (decorator)`,
      );
      return true;
    }

    // Check excluded paths
    const url = request.url || '';
    const shouldSkip = this.excludePaths.some((path) => url.includes(path));
    if (shouldSkip) {
      this.logger.debug(
        `🚫 Skipping audit for ${request.method} ${url} (excluded path)`,
      );
      return true;
    }

    return false;
  }

  // ================================
  // DATA EXTRACTION
  // ================================

  private extractAuditData(
    context: ExecutionContext,
    request: any,
    startTime: number,
  ) {
    // ✅ GET USER FROM YOUR FIREBASE AUTH
    const user = request.user; // Set by your FirebaseAuthGuard

    // ✅ EXTRACT REQUEST DETAILS
    const method = request.method;
    const path = request.route?.path || request.url;
    const ip = request.ip || request.connection?.remoteAddress || 'unknown';
    const userAgent = request.headers['user-agent'] || 'unknown';

    // ✅ GET DECORATOR OVERRIDES
    const customAction = this.reflector.get<string>(
      AUDIT_ACTION_KEY,
      context.getHandler(),
    );
    const priority = this.reflector.get<string>(
      AUDIT_PRIORITY_KEY,
      context.getHandler(),
    );
    const detailLevel =
      this.reflector.get<string>(
        AUDIT_DETAIL_LEVEL_KEY,
        context.getHandler(),
      ) || 'simple';

    // ✅ GENERATE ACTION NAME
    const action = customAction || this.generateActionName(path, method);
    const module = this.extractModuleName(path);

    // ✅ DETERMINE BUSINESS CONTEXT
    const businessModel = this.determineBusinessModel(path);
    const isFinancialEvent = this.isFinancialRequest(path, request.body);
    const isSecurityEvent = this.isSecurityRequest(path, action);

    // ✅ EXTRACT ENTITY INFO
    const entityType = this.extractEntityType(path);
    const entityId = this.extractEntityId(request.params);

    // ✅ EXTRACT MONETARY INFO
    const monetaryAmount = this.extractMonetaryAmount(request.body);
    const currency = this.extractCurrency(request.body, monetaryAmount);

    return {
      action,
      module,
      actorId: user?.id || null,
      actorType: user?.role || 'anonymous',
      actorEmail: user?.email,
      actorName: user?.name,
      entityType,
      entityId,
      monetaryAmount,
      currency,
      businessModel,
      isFinancialEvent,
      isSecurityEvent,
      ipAddress: ip,
      userAgent,
      priority: priority || 'medium',
      detailLevel,
      startTime,
      path,
      method,
      sessionId: request.headers['x-session-id'],
      requestId: this.generateRequestId(),
      country: this.extractCountry(ip),
    };
  }

  // ================================
  // SUCCESS LOGGING
  // ================================

  private async logSuccess(
    auditData: any,
    response: any,
    responseData: any,
    startTime: number,
  ) {
    try {
      const processingTime = Date.now() - startTime;

      if (auditData.detailLevel === 'minimal') {
        // Minimal logging - just action + user + timestamp
        await this.logMinimal(auditData, processingTime, true);
      } else if (
        auditData.detailLevel === 'simple' ||
        auditData.priority === 'low'
      ) {
        // Simple logging for most cases
        await this.logSimpleSuccess(auditData, processingTime);
      } else {
        // Detailed logging for high-priority operations
        await this.logDetailedSuccess(auditData, processingTime, responseData);
      }

      this.logger.debug(
        `✅ Auto-logged SUCCESS: ${auditData.action} by ${auditData.actorType}:${auditData.actorId} (${processingTime}ms)`,
      );
    } catch (error: unknown) {
      this.logger.error(
        `❌ Auto-logging failed for ${auditData.action}: ${(error as Error).message}`,
        // Don't include stack trace to avoid log spam
      );
      // Continue normally - logging failures shouldn't break API
    }
  }

  // ================================
  // ERROR LOGGING
  // ================================

  private async logError(auditData: any, error: any, startTime: number) {
    try {
      const processingTime = Date.now() - startTime;

      // Always use detailed logging for errors
      const errorAuditDto: CreateAuditLogDto = {
        action: auditData.action,
        module: auditData.module,
        actorId: auditData.actorId,
        actorType: auditData.actorType,
        actorEmail: auditData.actorEmail,
        actorName: auditData.actorName,
        entityType: auditData.entityType,
        entityId: auditData.entityId,
        severity: this.determineSeverity(error),
        isSecurityEvent:
          auditData.isSecurityEvent || this.isSecurityError(error),
        isFinancialEvent: auditData.isFinancialEvent,
        ipAddress: auditData.ipAddress,
        userAgent: auditData.userAgent,
        requestId: auditData.requestId,
        businessModel: auditData.businessModel,
        country: auditData.country,
        monetaryAmount: auditData.monetaryAmount,
        currency: auditData.currency,
        processingTimeMs: processingTime,
        wasSuccessful: false,
        errorMessage: (error as Error).message || 'Unknown error',
        errorCode: this.extractErrorCode(error),
        description: `${auditData.action} failed: ${(error as Error).message}`,
        sessionId: auditData.sessionId,
      };

      await this.auditLogService.log(errorAuditDto);

      this.logger.error(
        `❌ Auto-logged ERROR: ${auditData.action} by ${auditData.actorType}:${auditData.actorId} - ${(error as Error).message} (${processingTime}ms)`,
      );
    } catch (logError) {
      this.logger.error(
        `❌ CRITICAL: Error logging failed for ${auditData.action}: ${logError.message}`,
      );
    }
  }

  // ================================
  // LOGGING METHODS BY DETAIL LEVEL
  // ================================

  private async logMinimal(
    auditData: any,
    processingTime: number,
    success: boolean,
  ) {
    const minimalDto: SimpleAuditLogDto = {
      action: auditData.action,
      module: auditData.module,
      actorId: auditData.actorId,
      actorType: auditData.actorType,
    };

    await this.auditLogService.logSimple(minimalDto);
  }

  private async logSimpleSuccess(auditData: any, processingTime: number) {
    const simpleDto: SimpleAuditLogDto = {
      action: auditData.action,
      module: auditData.module,
      actorId: auditData.actorId,
      actorType: auditData.actorType,
      entityType: auditData.entityType,
      entityId: auditData.entityId,
      monetaryAmount: auditData.monetaryAmount,
      currency: auditData.currency,
      businessModel: auditData.businessModel,
      description: `${auditData.actorType} ${auditData.actorId} performed ${auditData.action} successfully`,
    };

    await this.auditLogService.logSimple(simpleDto);
  }

  private async logDetailedSuccess(
    auditData: any,
    processingTime: number,
    responseData: any,
  ) {
    const detailedDto: CreateAuditLogDto = {
      action: auditData.action,
      module: auditData.module,
      actorId: auditData.actorId,
      actorType: auditData.actorType,
      actorEmail: auditData.actorEmail,
      actorName: auditData.actorName,
      entityType: auditData.entityType,
      entityId: auditData.entityId,
      severity: 'medium',
      isFinancialEvent: auditData.isFinancialEvent,
      isSecurityEvent: auditData.isSecurityEvent,
      ipAddress: auditData.ipAddress,
      userAgent: auditData.userAgent,
      requestId: auditData.requestId,
      businessModel: auditData.businessModel,
      country: auditData.country,
      monetaryAmount: auditData.monetaryAmount,
      currency: auditData.currency,
      processingTimeMs: processingTime,
      wasSuccessful: true,
      description: `${auditData.action} completed successfully`,
      sessionId: auditData.sessionId,
      // Add response data for high-priority operations
      afterData:
        auditData.priority === 'critical'
          ? this.sanitizeResponseData(responseData)
          : undefined,
    };

    await this.auditLogService.log(detailedDto);
  }

  // ================================
  // HELPER METHODS
  // ================================

  private generateActionName(path: string, method: string): string {
    const pathParts = path.split('/').filter(Boolean);
    const module = pathParts[1] || 'unknown'; // Skip 'api'

    const methodMap = {
      GET: 'read',
      POST: 'create',
      PUT: 'update',
      PATCH: 'update',
      DELETE: 'delete',
    };

    const operation = methodMap[method] || 'action';
    return `${module}.${operation}`;
  }

  private extractModuleName(path: string): string {
    const pathParts = path.split('/').filter(Boolean);
    return pathParts[1] || 'unknown'; // Skip 'api'
  }

  private determineBusinessModel(path: string): string {
    if (path.includes('/admin/')) return 'B2B2C';
    if (path.includes('/vendor/')) return 'B2B';
    return 'B2C';
  }

  private isFinancialRequest(path: string, body: any): boolean {
    const financialKeywords = [
      'payment',
      'order',
      'commission',
      'refund',
      'wallet',
      'price',
    ];
    const hasFinancialPath = financialKeywords.some((keyword) =>
      path.toLowerCase().includes(keyword),
    );
    const hasMonetaryData =
      body && (body.amount || body.price || body.monetaryAmount || body.total);

    return hasFinancialPath || hasMonetaryData;
  }

  private isSecurityRequest(path: string, action: string): boolean {
    const securityKeywords = [
      'auth',
      'login',
      'permission',
      'role',
      'ban',
      'block',
    ];
    return securityKeywords.some(
      (keyword) =>
        path.toLowerCase().includes(keyword) ||
        action.toLowerCase().includes(keyword),
    );
  }

  private extractEntityType(path: string): string | undefined {
    const pathParts = path.split('/').filter(Boolean);
    if (pathParts.length >= 2) {
      let entityType = pathParts[1]; // e.g., 'products', 'orders'

      // Remove 'admin' prefix if present
      if (entityType === 'admin' && pathParts.length >= 3) {
        entityType = pathParts[2];
      }

      // Convert plural to singular
      return entityType.endsWith('s') ? entityType.slice(0, -1) : entityType;
    }
    return undefined;
  }

  private extractEntityId(params: any): number | undefined {
    if (params && params.id) {
      const id = parseInt(params.id);
      return isNaN(id) ? undefined : id;
    }
    return undefined;
  }

  private extractMonetaryAmount(body: any): number | undefined {
    if (!body) return undefined;
    const amount =
      body.amount || body.price || body.monetaryAmount || body.total;
    return typeof amount === 'number' ? amount : undefined;
  }

  private extractCurrency(body: any, amount?: number): string | undefined {
    if (!body) return undefined;

    // Explicit currency field
    if (body.currency) return body.currency;

    // Default to SYP for Syrian market if amount exists
    return amount ? 'SYP' : undefined;
  }

  private extractCountry(ip: string): string {
    // Simple heuristic - in production, use proper GeoIP service
    if (ip.startsWith('192.168') || ip === 'unknown' || ip.startsWith('127.')) {
      return 'Syria'; // Assume local/unknown IPs are Syrian
    }
    return 'International';
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private determineSeverity(
    error: any,
  ): 'low' | 'medium' | 'high' | 'critical' {
    const status = error.status || error.statusCode || 500;

    if (status >= 500) return 'critical';
    if (status === 403 || status === 401) return 'high';
    if (status >= 400) return 'medium';
    return 'low';
  }

  private isSecurityError(error: any): boolean {
    const status = error.status || error.statusCode || 500;
    const securityStatuses = [401, 403, 429]; // Unauthorized, Forbidden, Too Many Requests
    return securityStatuses.includes(status);
  }

  private extractErrorCode(error: any): string {
    return error.code || error.name || 'UNKNOWN_ERROR';
  }

  private sanitizeResponseData(responseData: any): any {
    if (!responseData || typeof responseData !== 'object') {
      return undefined;
    }

    // Remove sensitive fields from response logging
    const sanitized = { ...responseData };
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.apiKey;
    delete sanitized.secret;

    // Limit size to prevent huge logs
    const jsonString = JSON.stringify(sanitized);
    if (jsonString.length > 1000) {
      return { truncated: true, size: jsonString.length };
    }

    return sanitized;
  }
}
