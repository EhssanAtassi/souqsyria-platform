/**
 * Security Audit Query
 * Akita query service for selecting and deriving state from the security audit store
 *
 * @module SecurityAuditQuery
 */

import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { Observable, combineLatest } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';

import { SecurityAuditStore, SecurityAuditState } from './security-audit.store';
import {
  SecurityAuditEvent,
  SecurityAuditAction,
  AuditFilter,
  SecurityMetrics,
  SuspiciousActivityAlert,
  AlertStatistics,
  EventStreamState,
  SeverityLevel,
  hasActiveFilters,
  isRiskAction,
} from '../models';

/**
 * Akita query service for security audit state
 * Provides observables for selecting and deriving data from the store
 *
 * @class SecurityAuditQuery
 * @extends {QueryEntity<SecurityAuditState>}
 */
@Injectable()
export class SecurityAuditQuery extends QueryEntity<SecurityAuditState> {
  constructor(protected override store: SecurityAuditStore) {
    super(store);
  }

  // ==================== Basic Selectors ====================

  /**
   * Select all audit events
   */
  events$: Observable<SecurityAuditEvent[]> = this.selectAll();

  /**
   * Select loading state
   */
  loading$: Observable<boolean> = this.select((state) => state.ui.loading);

  /**
   * Select selected event ID
   */
  selectedEventId$: Observable<number | null> = this.select((state) => state.ui.selectedEventId);

  /**
   * Select currently active/selected event
   */
  selectedEvent$: Observable<SecurityAuditEvent | undefined> = this.selectedEventId$.pipe(
    map(id => id !== null ? this.getEntity(id) : undefined)
  );

  /**
   * Select current view mode
   */
  viewMode$: Observable<'list' | 'timeline' | 'chart'> = this.select((state) => state.ui.viewMode);

  /**
   * Select live mode state
   */
  liveMode$: Observable<boolean> = this.select((state) => state.ui.liveMode);

  /**
   * Select total count of events in store
   */
  totalCount$: Observable<number> = this.selectCount();

  // ==================== Filter Selectors ====================

  /**
   * Select current filter settings
   */
  filters$: Observable<AuditFilter> = this.select((state) => state.filters);

  /**
   * Check if any filters are currently active
   */
  hasActiveFilters$: Observable<boolean> = this.filters$.pipe(
    map((filters) => hasActiveFilters(filters)),
    distinctUntilChanged()
  );

  /**
   * Select specific filter property
   *
   * @param key - Filter property key
   */
  selectFilter<K extends keyof AuditFilter>(key: K): Observable<AuditFilter[K]> {
    return this.select((state) => state.filters[key]);
  }

  // ==================== Pagination Selectors ====================

  /**
   * Select pagination state
   */
  pagination$: Observable<SecurityAuditState['pagination']> = this.select((state) => state.pagination);

  /**
   * Select current page number
   */
  currentPage$: Observable<number> = this.select((state) => state.pagination.page);

  /**
   * Select page size
   */
  pageSize$: Observable<number> = this.select((state) => state.pagination.limit);

  /**
   * Select total count across all pages
   */
  paginationTotalCount$: Observable<number> = this.select((state) => state.pagination.totalCount);

  /**
   * Check if there is a next page
   */
  hasNextPage$: Observable<boolean> = this.select((state) => state.pagination.hasNextPage);

  /**
   * Check if there is a previous page
   */
  hasPrevPage$: Observable<boolean> = this.select((state) => state.pagination.hasPrevPage);

  // ==================== Filtered Event Selectors ====================

  /**
   * Select events filtered by current filter settings
   */
  filteredEvents$: Observable<SecurityAuditEvent[]> = combineLatest([
    this.selectAll(),
    this.filters$,
  ]).pipe(
    map(([events, filters]) => this.applyFilters(events, filters)),
    distinctUntilChanged()
  );

  /**
   * Select only failed events (success: false)
   */
  failedEvents$: Observable<SecurityAuditEvent[]> = this.selectAll({
    filterBy: (event) => !event.success,
  });

  /**
   * Select only successful events (success: true)
   */
  successfulEvents$: Observable<SecurityAuditEvent[]> = this.selectAll({
    filterBy: (event) => event.success,
  });

