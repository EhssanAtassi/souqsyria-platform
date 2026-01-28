/**
 * @file abandoned-carts.component.ts
 * @description Abandoned Carts list component with detailed cart information.
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
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';

import { BiAnalyticsService } from '../../../../services/bi-analytics.service';
import { BiChartWrapperComponent } from '../../../../shared/components';
import { AbandonedCart, CartAbandonmentQuery } from '../../../../interfaces';

/**
 * Abandoned Carts Component
 * @description Lists active abandoned carts with:
 *              - Cart details and items
 *              - Customer information
 *              - Time since abandonment
 *              - Recovery actions
 */
@Component({
  standalone: true,
  selector: 'app-abandoned-carts',
  template: `
    <div class="abandoned-carts">
      @if (loading()) {
        <div class="abandoned-carts__loading">
          <div class="abandoned-carts__spinner"></div>
          <p>Loading abandoned carts...</p>
        </div>
      } @else if (error()) {
        <div class="abandoned-carts__error">
          <span class="material-icons">error_outline</span>
          <p>{{ error() }}</p>
        </div>
      } @else {
        <!-- Filters -->
        <div class="abandoned-carts__filters">
          <div class="abandoned-carts__search">
            <span class="material-icons">search</span>
            <input
              type="text"
              placeholder="Search by customer or email..."
              [ngModel]="searchQuery()"
              (ngModelChange)="searchQuery.set($event)"
            />
          </div>

          <select
            class="abandoned-carts__select"
            [ngModel]="sortBy()"
            (ngModelChange)="sortBy.set($event)"
          >
            <option value="date">Sort by Date</option>
            <option value="value">Sort by Value</option>
            <option value="items">Sort by Items</option>
          </select>

          <select
            class="abandoned-carts__select"
            [ngModel]="timeFilter()"
            (ngModelChange)="timeFilter.set($event)"
          >
            <option value="all">All Time</option>
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>

        <!-- Stats Summary -->
        <div class="abandoned-carts__summary">
          <div class="abandoned-carts__summary-stat">
            <span class="abandoned-carts__summary-value">{{ filteredCarts().length }}</span>
            <span class="abandoned-carts__summary-label">Carts Found</span>
          </div>
          <div class="abandoned-carts__summary-stat">
            <span class="abandoned-carts__summary-value">{{ totalValue() | currency:'USD':'symbol':'1.0-0' }}</span>
            <span class="abandoned-carts__summary-label">Total Value</span>
          </div>
          <div class="abandoned-carts__summary-stat">
            <span class="abandoned-carts__summary-value">{{ avgCartValue() | currency:'USD':'symbol':'1.0-0' }}</span>
            <span class="abandoned-carts__summary-label">Avg Value</span>
          </div>
        </div>

        <!-- Carts List -->
        <app-bi-chart-wrapper
          title="Abandoned Carts"
          [subtitle]="filteredCarts().length + ' carts awaiting recovery'"
          [loading]="false"
        >
          <div class="abandoned-carts__list">
            @for (cart of paginatedCarts(); track cart.cartId) {
              <div class="abandoned-carts__card" [class.abandoned-carts__card--high-value]="cart.totalValue >= 100">
                <div class="abandoned-carts__card-header">
                  <div class="abandoned-carts__customer">
                    <div class="abandoned-carts__avatar">
                      {{ getInitials(cart.customerName || 'Guest') }}
                    </div>
                    <div class="abandoned-carts__customer-info">
                      <span class="abandoned-carts__customer-name">
                        {{ cart.customerName || 'Guest Customer' }}
                      </span>
                      <span class="abandoned-carts__customer-email">{{ cart.customerEmail || 'No email' }}</span>
                    </div>
                  </div>
                  <div class="abandoned-carts__meta">
                    <span class="abandoned-carts__time">
                      <span class="material-icons">schedule</span>
                      {{ getTimeAgo(cart.abandonedAt) }}
                    </span>
                    @if (cart.totalValue >= 100) {
                      <span class="abandoned-carts__badge abandoned-carts__badge--high">High Value</span>
                    }
                  </div>
                </div>

                <div class="abandoned-carts__card-body">
                  <div class="abandoned-carts__items">
                    @for (item of cart.items.slice(0, 3); track item.productId) {
                      <div class="abandoned-carts__item">
                        <span class="abandoned-carts__item-name">{{ item.productName }}</span>
                        <span class="abandoned-carts__item-qty">x{{ item.quantity }}</span>
                        <span class="abandoned-carts__item-price">{{ item.price | currency:'USD' }}</span>
                      </div>
                    }
                    @if (cart.items.length > 3) {
                      <span class="abandoned-carts__more-items">+{{ cart.items.length - 3 }} more items</span>
                    }
                  </div>

                  <div class="abandoned-carts__value">
                    <span class="abandoned-carts__value-label">Cart Total</span>
                    <span class="abandoned-carts__value-amount">{{ cart.totalValue | currency:'USD' }}</span>
                  </div>
                </div>

                <div class="abandoned-carts__card-footer">
                  <div class="abandoned-carts__recovery-status">
                    @if (cart.recoveryEmailSent) {
                      <span class="abandoned-carts__status abandoned-carts__status--sent">
                        <span class="material-icons">mail</span>
                        Email Sent
                      </span>
                    } @else {
                      <span class="abandoned-carts__status abandoned-carts__status--pending">
                        <span class="material-icons">pending</span>
                        Pending
                      </span>
                    }
                  </div>

                  <div class="abandoned-carts__actions">
                    <button class="abandoned-carts__action-btn" title="Send recovery email">
                      <span class="material-icons">send</span>
                    </button>
                    <button class="abandoned-carts__action-btn" title="View details">
                      <span class="material-icons">visibility</span>
                    </button>
                    <button class="abandoned-carts__action-btn abandoned-carts__action-btn--danger" title="Dismiss">
                      <span class="material-icons">close</span>
                    </button>
                  </div>
                </div>
              </div>
            } @empty {
              <div class="abandoned-carts__empty">
                <span class="material-icons">shopping_cart</span>
                <p>No abandoned carts found matching your criteria</p>
              </div>
            }
          </div>

          <!-- Pagination -->
          @if (totalPages() > 1) {
            <div class="abandoned-carts__pagination">
              <button
                class="abandoned-carts__page-btn"
                [disabled]="currentPage() === 1"
                (click)="currentPage.set(currentPage() - 1)"
              >
                <span class="material-icons">chevron_left</span>
              </button>
              <span class="abandoned-carts__page-info">
                Page {{ currentPage() }} of {{ totalPages() }}
              </span>
              <button
                class="abandoned-carts__page-btn"
                [disabled]="currentPage() === totalPages()"
                (click)="currentPage.set(currentPage() + 1)"
              >
                <span class="material-icons">chevron_right</span>
              </button>
            </div>
          }
        </app-bi-chart-wrapper>
      }
    </div>
  `,
  styles: [`
    .abandoned-carts {
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

      &__filters {
        display: flex;
        gap: 0.75rem;
        margin-bottom: 1rem;
        flex-wrap: wrap;
      }

      &__search {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex: 1;
        min-width: 250px;
        padding: 0.5rem 0.75rem;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        .material-icons { color: #9ca3af; font-size: 1.25rem; }
        input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 0.875rem;
        }
      }

      &__select {
        padding: 0.5rem 0.75rem;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        font-size: 0.875rem;
        cursor: pointer;
      }

      &__summary {
        display: flex;
        gap: 2rem;
        padding: 1rem 1.25rem;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        margin-bottom: 1.5rem;
      }

      &__summary-stat {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
      }

      &__summary-value {
        font-size: 1.25rem;
        font-weight: 700;
        color: #111827;
      }

      &__summary-label {
        font-size: 0.75rem;
        color: #6b7280;
        text-transform: uppercase;
      }

      &__list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1rem;
      }

      &__card {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        overflow: hidden;
        transition: box-shadow 0.15s;
        &:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
        &--high-value { border-left: 3px solid #f59e0b; }
      }

      &__card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.25rem;
        background: #f9fafb;
        border-bottom: 1px solid #e5e7eb;
      }

      &__customer {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      &__avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: linear-gradient(135deg, #f59e0b, #fbbf24);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 0.875rem;
        color: white;
      }

      &__customer-name {
        display: block;
        font-weight: 600;
        color: #111827;
      }

      &__customer-email {
        display: block;
        font-size: 0.8125rem;
        color: #6b7280;
      }

      &__meta {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      &__time {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.8125rem;
        color: #6b7280;
        .material-icons { font-size: 1rem; }
      }

      &__badge {
        padding: 0.25rem 0.5rem;
        border-radius: 12px;
        font-size: 0.6875rem;
        font-weight: 600;
        text-transform: uppercase;
        &--high { background: #fef3c7; color: #92400e; }
      }

      &__card-body {
        display: flex;
        justify-content: space-between;
        padding: 1rem 1.25rem;
        gap: 1.5rem;
      }

      &__items {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      &__item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-size: 0.875rem;
      }

      &__item-name {
        flex: 1;
        color: #374151;
      }

      &__item-qty {
        color: #6b7280;
        font-size: 0.8125rem;
      }

      &__item-price {
        font-weight: 500;
        color: #111827;
      }

      &__more-items {
        font-size: 0.8125rem;
        color: #f59e0b;
        font-weight: 500;
      }

      &__value {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.125rem;
      }

      &__value-label {
        font-size: 0.75rem;
        color: #6b7280;
      }

      &__value-amount {
        font-size: 1.25rem;
        font-weight: 700;
        color: #059669;
      }

      &__card-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 1.25rem;
        background: #f9fafb;
        border-top: 1px solid #e5e7eb;
      }

      &__status {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        font-size: 0.8125rem;
        font-weight: 500;
        .material-icons { font-size: 1rem; }
        &--sent { color: #059669; }
        &--pending { color: #f59e0b; }
      }

      &__actions {
        display: flex;
        gap: 0.5rem;
      }

      &__action-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border: 1px solid #e5e7eb;
        background: white;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.15s;
        .material-icons { font-size: 1.125rem; color: #6b7280; }
        &:hover { background: #f3f4f6; }
        &--danger:hover { background: #fef2f2; .material-icons { color: #dc2626; } }
      }

      &__empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 3rem;
        color: #6b7280;
        .material-icons { font-size: 3rem; opacity: 0.5; margin-bottom: 0.5rem; }
      }

      &__pagination {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        border-top: 1px solid #e5e7eb;
      }

      &__page-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border: 1px solid #e5e7eb;
        background: white;
        border-radius: 6px;
        cursor: pointer;
        &:hover:not(:disabled) { background: #f3f4f6; }
        &:disabled { opacity: 0.5; cursor: not-allowed; }
      }

      &__page-info {
        font-size: 0.875rem;
        color: #6b7280;
      }
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 768px) {
      .abandoned-carts {
        &__card-body { flex-direction: column; }
        &__value { align-items: flex-start; }
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, BiChartWrapperComponent]
})
export class AbandonedCartsComponent implements OnInit {
  private readonly biAnalyticsService = inject(BiAnalyticsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly carts = signal<AbandonedCart[]>([]);

  // Filter and sort signals
  readonly searchQuery = signal<string>('');
  readonly sortBy = signal<string>('date');
  readonly timeFilter = signal<string>('all');
  readonly currentPage = signal<number>(1);
  readonly pageSize = 10;

  /**
   * Filtered carts based on search and time filter
   */
  readonly filteredCarts = computed(() => {
    let result = [...this.carts()];
    const query = this.searchQuery().toLowerCase();

    // Search filter
    if (query) {
      result = result.filter(c =>
        (c.customerName?.toLowerCase().includes(query)) ||
        (c.customerEmail?.toLowerCase().includes(query))
      );
    }

    // Time filter
    const now = Date.now();
    const timeFilters: Record<string, number> = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };

    if (this.timeFilter() !== 'all' && timeFilters[this.timeFilter()]) {
      const threshold = now - timeFilters[this.timeFilter()];
      result = result.filter(c => new Date(c.abandonedAt).getTime() >= threshold);
    }

    // Sort
    const sort = this.sortBy();
    result.sort((a, b) => {
      if (sort === 'value') return b.totalValue - a.totalValue;
      if (sort === 'items') return b.items.length - a.items.length;
      return new Date(b.abandonedAt).getTime() - new Date(a.abandonedAt).getTime();
    });

    return result;
  });

  /**
   * Paginated carts for current page
   */
  readonly paginatedCarts = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredCarts().slice(start, start + this.pageSize);
  });

  /**
   * Total number of pages
   */
  readonly totalPages = computed(() =>
    Math.ceil(this.filteredCarts().length / this.pageSize)
  );

  /**
   * Total value of filtered carts
   */
  readonly totalValue = computed(() =>
    this.filteredCarts().reduce((sum, c) => sum + c.totalValue, 0)
  );

  /**
   * Average cart value
   */
  readonly avgCartValue = computed(() => {
    const carts = this.filteredCarts();
    return carts.length > 0 ? this.totalValue() / carts.length : 0;
  });

  ngOnInit(): void {
    this.loadData();
  }

  /**
   * Get initials from name
   * @param name - Customer name
   */
  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  /**
   * Get time ago string
   * @param dateStr - ISO date string
   */
  getTimeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }

  /**
   * Load abandoned carts from API
   */
  private loadData(): void {
    const query: CartAbandonmentQuery = {
      startDate: this.getDefaultStartDate(),
      endDate: new Date().toISOString().split('T')[0]
    };

    this.biAnalyticsService.getAbandonedCarts(query)
      .pipe(
        catchError(err => {
          this.error.set('Failed to load abandoned carts.');
          return of([]);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(carts => {
        this.carts.set(carts);
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
