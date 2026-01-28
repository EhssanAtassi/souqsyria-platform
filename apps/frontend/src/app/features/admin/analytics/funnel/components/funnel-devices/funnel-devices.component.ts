/**
 * @file funnel-devices.component.ts
 * @description Funnel Devices component for device-specific funnel analysis.
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
import { FunnelByDevice, FunnelAnalyticsQuery } from '../../../../interfaces';

/**
 * Funnel Devices Component
 * @description Device-specific funnel breakdown (desktop, mobile, tablet)
 */
@Component({
  standalone: true,
  selector: 'app-funnel-devices',
  template: `
    <div class="funnel-devices">
      @if (loading()) {
        <div class="funnel-devices__loading">
          <div class="funnel-devices__spinner"></div>
          <p>Loading device data...</p>
        </div>
      } @else if (error()) {
        <div class="funnel-devices__error">
          <span class="material-icons">error_outline</span>
          <p>{{ error() }}</p>
        </div>
      } @else {
        <app-bi-chart-wrapper
          title="Funnel by Device"
          subtitle="Conversion performance across device types"
          [loading]="false"
        >
          <div class="funnel-devices__grid">
            @for (device of devices(); track device.deviceType) {
              <div class="funnel-devices__card" [class]="'funnel-devices__card--' + device.deviceType">
                <div class="funnel-devices__card-icon">
                  <span class="material-icons">{{ getDeviceIcon(device.deviceType) }}</span>
                </div>
                <div class="funnel-devices__card-content">
                  <h4>{{ device.deviceType | titlecase }}</h4>
                  <div class="funnel-devices__stats">
                    <div class="funnel-devices__stat">
                      <span class="funnel-devices__stat-value">{{ device.sessions | number }}</span>
                      <span class="funnel-devices__stat-label">Sessions</span>
                    </div>
                    <div class="funnel-devices__stat">
                      <span class="funnel-devices__stat-value">{{ device.conversionRate | number:'1.1-1' }}%</span>
                      <span class="funnel-devices__stat-label">Conversion</span>
                    </div>
                    <div class="funnel-devices__stat">
                      <span class="funnel-devices__stat-value">{{ device.purchases | number }}</span>
                      <span class="funnel-devices__stat-label">Purchases</span>
                    </div>
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
    .funnel-devices {
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
      &__grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1.25rem;
        padding: 1rem;
      }
      &__card {
        display: flex;
        gap: 1rem;
        padding: 1.25rem;
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        border-top-width: 3px;
        &--desktop { border-top-color: #6366f1; }
        &--mobile { border-top-color: #10b981; }
        &--tablet { border-top-color: #f59e0b; }
      }
      &__card-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        background: #e5e7eb;
        border-radius: 12px;
        .material-icons { font-size: 1.5rem; color: #374151; }
      }
      &__card-content {
        flex: 1;
        h4 { margin: 0 0 0.75rem; font-size: 1rem; }
      }
      &__stats {
        display: flex;
        gap: 1.25rem;
      }
      &__stat {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
      }
      &__stat-value {
        font-size: 1rem;
        font-weight: 600;
        color: #111827;
      }
      &__stat-label {
        font-size: 0.6875rem;
        color: #6b7280;
        text-transform: uppercase;
      }
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (max-width: 768px) {
      .funnel-devices__grid { grid-template-columns: 1fr; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, BiChartWrapperComponent]
})
export class FunnelDevicesComponent implements OnInit {
  private readonly biAnalyticsService = inject(BiAnalyticsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly devices = signal<FunnelByDevice[]>([]);

  ngOnInit(): void {
    this.loadData();
  }

  getDeviceIcon(device: string): string {
    const icons: Record<string, string> = {
      desktop: 'computer',
      mobile: 'smartphone',
      tablet: 'tablet'
    };
    return icons[device] || 'devices';
  }

  private loadData(): void {
    const query: FunnelAnalyticsQuery = {
      startDate: this.getDefaultStartDate(),
      endDate: new Date().toISOString().split('T')[0]
    };

    this.biAnalyticsService.getFunnelByDevice(query)
      .pipe(
        catchError(err => {
          this.error.set('Failed to load device data.');
          return of([]);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(data => {
        this.devices.set(data);
        this.loading.set(false);
      });
  }

  private getDefaultStartDate(): string {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  }
}
