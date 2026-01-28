/**
 * @file cohort-retention.component.ts
 * @description Cohort Retention Analysis component with detailed retention curves.
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
import { CohortAnalyticsData, CohortAnalyticsQuery, RetentionRow } from '../../../../interfaces';

/**
 * Cohort Retention Component
 * @description Detailed retention analysis with:
 *              - Retention curve visualization
 *              - Period-over-period comparison
 *              - Cohort performance benchmarking
 */
@Component({
  standalone: true,
  selector: 'app-cohort-retention',
  template: `
    <div class="cohort-retention">
      @if (loading()) {
        <div class="cohort-retention__loading">
          <div class="cohort-retention__spinner"></div>
          <p>Loading retention data...</p>
        </div>
      } @else if (error()) {
        <div class="cohort-retention__error">
          <span class="material-icons">error_outline</span>
          <p>{{ error() }}</p>
        </div>
      } @else if (data()) {
        @let retentionData = data()!;

        <!-- Summary KPIs -->
        <div class="cohort-retention__kpis">
          <app-bi-kpi-card
            title="Week 1 Retention"
            [value]="getAverageRetention(1)"
            format="percent"
            icon="event_repeat"
            [trend]="{ direction: 'up', value: 2.3 }"
          />
          <app-bi-kpi-card
            title="Month 1 Retention"
            [value]="getAverageRetention(4)"
            format="percent"
            icon="calendar_month"
          />
          <app-bi-kpi-card
            title="Month 3 Retention"
            [value]="getAverageRetention(12)"
            format="percent"
            icon="date_range"
          />
          <app-bi-kpi-card
            title="Best Performing"
            [value]="bestCohortName()"
            format="text"
            icon="star"
          />
        </div>

        <!-- Retention Curve Chart -->
        <app-bi-chart-wrapper
          title="Retention Curve"
          subtitle="Average retention rate over time"
          [loading]="false"
        >
          <div class="cohort-retention__curve">
            <div class="cohort-retention__curve-chart">
              @for (point of retentionCurve(); track point.period) {
                <div class="cohort-retention__curve-point">
                  <div
                    class="cohort-retention__curve-bar"
                    [style.height.%]="point.rate"
                    [class.cohort-retention__curve-bar--high]="point.rate >= 60"
                    [class.cohort-retention__curve-bar--medium]="point.rate >= 30 && point.rate < 60"
                    [class.cohort-retention__curve-bar--low]="point.rate < 30"
                  >
                    <span class="cohort-retention__curve-value">{{ point.rate | number:'1.0-0' }}%</span>
                  </div>
                  <span class="cohort-retention__curve-label">{{ point.period }}</span>
                </div>
              }
            </div>
          </div>
        </app-bi-chart-wrapper>

        <!-- Cohort Comparison Table -->
        <app-bi-chart-wrapper
          title="Cohort Comparison"
          subtitle="Compare retention across different cohorts"
          [loading]="false"
        >
          <div class="cohort-retention__comparison">
            <table class="cohort-retention__table">
              <thead>
                <tr>
                  <th>Cohort</th>
                  <th>Size</th>
                  <th>M1</th>
                  <th>M2</th>
                  <th>M3</th>
                  <th>M6</th>
                  <th>Trend</th>
                </tr>
              </thead>
              <tbody>
                @for (row of retentionData.retention; track row.cohortId) {
                  <tr>
                    <td class="cohort-retention__cohort-name">{{ row.cohortId }}</td>
                    <td>{{ getCohortSize(row.cohortId) | number }}</td>
                    <td [class]="getRetentionClass(row.retentionRates[1])">
                      {{ row.retentionRates[1] | number:'1.0-0' }}%
                    </td>
                    <td [class]="getRetentionClass(row.retentionRates[2])">
                      {{ row.retentionRates[2] | number:'1.0-0' }}%
                    </td>
                    <td [class]="getRetentionClass(row.retentionRates[3])">
                      {{ row.retentionRates[3] | number:'1.0-0' }}%
                    </td>
                    <td [class]="getRetentionClass(row.retentionRates[6])">
                      {{ row.retentionRates[6] || 0 | number:'1.0-0' }}%
                    </td>
                    <td>
                      <span
                        class="cohort-retention__trend"
                        [class.cohort-retention__trend--up]="getCohortTrend(row) > 0"
                        [class.cohort-retention__trend--down]="getCohortTrend(row) < 0"
                      >
                        <span class="material-icons">
                          {{ getCohortTrend(row) >= 0 ? 'trending_up' : 'trending_down' }}
                        </span>
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </app-bi-chart-wrapper>
      }
    </div>
  `,
  styles: [`
    .cohort-retention {
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

      &__curve {
        padding: 1.5rem;
      }

      &__curve-chart {
        display: flex;
        align-items: flex-end;
        gap: 0.5rem;
        height: 200px;
        padding: 1rem 0;
        border-bottom: 1px solid #e5e7eb;
      }

      &__curve-point {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
      }

      &__curve-bar {
        width: 100%;
        max-width: 48px;
        min-height: 20px;
        border-radius: 4px 4px 0 0;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding-top: 0.25rem;
        transition: height 0.3s ease;

        &--high { background: #10b981; }
        &--medium { background: #f59e0b; }
        &--low { background: #ef4444; }
      }

      &__curve-value {
        font-size: 0.6875rem;
        font-weight: 600;
        color: white;
        text-shadow: 0 1px 2px rgba(0,0,0,0.2);
      }

      &__curve-label {
        font-size: 0.75rem;
        color: #6b7280;
      }

      &__comparison {
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

        td {
          font-weight: 500;

          &.high { color: #059669; background: #ecfdf5; }
          &.medium { color: #d97706; background: #fffbeb; }
          &.low { color: #dc2626; background: #fef2f2; }
        }
      }

      &__cohort-name {
        text-align: left !important;
        font-weight: 600;
        color: #111827;
      }

      &__trend {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border-radius: 50%;

        &--up {
          background: #ecfdf5;
          .material-icons { color: #059669; font-size: 1rem; }
        }

        &--down {
          background: #fef2f2;
          .material-icons { color: #dc2626; font-size: 1rem; }
        }
      }
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 1024px) {
      .cohort-retention__kpis { grid-template-columns: repeat(2, 1fr); }
    }

    @media (max-width: 640px) {
      .cohort-retention__kpis { grid-template-columns: 1fr; }
      .cohort-retention__curve-chart { overflow-x: auto; min-width: 500px; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, BiChartWrapperComponent, BiKpiCardComponent]
})
export class CohortRetentionComponent implements OnInit {
  private readonly biAnalyticsService = inject(BiAnalyticsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly data = signal<CohortAnalyticsData | null>(null);

  /**
   * Computed retention curve for visualization
   */
  readonly retentionCurve = computed(() => {
    const retention = this.data()?.retention;
    if (!retention || retention.length === 0) return [];

    const periods = ['M0', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6'];
    return periods.map((period, idx) => {
      const rates = retention
        .map(r => r.retentionRates[idx] || 0)
        .filter(r => r > 0);
      const avgRate = rates.length > 0
        ? rates.reduce((a, b) => a + b, 0) / rates.length
        : 0;
      return { period, rate: avgRate };
    });
  });

  /**
   * Best performing cohort name
   */
  readonly bestCohortName = computed(() => {
    const retention = this.data()?.retention;
    if (!retention || retention.length === 0) return 'N/A';

    let best = retention[0];
    let bestRate = best.retentionRates[1] || 0;

    for (const row of retention) {
      const rate = row.retentionRates[1] || 0;
      if (rate > bestRate) {
        best = row;
        bestRate = rate;
      }
    }

    return best.cohortId;
  });

  ngOnInit(): void {
    this.loadData();
  }

  /**
   * Get average retention for a specific period across all cohorts
   * @param period - The period index (1-based month)
   */
  getAverageRetention(period: number): number {
    const retention = this.data()?.retention;
    if (!retention || retention.length === 0) return 0;

    const rates = retention
      .map(r => r.retentionRates[period] || 0)
      .filter(r => r > 0);

    return rates.length > 0
      ? rates.reduce((a, b) => a + b, 0) / rates.length
      : 0;
  }

  /**
   * Get cohort size by ID
   * @param cohortId - The cohort identifier
   */
  getCohortSize(cohortId: string): number {
    const cohorts = this.data()?.cohorts;
    if (!cohorts) return 0;
    const cohort = cohorts.find(c => c.cohortId === cohortId);
    return cohort?.size || 0;
  }

  /**
   * Get CSS class based on retention rate
   * @param rate - Retention rate percentage
   */
  getRetentionClass(rate: number | undefined): string {
    if (!rate) return '';
    if (rate >= 50) return 'high';
    if (rate >= 25) return 'medium';
    return 'low';
  }

  /**
   * Calculate cohort trend (positive or negative)
   * @param row - Retention row data
   */
  getCohortTrend(row: RetentionRow): number {
    const rates = row.retentionRates.filter(r => r > 0);
    if (rates.length < 2) return 0;
    return rates[rates.length - 1] - rates[rates.length - 2];
  }

  /**
   * Load cohort retention data from API
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
          this.error.set('Failed to load retention data.');
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