  /**
   * Select events that represent security risks
   */
  riskEvents$: Observable<SecurityAuditEvent[]> = this.selectAll({
    filterBy: (event) => isRiskAction(event.action),
  });

  /**
   * Select recent events (last N events)
   *
   * @param limit - Number of recent events to select
   */
  selectRecentEvents(limit: number = 20): Observable<SecurityAuditEvent[]> {
    return this.selectAll().pipe(
      map((events) => {
        const sorted = [...events].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        return sorted.slice(0, limit);
      })
    );
  }

  // ==================== Event Grouping Selectors ====================

  /**
   * Select events grouped by action type
   */
  eventsByAction$: Observable<Map<SecurityAuditAction, SecurityAuditEvent[]>> = this.selectAll().pipe(
    map((events) => this.groupEventsByAction(events)),
    distinctUntilChanged()
  );

  /**
   * Select events grouped by user
   */
  eventsByUser$: Observable<Map<number, SecurityAuditEvent[]>> = this.selectAll().pipe(
    map((events) => this.groupEventsByUser(events)),
    distinctUntilChanged()
  );

  /**
   * Select events grouped by resource type
   */
  eventsByResourceType$: Observable<Map<string, SecurityAuditEvent[]>> = this.selectAll().pipe(
    map((events) => this.groupEventsByResourceType(events)),
    distinctUntilChanged()
  );

  /**
   * Select events grouped by date
   */
  eventsByDate$: Observable<Map<string, SecurityAuditEvent[]>> = this.selectAll().pipe(
    map((events) => this.groupEventsByDate(events)),
    distinctUntilChanged()
  );

  // ==================== Metrics Selectors ====================

  /**
   * Select security metrics
   */
  metrics$: Observable<SecurityMetrics | null> = this.select((state) => state.metrics);

  /**
   * Select total events in last 24 hours
   */
  totalEvents24h$: Observable<number> = this.select(
    (state) => state.metrics?.totalEvents24h || 0
  );

  /**
   * Select failed attempts in last 24 hours
   */
  failedAttempts24h$: Observable<number> = this.select(
    (state) => state.metrics?.failedAttempts24h || 0
  );

  /**
   * Select failure rate percentage
   */
  failureRate24h$: Observable<number> = this.select(
    (state) => state.metrics?.failureRate24h || 0
  );

  /**
   * Select suspicious activity count
   */
  suspiciousActivityCount$: Observable<number> = this.select(
    (state) => state.metrics?.suspiciousActivityCount || 0
  );

  /**
   * Select unique users count
   */
  uniqueUsers24h$: Observable<number> = this.select(
    (state) => state.metrics?.uniqueUsers24h || 0
  );

  /**
   * Select top denied permissions
   */
  topDeniedPermissions$: Observable<SecurityMetrics['topDeniedPermissions']> = this.select(
    (state) => state.metrics?.topDeniedPermissions || []
  );

  /**
   * Select top denied users
   */
  topDeniedUsers$: Observable<SecurityMetrics['topDeniedUsers']> = this.select(
    (state) => state.metrics?.topDeniedUsers || []
  );

  /**
   * Select time series data
   */
  eventsOverTime$: Observable<SecurityMetrics['eventsOverTime']> = this.select(
    (state) => state.metrics?.eventsOverTime || []
  );

  // ==================== Suspicious Activity Selectors ====================

  /**
   * Select all suspicious activity alerts
   */
  suspiciousAlerts$: Observable<SuspiciousActivityAlert[]> = this.select(
    (state) => state.suspiciousActivity
  );

  /**
   * Select unresolved alerts only
   */
  unresolvedAlerts$: Observable<SuspiciousActivityAlert[]> = this.select((state) =>
    state.suspiciousActivity.filter((alert) => !alert.resolved)
  );

  /**
   * Select resolved alerts only
   */
  resolvedAlerts$: Observable<SuspiciousActivityAlert[]> = this.select((state) =>
    state.suspiciousActivity.filter((alert) => alert.resolved)
  );

  /**
   * Select alerts by severity level
   *
   * @param severity - Severity level to filter by
   */
  selectAlertsBySeverity(severity: SeverityLevel): Observable<SuspiciousActivityAlert[]> {
    return this.select((state) =>
      state.suspiciousActivity.filter((alert) => alert.severity === severity)
    );
  }

