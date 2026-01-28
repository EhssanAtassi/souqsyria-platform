/**
 * Security Audit Store
 * Akita entity store for managing security audit event state
 *
 * @module SecurityAuditStore
 */

import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';

import {
  SecurityAuditEvent,
  AuditFilter,
  DEFAULT_AUDIT_FILTER,
  SecurityMetrics,
  SuspiciousActivityAlert,
  AlertStatistics,
  EventStreamState,
  DEFAULT_EVENT_STREAM_STATE,
} from '../models';

/**
 * State interface for the security audit store
 * Extends Akita's EntityState with custom UI and filter state
 *
 * @interface SecurityAuditState
 * @extends {EntityState<SecurityAuditEvent, number>}
 */
export interface SecurityAuditState extends EntityState<SecurityAuditEvent, number> {
  /** UI-related state */
  ui: {
    /** Loading indicator for async operations */
    loading: boolean;

    /** Currently selected event ID for detail view */
    selectedEventId: number | null;

    /** Current view mode for displaying events */
    viewMode: 'list' | 'timeline' | 'chart';

    /** Whether live mode (real-time polling) is enabled */
    liveMode: boolean;
  };

  /** Current filter settings */
  filters: AuditFilter;

  /** Pagination state */
  pagination: {
    /** Current page number (1-indexed) */
    page: number;

    /** Number of items per page */
    limit: number;

    /** Total number of items across all pages */
    totalCount: number;

    /** Total number of pages */
    totalPages: number;

    /** Whether there is a next page */
    hasNextPage: boolean;

    /** Whether there is a previous page */
    hasPrevPage: boolean;
  };

  /** Security metrics data */
  metrics: SecurityMetrics | null;

  /** Suspicious activity alerts */
  suspiciousActivity: SuspiciousActivityAlert[];

  /** Statistics about alerts */
  alertStatistics: AlertStatistics | null;

  /** Event stream polling state */
  eventStream: EventStreamState;

  /** Cache metadata */
  cache: {
    /** Timestamp of last successful fetch (milliseconds) */
    lastFetched: number | null;

    /** Time-to-live for cached data in milliseconds (1 minute for security data) */
    ttl: number;
  };
}

/**
 * Initial state factory function
 *
 * @returns Initial state object
 */
export function createInitialState(): SecurityAuditState {
  return {
    ui: {
      loading: false,
      selectedEventId: null,
      viewMode: 'list',
      liveMode: false,
    },
    filters: { ...DEFAULT_AUDIT_FILTER },
    pagination: {
      page: 1,
      limit: 50,
      totalCount: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
    },
    metrics: null,
    suspiciousActivity: [],
    alertStatistics: null,
    eventStream: { ...DEFAULT_EVENT_STREAM_STATE },
    cache: {
      lastFetched: null,
      ttl: 60000, // 1 minute
    },
  };
}

/**
 * Akita entity store for security audit events
 * Manages the state of audit events and related data
 *
 * @class SecurityAuditStore
 * @extends {EntityStore<SecurityAuditState, SecurityAuditEvent>}
 */
@Injectable()
@StoreConfig({
  name: 'security-audit',
  idKey: 'id',
  resettable: true,
})
export class SecurityAuditStore extends EntityStore<SecurityAuditState, SecurityAuditEvent> {
  constructor() {
    super(createInitialState());
    console.log('[SecurityAuditStore] Store initialized');
  }

  // ==================== Loading State ====================

  /**
   * Set loading state
   *
   * @param loading - Whether loading is in progress
   */
  override setLoading(loading: boolean): void {
    this.update((state) => ({
      ui: { ...state.ui, loading },
    }));
  }

  // ==================== Selection ====================

  /**
   * Set the currently selected event
   *
   * @param eventId - Event ID to select (null to deselect)
   */
  setSelectedEvent(eventId: number | null): void {
    this.update((state) => ({
      ui: { ...state.ui, selectedEventId: eventId },
    }));

    if (eventId !== null) {
      this.setActive(eventId);
    } else {
      this.setActive(null);
    }
  }

  // ==================== View Mode ====================

  /**
   * Set the current view mode
   *
   * @param viewMode - View mode to set
   */
  setViewMode(viewMode: 'list' | 'timeline' | 'chart'): void {
    this.update((state) => ({
      ui: { ...state.ui, viewMode },
    }));
  }

  // ==================== Live Mode ====================

  /**
   * Set live mode state
   *
   * @param liveMode - Whether live mode is enabled
   */
  setLiveMode(liveMode: boolean): void {
    this.update((state) => ({
      ui: { ...state.ui, liveMode },
      eventStream: { ...state.eventStream, enabled: liveMode },
    }));
  }

  // ==================== Filters ====================

  /**
   * Update filter settings
   *
   * @param filters - Partial filter object to merge
   */
  updateFilters(filters: Partial<AuditFilter>): void {
    this.update((state) => ({
      filters: { ...state.filters, ...filters },
    }));
  }

  /**
   * Reset filters to default values
   */
  resetFilters(): void {
    this.update((state) => ({
      filters: { ...DEFAULT_AUDIT_FILTER },
    }));
  }

