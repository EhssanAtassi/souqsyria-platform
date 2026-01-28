/**
 * @file funnel-dropoffs.component.ts
 * @description Funnel Drop-offs component for drop-off point analysis.
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
import { FunnelDropoffPoint, FunnelAnalyticsQuery } from '../../../../interfaces';

/**
 * Funnel Drop-offs Component
 * @description Analysis of where users drop off in the funnel
 */
@Component({
  standalone: true,
  selector: 'app-funnel-dropoffs',
  template: `
    <div class="funnel-dropoffs">
      @if (loading()) {
        <div class="funnel-dropoffs__loading">
          <div class="funnel-dropoffs__spinner"></div>
          <p>Loading drop-off data...</p>
        </div>
      } @else if (error()) {
        <div class="funnel-dropoffs__error">
          <span class="material-icons">error_outline</span>
          <p>{{ error() }}</p>
        </div>
      } @else {
        <app-bi-chart-wrapper
          title="Drop-off Analysis"
          subtitle="Identify where users leave the funnel"
          [loading]="false"
        >
          <div class="funnel-dropoffs__list">
            @for (dropoff of dropoffs(); track dropoff.fromStage + dropoff.toStage) {
              <div class="funnel-dropoffs__item">
                <div class="funnel-dropoffs__transition">
                  <span class="funnel-dropoffs__stage">{{ dropoff.fromStage | titlecase }}</span>
                  <span class="material-icons">arrow_forward</span>
                  <span class="funnel-dropoffs__stage">{{ dropoff.toStage | titlecase }}</span>
                </div>
                <div class="funnel-dropoffs__metrics">
                  <div class="funnel-dropoffs__metric">
                    <span class="funnel-dropoffs__metric-value funnel-dropoffs__metric-value--danger">
                      {{ dropoff.dropoffRate | number:'1.1-1' }}%
                    </span>
                    <span class="funnel-dropoffs__metric-label">Drop-off Rate</span>
                  </div>
                  <div class="funnel-dropoffs__metric">
                    <span class="funnel-dropoffs__metric-value">{{ dropoff.usersLost | number }}</span>
                    <span class="funnel-dropoffs__metric-label">Users Lost</span>
                  </div>
                </div>
                @if (dropoff.topExitPages && dropoff.topExitPages.length > 0) {
                  <div class="funnel-dropoffs__exit-pages">
                    <span class="funnel-dropoffs__exit-label">Top Exit Pages:</span>
                    @for (page of dropoff.topExitPages.slice(0, 3); track page.url) {
                      <span class="funnel-dropoffs__exit-page">{{ page.url }}</span>
                    }
                  </div>
                }
              </div>
            }
          </div>
        </app-bi-chart-wrapper>
      }
    </div>
  `,
  styles: [`
    .funnel-dropoffs {
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
        border-top-color: #7c3aed;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      &__list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1rem;
      }
      &__item {
        padding: 1rem 1.25rem;
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-left: 3px solid #ef4444;
        border-radius: 8px;
      }
      &__transition {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
        .material-icons { font-size: 1.25rem; color: #9ca3af; }
      }
      &__stage {
        font-weight: 500;
        color: #374151;
      }
      &__metrics {
        display: flex;
        gap: 2rem;
        margin-bottom: 0.75rem;
      }
      &__metric {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
      }
      &__metric-value {
        font-size: 1.125rem;
        font-weight: 600;
        color: #111827;
        &--danger { color: #ef4444; }
      }
      &__metric-label {
        font-size: 0.75rem;
        color: #6b7280;
      }
      &__exit-pages {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        align-items: center;
        font-size: 0.8125rem;
      }
      &__exit-label {
        color: #6b7280;
      }
      &__exit-page {
        padding: 0.25rem 0.5rem;
        background: #e5e7eb;
        border-radius: 4px;
        color: #374151;
        font-family: monospace;
        font-size: 0.75rem;
      }
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, BiChartWrapperComponent]
})
export class FunnelDropoffsComponent implements OnInit {
  private readonly biAnalyticsService = inject(BiAnalyticsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly dropoffs = signal<FunnelDropoffPoint[]>([]);

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    const query: FunnelAnalyticsQuery = {
      startDate: this.getDefaultStartDate(),
      endDate: new Date().toISOString().split('T')[0],
      includeExitPages: true
    };

    this.biAnalyticsService.getFunnelDropoffs(query)
      .pipe(
        catchError(err => {
          this.error.set('Failed to load drop-off data.');
          return of([]);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(data => {
        this.dropoffs.set(data);
        this.loading.set(false);
      });
  }

  private getDefaultStartDate(): string {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  }
}