  /**
   * Select critical alerts (unresolved and critical severity)
   */
  criticalAlerts$: Observable<SuspiciousActivityAlert[]> = this.select((state) =>
    state.suspiciousActivity.filter(
      (alert) => !alert.resolved && alert.severity === 'critical'
    )
  );

  /**
   * Select high priority alerts (unresolved and high/critical severity)
   */
  highPriorityAlerts$: Observable<SuspiciousActivityAlert[]> = this.select((state) =>
    state.suspiciousActivity.filter(
      (alert) =>
        !alert.resolved && (alert.severity === 'high' || alert.severity === 'critical')
    )
  );

  /**
   * Select count of unresolved alerts
   */
  unresolvedAlertCount$: Observable<number> = this.unresolvedAlerts$.pipe(
    map((alerts) => alerts.length),
    distinctUntilChanged()
  );

  /**
   * Select alert statistics
   */
  alertStatistics$: Observable<AlertStatistics | null> = this.select(
    (state) => state.alertStatistics
  );

  /**
   * Select total alert count from statistics
   */
  totalAlertsCount$: Observable<number> = this.select(
    (state) => state.alertStatistics?.totalAlerts || 0
  );

  // ==================== Event Stream Selectors ====================

  /**
   * Select event stream state
   */
  eventStream$: Observable<EventStreamState> = this.select((state) => state.eventStream);

  /**
   * Select whether event streaming is enabled
   */
  eventStreamEnabled$: Observable<boolean> = this.select(
    (state) => state.eventStream.enabled
  );

  /**
   * Select current polling interval
   */
  streamInterval$: Observable<number> = this.select((state) => state.eventStream.interval);

  /**
   * Select event stream buffer
   */
  streamBuffer$: Observable<SecurityAuditEvent[]> = this.select(
    (state) => state.eventStream.buffer
  );

  /**
   * Select last poll time
   */
  lastPollTime$: Observable<Date | null> = this.select(
    (state) => state.eventStream.lastPollTime
  );

  /**
   * Select consecutive error count
   */
  streamErrorCount$: Observable<number> = this.select(
    (state) => state.eventStream.consecutiveErrors
  );

  // ==================== Cache Selectors ====================

  /**
   * Check if cache is valid
   */
  isCacheValid$: Observable<boolean> = this.select((state) => {
    const { lastFetched, ttl } = state.cache;
    if (lastFetched === null) return false;
    const age = Date.now() - lastFetched;
    return age < ttl;
  });

  /**
   * Select cache age in milliseconds
   */
  cacheAge$: Observable<number | null> = this.select((state) => {
    const { lastFetched } = state.cache;
    if (lastFetched === null) return null;
    return Date.now() - lastFetched;
  });

  // ==================== Derived State Selectors ====================

  /**
   * Check if store has any data
   */
  hasData$: Observable<boolean> = this.selectCount().pipe(
    map((count) => count > 0),
    distinctUntilChanged()
  );

  /**
   * Check if store is empty
   */
  isEmpty$: Observable<boolean> = this.selectCount().pipe(
    map((count) => count === 0),
    distinctUntilChanged()
  );

  /**
   * Check if currently loading with no data
   */
  isInitialLoading$: Observable<boolean> = combineLatest([this.loading$, this.hasData$]).pipe(
    map(([loading, hasData]) => loading && !hasData),
    distinctUntilChanged()
  );

  // ==================== Helper Methods ====================

  /**
   * Get events by specific user ID (synchronous)
   *
   * @param userId - User ID to filter by
   * @returns Array of events for the user
   */
  getEventsByUser(userId: number): SecurityAuditEvent[] {
    return this.getAll({
      filterBy: (event) => event.userId === userId,
    });
  }

  /**
   * Get events by specific action (synchronous)
   *
   * @param action - Action type to filter by
   * @returns Array of events with the action
   */
  getEventsByAction(action: SecurityAuditAction): SecurityAuditEvent[] {
    return this.getAll({
      filterBy: (event) => event.action === action,
    });
  }

  /**
   * Get recent events (synchronous)
   *
   * @param limit - Number of recent events to return
   * @returns Array of recent events
   */
  getRecentEvents(limit: number = 20): SecurityAuditEvent[] {
    const events = this.getAll();
    const sorted = [...events].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return sorted.slice(0, limit);
  }

