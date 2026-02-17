/**
 * @file review-form.component.ts
 * @description Component for submitting new product reviews
 * Includes star rating, bilingual titles/bodies, and pros/cons lists
 *
 * @swagger
 * tags:
 *   - name: ReviewFormComponent
 *     description: Product review submission form
 */

import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  inject,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReviewService } from '../../services/review.service';
import { CreateReviewDto } from '../../models/review.interface';

/**
 * @description Component for submitting product reviews
 * Requires authentication. Shows star rating selector, bilingual fields, and pros/cons
 */
@Component({
  selector: 'app-review-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatSnackBarModule,
    MatTabsModule,
  ],
  templateUrl: './review-form.component.html',
  styleUrls: ['./review-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewFormComponent {
  /** @description Product slug for review submission */
  slug = input.required<string>();

  /** @description Current UI language */
  language = input.required<'en' | 'ar'>();

  /** @description Whether user is authenticated */
  isAuthenticated = input<boolean>(false);

  /** @description Event emitted when review is successfully submitted */
  reviewSubmitted = output<void>();

  private readonly fb = inject(FormBuilder);
  private readonly reviewService = inject(ReviewService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly snackBar = inject(MatSnackBar);

  /** @description Selected star rating (1-5) */
  selectedRating = signal(0);

  /** @description Hover rating for star preview */
  hoverRating = signal(0);

  /** @description Form submission loading state */
  submitting = signal(false);

  /** @description Pros list */
  pros = signal<string[]>([]);

  /** @description Cons list */
  cons = signal<string[]>([]);

  /** @description New pro input value */
  newPro = signal('');

  /** @description New con input value */
  newCon = signal('');

  /** @description Review form */
  form = this.fb.group({
    titleEn: [''],
    titleAr: [''],
    bodyEn: [''],
    bodyAr: [''],
  });

  /**
   * @description Sets the selected rating
   */
  setRating(rating: number): void {
    this.selectedRating.set(rating);
  }

  /**
   * @description Sets the hover rating for preview
   */
  setHoverRating(rating: number): void {
    this.hoverRating.set(rating);
  }

  /**
   * @description Returns the effective rating for display (hover or selected)
   */
  getDisplayRating(): number {
    return this.hoverRating() || this.selectedRating();
  }

  /**
   * @description Returns star icon based on rating
   */
  getStarIcon(index: number): string {
    const displayRating = this.getDisplayRating();
    return index <= displayRating ? 'star' : 'star_border';
  }

  /**
   * @description Adds a pro to the list
   */
  addPro(): void {
    const value = this.newPro().trim();
    if (value) {
      this.pros.update((list) => [...list, value]);
      this.newPro.set('');
    }
  }

  /**
   * @description Removes a pro from the list
   */
  removePro(index: number): void {
    this.pros.update((list) => list.filter((_, i) => i !== index));
  }

  /**
   * @description Adds a con to the list
   */
  addCon(): void {
    const value = this.newCon().trim();
    if (value) {
      this.cons.update((list) => [...list, value]);
      this.newCon.set('');
    }
  }

  /**
   * @description Removes a con from the list
   */
  removeCon(index: number): void {
    this.cons.update((list) => list.filter((_, i) => i !== index));
  }

  /**
   * @description Handles form submission
   */
  onSubmit(): void {
    if (!this.isAuthenticated()) {
      const message =
        this.language() === 'ar'
          ? 'يجب تسجيل الدخول لكتابة مراجعة'
          : 'Please login to write a review';
      this.snackBar.open(message, '✕', {
        duration: 4000,
        panelClass: 'error-snackbar',
      });
      return;
    }

    if (this.selectedRating() === 0) {
      const message =
        this.language() === 'ar'
          ? 'الرجاء اختيار تقييم'
          : 'Please select a rating';
      this.snackBar.open(message, '✕', {
        duration: 3000,
        panelClass: 'error-snackbar',
      });
      return;
    }

    this.submitting.set(true);

    const dto: CreateReviewDto = {
      rating: this.selectedRating(),
      titleEn: this.form.value.titleEn || undefined,
      titleAr: this.form.value.titleAr || undefined,
      bodyEn: this.form.value.bodyEn || undefined,
      bodyAr: this.form.value.bodyAr || undefined,
      pros: this.pros().length > 0 ? this.pros() : undefined,
      cons: this.cons().length > 0 ? this.cons() : undefined,
    };

    this.reviewService
      .submitReview(this.slug(), dto)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          const message =
            this.language() === 'ar'
              ? 'تم إرسال المراجعة بنجاح! سيتم نشرها بعد الموافقة عليها.'
              : 'Review submitted successfully! It will be published after approval.';
          this.snackBar.open(message, '✓', {
            duration: 5000,
            panelClass: 'success-snackbar',
          });

          // Reset form
          this.form.reset();
          this.selectedRating.set(0);
          this.pros.set([]);
          this.cons.set([]);
          this.submitting.set(false);

          // Emit event
          this.reviewSubmitted.emit();
        },
        error: (err) => {
          const message =
            err?.error?.message ||
            (this.language() === 'ar'
              ? 'فشل إرسال المراجعة'
              : 'Failed to submit review');
          this.snackBar.open(message, '✕', {
            duration: 4000,
            panelClass: 'error-snackbar',
          });
          this.submitting.set(false);
        },
      });
  }

  /**
   * @description Localized labels
   */
  get headingLabel(): string {
    return this.language() === 'ar' ? 'اكتب مراجعة' : 'Write a Review';
  }

  get ratingLabel(): string {
    return this.language() === 'ar' ? 'التقييم' : 'Rating';
  }

  get titleEnLabel(): string {
    return 'Title (English)';
  }

  get titleArLabel(): string {
    return 'العنوان (عربي)';
  }

  get bodyEnLabel(): string {
    return 'Review (English)';
  }

  get bodyArLabel(): string {
    return 'المراجعة (عربي)';
  }

  get prosLabel(): string {
    return this.language() === 'ar' ? 'الإيجابيات' : 'Pros';
  }

  get consLabel(): string {
    return this.language() === 'ar' ? 'السلبيات' : 'Cons';
  }

  get addLabel(): string {
    return this.language() === 'ar' ? 'إضافة' : 'Add';
  }

  get submitLabel(): string {
    return this.language() === 'ar' ? 'إرسال المراجعة' : 'Submit Review';
  }

  get loginRequiredLabel(): string {
    return this.language() === 'ar'
      ? 'يجب تسجيل الدخول لكتابة مراجعة'
      : 'Login to write a review';
  }
}
