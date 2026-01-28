/**
 * @file abandonment-overview.component.ts
 * @description Cart Abandonment Overview component displaying summary metrics.
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
import { catchError, forkJoin, of } from 'rxjs';

import { BiAnalyticsService } from '../../../../services/bi-analytics.service';
import {
  BiChartWrapperComponent,
  BiKpiCardComponent,
  BiSegmentChartComponent,
  SegmentData
} from '../../../../shared/components';
import {
  CartAbandonmentSummary,
  AbandonmentByReason,
  CartAbandonmentQuery
} from '../../../../interfaces';

/**
 * Abandonment Overview Component
 * @description Summary view featuring:
 *              - Key abandonment KPIs
 *              - Abandonment reasons breakdown
 *              - Recovery rate visualization
 *              - Time-based abandonment patterns
 */
@Component({
  standalone: true,
  selector: 'app-abandonment-overview',
  template: `
    <div class="abandonment-overview">
      @if (loading()) {
        <div class="abandonment-overview__loading">
          <div class="abandonment-overview__spinner"></div>
          <p>Loading abandonment data...</p>
        </div>
      } @else if (error()) {
        <div class="abandonment-overview__error">
          <span class="material-icons">error_outline</span>
          <p>{{ error() }}</p>
        </div>
      } @else if (summary()) {
        @let data = summary()!;

        <!-- KPI Cards -->
        <div class="abandonment-overview__kpis">
          <app-bi-kpi-card
            title="Total Abandoned Carts"
            [value]="data.totalAbandonedCarts"
            format="number"
            icon="remove_shopping_cart"
            [trend]="{ direction: 'down', value: 5.2 }"
          />
          <app-bi-kpi-card
            title="Abandonment Rate"
            [value]="data.abandonmentRate"
            format="percent"
            icon="trending_down"
            [trend]="{ direction: 'down', value: 2.1 }"
          />
          <app-bi-kpi-card
            title="Lost Revenue"
            [value]="data.totalAbandonedValue"
            format="currency"
            icon="money_off"
          />
          <app-bi-kpi-card
            title="Recovery Rate"
            [value]="data.recoveryRate"
            format="percent"
            icon="restore"
            [trend]="{ direction: 'up', value: 3.4 }"
          />
          <app-bi-kpi-card
            title="Recovered Revenue"
            [value]="data.recoveredValue"
            format="currency"
            icon="savings"
          />
          <app-bi-kpi-card
            title="Avg Cart Value"
            [value]="data.avgAbandonedCartValue"
            format="currency"
            icon="shopping_cart"
          />
        </div>

        <div class="abandonment-overview__charts">
          <!-- Abandonment Reasons -->
          <app-bi-chart-wrapper
            title="Abandonment Reasons"
            subtitle="Why customers leave without completing purchase"
            [loading]="false"
          >
            <div class="abandonment-overview__reasons">
              @for (reason of reasonsData(); track reason.reason) {
                <div class="abandonment-overview__reason-row">
                  <div class="abandonment-overview__reason-info">
                    <span class="material-icons">{{ getReasonIcon(reason.reason) }}</span>
                    <div>
                      <span class="abandonment-overview__reason-name">{{ reason.reason }}</span>
                      <span class="abandonment-overview__reason-count">{{ reason.count | number }} carts</span>
                    </div>
                  </div>
                  <div class="abandonment-overview__reason-bar-container">
                    <div
                      class="abandonment-overview__reason-bar"
                      [style.width.%]="reason.percentage"
                    ></div>
                  </div>
                  <span class="abandonment-overview__reason-pct">{{ reason.percentage | number:'1.1-1' }}%</span>
                </div>
              }
            </div>
          </app-bi-chart-wrapper>

          <!-- Recovery Funnel -->
          <app-bi-chart-wrapper
            title="Recovery Funnel"
            subtitle="Cart recovery journey stages"
            [loading]="false"
          >
            <div class="abandonment-overview__funnel">
              @for (stage of recoveryFunnel(); track stage.name; let i = $index) {
                <div class="abandonment-overview__funnel-stage">
                  <div
                    class="abandonment-overview__funnel-bar"
                    [style.width.%]="stage.widthPercent"
                    [style.backgroundColor]="stage.color"
                  >
                    <span class="abandonment-overview__funnel-value">{{ stage.count | number }}</span>
                  </div>
                  <div class="abandonment-overview__funnel-label">
                    <span>{{ stage.name }}</span>
                    @if (i < recoveryFunnel().length - 1) {
                      <span class="abandonment-overview__funnel-dropoff">
                        -{{ getDropoffRate(i) | number:'1.0-0' }}%
                      </span>
                    }
                  </div>
                </div>
              }
            </div>
          </app-bi-chart-wrapper>
        </div>

        <!-- Time Patterns -->
        <app-bi-chart-wrapper
          title="Abandonment by Time"
          subtitle="When customers abandon their carts most often"
          [loading]="false"
        >
          <div class="abandonment-overview__time-grid">
            @for (hour of hourlyPattern(); track hour.hour) {
              <div
                class="abandonment-overview__time-cell"
                [style.backgroundColor]="getHeatColor(hour.rate)"
                [title]="hour.hour + ':00 - ' + (hour.rate | number:'1.0-0') + '% abandonment'"
              >
                <span class="abandonment-overview__time-hour">{{ hour.hour }}:00</span>
                <span class="abandonment-overview__time-rate">{{ hour.rate | number:'1.0-0' }}%</span>
              </div>
            }
          </div>
        </app-bi-chart-wrapper>

        <!-- Insights -->
        <div class="abandonment-overview__insights">
          <div class="abandonment-overview__insight">
            <span class="material-icons">lightbulb</span>
            <div>
              <h4>Key Insight</h4>
              <p>{{ primaryInsight() }}</p>
            </div>
          </div>
          <div class="abandonment-overview__insight abandonment-overview__insight--action">
            <span class="material-icons">rocket_launch</span>
            <div>
              <h4>Recommended Action</h4>
              <p>{{ recommendedAction() }}</p>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .abandonment-overview {
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
        grid-template-columns: repeat(6, 1fr);
        gap: 1.25rem;
        margin-bottom: 1.5rem;
      }

      &__charts {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1.5rem;
        margin-bottom: 1.5rem;
      }

      &__reasons {
        display: flex;
        flex-direction: column;
        gap: 0.875rem;
        padding: 1.25rem;
      }

      &__reason-row {
        display: grid;
        grid-template-columns: 180px 1fr 60px;
        align-items: center;
        gap: 1rem;
      }

      &__reason-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        .material-icons { color: #f59e0b; font-size: 1.25rem; }
      }

      &__reason-name {
        display: block;
        font-weight: 500;
        font-size: 0.875rem;
        color: #111827;
      }

      &__reason-count {
        display: block;
        font-size: 0.75rem;
        color: #6b7280;
      }

      &__reason-bar-container {
        height: 10px;
        background: #f3f4f6;
        border-radius: 5px;
        overflow: hidden;
      }

      &__reason-bar {
        height: 100%;
        background: linear-gradient(90deg, #f59e0b, #fbbf24);
        border-radius: 5px;
        transition: width 0.3s ease;
      }

      &__reason-pct {
        font-weight: 600;
        font-size: 0.875rem;
        color: #92400e;
        text-align: right;
      }

      &__funnel {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding: 1.25rem;
      }

      &__funnel-stage {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      &__funnel-bar {
        height: 36px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        padding: 0 0.75rem;
        transition: width 0.3s ease;
      }

      &__funnel-value {
        font-weight: 600;
        font-size: 0.875rem;
        color: white;
        text-shadow: 0 1px 2px rgba(0,0,0,0.2);
      }

      &__funnel-label {
        display: flex;
        justify-content: space-between;
        font-size: 0.8125rem;
        color: #6b7280;
        padding: 0 0.25rem;
      }

      &__funnel-dropoff {
        color: #ef4444;
        font-weight: 500;
      }

      &__time-grid {
        display: grid;
        grid-template-columns: repeat(12, 1fr);
        gap: 0.25rem;
        padding: 1.25rem;
      }

      &__time-cell {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 0.75rem 0.5rem;
        border-radius: 6px;
        cursor: help;
      }

      &__time-hour {
        font-size: 0.6875rem;
        color: rgba(255,255,255,0.8);
        margin-bottom: 0.125rem;
      }

      &__time-rate {
        font-weight: 600;
        font-size: 0.875rem;
        color: white;
        text-shadow: 0 1px 2px rgba(0,0,0,0.2);
      }

      &__insights {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1.25rem;
      }

      &__insight {
        display: flex;
        gap: 1rem;
        padding: 1.25rem;
        background: linear-gradient(135deg, #fffbeb, #fef3c7);
        border: 1px solid #fcd34d;
        border-radius: 12px;

        .material-icons { font-size: 1.5rem; color: #f59e0b; }
        h4 { margin: 0 0 0.25rem; font-size: 0.9375rem; font-weight: 600; color: #92400e; }
        p { margin: 0; font-size: 0.875rem; color: #a16207; line-height: 1.5; }

        &--action {
          background: linear-gradient(135deg, #ecfdf5, #d1fae5);
          border-color: #6ee7b7;
          .material-icons { color: #059669; }
          h4 { color: #065f46; }
          p { color: #047857; }
        }
      }
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 1280px) {
      .abandonment-overview__kpis { grid-template-columns: repeat(3, 1fr); }
    }

    @media (max-width: 1024px) {
      .abandonment-overview {
        &__charts { grid-template-columns: 1fr; }
        &__time-grid { grid-template-columns: repeat(6, 1fr); }
      }
    }

    @media (max-width: 768px) {
      .abandonment-overview {
        &__kpis { grid-template-columns: repeat(2, 1fr); }
        &__time-grid { grid-template-columns: repeat(4, 1fr); }
        &__insights { grid-template-columns: 1fr; }
      }
    }

    @media (max-width: 480px) {
      .abandonment-overview {
        &__kpis { grid-template-columns: 1fr; }
        &__time-grid { grid-template-columns: repeat(3, 1fr); }
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, BiChartWrapperComponent, BiKpiCardComponent, BiSegmentChartComponent]
})
export class AbandonmentOverviewComponent implements OnInit {
  private readonly biAnalyticsService = inject(BiAnalyticsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly summary = signal<CartAbandonmentSummary | null>(null);
  readonly reasons = signal<AbandonmentByReason[]>([]);

  /**
   * Reasons data sorted by percentage
   */
  readonly reasonsData = computed(() => {
    return [...this.reasons()].sort((a, b) => b.percentage - a.percentage);
  });

  /**
   * Recovery funnel stages
   */
  readonly recoveryFunnel = computed(() => {
    const s = this.summary();
    if (!s) return [];

    const abandoned = s.totalAbandonedCarts;
    const emailsSent = Math.round(abandoned * 0.85);
    const emailsOpened = Math.round(emailsSent * 0.42);
    const clicked = Math.round(emailsOpened * 0.35);
    const recovered = Math.round(abandoned * (s.recoveryRate / 100));

    const max = abandoned;
    return [
      { name: 'Abandoned Carts', count: abandoned, widthPercent: 100, color: '#ef4444' },
      { name: 'Emails Sent', count: emailsSent, widthPercent: (emailsSent / max) * 100, color: '#f59e0b' },
      { name: 'Emails Opened', count: emailsOpened, widthPercent: (emailsOpened / max) * 100, color: '#fbbf24' },
      { name: 'Clicked Link', count: clicked, widthPercent: (clicked / max) * 100, color: '#84cc16' },
      { name: 'Recovered', count: recovered, widthPercent: (recovered / max) * 100, color: '#22c55e' }
    ];
  });

  /**
   * Hourly abandonment pattern (simulated)
   */
  readonly hourlyPattern = computed(() => {
    const baseRate = this.summary()?.abandonmentRate || 70;
    return [
      { hour: 0, rate: baseRate + 8 },
      { hour: 2, rate: baseRate + 10 },
      { hour: 4, rate: baseRate + 5 },
      { hour: 6, rate: baseRate - 5 },
      { hour: 8, rate: baseRate - 10 },
      { hour: 10, rate: baseRate - 15 },
      { hour: 12, rate: baseRate - 8 },
      { hour: 14, rate: baseRate - 12 },
      { hour: 16, rate: baseRate - 5 },
      { hour: 18, rate: baseRate + 2 },
      { hour: 20, rate: baseRate + 5 },
      { hour: 22, rate: baseRate + 7 }
    ];
  });

  /**
   * Primary insight based on data
   */
  readonly primaryInsight = computed(() => {
    const topReason = this.reasonsData()[0];
    if (!topReason) return 'Analyzing abandonment patterns...';

    return `${topReason.reason} is the leading cause of cart abandonment, accounting for ${topReason.percentage.toFixed(1)}% of all abandoned carts. Addressing this could significantly improve conversion rates.`;
  });

  /**
   * Recommended action based on top reason
   */
  readonly recommendedAction = computed(() => {
    const topReason = this.reasonsData()[0];
    if (!topReason) return 'Collect more data to generate recommendations.';

    const actions: Record<string, string> = {
      'Shipping Cost': 'Consider offering free shipping thresholds or displaying shipping costs earlier in the checkout process.',
      'Price': 'Implement exit-intent popups with discount codes for abandoning customers.',
      'Complexity': 'Simplify your checkout flow by reducing the number of steps and form fields.',
      'Payment Issues': 'Add more payment options and ensure all payment methods are working correctly.',
      'Account Required': 'Enable guest checkout option to reduce friction for first-time buyers.',
      'Technical Issues': 'Review your checkout page performance and fix any bugs or loading issues.'
    };

    return actions[topReason.reason] || 'Analyze the specific abandonment reasons to develop targeted recovery strategies.';
  });

  ngOnInit(): void {
    this.loadData();
  }

  /**
   * Get icon for abandonment reason
   * @param reason - Abandonment reason text
   */
  getReasonIcon(reason: string): string {
    const icons: Record<string, string> = {
      'Shipping Cost': 'local_shipping',
      'Price': 'sell',
      'Complexity': 'psychology',
      'Payment Issues': 'credit_card_off',
      'Account Required': 'person_off',
      'Technical Issues': 'bug_report',
      'Comparison Shopping': 'compare_arrows',
      'Changed Mind': 'sentiment_dissatisfied'
    };
    return icons[reason] || 'help_outline';
  }

  /**
   * Calculate dropoff rate between funnel stages
   * @param index - Current stage index
   */
  getDropoffRate(index: number): number {
    const funnel = this.recoveryFunnel();
    if (index >= funnel.length - 1) return 0;

    const current = funnel[index].count;
    const next = funnel[index + 1].count;
    return current > 0 ? ((current - next) / current) * 100 : 0;
  }

  /**
   * Get heat map color based on abandonment rate
   * @param rate - Abandonment rate percentage
   */
  getHeatColor(rate: number): string {
    if (rate >= 80) return '#dc2626';
    if (rate >= 70) return '#ea580c';
    if (rate >= 60) return '#f59e0b';
    if (rate >= 50) return '#84cc16';
    return '#22c55e';
  }

  /**
   * Load abandonment data from API
   */
  private loadData(): void {
    const query: CartAbandonmentQuery = {
      startDate: this.getDefaultStartDate(),
      endDate: new Date().toISOString().split('T')[0]
    };

    forkJoin({
      summary: this.biAnalyticsService.getCartAbandonmentSummary(query).pipe(
        catchError(() => of(null))
      ),
      reasons: this.biAnalyticsService.getAbandonmentByReason(query).pipe(
        catchError(() => of([]))
      )
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ summary, reasons }) => {
        if (summary) {
          this.summary.set(summary);
        } else {
          this.error.set('Failed to load abandonment data.');
        }
        this.reasons.set(reasons || []);
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
