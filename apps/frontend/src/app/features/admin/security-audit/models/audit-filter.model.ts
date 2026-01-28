/**
 * Audit Filter Models
 * Defines data structures for filtering and querying security audit data
 *
 * @module AuditFilterModel
 */

import { SecurityAuditAction } from './security-audit-event.model';
import { SeverityLevel } from './suspicious-activity.model';

/**
 * Frontend filter state for audit events
 * Used to maintain UI filter selections
 *
 * @interface AuditFilter
 */
export interface AuditFilter {
  /** Filter by specific action type ('ALL' shows all actions) */
  action: SecurityAuditAction | 'ALL';

  /** Filter by success status ('ALL' shows both successful and failed) */
  success: boolean | 'ALL';

  /** Filter by specific user ID (null shows all users) */
  userId: number | null;

  /** Filter by date range */
  dateRange: DateRange;

  /** Filter by resource type (null shows all resource types) */
  resourceType: string | null;

  /** Free-text search across event details */
  searchTerm: string;

  /** Filter by severity level (for alerts, 'ALL' shows all levels) */
  severityLevel?: SeverityLevel | 'ALL';
}

/**
 * Date range for filtering events
 *
 * @interface DateRange
 */
export interface DateRange {
  /** Start date (null means no start limit) */
  start: Date | null;

  /** End date (null means no end limit) */
  end: Date | null;
}

/**
 * DTO for querying audit logs from the backend
 * Maps to backend API parameters
 *
 * @interface QueryAuditLogsDto
 */
export interface QueryAuditLogsDto {
  /** Filter by specific action type */
  action?: SecurityAuditAction;

  /** Filter by success status */
  success?: boolean;

  /** Filter by user ID */
  userId?: number;

  /** Start date in ISO format (YYYY-MM-DD or ISO 8601) */
  startDate?: string;

  /** End date in ISO format (YYYY-MM-DD or ISO 8601) */
  endDate?: string;

  /** Filter by resource type */
  resourceType?: string;

  /** Search term for full-text search */
  search?: string;

  /** Page number (1-indexed) */
  page?: number;

  /** Number of items per page */
  limit?: number;

  /** Field to sort by (e.g., 'createdAt', 'userId') */
  sortBy?: string;

  /** Sort direction */
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * DTO for querying failed access attempts with grouping options
 *
 * @interface FailedAttemptsQueryDto
 */
export interface FailedAttemptsQueryDto {
  /** How to group the results */
  groupBy?: 'user' | 'permission' | 'time';

  /** Start date in ISO format */
  startDate?: string;

  /** End date in ISO format */
  endDate?: string;

  /** Minimum number of attempts to include in results */
  minAttempts?: number;

  /** Page number (1-indexed) */
  page?: number;

  /** Number of items per page */
  limit?: number;
}

/**
 * Default filter values for initial state
 *
 * @constant
 */
export const DEFAULT_AUDIT_FILTER: AuditFilter = {
  action: 'ALL',
  success: 'ALL',
  userId: null,
  dateRange: {
    start: null,
    end: null,
  },
  resourceType: null,
  searchTerm: '',
  severityLevel: 'ALL',
};

/**
 * Default query parameters for audit log queries
 *
 * @constant
 */
export const DEFAULT_QUERY_PARAMS: QueryAuditLogsDto = {
  page: 1,
  limit: 50,
  sortBy: 'createdAt',
  sortOrder: 'DESC',
};

/**
 * Helper to convert frontend filter to backend query DTO
 *
 * @param filter - Frontend filter state
 * @param pagination - Pagination parameters
 * @returns Backend query DTO
 */
export function filterToQueryDto(
  filter: AuditFilter,
  pagination?: { page: number; limit: number }
): QueryAuditLogsDto {
  const dto: QueryAuditLogsDto = {
    ...DEFAULT_QUERY_PARAMS,
    ...pagination,
  };

  // Action filter
  if (filter.action !== 'ALL') {
    dto.action = filter.action;
  }

  // Success filter
  if (filter.success !== 'ALL') {
    dto.success = filter.success;
  }

  // User filter
  if (filter.userId !== null) {
    dto.userId = filter.userId;
  }

  // Date range filter
  if (filter.dateRange.start) {
    dto.startDate = filter.dateRange.start.toISOString();
  }

  if (filter.dateRange.end) {
    dto.endDate = filter.dateRange.end.toISOString();
  }

  // Resource type filter
  if (filter.resourceType) {
    dto.resourceType = filter.resourceType;
  }

  // Search term
  if (filter.searchTerm.trim()) {
    dto.search = filter.searchTerm.trim();
  }

  return dto;
}

/**
 * Helper to check if any filters are active
 *
 * @param filter - Filter to check
 * @returns True if any filter is active
 */
export function hasActiveFilters(filter: AuditFilter): boolean {
  return (
    filter.action !== 'ALL' ||
    filter.success !== 'ALL' ||
    filter.userId !== null ||
    filter.dateRange.start !== null ||
    filter.dateRange.end !== null ||
    filter.resourceType !== null ||
    filter.searchTerm.trim() !== '' ||
    (filter.severityLevel !== undefined && filter.severityLevel !== 'ALL')
  );
}

/**
 * Helper to reset filter to defaults
 *
 * @returns Default filter state
 */
export function resetFilter(): AuditFilter {
  return { ...DEFAULT_AUDIT_FILTER };
}

/**
 * Helper to create a date range for common periods
 *
 * @param period - Period type
 * @returns Date range object
 */
export function createDateRangeForPeriod(
  period: 'today' | 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth'
): DateRange {
  const now = new Date();
  let end = new Date(now);
  let start = new Date(now);

  switch (period) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;

    case 'last7days':
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      break;

    case 'last30days':
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      break;

    case 'thisMonth':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
      break;

    case 'lastMonth':
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      start.setHours(0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
      end.setHours(23, 59, 59, 999);
      break;
  }

  return { start, end };
}

/**
 * Helper to validate date range
 *
 * @param dateRange - Date range to validate
 * @returns Validation error message or null if valid
 */
export function validateDateRange(dateRange: DateRange): string | null {
  if (dateRange.start && dateRange.end) {
    if (dateRange.start > dateRange.end) {
      return 'Start date must be before end date';
    }

    // Check if range is too large (e.g., more than 1 year)
    const diffDays = Math.abs(
      (dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays > 365) {
      return 'Date range cannot exceed 1 year';
    }
  }

  return null;
}
