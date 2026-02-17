/**
 * @file security-audit-log.entity.ts
 * @description Enterprise-grade security audit log entity for tracking all permission checks,
 * access attempts, and authorization events in the RBAC system. Designed for compliance,
 * security monitoring, and incident response. Follows OWASP logging best practices.
 *
 * Key Features:
 * - Comprehensive audit trail for all authorization decisions
 * - Performance-optimized with strategic indexes
 * - Supports both authenticated and anonymous access attempts
 * - Flexible metadata storage for context-specific information
 * - Privacy-conscious: minimal PII, sanitized inputs
 * - Supports compliance requirements (SOC2, GDPR, PCI-DSS)
 *
 * Use Cases:
 * - Security incident investigation and forensics
 * - Detecting brute force and suspicious activity patterns
 * - Compliance audits and reporting
 * - User activity monitoring and analytics
 * - Rate limiting and abuse detection
 *
 * @author SouqSyria Security Team
 * @version 1.0.0
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';

/**
 * Enum defining all possible security audit event types.
 * This enum ensures type safety and consistency across the application.
 *
 * Event Types:
 * - PERMISSION_CHECK: Standard permission verification during request processing
 * - ACCESS_GRANTED: Successful authorization for protected resource
 * - ACCESS_DENIED: Failed authorization attempt (missing permissions)
 * - ROLE_MODIFIED: Changes to user roles (assignment, removal)
 * - PERMISSION_MODIFIED: Changes to role permissions (grant, revoke)
 * - USER_BANNED: User account banned (security action)
 * - USER_SUSPENDED: User account temporarily suspended
 * - SUSPICIOUS_ACTIVITY: Detected anomalous behavior (rate limiting trigger, etc.)
 * - LOGIN_ATTEMPT: Authentication attempts (for correlation with authorization)
 * - TOKEN_VALIDATION: JWT token validation events
 * - ROUTE_NOT_FOUND: Attempts to access non-existent routes (potential scanning)
 * - RATE_LIMIT_EXCEEDED: Too many requests from single source
 * - PUBLIC_ACCESS: Access to public routes (marked with @Public() decorator or no permission required)
 */
export enum SecurityAuditAction {
  PERMISSION_CHECK = 'PERMISSION_CHECK',
  ACCESS_GRANTED = 'ACCESS_GRANTED',
  ACCESS_DENIED = 'ACCESS_DENIED',
  PUBLIC_ACCESS = 'PUBLIC_ACCESS',
  ROLE_MODIFIED = 'ROLE_MODIFIED',
  ROLE_CREATED = 'ROLE_CREATED',
  ROLE_DELETED = 'ROLE_DELETED',
  ROLE_PRIORITY_MODIFIED = 'ROLE_PRIORITY_MODIFIED',
  PERMISSION_MODIFIED = 'PERMISSION_MODIFIED',
  ROUTE_MAPPED = 'ROUTE_MAPPED',
  ROUTE_PERMISSION_LINKED = 'ROUTE_PERMISSION_LINKED',
  ROUTE_PERMISSION_UNLINKED = 'ROUTE_PERMISSION_UNLINKED',
  BULK_ROUTE_MAPPED = 'BULK_ROUTE_MAPPED',
  AUTO_MAPPING_EXECUTED = 'AUTO_MAPPING_EXECUTED',
  USER_BANNED = 'USER_BANNED',
  USER_SUSPENDED = 'USER_SUSPENDED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  LOGIN_ATTEMPT = 'LOGIN_ATTEMPT',
  TOKEN_VALIDATION = 'TOKEN_VALIDATION',
  ROUTE_NOT_FOUND = 'ROUTE_NOT_FOUND',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}

/**
 * Enum defining the types of resources being accessed or modified.
 * Used for categorization and filtering in audit queries.
 */
export enum ResourceType {
  ROUTE = 'route',
  PERMISSION = 'permission',
  ROLE = 'role',
  USER = 'user',
  ROLE_PERMISSION = 'role_permission',
  SYSTEM = 'system',
}

/**
 * SecurityAuditLog Entity
 *
 * Stores comprehensive audit trail of all authorization and security events.
 * Each log entry represents a single security-relevant event with full context.
 *
 * Performance Characteristics:
 * - Write-optimized: Async inserts with minimal blocking
 * - Read-optimized: Strategic indexes for common query patterns
 * - Target: <10ms write latency, <200ms query latency
 *
 * Storage Considerations:
 * - High-volume table: Can grow to millions of records
 * - Recommended: Implement log rotation/archival strategy
 * - Suggested retention: 90 days hot, 1 year cold storage
 *
 * Security & Privacy:
 * - No sensitive data in logs (no passwords, tokens, etc.)
 * - IP addresses and user agents sanitized
 * - Compliant with GDPR Article 32 (security logging requirements)
 * - Log injection prevention: All inputs sanitized
 */
