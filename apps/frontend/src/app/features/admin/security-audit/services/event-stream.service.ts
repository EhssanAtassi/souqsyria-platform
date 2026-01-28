/**
 * Event Stream Service
 * Manages real-time polling for security audit events
 * Implements adaptive polling with exponential backoff and error handling
 *
 * @module EventStreamService
 */

import { Injectable, OnDestroy } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  Subject,
  timer,
  EMPTY,
  throwError,
} from 'rxjs';
import {
  switchMap,
  catchError,
  tap,
  takeUntil,
  retry,
  finalize,
} from 'rxjs/operators';

import { SecurityAuditDataService } from './security-audit-data.service';
import {
  SecurityAuditEvent,
  PollConfig,
  DEFAULT_POLL_CONFIG,
  calculateNextInterval,
  shouldDisablePolling,
} from '../models';

/**
 * Service for managing real-time event streaming via polling
 * Automatically adjusts polling interval based on activity and errors
 *
 * @class EventStreamService
 * @implements {OnDestroy}
 */
@Injectable()
export class EventStreamService implements OnDestroy {
  /** Current polling configuration */
  private pollConfig: PollConfig = { ...DEFAULT_POLL_CONFIG };

  /** Current polling interval in milliseconds */
  private pollInterval$ = new BehaviorSubject<number>(this.pollConfig.initialInterval);

  /** Whether polling is currently enabled */
  private enabled$ = new BehaviorSubject<boolean>(false);

  /** Timestamp of the last event received (used to fetch only new events) */
  private lastEventTimestamp: Date | null = null;

  /** Number of consecutive polling errors */
  private consecutiveErrors = 0;

  /** Subject for cleanup on destroy */
  private destroy$ = new Subject<void>();

  /** Subject for stopping the current polling loop */
  private stopPolling$ = new Subject<void>();

  /** Subject for emitting new events */
  private newEvents$ = new Subject<SecurityAuditEvent[]>();

  /** Subject for emitting errors */
  private errors$ = new Subject<string>();

  constructor(private readonly dataService: SecurityAuditDataService) {}

