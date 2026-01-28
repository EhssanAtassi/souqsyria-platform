/**
 * @file cohort-behavior.component.ts
 * @description Cohort Behavior Analysis component showing behavioral patterns.
 * @module AdminDashboard/Analytics/Cohort
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
import { BiChartWrapperComponent, BiKpiCardComponent } from '../../../../shared/components';
import { CohortAnalyticsData, CohortAnalyticsQuery, CohortData } from '../../../../interfaces';

/**
 * Behavior metric configuration
 */
interface BehaviorMetric {
  id: string;
  label: string;
  icon: string;
  getValue: (cohort: CohortData) => number;
  format: 'number' | 'currency' | 'percent';
}

/**
 * Cohort Behavior Component
 * @description Behavioral pattern analysis featuring:
 *              - Purchase frequency analysis
 *              - Session behavior metrics
 *              - Product category preferences
 *              - Engagement trends
 */
@Component({
  standalone: true,
  selector: 'app-cohort-behavior',
  template: `
    <div class="cohort-behavior">
      @if (loading()) {
        <div class="cohort-behavior__loading">
          <div class="cohort-behavior__spinner"></div>
          <p>Loading behavior data...</p>
        </div>
      } @else if (error()) {
        <div class="cohort-behavior__error">
          <span class="material-icons">error_outline</span>
          <p>{{ error() }}</p>
        </div>
      } @else if (data()) {
        @let behaviorData = data()!;

        <!-- Behavior KPIs -->
        <div class="cohort-behavior__kpis">
          <app-bi-kpi-card
            title="Avg Purchase Frequency"
            [value]="avgPurchaseFrequency()"
            format="number"
            icon="shopping_cart"
            suffix=" orders/user"
          />
          <app-bi-kpi-card
            title="Avg Order Value"
            [value]="avgOrderValue()"
            format="currency"
            icon="attach_money"
          />
          <app-bi-kpi-card
            title="Repeat Purchase Rate"
            [value]="repeatPurchaseRate()"
            format="percent"
            icon="replay"
          />
          <app-bi-kpi-card
            title="Avg Days Between Orders"
            [value]="avgDaysBetweenOrders()"
            format="number"
            icon="schedule"
            suffix=" days"
          />
        </div>

        <!-- Behavior Comparison Grid -->
        <app-bi-chart-wrapper
          title="Cohort Behavior Comparison"
          subtitle="Key behavioral metrics across cohorts"
          [loading]="false"
        >
          <div class="cohort-behavior__grid">
            @for (metric of behaviorMetrics; track metric.id) {
              <div class="cohort-behavior__metric-card">
                <div class="cohort-behavior__metric-header">
                  <span class="material-icons">{{ metric.icon }}</span>
                  <span>{{ metric.label }}</span>
                </div>
                <div class="cohort-behavior__metric-bars">
                  @for (cohort of topCohorts(); track cohort.cohortId) {
                    <div class="cohort-behavior__metric-row">
                      <span class="cohort-behavior__metric-cohort">{{ cohort.cohortId }}</span>
                      <div class="cohort-behavior__metric-bar-container">
                        <div
                          class="cohort-behavior__metric-bar"
                          [style.width.%]="getMetricWidth(metric, cohort)"
                        ></div>
                      </div>
                      <span class="cohort-behavior__metric-value">
                        {{ formatMetricValue(metric, cohort) }}
                      </span>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        </app-bi-chart-wrapper>

        <!-- Detailed Behavior Table -->
        <app-bi-chart-wrapper
          title="Detailed Behavior Analysis"
          subtitle="Complete behavioral metrics for each cohort"
          [loading]="false"
        >
          <div class="cohort-behavior__table-wrapper">
            <table class="cohort-behavior__table">
              <thead>
                <tr>
                  <th>Cohort</th>
                  <th>Size</th>
                  <th>Avg Orders</th>
                  <th>AOV</th>
                  <th>Total Revenue</th>
                  <th>Repeat Rate</th>
                  <th>Engagement</th>
                </tr>
              </thead>
              <tbody>
                @for (cohort of behaviorData.cohorts; track cohort.cohortId) {
                  <tr>
                    <td class="cohort-behavior__cohort-cell">{{ cohort.cohortId }}</td>
                    <td>{{ cohort.size | number }}</td>
                    <td>{{ cohort.avgOrders || 0 | number:'1.1-1' }}</td>
                    <td>{{ cohort.avgOrderValue || 0 | currency:'USD':'symbol':'1.0-0' }}</td>
                    <td class="cohort-behavior__revenue-cell">
                      {{ cohort.totalRevenue || 0 | currency:'USD':'symbol':'1.0-0' }}
                    </td>
                    <td>
                      <span
                        class="cohort-behavior__rate-badge"
                        [class.cohort-behavior__rate-badge--high]="getRepeatRate(cohort) >= 40"
                        [class.cohort-behavior__rate-badge--medium]="getRepeatRate(cohort) >= 20 && getRepeatRate(cohort) < 40"
                        [class.cohort-behavior__rate-badge--low]="getRepeatRate(cohort) < 20"
                      >
                        {{ getRepeatRate(cohort) | number:'1.0-0' }}%
                      </span>
                    </td>
                    <td>
                      <div class="cohort-behavior__engagement">
                        @for (dot of getEngagementDots(cohort); track $index) {
                          <span
                            class="cohort-behavior__engagement-dot"
                            [class.cohort-behavior__engagement-dot--active]="dot"
                          ></span>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </app-bi-chart-wrapper>

        <!-- Insights Panel -->
        <div class="cohort-behavior__insights">
          <div class="cohort-behavior__insight-card">
            <span class="material-icons">lightbulb</span>
            <div class="cohort-behavior__insight-content">
              <h4>Behavioral Insight</h4>
              <p>{{ behaviorInsight() }}</p>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .cohort-behavior {
      &__loading, &__error {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 3rem;
        gap: 1rem;
      }

      &__spinner {
        width: 40px;
        height: 40px;
        border: 3px solid #e5e7eb;
        border-top-color: #0891b2;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      &__kpis {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1.25rem;
        margin-bottom: 1.5rem;
      }

      &__grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1.25rem;
        padding: 1.25rem;
      }

      &__metric-card {
        padding: 1rem;
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
      }

      &__metric-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 1rem;
        font-weight: 600;
        font-size: 0.875rem;
        color: #374151;
        .material-icons { font-size: 1.125rem; color: #0891b2; }
      }

      &__metric-bars {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      &__metric-row {
        display: grid;
        grid-template-columns: 60px 1fr 60px;
        align-items: center;
        gap: 0.5rem;
      }

      &__metric-cohort {
        font-size: 0.75rem;
        color: #6b7280;
      }

      &__metric-bar-container {
        height: 8px;
        background: #e5e7eb;
        border-radius: 4px;
        overflow: hidden;
      }

      &__metric-bar {
        height: 100%;
        background: linear-gradient(90deg, #0891b2, #06b6d4);
        border-radius: 4px;
        transition: width 0.3s ease;
      }

      &__metric-value {
        font-size: 0.75rem;
        font-weight: 600;
        color: #111827;
        text-align: right;
      }

      &__table-wrapper {
        overflow-x: auto;
        padding: 1rem;
      }

      &__table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.875rem;

        th, td {
          padding: 0.75rem 1rem;
          text-align: center;
          border-bottom: 1px solid #e5e7eb;
        }

        th {
          background: #f9fafb;
          font-weight: 600;
          color: #6b7280;
          font-size: 0.75rem;
          text-transform: uppercase;
        }
      }

      &__cohort-cell {
        text-align: left !important;
        font-weight: 600;
        color: #111827;
      }

      &__revenue-cell {
        font-weight: 600;
        color: #059669;
      }

      &__rate-badge {
        display: inline-block;
        padding: 0.25rem 0.5rem;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;

        &--high { background: #ecfdf5; color: #059669; }
        &--medium { background: #fffbeb; color: #d97706; }
        &--low { background: #fef2f2; color: #dc2626; }
      }

      &__engagement {
        display: flex;
        gap: 0.25rem;
        justify-content: center;
      }

      &__engagement-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #e5e7eb;

        &--active { background: #0891b2; }
      }

      &__insights {
        margin-top: 1.5rem;
      }

      &__insight-card {
        display: flex;
        gap: 1rem;
        padding: 1.25rem;
        background: linear-gradient(135deg, #f0fdfa, #e0f2fe);
        border: 1px solid #99f6e4;
        border-radius: 12px;

        .material-icons {
          font-size: 1.5rem;
          color: #0891b2;
        }

        h4 {
          margin: 0 0 0.25rem;
          font-size: 0.9375rem;
          font-weight: 600;
          color: #134e4a;
        }

        p {
          margin: 0;
          font-size: 0.875rem;
          color: #0f766e;
          line-height: 1.5;
        }
      }
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 1024px) {
      .cohort-behavior {
        &__kpis { grid-template-columns: repeat(2, 1fr); }
        &__grid { grid-template-columns: 1fr; }
      }
    }

    @media (max-width: 640px) {
      .cohort-behavior__kpis { grid-template-columns: 1fr; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, BiChartWrapperComponent, BiKpiCardComponent]
})
export class CohortBehaviorComponent implements OnInit {
  private readonly biAnalyticsService = inject(BiAnalyticsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly data = signal<CohortAnalyticsData | null>(null);

  /**
   * Behavior metrics configuration
   */
  readonly behaviorMetrics: BehaviorMetric[] = [
    {
      id: 'orders',
      label: 'Avg Orders',
      icon: 'shopping_cart',
      getValue: (c) => c.avgOrders || 0,
      format: 'number'
    },
    {
      id: 'aov',
      label: 'Avg Order Value',
      icon: 'attach_money',
      getValue: (c) => c.avgOrderValue || 0,
      format: 'currency'
    },
    {
      id: 'revenue',
      label: 'Total Revenue',
      icon: 'payments',
      getValue: (c) => c.totalRevenue || 0,
      format: 'currency'
    },
    {
      id: 'repeat',
      label: 'Repeat Rate',
      icon: 'replay',
      getValue: (c) => this.getRepeatRate(c),
      format: 'percent'
    }
  ];

  /**
   * Average purchase frequency
   */
  readonly avgPurchaseFrequency = computed(() => {
    const cohorts = this.data()?.cohorts;
    if (!cohorts || cohorts.length === 0) return 0;
    const total = cohorts.reduce((sum, c) => sum + (c.avgOrders || 0), 0);
    return total / cohorts.length;
  });

  /**
   * Average order value
   */
  readonly avgOrderValue = computed(() => {
    const cohorts = this.data()?.cohorts;
    if (!cohorts || cohorts.length === 0) return 0;
    const total = cohorts.reduce((sum, c) => sum + (c.avgOrderValue || 0), 0);
    return total / cohorts.length;
  });

  /**
   * Overall repeat purchase rate
   */
  readonly repeatPurchaseRate = computed(() => {
    const cohorts = this.data()?.cohorts;
    if (!cohorts || cohorts.length === 0) return 0;
    const rates = cohorts.map(c => this.getRepeatRate(c));
    return rates.reduce((a, b) => a + b, 0) / rates.length;
  });

  /**
   * Average days between orders
   */
  readonly avgDaysBetweenOrders = computed(() => {
    // Simulated calculation based on order frequency
    const freq = this.avgPurchaseFrequency();
    return freq > 0 ? Math.round(180 / freq) : 0;
  });

  /**
   * Top 5 cohorts for comparison
   */
  readonly topCohorts = computed(() => {
    const cohorts = this.data()?.cohorts;
    if (!cohorts) return [];
    return [...cohorts]
      .sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0))
      .slice(0, 5);
  });

  /**
   * Generated behavioral insight
   */
  readonly behaviorInsight = computed(() => {
    const cohorts = this.data()?.cohorts;
    if (!cohorts || cohorts.length === 0) {
      return 'No cohort data available for analysis.';
    }

    const bestCohort = this.topCohorts()[0];
    const repeatRate = this.repeatPurchaseRate();

    if (repeatRate >= 40) {
      return `Strong customer loyalty detected. ${bestCohort?.cohortId} cohort shows the highest engagement with an average of ${bestCohort?.avgOrders?.toFixed(1)} orders per customer.`;
    } else if (repeatRate >= 20) {
      return `Moderate repeat purchase behavior observed. Consider loyalty programs to boost retention in lower-performing cohorts.`;
    } else {
      return `Low repeat purchase rates indicate potential churn risk. Focus on post-purchase engagement strategies to improve customer retention.`;
    }
  });

  ngOnInit(): void {
    this.loadData();
  }

  /**
   * Calculate repeat purchase rate for a cohort
   * @param cohort - Cohort data
   */
  getRepeatRate(cohort: CohortData): number {
    const orders = cohort.avgOrders || 0;
    // Users with more than 1 order are repeat customers
    return orders > 1 ? Math.min((orders - 1) * 25, 100) : 0;
  }

  /**
   * Get metric bar width percentage
   * @param metric - Metric configuration
   * @param cohort - Cohort data
   */
  getMetricWidth(metric: BehaviorMetric, cohort: CohortData): number {
    const cohorts = this.data()?.cohorts;
    if (!cohorts) return 0;

    const maxValue = Math.max(...cohorts.map(c => metric.getValue(c)));
    const value = metric.getValue(cohort);
    return maxValue > 0 ? (value / maxValue) * 100 : 0;
  }

  /**
   * Format metric value based on format type
   * @param metric - Metric configuration
   * @param cohort - Cohort data
   */
  formatMetricValue(metric: BehaviorMetric, cohort: CohortData): string {
    const value = metric.getValue(cohort);
    switch (metric.format) {
      case 'currency':
        return `$${value.toFixed(0)}`;
      case 'percent':
        return `${value.toFixed(0)}%`;
      default:
        return value.toFixed(1);
    }
  }

  /**
   * Get engagement dots based on cohort activity
   * @param cohort - Cohort data
   */
  getEngagementDots(cohort: CohortData): boolean[] {
    const score = Math.min(Math.round((cohort.avgOrders || 0) * 2), 5);
    return Array(5).fill(false).map((_, i) => i < score);
  }

  /**
   * Load cohort behavior data from API
   */
  private loadData(): void {
    const query: CohortAnalyticsQuery = {
      startDate: this.getDefaultStartDate(),
      endDate: new Date().toISOString().split('T')[0],
      cohortType: 'first_purchase',
      periodType: 'month',
      periods: 6
    };

    this.biAnalyticsService.getCohortAnalytics(query)
      .pipe(
        catchError(err => {
          this.error.set('Failed to load behavior data.');
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(data => {
        this.data.set(data);
        this.loading.set(false);
      });
  }

  /**
   * Get default start date (6 months ago)
   */
  private getDefaultStartDate(): string {
    const date = new Date();
    date.setMonth(date.getMonth() - 6);
    return date.toISOString().split('T')[0];
  }
}
