/**
 * @file abandonment-dashboard.component.ts
 * @description Main Cart Abandonment Dashboard container component.
 *              Orchestrates abandonment analytics views with navigation and shared state.
 * @module AdminDashboard/Analytics/Abandonment
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
import { CartAbandonmentQuery, TimeGranularity } from '../../interfaces';

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
 * Abandonment Dashboard Component
 * @description Main container for Cart Abandonment Analytics featuring:
 *              - Tab-based navigation between abandonment views
 *              - Shared date range and filter controls
 *              - State management via Angular Signals
 *              - Orange/amber color theme for urgency
 */
@Component({
  standalone: true,
  selector: 'app-abandonment-dashboard',
  template: `
    <div class="abandonment-dashboard">
      <!-- Header -->
      <header class="abandonment-dashboard__header">
        <div class="abandonment-dashboard__title-section">
          <h1 class="abandonment-dashboard__title">
            <span class="material-icons">remove_shopping_cart</span>
            Cart Abandonment Analytics
          </h1>
          <p class="abandonment-dashboard__subtitle">
            Track abandoned carts, recovery rates, and optimize checkout flow
          </p>
        </div>

        <div class="abandonment-dashboard__controls">
          <app-bi-date-range-picker
            [showGranularity]="true"
            (dateChange)="onDateRangeChange($event)"
          />

          <select
            class="abandonment-dashboard__select"
            [value]="cartValueFilter()"
            (change)="onCartValueFilterChange($any($event.target).value)"
          >
            @for (option of cartValueOptions; track option.value) {
              <option [value]="option.value">{{ option.label }}</option>
            }
          </select>

          <button
            class="abandonment-dashboard__btn abandonment-dashboard__btn--primary"
            (click)="onExport()"
          >
            <span class="material-icons">download</span>
            Export
          </button>

          <button
            class="abandonment-dashboard__btn"
            [disabled]="isLoading()"
            (click)="onRefresh()"
          >
            <span class="material-icons" [class.spin]="isLoading()">refresh</span>
          </button>
        </div>
      </header>

      <!-- Quick Stats Banner -->
      <div class="abandonment-dashboard__quick-stats">
        <div class="abandonment-dashboard__stat">
          <span class="abandonment-dashboard__stat-value">{{ abandonmentRate() | number:'1.1-1' }}%</span>
          <span class="abandonment-dashboard__stat-label">Abandonment Rate</span>
        </div>
        <div class="abandonment-dashboard__stat-divider"></div>
        <div class="abandonment-dashboard__stat">
          <span class="abandonment-dashboard__stat-value">{{ recoveredValue() | currency:'USD':'symbol':'1.0-0' }}</span>
          <span class="abandonment-dashboard__stat-label">Recovered Revenue</span>
        </div>
        <div class="abandonment-dashboard__stat-divider"></div>
        <div class="abandonment-dashboard__stat">
          <span class="abandonment-dashboard__stat-value">{{ activeCarts() | number }}</span>
          <span class="abandonment-dashboard__stat-label">Active Abandoned</span>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="abandonment-dashboard__nav">
        <ul class="abandonment-dashboard__tabs">
          @for (tab of navTabs; track tab.id) {
            <li>
              <a
                [routerLink]="tab.path"
                routerLinkActive="active"
                class="abandonment-dashboard__tab"
              >
                <span class="material-icons">{{ tab.icon }}</span>
                {{ tab.label }}
              </a>
            </li>
          }
        </ul>
        <span class="abandonment-dashboard__badge">{{ dateRangeText() }}</span>
      </nav>

      <!-- Content -->
      <main class="abandonment-dashboard__content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .abandonment-dashboard {
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
        .material-icons { color: #f59e0b; font-size: 1.75rem; }
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
        &:focus { border-color: #f59e0b; outline: none; }
      }

      &__btn {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.5rem 0.75rem;
        border: 1px solid #e5e7eb;
        background: white;
        border-radius: 8px;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.15s;
        &:hover { background: #f9fafb; }
        &:disabled { opacity: 0.5; cursor: not-allowed; }
        &--primary {
          background: #f59e0b;
          border-color: #f59e0b;
          color: white;
          &:hover { background: #d97706; }
        }
        .spin { animation: spin 1s linear infinite; }
      }

      &__quick-stats {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 2rem;
        padding: 1rem 1.5rem;
        background: linear-gradient(135deg, #fffbeb, #fef3c7);
        border: 1px solid #fcd34d;
        border-radius: 12px;
        margin-bottom: 1.5rem;
      }

      &__stat {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
      }

      &__stat-value {
        font-size: 1.375rem;
        font-weight: 700;
        color: #92400e;
      }

      &__stat-label {
        font-size: 0.75rem;
        color: #a16207;
        text-transform: uppercase;
        letter-spacing: 0.025em;
      }

      &__stat-divider {
        width: 1px;
        height: 40px;
        background: #fcd34d;
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
        &.active { background: #fef3c7; color: #92400e; }
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
      .abandonment-dashboard {
        padding: 1rem;
        &__header { flex-direction: column; }
        &__quick-stats {
          flex-direction: column;
          gap: 1rem;
        }
        &__stat-divider {
          width: 100%;
          height: 1px;
        }
        &__nav { flex-direction: column; gap: 0.75rem; }
        &__tabs { width: 100%; overflow-x: auto; }
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, BiDateRangePickerComponent]
})
export class AbandonmentDashboardComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly biAnalyticsService = inject(BiAnalyticsService);
  private readonly destroy$ = new Subject<void>();

  /**
   * Navigation tabs configuration
   */
  readonly navTabs: NavTab[] = [
    { id: 'overview', label: 'Overview', path: './overview', icon: 'dashboard', description: 'Summary metrics' },
    { id: 'carts', label: 'Carts', path: './carts', icon: 'shopping_cart', description: 'Active abandoned carts' },
    { id: 'recovery', label: 'Recovery', path: './recovery', icon: 'restore', description: 'Recovery campaigns' },
    { id: 'products', label: 'Products', path: './products', icon: 'inventory_2', description: 'Abandoned products' },
    { id: 'trends', label: 'Trends', path: './trends', icon: 'trending_up', description: 'Time-based analysis' }
  ];

  /**
   * Cart value filter options
   */
  readonly cartValueOptions: Array<{ value: string; label: string }> = [
    { value: 'all', label: 'All Carts' },
    { value: 'high', label: 'High Value (>$100)' },
    { value: 'medium', label: 'Medium ($50-$100)' },
    { value: 'low', label: 'Low Value (<$50)' }
  ];

  // State signals
  readonly activeTab = signal<string>('overview');
  readonly dateRange = signal<DateRange>({
    startDate: this.getDefaultStartDate(),
    endDate: this.getDefaultEndDate()
  });
  readonly cartValueFilter = signal<string>('all');
  readonly isLoading = signal<boolean>(false);

  // Quick stats (would be fetched from API in production)
  readonly abandonmentRate = signal<number>(68.7);
  readonly recoveredValue = signal<number>(24580);
  readonly activeCarts = signal<number>(342);

  /**
   * Computed formatted date range text
   */
  readonly dateRangeText = computed(() => {
    const { startDate, endDate } = this.dateRange();
    const fmt = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
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

  /**
   * Handle date range changes
   * @param event - Date range change event
   */
  onDateRangeChange(event: DateRange & { preset: string }): void {
    this.dateRange.set({
      startDate: event.startDate,
      endDate: event.endDate
    });
  }

  /**
   * Handle cart value filter change
   * @param value - Selected filter value
   */
  onCartValueFilterChange(value: string): void {
    this.cartValueFilter.set(value);
  }

  /**
   * Export abandonment data
   */
  onExport(): void {
    // TODO: Implement export functionality
    console.log('Exporting abandonment data...');
  }

  /**
   * Refresh dashboard data
   */
  onRefresh(): void {
    this.isLoading.set(true);
    setTimeout(() => this.isLoading.set(false), 100);
  }

  /**
   * Detect active tab from current URL
   */
  private detectActiveTab(): void {
    const url = this.router.url;
    const tab = this.navTabs.find(t => url.includes(t.id));
    if (tab) {
      this.activeTab.set(tab.id);
    }
  }

  /**
   * Get default start date (30 days ago)
   */
  private getDefaultStartDate(): string {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  }

  /**
   * Get default end date (today)
   */
  private getDefaultEndDate(): string {
    return new Date().toISOString().split('T')[0];
  }
}
