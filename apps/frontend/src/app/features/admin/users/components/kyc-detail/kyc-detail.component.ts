/**
 * @file kyc-detail.component.ts
 * @description KYC detail component for reviewing individual KYC submissions.
 *              Displays documents and allows approve/reject/request resubmission.
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
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil, finalize } from 'rxjs';

import { AdminUsersService } from '../../../services';
import { AdminStatusBadgeComponent } from '../../../shared';
import { KycStatus, ReviewKycRequest } from '../../../interfaces';

/**
 * KYC Details interface
 */
interface KycDetails {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  status: KycStatus;
  documentType: string;
  documents: { type: string; url: string; uploadedAt: Date }[];
  submittedAt: Date;
  reviewHistory: { action: string; timestamp: Date; reviewer?: string; notes?: string }[];
}

/**
 * KYC Detail Component
 * @description Detailed view for KYC verification with document preview and review actions.
 */
@Component({
  selector: 'app-kyc-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatSnackBarModule,
    AdminStatusBadgeComponent
  ],
  template: `
    <section class="kyc-detail">
      <!-- Breadcrumb -->
      <nav class="kyc-detail__breadcrumb">
        <a routerLink="/admin/users/kyc" class="kyc-detail__breadcrumb-link">
          <span class="material-icons">arrow_back</span>
          Back to KYC Queue
        </a>
      </nav>

      <!-- Loading State -->
      <div *ngIf="isLoading()" class="kyc-detail__loading">
        <span class="material-icons animate-spin">sync</span>
        <p>Loading KYC details...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="errorMessage()" class="kyc-detail__error">
        <span class="material-icons">error_outline</span>
        <p>{{ errorMessage() }}</p>
        <button type="button" (click)="loadKycDetails()">Try Again</button>
      </div>

      <!-- Main Content -->
      <ng-container *ngIf="!isLoading() && kycDetails()">
        <!-- Header -->
        <header class="kyc-detail__header">
          <div class="kyc-detail__header-info">
            <h2 class="kyc-detail__title">KYC Verification Review</h2>
            <div class="kyc-detail__user">
              <span class="kyc-detail__user-name">{{ kycDetails()?.userName }}</span>
              <span class="kyc-detail__user-email">{{ kycDetails()?.userEmail }}</span>
            </div>
          </div>
          <app-admin-status-badge
            [status]="kycDetails()?.status || 'unknown'"
            [variant]="getStatusVariant(kycDetails()?.status!)"
          />
        </header>

        <!-- Two Column Layout -->
        <div class="kyc-detail__content">
          <!-- Left: Documents -->
          <div class="kyc-detail__documents">
            <h3 class="kyc-detail__section-title">Submitted Documents</h3>

            <div class="kyc-detail__doc-grid">
              <article
                *ngFor="let doc of kycDetails()?.documents"
                class="doc-card"
              >
                <div class="doc-card__preview">
                  <img
                    [src]="doc.url"
                    [alt]="doc.type"
                    class="doc-card__image"
                    (click)="openDocument(doc.url)"
                  />
                  <button
                    type="button"
                    class="doc-card__zoom"
                    (click)="openDocument(doc.url)"
                    title="View full size"
                  >
                    <span class="material-icons">zoom_in</span>
                  </button>
                </div>
                <div class="doc-card__info">
                  <span class="doc-card__type">{{ doc.type }}</span>
                  <span class="doc-card__date">{{ doc.uploadedAt | date:'mediumDate' }}</span>
                </div>
              </article>
            </div>

            <!-- Document Type -->
            <div class="kyc-detail__doc-meta">
              <span class="kyc-detail__meta-label">Document Type:</span>
              <span class="kyc-detail__meta-value">{{ kycDetails()?.documentType }}</span>
            </div>

            <div class="kyc-detail__doc-meta">
              <span class="kyc-detail__meta-label">Submitted:</span>
              <span class="kyc-detail__meta-value">{{ kycDetails()?.submittedAt | date:'medium' }}</span>
            </div>
          </div>

          <!-- Right: Review Form -->
          <div class="kyc-detail__review">
            <h3 class="kyc-detail__section-title">Review Decision</h3>

            <form [formGroup]="reviewForm" class="review-form">
              <!-- Decision Selection -->
              <div class="review-form__decisions">
                <label
                  class="review-form__decision"
                  [class.review-form__decision--selected]="reviewForm.get('decision')?.value === 'approved'"
                >
                  <input
                    type="radio"
                    formControlName="decision"
                    value="approved"
                    class="review-form__radio"
                  />
                  <span class="material-icons review-form__decision-icon" style="color: #047857">
                    check_circle
                  </span>
                  <span class="review-form__decision-text">
                    <strong>Approve</strong>
                    <small>Verify user's identity</small>
                  </span>
                </label>

                <label
                  class="review-form__decision"
                  [class.review-form__decision--selected]="reviewForm.get('decision')?.value === 'rejected'"
                >
                  <input
                    type="radio"
                    formControlName="decision"
                    value="rejected"
                    class="review-form__radio"
                  />
                  <span class="material-icons review-form__decision-icon" style="color: #dc2626">
                    cancel
                  </span>
                  <span class="review-form__decision-text">
                    <strong>Reject</strong>
                    <small>Documents do not meet requirements</small>
                  </span>
                </label>

                <label
                  class="review-form__decision"
                  [class.review-form__decision--selected]="reviewForm.get('decision')?.value === 'requires_resubmission'"
                >
                  <input
                    type="radio"
                    formControlName="decision"
                    value="requires_resubmission"
                    class="review-form__radio"
                  />
                  <span class="material-icons review-form__decision-icon" style="color: #d97706">
                    refresh
                  </span>
                  <span class="review-form__decision-text">
                    <strong>Request Resubmission</strong>
                    <small>Ask user to submit new documents</small>
                  </span>
                </label>
              </div>

              <!-- Notes -->
              <div class="review-form__field">
                <label class="review-form__label">
                  Notes
                  <span *ngIf="reviewForm.get('decision')?.value !== 'approved'" class="review-form__required">*</span>
                </label>
                <textarea
                  formControlName="notes"
                  class="review-form__textarea"
                  placeholder="Enter review notes..."
                  rows="4"
                ></textarea>
              </div>

              <!-- Submit -->
              <div class="review-form__actions">
                <button
                  type="button"
                  class="review-form__btn review-form__btn--secondary"
                  routerLink="/admin/users/kyc"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  class="review-form__btn"
                  [class.review-form__btn--success]="reviewForm.get('decision')?.value === 'approved'"
                  [class.review-form__btn--danger]="reviewForm.get('decision')?.value === 'rejected'"
                  [class.review-form__btn--warning]="reviewForm.get('decision')?.value === 'requires_resubmission'"
                  [disabled]="!isFormValid() || isSubmitting()"
                  (click)="submitReview()"
                >
                  <span *ngIf="isSubmitting()" class="material-icons animate-spin">sync</span>
                  <span>{{ isSubmitting() ? 'Processing...' : 'Submit Review' }}</span>
                </button>
              </div>
            </form>

            <!-- Review History -->
            <div class="kyc-detail__history" *ngIf="kycDetails()?.reviewHistory?.length">
              <h4 class="kyc-detail__history-title">Review History</h4>
              <ul class="history-list">
                <li *ngFor="let entry of kycDetails()?.reviewHistory" class="history-list__item">
                  <span class="history-list__action">{{ entry.action }}</span>
                  <span class="history-list__time">{{ entry.timestamp | date:'medium' }}</span>
                  <span *ngIf="entry.reviewer" class="history-list__reviewer">
                    by {{ entry.reviewer }}
                  </span>
                  <p *ngIf="entry.notes" class="history-list__notes">{{ entry.notes }}</p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </ng-container>

      <!-- Document Preview Modal -->
      <div *ngIf="previewUrl()" class="doc-preview-modal" (click)="closePreview()">
        <div class="doc-preview-modal__content" (click)="$event.stopPropagation()">
          <button type="button" class="doc-preview-modal__close" (click)="closePreview()">
            <span class="material-icons">close</span>
          </button>
          <img [src]="previewUrl()" alt="Document preview" class="doc-preview-modal__image" />
        </div>
      </div>
    </section>
  `,
  styles: [`
    .kyc-detail {
      padding: 1.5rem;
      max-width: 1200px;
      margin: 0 auto;

      &__breadcrumb-link {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        color: #6b7280;
        text-decoration: none;
        font-size: 0.875rem;
        margin-bottom: 1.5rem;

        &:hover {
          color: #1e3a8a;
        }
      }

      &__loading, &__error {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 3rem;
        color: #6b7280;

        .material-icons {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }
      }

      &__error {
        color: #dc2626;

        button {
          margin-top: 0.5rem;
          padding: 0.5rem 1rem;
          background: #dc2626;
          color: white;
          border: none;
          border-radius: 0.375rem;
          cursor: pointer;
        }
      }

      &__header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: 1.5rem;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 0.75rem;
        margin-bottom: 1.5rem;
      }

      &__title {
        font-size: 1.25rem;
        font-weight: 600;
        color: #1f2937;
        margin: 0 0 0.5rem 0;
      }

      &__user-name {
        font-weight: 500;
        color: #1f2937;
      }

      &__user-email {
        color: #6b7280;
        margin-left: 0.5rem;
      }

      &__content {
        display: grid;
        grid-template-columns: 1fr 400px;
        gap: 1.5rem;
      }

      &__documents, &__review {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 0.75rem;
        padding: 1.5rem;
      }

      &__section-title {
        font-size: 1rem;
        font-weight: 600;
        color: #1f2937;
        margin: 0 0 1rem 0;
      }

      &__doc-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1rem;
        margin-bottom: 1.5rem;
      }

      &__doc-meta {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
      }

      &__meta-label {
        font-size: 0.8125rem;
        color: #6b7280;
      }

      &__meta-value {
        font-size: 0.8125rem;
        color: #1f2937;
        font-weight: 500;
      }

      &__history {
        margin-top: 1.5rem;
        padding-top: 1.5rem;
        border-top: 1px solid #e5e7eb;
      }

      &__history-title {
        font-size: 0.875rem;
        font-weight: 600;
        color: #6b7280;
        margin: 0 0 0.75rem 0;
      }
    }

    .doc-card {
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      overflow: hidden;

      &__preview {
        position: relative;
        height: 150px;
        background: #f3f4f6;
      }

      &__image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        cursor: pointer;
      }

      &__zoom {
        position: absolute;
        bottom: 0.5rem;
        right: 0.5rem;
        padding: 0.375rem;
        background: rgba(0, 0, 0, 0.6);
        border: none;
        border-radius: 0.25rem;
        color: white;
        cursor: pointer;

        .material-icons {
          font-size: 1.125rem;
        }
      }

      &__info {
        padding: 0.75rem;
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
      }

      &__type {
        font-size: 0.8125rem;
        font-weight: 500;
        color: #1f2937;
      }

      &__date {
        font-size: 0.75rem;
        color: #6b7280;
      }
    }

    .review-form {
      &__decisions {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-bottom: 1rem;
      }

      &__decision {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem;
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          background: #f9fafb;
        }

        &--selected {
          background: #eff6ff;
          border-color: #3b82f6;
        }
      }

      &__radio {
        display: none;
      }

      &__decision-icon {
        font-size: 1.5rem;
      }

      &__decision-text {
        display: flex;
        flex-direction: column;

        strong {
          color: #1f2937;
        }

        small {
          font-size: 0.75rem;
          color: #6b7280;
        }
      }

      &__field {
        margin-bottom: 1rem;
      }

      &__label {
        display: block;
        font-size: 0.875rem;
        font-weight: 500;
        color: #374151;
        margin-bottom: 0.375rem;
      }

      &__required {
        color: #dc2626;
      }

      &__textarea {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        font-size: 0.875rem;
        resize: vertical;

        &:focus {
          outline: none;
          border-color: #3b82f6;
        }
      }

      &__actions {
        display: flex;
        gap: 0.75rem;
        justify-content: flex-end;
      }

      &__btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.625rem 1.25rem;
        border-radius: 0.5rem;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        &--secondary {
          background: white;
          border: 1px solid #e5e7eb;
          color: #374151;
          text-decoration: none;

          &:hover {
            background: #f9fafb;
          }
        }

        &--success {
          background: #047857;
          border: 1px solid #047857;
          color: white;

          &:hover:not(:disabled) {
            background: #065f46;
          }
        }

        &--danger {
          background: #dc2626;
          border: 1px solid #dc2626;
          color: white;

          &:hover:not(:disabled) {
            background: #b91c1c;
          }
        }

        &--warning {
          background: #d97706;
          border: 1px solid #d97706;
          color: white;

          &:hover:not(:disabled) {
            background: #b45309;
          }
        }
      }
    }

    .history-list {
      list-style: none;
      margin: 0;
      padding: 0;

      &__item {
        padding: 0.75rem 0;
        border-bottom: 1px solid #f3f4f6;

        &:last-child {
          border-bottom: none;
        }
      }

      &__action {
        font-weight: 500;
        color: #1f2937;
      }

      &__time {
        font-size: 0.75rem;
        color: #6b7280;
        margin-left: 0.5rem;
      }

      &__reviewer {
        font-size: 0.75rem;
        color: #9ca3af;
      }

      &__notes {
        font-size: 0.8125rem;
        color: #6b7280;
        margin: 0.25rem 0 0 0;
        font-style: italic;
      }
    }

    .doc-preview-modal {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;

      &__content {
        position: relative;
        max-width: 90vw;
        max-height: 90vh;
      }

      &__close {
        position: absolute;
        top: -40px;
        right: 0;
        padding: 0.5rem;
        background: none;
        border: none;
        color: white;
        cursor: pointer;
      }

      &__image {
        max-width: 100%;
        max-height: 90vh;
        object-fit: contain;
      }
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .animate-spin {
      animation: spin 1s linear infinite;
    }

    @media (max-width: 1024px) {
      .kyc-detail__content {
        grid-template-columns: 1fr;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KycDetailComponent implements OnInit, OnDestroy {
  // =========================================================================
  // DEPENDENCIES
  // =========================================================================

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly usersService = inject(AdminUsersService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();

  // =========================================================================
  // STATE
  // =========================================================================

  readonly kycId = signal<number | null>(null);
  readonly isLoading = signal(false);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly kycDetails = signal<KycDetails | null>(null);
  readonly previewUrl = signal<string | null>(null);

  // =========================================================================
  // FORM
  // =========================================================================

  readonly reviewForm: FormGroup = this.fb.group({
    decision: [null, Validators.required],
    notes: ['']
  });

  // =========================================================================
  // LIFECYCLE
  // =========================================================================

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = parseInt(params['id'], 10);
      if (!isNaN(id)) {
        this.kycId.set(id);
        this.loadKycDetails();
      } else {
        this.router.navigate(['/admin/users/kyc']);
      }
    });

    // Check for action query param
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['action'] === 'reject') {
        this.reviewForm.patchValue({ decision: 'rejected' });
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // =========================================================================
  // DATA LOADING
  // =========================================================================

  loadKycDetails(): void {
    const id = this.kycId();
    if (!id) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.usersService.getKycDetails(id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (details) => {
          this.kycDetails.set(details);
        },
        error: (error) => {
          console.error('Failed to load KYC details:', error);
          this.errorMessage.set('Failed to load KYC details.');
        }
      });
  }

  // =========================================================================
  // ACTIONS
  // =========================================================================

  submitReview(): void {
    if (!this.isFormValid()) return;

    const id = this.kycId();
    if (!id) return;

    this.isSubmitting.set(true);

    const formValue = this.reviewForm.value;
    const request: ReviewKycRequest = {
      decision: formValue.decision,
      notes: formValue.notes || undefined
    };

    this.usersService.reviewKyc(id, request)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isSubmitting.set(false))
      )
      .subscribe({
        next: () => {
          this.snackBar.open('KYC review submitted successfully', 'Close', { duration: 3000 });
          this.router.navigate(['/admin/users/kyc']);
        },
        error: (error) => {
          console.error('Failed to submit review:', error);
          this.snackBar.open('Failed to submit review', 'Close', { duration: 3000 });
        }
      });
  }

  openDocument(url: string): void {
    this.previewUrl.set(url);
  }

  closePreview(): void {
    this.previewUrl.set(null);
  }

  // =========================================================================
  // UTILITIES
  // =========================================================================

  isFormValid(): boolean {
    const decision = this.reviewForm.get('decision')?.value;
    const notes = this.reviewForm.get('notes')?.value;

    if (!decision) return false;
    if (decision !== 'approved' && !notes?.trim()) return false;

    return true;
  }

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
}