@Entity('security_audit_logs')
@Index('idx_security_audit_user_time', ['userId', 'createdAt'])
@Index('idx_security_audit_success', ['success'])
@Index('idx_security_audit_action', ['action'])
@Index('idx_security_audit_resource', ['resourceType', 'resourceId'])
@Index('idx_security_audit_ip', ['ipAddress'])
export class SecurityAuditLog {
  /**
   * Primary key: Auto-incrementing identifier
   * Provides chronological ordering and unique identification
   */
  @ApiProperty({
    description: 'Unique identifier for the security audit log entry',
    example: 12345,
  })
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * User ID: Foreign key to User entity
   * Nullable to support logging of anonymous/unauthenticated access attempts
   *
   * Use Cases:
   * - Null for: Anonymous API calls, pre-authentication attempts, token failures
   * - Non-null for: Authenticated permission checks, authorized user actions
   *
   * Index: Part of composite index (userId, createdAt) for efficient user activity queries
   */
  @ApiProperty({
    description:
      'ID of the user who performed the action (null for anonymous attempts)',
    example: 42,
    required: false,
    nullable: true,
  })
  @Column({ nullable: true, type: 'int', name: 'user_id' })
  userId: number | null;

  /**
   * User relation: Optional relation to User entity for JOIN queries
   * Use this for queries that need user details (email, name, etc.)
   *
   * Note: Nullable relation to support anonymous access logging
   */
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  /**
   * Action: Type of security event being logged
   * Uses enum for type safety and consistency
   *
   * Indexed for filtering queries (e.g., "show me all ACCESS_DENIED events")
   * Common queries: Failed logins, suspicious activities, access denials
   */
  @ApiProperty({
    description:
      'Type of security event (permission check, access denial, role modification, etc.)',
    enum: SecurityAuditAction,
    example: SecurityAuditAction.ACCESS_DENIED,
  })
  @Column({
    type: 'enum',
    enum: SecurityAuditAction,
  })
  action: SecurityAuditAction;

  /**
   * Resource Type: Category of resource being accessed or modified
   * Used for filtering and categorization in audit reports
   *
   * Examples:
   * - 'route' for API endpoint access
   * - 'permission' for permission grants/revokes
   * - 'role' for role assignments
   * - 'user' for user modifications
   */
  @ApiProperty({
    description: 'Type of resource involved in the security event',
    enum: ResourceType,
    example: ResourceType.ROUTE,
  })
  @Column({
    type: 'enum',
    enum: ResourceType,
  })
  resourceType: ResourceType;

  /**
   * Resource ID: Identifier of the specific resource
   * Nullable because some events don't relate to a specific resource
   *
   * Examples:
   * - Route ID for permission checks on specific routes
   * - User ID for user modifications
   * - Role ID for role changes
   * - Null for system-wide events
   *
   * Indexed as part of composite index (resourceType, resourceId)
   */
  @ApiProperty({
    description:
      'ID of the specific resource involved (nullable for system events)',
    example: 123,
    required: false,
    nullable: true,
  })
  @Column({ nullable: true, type: 'int', name: 'resource_id' })
  resourceId: number | null;

  /**
   * Permission Required: The permission that was checked or required
   * Critical for understanding authorization failures
   *
   * Examples:
   * - 'manage_products' for product management endpoints
   * - 'view_orders' for order viewing
   * - 'admin_access' for admin panel
   *
   * Null when: Event doesn't involve permission checking (role modifications, etc.)
   */
  @ApiProperty({
    description:
      'The permission that was required for the action (if applicable)',
    example: 'manage_products',
    required: false,
    nullable: true,
  })
  @Column({ nullable: true, length: 100, name: 'permission_required' })
  permissionRequired: string | null;

  /**
   * Success: Whether the security check/action succeeded
   *
   * Use Cases:
   * - false: Failed permission checks, access denials, failed logins
   * - true: Successful authorizations, granted permissions
   *
   * Indexed for fast filtering of security failures
   * Critical for detecting attack patterns and brute force attempts
   */
  @ApiProperty({
    description: 'Whether the security check or action was successful',
    example: false,
  })
  @Column({ default: false })
  success: boolean;

  /**
   * Failure Reason: Detailed explanation of why an action failed
   * Only populated when success = false
   *
   * Examples:
   * - 'Missing permission: manage_products'
   * - 'User account is banned'
   * - 'Invalid JWT token'
   * - 'Rate limit exceeded: 10 requests in 1 minute'
   *
   * Important for:
   * - Security incident investigation
   * - User support and troubleshooting
   * - Identifying configuration issues
   *
   * SECURITY NOTE: Sanitized to prevent log injection attacks
   */
  @ApiProperty({
    description:
      'Detailed reason for failure (only populated when success = false)',
    example: 'Missing permission: manage_products',
    required: false,
    nullable: true,
  })
  @Column({ nullable: true, type: 'text', name: 'failure_reason' })
  failureReason: string | null;