  /**
   * Start polling for new events
   * Creates an adaptive polling loop that adjusts interval based on activity
   *
   * @returns Observable that emits arrays of new events
   *
   * @example
   * ```typescript
   * this.eventStream.startPolling().subscribe(events => {
   *   console.log('New events:', events);
   * });
   * ```
   */
  startPolling(): Observable<SecurityAuditEvent[]> {
    // If already enabled, return existing observable
    if (this.enabled$.value) {
      return this.newEvents$.asObservable();
    }

    console.log('[EventStream] Starting polling');
    this.enabled$.next(true);
    this.consecutiveErrors = 0;
    this.stopPolling$ = new Subject<void>();

    // Create polling loop
    this.pollInterval$
      .pipe(
        switchMap((interval) => {
          console.log(`[EventStream] Polling with interval: ${interval}ms`);
          return timer(0, interval).pipe(
            switchMap(() => this.pollForEvents()),
            takeUntil(this.stopPolling$)
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();

    return this.newEvents$.asObservable();
  }

  /**
   * Stop the polling loop
   *
   * @example
   * ```typescript
   * this.eventStream.stopPolling();
   * ```
   */
  stopPolling(): void {
    console.log('[EventStream] Stopping polling');
    this.enabled$.next(false);
    this.stopPolling$.next();
    this.resetInterval();
    this.lastEventTimestamp = null;
    this.consecutiveErrors = 0;
  }

  /**
   * Enable or disable polling
   *
   * @param enabled - Whether to enable polling
   *
   * @example
   * ```typescript
   * this.eventStream.setEnabled(true);
   * ```
   */
  setEnabled(enabled: boolean): void {
    if (enabled && !this.enabled$.value) {
      this.startPolling();
    } else if (!enabled && this.enabled$.value) {
      this.stopPolling();
    }
  }

  /**
   * Check if polling is currently enabled
   *
   * @returns True if polling is active
   */
  isEnabled(): boolean {
    return this.enabled$.value;
  }

  /**
   * Get observable of polling enabled state
   *
   * @returns Observable of enabled state
   */
  getEnabledState(): Observable<boolean> {
    return this.enabled$.asObservable();
  }

  /**
   * Get observable of polling interval changes
   *
   * @returns Observable of current interval in milliseconds
   */
  getIntervalState(): Observable<number> {
    return this.pollInterval$.asObservable();
  }

  /**
   * Get observable of errors
   *
   * @returns Observable of error messages
   */
  getErrors(): Observable<string> {
    return this.errors$.asObservable();
  }

  /**
   * Reset polling interval to initial value
   *
   * @example
   * ```typescript
   * this.eventStream.resetInterval();
   * ```
   */
  resetInterval(): void {
    this.pollInterval$.next(this.pollConfig.initialInterval);
    console.log('[EventStream] Reset interval to initial value');
  }

  /**
   * Update polling configuration
   *
   * @param config - Partial configuration to merge
   *
   * @example
   * ```typescript
   * this.eventStream.updateConfig({
   *   initialInterval: 3000,
   *   maxInterval: 20000
   * });
   * ```
   */
  updateConfig(config: Partial<PollConfig>): void {
    this.pollConfig = { ...this.pollConfig, ...config };
    console.log('[EventStream] Updated config:', this.pollConfig);
  }

  /**
   * Get current polling statistics
   *
   * @returns Statistics object
   */
  getStatistics(): {
    enabled: boolean;
    currentInterval: number;
    consecutiveErrors: number;
    lastEventTimestamp: Date | null;
  } {
    return {
      enabled: this.enabled$.value,
      currentInterval: this.pollInterval$.value,
      consecutiveErrors: this.consecutiveErrors,
      lastEventTimestamp: this.lastEventTimestamp,
    };
  }

  /**
   * Perform a single poll for new events
   * Handles errors and adjusts polling interval
   *
   * @private
   * @returns Observable that completes after poll
   */
  private pollForEvents(): Observable<void> {
    console.log('[EventStream] Polling for events since:', this.lastEventTimestamp);

    return this.dataService.getLatestEvents(50, this.lastEventTimestamp || undefined).pipe(
      tap((response) => {
        const newEvents = response.data;
        console.log(`[EventStream] Received ${newEvents.length} new events`);

        // Update last event timestamp
        if (newEvents.length > 0) {
          const latestEvent = newEvents.reduce((latest, event) =>
            event.createdAt > latest.createdAt ? event : latest
          );
          this.lastEventTimestamp = latestEvent.createdAt;
        }

        // Emit new events
        if (newEvents.length > 0) {
          this.newEvents$.next(newEvents);
        }

        // Adjust interval based on activity
        this.adjustInterval(newEvents.length > 0);

        // Reset error count on success
        if (this.consecutiveErrors > 0) {
          console.log('[EventStream] Polling recovered, resetting error count');
          this.consecutiveErrors = 0;
        }
      }),
      catchError((error) => this.handleError(error)),
      finalize(() => {
        // Check if we should disable polling due to errors
        if (shouldDisablePolling(this.consecutiveErrors, this.pollConfig)) {
          console.error('[EventStream] Too many errors, disabling polling');
          this.stopPolling();
          this.errors$.next('Polling disabled due to repeated errors');
        }
      }),
      // Convert to void observable
      switchMap(() => EMPTY)
    );
  }

  /**
   * Adjust polling interval based on activity
   * More activity = faster polling, less activity = slower polling
   *
   * @private
   * @param hasNewEvents - Whether new events were received
   */
  private adjustInterval(hasNewEvents: boolean): void {
    const currentInterval = this.pollInterval$.value;
    const nextInterval = calculateNextInterval(
      currentInterval,
      hasNewEvents,
      this.pollConfig
    );

    if (nextInterval !== currentInterval) {
      console.log(
        `[EventStream] Adjusting interval: ${currentInterval}ms -> ${nextInterval}ms (hasNewEvents: ${hasNewEvents})`
      );
      this.pollInterval$.next(nextInterval);
    }
  }

  /**
   * Handle polling errors with exponential backoff
   *
   * @private
   * @param error - Error that occurred
   * @returns Observable that throws error
   */
  private handleError(error: any): Observable<never> {
    this.consecutiveErrors++;
    console.error(`[EventStream] Polling error (${this.consecutiveErrors}):`, error);

    // Emit error to subscribers
    const errorMessage =
      error?.error?.message || error?.message || 'Failed to fetch new events';
    this.errors$.next(errorMessage);

    // Apply exponential backoff
    const currentInterval = this.pollInterval$.value;
    const backoffInterval = Math.min(
      currentInterval * this.pollConfig.backoffMultiplier,
      this.pollConfig.maxInterval
    );

    if (backoffInterval !== currentInterval) {
      console.log(
        `[EventStream] Applying backoff: ${currentInterval}ms -> ${backoffInterval}ms`
      );
      this.pollInterval$.next(backoffInterval);
    }

    // Don't throw error - let polling continue
    return EMPTY;
  }

  /**
   * Cleanup on destroy
   */
  ngOnDestroy(): void {
    console.log('[EventStream] Service destroyed, cleaning up');
    this.destroy$.next();
    this.destroy$.complete();
    this.stopPolling$.complete();
    this.newEvents$.complete();
    this.errors$.complete();
    this.enabled$.complete();
    this.pollInterval$.complete();
  }
}
