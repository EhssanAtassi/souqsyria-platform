/**
 * Security Audit Data Service
 * Pure HTTP service for communicating with the security audit backend API
 * No state management - only handles HTTP requests and responses
 *
 * @module SecurityAuditDataService
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  SecurityAuditEvent,
  QueryAuditLogsDto,
  FailedAttemptsQueryDto,
  SuspiciousActivityAlert,
  AlertStatistics,
  SecurityMetrics,
  DailySecurityReport,
  TimeSeriesDataPoint,
  PermissionDenialStat,
  UserDenialStat,
  PaginatedResponse,
  ApiResponse,
} from '../models';

/**
 * HTTP service for security audit data operations
 * Communicates with /api/admin/security endpoints
 *
 * @class SecurityAuditDataService
 */
@Injectable({
  providedIn: 'root',
})
export class SecurityAuditDataService {
  /** Base URL for security audit API endpoints */
  private readonly apiUrl = '/api/admin/security';

  constructor(private readonly http: HttpClient) {}

  // ==================== Audit Logs ====================

  /**
   * Fetch paginated audit logs with optional filters
   *
   * @param params - Query parameters for filtering and pagination
   * @returns Observable of paginated audit events
   *
   * @example
   * ```typescript
   * this.dataService.getAuditLogs({
   *   action: SecurityAuditAction.ACCESS_DENIED,
   *   page: 1,
   *   limit: 50
   * }).subscribe(response => {
   *   console.log('Events:', response.data);
   *   console.log('Total:', response.pagination.totalCount);
   * });
   * ```
   */
  getAuditLogs(params?: QueryAuditLogsDto): Observable<PaginatedResponse<SecurityAuditEvent>> {
    const httpParams = this.buildHttpParams(params);

    return this.http
      .get<PaginatedResponse<SecurityAuditEvent>>(`${this.apiUrl}/audit-logs`, {
        params: httpParams,
      })
      .pipe(map((response) => this.parseDatesInPaginatedResponse(response)));
  }

  /**
   * Fetch a single audit event by ID
   *
   * @param id - Event ID
   * @returns Observable of audit event
   *
   * @example
   * ```typescript
   * this.dataService.getEventById(123).subscribe(response => {
   *   console.log('Event:', response.data);
   * });
   * ```
   */
  getEventById(id: number): Observable<ApiResponse<SecurityAuditEvent>> {
    return this.http
      .get<ApiResponse<SecurityAuditEvent>>(`${this.apiUrl}/audit-logs/${id}`)
      .pipe(map((response) => this.parseDatesInApiResponse(response)));
  }

  /**
   * Fetch the latest audit events
   * Used for real-time polling in live mode
   *
   * @param limit - Maximum number of events to return
   * @param since - Optional timestamp to fetch events after
   * @returns Observable of latest events
   *
   * @example
   * ```typescript
   * this.dataService.getLatestEvents(10, new Date()).subscribe(response => {
   *   console.log('New events:', response.data);
   * });
   * ```
   */
  getLatestEvents(limit: number = 10, since?: Date): Observable<ApiResponse<SecurityAuditEvent[]>> {
    let params = new HttpParams().set('limit', limit.toString());

    if (since) {
      params = params.set('since', since.toISOString());
    }

    return this.http
      .get<ApiResponse<SecurityAuditEvent[]>>(`${this.apiUrl}/audit-logs/latest`, { params })
      .pipe(map((response) => this.parseDatesInArrayResponse(response)));
  }

  // ==================== Failed Attempts ====================

  /**
   * Fetch failed access attempts with optional grouping and filtering
   *
   * @param params - Query parameters for grouping and filtering
   * @returns Observable of paginated failed attempts
   *
   * @example
   * ```typescript
   * this.dataService.getFailedAttempts({
   *   groupBy: 'user',
   *   minAttempts: 5
   * }).subscribe(response => {
   *   console.log('Failed attempts:', response.data);
   * });
   * ```
   */
  getFailedAttempts(
    params?: FailedAttemptsQueryDto
  ): Observable<PaginatedResponse<SecurityAuditEvent>> {
    const httpParams = this.buildHttpParams(params);

    return this.http
      .get<PaginatedResponse<SecurityAuditEvent>>(`${this.apiUrl}/failed-attempts`, {
        params: httpParams,
      })
      .pipe(map((response) => this.parseDatesInPaginatedResponse(response)));
  }

