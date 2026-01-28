/**
 * @file clv-dashboard.component.ts
 * @description Main CLV Analytics Dashboard container component.
 *              Orchestrates CLV analytics views with navigation tabs and shared state.
 * @module AdminDashboard/Analytics/CLV
 */

import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  computed,
  OnInit,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { Subject, filter, takeUntil } from 'rxjs';

import { BiAnalyticsService } from '../../services/bi-analytics.service';
import { BiDateRangePickerComponent, DateRange } from '../../shared/components';
import { CLVAnalyticsQuery, TimeGranularity } from '../../interfaces';

/**
 * Navigation tab configuration
 */
interface NavTab {
  /** Tab identifier */
  id: string;
  /** Display label */
  label: string;
  /** Router link path */
  path: string;
  /** Material icon name */
  icon: string;
  /** Tab description tooltip */
  description: string;
}

/**
 * CLV Dashboard Component
 * @description Main container for CLV analytics featuring:
 *              - Tab-based navigation between CLV views
 *              - Shared date range picker for all child components
 *              - State management via Angular Signals
 *              - Responsive layout with RTL support
 *
 * @example
 * ```html
 * <!-- Used via routing -->
 * <router-outlet />
 * ```
 */
@Component({
  standalone: true,
  selector: 'app-clv-dashboard',
  templateUrl: './clv-dashboard.component.html',
  styleUrls: ['./clv-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    BiDateRangePickerComponent
  ]
})
export class ClvDashboardComponent implements OnInit, OnDestroy {
  // =========================================================================
  // Dependencies
  // =========================================================================

  private readonly router = inject(Router);
  private readonly biAnalyticsService = inject(BiAnalyticsService);
  private readonly destroy$ = new Subject<void>();

  // =========================================================================
  // Navigation Configuration
  // =========================================================================

  /**
   * Navigation tabs for CLV analytics
   */
  readonly navTabs: NavTab[] = [
    {
      id: 'overview',
      label: 'Overview',
      path: './overview',
      icon: 'dashboard',
      description: 'CLV summary metrics and trends'
    },
    {
      id: 'segments',
      label: 'Segments',
      path: './segments',
      icon: 'pie_chart',
      description: 'Customer segment breakdown by value tier'
    },
    {
      id: 'predictions',
      label: 'Predictions',
      path: './predictions',
      icon: 'trending_up',
      description: 'Future CLV predictions and forecasting'
    },
    {
      id: 'top-customers',
      label: 'Top Customers',
      path: './top-customers',
      icon: 'star',
      description: 'Highest value customer rankings'
    }
  ];

  // =========================================================================
  // State Signals
  // =========================================================================

  /**
   * Currently active tab ID
   */
  readonly activeTab = signal<string>('overview');

  /**
   * Selected date range for analytics
   */
  readonly dateRange = signal<DateRange>({
    startDate: this.getDefaultStartDate(),
    endDate: this.getDefaultEndDate()
  });

  /**
   * Current preset selection
   */
  readonly currentPreset = signal<string>('last_30_days');

  /**
   * Time granularity for trend data
   */
  readonly granularity = signal<TimeGranularity>('day');

  /**
   * Global loading state
   */
  readonly isLoading = signal<boolean>(false);

  /**
   * Export in progress
   */
  readonly isExporting = signal<boolean>(false);

  // =========================================================================
  // Computed Properties
  // =========================================================================

  /**
   * Current query parameters for API calls
   */
  readonly currentQuery = computed<CLVAnalyticsQuery>(() => ({
    startDate: this.dateRange().startDate,
    endDate: this.dateRange().endDate,
    granularity: this.granularity(),
    includePredictions: true,
    topCustomersLimit: 50
  }));

  /**
   * Formatted date range display text
   */
  readonly dateRangeText = computed(() => {
    const { startDate, endDate } = this.dateRange();
    const start = new Date(startDate);
    const end = new Date(endDate);
    const formatter = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    return `${formatter.format(start)} - ${formatter.format(end)}`;
  });

  // =========================================================================
  // Lifecycle Hooks
  // =========================================================================

  ngOnInit(): void {
    this.setupRouterSubscription();
    this.detectActiveTab();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // =========================================================================
  // Event Handlers
  // =========================================================================

  /**
   * Handle date range selection change
   * @param event - Date range change event with preset
   */
  onDateRangeChange(event: DateRange & { preset: string }): void {
    this.dateRange.set({
      startDate: event.startDate,
      endDate: event.endDate
    });
    this.currentPreset.set(event.preset);
  }

  /**
   * Handle granularity selection
   * @param granularity - Selected time granularity
   */
  onGranularityChange(granularity: TimeGranularity): void {
    this.granularity.set(granularity);
  }

  /**
   * Handle export action
   * @param format - Export format type
   */
  onExport(format: 'csv' | 'xlsx' | 'pdf'): void {
    this.isExporting.set(true);

    this.biAnalyticsService.exportCLVReport(format, this.currentQuery())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Trigger download
          window.open(response.downloadUrl, '_blank');
          this.isExporting.set(false);
        },
        error: (err) => {
          console.error('Export failed:', err);
          this.isExporting.set(false);
        }
      });
  }

  /**
   * Refresh dashboard data
   */
  onRefresh(): void {
    // Emit refresh event to child components via service or state
    this.isLoading.set(true);
    // Child components will react to dateRange signal changes
    const current = this.dateRange();
    this.dateRange.set({ ...current });
    setTimeout(() => this.isLoading.set(false), 100);
  }

  // =========================================================================
  // Private Methods
  // =========================================================================

  /**
   * Setup router event subscription to track active tab
   */
  private setupRouterSubscription(): void {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.detectActiveTab();
      });
  }

  /**
   * Detect active tab from current URL
   */
  private detectActiveTab(): void {
    const url = this.router.url;
    const tab = this.navTabs.find(t => url.includes(t.id));
    if (tab) {
      this.activeTab.set(tab.id);
    }
  }

  /**
   * Get default start date (30 days ago)
   */
  private getDefaultStartDate(): string {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  }

  /**
   * Get default end date (today)
   */
  private getDefaultEndDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Track navigation tabs
   */
  trackByTab(index: number, tab: NavTab): string {
    return tab.id;
  }
}
