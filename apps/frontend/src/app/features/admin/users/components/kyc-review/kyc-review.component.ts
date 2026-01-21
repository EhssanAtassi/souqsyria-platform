/**
 * @file kyc-review.component.ts
 * @description KYC verification queue component for reviewing pending submissions.
 *              Lists pending KYC verifications with sorting and quick actions.
 * @module AdminDashboard/Users/Components
 */

import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil, finalize } from 'rxjs';

import { AdminUsersService } from '../../../services';
import { AdminStatusBadgeComponent, AdminPaginationComponent } from '../../../shared';
import { KycVerificationItem, KycStatus, PaginatedResponse } from '../../../interfaces';

/**
 * KYC Review Component
 * @description Queue-based view for reviewing pending KYC verifications.
 *              Displays submissions awaiting review with actions to approve/reject.
 *
 * @example
 * ```html
 * <app-kyc-review></app-kyc-review>
 * ```
 */
@Component({
  selector: 'app-kyc-review',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSnackBarModule,
    MatTooltipModule,
    AdminStatusBadgeComponent,
    AdminPaginationComponent
  ],
  template: `
    <section class="kyc-review">
      <!-- Header -->
      <header class="kyc-review__header">
        <div class="kyc-review__header-content">
          <nav class="kyc-review__breadcrumb">
            <a routerLink="/admin/users" class="kyc-review__breadcrumb-link">
              <span class="material-icons">arrow_back</span>
              Back to Users
            </a>
          </nav>
          <h2 class="kyc-review__title">KYC Verification Queue</h2>
          <p class="kyc-review__subtitle">
            Review and process pending identity verification submissions.
          </p>
        </div>

        <div class="kyc-review__header-actions">
          <button
            type="button"
            class="kyc-review__action-btn"
            (click)="refresh()"
            [disabled]="isLoading()"
          >
            <span class="material-icons" [class.animate-spin]="isLoading()">refresh</span>
            <span>Refresh</span>
          </button>
        </div>
      </header>

      <!-- Stats Summary -->
      <div class="kyc-review__stats">
        <div class="kyc-review__stat">
          <span class="kyc-review__stat-value">{{ pagination().total }}</span>
          <span class="kyc-review__stat-label">Pending Reviews</span>
        </div>
      </div>

      <!-- Error Alert -->
      <div *ngIf="errorMessage()" class="kyc-review__error">
        <span class="material-icons">error_outline</span>
        <p>{{ errorMessage() }}</p>
        <button type="button" class="kyc-review__error-btn" (click)="refresh()">
          Try Again
        </button>
      </div>

      <!-- Queue Content -->
      <div class="kyc-review__content">
        <!-- Loading State -->
        <div *ngIf="isLoading()" class="kyc-review__loading">
          <span class="material-icons animate-spin">sync</span>
          <p>Loading KYC submissions...</p>
        </div>

        <!-- Queue List -->
        <div *ngIf="!isLoading()" class="kyc-review__list">
          <article
            *ngFor="let item of submissions(); trackBy: trackById"
            class="kyc-card"
            [class.kyc-card--resubmission]="item.isResubmission"
          >
            <div class="kyc-card__main">
              <div class="kyc-card__user">
                <div class="kyc-card__avatar">
                  {{ item.userName.charAt(0) }}
                </div>
                <div class="kyc-card__user-info">
                  <span class="kyc-card__name">{{ item.userName }}</span>
                  <span class="kyc-card__email">{{ item.userEmail }}</span>
                </div>
              </div>

              <div class="kyc-card__details">
                <div class="kyc-card__detail">
                  <span class="kyc-card__detail-label">Document Type</span>
                  <span class="kyc-card__detail-value">{{ item.documentType }}</span>
                </div>
                <div class="kyc-card__detail">
                  <span class="kyc-card__detail-label">Submitted</span>
                  <span class="kyc-card__detail-value">{{ item.submittedAt | date:'mediumDate' }}</span>
                </div>
                <div class="kyc-card__detail">
                  <span class="kyc-card__detail-label">Status</span>
                  <app-admin-status-badge
                    [status]="item.status"
                    [variant]="getStatusVariant(item.status)"
                    size="sm"
                  />
                </div>
              </div>
            </div>

            <div class="kyc-card__meta" *ngIf="item.isResubmission">
              <span class="kyc-card__resubmit-badge">
                <span class="material-icons">replay</span>
                Resubmission
              </span>
              <span *ngIf="item.previousRejectionReason" class="kyc-card__prev-reason">
                Previous: {{ item.previousRejectionReason }}
              </span>
            </div>

            <div class="kyc-card__actions">
              <a
                [routerLink]="['/admin/users/kyc', item.id]"
                class="kyc-card__btn kyc-card__btn--primary"
              >
                <span class="material-icons">visibility</span>
                Review
              </a>
              <button
                type="button"
                class="kyc-card__btn kyc-card__btn--success"
                (click)="quickApprove(item)"
                [disabled]="isProcessing()"
                matTooltip="Quick approve"
              >
                <span class="material-icons">check_circle</span>
              </button>
              <button
                type="button"
                class="kyc-card__btn kyc-card__btn--danger"
                (click)="quickReject(item)"
                [disabled]="isProcessing()"
                matTooltip="Quick reject"
              >
                <span class="material-icons">cancel</span>
              </button>
            </div>
          </article>

          <!-- Empty State -->
          <div *ngIf="submissions().length === 0" class="kyc-review__empty">
            <span class="material-icons">verified_user</span>
            <h3>All caught up!</h3>
            <p>No pending KYC verifications at this time.</p>
          </div>
        </div>

        <!-- Pagination -->
        <div class="kyc-review__pagination" *ngIf="pagination().total > pagination().limit">
          <app-admin-pagination
            [currentPage]="pagination().page"
            [totalPages]="pagination().totalPages"
            [totalItems]="pagination().total"
            [pageSize]="pagination().limit"
            (pageChange)="onPageChange($event)"
          />
        </div>
      </div>
    </section>
  `,
  styles: [`
    .kyc-review {
      padding: 1.5rem;
      max-width: 1200px;
      margin: 0 auto;

      &__header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1.5rem;
        gap: 1rem;
      }

      &__breadcrumb {
        margin-bottom: 0.5rem;
      }

      &__breadcrumb-link {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        color: #6b7280;
        text-decoration: none;
        font-size: 0.875rem;

        &:hover {
          color: #1e3a8a;
        }

        .material-icons {
          font-size: 1.125rem;
        }
      }

      &__title {
        font-size: 1.75rem;
        font-weight: 700;
        color: #1f2937;
        margin: 0 0 0.25rem 0;
      }

      &__subtitle {
        font-size: 0.875rem;
        color: #6b7280;
        margin: 0;
      }

      &__action-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        background: white;
        color: #1f2937;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover:not(:disabled) {
          background: #f9fafb;
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }

      &__stats {
        display: flex;
        gap: 1rem;
        margin-bottom: 1.5rem;
      }

      &__stat {
        display: flex;
        flex-direction: column;
        padding: 1rem 1.5rem;
        background: #eff6ff;
        border-radius: 0.5rem;
      }

      &__stat-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1e3a8a;
      }

      &__stat-label {
        font-size: 0.75rem;
        color: #3b82f6;
      }

      &__error {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem;
        background: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: 0.5rem;
        color: #dc2626;
        margin-bottom: 1.5rem;

        p {
          flex: 1;
          margin: 0;
        }
      }

      &__error-btn {
        padding: 0.375rem 0.75rem;
        background: #dc2626;
        color: white;
        border: none;
        border-radius: 0.375rem;
        cursor: pointer;

        &:hover {
          background: #b91c1c;
        }
      }

      &__content {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 0.75rem;
        overflow: hidden;
      }

      &__loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 3rem;
        color: #6b7280;

        .material-icons {
          font-size: 2rem;
          color: #1e3a8a;
          margin-bottom: 0.5rem;
        }
      }

      &__list {
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      &__empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 3rem;
        text-align: center;

        .material-icons {
          font-size: 3rem;
          color: #047857;
          margin-bottom: 1rem;
        }

        h3 {
          font-size: 1.25rem;
          color: #1f2937;
          margin: 0 0 0.5rem 0;
        }

        p {
          color: #6b7280;
          margin: 0;
        }
      }

      &__pagination {
        padding: 1rem;
        border-top: 1px solid #e5e7eb;
      }
    }

    .kyc-card {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      padding: 1rem;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      transition: all 0.2s ease;

      &:hover {
        border-color: #d1d5db;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      }

      &--resubmission {
        border-left: 3px solid #d97706;
      }

      &__main {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
      }

      &__user {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      &__avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: linear-gradient(135deg, #1e3a8a, #3b82f6);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
      }

      &__user-info {
        display: flex;
        flex-direction: column;
      }

      &__name {
        font-weight: 500;
        color: #1f2937;
      }

      &__email {
        font-size: 0.8125rem;
        color: #6b7280;
      }

      &__details {
        display: flex;
        gap: 1.5rem;
      }

      &__detail {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
      }

      &__detail-label {
        font-size: 0.6875rem;
        color: #9ca3af;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      &__detail-value {
        font-size: 0.875rem;
        color: #1f2937;
      }

      &__meta {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding-top: 0.5rem;
        border-top: 1px dashed #e5e7eb;
      }

      &__resubmit-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.25rem 0.5rem;
        background: #fef3c7;
        color: #92400e;
        font-size: 0.75rem;
        font-weight: 500;
        border-radius: 9999px;

        .material-icons {
          font-size: 0.875rem;
        }
      }

      &__prev-reason {
        font-size: 0.8125rem;
        color: #6b7280;
        font-style: italic;
      }

      &__actions {
        display: flex;
        gap: 0.5rem;
        justify-content: flex-end;
      }

      &__btn {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.375rem 0.75rem;
        border: 1px solid #e5e7eb;
        border-radius: 0.375rem;
        background: white;
        color: #374151;
        font-size: 0.8125rem;
        cursor: pointer;
        transition: all 0.2s ease;
        text-decoration: none;

        .material-icons {
          font-size: 1rem;
        }

        &:hover:not(:disabled) {
          background: #f9fafb;
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        &--primary {
          background: #1e3a8a;
          border-color: #1e3a8a;
          color: white;

          &:hover {
            background: #1e40af;
          }
        }

        &--success {
          border-color: #047857;
          color: #047857;

          &:hover:not(:disabled) {
            background: #ecfdf5;
          }
        }

        &--danger {
          border-color: #dc2626;
          color: #dc2626;

          &:hover:not(:disabled) {
            background: #fef2f2;
          }
        }
      }
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .animate-spin {
      animation: spin 1s linear infinite;
    }

    @media (max-width: 768px) {
      .kyc-review {
        padding: 1rem;

        &__header {
          flex-direction: column;
        }
      }

      .kyc-card {
        &__main {
          flex-direction: column;
          align-items: flex-start;
        }

        &__details {
          flex-wrap: wrap;
          gap: 1rem;
        }

        &__actions {
          width: 100%;
        }

        &__btn--primary {
          flex: 1;
          justify-content: center;
        }
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KycReviewComponent implements OnInit, OnDestroy {
  // =========================================================================
  // DEPENDENCIES
  // =========================================================================

  private readonly usersService = inject(AdminUsersService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  // =========================================================================
  // STATE
  // =========================================================================

  readonly isLoading = signal(false);
  readonly isProcessing = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly submissions = signal<KycVerificationItem[]>([]);
  readonly pagination = signal({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // =========================================================================
  // LIFECYCLE
  // =========================================================================

  ngOnInit(): void {
    this.loadSubmissions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // =========================================================================
  // DATA LOADING
  // =========================================================================

  loadSubmissions(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.usersService.getPendingKycVerifications({
      page: this.pagination().page,
      limit: this.pagination().limit
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (response: PaginatedResponse<KycVerificationItem>) => {
          this.submissions.set(response.items);
          this.pagination.update(p => ({
            ...p,
            total: response.total,
            totalPages: response.totalPages
          }));
        },
        error: (error) => {
          console.error('Failed to load KYC submissions:', error);
          this.errorMessage.set('Failed to load KYC submissions.');
        }
      });
  }

  // =========================================================================
  // ACTIONS
  // =========================================================================

  quickApprove(item: KycVerificationItem): void {
    this.isProcessing.set(true);

    this.usersService.approveKyc(item.id, 'Quick approved from queue')
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isProcessing.set(false))
      )
      .subscribe({
        next: () => {
          this.snackBar.open('KYC approved successfully', 'Close', { duration: 3000 });
          this.loadSubmissions();
        },
        error: (error) => {
          console.error('Failed to approve KYC:', error);
          this.snackBar.open('Failed to approve KYC', 'Close', { duration: 3000 });
        }
      });
  }

  quickReject(item: KycVerificationItem): void {
    // Navigate to detail page for rejection with reason
    this.router.navigate(['/admin/users/kyc', item.id], {
      queryParams: { action: 'reject' }
    });
  }

  onPageChange(event: { page: number }): void {
    this.pagination.update(p => ({ ...p, page: event.page }));
    this.loadSubmissions();
  }

  refresh(): void {
    this.loadSubmissions();
  }

  // =========================================================================
  // UTILITIES
  // =========================================================================

  getStatusVariant(status: KycStatus): string {
    const variantMap: Record<KycStatus, string> = {
      not_submitted: 'secondary',
      pending: 'info',
      under_review: 'warning',
      approved: 'success',
      rejected: 'danger',
      requires_resubmission: 'warning'
    };
    return variantMap[status] || 'secondary';
  }

  trackById(index: number, item: KycVerificationItem): number {
    return item.id;
  }
}
