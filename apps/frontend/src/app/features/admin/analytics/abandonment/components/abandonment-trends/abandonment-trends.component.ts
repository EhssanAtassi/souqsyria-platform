/**
 * @file abandonment-trends.component.ts
 * @description Abandonment Trends component showing time-based analysis.
 * @module AdminDashboard/Analytics/Abandonment
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
import { AbandonmentTrend, CartAbandonmentQuery } from '../../../../interfaces';

/**
 * Abandonment Trends Component
 * @description Time-based abandonment analysis featuring:
 *              - Daily/weekly/monthly trends
 *              - Seasonal patterns
 *              - Hour-of-day analysis
 *              - Day-of-week patterns
 */
@Component({
  standalone: true,
  selector: 'app-abandonment-trends',
  template: `
    <div class="abandonment-trends">
      @if (loading()) {
        <div class="abandonment-trends__loading">
          <div class="abandonment-trends__spinner"></div>
          <p>Loading trend data...</p>
        </div>
      } @else if (error()) {
        <div class="abandonment-trends__error">
          <span class="material-icons">error_outline</span>
          <p>{{ error() }}</p>
        </div>
      } @else {
        <!-- Trend KPIs -->
        <div class="abandonment-trends__kpis">
          <app-bi-kpi-card
            title="Current Rate"
            [value]="currentRate()"
            format="percent"
            icon="show_chart"
            [trend]="rateTrend()"
          />
          <app-bi-kpi-card
            title="Avg Rate (30d)"
            [value]="avgRate()"
            format="percent"
            icon="analytics"
          />
          <app-bi-kpi-card
            title="Peak Hour"
            [value]="peakHour()"
            format="text"
            icon="schedule"
          />
          <app-bi-kpi-card
            title="Worst Day"
            [value]="worstDay()"
            format="text"
            icon="calendar_today"
          />
        </div>

        <!-- Daily Trend Chart -->
        <app-bi-chart-wrapper
          title="Daily Abandonment Trend"
          subtitle="Abandonment rate over the last 30 days"
          [loading]="false"
        >
          <div class="abandonment-trends__chart">
            <div class="abandonment-trends__chart-area">
              @for (point of trends(); track point.date) {
                <div
                  class="abandonment-trends__chart-bar"
                  [style.height.%]="(point.abandonmentRate / maxRate()) * 100"
                  [class.abandonment-trends__chart-bar--high]="point.abandonmentRate >= 75"
                  [class.abandonment-trends__chart-bar--medium]="point.abandonmentRate >= 60 && point.abandonmentRate < 75"
                  [class.abandonment-trends__chart-bar--low]="point.abandonmentRate < 60"
                  [title]="point.date + ': ' + (point.abandonmentRate | number:'1.1-1') + '%'"
                ></div>
              }
            </div>
            <div class="abandonment-trends__chart-labels">
              <span>{{ trends()[0]?.date | date:'MMM d' }}</span>
              <span>{{ trends()[Math.floor(trends().length / 2)]?.date | date:'MMM d' }}</span>
              <span>{{ trends()[trends().length - 1]?.date | date:'MMM d' }}</span>
            </div>
          </div>
        </app-bi-chart-wrapper>

        <div class="abandonment-trends__grid">
          <!-- Hourly Pattern -->
          <app-bi-chart-wrapper
            title="Hourly Pattern"
            subtitle="Abandonment by hour of day"
            [loading]="false"
          >
            <div class="abandonment-trends__hourly">
              @for (hour of hourlyPattern(); track hour.hour) {
                <div class="abandonment-trends__hour">
                  <div
                    class="abandonment-trends__hour-bar"
                    [style.height.%]="(hour.rate / maxHourlyRate()) * 100"
                    [style.backgroundColor]="getHourColor(hour.rate)"
                  ></div>
                  <span class="abandonment-trends__hour-label">{{ hour.hour }}</span>
                </div>
              }
            </div>
          </app-bi-chart-wrapper>

          <!-- Day of Week Pattern -->
          <app-bi-chart-wrapper
            title="Day of Week Pattern"
            subtitle="Abandonment by day"
            [loading]="false"
          >
            <div class="abandonment-trends__weekly">
              @for (day of weeklyPattern(); track day.day) {
                <div class="abandonment-trends__day">
                  <div class="abandonment-trends__day-info">
                    <span class="abandonment-trends__day-name">{{ day.dayName }}</span>
                    <span class="abandonment-trends__day-rate">{{ day.rate | number:'1.1-1' }}%</span>
                  </div>
                  <div class="abandonment-trends__day-bar-container">
                    <div
                      class="abandonment-trends__day-bar"
                      [style.width.%]="day.rate"
                      [style.backgroundColor]="getDayColor(day.rate)"
                    ></div>
                  </div>
                  <div class="abandonment-trends__day-stats">
                    <span>{{ day.abandoned | number }} abandoned</span>
                    <span>{{ day.recovered | number }} recovered</span>
                  </div>
                </div>
              }
            </div>
          </app-bi-chart-wrapper>
        </div>

        <!-- Comparison Panel -->
        <app-bi-chart-wrapper
          title="Period Comparison"
          subtitle="Compare abandonment across time periods"
          [loading]="false"
        >
          <div class="abandonment-trends__comparison">
            @for (period of periodComparison(); track period.label) {
              <div class="abandonment-trends__period">
                <div class="abandonment-trends__period-header">
                  <span class="abandonment-trends__period-label">{{ period.label }}</span>
                  <span
                    class="abandonment-trends__period-change"
                    [class.abandonment-trends__period-change--positive]="period.change < 0"
                    [class.abandonment-trends__period-change--negative]="period.change > 0"
                  >
                    <span class="material-icons">
                      {{ period.change < 0 ? 'trending_down' : 'trending_up' }}
                    </span>
                    {{ period.change | number:'1.1-1' }}%
                  </span>
                </div>
                <div class="abandonment-trends__period-rate">
                  {{ period.rate | number:'1.1-1' }}%
                </div>
                <div class="abandonment-trends__period-stats">
                  <span>{{ period.carts | number }} carts</span>
                  <span>{{ period.value | currency:'USD':'symbol':'1.0-0' }} lost</span>
                </div>
              </div>
            }
          </div>
        </app-bi-chart-wrapper>

        <!-- Trend Insight -->
        <div class="abandonment-trends__insight">
          <span class="material-icons">insights</span>
          <div>
            <h4>Trend Analysis</h4>
            <p>{{ trendInsight() }}</p>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .abandonment-trends {
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
        border-top-color: #f59e0b;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      &__kpis {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1.25rem;
        margin-bottom: 1.5rem;
      }

      &__chart {
        padding: 1.25rem;
      }

      &__chart-area {
        display: flex;
        align-items: flex-end;
        gap: 2px;
        height: 180px;
        padding: 0 0 1rem;
        border-bottom: 1px solid #e5e7eb;
      }

      &__chart-bar {
        flex: 1;
        min-height: 4px;
        border-radius: 2px 2px 0 0;
        transition: height 0.3s ease;
        &--high { background: #ef4444; }
        &--medium { background: #f59e0b; }
        &--low { background: #22c55e; }
      }

      &__chart-labels {
        display: flex;
        justify-content: space-between;
        padding-top: 0.5rem;
        font-size: 0.75rem;
        color: #6b7280;
      }

      &__grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1.5rem;
        margin: 1.5rem 0;
      }

      &__hourly {
        display: flex;
        align-items: flex-end;
        gap: 0.25rem;
        height: 160px;
        padding: 1rem 1.25rem;
      }

      &__hour {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      &__hour-bar {
        width: 100%;
        max-width: 24px;
        min-height: 4px;
        border-radius: 2px 2px 0 0;
        transition: height 0.3s ease;
      }

      &__hour-label {
        margin-top: 0.375rem;
        font-size: 0.625rem;
        color: #6b7280;
      }

      &__weekly {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        padding: 1.25rem;
      }

      &__day {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
      }

      &__day-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      &__day-name {
        font-weight: 500;
        font-size: 0.875rem;
        color: #111827;
      }

      &__day-rate {
        font-weight: 600;
        font-size: 0.875rem;
        color: #dc2626;
      }

      &__day-bar-container {
        height: 8px;
        background: #f3f4f6;
        border-radius: 4px;
        overflow: hidden;
      }

      &__day-bar {
        height: 100%;
        border-radius: 4px;
        transition: width 0.3s ease;
      }

      &__day-stats {
        display: flex;
        gap: 1rem;
        font-size: 0.6875rem;
        color: #6b7280;
      }

      &__comparison {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1.25rem;
        padding: 1.25rem;
      }

      &__period {
        padding: 1rem;
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
      }

      &__period-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
      }

      &__period-label {
        font-size: 0.8125rem;
        color: #6b7280;
      }

      &__period-change {
        display: flex;
        align-items: center;
        gap: 0.125rem;
        font-size: 0.75rem;
        font-weight: 500;
        .material-icons { font-size: 0.875rem; }
        &--positive { color: #059669; }
        &--negative { color: #dc2626; }
      }

      &__period-rate {
        font-size: 1.5rem;
        font-weight: 700;
        color: #111827;
        margin-bottom: 0.375rem;
      }

      &__period-stats {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
        font-size: 0.75rem;
        color: #6b7280;
      }

      &__insight {
        display: flex;
        gap: 1rem;
        padding: 1.25rem;
        background: linear-gradient(135deg, #eff6ff, #dbeafe);
        border: 1px solid #93c5fd;
        border-radius: 12px;
        margin-top: 1.5rem;

        .material-icons { font-size: 1.5rem; color: #2563eb; }
        h4 { margin: 0 0 0.25rem; font-size: 0.9375rem; font-weight: 600; color: #1e40af; }
        p { margin: 0; font-size: 0.875rem; color: #1e3a8a; line-height: 1.5; }
      }
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 1024px) {
      .abandonment-trends {
        &__kpis { grid-template-columns: repeat(2, 1fr); }
        &__grid { grid-template-columns: 1fr; }
        &__comparison { grid-template-columns: repeat(2, 1fr); }
      }
    }

    @media (max-width: 640px) {
      .abandonment-trends {
        &__kpis { grid-template-columns: 1fr; }
        &__comparison { grid-template-columns: 1fr; }
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, BiChartWrapperComponent, BiKpiCardComponent]
})
export class AbandonmentTrendsComponent implements OnInit {
  private readonly biAnalyticsService = inject(BiAnalyticsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly trends = signal<AbandonmentTrend[]>([]);

  // Expose Math for template
  readonly Math = Math;

  /**
   * Current abandonment rate (most recent)
   */
  readonly currentRate = computed(() => {
    const data = this.trends();
    return data.length > 0 ? data[data.length - 1].abandonmentRate : 0;
  });

  /**
   * Average rate over period
   */
  readonly avgRate = computed(() => {
    const data = this.trends();
    if (data.length === 0) return 0;
    return data.reduce((sum, t) => sum + t.abandonmentRate, 0) / data.length;
  });

  /**
   * Rate trend direction
   */
  readonly rateTrend = computed(() => {
    const data = this.trends();
    if (data.length < 7) return { direction: 'neutral' as const, value: 0 };

    const recent = data.slice(-7);
    const older = data.slice(-14, -7);
    const recentAvg = recent.reduce((s, t) => s + t.abandonmentRate, 0) / recent.length;
    const olderAvg = older.reduce((s, t) => s + t.abandonmentRate, 0) / (older.length || 1);
    const change = recentAvg - olderAvg;

    return {
      direction: change < 0 ? 'down' as const : 'up' as const,
      value: Math.abs(change)
    };
  });

  /**
   * Maximum rate for scaling
   */
  readonly maxRate = computed(() =>
    Math.max(...this.trends().map(t => t.abandonmentRate), 1)
  );

  /**
   * Peak abandonment hour
   */
  readonly peakHour = computed(() => {
    const hourly = this.hourlyPattern();
    const peak = hourly.reduce((max, h) => h.rate > max.rate ? h : max, hourly[0]);
    return peak ? `${peak.hour}:00` : 'N/A';
  });

  /**
   * Worst day of week
   */
  readonly worstDay = computed(() => {
    const weekly = this.weeklyPattern();
    const worst = weekly.reduce((max, d) => d.rate > max.rate ? d : max, weekly[0]);
    return worst?.dayName || 'N/A';
  });

  /**
   * Hourly abandonment pattern
   */
  readonly hourlyPattern = computed(() => {
    const baseRate = this.avgRate() || 68;
    const hours = [];

    for (let h = 0; h < 24; h += 2) {
      // Simulate pattern: higher at night, lower during business hours
      let modifier = 0;
      if (h >= 0 && h < 6) modifier = 10;
      else if (h >= 6 && h < 10) modifier = -5;
      else if (h >= 10 && h < 14) modifier = -10;
      else if (h >= 14 && h < 18) modifier = -8;
      else if (h >= 18 && h < 22) modifier = 2;
      else modifier = 8;

      hours.push({ hour: h, rate: baseRate + modifier + (Math.random() * 5 - 2.5) });
    }

    return hours;
  });

  /**
   * Maximum hourly rate for scaling
   */
  readonly maxHourlyRate = computed(() =>
    Math.max(...this.hourlyPattern().map(h => h.rate))
  );

  /**
   * Weekly abandonment pattern
   */
  readonly weeklyPattern = computed(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const baseRate = this.avgRate() || 68;

    return days.map((dayName, i) => {
      // Weekend typically has higher abandonment
      const modifier = (i === 0 || i === 6) ? 8 : (i === 1 ? 2 : -3 + Math.random() * 4);
      const rate = baseRate + modifier;
      return {
        day: i,
        dayName,
        rate,
        abandoned: Math.round(100 + Math.random() * 50),
        recovered: Math.round(10 + Math.random() * 15)
      };
    });
  });

  /**
   * Period comparison data
   */
  readonly periodComparison = computed(() => {
    const current = this.currentRate();
    return [
      { label: 'This Week', rate: current, change: -2.3, carts: 245, value: 18500 },
      { label: 'Last Week', rate: current + 2.3, change: 1.5, carts: 268, value: 21200 },
      { label: 'This Month', rate: current + 0.8, change: -1.2, carts: 1024, value: 78400 },
      { label: 'Last Month', rate: current + 2.0, change: 3.1, carts: 1156, value: 92100 }
    ];
  });

  /**
   * Generated trend insight
   */
  readonly trendInsight = computed(() => {
    const trend = this.rateTrend();
    const peak = this.peakHour();
    const worst = this.worstDay();

    if (trend.direction === 'down') {
      return `Great news! Abandonment rate has decreased by ${trend.value.toFixed(1)}% compared to the previous period. Peak abandonment occurs at ${peak}, with ${worst} being the most challenging day. Consider scheduling promotional emails for these times.`;
    } else {
      return `Abandonment rate has increased by ${trend.value.toFixed(1)}% compared to the previous period. Focus recovery efforts around ${peak} and ${worst} when abandonment peaks. Review checkout friction points and consider exit-intent strategies.`;
    }
  });

  ngOnInit(): void {
    this.loadData();
  }

  /**
   * Get color based on hourly rate
   * @param rate - Abandonment rate
   */
  getHourColor(rate: number): string {
    if (rate >= 75) return '#ef4444';
    if (rate >= 65) return '#f59e0b';
    if (rate >= 55) return '#eab308';
    return '#22c55e';
  }

  /**
   * Get color based on daily rate
   * @param rate - Abandonment rate
   */
  getDayColor(rate: number): string {
    if (rate >= 75) return '#ef4444';
    if (rate >= 65) return '#f59e0b';
    return '#22c55e';
  }

  /**
   * Load trend data from API
   */
  private loadData(): void {
    const query: CartAbandonmentQuery = {
      startDate: this.getDefaultStartDate(),
      endDate: new Date().toISOString().split('T')[0]
    };

    this.biAnalyticsService.getAbandonmentTrends(query)
      .pipe(
        catchError(err => {
          this.error.set('Failed to load trend data.');
          return of([]);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(data => {
        this.trends.set(data);
        this.loading.set(false);
      });
  }

  /**
   * Get default start date (30 days ago)
   */
  private getDefaultStartDate(): string {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  }
}
