/**
 * @file review-list.component.ts
 * @description Component for displaying paginated product reviews
 * Shows review cards with user info, ratings, helpful counts, and sorting options
 *
 * @swagger
 * tags:
 *   - name: ReviewListComponent
 *     description: Paginated product review list with sorting
 */

import {
  Component,
  ChangeDetectionStrategy,
  input,
  signal,
  inject,
  DestroyRef,
  OnInit,
  output,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReviewService } from '../../services/review.service';
import { ProductReview } from '../../models/review.interface';

/**
 * @description Component for displaying and managing product reviews
 * Supports sorting, pagination, and marking reviews as helpful
 */
@Component({
  selector: 'app-review-list',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatSnackBarModule,
    MatChipsModule,
    DatePipe,
  ],
  templateUrl: './review-list.component.html',
  styleUrls: ['./review-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewListComponent implements OnInit {
  /** @description Product slug for loading reviews */
  slug = input.required<string>();

  /** @description Current UI language */
  language = input.required<'en' | 'ar'>();

  /** @description Event emitted when user clicks "Write a Review" */
  writeReview = output<void>();

  private readonly reviewService = inject(ReviewService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly snackBar = inject(MatSnackBar);

  /** @description List of reviews */
  reviews = signal<ProductReview[]>([]);

  /** @description Loading state */
  loading = signal(false);

  /** @description Current page number */
  currentPage = signal(1);

  /** @description Total number of pages */
  totalPages = signal(1);

  /** @description Current sort option */
  sortBy = signal<'newest' | 'highest_rating' | 'lowest_rating' | 'most_helpful'>('newest');

  /** @description Reviews per page */
  readonly limit = 10;

  ngOnInit(): void {
    this.loadReviews();
  }

  /**
   * @description Loads reviews from API based on current sort and page
   */
  private loadReviews(): void {
    this.loading.set(true);

    this.reviewService
      .getReviews(this.slug(), this.currentPage(), this.limit, this.sortBy())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          // Append reviews for "Load More" pattern
          if (this.currentPage() === 1) {
            this.reviews.set(response.data);
          } else {
            this.reviews.update((existing) => [...existing, ...response.data]);
          }
          this.totalPages.set(response.meta.totalPages);
          this.loading.set(false);
        },
        error: (err) => {
          const message =
            err?.error?.message ||
            (this.language() === 'ar'
              ? 'فشل تحميل المراجعات'
              : 'Failed to load reviews');
          this.snackBar.open(message, '✕', {
            duration: 4000,
            panelClass: 'error-snackbar',
          });
          this.loading.set(false);
        },
      });
  }

  /**
   * @description Handles sort change event
   * @param value - New sort option
   */
  onSortChange(value: string): void {
    this.sortBy.set(value as any);
    this.currentPage.set(1);
    this.loadReviews();
  }

  /**
   * @description Loads next page of reviews
   */
  onLoadMore(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((p) => p + 1);
      this.loadReviews();
    }
  }

  /**
   * @description Marks a review as helpful
   * @param review - The review to mark as helpful
   */
  onMarkHelpful(review: ProductReview): void {
    this.reviewService
      .markHelpful(review.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          // Update local review helpful count
          this.reviews.update((reviews) =>
            reviews.map((r) =>
              r.id === review.id ? { ...r, helpfulCount: response.helpfulCount } : r
            )
          );

          const message =
            this.language() === 'ar'
              ? 'شكراً على مساعدتك!'
              : 'Thanks for your feedback!';
          this.snackBar.open(message, '✓', {
            duration: 2000,
            panelClass: 'success-snackbar',
          });
        },
        error: () => {
          const message =
            this.language() === 'ar' ? 'فشل تسجيل التقييم' : 'Failed to record feedback';
          this.snackBar.open(message, '✕', {
            duration: 3000,
            panelClass: 'error-snackbar',
          });
        },
      });
  }

  /**
   * @description Emits event to open review form
   */
  onWriteReview(): void {
    this.writeReview.emit();
  }

  /**
   * @description Returns the review title for current language
   */
  getReviewTitle(review: ProductReview): string {
    return this.language() === 'ar'
      ? review.titleAr || review.titleEn || ''
      : review.titleEn || review.titleAr || '';
  }

  /**
   * @description Returns the review body for current language
   */
  getReviewBody(review: ProductReview): string {
    return this.language() === 'ar'
      ? review.bodyAr || review.bodyEn || ''
      : review.bodyEn || review.bodyAr || '';
  }

  /**
   * @description Returns array of filled/empty star icons for rating
   */
  getStarIcons(rating: number): string[] {
    const icons: string[] = [];
    for (let i = 1; i <= 5; i++) {
      icons.push(i <= rating ? 'star' : 'star_border');
    }
    return icons;
  }

  /**
   * @description Returns user initials for avatar fallback
   */
  getUserInitials(fullName: string): string {
    const parts = fullName.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return fullName[0]?.toUpperCase() || '?';
  }

  /**
   * @description Localized labels
   */
  get writeReviewLabel(): string {
    return this.language() === 'ar' ? 'اكتب مراجعة' : 'Write a Review';
  }

  get sortLabel(): string {
    return this.language() === 'ar' ? 'ترتيب حسب' : 'Sort by';
  }

  get loadMoreLabel(): string {
    return this.language() === 'ar' ? 'تحميل المزيد' : 'Load More';
  }

  get verifiedPurchaseLabel(): string {
    return this.language() === 'ar' ? 'عملية شراء موثقة' : 'Verified Purchase';
  }

  get helpfulLabel(): string {
    return this.language() === 'ar' ? 'مفيد' : 'Helpful';
  }

  get prosLabel(): string {
    return this.language() === 'ar' ? 'الإيجابيات' : 'Pros';
  }

  get consLabel(): string {
    return this.language() === 'ar' ? 'السلبيات' : 'Cons';
  }

  get noReviewsLabel(): string {
    return this.language() === 'ar'
      ? 'لا توجد مراجعات بعد. كن أول من يكتب مراجعة!'
      : 'No reviews yet. Be the first to write one!';
  }

  /**
   * @description Sort options for dropdown
   */
  readonly sortOptions = [
    { value: 'newest', labelEn: 'Newest', labelAr: 'الأحدث' },
    { value: 'highest_rating', labelEn: 'Highest Rating', labelAr: 'الأعلى تقييماً' },
    { value: 'lowest_rating', labelEn: 'Lowest Rating', labelAr: 'الأقل تقييماً' },
    { value: 'most_helpful', labelEn: 'Most Helpful', labelAr: 'الأكثر فائدة' },
  ];
}
