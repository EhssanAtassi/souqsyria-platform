/**
 * Hero Navigation Component (Presentational/Dumb Component)
 * Displays previous/next arrow buttons for carousel navigation
 *
 * This is a pure presentational component that:
 * - Displays arrow buttons
 * - Emits navigation events
 * - NO navigation logic
 * - Highly reusable for any carousel
 *
 * @example
 * <app-hero-navigation
 *   [showPrevious]="true"
 *   [showNext]="true"
 *   [disablePrevious]="false"
 *   [disableNext]="false"
 *   (previous)="goToPrevious()"
 *   (next)="goToNext()">
 * </app-hero-navigation>
 */

import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Hero Navigation Component
 * Pure presentational component for carousel navigation arrows
 */
@Component({
  selector: 'app-hero-navigation',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './hero-navigation.component.html',
  styleUrl: './hero-navigation.component.scss',
})
export class HeroNavigationComponent {
  // ============================================
  // Inputs - Configuration from parent
  // ============================================

  /**
   * Show previous arrow button
   * @default true
   */
  @Input() showPrevious: boolean = true;

  /**
   * Show next arrow button
   * @default true
   */
  @Input() showNext: boolean = true;

  /**
   * Disable previous button (e.g., at first slide)
   * @default false
   */
  @Input() disablePrevious: boolean = false;

  /**
   * Disable next button (e.g., at last slide)
   * @default false
   */
  @Input() disableNext: boolean = false;

  /**
   * Current slide index (for ARIA labels)
   * @default 0
   */
  @Input() currentIndex: number = 0;

  /**
   * Total number of slides (for ARIA labels)
   * @default 0
   */
  @Input() totalSlides: number = 0;

  /**
   * Button size variant
   * @default 'medium'
   */
  @Input() size: 'small' | 'medium' | 'large' = 'medium';

  /**
   * Button style variant
   * @default 'default'
   */
  @Input() variant: 'default' | 'minimal' | 'solid' = 'default';

  // ============================================
  // Outputs - Events emitted to parent
  // ============================================

  /**
   * Emitted when previous button is clicked
   * Parent should handle the actual navigation logic
   */
  @Output() previous = new EventEmitter<void>();

  /**
   * Emitted when next button is clicked
   * Parent should handle the actual navigation logic
   */
  @Output() next = new EventEmitter<void>();

  // ============================================
  // Event Handlers - Pure delegation
  // ============================================

  /**
   * Handle previous button click
   * Simply emits event to parent
   */
  onPreviousClick(): void {
    if (!this.disablePrevious) {
      this.previous.emit();
    }
  }

  /**
   * Handle next button click
   * Simply emits event to parent
   */
  onNextClick(): void {
    if (!this.disableNext) {
      this.next.emit();
    }
  }

  // ============================================
  // Accessibility - ARIA Labels
  // ============================================

  /**
   * Get ARIA label for previous button
   * Includes current position context for screen readers
   */
  get previousAriaLabel(): string {
    if (this.totalSlides > 0) {
      return `Previous slide (currently on slide ${this.currentIndex + 1} of ${this.totalSlides})`;
    }
    return 'Previous slide';
  }

  /**
   * Get ARIA label for next button
   * Includes current position context for screen readers
   */
  get nextAriaLabel(): string {
    if (this.totalSlides > 0) {
      return `Next slide (currently on slide ${this.currentIndex + 1} of ${this.totalSlides})`;
    }
    return 'Next slide';
  }
}
