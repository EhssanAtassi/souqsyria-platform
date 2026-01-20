import { Component, Input, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Skeleton Loader Component for Syrian Marketplace
 *
 * Provides elegant loading states with shimmer animation
 * Supports multiple skeleton types for different content layouts
 *
 * @description
 * A reusable skeleton loader component that displays placeholder content
 * while actual data is being loaded. Supports multiple skeleton types
 * (card, banner, category, text, circle) and includes smooth shimmer animations.
 *
 * Features:
 * - Multiple skeleton types via @Input() type parameter
 * - Configurable count for displaying multiple skeletons
 * - Responsive design with mobile-first approach
 * - Smooth shimmer/pulse animation
 * - Syrian marketplace golden wheat theme integration
 * - Arabic/RTL support built-in
 * - ARIA labels for accessibility
 * - OnPush change detection for optimal performance
 *
 * @example
 * ```typescript
 * // Display banner skeleton
 * <app-skeleton-loader type="banner" />
 *
 * // Display 8 product card skeletons
 * <app-skeleton-loader type="card" [count]="8" />
 *
 * // Display custom sized skeleton
 * <app-skeleton-loader
 *   type="card"
 *   [width]="'300px'"
 *   [height]="'400px'"
 * />
 * ```
 *
 * @swagger
 * components:
 *   schemas:
 *     SkeletonLoaderComponent:
 *       type: object
 *       properties:
 *         type:
 *           type: string
 *           enum: [card, banner, category, text, circle]
 *           description: Type of skeleton to display
 *           default: card
 *         count:
 *           type: number
 *           description: Number of skeleton items to display
 *           minimum: 1
 *           maximum: 20
 *           default: 1
 *         width:
 *           type: string
 *           description: Custom width (CSS value, e.g., '100%', '300px')
 *           nullable: true
 *         height:
 *           type: string
 *           description: Custom height (CSS value, e.g., '400px', '200px')
 *           nullable: true
 *         animation:
 *           type: string
 *           enum: [shimmer, pulse, wave]
 *           description: Animation style
 *           default: shimmer
 *         theme:
 *           type: string
 *           enum: [light, dark]
 *           description: Color theme
 *           default: light
 */
@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './skeleton-loader.component.html',
  styleUrls: ['./skeleton-loader.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SkeletonLoaderComponent {
  /**
   * Type of skeleton to display
   *
   * Available types:
   * - 'card': Product card skeleton (default)
   * - 'banner': Hero banner skeleton
   * - 'category': Category card skeleton
   * - 'text': Text line skeleton
   * - 'circle': Circular skeleton (avatars, icons)
   *
   * @default 'card'
   */
  @Input() type: 'card' | 'banner' | 'category' | 'text' | 'circle' = 'card';

  /**
   * Number of skeleton items to display
   *
   * @minimum 1
   * @maximum 20
   * @default 1
   */
  @Input() count: number = 1;

  /**
   * Custom width for the skeleton
   *
   * Accepts any valid CSS width value (%, px, rem, etc.)
   * If not provided, uses default width based on type
   *
   * @example '100%', '300px', '20rem'
   */
  @Input() width: string | null = null;

  /**
   * Custom height for the skeleton
   *
   * Accepts any valid CSS height value (%, px, rem, etc.)
   * If not provided, uses default height based on type
   *
   * @example '400px', '200px', '10rem'
   */
  @Input() height: string | null = null;

  /**
   * Animation style for skeleton
   *
   * @options 'shimmer' | 'pulse' | 'wave'
   * @default 'shimmer'
   */
  @Input() animation: 'shimmer' | 'pulse' | 'wave' = 'shimmer';

  /**
   * Color theme for skeleton
   *
   * @options 'light' | 'dark'
   * @default 'light'
   */
  @Input() theme: 'light' | 'dark' = 'light';

  /**
   * Border radius for skeleton elements
   *
   * @default '0.5rem'
   */
  @Input() borderRadius: string = '0.5rem';

  /**
   * Signal for type to enable reactive computed properties
   */
  protected typeSignal = signal<'card' | 'banner' | 'category' | 'text' | 'circle'>('card');

  /**
   * Signal for count to enable reactive updates
   */
  protected countSignal = signal<number>(1);

  /**
   * Computed array for *ngFor iteration
   * Creates array based on count signal
   */
  protected items = computed(() => Array(this.countSignal()).fill(0));

  /**
   * Angular lifecycle hook
   * Updates signals when input properties change
   */
  ngOnInit(): void {
    this.typeSignal.set(this.type);
    this.countSignal.set(Math.min(Math.max(this.count, 1), 20)); // Clamp between 1-20
  }

  /**
   * Gets CSS classes for skeleton container
   *
   * Combines base classes with type-specific and animation classes
   *
   * @returns Space-separated CSS class string
   */
  getSkeletonClasses(): string {
    const baseClass = 'skeleton-loader';
    const typeClass = `skeleton-loader--${this.type}`;
    const animationClass = `skeleton-loader--${this.animation}`;
    const themeClass = `skeleton-loader--${this.theme}`;

    return `${baseClass} ${typeClass} ${animationClass} ${themeClass}`;
  }

  /**
   * Gets inline styles for skeleton element
   *
   * Applies custom width, height, and border radius if provided
   * Falls back to default dimensions based on skeleton type
   *
   * @returns CSS style object
   */
  getSkeletonStyles(): { [key: string]: string } {
    const styles: { [key: string]: string } = {};

    // Apply custom or default width
    if (this.width) {
      styles['width'] = this.width;
    }

    // Apply custom or default height
    if (this.height) {
      styles['height'] = this.height;
    }

    // Apply border radius
    if (this.borderRadius && this.type !== 'circle') {
      styles['border-radius'] = this.borderRadius;
    }

    return styles;
  }

  /**
   * Gets ARIA label for accessibility
   *
   * Provides descriptive text for screen readers
   *
   * @returns Accessible label text
   */
  getAriaLabel(): string {
    const typeLabels: Record<typeof this.type, string> = {
      'card': 'Loading product card',
      'banner': 'Loading banner',
      'category': 'Loading category',
      'text': 'Loading text',
      'circle': 'Loading image'
    };

    return typeLabels[this.type];
  }

  /**
   * Checks if skeleton should display in grid layout
   *
   * @returns True if skeleton type is card or category
   */
  isGridLayout(): boolean {
    return this.type === 'card' || this.type === 'category';
  }

  /**
   * Gets grid container classes
   *
   * Applies responsive grid layout for card and category types
   *
   * @returns Grid container CSS classes
   */
  getGridClasses(): string {
    if (!this.isGridLayout()) {
      return '';
    }

    return 'skeleton-grid grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';
  }

  /**
   * Gets container classes for skeleton wrapper
   *
   * @returns Container CSS classes
   */
  getContainerClasses(): string {
    if (this.isGridLayout()) {
      return this.getGridClasses();
    }

    return 'skeleton-container';
  }

  /**
   * Track by function for *ngFor optimization
   *
   * Improves rendering performance for lists
   *
   * @param index - Array index
   * @returns Index as tracking identifier
   */
  trackByIndex(index: number): number {
    return index;
  }

  /**
   * Gets default dimensions for skeleton type
   *
   * @returns Object with width and height
   */
  private getDefaultDimensions(): { width: string; height: string } {
    const dimensions: Record<typeof this.type, { width: string; height: string }> = {
      'card': { width: '100%', height: '400px' },
      'banner': { width: '100%', height: '400px' },
      'category': { width: '100%', height: '200px' },
      'text': { width: '100%', height: '1rem' },
      'circle': { width: '60px', height: '60px' }
    };

    return dimensions[this.type];
  }
}
