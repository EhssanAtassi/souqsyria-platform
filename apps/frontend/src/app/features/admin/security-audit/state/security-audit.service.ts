/**
 * Security Audit Service
 * Main orchestrator service that coordinates between store, query, and data services
 * Provides high-level operations for components to interact with security audit state
 *
 * @module SecurityAuditService
 */

import { Injectable, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, Subject, throwError, of } from 'rxjs';
import {
  tap,
  catchError,
  finalize,
  takeUntil,
  debounceTime,
  distinctUntilChanged,
} from 'rxjs/operators';

import { SecurityAuditStore } from './security-audit.store';
import { SecurityAuditQuery } from './security-audit.query';
import { SecurityAuditDataService } from '../services/security-audit-data.service';
import { EventStreamService } from '../services/event-stream.service';
import {
  QueryAuditLogsDto,
  FailedAttemptsQueryDto,
  AuditFilter,
  filterToQueryDto,
  SecurityAuditEvent,
} from '../models';

/**
 * Main orchestrator service for security audit feature
 * Coordinates all state management, API calls, and business logic
 *
 * @class SecurityAuditService
 * @implements {OnDestroy}
 */
@Injectable()
export class SecurityAuditService implements OnDestroy {
  /** Subject for cleanup on destroy */
  private destroy$ = new Subject<void>();

  /** Debounced filter changes */
  private filterChanges$ = new Subject<Partial<AuditFilter>>();

  constructor(
    private readonly store: SecurityAuditStore,
    private readonly query: SecurityAuditQuery,
    private readonly dataService: SecurityAuditDataService,
    private readonly eventStream: EventStreamService,
    private readonly snackBar: MatSnackBar
  ) {
    this.initializeFilterDebounce();
    this.initializeEventStreamIntegration();
  }

  // ==================== Initialization ====================

