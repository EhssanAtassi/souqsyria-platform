/**
 * @file cohort-dashboard.component.ts
 * @description Main Cohort Analysis Dashboard container component.
 *              Orchestrates cohort analytics views with navigation and shared state.
 * @module AdminDashboard/Analytics/Cohort
 */

import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  computed,
  OnInit,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { Subject, filter, takeUntil } from 'rxjs';

import { BiAnalyticsService } from '../../services/bi-analytics.service';
import { BiDateRangePickerComponent, DateRange } from '../../shared/components';
import { CohortAnalyticsQuery, CohortType, TimeGranularity } from '../../interfaces';

/**
 * Navigation tab configuration
 */
interface NavTab {
  id: string;
  label: string;
  path: string;
  icon: string;
  description: string;
}

/**
 * Cohort Dashboard Component
 * @description Main container for Cohort Analysis featuring:
 *              - Tab-based navigation between cohort views
 *              - Shared date range and cohort type filters
 *              - State management via Angular Signals
 */
@Component({
  standalone: true,
  selector: 'app-cohort-dashboard',
  template: `
    <div class="cohort-dashboard">
      <!-- Header -->
      <header class="cohort-dashboard__header">
        <div class="cohort-dashboard__title-section">
          <h1 class="cohort-dashboard__title">
            <span class="material-icons">groups</span>
            Cohort Analysis
          </h1>
          <p class="cohort-dashboard__subtitle">
            Track customer retention and behavior over time by cohort
          </p>
        </div>

        <div class="cohort-dashboard__controls">
          <app-bi-date-range-picker
            [showGranularity]="true"
            (dateChange)="onDateRangeChange($event)"
          />

          <select
            class="cohort-dashboard__select"
            [value]="cohortType()"
            (change)="onCohortTypeChange($any($event.target).value)"
          >
            @for (option of cohortTypeOptions; track option.value) {
              <option [value]="option.value">{{ option.label }}</option>
            }
          </select>

          <button
            class="cohort-dashboard__btn"
            [disabled]="isLoading()"
            (click)="onRefresh()"
          >
            <span class="material-icons" [class.spin]="isLoading()">refresh</span>
          </button>
        </div>
      </header>

      <!-- Navigation -->
      <nav class="cohort-dashboard__nav">
        <ul class="cohort-dashboard__tabs">
          @for (tab of navTabs; track tab.id) {
            <li>
              <a
                [routerLink]="tab.path"
                routerLinkActive="active"
                class="cohort-dashboard__tab"
              >
                <span class="material-icons">{{ tab.icon }}</span>
                {{ tab.label }}
              </a>
            </li>
          }
        </ul>
        <span class="cohort-dashboard__badge">{{ dateRangeText() }}</span>
      </nav>

      <!-- Content -->
      <main class="cohort-dashboard__content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .cohort-dashboard {
      max-width: 1600px;
      margin: 0 auto;
      padding: 1.5rem;
      min-height: 100vh;
      background: #f8fafc;

      &__header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 1.5rem;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
      }

      &__title {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin: 0 0 0.375rem;
        font-size: 1.625rem;
        font-weight: 700;
        .material-icons { color: #0891b2; font-size: 1.75rem; }
      }

      &__subtitle {
        margin: 0;
        font-size: 0.9375rem;
        color: #6b7280;
      }

      &__controls {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;
      }

      &__select {
        padding: 0.5rem 0.875rem;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        font-size: 0.875rem;
        cursor: pointer;
        &:focus { border-color: #0891b2; outline: none; }
      }

      &__btn {
        display: flex;
        align-items: center;
        padding: 0.5rem;
        border: 1px solid #e5e7eb;
        background: white;
        border-radius: 8px;
        cursor: pointer;
        &:hover { background: #f9fafb; }
        &:disabled { opacity: 0.5; cursor: not-allowed; }
        .spin { animation: spin 1s linear infinite; }
      }

      &__nav {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 1rem;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        margin-bottom: 1.5rem;
      }

      &__tabs {
        display: flex;
        gap: 0.25rem;
        margin: 0;
        padding: 0;
        list-style: none;
      }

      &__tab {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        font-size: 0.875rem;
        font-weight: 500;
        color: #6b7280;
        text-decoration: none;
        transition: all 0.15s;
        &:hover { background: #f3f4f6; color: #111827; }
        &.active { background: #e0f2fe; color: #0891b2; }
        .material-icons { font-size: 1.125rem; }
      }

      &__badge {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.375rem 0.75rem;
        background: #f3f4f6;
        border-radius: 6px;
        font-size: 0.8125rem;
        color: #6b7280;
      }

      &__content {
        min-height: 400px;
      }
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 768px) {
      .cohort-dashboard {
        padding: 1rem;
        &__header { flex-direction: column; }
        &__nav { flex-direction: column; gap: 0.75rem; }
        &__tabs { width: 100%; overflow-x: auto; }
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, BiDateRangePickerComponent]
})
export class CohortDashboardComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly biAnalyticsService = inject(BiAnalyticsService);
  private readonly destroy$ = new Subject<void>();

  readonly navTabs: NavTab[] = [
    { id: 'overview', label: 'Overview', path: './overview', icon: 'dashboard', description: 'Cohort summary' },
    { id: 'retention', label: 'Retention', path: './retention', icon: 'group_add', description: 'Retention analysis' },
    { id: 'revenue', label: 'Revenue', path: './revenue', icon: 'payments', description: 'Revenue by cohort' },
    { id: 'behavior', label: 'Behavior', path: './behavior', icon: 'psychology', description: 'Behavioral patterns' }
  ];

  readonly cohortTypeOptions: Array<{ value: CohortType; label: string }> = [
    { value: 'first_purchase', label: 'First Purchase' },
    { value: 'registration', label: 'Registration' },
    { value: 'acquisition_date', label: 'Acquisition Date' }
  ];

  readonly activeTab = signal<string>('overview');
  readonly dateRange = signal<DateRange>({ startDate: this.getDefaultStartDate(), endDate: this.getDefaultEndDate() });
  readonly cohortType = signal<CohortType>('first_purchase');
  readonly isLoading = signal<boolean>(false);

  readonly dateRangeText = computed(() => {
    const { startDate, endDate } = this.dateRange();
    const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${fmt.format(new Date(startDate))} - ${fmt.format(new Date(endDate))}`;
  });

  ngOnInit(): void {
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe(() => this.detectActiveTab());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onDateRangeChange(event: DateRange & { preset: string }): void {
    this.dateRange.set({ startDate: event.startDate, endDate: event.endDate });
  }

  onCohortTypeChange(type: CohortType): void {
    this.cohortType.set(type);
  }

  onRefresh(): void {
    this.isLoading.set(true);
    setTimeout(() => this.isLoading.set(false), 100);
  }

  private detectActiveTab(): void {
    const url = this.router.url;
    const tab = this.navTabs.find(t => url.includes(t.id));
    if (tab) this.activeTab.set(tab.id);
  }

  private getDefaultStartDate(): string {
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    return d.toISOString().split('T')[0];
  }

  private getDefaultEndDate(): string {
    return new Date().toISOString().split('T')[0];
  }
}
