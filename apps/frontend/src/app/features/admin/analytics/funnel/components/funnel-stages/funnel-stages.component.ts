/**
 * @file funnel-stages.component.ts
 * @description Funnel Stages component for detailed stage-by-stage analysis.
 * @module AdminDashboard/Analytics/Funnel
 */

import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  OnInit,
  DestroyRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';

import { BiAnalyticsService } from '../../../../services/bi-analytics.service';
import { BiChartWrapperComponent } from '../../../../shared/components';
import { FunnelStage, FunnelAnalyticsQuery } from '../../../../interfaces';

/**
 * Funnel Stages Component
 * @description Detailed stage analysis with drill-down capabilities
 */
@Component({
  standalone: true,
  selector: 'app-funnel-stages',
  template: `
    <div class="funnel-stages">
      @if (loading()) {
        <div class="funnel-stages__loading">
          <div class="funnel-stages__spinner"></div>
          <p>Loading stage data...</p>
        </div>
      } @else if (error()) {
        <div class="funnel-stages__error">
          <span class="material-icons">error_outline</span>
          <p>{{ error() }}</p>
        </div>
      } @else {
        <app-bi-chart-wrapper
          title="Stage Analysis"
          subtitle="Detailed metrics for each funnel stage"
          [loading]="false"
        >
          <div class="funnel-stages__content">
            @for (stage of stages(); track stage.stageId) {
              <div class="funnel-stages__card">
                <div class="funnel-stages__card-header">
                  <h4>{{ stage.stageId | titlecase }}</h4>
                  <span class="funnel-stages__users">{{ stage.users | number }} users</span>
                </div>
                <div class="funnel-stages__card-body">
                  <div class="funnel-stages__metric">
                    <span class="funnel-stages__metric-label">Conversion</span>
                    <span class="funnel-stages__metric-value">{{ stage.conversionRate | number:'1.1-1' }}%</span>
                  </div>
                  <div class="funnel-stages__metric">
                    <span class="funnel-stages__metric-label">Avg Time</span>
                    <span class="funnel-stages__metric-value">{{ stage.avgTimeSpent || 0 }}s</span>
                  </div>
                </div>
              </div>
            }
          </div>
        </app-bi-chart-wrapper>
      }
    </div>
  `,
  styles: [`
    .funnel-stages {
      &__loading, &__error {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 3rem;
        gap: 1rem;
      }
      &__spinner {
        width: 40px;
        height: 40px;
        border: 3px solid #e5e7eb;
        border-top-color: #7c3aed;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      &__content {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1rem;
        padding: 1rem;
      }
      &__card {
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 1rem;
      }
      &__card-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.75rem;
        h4 { margin: 0; font-size: 0.9375rem; }
      }
      &__users {
        font-size: 0.8125rem;
        color: #6b7280;
      }
      &__card-body {
        display: flex;
        gap: 1.5rem;
      }
      &__metric {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
      &__metric-label {
        font-size: 0.75rem;
        color: #6b7280;
      }
      &__metric-value {
        font-size: 1.125rem;
        font-weight: 600;
        color: #111827;
      }
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, BiChartWrapperComponent]
})
export class FunnelStagesComponent implements OnInit {
  private readonly biAnalyticsService = inject(BiAnalyticsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly stages = signal<FunnelStage[]>([]);

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    const query: FunnelAnalyticsQuery = {
      startDate: this.getDefaultStartDate(),
      endDate: new Date().toISOString().split('T')[0]
    };

    this.biAnalyticsService.getFunnelAnalytics(query)
      .pipe(
        catchError(err => {
          this.error.set('Failed to load stage data.');
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(data => {
        if (data?.stages) {
          this.stages.set(data.stages);
        }
        this.loading.set(false);
      });
  }

  private getDefaultStartDate(): string {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  }
}
