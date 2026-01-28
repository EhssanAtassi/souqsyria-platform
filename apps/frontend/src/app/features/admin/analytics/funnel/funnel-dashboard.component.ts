/**
 * @file funnel-dashboard.component.ts
 * @description Main Conversion Funnel Dashboard container component.
 *              Orchestrates funnel analytics views with navigation and shared state.
 * @module AdminDashboard/Analytics/Funnel
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
import { FunnelAnalyticsQuery, TimeGranularity, DeviceType } from '../../interfaces';

/**
 * Navigation tab configuration
 */
interface NavTab {
  id: string;
  label: string;
  path: string;
  icon: string;
  description: string;
}

/**
 * Funnel Dashboard Component
 * @description Main container for Conversion Funnel analytics featuring:
 *              - Tab-based navigation between funnel views
 *              - Shared date range and device filter
 *              - State management via Angular Signals
 *              - Responsive layout with RTL support
 */
@Component({
  standalone: true,
  selector: 'app-funnel-dashboard',
  templateUrl: './funnel-dashboard.component.html',
  styleUrls: ['./funnel-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    BiDateRangePickerComponent
  ]
})
export class FunnelDashboardComponent implements OnInit, OnDestroy {
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
   * Navigation tabs for funnel analytics
   */
  readonly navTabs: NavTab[] = [
    {
      id: 'overview',
      label: 'Overview',
      path: './overview',
      icon: 'filter_alt',
      description: 'Funnel performance summary'
    },
    {
      id: 'stages',
      label: 'Stages',
      path: './stages',
      icon: 'stacked_bar_chart',
      description: 'Stage-by-stage conversion analysis'
    },
    {
      id: 'devices',
      label: 'Devices',
      path: './devices',
      icon: 'devices',
      description: 'Device-specific funnel breakdown'
    },
    {
      id: 'dropoffs',
      label: 'Drop-offs',
      path: './dropoffs',
      icon: 'trending_down',
      description: 'Drop-off point analysis'
    }
  ];

  /**
   * Device filter options
   */
  readonly deviceOptions: Array<{ value: DeviceType | 'all'; label: string }> = [
    { value: 'all', label: 'All Devices' },
    { value: 'desktop', label: 'Desktop' },
    { value: 'mobile', label: 'Mobile' },
    { value: 'tablet', label: 'Tablet' }
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
   * Selected device filter
   */
  readonly selectedDevice = signal<DeviceType | 'all'>('all');

  /**
   * Time granularity
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
  readonly currentQuery = computed<FunnelAnalyticsQuery>(() => {
    const device = this.selectedDevice();
    return {
      startDate: this.dateRange().startDate,
      endDate: this.dateRange().endDate,
      granularity: this.granularity(),
      device: device === 'all' ? undefined : device,
      includeExitPages: true
    };
  });

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
   */
  onDateRangeChange(event: DateRange & { preset: string }): void {
    this.dateRange.set({
      startDate: event.startDate,
      endDate: event.endDate
    });
    this.currentPreset.set(event.preset);
  }

  /**
   * Handle device filter change
   */
  onDeviceChange(device: DeviceType | 'all'): void {
    this.selectedDevice.set(device);
  }

  /**
   * Handle granularity selection
   */
  onGranularityChange(granularity: TimeGranularity): void {
    this.granularity.set(granularity);
  }

  /**
   * Handle export action
   */
  onExport(format: 'csv' | 'xlsx' | 'pdf'): void {
    this.isExporting.set(true);

    this.biAnalyticsService.exportFunnelReport(format, this.currentQuery())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
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
    this.isLoading.set(true);
    const current = this.dateRange();
    this.dateRange.set({ ...current });
    setTimeout(() => this.isLoading.set(false), 100);
  }

  // =========================================================================
  // Private Methods
  // =========================================================================

  /**
   * Setup router event subscription
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
   * Get default end date
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
