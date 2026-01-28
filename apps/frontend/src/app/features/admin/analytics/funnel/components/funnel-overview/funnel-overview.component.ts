/**
 * @file funnel-overview.component.ts
 * @description Funnel Overview component displaying conversion metrics and visualization.
 *              Provides a comprehensive summary of the e-commerce conversion funnel.
 * @module AdminDashboard/Analytics/Funnel
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
import { forkJoin, catchError, of } from 'rxjs';

import { BiAnalyticsService } from '../../../../services/bi-analytics.service';
import {
  BiKpiCardComponent,
  BiChartWrapperComponent
} from '../../../../shared/components';
import {
  FunnelOverview,
  FunnelStage,
  FunnelAnalyticsQuery
} from '../../../../interfaces';

/**
 * Funnel stage display configuration
 */
interface StageDisplay {
  id: string;
  label: string;
  icon: string;
  color: string;
}

/**
 * Funnel Overview Component
 * @description Main overview for conversion funnel analytics featuring:
 *              - KPI cards for overall conversion metrics
 *              - Visual funnel chart showing stage progression
 *              - Stage-by-stage conversion rates
 *              - Quick insights and recommendations
 */
@Component({
  standalone: true,
  selector: 'app-funnel-overview',
  templateUrl: './funnel-overview.component.html',
  styleUrls: ['./funnel-overview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    BiKpiCardComponent,
    BiChartWrapperComponent
  ]
})
export class FunnelOverviewComponent implements OnInit {
  // =========================================================================
  // Dependencies
  // =========================================================================

  private readonly biAnalyticsService = inject(BiAnalyticsService);
  private readonly destroyRef = inject(DestroyRef);

  // =========================================================================
  // Configuration
  // =========================================================================

  /**
   * Funnel stage display configurations
   */
  readonly stageConfigs: StageDisplay[] = [
    { id: 'page_view', label: 'Page Views', icon: 'visibility', color: '#6366f1' },
    { id: 'product_view', label: 'Product Views', icon: 'inventory_2', color: '#8b5cf6' },
    { id: 'add_to_cart', label: 'Add to Cart', icon: 'add_shopping_cart', color: '#a855f7' },
    { id: 'checkout_initiated', label: 'Checkout Started', icon: 'shopping_cart_checkout', color: '#d946ef' },
    { id: 'checkout_completed', label: 'Checkout Completed', icon: 'credit_card', color: '#ec4899' },
    { id: 'purchase', label: 'Purchase', icon: 'check_circle', color: '#059669' }
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
   * Funnel overview data
   */
  readonly funnelOverview = signal<FunnelOverview | null>(null);

  /**
   * Funnel stages data
   */
  readonly stages = signal<FunnelStage[]>([]);

  // =========================================================================
  // Computed Properties
  // =========================================================================

  /**
   * Overall conversion rate (first stage to purchase)
   */
  readonly overallConversionRate = computed(() => {
    const stages = this.stages();
    if (stages.length < 2) return 0;

    const firstStage = stages[0];
    const lastStage = stages[stages.length - 1];

    if (firstStage.users === 0) return 0;
    return (lastStage.users / firstStage.users) * 100;
  });

  /**
   * Stages with calculated widths for funnel visualization
   */
  readonly stagesWithWidths = computed(() => {
    const stageData = this.stages();
    if (stageData.length === 0) return [];

    const maxUsers = Math.max(...stageData.map(s => s.users));

    return stageData.map(stage => {
      const config = this.getStageConfig(stage.stageId);
      const widthPercent = maxUsers > 0 ? (stage.users / maxUsers) * 100 : 0;

      return {
        ...stage,
        label: config?.label || stage.stageId,
        icon: config?.icon || 'circle',
        color: config?.color || '#9ca3af',
        widthPercent: Math.max(widthPercent, 10) // Minimum 10% width for visibility
      };
    });
  });

  /**
   * Quick insights based on funnel data
   */
  readonly insights = computed(() => {
    const overview = this.funnelOverview();
    const stages = this.stages();

    if (!overview || stages.length === 0) return [];

    const insights: Array<{ type: 'success' | 'warning' | 'info'; message: string }> = [];

    // Overall conversion insight
    const convRate = this.overallConversionRate();
    if (convRate >= 3) {
      insights.push({
        type: 'success',
        message: `Overall conversion rate of ${convRate.toFixed(1)}% is above industry average.`
      });
    } else if (convRate < 1) {
      insights.push({
        type: 'warning',
        message: `Conversion rate of ${convRate.toFixed(1)}% is below target. Focus on optimization.`
      });
    }

    // Find biggest drop-off
    let maxDrop = 0;
    let dropStage = '';
    for (let i = 1; i < stages.length; i++) {
      const drop = stages[i - 1].users - stages[i].users;
      const dropRate = stages[i - 1].users > 0 ? (drop / stages[i - 1].users) * 100 : 0;
      if (dropRate > maxDrop) {
        maxDrop = dropRate;
        dropStage = stages[i - 1].stageId;
      }
    }

    if (maxDrop > 50) {
      const config = this.getStageConfig(dropStage);
      insights.push({
        type: 'warning',
        message: `${maxDrop.toFixed(0)}% drop-off at "${config?.label}" stage requires attention.`
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
   * Load funnel overview data
   */
  private loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    const query: FunnelAnalyticsQuery = {
      startDate: this.getDefaultStartDate(),
      endDate: this.getDefaultEndDate(),
      includeExitPages: true
    };

    forkJoin({
      overview: this.biAnalyticsService.getFunnelOverview(query).pipe(
        catchError(err => {
          console.error('Error loading funnel overview:', err);
          return of(null);
        })
      ),
      analytics: this.biAnalyticsService.getFunnelAnalytics(query).pipe(
        catchError(err => {
          console.error('Error loading funnel analytics:', err);
          return of(null);
        })
      )
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          if (data.overview) {
            this.funnelOverview.set(data.overview);
          }
          if (data.analytics?.stages) {
            this.stages.set(data.analytics.stages);
          }
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error loading funnel data:', err);
          this.error.set('Failed to load funnel analytics.');
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
  // Helper Methods
  // =========================================================================

  /**
   * Get stage configuration
   */
  getStageConfig(stageId: string): StageDisplay | undefined {
    return this.stageConfigs.find(c => c.id === stageId);
  }

  /**
   * Format number with appropriate suffix
   */
  formatNumber(value: number): string {
    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(1)}M`;
    }
    if (value >= 1_000) {
      return `${(value / 1_000).toFixed(1)}K`;
    }
    return value.toLocaleString();
  }

  /**
   * Format percentage
   */
  formatPercent(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  /**
   * Get default start date
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
   * Track stages
   */
  trackByStage(index: number, stage: any): string {
    return stage.stageId;
  }
}