  /**
   * Initialize debounced filter updates
   * Prevents excessive API calls when filters change rapidly
   *
   * @private
   */
  private initializeFilterDebounce(): void {
    this.filterChanges$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap((filters) => {
          console.log('[SecurityAuditService] Applying debounced filters:', filters);
          this.store.updateFilters(filters);
          this.refreshEvents().subscribe();
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  /**
   * Initialize event stream integration
   * Handles new events from polling and updates store
   *
   * @private
   */
  private initializeEventStreamIntegration(): void {
    this.eventStream
      .startPolling()
      .pipe(
        tap((newEvents) => {
          if (newEvents.length > 0) {
            console.log(`[SecurityAuditService] Received ${newEvents.length} new events`);
            this.store.upsertEvents(newEvents);
            this.store.addEventsToStreamBuffer(newEvents);
            this.store.resetStreamErrors();

            // Show notification for critical events
            const criticalEvents = newEvents.filter(
              (e) => !e.success || e.action.includes('BAN') || e.action.includes('SUSPEND')
            );

            if (criticalEvents.length > 0) {
              this.showNotification(
                `${criticalEvents.length} critical security event(s) detected`,
                'warn'
              );
            }
          }
        }),
        catchError((error) => {
          console.error('[SecurityAuditService] Event stream error:', error);
          this.store.incrementStreamErrors();
          return throwError(() => error);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();

    // Subscribe to stream errors
    this.eventStream
      .getErrors()
      .pipe(
        tap((error) => {
          this.showNotification(`Live mode error: ${error}`, 'error');
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  // ==================== Audit Logs ====================

  /**
   * Fetch audit logs with current filters and pagination
   *
   * @param params - Optional query parameters (overrides current filters)
   * @returns Observable<PaginatedResponse<SecurityAuditEvent>> containing paginated events
   *
   * @example
   * ```typescript
   * this.securityAuditService.fetchAuditLogs({
   *   action: SecurityAuditAction.ACCESS_DENIED,
   *   page: 1
   * }).subscribe();
   * ```
   */
  fetchAuditLogs(params?: QueryAuditLogsDto): Observable<any> {
    this.store.setLoading(true);

    // Use provided params or build from current state
    const queryParams =
      params ||
      filterToQueryDto(this.query.getValue().filters, {
        page: this.query.getValue().pagination.page,
        limit: this.query.getValue().pagination.limit,
      });

    console.log('[SecurityAuditService] Fetching audit logs:', queryParams);

    return this.dataService.getAuditLogs(queryParams).pipe(
      tap((response) => {
        console.log(`[SecurityAuditService] Loaded ${response.data.length} events`);
        this.store.set(response.data);
        this.store.setPagination(response.pagination);
        this.store.markDataFetched();
      }),
      catchError((error) => {
        console.error('[SecurityAuditService] Failed to fetch audit logs:', error);
        this.showNotification('Failed to load audit logs', 'error');
        return throwError(() => error);
      }),
      finalize(() => this.store.setLoading(false)),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Refresh events (reload current page with current filters)
   *
   * @returns Observable<any> containing refreshed data
   *
   * @example
   * ```typescript
   * this.securityAuditService.refreshEvents().subscribe();
   * ```
   */
  refreshEvents(): Observable<any> {
    console.log('[SecurityAuditService] Refreshing events');
    this.store.invalidateCache();
    return this.fetchAuditLogs();
  }

  /**
   * Fetch details of a specific event
   *
   * @param id - Event ID
   * @returns Observable<any> containing event details
   *
   * @example
   * ```typescript
   * this.securityAuditService.getEventDetails(123).subscribe();
   * ```
   */
  getEventDetails(id: number): Observable<any> {
    this.store.setLoading(true);

    return this.dataService.getEventById(id).pipe(
      tap((response) => {
        console.log('[SecurityAuditService] Loaded event details:', response.data);
        this.store.upsert(id, response.data);
        this.store.setSelectedEvent(id);
      }),
      catchError((error) => {
        console.error('[SecurityAuditService] Failed to fetch event details:', error);
        this.showNotification('Failed to load event details', 'error');
        return throwError(() => error);
      }),
      finalize(() => this.store.setLoading(false)),
      takeUntil(this.destroy$)
    );
  }

  // ==================== Failed Attempts ====================

  /**
   * Fetch failed access attempts
   *
   * @param params - Query parameters for filtering
   * @returns Observable<any> containing failed attempts data
   *
   * @example
   * ```typescript
   * this.securityAuditService.fetchFailedAttempts({
   *   groupBy: 'user',
   *   minAttempts: 5
   * }).subscribe();
   * ```
   */
  fetchFailedAttempts(params?: FailedAttemptsQueryDto): Observable<any> {
    this.store.setLoading(true);

    return this.dataService.getFailedAttempts(params).pipe(
      tap((response) => {
        console.log(
          `[SecurityAuditService] Loaded ${response.data.length} failed attempts`
        );
        this.store.set(response.data);
        this.store.setPagination(response.pagination);
      }),
      catchError((error) => {
        console.error('[SecurityAuditService] Failed to fetch failed attempts:', error);
        this.showNotification('Failed to load failed attempts', 'error');
        return throwError(() => error);
      }),
      finalize(() => this.store.setLoading(false)),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Analyze failed attempts grouped by user
   * Loads metrics showing which users have the most failures
   *
   * @returns Observable<any> containing user denial statistics
   *
   * @example
   * ```typescript
   * this.securityAuditService.analyzeFailedAttemptsByUser().subscribe();
   * ```
   */
  analyzeFailedAttemptsByUser(): Observable<any> {
    this.store.setLoading(true);

    return this.dataService.getFailedAttemptsByUser().pipe(
      tap((response) => {
        console.log('[SecurityAuditService] Loaded user denial stats:', response.data);
        // Store in metrics for display
        this.store.update((state) => ({
          metrics: state.metrics
            ? { ...state.metrics, topDeniedUsers: response.data }
            : null,
        }));
      }),
      catchError((error) => {
        console.error('[SecurityAuditService] Failed to analyze by user:', error);
        this.showNotification('Failed to analyze failed attempts', 'error');
        return throwError(() => error);
      }),
      finalize(() => this.store.setLoading(false)),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Analyze failed attempts grouped by permission
   * Loads metrics showing which permissions are most frequently denied
   *
   * @returns Observable<any> containing permission denial statistics
   *
   * @example
   * ```typescript
   * this.securityAuditService.analyzeFailedAttemptsByPermission().subscribe();
   * ```
   */
  analyzeFailedAttemptsByPermission(): Observable<any> {
    this.store.setLoading(true);

    return this.dataService.getFailedAttemptsByPermission().pipe(
      tap((response) => {
        console.log('[SecurityAuditService] Loaded permission denial stats:', response.data);
        // Store in metrics for display
        this.store.update((state) => ({
          metrics: state.metrics
            ? { ...state.metrics, topDeniedPermissions: response.data }
            : null,
        }));
      }),
      catchError((error) => {
        console.error('[SecurityAuditService] Failed to analyze by permission:', error);
        this.showNotification('Failed to analyze failed attempts', 'error');
        return throwError(() => error);
      }),
      finalize(() => this.store.setLoading(false)),
      takeUntil(this.destroy$)
    );
  }

  // ==================== Suspicious Activity ====================

  /**
   * Fetch all suspicious activity alerts
   *
   * @returns Observable<any> containing suspicious activity alerts
   *
   * @example
   * ```typescript
   * this.securityAuditService.fetchSuspiciousActivity().subscribe();
   * ```
   */
  fetchSuspiciousActivity(): Observable<any> {
    this.store.setLoading(true);

    return this.dataService.getSuspiciousActivity().pipe(
      tap((response) => {
        console.log(`[SecurityAuditService] Loaded ${response.data.length} alerts`);
        this.store.setSuspiciousActivity(response.data);

        // Show notification for critical unresolved alerts
        const criticalUnresolved = response.data.filter(
          (a) => !a.resolved && a.severity === 'critical'
        );
        if (criticalUnresolved.length > 0) {
          this.showNotification(
            `${criticalUnresolved.length} critical security alert(s) require attention`,
            'warn'
          );
        }
      }),
      catchError((error) => {
        console.error('[SecurityAuditService] Failed to fetch suspicious activity:', error);
        this.showNotification('Failed to load suspicious activity', 'error');
        return throwError(() => error);
      }),
      finalize(() => this.store.setLoading(false)),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Mark a suspicious activity alert as resolved
   *
   * @param alertId - Alert ID
   * @param notes - Optional resolution notes
   * @returns Observable<any> that completes after alert is resolved
   *
   * @example
   * ```typescript
   * this.securityAuditService.resolveAlert('alert-123', 'False positive')
   *   .subscribe();
   * ```
   */
  resolveAlert(alertId: string, notes?: string): Observable<any> {
    return this.dataService.resolveAlert(alertId, notes).pipe(
      tap(() => {
        console.log('[SecurityAuditService] Resolved alert:', alertId);
        this.store.updateAlert(alertId, {
          resolved: true,
          resolvedAt: new Date(),
          notes,
        });
        this.showNotification('Alert resolved successfully', 'success');
      }),
      catchError((error) => {
        console.error('[SecurityAuditService] Failed to resolve alert:', error);
        this.showNotification('Failed to resolve alert', 'error');
        return throwError(() => error);
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Fetch alert statistics
   *
   * @returns Observable<any> containing alert statistics
   *
   * @example
   * ```typescript
   * this.securityAuditService.fetchAlertStatistics().subscribe();
   * ```
   */
  fetchAlertStatistics(): Observable<any> {
    return this.dataService.getAlertStatistics().pipe(
      tap((response) => {
        console.log('[SecurityAuditService] Loaded alert statistics:', response.data);
        this.store.setAlertStatistics(response.data);
      }),
      catchError((error) => {
        console.error('[SecurityAuditService] Failed to fetch alert statistics:', error);
        this.showNotification('Failed to load alert statistics', 'error');
        return throwError(() => error);
      }),
      takeUntil(this.destroy$)
    );
  }

  // ==================== Metrics & Reports ====================

  /**
   * Fetch security metrics for a specific period
   *
   * @param period - Time period ('24h', '7d', or '30d')
   * @returns Observable<any> containing security metrics
   *
   * @example
   * ```typescript
   * this.securityAuditService.fetchMetrics('24h').subscribe();
   * ```
   */
  fetchMetrics(period: '24h' | '7d' | '30d' = '24h'): Observable<any> {
    this.store.setLoading(true);

    return this.dataService.getMetrics(period).pipe(
      tap((response) => {
        console.log('[SecurityAuditService] Loaded metrics:', response.data);
        this.store.setMetrics(response.data);
      }),
      catchError((error) => {
        console.error('[SecurityAuditService] Failed to fetch metrics:', error);
        this.showNotification('Failed to load metrics', 'error');
        return throwError(() => error);
      }),
      finalize(() => this.store.setLoading(false)),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Fetch daily security report
   *
   * @param date - Date to generate report for
   * @returns Observable<any> containing daily security report
   *
   * @example
   * ```typescript
   * this.securityAuditService.fetchDailyReport(new Date()).subscribe();
   * ```
   */
  fetchDailyReport(date: Date): Observable<any> {
    this.store.setLoading(true);

    return this.dataService.getDailyReport(date).pipe(
      tap((response) => {
        console.log('[SecurityAuditService] Loaded daily report:', response.data);
        // Store critical events from report
        if (response.data.criticalEvents.length > 0) {
          this.store.upsertEvents(response.data.criticalEvents);
        }
      }),
      catchError((error) => {
        console.error('[SecurityAuditService] Failed to fetch daily report:', error);
        this.showNotification('Failed to load daily report', 'error');
        return throwError(() => error);
      }),
      finalize(() => this.store.setLoading(false)),
      takeUntil(this.destroy$)
    );
  }

  // ==================== High-Level Convenience Methods ====================

  /**
   * Load initial metrics for dashboard
   *
   * @returns Observable<any> containing metrics data
   *
   * @example
   * ```typescript
   * this.securityAuditService.loadMetrics().subscribe();
   * ```
   */
  loadMetrics(): Observable<any> {
    return this.fetchMetrics('24h');
  }

  /**
   * Load initial events for audit log view
   *
   * @returns Observable<any> containing event data
   *
   * @example
   * ```typescript
   * this.securityAuditService.loadEvents().subscribe();
   * ```
   */
  loadEvents(): Observable<any> {
    return this.fetchAuditLogs();
  }

  /**
   * Load suspicious activity alerts
   *
   * @returns Observable<any> containing alert data
   *
   * @example
   * ```typescript
   * this.securityAuditService.loadSuspiciousActivity().subscribe();
   * ```
   */
  loadSuspiciousActivity(): Observable<any> {
    return this.fetchSuspiciousActivity();
  }

  /**
   * Apply filters and refresh data
   *
   * @param filters - Partial filter object
   * @returns Observable<any> containing filtered data
   *
   * @example
   * ```typescript
   * this.securityAuditService.applyFilters({ action: 'ACCESS_DENIED' }).subscribe();
   * ```
   */
  applyFilters(filters: Partial<AuditFilter>): Observable<any> {
    this.updateFilters(filters);
    return this.refreshEvents();
  }

  /**
   * Set current page and reload
   *
   * @param page - Page number (1-indexed)
   * @returns Observable<any> containing page data
   *
   * @example
   * ```typescript
   * this.securityAuditService.setPage(2).subscribe();
   * ```
   */
  setPage(page: number): Observable<any> {
    this.store.setPage(page);
    return this.fetchAuditLogs();
  }

  /**
   * Set page size and reload
   *
   * @param pageSize - Number of items per page
   * @returns Observable<any> containing page data
   *
   * @example
   * ```typescript
   * this.securityAuditService.setPageSize(100).subscribe();
   * ```
   */
  setPageSize(pageSize: number): Observable<any> {
    this.store.setPageSize(pageSize);
    return this.fetchAuditLogs();
  }

  /**
   * Refresh all data (metrics, events, alerts)
   *
   * @returns Observable<any> that completes when all data is refreshed
   *
   * @example
   * ```typescript
   * this.securityAuditService.refresh().subscribe();
   * ```
   */
  refresh(): Observable<any> {
    return this.refreshEvents();
  }

  /**
   * Export events to file
   *
   * @param format - Export format ('json' or 'csv')
   * @returns Observable<Blob> containing exported data
   *
   * @example
   * ```typescript
   * this.securityAuditService.exportEvents('csv').subscribe();
   * ```
   */
  exportEvents(format: 'json' | 'csv'): Observable<Blob> {
    return this.exportLogs(format);
  }

  // ==================== Event Stream (Live Mode) ====================

  /**
   * Enable live mode (start real-time polling)
   *
   * @returns Observable<any> that completes after enabling
   *
   * @example
   * ```typescript
   * this.securityAuditService.enableLiveMode().subscribe();
   * ```
   */
  enableLiveMode(): Observable<any> {
    console.log('[SecurityAuditService] Enabling live mode');
    this.store.setLiveMode(true);
    this.eventStream.setEnabled(true);
    this.showNotification('Live mode enabled', 'success');
    return of(true);
  }

  /**
   * Disable live mode (stop real-time polling)
   *
   * @returns Observable<any> that completes after disabling
   *
   * @example
   * ```typescript
   * this.securityAuditService.disableLiveMode().subscribe();
   * ```
   */
  disableLiveMode(): Observable<any> {
    console.log('[SecurityAuditService] Disabling live mode');
    this.store.setLiveMode(false);
    this.eventStream.setEnabled(false);
    this.showNotification('Live mode disabled', 'info');
    return of(true);
  }

  /**
   * Toggle live mode on/off
   *
   * @example
   * ```typescript
   * this.securityAuditService.toggleLiveMode();
   * ```
   */
  toggleLiveMode(): void {
    const isEnabled = this.query.getValue().ui.liveMode;
    if (isEnabled) {
      this.disableLiveMode();
    } else {
      this.enableLiveMode();
    }
  }

  // ==================== Filters & Pagination ====================

  /**
   * Update filter settings (debounced)
   *
   * @param filters - Partial filter object to merge
   *
   * @example
   * ```typescript
   * this.securityAuditService.updateFilters({
   *   action: SecurityAuditAction.ACCESS_DENIED,
   *   success: false
   * });
   * ```
   */
  updateFilters(filters: Partial<AuditFilter>): void {
    console.log('[SecurityAuditService] Updating filters:', filters);
    this.filterChanges$.next(filters);
  }

  /**
   * Clear all filters and refresh data
   *
   * @example
   * ```typescript
   * this.securityAuditService.clearFilters();
   * ```
   */
  clearFilters(): void {
    console.log('[SecurityAuditService] Clearing filters');
    this.store.resetFilters();
    this.refreshEvents().subscribe();
    this.showNotification('Filters cleared', 'info');
  }

  /**
   * Update pagination settings
   *
   * @param page - Page number (1-indexed)
   * @param limit - Optional page size
   *
   * @example
   * ```typescript
   * this.securityAuditService.updatePagination(2, 100);
   * ```
   */
  updatePagination(page: number, limit?: number): void {
    console.log('[SecurityAuditService] Updating pagination:', { page, limit });

    if (limit !== undefined) {
      this.store.setPageSize(limit);
    } else {
      this.store.setPage(page);
    }

    this.fetchAuditLogs().subscribe();
  }

  // ==================== Selection ====================

  /**
   * Select an event for detail view
   *
   * @param eventId - Event ID to select (null to deselect)
   *
   * @example
   * ```typescript
   * this.securityAuditService.selectEvent(123);
   * ```
   */
  selectEvent(eventId: number | null): void {
    console.log('[SecurityAuditService] Selecting event:', eventId);
    this.store.setSelectedEvent(eventId);

    // Optionally fetch full details if not already loaded
    if (eventId !== null && !this.query.hasEntity(eventId)) {
      this.getEventDetails(eventId).subscribe();
    }
  }

  // ==================== View Mode ====================

  /**
   * Set the current view mode
   *
   * @param mode - View mode to set
   *
   * @example
   * ```typescript
   * this.securityAuditService.setViewMode('timeline');
   * ```
   */
  setViewMode(mode: 'list' | 'timeline' | 'chart'): void {
    console.log('[SecurityAuditService] Setting view mode:', mode);
    this.store.setViewMode(mode);
  }

  // ==================== Export ====================

  /**
   * Export audit logs to file
   *
   * @param format - Export format ('json' or 'csv')
   * @returns Observable<Blob> containing the exported file
   *
   * @example
   * ```typescript
   * this.securityAuditService.exportLogs('csv').subscribe();
   * ```
   */
  exportLogs(format: 'json' | 'csv'): Observable<Blob> {
    const params = filterToQueryDto(this.query.getValue().filters);

    return this.dataService.exportLogs(params, format).pipe(
      tap((blob) => {
        console.log('[SecurityAuditService] Exporting logs as', format);
        this.downloadBlob(blob, `audit-logs-${Date.now()}.${format}`);
        this.showNotification(`Logs exported as ${format.toUpperCase()}`, 'success');
      }),
      catchError((error) => {
        console.error('[SecurityAuditService] Failed to export logs:', error);
        this.showNotification('Failed to export logs', 'error');
        return throwError(() => error);
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Export a security report to file
   *
   * @param reportId - Report identifier
   * @param format - Export format ('pdf' or 'csv')
   * @returns Observable<Blob> containing the exported report
   *
   * @example
   * ```typescript
   * this.securityAuditService.exportReport('daily-2024-01-15', 'pdf').subscribe();
   * ```
   */
  exportReport(reportId: string, format: 'pdf' | 'csv'): Observable<Blob> {
    return this.dataService.exportReport(reportId, format).pipe(
      tap((blob) => {
        console.log('[SecurityAuditService] Exporting report as', format);
        this.downloadBlob(blob, `security-report-${reportId}.${format}`);
        this.showNotification(`Report exported as ${format.toUpperCase()}`, 'success');
      }),
      catchError((error) => {
        console.error('[SecurityAuditService] Failed to export report:', error);
        this.showNotification('Failed to export report', 'error');
        return throwError(() => error);
      }),
      takeUntil(this.destroy$)
    );
  }

  // ==================== Helper Methods ====================

  /**
   * Show a notification using MatSnackBar
   *
   * @private
   * @param message - Message to display
   * @param type - Notification type
   */
  private showNotification(
    message: string,
    type: 'success' | 'error' | 'warn' | 'info' = 'info'
  ): void {
    this.snackBar.open(message, 'Close', {
      duration: type === 'error' ? 5000 : 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: [`snackbar-${type}`],
    });
  }

  /**
   * Download a blob as a file
   *
   * @private
   * @param blob - Blob to download
   * @param filename - Filename for the download
   */
  private downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Cleanup on destroy
   */
  ngOnDestroy(): void {
    console.log('[SecurityAuditService] Service destroyed, cleaning up');
    this.destroy$.next();
    this.destroy$.complete();
    this.filterChanges$.complete();
  }
}
