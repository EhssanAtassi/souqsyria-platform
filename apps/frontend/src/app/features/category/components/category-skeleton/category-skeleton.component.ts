/**
 * Category Skeleton Component
 *
 * @description Displays animated skeleton loading placeholders for category cards
 * matching the FeaturedCategories layout. Provides visual feedback during data loading.
 *
 * @pattern Dumb Component
 * - Pure presentation component
 * - No service injection
 * - Configurable card count
 *
 * @swagger
 * components:
 *   schemas:
 *     CategorySkeletonComponent:
 *       type: object
 *       description: Skeleton loader for category cards
 *       properties:
 *         count:
 *           type: number
 *           description: Number of skeleton cards to display
 *           default: 6
 */

import {
  Component,
  Input,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Category Skeleton Component
 *
 * @description Animated skeleton placeholders for category cards
 * with shimmer effect and responsive grid layout.
 *
 * @example
 * ```html
 * <app-category-skeleton [count]="6"></app-category-skeleton>
 * ```
 *
 * @component
 */
@Component({
  selector: 'app-category-skeleton',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './category-skeleton.component.html',
  styleUrls: ['./category-skeleton.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategorySkeletonComponent {
  /**
   * Number of skeleton cards to display
   *
   * @input
   * @default 6
   */
  @Input() count = 6;

  /**
   * Generate array for ngFor iteration
   *
   * @returns Array of numbers for skeleton cards
   */
  get skeletonArray(): number[] {
    return Array.from({ length: this.count }, (_, i) => i);
  }

  /**
   * Track by function for ngFor optimization
   *
   * @param index - Item index
   * @returns Index for tracking
   */
  trackByIndex(index: number): number {
    return index;
  }
}