  /**
   * IP Address: Client IP address from which the request originated
   * Supports both IPv4 and IPv6 (VARCHAR(45))
   *
   * IPv4 example: '192.168.1.1' (max 15 chars)
   * IPv6 example: '2001:0db8:85a3:0000:0000:8a2e:0370:7334' (max 39 chars)
   *
   * Uses:
   * - Geolocation for security analysis
   * - IP-based rate limiting
   * - Detecting distributed attacks
   * - Correlating events from same source
   *
   * Privacy: Consider anonymization for GDPR compliance (hash last octet)
   * Security: Sanitized to prevent injection; handles proxy headers (X-Forwarded-For)
   *
   * Indexed for IP-based queries and threat analysis
   */
  @ApiProperty({
    description:
      'IP address of the client making the request (supports IPv4 and IPv6)',
    example: '192.168.1.100',
  })
  @Column({ length: 45, name: 'ip_address' })
  ipAddress: string;

  /**
   * User Agent: Browser/client identification string
   * Useful for detecting automated attacks and client-side issues
   *
   * Examples:
   * - 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
   * - 'PostmanRuntime/7.29.2'
   * - 'python-requests/2.28.1'
   *
   * Uses:
   * - Bot detection
   * - Client compatibility analysis
   * - Identifying automated scanners
   *
   * SECURITY NOTE: Sanitized and truncated to prevent:
   * - Log injection attacks
   * - Excessive storage consumption
   * - XSS in log viewing interfaces
   */
  @ApiProperty({
    description: 'User agent string of the client (browser, API client, etc.)',
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
  })
  @Column({ type: 'text', name: 'user_agent' })
  userAgent: string;

  /**
   * Request Path: The API endpoint that was accessed
   * Includes normalized path with route parameters
   *
   * Examples:
   * - '/api/admin/products/:id'
   * - '/api/orders'
   * - '/api/users/:id/permissions'
   *
   * Important for:
   * - Understanding access patterns
   * - Identifying frequently attacked endpoints
   * - Performance analysis by endpoint
   * - Route-specific security monitoring
   *
   * Note: Query parameters excluded for privacy (may contain sensitive data)
   */
  @ApiProperty({
    description:
      'The API endpoint path that was accessed (normalized with route parameters)',
    example: '/api/admin/products/:id',
  })
  @Column({ length: 500, name: 'request_path' })
  requestPath: string;

  /**
   * Request Method: HTTP method used for the request
   *
   * Standard methods: GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD
   *
   * Uses:
   * - Understanding operation type (read vs. write)
   * - Detecting unusual method usage (potential attacks)
   * - Method-specific rate limiting
   * - RESTful API monitoring
   */
  @ApiProperty({
    description: 'HTTP method of the request (GET, POST, PUT, DELETE, etc.)',
    example: 'POST',
  })
  @Column({ length: 10, name: 'request_method' })
  requestMethod: string;

  /**
   * Metadata: Flexible JSON storage for event-specific context
   * Allows extension without schema changes
   *
   * Common metadata fields:
   * {
   *   "roleId": 5,
   *   "roleName": "admin",
   *   "assignedRole": "super_admin",
   *   "permissionsBefore": ["view_users"],
   *   "permissionsAfter": ["view_users", "manage_users"],
   *   "requestDuration": 145,
   *   "routeId": 42,
   *   "attemptCount": 3,
   *   "originalUrl": "/api/products?page=1&limit=20",
   *   "referrer": "https://admin.souqsyria.com",
   *   "sessionId": "abc123xyz",
   *   "geoLocation": {"country": "SY", "city": "Damascus"}
   * }
   *
   * Best Practices:
   * - Keep metadata focused and relevant
   * - Avoid duplicating indexed fields
   * - No sensitive data (passwords, tokens, credit cards)
   * - Consider size limits for JSON storage
   *
   * Performance Note: JSON queries are slower than indexed columns
   */
  @ApiProperty({
    description: 'Additional context-specific information stored as JSON',
    example: {
      roleId: 5,
      roleName: 'admin',
      requestDuration: 145,
      attemptCount: 3,
    },
    required: false,
  })
  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any> | null;

  /**
   * Created At: Timestamp when the log entry was created
   * Automatically set by TypeORM on insert
   *
   * Uses:
   * - Chronological ordering of events
   * - Time-range filtering for queries
   * - Rate limiting calculations
   * - Trend analysis and reporting
   *
   * Indexed as part of composite index (userId, createdAt)
   * Critical for efficient time-based queries
   *
   * Note: Uses database server time (UTC recommended) for consistency
   */
  @ApiProperty({
    description: 'Timestamp when the security event was logged',
    example: '2024-01-21T10:30:00.000Z',
  })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