  /**
   * Fetch failed attempts grouped by user
   * Returns statistics about which users have the most failures
   *
   * @param params - Query parameters for filtering
   * @returns Observable of user denial statistics
   *
   * @example
   * ```typescript
   * this.dataService.getFailedAttemptsByUser({
   *   startDate: '2024-01-01',
   *   minAttempts: 3
   * }).subscribe(response => {
   *   console.log('Top denied users:', response.data);
   * });
   * ```
   */
  getFailedAttemptsByUser(
    params?: FailedAttemptsQueryDto
  ): Observable<ApiResponse<UserDenialStat[]>> {
    const httpParams = this.buildHttpParams(params);

    return this.http
      .get<ApiResponse<UserDenialStat[]>>(`${this.apiUrl}/failed-attempts/by-user`, {
        params: httpParams,
      })
      .pipe(
        map((response) => ({
          ...response,
          data: response.data.map((stat) => ({
            ...stat,
            lastAttemptAt: new Date(stat.lastAttemptAt),
          })),
          timestamp: new Date(response.timestamp),
        }))
      );
  }

  /**
   * Fetch failed attempts grouped by permission
   * Returns statistics about which permissions are most frequently denied
   *
   * @param params - Query parameters for filtering
   * @returns Observable of permission denial statistics
   *
   * @example
   * ```typescript
   * this.dataService.getFailedAttemptsByPermission().subscribe(response => {
   *   console.log('Top denied permissions:', response.data);
   * });
   * ```
   */
  getFailedAttemptsByPermission(
    params?: FailedAttemptsQueryDto
  ): Observable<ApiResponse<PermissionDenialStat[]>> {
    const httpParams = this.buildHttpParams(params);

    return this.http
      .get<ApiResponse<PermissionDenialStat[]>>(`${this.apiUrl}/failed-attempts/by-permission`, {
        params: httpParams,
      })
      .pipe(map((response) => this.parseDatesInApiResponse(response)));
  }

  // ==================== Suspicious Activity ====================

  /**
   * Fetch all suspicious activity alerts
   *
   * @returns Observable of suspicious activity alerts
   *
   * @example
   * ```typescript
   * this.dataService.getSuspiciousActivity().subscribe(response => {
   *   const criticalAlerts = response.data.filter(a => a.severity === 'critical');
   *   console.log('Critical alerts:', criticalAlerts);
   * });
   * ```
   */
  getSuspiciousActivity(): Observable<ApiResponse<SuspiciousActivityAlert[]>> {
    return this.http
      .get<ApiResponse<SuspiciousActivityAlert[]>>(`${this.apiUrl}/suspicious-activity`)
      .pipe(
        map((response) => ({
          ...response,
          data: response.data.map((alert) => this.parseDatesInAlert(alert)),
          timestamp: new Date(response.timestamp),
        }))
      );
  }

  /**
   * Fetch a single suspicious activity alert by ID
   *
   * @param id - Alert ID
   * @returns Observable of alert details
   *
   * @example
   * ```typescript
   * this.dataService.getAlertById('alert-123').subscribe(response => {
   *   console.log('Alert:', response.data);
   * });
   * ```
   */
  getAlertById(id: string): Observable<ApiResponse<SuspiciousActivityAlert>> {
    return this.http
      .get<ApiResponse<SuspiciousActivityAlert>>(`${this.apiUrl}/suspicious-activity/${id}`)
      .pipe(
        map((response) => ({
          ...response,
          data: this.parseDatesInAlert(response.data),
          timestamp: new Date(response.timestamp),
        }))
      );
  }

  /**
   * Mark a suspicious activity alert as resolved
   *
   * @param id - Alert ID
   * @param notes - Optional resolution notes
   * @returns Observable of void (empty success response)
   *
   * @example
   * ```typescript
   * this.dataService.resolveAlert('alert-123', 'False positive - legitimate admin action')
   *   .subscribe(() => {
   *     console.log('Alert resolved');
   *   });
   * ```
   */
  resolveAlert(id: string, notes?: string): Observable<ApiResponse<void>> {
    return this.http
      .patch<ApiResponse<void>>(`${this.apiUrl}/suspicious-activity/${id}/resolve`, {
        notes,
      })
      .pipe(map((response) => this.parseDatesInApiResponse(response)));
  }