  /**
   * Check if cache is valid (synchronous)
   *
   * @returns True if cache is valid
   */
  isCacheValid(): boolean {
    return this.store.isCacheValid();
  }

  // ==================== Private Helper Methods ====================

  /**
   * Apply filters to event array
   *
   * @private
   * @param events - Events to filter
   * @param filters - Filter settings
   * @returns Filtered events
   */
  private applyFilters(events: SecurityAuditEvent[], filters: AuditFilter): SecurityAuditEvent[] {
    let filtered = events;

    // Filter by action
    if (filters.action !== 'ALL') {
      filtered = filtered.filter((event) => event.action === filters.action);
    }

    // Filter by success
    if (filters.success !== 'ALL') {
      filtered = filtered.filter((event) => event.success === filters.success);
    }

    // Filter by user ID
    if (filters.userId !== null) {
      filtered = filtered.filter((event) => event.userId === filters.userId);
    }

    // Filter by resource type
    if (filters.resourceType) {
      filtered = filtered.filter((event) => event.resourceType === filters.resourceType);
    }

    // Filter by date range
    if (filters.dateRange.start) {
      const startTime = new Date(filters.dateRange.start).getTime();
      filtered = filtered.filter(
        (event) => new Date(event.createdAt).getTime() >= startTime
      );
    }

    if (filters.dateRange.end) {
      const endTime = new Date(filters.dateRange.end).getTime();
      filtered = filtered.filter(
        (event) => new Date(event.createdAt).getTime() <= endTime
      );
    }

    // Filter by search term (search in multiple fields)
    if (filters.searchTerm.trim()) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (event) =>
          event.userEmail?.toLowerCase().includes(searchLower) ||
          event.userName?.toLowerCase().includes(searchLower) ||
          event.action.toLowerCase().includes(searchLower) ||
          event.resourceType?.toLowerCase().includes(searchLower) ||
          event.requestPath.toLowerCase().includes(searchLower) ||
          event.ipAddress.includes(searchLower)
      );
    }

    return filtered;
  }

  /**
   * Group events by action type
   *
   * @private
   * @param events - Events to group
   * @returns Map of action to events
   */
  private groupEventsByAction(
    events: SecurityAuditEvent[]
  ): Map<SecurityAuditAction, SecurityAuditEvent[]> {
    const groups = new Map<SecurityAuditAction, SecurityAuditEvent[]>();

    events.forEach((event) => {
      if (!groups.has(event.action)) {
        groups.set(event.action, []);
      }
      groups.get(event.action)!.push(event);
    });

    return groups;
  }

  /**
   * Group events by user ID
   *
   * @private
   * @param events - Events to group
   * @returns Map of user ID to events
   */
  private groupEventsByUser(events: SecurityAuditEvent[]): Map<number, SecurityAuditEvent[]> {
    const groups = new Map<number, SecurityAuditEvent[]>();

    events.forEach((event) => {
      if (event.userId !== null) {
        if (!groups.has(event.userId)) {
          groups.set(event.userId, []);
        }
        groups.get(event.userId)!.push(event);
      }
    });

    return groups;
  }

  /**
   * Group events by resource type
   *
   * @private
   * @param events - Events to group
   * @returns Map of resource type to events
   */
  private groupEventsByResourceType(
    events: SecurityAuditEvent[]
  ): Map<string, SecurityAuditEvent[]> {
    const groups = new Map<string, SecurityAuditEvent[]>();

    events.forEach((event) => {
      if (event.resourceType) {
        if (!groups.has(event.resourceType)) {
          groups.set(event.resourceType, []);
        }
        groups.get(event.resourceType)!.push(event);
      }
    });

    return groups;
  }

  /**
   * Group events by date (YYYY-MM-DD format)
   *
   * @private
   * @param events - Events to group
   * @returns Map of date string to events
   */
  private groupEventsByDate(events: SecurityAuditEvent[]): Map<string, SecurityAuditEvent[]> {
    const groups = new Map<string, SecurityAuditEvent[]>();

    events.forEach((event) => {
      const dateKey = new Date(event.createdAt).toISOString().split('T')[0];
      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)!.push(event);
    });

    return groups;
  }
}
