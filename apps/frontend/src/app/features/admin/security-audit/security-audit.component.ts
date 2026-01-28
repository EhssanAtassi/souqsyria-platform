/**
 * Security Audit Component
 * 
 * @description Main container component for security audit dashboard.
 * Orchestrates all child components and handles security monitoring interactions.
 * 
 * Features:
 * - Real-time security metrics dashboard
 * - Audit log viewing with advanced filtering
 * - Failed access attempts monitoring
 * - Suspicious activity alert management
 * - Live mode for real-time event streaming
 * - Export functionality (JSON, CSV)
 * 
 * Architecture:
 * - Smart container component (handles logic and state)
 * - Uses Akita for state management
 * - Delegates UI to presentational components
 * - OnPush change detection for performance
 * 
 * @example
 * ```html
 * <app-security-audit></app-security-audit>
 * ```
 * 
 * @swagger
 * components:
 *   Security Audit Dashboard:
 *     description: Comprehensive security monitoring and audit logging interface
 *     properties:
 *       liveMode:
 *         type: boolean
 *         description: Real-time event streaming enabled/disabled
 *       selectedTab:
 *         type: number
 *         description: Currently active tab index (0=Audit Log, 1=Failed Attempts, 2=Suspicious Activity)
 */

import {
  Component,
  OnInit,
  DestroyRef,
  inject,
  ChangeDetectionStrategy,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';

// Material imports
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressBarModule } from '@angular/material/progress-bar';

// State management
import { SecurityAuditStore } from './state/security-audit.store';
import { SecurityAuditQuery } from './state/security-audit.query';
import { SecurityAuditService } from './state/security-audit.service';

// Child components
import { SecurityMetricsDashboardComponent } from './components/security-metrics-dashboard/security-metrics-dashboard.component';
import { AuditLogViewComponent } from './views/audit-log-view/audit-log-view.component';
import { FailedAttemptsViewComponent } from './views/failed-attempts-view/failed-attempts-view.component';
import { SuspiciousActivityViewComponent } from './views/suspicious-activity-view/suspicious-activity-view.component';
import { LiveIndicatorComponent } from './components/live-indicator.component';

@Component({
  selector: 'app-security-audit',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatToolbarModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatMenuModule,
    MatBadgeModule,
    MatProgressBarModule,
    SecurityMetricsDashboardComponent,
    AuditLogViewComponent,
    FailedAttemptsViewComponent,
    SuspiciousActivityViewComponent,
    LiveIndicatorComponent,
  ],
  templateUrl: './security-audit.component.html',
  styleUrls: ['./security-audit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SecurityAuditStore, SecurityAuditQuery, SecurityAuditService],
})
export class SecurityAuditComponent implements OnInit {
  /** Inject dependencies */
  private readonly service = inject(SecurityAuditService);
  private readonly query = inject(SecurityAuditQuery);
  private readonly store = inject(SecurityAuditStore);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Observable streams from query
   * All streams use async pipe in template for automatic subscription management
   */
  readonly metrics$ = this.query.metrics$;
  readonly loading$ = this.query.loading$;
  readonly liveMode$ = this.query.liveMode$;
  readonly unresolvedAlertCount$ = this.query.unresolvedAlertCount$;

  /**
   * UI state signals
   */
  selectedTabIndex = signal(0);
  liveMode = signal(false);

  /**
   * Initialize component
   * 
   * @description Fetches initial security audit data on component load.
   * Sets up live mode subscription if enabled.
   */
  ngOnInit(): void {
    this.loadInitialData();
    this.setupLiveModeSubscription();
  }

  /**
   * Load initial security audit data
   * 
   * @description Fetches metrics, events, and alerts on component initialization.
   * 
   * @private
   */
  private loadInitialData(): void {
    // Load metrics
    this.service
      .loadMetrics()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();

    // Load initial events
    this.service
      .loadEvents()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();

    // Load suspicious activity alerts
    this.service
      .loadSuspiciousActivity()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  /**
   * Set up subscription for live mode changes
   * 
   * @description Syncs live mode signal with store state.
   * 
   * @private
   */
  private setupLiveModeSubscription(): void {
    this.liveMode$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((enabled) => {
        this.liveMode.set(enabled);
      });
  }

  /**
   * Handle live mode toggle
   * 
   * @description Enables or disables real-time event streaming.
   * When enabled, polls for new events every 5 seconds.
   * 
   * @example
   * ```html
   * <mat-slide-toggle [(ngModel)]="liveMode" (change)="onLiveModeToggle()">
   * ```
   */
  onLiveModeToggle(): void {
    const enabled = this.liveMode();

    if (enabled) {
      this.service
        .enableLiveMode()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe();
    } else {
      this.service
        .disableLiveMode()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe();
    }
  }

  /**
   * Refresh all security audit data
   * 
   * @description Manually triggers a refresh of metrics, events, and alerts.
   * Useful when live mode is disabled or user wants to force update.
   * 
   * @example
   * ```html
   * <button mat-raised-button (click)="refresh()">Refresh</button>
   * ```
   */
  refresh(): void {
    this.service
      .refresh()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  /**
   * Export security audit data
   * 
   * @description Exports current filtered audit events to specified format.
   * Supports JSON and CSV formats.
   * 
   * @param format - Export format ('json' or 'csv')
   * 
   * @example
   * ```html
   * <button mat-menu-item (click)="export('json')">Export JSON</button>
   * ```
   */
  export(format: 'json' | 'csv'): void {
    this.service
      .exportEvents(format)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          // Create download link
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `security-audit-${new Date().toISOString()}.${format}`;
          link.click();
          URL.revokeObjectURL(url);
        },
        error: (error) => {
          console.error('Export failed:', error);
        },
      });
  }

  /**
   * Handle tab change
   * 
   * @description Updates selected tab index and loads tab-specific data if needed.
   * 
   * @param index - New tab index
   * 
   * @example
   * ```html
   * <mat-tab-group (selectedIndexChange)="onTabChange($event)">
   * ```
   */
  onTabChange(index: number): void {
    this.selectedTabIndex.set(index);

    // Load data specific to selected tab
    switch (index) {
      case 0: // Audit Log
        // Data already loaded in ngOnInit
        break;
      case 1: // Failed Attempts
        // Filter for failed events is handled in the view component
        break;
      case 2: // Suspicious Activity
        // Alerts already loaded in ngOnInit
        break;
    }
  }
}