  /**
   * Fetch statistics about suspicious activity alerts
   *
   * @returns Observable of alert statistics
   *
   * @example
   * ```typescript
   * this.dataService.getAlertStatistics().subscribe(response => {
   *   console.log('Unresolved alerts:', response.data.unresolvedAlerts);
   * });
   * ```
   */
  getAlertStatistics(): Observable<ApiResponse<AlertStatistics>> {
    return this.http
      .get<ApiResponse<AlertStatistics>>(`${this.apiUrl}/suspicious-activity/statistics`)
      .pipe(map((response) => this.parseDatesInApiResponse(response)));
  }

  // ==================== Metrics & Reports ====================

  /**
   * Fetch security metrics for a specific time period
   *
   * @param period - Time period ('24h', '7d', or '30d')
   * @returns Observable of security metrics
   *
   * @example
   * ```typescript
   * this.dataService.getMetrics('24h').subscribe(response => {
   *   console.log('Total events:', response.data.totalEvents24h);
   *   console.log('Failure rate:', response.data.failureRate24h);
   * });
   * ```
   */
  getMetrics(period: '24h' | '7d' | '30d' = '24h'): Observable<ApiResponse<SecurityMetrics>> {
    return this.http
      .get<ApiResponse<SecurityMetrics>>(`${this.apiUrl}/metrics`, {
        params: new HttpParams().set('period', period),
      })
      .pipe(
        map((response) => ({
          ...response,
          data: {
            ...response.data,
            lastUpdated: new Date(response.data.lastUpdated),
            topDeniedUsers: response.data.topDeniedUsers.map((user) => ({
              ...user,
              lastAttemptAt: new Date(user.lastAttemptAt),
            })),
            eventsOverTime: response.data.eventsOverTime.map((point) => ({
              ...point,
              timestamp: new Date(point.timestamp),
            })),
          },
          timestamp: new Date(response.timestamp),
        }))
      );
  }

  /**
   * Fetch a comprehensive daily security report
   *
   * @param date - Date to generate report for
   * @returns Observable of daily report
   *
   * @example
   * ```typescript
   * this.dataService.getDailyReport(new Date('2024-01-15')).subscribe(response => {
   *   console.log('Report:', response.data.summary);
   * });
   * ```
   */
  getDailyReport(date: Date): Observable<ApiResponse<DailySecurityReport>> {
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD

    return this.http
      .get<ApiResponse<DailySecurityReport>>(`${this.apiUrl}/reports/daily`, {
        params: new HttpParams().set('date', dateStr),
      })
      .pipe(
        map((response) => ({
          ...response,
          data: {
            ...response.data,
            date: new Date(response.data.date),
            criticalEvents: response.data.criticalEvents.map((event) => this.parseDatesInEvent(event)),
          },
          timestamp: new Date(response.timestamp),
        }))
      );
  }

  /**
   * Fetch time-series event data for charting
   *
   * @param start - Start date
   * @param end - End date
   * @param interval - Data point interval ('hour' or 'day')
   * @returns Observable of time-series data points
   *
   * @example
   * ```typescript
   * const start = new Date('2024-01-01');
   * const end = new Date('2024-01-31');
   * this.dataService.getEventsOverTime(start, end, 'day').subscribe(response => {
   *   console.log('Chart data:', response.data);
   * });
   * ```
   */
  getEventsOverTime(
    start: Date,
    end: Date,
    interval: 'hour' | 'day' = 'hour'
  ): Observable<ApiResponse<TimeSeriesDataPoint[]>> {
    const params = new HttpParams()
      .set('start', start.toISOString())
      .set('end', end.toISOString())
      .set('interval', interval);

    return this.http
      .get<ApiResponse<TimeSeriesDataPoint[]>>(`${this.apiUrl}/events/time-series`, { params })
      .pipe(
        map((response) => ({
          ...response,
          data: response.data.map((point) => ({
            ...point,
            timestamp: new Date(point.timestamp),
          })),
          timestamp: new Date(response.timestamp),
        }))
      );
  }

  // ==================== User Activity ====================

  /**
   * Fetch activity timeline for a specific user
   *
   * @param userId - User ID
   * @param limit - Maximum number of events to return
   * @returns Observable of user's audit events
   *
   * @example
   * ```typescript
   * this.dataService.getUserActivityTimeline(123, 50).subscribe(response => {
   *   console.log('User activity:', response.data);
   * });
   * ```
   */
  getUserActivityTimeline(
    userId: number,
    limit: number = 100
  ): Observable<ApiResponse<SecurityAuditEvent[]>> {
    return this.http
      .get<ApiResponse<SecurityAuditEvent[]>>(`${this.apiUrl}/users/${userId}/activity`, {
        params: new HttpParams().set('limit', limit.toString()),
      })
      .pipe(map((response) => this.parseDatesInArrayResponse(response)));
  }

