/**
 * @file clv-predictions.component.ts
 * @description CLV Predictions component for forecasting customer lifetime value.
 *              Displays predicted CLV trends and individual customer predictions.
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
  BiKpiCardComponent
} from '../../../../shared/components';
import { CLVPrediction, BIDateRangeQuery } from '../../../../interfaces';

/**
 * Prediction timeframe option
 */
interface TimeframeOption {
  /** Timeframe ID */
  id: string;
  /** Display label */
  label: string;
  /** Duration in months */
  months: number;
}

/**
 * CLV Predictions Component
 * @description Predictive analytics for customer lifetime value featuring:
 *              - Future CLV projections
 *              - Confidence intervals
 *              - Segment-level predictions
 *              - Risk assessment
 *
 * @example
 * ```html
 * <app-clv-predictions />
 * ```
 */
@Component({
  standalone: true,
  selector: 'app-clv-predictions',
  templateUrl: './clv-predictions.component.html',
  styleUrls: ['./clv-predictions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    BiChartWrapperComponent,
    BiKpiCardComponent
  ]
})
export class ClvPredictionsComponent implements OnInit {
  // =========================================================================
  // Dependencies
  // =========================================================================

  private readonly biAnalyticsService = inject(BiAnalyticsService);
  private readonly destroyRef = inject(DestroyRef);

  // =========================================================================
  // Configuration
  // =========================================================================

  /**
   * Timeframe options for predictions
   */
  readonly timeframeOptions: TimeframeOption[] = [
    { id: '30_days', label: '30 Days', months: 1 },
    { id: '90_days', label: '90 Days', months: 3 },
    { id: '6_months', label: '6 Months', months: 6 },
    { id: '1_year', label: '1 Year', months: 12 },
    { id: '2_years', label: '2 Years', months: 24 }
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
   * Predictions data
   */
  readonly predictions = signal<CLVPrediction[]>([]);

  /**
   * Selected timeframe
   */
  readonly selectedTimeframe = signal<string>('1_year');

  // =========================================================================
  // Computed Properties
  // =========================================================================

  /**
   * Current timeframe option
   */
  readonly currentTimeframe = computed(() => {
    return this.timeframeOptions.find(t => t.id === this.selectedTimeframe());
  });

  /**
   * Aggregate prediction summary
   */
  readonly predictionSummary = computed(() => {
    const preds = this.predictions();
    if (preds.length === 0) return null;

    const totalPredicted = preds.reduce((sum, p) => sum + p.predictedCLV, 0);
    const avgConfidence = preds.reduce((sum, p) => sum + p.confidence, 0) / preds.length;
    const highRiskCount = preds.filter(p => p.churnRisk > 0.5).length;
    const growthCount = preds.filter(p => p.growthPotential > 0.2).length;

    return {
      totalPredictedCLV: totalPredicted,
      averageConfidence: avgConfidence,
      highRiskCustomers: highRiskCount,
      growthOpportunities: growthCount,
      totalCustomers: preds.length
    };
  });

  /**
   * Predictions grouped by risk level
   */
  readonly predictionsByRisk = computed(() => {
    const preds = this.predictions();
    return {
      low: preds.filter(p => p.churnRisk <= 0.2),
      medium: preds.filter(p => p.churnRisk > 0.2 && p.churnRisk <= 0.5),
      high: preds.filter(p => p.churnRisk > 0.5)
    };
  });

  /**
   * Top growth opportunities
   */
  readonly topGrowthOpportunities = computed(() => {
    return [...this.predictions()]
      .sort((a, b) => b.growthPotential - a.growthPotential)
      .slice(0, 10);
  });

  /**
   * High risk customers
   */
  readonly highRiskCustomers = computed(() => {
    return [...this.predictions()]
      .filter(p => p.churnRisk > 0.5)
      .sort((a, b) => b.churnRisk - a.churnRisk)
      .slice(0, 10);
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
   * Load predictions data
   */
  private loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    const query: BIDateRangeQuery = {
      startDate: this.getDefaultStartDate(),
      endDate: this.getDefaultEndDate()
    };

    this.biAnalyticsService.getCLVPredictions(query)
      .pipe(
        catchError(err => {
          console.error('Error loading predictions:', err);
          this.error.set('Failed to load CLV predictions.');
          return of([]);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (data) => {
          this.predictions.set(data);
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
   * Handle timeframe change
   */
  onTimeframeChange(timeframe: string): void {
    this.selectedTimeframe.set(timeframe);
    this.loadData();
  }

  /**
   * Handle chart export
   */
  onChartExport(format: string): void {
    console.log('Export predictions chart as:', format);
  }

  /**
   * View customer details
   */
  onViewCustomer(prediction: CLVPrediction): void {
    console.log('View customer:', prediction.customerId);
  }

  // =========================================================================
  // Helper Methods
  // =========================================================================

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
    return `${(value * 100).toFixed(0)}%`;
  }

  /**
   * Get risk level label
   */
  getRiskLevel(risk: number): string {
    if (risk <= 0.2) return 'Low';
    if (risk <= 0.5) return 'Medium';
    return 'High';
  }

  /**
   * Get risk level color
   */
  getRiskColor(risk: number): string {
    if (risk <= 0.2) return '#059669';
    if (risk <= 0.5) return '#d97706';
    return '#ef4444';
  }

  /**
   * Get confidence level color
   */
  getConfidenceColor(confidence: number): string {
    if (confidence >= 0.8) return '#059669';
    if (confidence >= 0.6) return '#0284c7';
    return '#d97706';
  }

  /**
   * Get default start date
   */
  private getDefaultStartDate(): string {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 1);
    return date.toISOString().split('T')[0];
  }

  /**
   * Get default end date
   */
  private getDefaultEndDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Track predictions
   */
  trackByPrediction(index: number, prediction: CLVPrediction): number {
    return prediction.customerId;
  }

  /**
   * Track timeframe options
   */
  trackByTimeframe(index: number, option: TimeframeOption): string {
    return option.id;
  }
}
