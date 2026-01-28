/**
 * @file cohort-revenue.component.ts
 * @description Cohort Revenue Analysis component showing revenue contribution by cohort.
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
 * Cohort Revenue Component
 * @description Revenue analysis by cohort featuring:
 *              - Total revenue contribution per cohort
 *              - Revenue per user metrics
 *              - Revenue decay visualization
 *              - Cohort value comparison
 */
@Component({
  standalone: true,
  selector: 'app-cohort-revenue',
  template: `
    <div class="cohort-revenue">
      @if (loading()) {
        <div class="cohort-revenue__loading">
          <div class="cohort-revenue__spinner"></div>
          <p>Loading revenue data...</p>
        </div>
      } @else if (error()) {
        <div class="cohort-revenue__error">
          <span class="material-icons">error_outline</span>
          <p>{{ error() }}</p>
        </div>
      } @else if (data()) {
        @let revenueData = data()!;

        <!-- Revenue KPIs -->
        <div class="cohort-revenue__kpis">
          <app-bi-kpi-card
            title="Total Cohort Revenue"
            [value]="totalRevenue()"
            format="currency"
            icon="payments"
          />
          <app-bi-kpi-card
            title="Avg Revenue/Cohort"
            [value]="avgRevenuePerCohort()"
            format="currency"
            icon="analytics"
          />
          <app-bi-kpi-card
            title="Avg Revenue/User"
            [value]="avgRevenuePerUser()"
            format="currency"
            icon="person"
          />
          <app-bi-kpi-card
            title="Top Cohort Value"
            [value]="topCohortRevenue()"
            format="currency"
            icon="star"
          />
        </div>

        <!-- Revenue Distribution Chart -->
        <app-bi-chart-wrapper
          title="Revenue by Cohort"
          subtitle="Total revenue contribution from each cohort"
          [loading]="false"
        >
          <div class="cohort-revenue__chart">
            @for (cohort of sortedCohorts(); track cohort.cohortId) {
              <div class="cohort-revenue__bar-row">
                <div class="cohort-revenue__bar-label">
                  <span class="cohort-revenue__cohort-name">{{ cohort.cohortId }}</span>
                  <span class="cohort-revenue__cohort-size">{{ cohort.size | number }} users</span>
                </div>
                <div class="cohort-revenue__bar-container">
                  <div
                    class="cohort-revenue__bar"
                    [style.width.%]="getRevenueWidth(cohort.totalRevenue || 0)"
                  >
                    <span class="cohort-revenue__bar-value">
                      {{ cohort.totalRevenue | currency:'USD':'symbol':'1.0-0' }}
                    </span>
                  </div>
                </div>
                <div class="cohort-revenue__per-user">
                  {{ getRevenuePerUser(cohort) | currency:'USD':'symbol':'1.0-0' }}/user
                </div>
              </div>
            }
          </div>
        </app-bi-chart-wrapper>

        <!-- Cohort Value Table -->
        <app-bi-chart-wrapper
          title="Cohort Value Analysis"
          subtitle="Detailed revenue metrics by cohort"
          [loading]="false"
        >
          <div class="cohort-revenue__table-wrapper">
            <table class="cohort-revenue__table">
              <thead>
                <tr>
                  <th>Cohort</th>
                  <th>Users</th>
                  <th>Total Revenue</th>
                  <th>Revenue/User</th>
                  <th>Avg Orders</th>
                  <th>AOV</th>
                  <th>Share</th>
                </tr>
              </thead>
              <tbody>
                @for (cohort of revenueData.cohorts; track cohort.cohortId) {
                  <tr>
                    <td class="cohort-revenue__cohort-cell">{{ cohort.cohortId }}</td>
                    <td>{{ cohort.size | number }}</td>
                    <td class="cohort-revenue__revenue-cell">
                      {{ cohort.totalRevenue | currency:'USD':'symbol':'1.0-0' }}
                    </td>
                    <td>{{ getRevenuePerUser(cohort) | currency:'USD':'symbol':'1.0-0' }}</td>
                    <td>{{ cohort.avgOrders || 0 | number:'1.1-1' }}</td>
                    <td>{{ cohort.avgOrderValue || 0 | currency:'USD':'symbol':'1.0-0' }}</td>
                    <td>
                      <div class="cohort-revenue__share">
                        <div
                          class="cohort-revenue__share-bar"
                          [style.width.%]="getRevenueShare(cohort.totalRevenue || 0)"
                        ></div>
                        <span>{{ getRevenueShare(cohort.totalRevenue || 0) | number:'1.1-1' }}%</span>
                      </div>
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
    .cohort-revenue {
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

      &__chart {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        padding: 1.25rem;
      }

      &__bar-row {
        display: grid;
        grid-template-columns: 140px 1fr 100px;
        align-items: center;
        gap: 1rem;
      }

      &__bar-label {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
      }

      &__cohort-name {
        font-weight: 600;
        font-size: 0.875rem;
        color: #111827;
      }

      &__cohort-size {
        font-size: 0.75rem;
        color: #6b7280;
      }

      &__bar-container {
        height: 28px;
        background: #f3f4f6;
        border-radius: 4px;
        overflow: hidden;
      }

      &__bar {
        height: 100%;
        background: linear-gradient(90deg, #0891b2, #06b6d4);
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        padding-right: 0.5rem;
        min-width: 80px;
        transition: width 0.3s ease;
      }

      &__bar-value {
        font-size: 0.75rem;
        font-weight: 600;
        color: white;
        text-shadow: 0 1px 2px rgba(0,0,0,0.2);
      }

      &__per-user {
        font-size: 0.8125rem;
        font-weight: 500;
        color: #059669;
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

      &__share {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      &__share-bar {
        height: 6px;
        background: #0891b2;
        border-radius: 3px;
        min-width: 4px;
      }
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 1024px) {
      .cohort-revenue__kpis { grid-template-columns: repeat(2, 1fr); }
      .cohort-revenue__bar-row { grid-template-columns: 100px 1fr 80px; }
    }

    @media (max-width: 640px) {
      .cohort-revenue__kpis { grid-template-columns: 1fr; }
      .cohort-revenue__bar-row {
        grid-template-columns: 1fr;
        gap: 0.5rem;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, BiChartWrapperComponent, BiKpiCardComponent]
})
export class CohortRevenueComponent implements OnInit {
  private readonly biAnalyticsService = inject(BiAnalyticsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly data = signal<CohortAnalyticsData | null>(null);

  /**
   * Total revenue across all cohorts
   */
  readonly totalRevenue = computed(() => {
    const cohorts = this.data()?.cohorts;
    if (!cohorts) return 0;
    return cohorts.reduce((sum, c) => sum + (c.totalRevenue || 0), 0);
  });

  /**
   * Average revenue per cohort
   */
  readonly avgRevenuePerCohort = computed(() => {
    const cohorts = this.data()?.cohorts;
    if (!cohorts || cohorts.length === 0) return 0;
    return this.totalRevenue() / cohorts.length;
  });

  /**
   * Average revenue per user across all cohorts
   */
  readonly avgRevenuePerUser = computed(() => {
    const cohorts = this.data()?.cohorts;
    if (!cohorts) return 0;
    const totalUsers = cohorts.reduce((sum, c) => sum + c.size, 0);
    return totalUsers > 0 ? this.totalRevenue() / totalUsers : 0;
  });

  /**
   * Top cohort revenue value
   */
  readonly topCohortRevenue = computed(() => {
    const cohorts = this.data()?.cohorts;
    if (!cohorts || cohorts.length === 0) return 0;
    return Math.max(...cohorts.map(c => c.totalRevenue || 0));
  });

  /**
   * Cohorts sorted by revenue (descending)
   */
  readonly sortedCohorts = computed(() => {
    const cohorts = this.data()?.cohorts;
    if (!cohorts) return [];
    return [...cohorts].sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0));
  });

  ngOnInit(): void {
    this.loadData();
  }

  /**
   * Calculate revenue bar width as percentage
   * @param revenue - Cohort revenue
   */
  getRevenueWidth(revenue: number): number {
    const max = this.topCohortRevenue();
    return max > 0 ? (revenue / max) * 100 : 0;
  }

  /**
   * Calculate revenue per user for a cohort
   * @param cohort - Cohort data
   */
  getRevenuePerUser(cohort: CohortData): number {
    return cohort.size > 0 ? (cohort.totalRevenue || 0) / cohort.size : 0;
  }

  /**
   * Calculate revenue share percentage
   * @param revenue - Cohort revenue
   */
  getRevenueShare(revenue: number): number {
    const total = this.totalRevenue();
    return total > 0 ? (revenue / total) * 100 : 0;
  }

  /**
   * Load cohort revenue data from API
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
          this.error.set('Failed to load revenue data.');
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
