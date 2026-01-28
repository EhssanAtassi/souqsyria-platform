/**
 * Security Audit Routes
 *
 * @description
 * Defines routes for the security audit feature module.
 * Implements lazy loading for optimal performance.
 *
 * Note: Permission checking is handled at the parent level in admin.routes.ts
 * using permissionGuard with 'view_audit_logs' permission requirement.
 *
 * Route Structure:
 * - /admin/security         -> Main dashboard (tabbed interface)
 *   - Audit Log tab         -> All security events
 *   - Failed Attempts tab   -> Failed login tracking
 *   - Suspicious Activity   -> Anomaly detection
 *
 * Future Routes (for expansion):
 * - /admin/security/reports -> Detailed security reports
 * - /admin/security/settings -> Audit configuration
 * - /admin/security/alerts/:id -> Individual alert details
 *
 * @module SecurityAuditRoutes
 * @version 2.0.0
 *
 * @swagger
 * paths:
 *   /admin/security:
 *     get:
 *       summary: Security audit dashboard
 *       description: Main dashboard with tabbed interface for audit logs
 *       tags: [Admin, Security]
 *       security:
 *         - AdminAuth: [view_audit_logs]
 *       responses:
 *         200:
 *           description: Security audit dashboard loaded
 *         403:
 *           description: Insufficient permissions
 *
 * @example
 * ```typescript
 * // In admin.routes.ts
 * {
 *   path: 'security',
 *   canActivate: [permissionGuard],
 *   data: {
 *     requiredPermissions: ['view_audit_logs'],
 *     breadcrumb: 'Security'
 *   },
 *   loadChildren: () => import('./security-audit/security-audit.routes')
 *     .then(m => m.SECURITY_AUDIT_ROUTES)
 * }
 * ```
 */

import { Routes } from '@angular/router';

/**
 * Security Audit Feature Routes
 *
 * @description
 * Main route for security audit dashboard using lazy loading.
 * Additional routes can be added for specific views or reports.
 *
 * Route Structure:
 * - '' (default): Main dashboard with tabbed interface
 *   - Audit Log tab
 *   - Failed Attempts tab
 *   - Suspicious Activity tab
 *
 * The dashboard component handles tab-based navigation internally.
 *
 * @constant
 */
export const SECURITY_AUDIT_ROUTES: Routes = [
  /**
   * Main Security Audit Dashboard
   *
   * @description
   * Primary security monitoring interface with tabbed navigation.
   * Includes audit logs, failed attempts, and suspicious activity.
   */
  {
    path: '',
    loadComponent: () =>
      import('./security-audit.component').then((m) => m.SecurityAuditComponent),
    title: 'SouqSyria Admin | Security Audit',
    data: {
      /** Breadcrumb - inherits 'Security' from parent */
      breadcrumb: null,

      /** Route animation trigger */
      animation: 'SecurityAuditPage',

      /** Feature identifier */
      feature: 'security-audit',

      /** Feature description */
      description: 'Monitor security events and detect suspicious activity',
    },
  },
];

/**
 * Security Audit Route Paths
 *
 * @description
 * Constants for route paths used in navigation and testing.
 * Centralized here to avoid magic strings throughout the codebase.
 */
export const SECURITY_AUDIT_ROUTE_PATHS = {
  /** Base path for security audit */
  BASE: '/admin/security',

  /** Future: Reports path */
  REPORTS: '/admin/security/reports',

  /** Future: Settings path */
  SETTINGS: '/admin/security/settings',

  /** Future: Alert detail path (with placeholder) */
  ALERT_DETAIL: '/admin/security/alerts/:alertId',

  /**
   * Generate alert detail path
   * @param alertId - Alert ID
   * @returns Full route path
   */
  getAlertDetailPath: (alertId: number | string): string => `/admin/security/alerts/${alertId}`,
} as const;

/**
 * Security Audit Tab Identifiers
 *
 * @description
 * Tab identifiers for the security audit dashboard.
 * Used for programmatic tab switching and URL query params.
 */
export const SECURITY_AUDIT_TABS = {
  /** Audit log tab */
  AUDIT_LOG: 'audit-log',

  /** Failed attempts tab */
  FAILED_ATTEMPTS: 'failed-attempts',

  /** Suspicious activity tab */
  SUSPICIOUS_ACTIVITY: 'suspicious-activity',
} as const;

/**
 * Security Audit Required Permissions
 *
 * @description
 * Permission constants for security audit feature.
 * Note: Main permission is checked at parent route level.
 */
export const SECURITY_AUDIT_PERMISSIONS = {
  /** Permission to view audit logs */
  VIEW: 'view_audit_logs',

  /** Permission to export audit data */
  EXPORT: 'export_audit_logs',

  /** Permission to configure audit settings */
  CONFIGURE: 'configure_audit',

  /** Permission to dismiss/acknowledge alerts */
  ACKNOWLEDGE: 'acknowledge_alerts',
} as const;

/**
 * Default export for backwards compatibility
 *
 * @deprecated Use named export SECURITY_AUDIT_ROUTES instead
 */
export default SECURITY_AUDIT_ROUTES;
