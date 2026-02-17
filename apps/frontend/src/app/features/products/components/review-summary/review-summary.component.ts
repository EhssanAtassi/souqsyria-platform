/**
 * @file review-summary.component.ts
 * @description Component displaying aggregated review statistics
 * Shows average rating, total count, and star distribution bar chart
 *
 * @swagger
 * tags:
 *   - name: ReviewSummaryComponent
 *     description: Review statistics display component
 */

import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ReviewSummary } from '../../models/review.interface';

/**
 * @description Component for displaying review summary statistics
 * Shows average rating with stars, total review count, and rating distribution bars
 */
@Component({
  selector: 'app-review-summary',
  standalone: true,
  imports: [CommonModule, MatIconModule, DecimalPipe],
  templateUrl: './review-summary.component.html',
  styleUrls: ['./review-summary.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewSummaryComponent {
  /** @description Review summary data from parent */
  summary = input.required<ReviewSummary>();

  /** @description Current UI language */
  language = input.required<'en' | 'ar'>();

  /**
   * @description Computes filled/half/empty stars array for display
   * Returns array of 5 items with values: 'star', 'star_half', or 'star_border'
   */
  starIcons = computed(() => {
    const rating = this.summary().averageRating;
    const icons: string[] = [];

    for (let i = 1; i <= 5; i++) {
      if (rating >= i) {
        icons.push('star');
      } else if (rating >= i - 0.5) {
        icons.push('star_half');
      } else {
        icons.push('star_border');
      }
    }

    return icons;
  });

  /**
   * @description Computes rating distribution sorted from 5 stars to 1 star
   * Each item contains star level, count, and percentage
   */
  distributionBars = computed(() => {
    const summary = this.summary();
    const total = summary.totalReviews || 1; // Avoid division by zero

    return [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: summary.distribution[star] || 0,
      percentage: ((summary.distribution[star] || 0) / total) * 100,
    }));
  });

  /**
   * @description Localized review count text
   */
  reviewCountText = computed(() => {
    const count = this.summary().totalReviews;
    const lang = this.language();

    if (lang === 'ar') {
      return count === 1 ? 'مراجعة واحدة' : `${count} مراجعة`;
    } else {
      return count === 1 ? '1 review' : `${count} reviews`;
    }
  });

  /**
   * @description Localized "Customer Reviews" heading
   */
  get headingText(): string {
    return this.language() === 'ar' ? 'تقييمات العملاء' : 'Customer Reviews';
  }

  /**
   * @description Localized "stars" label
   */
  starsLabel(count: number): string {
    return this.language() === 'ar' ? `${count} نجوم` : `${count} stars`;
  }
}