  // ==================== Pagination ====================

  /**
   * Update pagination state from API response
   *
   * @param pagination - Pagination metadata from API
   */
  setPagination(pagination: Partial<SecurityAuditState['pagination']>): void {
    this.update((state) => ({
      pagination: { ...state.pagination, ...pagination },
    }));
  }

  /**
   * Update current page number
   *
   * @param page - Page number (1-indexed)
   */
  setPage(page: number): void {
    this.update((state) => ({
      pagination: { ...state.pagination, page },
    }));
  }

  /**
   * Update page size
   *
   * @param limit - Number of items per page
   */
  setPageSize(limit: number): void {
    this.update((state) => ({
      pagination: { ...state.pagination, limit, page: 1 },
    }));
  }

  // ==================== Metrics ====================

  /**
   * Set security metrics data
   *
   * @param metrics - Security metrics object
   */
  setMetrics(metrics: SecurityMetrics): void {
    this.update({ metrics });
  }

  /**
   * Clear metrics data
   */
  clearMetrics(): void {
    this.update({ metrics: null });
  }

  // ==================== Suspicious Activity ====================

  /**
   * Set suspicious activity alerts
   *
   * @param alerts - Array of alerts
   */
  setSuspiciousActivity(alerts: SuspiciousActivityAlert[]): void {
    this.update({ suspiciousActivity: alerts });
  }

  /**
   * Update a single alert
   *
   * @param alertId - Alert ID
   * @param updates - Partial alert object to merge
   */
  updateAlert(alertId: string, updates: Partial<SuspiciousActivityAlert>): void {
    this.update((state) => ({
      suspiciousActivity: state.suspiciousActivity.map((alert) =>
        alert.id === alertId ? { ...alert, ...updates } : alert
      ),
    }));
  }

  /**
   * Remove an alert from the list
   *
   * @param alertId - Alert ID to remove
   */
  removeAlert(alertId: string): void {
    this.update((state) => ({
      suspiciousActivity: state.suspiciousActivity.filter((alert) => alert.id !== alertId),
    }));
  }

  /**
   * Set alert statistics
   *
   * @param stats - Alert statistics object
   */
  setAlertStatistics(stats: AlertStatistics): void {
    this.update({ alertStatistics: stats });
  }

  // ==================== Event Stream ====================

  /**
   * Update event stream state
   *
   * @param streamState - Partial event stream state to merge
   */
  updateEventStream(streamState: Partial<EventStreamState>): void {
    this.update((state) => ({
      eventStream: { ...state.eventStream, ...streamState },
    }));
  }

  /**
   * Set event stream enabled state
   *
   * @param enabled - Whether streaming is enabled
   */
  setEventStreamEnabled(enabled: boolean): void {
    this.update((state) => ({
      eventStream: { ...state.eventStream, enabled },
    }));
  }

  /**
   * Update event stream buffer
   *
   * @param events - New events to add to buffer
   */
  addEventsToStreamBuffer(events: SecurityAuditEvent[]): void {
    this.update((state) => ({
      eventStream: {
        ...state.eventStream,
        buffer: [...state.eventStream.buffer, ...events].slice(-100), // Keep last 100
        lastPollTime: new Date(),
      },
    }));
  }

  /**
   * Clear event stream buffer
   */
  clearStreamBuffer(): void {
    this.update((state) => ({
      eventStream: { ...state.eventStream, buffer: [] },
    }));
  }

  /**
   * Increment consecutive error count
   */
  incrementStreamErrors(): void {
    this.update((state) => ({
      eventStream: {
        ...state.eventStream,
        consecutiveErrors: state.eventStream.consecutiveErrors + 1,
      },
    }));
  }

  /**
   * Reset consecutive error count
   */
  resetStreamErrors(): void {
    this.update((state) => ({
      eventStream: { ...state.eventStream, consecutiveErrors: 0 },
    }));
  }

  // ==================== Cache Management ====================

  /**
   * Mark data as freshly fetched
   */
  markDataFetched(): void {
    this.update((state) => ({
      cache: { ...state.cache, lastFetched: Date.now() },
    }));
  }

  /**
   * Invalidate cache (force refresh on next request)
   */
  invalidateCache(): void {
    this.update((state) => ({
      cache: { ...state.cache, lastFetched: null },
    }));
  }

  /**
   * Check if cache is valid
   *
   * @returns True if cache is still valid
   */
  isCacheValid(): boolean {
    const { lastFetched, ttl } = this.getValue().cache;

    if (lastFetched === null) {
      return false;
    }

    const age = Date.now() - lastFetched;
    return age < ttl;
  }

  // ==================== Bulk Operations ====================

  /**
   * Add or update multiple events efficiently
   *
   * @param events - Events to add or update
   */
  upsertEvents(events: SecurityAuditEvent[]): void {
    this.upsertMany(events);
  }

  /**
   * Clear all events from store
   */
  clearEvents(): void {
    this.set([]);
  }

  /**
   * Reset entire store to initial state
   */
  resetStore(): void {
    this.reset();
    console.log('[SecurityAuditStore] Store reset to initial state');
  }
}
