/**
 * @file clv-overview.component.ts
 * @description CLV Overview component displaying key metrics, trends, and segment distribution.
 *              Provides a comprehensive summary of Customer Lifetime Value analytics.
 * @module AdminDashboard/Analytics/CLV
 */

import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  computed,
  OnInit,
  OnDestroy,
  DestroyRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, catchError, of } from 'rxjs';

import { BiAnalyticsService } from '../../../../services/bi-analytics.service';
import {
  BiKpiCardComponent,
  BiChartWrapperComponent,
  BiSegmentChartComponent,
  SegmentData
} from '../../../../shared/components';
import {
  CLVSummary,
  CustomerSegment,
  CLVTrendPoint,
  BIDateRangeQuery
} from '../../../../interfaces';

/**
 * CLV Overview Component
 * @description Main overview dashboard for CLV analytics featuring:
 *              - KPI cards for key CLV metrics (average CLV, total value, growth)
 *              - Trend chart showing CLV over time
 *              - Segment distribution donut chart
 *              - Quick insights and recommendations
 *
 * @example
 * ```html
 * <app-clv-overview />
 * ```
 */
@Component({
  standalone: true,
  selector: 'app-clv-overview',
  templateUrl: './clv-overview.component.html',
  styleUrls: ['./clv-overview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    BiKpiCardComponent,
    BiChartWrapperComponent,
    BiSegmentChartComponent
  ]
})
export class ClvOverviewComponent implements OnInit {
  // =========================================================================
  // Dependencies
  // =========================================================================

  private readonly biAnalyticsService = inject(BiAnalyticsService);
  private readonly destroyRef = inject(DestroyRef);

  // =========================================================================
  // State Signals
  // =========================================================================

  /**
   * Loading state
   */
  readonly loading = signal<boolean>(true);

  /**
   * Error state
   */
  readonly error = signal<string | null>(null);

  /**
   * CLV summary metrics
   */
  readonly clvSummary = signal<CLVSummary | null>(null);

  /**
   * Customer segments data
   */
  readonly segments = signal<CustomerSegment[]>([]);

  /**
   * CLV trend data points
   */
  readonly trendData = signal<CLVTrendPoint[]>([]);

  // =========================================================================
  // Computed Properties
  // =========================================================================

  /**
   * Segments formatted for chart display
   */
  readonly segmentChartData = computed<SegmentData[]>(() => {
    const segs = this.segments();
    const total = segs.reduce((sum, s) => sum + s.customerCount, 0);

    return segs.map(segment => ({
      id: segment.tier,
      label: this.formatSegmentLabel(segment.tier),
      value: segment.customerCount,
      percentage: total > 0 ? (segment.customerCount / total) * 100 : 0,
      color: this.getSegmentColor(segment.tier),
      metadata: {
        avgCLV: segment.avgCLV,
        totalRevenue: segment.totalRevenue
      }
    }));
  });

  /**
   * Sparkline data for average CLV
   */
  readonly avgCLVSparkline = computed(() => {
    return this.trendData().map((point, index) => ({
      value: point.averageCLV,
      timestamp: point.date
    }));
  });

  /**
   * Sparkline data for customer count
   */
  readonly customerCountSparkline = computed(() => {
    return this.trendData().map((point, index) => ({
      value: point.customerCount,
      timestamp: point.date
    }));
  });

  /**
   * Quick insights based on data
   */
  readonly insights = computed(() => {
    const summary = this.clvSummary();
    const segs = this.segments();

    if (!summary || segs.length === 0) return [];

    const insights: Array<{ type: 'success' | 'warning' | 'info'; message: string }> = [];

    // Growth insight
    if (summary.clvGrowthRate > 10) {
      insights.push({
        type: 'success',
        message: `CLV is growing at ${summary.clvGrowthRate.toFixed(1)}% - excellent customer retention!`
      });
    } else if (summary.clvGrowthRate < 0) {
      insights.push({
        type: 'warning',
        message: `CLV declined by ${Math.abs(summary.clvGrowthRate).toFixed(1)}% - review retention strategies.`
      });
    }

    // High-value segment insight
    const highValueSeg = segs.find(s => s.tier === 'platinum' || s.tier === 'gold');
    if (highValueSeg && highValueSeg.customerCount > 0) {
      const hvPercent = (highValueSeg.revenueShare * 100).toFixed(0);
      insights.push({
        type: 'info',
        message: `Top-tier customers generate ${hvPercent}% of total revenue.`
      });
    }

    return insights;
  });

  // =========================================================================
  // Lifecycle Hooks
  // =========================================================================

  ngOnInit(): void {
    this.loadData();
  }

  // =========================================================================
  // Data Loading
  // =========================================================================

  /**
   * Load all CLV overview data
   */
  private loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    const query: BIDateRangeQuery = {
      startDate: this.getDefaultStartDate(),
      endDate: this.getDefaultEndDate()
    };

    forkJoin({
      summary: this.biAnalyticsService.getCLVSummary(query).pipe(
        catchError(err => {
          console.error('Error loading CLV summary:', err);
          return of(null);
        })
      ),
      segments: this.biAnalyticsService.getCustomerSegments(query).pipe(
        catchError(err => {
          console.error('Error loading segments:', err);
          return of([]);
        })
      )
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          if (data.summary) {
            this.clvSummary.set(data.summary);
            // Extract trend data from summary if available
            if (data.summary.trendData) {
              this.trendData.set(data.summary.trendData);
            }
          }
          this.segments.set(data.segments);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error loading CLV overview:', err);
          this.error.set('Failed to load CLV analytics data.');
          this.loading.set(false);
        }
      });
  }

  /**
   * Refresh data
   */
  onRefresh(): void {
    this.loadData();
  }

  // =========================================================================
  // Event Handlers
  // =========================================================================

  /**
   * Handle segment click for drill-down
   */
  onSegmentClick(segment: SegmentData): void {
    console.log('Segment clicked:', segment);
    // Navigate to segment detail or show modal
  }

  /**
   * Handle chart export
   */
  onChartExport(format: string): void {
    console.log('Export chart as:', format);
  }

  // =========================================================================
  // Helper Methods
  // =========================================================================

  /**
   * Format segment tier label
   */
  private formatSegmentLabel(tier: string): string {
    const labels: Record<string, string> = {
      platinum: 'Platinum',
      gold: 'Gold',
      silver: 'Silver',
      bronze: 'Bronze',
      at_risk: 'At Risk',
      churned: 'Churned'
    };
    return labels[tier] || tier;
  }

  /**
   * Get color for segment tier
   */
  private getSegmentColor(tier: string): string {
    const colors: Record<string, string> = {
      platinum: '#6366f1',
      gold: '#f59e0b',
      silver: '#94a3b8',
      bronze: '#d97706',
      at_risk: '#ef4444',
      churned: '#6b7280'
    };
    return colors[tier] || '#9ca3af';
  }

  /**
   * Format currency value
   */
  formatCurrency(value: number): string {
    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(1)}M SYP`;
    }
    if (value >= 1_000) {
      return `${(value / 1_000).toFixed(1)}K SYP`;
    }
    return `${value.toLocaleString()} SYP`;
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
}
