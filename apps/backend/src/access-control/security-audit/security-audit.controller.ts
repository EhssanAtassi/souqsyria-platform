/**
 * @file security-audit.controller.ts
 * @description Admin API controller for security audit log querying, analysis, and export.
 * Provides comprehensive endpoints for security monitoring, compliance reporting,
 * and incident investigation.
 *
 * Key Features:
 * - Query security events with advanced filtering
 * - Detect suspicious activity patterns
 * - Export logs for compliance (CSV/JSON)
 * - Get failed attempt counts for rate limiting
 * - Security dashboard data aggregation
 *
 * Security:
 * - All endpoints require admin authentication
 * - Protected with permission checks (admin_security_logs)
 * - Input validation and sanitization
 * - Rate limiting recommended for export endpoints
 *
 * @author SouqSyria Security Team
 * @version 1.0.0
 */

import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
  ParseIntPipe,
  DefaultValuePipe,
  ParseBoolPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { Response } from 'express';
import { SecurityAuditService } from './security-audit.service';
import {
  SecurityAuditLog,
  SecurityAuditAction,
  ResourceType,
} from '../entities/security-audit-log.entity';
// NOTE: JwtAuthGuard and PermissionsGuard are registered as global APP_GUARDs
// in app.module.ts, so explicit @UseGuards is NOT needed here.
// Adding them would cause duplicate instantiation and dependency resolution issues.

/**
 * SecurityAuditController
 *
 * Provides RESTful API for security audit log management.
 * All endpoints require authentication and admin permissions.
 *
 * Base path: /api/security-audit
 *
 * Security:
 * - JwtAuthGuard (global): Authentication enforced automatically
 * - PermissionsGuard (global): Authorization enforced via route table
 *
 * Typical use cases:
 * - Security dashboard: Real-time monitoring
 * - Compliance audits: Historical log retrieval
 * - Incident response: Investigation and forensics
 * - Threat detection: Suspicious activity analysis
 */
@ApiTags('Security Audit')
@Controller('security-audit')
@ApiBearerAuth()
export class SecurityAuditController {
  constructor(private readonly securityAuditService: SecurityAuditService) {}

