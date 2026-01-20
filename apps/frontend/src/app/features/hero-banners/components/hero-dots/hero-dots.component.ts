/**
 * Hero Dots Component (Presentational/Dumb Component)
 * Displays dot indicators for carousel pagination
 *
 * Pure presentational component that:
 * - Displays dots for each slide
 * - Highlights active dot
 * - Emits click events
 * - NO carousel logic
 *
 * @example
 * <app-hero-dots
 *   [totalSlides]="5"
 *   [currentIndex]="2"
 *   (dotClick)="goToSlide($event)">
 * </app-hero-dots>
 */

import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-hero-dots',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './hero-dots.component.html',
  styleUrl: './hero-dots.component.scss',
})
export class HeroDotsComponent {
  // ============================================
  // Inputs
  // ============================================

  /**
   * Total number of slides
   * Creates this many dots
   * @default 0
   */
  @Input({ required: true }) totalSlides: number = 0;

  /**
   * Current active slide index (0-based)
   * @default 0
   */
  @Input() currentIndex: number = 0;

  /**
   * Size variant
   * @default 'medium'
   */
  @Input() size: 'small' | 'medium' | 'large' = 'medium';

  /**
   * Style variant
   * @default 'default'
   */
  @Input() variant: 'default' | 'minimal' | 'bold' = 'default';

  // ============================================
  // Outputs
  // ============================================

  /**
   * Emitted when a dot is clicked
   * Sends the slide index to navigate to
   */
  @Output() dotClick = new EventEmitter<number>();

  // ============================================
  // Getters
  // ============================================

  /**
   * Get array of slide indices for *ngFor
   */
  get slideIndices(): number[] {
    return Array.from({ length: this.totalSlides }, (_, i) => i);
  }

  // ============================================
  // Event Handlers
  // ============================================

  /**
   * Handle dot click
   * @param index Slide index to navigate to
   */
  onDotClick(index: number): void {
    if (index !== this.currentIndex) {
      this.dotClick.emit(index);
    }
  }

  /**
   * Get ARIA label for dot
   * @param index Slide index
   */
  getDotAriaLabel(index: number): string {
    return `Go to slide ${index + 1} of ${this.totalSlides}`;
  }

  /**
   * Check if dot is active
   * @param index Slide index
   */
  isActive(index: number): boolean {
    return index === this.currentIndex;
  }
}
