/**
 * @file customer-segments.component.ts
 * @description Customer Segments component for detailed segment analysis.
 *              Displays customer distribution across value tiers with drill-down capabilities.
 * @module AdminDashboard/Analytics/CLV
 */

import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  computed,
  OnInit,
  DestroyRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';

import { BiAnalyticsService } from '../../../../services/bi-analytics.service';
import {
  BiChartWrapperComponent,
  BiSegmentChartComponent,
  BiKpiCardComponent,
  SegmentData
} from '../../../../shared/components';
import { CustomerSegment, CustomerSegmentTier, BIDateRangeQuery } from '../../../../interfaces';

/**
 * Segment display configuration
 */
interface SegmentConfig {
  /** Tier identifier */
  tier: CustomerSegmentTier;
  /** Display name */
  name: string;
  /** Description */
  description: string;
  /** Display color */
  color: string;
  /** Icon name */
  icon: string;
}

/**
 * Customer Segments Component
 * @description Detailed segment analysis featuring:
 *              - Segment distribution visualization
 *              - Individual segment cards with metrics
 *              - Segment comparison charts
 *              - Customer movement between segments
 *
 * @example
 * ```html
 * <app-customer-segments />
 * ```
 */
@Component({
  standalone: true,
  selector: 'app-customer-segments',
  templateUrl: './customer-segments.component.html',
  styleUrls: ['./customer-segments.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    BiChartWrapperComponent,
    BiSegmentChartComponent,
    BiKpiCardComponent
  ]
})
export class CustomerSegmentsComponent implements OnInit {
  // =========================================================================
  // Dependencies
  // =========================================================================

  private readonly biAnalyticsService = inject(BiAnalyticsService);
  private readonly destroyRef = inject(DestroyRef);

  // =========================================================================
  // Configuration
  // =========================================================================

  /**
   * Segment display configurations
   */
  readonly segmentConfigs: SegmentConfig[] = [
    {
      tier: 'platinum',
      name: 'Platinum',
      description: 'Top 5% customers by lifetime value',
      color: '#6366f1',
      icon: 'diamond'
    },
    {
      tier: 'gold',
      name: 'Gold',
      description: 'Top 20% customers with high engagement',
      color: '#f59e0b',
      icon: 'star'
    },
    {
      tier: 'silver',
      name: 'Silver',
      description: 'Regular customers with moderate value',
      color: '#94a3b8',
      icon: 'workspace_premium'
    },
    {
      tier: 'bronze',
      name: 'Bronze',
      description: 'Occasional customers or new signups',
      color: '#d97706',
      icon: 'military_tech'
    },
    {
      tier: 'at_risk',
      name: 'At Risk',
      description: 'Customers showing declining activity',
      color: '#ef4444',
      icon: 'warning'
    },
    {
      tier: 'churned',
      name: 'Churned',
      description: 'Inactive customers (no activity 90+ days)',
      color: '#6b7280',
      icon: 'person_off'
    }
  ];

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
   * Customer segments data
   */
  readonly segments = signal<CustomerSegment[]>([]);

  /**
   * Selected segment for detail view
   */
  readonly selectedSegment = signal<CustomerSegmentTier | null>(null);

  // =========================================================================
  // Computed Properties
  // =========================================================================

  /**
   * Total customers across all segments
   */
  readonly totalCustomers = computed(() => {
    return this.segments().reduce((sum, s) => sum + s.customerCount, 0);
  });

  /**
   * Total revenue across all segments
   */
  readonly totalRevenue = computed(() => {
    return this.segments().reduce((sum, s) => sum + s.totalRevenue, 0);
  });

  /**
   * Segments formatted for pie chart
   */
  readonly pieChartData = computed<SegmentData[]>(() => {
    const segs = this.segments();
    const total = this.totalCustomers();

    return segs.map(segment => {
      const config = this.getSegmentConfig(segment.tier);
      return {
        id: segment.tier,
        label: config?.name || segment.tier,
        value: segment.customerCount,
        percentage: total > 0 ? (segment.customerCount / total) * 100 : 0,
        color: config?.color || '#9ca3af',
        metadata: {
          avgCLV: segment.avgCLV,
          totalRevenue: segment.totalRevenue,
          retentionRate: segment.retentionRate
        }
      };
    });
  });

  /**
   * Segments formatted for revenue chart
   */
  readonly revenueChartData = computed<SegmentData[]>(() => {
    const segs = this.segments();
    const total = this.totalRevenue();

    return segs.map(segment => {
      const config = this.getSegmentConfig(segment.tier);
      return {
        id: segment.tier,
        label: config?.name || segment.tier,
        value: segment.totalRevenue,
        percentage: total > 0 ? (segment.totalRevenue / total) * 100 : 0,
        color: config?.color || '#9ca3af'
      };
    });
  });

  /**
   * Segments sorted by customer count
   */
  readonly sortedByCount = computed(() => {
    return [...this.segments()].sort((a, b) => b.customerCount - a.customerCount);
  });

  /**
   * Segments sorted by revenue
   */
  readonly sortedByRevenue = computed(() => {
    return [...this.segments()].sort((a, b) => b.totalRevenue - a.totalRevenue);
  });

  /**
   * Selected segment details
   */
  readonly selectedSegmentData = computed(() => {
    const tier = this.selectedSegment();
    if (!tier) return null;
    return this.segments().find(s => s.tier === tier) || null;
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
   * Load segments data
   */
  private loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    const query: BIDateRangeQuery = {
      startDate: this.getDefaultStartDate(),
      endDate: this.getDefaultEndDate()
    };

    this.biAnalyticsService.getCustomerSegments(query)
      .pipe(
        catchError(err => {
          console.error('Error loading segments:', err);
          this.error.set('Failed to load customer segments.');
          return of([]);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (data) => {
          this.segments.set(data);
          this.loading.set(false);
        },
        error: () => {
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
   * Handle segment selection
   */
  onSegmentClick(segment: SegmentData): void {
    const tier = segment.id as CustomerSegmentTier;
    if (this.selectedSegment() === tier) {
      this.selectedSegment.set(null);
    } else {
      this.selectedSegment.set(tier);
    }
  }

  /**
   * Handle chart export
   */
  onChartExport(format: string): void {
    console.log('Export segments chart as:', format);
  }

  /**
   * Close segment detail
   */
  closeSegmentDetail(): void {
    this.selectedSegment.set(null);
  }

  // =========================================================================
  // Helper Methods
  // =========================================================================

  /**
   * Get segment configuration by tier
   */
  getSegmentConfig(tier: CustomerSegmentTier): SegmentConfig | undefined {
    return this.segmentConfigs.find(c => c.tier === tier);
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
   * Format percentage
   */
  formatPercent(value: number): string {
    return `${(value * 100).toFixed(1)}%`;
  }

  /**
   * Get default start date (90 days ago for segments)
   */
  private getDefaultStartDate(): string {
    const date = new Date();
    date.setDate(date.getDate() - 90);
    return date.toISOString().split('T')[0];
  }

  /**
   * Get default end date
   */
  private getDefaultEndDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Track segment cards
   */
  trackBySegment(index: number, segment: CustomerSegment): string {
    return segment.tier;
  }
}
