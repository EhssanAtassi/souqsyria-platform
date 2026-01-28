/**
 * Security Audit Event Models
 * Defines the core data structures for security audit events and actions
 *
 * @module SecurityAuditEventModel
 */

/**
 * Enum representing all possible security audit actions
 * These actions are tracked across the application for security monitoring
 *
 * @enum {string}
 */
export enum SecurityAuditAction {
  /** Permission check performed on a resource */
  PERMISSION_CHECK = 'PERMISSION_CHECK',

  /** Access denied to a resource or action */
  ACCESS_DENIED = 'ACCESS_DENIED',

  /** Access granted to a resource or action */
  ACCESS_GRANTED = 'ACCESS_GRANTED',

  /** Role configuration was modified */
  ROLE_MODIFIED = 'ROLE_MODIFIED',

  /** Role was assigned to a user */
  ROLE_ASSIGNED = 'ROLE_ASSIGNED',

  /** Permission configuration was modified */
  PERMISSION_MODIFIED = 'PERMISSION_MODIFIED',

  /** User account was banned */
  USER_BANNED = 'USER_BANNED',

  /** User account ban was lifted */
  USER_UNBANNED = 'USER_UNBANNED',

  /** User account was suspended */
  USER_SUSPENDED = 'USER_SUSPENDED',

  /** User account suspension was lifted */
  USER_UNSUSPENDED = 'USER_UNSUSPENDED',

  /** Successful login attempt */
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',

  /** Failed login attempt */
  LOGIN_FAILED = 'LOGIN_FAILED',

  /** User logged out */
  LOGOUT = 'LOGOUT',
}

/**
 * Complete security audit event entity
 * Represents a single security-related event in the system
 *
 * @interface SecurityAuditEvent
 */
export interface SecurityAuditEvent {
  /** Unique identifier for the audit event */
  id: number;

  /** ID of the user who performed the action (null for anonymous actions) */
  userId: number | null;

  /** Email address of the user (populated from user entity) */
  userEmail?: string;

  /** Display name of the user (populated from user entity) */
  userName?: string;

  /** Type of action that was performed */
  action: SecurityAuditAction;

  /** Type of resource the action was performed on (e.g., 'Product', 'Order') */
  resourceType: string | null;

  /** Identifier of the specific resource (e.g., product ID) */
  resourceId: string | null;

  /** Permission that was required for this action */
  permissionRequired: string | null;

  /** Whether the action was successful */
  success: boolean;

  /** Reason for failure if action was unsuccessful */
  failureReason: string | null;

  /** IP address from which the action originated */
  ipAddress: string;

  /** User agent string from the request */
  userAgent: string;

  /** API endpoint or route path that was accessed */
  requestPath: string;

  /** HTTP method used for the request */
  requestMethod: string;

  /** Additional contextual information about the event */
  metadata: Record<string, any>;

  /** Timestamp when the event occurred */
  createdAt: Date;
}

/**
 * DTO for creating a new audit event
 * Used when manually creating audit events from the frontend
 *
 * @interface CreateAuditEventDto
 */
export interface CreateAuditEventDto {
  /** Optional user ID if action is performed by a specific user */
  userId?: number;

  /** Type of action being audited */
  action: SecurityAuditAction;

  /** Optional resource type being accessed */
  resourceType?: string;

  /** Optional specific resource identifier */
  resourceId?: string;

  /** Optional permission that was checked */
  permissionRequired?: string;

  /** Whether the action succeeded */
  success: boolean;

  /** Optional failure reason if action failed */
  failureReason?: string;

  /** Optional additional context */
  metadata?: Record<string, any>;
}

/**
 * Type guard to check if a value is a valid SecurityAuditAction
 *
 * @param value - Value to check
 * @returns True if value is a valid SecurityAuditAction
 */
export function isSecurityAuditAction(value: string): value is SecurityAuditAction {
  return Object.values(SecurityAuditAction).includes(value as SecurityAuditAction);
}

/**
 * Helper to get human-readable label for an action
 *
 * @param action - Security audit action
 * @returns Human-readable label
 */
export function getActionLabel(action: SecurityAuditAction): string {
  const labels: Record<SecurityAuditAction, string> = {
    [SecurityAuditAction.PERMISSION_CHECK]: 'Permission Check',
    [SecurityAuditAction.ACCESS_DENIED]: 'Access Denied',
    [SecurityAuditAction.ACCESS_GRANTED]: 'Access Granted',
    [SecurityAuditAction.ROLE_MODIFIED]: 'Role Modified',
    [SecurityAuditAction.ROLE_ASSIGNED]: 'Role Assigned',
    [SecurityAuditAction.PERMISSION_MODIFIED]: 'Permission Modified',
    [SecurityAuditAction.USER_BANNED]: 'User Banned',
    [SecurityAuditAction.USER_UNBANNED]: 'User Unbanned',
    [SecurityAuditAction.USER_SUSPENDED]: 'User Suspended',
    [SecurityAuditAction.USER_UNSUSPENDED]: 'User Unsuspended',
    [SecurityAuditAction.LOGIN_SUCCESS]: 'Login Success',
    [SecurityAuditAction.LOGIN_FAILED]: 'Login Failed',
    [SecurityAuditAction.LOGOUT]: 'Logout',
  };

  return labels[action] || action;
}

/**
 * Helper to determine if an action represents a security risk
 *
 * @param action - Security audit action
 * @returns True if action represents a potential security risk
 */
export function isRiskAction(action: SecurityAuditAction): boolean {
  const riskActions: SecurityAuditAction[] = [
    SecurityAuditAction.ACCESS_DENIED,
    SecurityAuditAction.LOGIN_FAILED,
    SecurityAuditAction.USER_BANNED,
    SecurityAuditAction.USER_SUSPENDED,
  ];

  return riskActions.includes(action);
}