  /**
   * Get security events with advanced filtering and pagination
   *
   * Endpoint: GET /api/security-audit/events
   *
   * Query Parameters:
   * - userId: Filter by specific user ID
   * - action: Filter by event type (PERMISSION_CHECK, ACCESS_DENIED, etc.)
   * - resourceType: Filter by resource type (route, permission, role, user)
   * - success: Filter by success status (true/false)
   * - ipAddress: Filter by IP address
   * - startDate: Start of date range (ISO 8601)
   * - endDate: End of date range (ISO 8601)
   * - page: Page number (default: 1)
   * - limit: Records per page (default: 50, max: 200)
   *
   * Use Cases:
   * - "Show me all failed access attempts in the last 24 hours"
   * - "Get all security events for user ID 42"
   * - "Find all ACCESS_DENIED events from IP 192.168.1.100"
   * - "Show permission checks for the last week"
   *
   * Performance:
   * - Indexed queries: <200ms
   * - Large result sets: Use pagination
   * - Recommended limit: 50-100 records per page
   *
   * @param userId - Optional user ID filter
   * @param action - Optional action type filter
   * @param resourceType - Optional resource type filter
   * @param success - Optional success status filter
   * @param ipAddress - Optional IP address filter
   * @param startDate - Optional start date (ISO 8601 string)
   * @param endDate - Optional end date (ISO 8601 string)
   * @param page - Page number (1-based)
   * @param limit - Records per page
   * @returns Paginated security event logs with metadata
   *
   * @example
   * GET /api/security-audit/events?success=false&limit=20&page=1
   * GET /api/security-audit/events?userId=42&startDate=2024-01-01T00:00:00Z
   * GET /api/security-audit/events?action=ACCESS_DENIED&ipAddress=192.168.1.100
   */
  @Get('events')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Query security audit events with filtering',
    description:
      'Retrieve security audit logs with advanced filtering options including user, action type, date range, and more. Supports pagination for large result sets. Useful for security dashboards, compliance audits, and incident investigation.',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: Number,
    description: 'Filter by specific user ID',
    example: 42,
  })
  @ApiQuery({
    name: 'action',
    required: false,
    enum: SecurityAuditAction,
    description: 'Filter by security event action type',
    example: SecurityAuditAction.ACCESS_DENIED,
  })
  @ApiQuery({
    name: 'resourceType',
    required: false,
    enum: ResourceType,
    description: 'Filter by resource type',
    example: ResourceType.ROUTE,
  })
  @ApiQuery({
    name: 'success',
    required: false,
    type: Boolean,
    description: 'Filter by success status (true for successful, false for failed)',
    example: false,
  })
  @ApiQuery({
    name: 'ipAddress',
    required: false,
    type: String,
    description: 'Filter by client IP address',
    example: '192.168.1.100',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start of date range (ISO 8601 format)',
    example: '2024-01-01T00:00:00Z',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End of date range (ISO 8601 format)',
    example: '2024-01-31T23:59:59Z',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (1-based)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of records per page (max 200)',
    example: 50,
  })
  @ApiResponse({
    status: 200,
    description: 'Security events retrieved successfully',
    schema: {
      example: {
        logs: [
          {
            id: 12345,
            userId: 42,
            action: 'ACCESS_DENIED',
            resourceType: 'route',
            resourceId: 15,
            permissionRequired: 'manage_products',
            success: false,
            failureReason: 'Missing permission: manage_products',
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0...',
            requestPath: '/api/admin/products/123',
            requestMethod: 'DELETE',
            metadata: { roleName: 'vendor', attemptCount: 3 },
            createdAt: '2024-01-21T10:30:00.000Z',
          },
        ],
        total: 150,
        page: 1,
        limit: 50,
        totalPages: 3,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token missing or invalid',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User lacks required permission',
  })
  async getSecurityEvents(
    @Query('userId') userId?: number,
    @Query('action') action?: SecurityAuditAction,
    @Query('resourceType') resourceType?: ResourceType,
    @Query('success') success?: boolean,
    @Query('ipAddress') ipAddress?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number = 50,
  ): Promise<{
    logs: SecurityAuditLog[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    // Enforce max limit to prevent resource exhaustion
    const maxLimit = 200;
    const effectiveLimit = Math.min(limit, maxLimit);

    // Parse date strings to Date objects
    const filters = {
      userId: userId ? Number(userId) : undefined,
      action,
      resourceType,
      success: success !== undefined ? success : undefined,
      ipAddress,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page,
      limit: effectiveLimit,
    };

    return this.securityAuditService.getSecurityEvents(filters);
  }

  /**
   * Detect suspicious activity patterns in recent security logs
   *
   * Endpoint: GET /api/security-audit/suspicious-activity
   *
   * Analyzes recent security events to identify potential threats:
   * - Brute force attempts (excessive failed logins)
   * - Rate limit violations (too many requests from single source)
   * - Distributed attacks (multiple IPs targeting same user)
   * - Unusual access patterns (scanning, probing)
   *
   * Uses configurable thresholds:
   * - 10+ failed attempts per user in 10 minutes → Flagged
   * - 20+ failed attempts per IP in 10 minutes → Flagged
   * - Multiple users targeted from single IP → Distributed attack
   *
   * Use Cases:
   * - Real-time security monitoring dashboards
   * - Automated alerting systems
   * - Incident response triggers
   * - Rate limiting enforcement
   *
   * Performance: <500ms for 10-minute analysis window
   *
   * @param timeWindowMinutes - Time window in minutes to analyze (default: 10)
   * @returns Detailed report of suspicious activities with severity levels
   *
   * @example
   * GET /api/security-audit/suspicious-activity?timeWindowMinutes=10
   * GET /api/security-audit/suspicious-activity?timeWindowMinutes=60
   */
  @Get('suspicious-activity')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Detect suspicious security activity patterns',
    description:
      'Analyzes recent security logs to identify potential threats such as brute force attempts, rate limit violations, and distributed attacks. Returns detailed findings with severity levels and recommended actions. Ideal for security dashboards and automated alerting.',
  })
  @ApiQuery({
    name: 'timeWindowMinutes',
    required: false,
    type: Number,
    description: 'Time window in minutes to analyze for suspicious activity',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Suspicious activity analysis completed',
    schema: {
      example: {
        detected: true,
        suspiciousUserIds: [42, 73],
        suspiciousIpAddresses: ['192.168.1.100', '10.0.0.50'],
        findings: [
          {
            type: 'FAILED_ATTEMPTS',
            severity: 'HIGH',
            description: 'User 42 has 15 failed attempts in 10 minutes',
            affectedUsers: [42],
            count: 15,
            threshold: 10,
            timeWindow: '10 minutes',
          },
          {
            type: 'IP_ANOMALY',
            severity: 'CRITICAL',
            description:
              'IP 192.168.1.100 has 25 failed attempts targeting 5 users in 10 minutes',
            affectedIps: ['192.168.1.100'],
            affectedUsers: [42, 73, 88, 91, 102],
            count: 25,
            threshold: 20,
            timeWindow: '10 minutes',
          },
        ],
        analyzedAt: '2024-01-21T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token missing or invalid',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User lacks required permission',
  })
  async detectSuspiciousActivity(
    @Query('timeWindowMinutes', new DefaultValuePipe(10), ParseIntPipe)
    timeWindowMinutes: number = 10,
  ) {
    return this.securityAuditService.detectSuspiciousActivity(timeWindowMinutes);
  }

  /**
   * Get count of failed access attempts for a specific user
   *
   * Endpoint: GET /api/security-audit/failed-attempts/:userId
   *
   * Returns the number of failed authorization attempts for a user
   * within a specified time window. Useful for:
   * - Rate limiting enforcement
   * - Account lockout mechanisms
   * - User-specific security monitoring
   * - Suspicious activity detection
   *
   * Common thresholds:
   * - 5 failures in 5 minutes → Warning
   * - 10 failures in 10 minutes → Lock account
   * - 20 failures in 1 hour → Permanent ban (manual review)
   *
   * Performance: <50ms (indexed query)
   *
   * @param userId - User ID to check
   * @param timeWindowMinutes - Time window in minutes (default: 10)
   * @returns Count of failed attempts and metadata
   *
   * @example
   * GET /api/security-audit/failed-attempts/42?timeWindowMinutes=10
   * GET /api/security-audit/failed-attempts/73?timeWindowMinutes=60
   */
  @Get('failed-attempts/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get failed access attempt count for a user',
    description:
      'Returns the number of failed authorization attempts for a specific user within a time window. Useful for rate limiting, account lockout, and security monitoring. Fast indexed query (<50ms).',
  })
  @ApiParam({
    name: 'userId',
    type: Number,
    description: 'User ID to check for failed attempts',
    example: 42,
  })
  @ApiQuery({
    name: 'timeWindowMinutes',
    required: false,
    type: Number,
    description: 'Time window in minutes to count failed attempts',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Failed attempt count retrieved successfully',
    schema: {
      example: {
        userId: 42,
        failedAttempts: 7,
        timeWindowMinutes: 10,
        threshold: 10,
        shouldLock: false,
        message: 'User has 7 failed attempts in the last 10 minutes',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token missing or invalid',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User lacks required permission',
  })
  async getFailedAttempts(
    @Query('userId', ParseIntPipe) userId: number,
    @Query('timeWindowMinutes', new DefaultValuePipe(10), ParseIntPipe)
    timeWindowMinutes: number = 10,
  ) {
    const failedAttempts = await this.securityAuditService.getFailedAttempts(
      userId,
      timeWindowMinutes,
    );

    // Suggested threshold for account lockout
    const threshold = 10;
    const shouldLock = failedAttempts >= threshold;

    return {
      userId,
      failedAttempts,
      timeWindowMinutes,
      threshold,
      shouldLock,
      message: `User has ${failedAttempts} failed attempts in the last ${timeWindowMinutes} minutes`,
    };
  }

  /**
   * Export security logs in CSV or JSON format
   *
   * Endpoint: GET /api/security-audit/export
   *
   * Exports security audit logs with filtering options.
   * Suitable for:
   * - Compliance audits (SOC2, GDPR, PCI-DSS)
   * - External analysis tools (Excel, Splunk, ELK)
   * - Long-term archival and backup
   * - Management reporting and presentations
   *
   * Export formats:
   * - CSV: Excel-compatible, human-readable
   * - JSON: Machine-readable, structured data
   *
   * Query parameters: Same as /events endpoint
   * Max records: 10,000 per export (adjust as needed)
   *
   * Performance Consideration:
   * - Large exports may take several seconds
   * - Consider implementing background job for very large exports
   * - Recommend pagination for exports >1,000 records
   *
   * Security:
   * - Sensitive data redacted (passwords, tokens)
   * - CSV formula injection prevention
   * - Rate limiting recommended (1 export per minute per user)
   *
   * @param format - Export format ('csv' or 'json')
   * @param res - Express response object for streaming
   * @param ...filters - Same as getSecurityEvents endpoint
   *
   * @example
   * GET /api/security-audit/export?format=csv&success=false&startDate=2024-01-01
   * GET /api/security-audit/export?format=json&userId=42&action=ACCESS_DENIED
   */
  @Get('export')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Export security audit logs (CSV or JSON)',
    description:
      'Export security logs in CSV or JSON format for compliance audits, external analysis, or archival. Supports all filtering options from the events endpoint. Max 10,000 records per export. CSV format is Excel-compatible; JSON is machine-readable.',
  })
  @ApiQuery({
    name: 'format',
    required: false,
    enum: ['csv', 'json'],
    description: 'Export format (csv or json)',
    example: 'csv',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: Number,
    description: 'Filter by specific user ID',
  })
  @ApiQuery({
    name: 'action',
    required: false,
    enum: SecurityAuditAction,
    description: 'Filter by security event action type',
  })
  @ApiQuery({
    name: 'resourceType',
    required: false,
    enum: ResourceType,
    description: 'Filter by resource type',
  })
  @ApiQuery({
    name: 'success',
    required: false,
    type: Boolean,
    description: 'Filter by success status',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start of date range (ISO 8601 format)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End of date range (ISO 8601 format)',
  })
  @ApiResponse({
    status: 200,
    description: 'Security logs exported successfully',
    content: {
      'text/csv': {
        example:
          'ID,User ID,Action,Resource Type,Success,IP Address,Created At\n12345,42,ACCESS_DENIED,route,false,192.168.1.100,2024-01-21T10:30:00.000Z',
      },
      'application/json': {
        example: [
          {
            id: 12345,
            userId: 42,
            action: 'ACCESS_DENIED',
            resourceType: 'route',
            success: false,
            ipAddress: '192.168.1.100',
            createdAt: '2024-01-21T10:30:00.000Z',
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token missing or invalid',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User lacks required permission',
  })
  async exportLogs(
    @Query('format', new DefaultValuePipe('json')) format: 'csv' | 'json',
    @Res() res: Response,
    @Query('userId') userId?: number,
    @Query('action') action?: SecurityAuditAction,
    @Query('resourceType') resourceType?: ResourceType,
    @Query('success') success?: boolean,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    // Build filters
    const filters = {
      userId: userId ? Number(userId) : undefined,
      action,
      resourceType,
      success: success !== undefined ? success : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    // Export logs
    const exportedData = await this.securityAuditService.exportLogs(
      filters,
      format,
    );

    // Set response headers based on format
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=security-audit-logs-${Date.now()}.csv`,
      );
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=security-audit-logs-${Date.now()}.json`,
      );
    }

    // Send response
    res.send(exportedData);
  }
}
