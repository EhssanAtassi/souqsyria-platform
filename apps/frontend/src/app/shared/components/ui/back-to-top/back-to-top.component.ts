import { Component, HostListener, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';

/**
 * Back to Top Button Component
 *
 * @description
 * Floating action button that appears when user scrolls down the page.
 * Provides quick navigation back to the top with smooth scrolling animation.
 * Styled with Syrian Golden Wheat theme and Damascus-inspired patterns.
 *
 * Features:
 * - Auto-show/hide based on scroll position (shows after 300px)
 * - Smooth scroll animation to top
 * - Fade in/out transitions
 * - Syrian cultural styling with Damascus pattern
 * - Responsive positioning (mobile-friendly)
 * - Accessibility support (keyboard navigation, ARIA labels)
 * - Performance optimized with OnPush change detection
 *
 * @example
 * ```typescript
 * // In app.component.html or layout component
 * <app-back-to-top />
 * ```
 *
 * @example
 * ```typescript
 * // With custom threshold
 * <app-back-to-top [showThreshold]="500" />
 * ```
 *
 * @swagger
 * components:
 *   schemas:
 *     BackToTopComponent:
 *       type: object
 *       description: Floating button for quick navigation to page top
 *       properties:
 *         isVisible:
 *           type: boolean
 *           description: Whether button is currently visible
 *         showThreshold:
 *           type: number
 *           description: Scroll position (in pixels) when button appears
 *           default: 300
 *         scrollPosition:
 *           type: number
 *           description: Current scroll position from top
 */
@Component({
  selector: 'app-back-to-top',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './back-to-top.component.html',
  styleUrls: ['./back-to-top.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px) scale(0.8)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0) scale(1)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(20px) scale(0.8)' }))
      ])
    ])
  ]
})
export class BackToTopComponent {
  /**
   * Current scroll position signal
   * @private
   */
  private scrollPosition = signal<number>(0);

  /**
   * Threshold for showing button (in pixels)
   */
  showThreshold = 300;

  /**
   * Computed visibility state based on scroll position
   * Button becomes visible when scroll position exceeds threshold
   */
  isVisible = computed(() => this.scrollPosition() > this.showThreshold);

  /**
   * Scroll progress percentage (0-100)
   * Used for visual indicator
   */
  scrollProgress = computed(() => {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollableHeight = documentHeight - windowHeight;
    const currentScroll = this.scrollPosition();

    if (scrollableHeight <= 0) return 0;

    return Math.min(100, (currentScroll / scrollableHeight) * 100);
  });

  /**
   * Listen to window scroll events
   * Updates scroll position signal for computed visibility
   */
  @HostListener('window:scroll', ['$event'])
  onWindowScroll(): void {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    this.scrollPosition.set(scrollTop);
  }

  /**
   * Scroll to top of page with smooth animation
   * Uses native smooth scroll behavior for performance
   */
  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  /**
   * Handle keyboard navigation (Enter/Space)
   * Ensures accessibility for keyboard users
   */
  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.scrollToTop();
    }
  }
}
