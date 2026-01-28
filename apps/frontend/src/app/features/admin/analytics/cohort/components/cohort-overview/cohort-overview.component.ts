/**
 * @file cohort-overview.component.ts
 * @description Cohort Overview component displaying cohort summary and heatmap.
 * @module AdminDashboard/Analytics/Cohort
 */

import { ChangeDetectionStrategy, Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';

import { BiAnalyticsService } from '../../../../services/bi-analytics.service';
import { BiChartWrapperComponent, BiKpiCardComponent } from '../../../../shared/components';
import { CohortAnalyticsData, CohortAnalyticsQuery } from '../../../../interfaces';

@Component({
  standalone: true,
  selector: 'app-cohort-overview',
  template: `
    <div class="cohort-overview">
      @if (loading()) {
        <div class="cohort-overview__loading">
          <div class="cohort-overview__spinner"></div>
          <p>Loading cohort data...</p>
        </div>
      } @else if (error()) {
        <div class="cohort-overview__error">
          <span class="material-icons">error_outline</span>
          <p>{{ error() }}</p>
        </div>
      } @else if (data()) {
        @let cohortData = data()!;

        <!-- KPIs -->
        <div class="cohort-overview__kpis">
          <app-bi-kpi-card
            title="Total Cohorts"
            [value]="cohortData.cohorts?.length || 0"
            format="number"
            icon="groups"
          />
          <app-bi-kpi-card
            title="Avg Retention (M1)"
            [value]="getAvgRetention(1)"
            format="percent"
            icon="group_add"
          />
          <app-bi-kpi-card
            title="Avg Retention (M3)"
            [value]="getAvgRetention(3)"
            format="percent"
            icon="loyalty"
          />
          <app-bi-kpi-card
            title="Best Cohort"
            [value]="getBestCohortRetention()"
            format="percent"
            icon="star"
          />
        </div>

        <!-- Retention Heatmap -->
        <app-bi-chart-wrapper
          title="Cohort Retention Heatmap"
          subtitle="Customer retention rates over time"
          [loading]="false"
        >
          <div class="cohort-overview__heatmap">
            @if (cohortData.retention && cohortData.retention.length > 0) {
              <table class="cohort-overview__table">
                <thead>
                  <tr>
                    <th>Cohort</th>
                    @for (period of getPeriods(); track period) {
                      <th>{{ period }}</th>
                    }
                  </tr>
                </thead>
                <tbody>
                  @for (row of cohortData.retention; track row.cohortId) {
                    <tr>
                      <td class="cohort-overview__cohort-name">{{ row.cohortId }}</td>
                      @for (rate of row.retentionRates; track $index) {
                        <td
                          class="cohort-overview__cell"
                          [style.backgroundColor]="getHeatmapColor(rate)"
                        >
                          {{ rate | number:'1.0-0' }}%
                        </td>
                      }
                    </tr>
                  }
                </tbody>
              </table>
            } @else {
              <div class="cohort-overview__empty">
                <span class="material-icons">grid_off</span>
                <p>No cohort data available</p>
              </div>
            }
          </div>
        </app-bi-chart-wrapper>
      }
    </div>
  `,
  styles: [`
    .cohort-overview {
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
      &__heatmap {
        overflow-x: auto;
        padding: 1rem;
      }
      &__table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.8125rem;
        th, td {
          padding: 0.625rem 0.75rem;
          text-align: center;
          border: 1px solid #e5e7eb;
        }
        th {
          background: #f9fafb;
          font-weight: 600;
          color: #6b7280;
        }
      }
      &__cohort-name {
        text-align: left !important;
        font-weight: 500;
        background: #f9fafb;
      }
      &__cell {
        font-weight: 500;
        color: white;
        text-shadow: 0 1px 2px rgba(0,0,0,0.2);
      }
      &__empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 3rem;
        color: #6b7280;
        .material-icons { font-size: 3rem; opacity: 0.5; }
      }
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (max-width: 1024px) {
      .cohort-overview__kpis { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 640px) {
      .cohort-overview__kpis { grid-template-columns: 1fr; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, BiChartWrapperComponent, BiKpiCardComponent]
})
export class CohortOverviewComponent implements OnInit {
  private readonly biAnalyticsService = inject(BiAnalyticsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly data = signal<CohortAnalyticsData | null>(null);

  ngOnInit(): void {
    this.loadData();
  }

  getAvgRetention(month: number): number {
    const retention = this.data()?.retention;
    if (!retention || retention.length === 0) return 0;
    const rates = retention.map(r => r.retentionRates[month] || 0).filter(r => r > 0);
    return rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;
  }

  getBestCohortRetention(): number {
    const retention = this.data()?.retention;
    if (!retention || retention.length === 0) return 0;
    return Math.max(...retention.map(r => r.retentionRates[1] || 0));
  }

  getPeriods(): string[] {
    return ['M0', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6'];
  }

  getHeatmapColor(value: number): string {
    if (value >= 80) return '#059669';
    if (value >= 60) return '#10b981';
    if (value >= 40) return '#f59e0b';
    if (value >= 20) return '#f97316';
    return '#ef4444';
  }

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
          this.error.set('Failed to load cohort data.');
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(data => {
        this.data.set(data);
        this.loading.set(false);
      });
  }

  private getDefaultStartDate(): string {
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    return d.toISOString().split('T')[0];
  }
}