  // ==================== Export ====================

  /**
   * Export audit logs to file
   *
   * @param params - Query parameters for filtering logs to export
   * @param format - Export format ('json' or 'csv')
   * @returns Observable of file blob
   *
   * @example
   * ```typescript
   * this.dataService.exportLogs({ action: 'ACCESS_DENIED' }, 'csv')
   *   .subscribe(blob => {
   *     const url = window.URL.createObjectURL(blob);
   *     const a = document.createElement('a');
   *     a.href = url;
   *     a.download = 'audit-logs.csv';
   *     a.click();
   *   });
   * ```
   */
  exportLogs(params: QueryAuditLogsDto, format: 'json' | 'csv'): Observable<Blob> {
    const httpParams = this.buildHttpParams(params).set('format', format);

    return this.http.get(`${this.apiUrl}/export/logs`, {
      params: httpParams,
      responseType: 'blob',
    });
  }

  /**
   * Export a security report to file
   *
   * @param reportId - Report identifier
   * @param format - Export format ('pdf' or 'csv')
   * @returns Observable of file blob
   *
   * @example
   * ```typescript
   * this.dataService.exportReport('daily-2024-01-15', 'pdf')
   *   .subscribe(blob => {
   *     const url = window.URL.createObjectURL(blob);
   *     window.open(url);
   *   });
   * ```
   */
  exportReport(reportId: string, format: 'pdf' | 'csv'): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export/reports/${reportId}`, {
      params: new HttpParams().set('format', format),
      responseType: 'blob',
    });
  }

  // ==================== Private Helper Methods ====================

  /**
   * Build HttpParams from query object
   * Removes undefined/null values and handles nested objects
   *
   * @private
   * @param params - Query parameters object
   * @returns HttpParams instance
   */
  private buildHttpParams(params?: Record<string, any>): HttpParams {
    let httpParams = new HttpParams();

    if (!params) {
      return httpParams;
    }

    Object.keys(params).forEach((key) => {
      const value = params[key];

      if (value !== undefined && value !== null) {
        httpParams = httpParams.set(key, String(value));
      }
    });

    return httpParams;
  }

  /**
   * Parse date strings in audit event to Date objects
   *
   * @private
   * @param event - Event with date strings
   * @returns Event with Date objects
   */
  private parseDatesInEvent(event: SecurityAuditEvent): SecurityAuditEvent {
    return {
      ...event,
      createdAt: new Date(event.createdAt),
    };
  }

  /**
   * Parse date strings in alert to Date objects
   *
   * @private
   * @param alert - Alert with date strings
   * @returns Alert with Date objects
   */
  private parseDatesInAlert(alert: SuspiciousActivityAlert): SuspiciousActivityAlert {
    return {
      ...alert,
      firstEventAt: new Date(alert.firstEventAt),
      lastEventAt: new Date(alert.lastEventAt),
      resolvedAt: alert.resolvedAt ? new Date(alert.resolvedAt) : undefined,
    };
  }

  /**
   * Parse dates in paginated response
   *
   * @private
   * @param response - Paginated response
   * @returns Response with parsed dates
   */
  private parseDatesInPaginatedResponse(
    response: PaginatedResponse<SecurityAuditEvent>
  ): PaginatedResponse<SecurityAuditEvent> {
    return {
      ...response,
      data: response.data.map((event) => this.parseDatesInEvent(event)),
    };
  }

  /**
   * Parse dates in API response
   *
   * @private
   * @param response - API response
   * @returns Response with parsed dates
   */
  private parseDatesInApiResponse<T>(response: ApiResponse<T>): ApiResponse<T> {
    return {
      ...response,
      timestamp: new Date(response.timestamp),
    };
  }

  /**
   * Parse dates in API response containing array of events
   *
   * @private
   * @param response - API response with event array
   * @returns Response with parsed dates
   */
  private parseDatesInArrayResponse(
    response: ApiResponse<SecurityAuditEvent[]>
  ): ApiResponse<SecurityAuditEvent[]> {
    return {
      ...response,
      data: response.data.map((event) => this.parseDatesInEvent(event)),
      timestamp: new Date(response.timestamp),
    };
  }
}
