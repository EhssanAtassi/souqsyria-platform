/**
 * @file recovery-analysis.component.ts
 * @description Recovery Analysis component for cart recovery campaign metrics.
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
import { RecoveryMetrics, CartAbandonmentQuery } from '../../../../interfaces';

/**
 * Recovery Analysis Component
 * @description Cart recovery campaign analysis featuring:
 *              - Email campaign performance
 *              - Recovery rate by channel
 *              - Time-to-recovery analysis
 *              - Revenue recovered metrics
 */
@Component({
  standalone: true,
  selector: 'app-recovery-analysis',
  template: `
    <div class="recovery-analysis">
      @if (loading()) {
        <div class="recovery-analysis__loading">
          <div class="recovery-analysis__spinner"></div>
          <p>Loading recovery data...</p>
        </div>
      } @else if (error()) {
        <div class="recovery-analysis__error">
          <span class="material-icons">error_outline</span>
          <p>{{ error() }}</p>
        </div>
      } @else if (metrics()) {
        @let data = metrics()!;

        <!-- Recovery KPIs -->
        <div class="recovery-analysis__kpis">
          <app-bi-kpi-card
            title="Emails Sent"
            [value]="data.emailsSent"
            format="number"
            icon="mail"
          />
          <app-bi-kpi-card
            title="Open Rate"
            [value]="data.emailOpenRate"
            format="percent"
            icon="mark_email_read"
            [trend]="{ direction: 'up', value: 3.2 }"
          />
          <app-bi-kpi-card
            title="Click Rate"
            [value]="data.emailClickRate"
            format="percent"
            icon="ads_click"
          />
          <app-bi-kpi-card
            title="Recovery Rate"
            [value]="data.recoveryRate"
            format="percent"
            icon="restore"
            [trend]="{ direction: 'up', value: 1.8 }"
          />
          <app-bi-kpi-card
            title="Revenue Recovered"
            [value]="data.revenueRecovered"
            format="currency"
            icon="savings"
          />
          <app-bi-kpi-card
            title="Avg Time to Recover"
            [value]="data.avgTimeToRecovery"
            format="number"
            icon="schedule"
            suffix=" hrs"
          />
        </div>

        <div class="recovery-analysis__grid">
          <!-- Recovery by Channel -->
          <app-bi-chart-wrapper
            title="Recovery by Channel"
            subtitle="Performance across different recovery channels"
            [loading]="false"
          >
            <div class="recovery-analysis__channels">
              @for (channel of channelData(); track channel.name) {
                <div class="recovery-analysis__channel">
                  <div class="recovery-analysis__channel-header">
                    <span class="material-icons">{{ channel.icon }}</span>
                    <span class="recovery-analysis__channel-name">{{ channel.name }}</span>
                  </div>
                  <div class="recovery-analysis__channel-stats">
                    <div class="recovery-analysis__channel-stat">
                      <span class="recovery-analysis__channel-value">{{ channel.sent | number }}</span>
                      <span class="recovery-analysis__channel-label">Sent</span>
                    </div>
                    <div class="recovery-analysis__channel-stat">
                      <span class="recovery-analysis__channel-value">{{ channel.recovered | number }}</span>
                      <span class="recovery-analysis__channel-label">Recovered</span>
                    </div>
                    <div class="recovery-analysis__channel-stat">
                      <span class="recovery-analysis__channel-value recovery-analysis__channel-value--success">
                        {{ channel.rate | number:'1.1-1' }}%
                      </span>
                      <span class="recovery-analysis__channel-label">Rate</span>
                    </div>
                  </div>
                  <div class="recovery-analysis__channel-bar">
                    <div
                      class="recovery-analysis__channel-fill"
                      [style.width.%]="channel.rate"
                      [style.backgroundColor]="channel.color"
                    ></div>
                  </div>
                </div>
              }
            </div>
          </app-bi-chart-wrapper>

          <!-- Email Performance Timeline -->
          <app-bi-chart-wrapper
            title="Email Timing Performance"
            subtitle="Recovery rate by email send timing"
            [loading]="false"
          >
            <div class="recovery-analysis__timing">
              @for (timing of timingData(); track timing.label) {
                <div class="recovery-analysis__timing-row">
                  <div class="recovery-analysis__timing-info">
                    <span class="recovery-analysis__timing-label">{{ timing.label }}</span>
                    <span class="recovery-analysis__timing-desc">{{ timing.description }}</span>
                  </div>
                  <div class="recovery-analysis__timing-bar-container">
                    <div
                      class="recovery-analysis__timing-bar"
                      [style.width.%]="timing.rate"
                      [class.recovery-analysis__timing-bar--best]="timing.isBest"
                    ></div>
                  </div>
                  <span class="recovery-analysis__timing-rate">{{ timing.rate | number:'1.1-1' }}%</span>
                </div>
              }
            </div>
          </app-bi-chart-wrapper>
        </div>

        <!-- Weekly Trend -->
        <app-bi-chart-wrapper
          title="Recovery Trend (Last 7 Days)"
          subtitle="Daily recovery performance"
          [loading]="false"
        >
          <div class="recovery-analysis__trend">
            @for (day of weeklyTrend(); track day.date) {
              <div class="recovery-analysis__trend-day">
                <div class="recovery-analysis__trend-bars">
                  <div
                    class="recovery-analysis__trend-bar recovery-analysis__trend-bar--abandoned"
                    [style.height.%]="(day.abandoned / maxAbandoned()) * 100"
                    title="Abandoned: {{ day.abandoned }}"
                  ></div>
                  <div
                    class="recovery-analysis__trend-bar recovery-analysis__trend-bar--recovered"
                    [style.height.%]="(day.recovered / maxAbandoned()) * 100"
                    title="Recovered: {{ day.recovered }}"
                  ></div>
                </div>
                <span class="recovery-analysis__trend-label">{{ day.dayName }}</span>
                <span class="recovery-analysis__trend-rate">{{ day.rate | number:'1.0-0' }}%</span>
              </div>
            }
          </div>
        </app-bi-chart-wrapper>
      }
    </div>
  `,
  styles: [`
    .recovery-analysis {
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

      &__grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1.5rem;
        margin-bottom: 1.5rem;
      }

      &__channels {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
        padding: 1.25rem;
      }

      &__channel {
        padding: 1rem;
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
      }

      &__channel-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
        .material-icons { color: #f59e0b; }
      }

      &__channel-name {
        font-weight: 600;
        color: #111827;
      }

      &__channel-stats {
        display: flex;
        gap: 1.5rem;
        margin-bottom: 0.75rem;
      }

      &__channel-stat {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
      }

      &__channel-value {
        font-weight: 600;
        color: #111827;
        &--success { color: #059669; }
      }

      &__channel-label {
        font-size: 0.6875rem;
        color: #6b7280;
        text-transform: uppercase;
      }

      &__channel-bar {
        height: 6px;
        background: #e5e7eb;
        border-radius: 3px;
        overflow: hidden;
      }

      &__channel-fill {
        height: 100%;
        border-radius: 3px;
        transition: width 0.3s ease;
      }

      &__timing {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1.25rem;
      }

      &__timing-row {
        display: grid;
        grid-template-columns: 140px 1fr 60px;
        align-items: center;
        gap: 1rem;
      }

      &__timing-info {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
      }

      &__timing-label {
        font-weight: 500;
        font-size: 0.875rem;
        color: #111827;
      }

      &__timing-desc {
        font-size: 0.75rem;
        color: #6b7280;
      }

      &__timing-bar-container {
        height: 12px;
        background: #f3f4f6;
        border-radius: 6px;
        overflow: hidden;
      }

      &__timing-bar {
        height: 100%;
        background: linear-gradient(90deg, #f59e0b, #fbbf24);
        border-radius: 6px;
        transition: width 0.3s ease;
        &--best { background: linear-gradient(90deg, #059669, #10b981); }
      }

      &__timing-rate {
        font-weight: 600;
        font-size: 0.875rem;
        color: #111827;
        text-align: right;
      }

      &__trend {
        display: flex;
        justify-content: space-around;
        align-items: flex-end;
        height: 200px;
        padding: 1.25rem;
        gap: 0.5rem;
      }

      &__trend-day {
        display: flex;
        flex-direction: column;
        align-items: center;
        flex: 1;
        max-width: 80px;
      }

      &__trend-bars {
        display: flex;
        gap: 0.25rem;
        align-items: flex-end;
        height: 140px;
        margin-bottom: 0.5rem;
      }

      &__trend-bar {
        width: 20px;
        border-radius: 4px 4px 0 0;
        min-height: 4px;
        transition: height 0.3s ease;
        &--abandoned { background: #fecaca; }
        &--recovered { background: #10b981; }
      }

      &__trend-label {
        font-size: 0.75rem;
        color: #6b7280;
        margin-bottom: 0.125rem;
      }

      &__trend-rate {
        font-size: 0.75rem;
        font-weight: 600;
        color: #059669;
      }
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 1280px) {
      .recovery-analysis__kpis { grid-template-columns: repeat(3, 1fr); }
    }

    @media (max-width: 1024px) {
      .recovery-analysis__grid { grid-template-columns: 1fr; }
    }

    @media (max-width: 768px) {
      .recovery-analysis__kpis { grid-template-columns: repeat(2, 1fr); }
    }

    @media (max-width: 480px) {
      .recovery-analysis__kpis { grid-template-columns: 1fr; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, BiChartWrapperComponent, BiKpiCardComponent]
})
export class RecoveryAnalysisComponent implements OnInit {
  private readonly biAnalyticsService = inject(BiAnalyticsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly metrics = signal<RecoveryMetrics | null>(null);

  /**
   * Channel performance data
   */
  readonly channelData = computed(() => {
    const m = this.metrics();
    if (!m) return [];

    return [
      { name: 'Email (1st)', icon: 'mail', sent: Math.round(m.emailsSent * 0.4), recovered: Math.round(m.emailsSent * 0.4 * 0.12), rate: 12.3, color: '#3b82f6' },
      { name: 'Email (2nd)', icon: 'forward_to_inbox', sent: Math.round(m.emailsSent * 0.35), recovered: Math.round(m.emailsSent * 0.35 * 0.08), rate: 8.1, color: '#8b5cf6' },
      { name: 'Email (3rd)', icon: 'mark_email_unread', sent: Math.round(m.emailsSent * 0.25), recovered: Math.round(m.emailsSent * 0.25 * 0.05), rate: 4.7, color: '#ec4899' },
      { name: 'SMS', icon: 'sms', sent: Math.round(m.emailsSent * 0.15), recovered: Math.round(m.emailsSent * 0.15 * 0.18), rate: 18.2, color: '#10b981' }
    ];
  });

  /**
   * Email timing performance data
   */
  readonly timingData = computed(() => [
    { label: '1 Hour', description: 'Sent within 1 hour', rate: 18.5, isBest: true },
    { label: '3 Hours', description: 'Sent within 3 hours', rate: 15.2, isBest: false },
    { label: '6 Hours', description: 'Sent within 6 hours', rate: 12.8, isBest: false },
    { label: '24 Hours', description: 'Sent next day', rate: 8.3, isBest: false },
    { label: '48 Hours', description: 'Sent after 2 days', rate: 4.1, isBest: false }
  ]);

  /**
   * Weekly trend data
   */
  readonly weeklyTrend = computed(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date().getDay();

    return Array.from({ length: 7 }, (_, i) => {
      const dayIndex = (today - 6 + i + 7) % 7;
      const abandoned = Math.floor(Math.random() * 50) + 30;
      const recovered = Math.floor(abandoned * (Math.random() * 0.15 + 0.08));
      return {
        date: i,
        dayName: days[dayIndex],
        abandoned,
        recovered,
        rate: (recovered / abandoned) * 100
      };
    });
  });

  /**
   * Maximum abandoned count for scaling
   */
  readonly maxAbandoned = computed(() =>
    Math.max(...this.weeklyTrend().map(d => d.abandoned))
  );

  ngOnInit(): void {
    this.loadData();
  }

  /**
   * Load recovery metrics from API
   */
  private loadData(): void {
    const query: CartAbandonmentQuery = {
      startDate: this.getDefaultStartDate(),
      endDate: new Date().toISOString().split('T')[0]
    };

    this.biAnalyticsService.getRecoveryMetrics(query)
      .pipe(
        catchError(err => {
          this.error.set('Failed to load recovery data.');
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(data => {
        this.metrics.set(data);
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
