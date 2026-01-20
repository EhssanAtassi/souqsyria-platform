/**
 * Hero Slide Component (Presentational/Dumb Component)
 * Displays a single hero banner slide with image, headline, and CTA
 *
 * This is a pure presentational component that:
 * - Receives data via @Input()
 * - Emits events via @Output()
 * - Contains NO business logic
 * - Is highly reusable
 * - Can be tested in isolation
 *
 * @example
 * <app-hero-slide
 *   [banner]="heroBanner"
 *   [isActive]="true"
 *   (bannerClick)="onBannerClick()"
 *   (ctaClick)="onCTAClick()">
 * </app-hero-slide>
 */

import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  HostBinding,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroBanner } from '../../interfaces/hero-banner.interface';

/**
 * Hero Slide Component
 * Pure presentational component for displaying a single hero banner
 */
@Component({
  selector: 'app-hero-slide',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    // HeroCTAButtonComponent will be added when created
  ],
  templateUrl: './hero-slide.component.html',
  styleUrl: './hero-slide.component.scss',
})
export class HeroSlideComponent {
  // ============================================
  // Inputs - Data from parent (Smart Component)
  // ============================================

  /**
   * Hero banner data to display
   * Contains all information needed to render the slide
   */
  @Input({ required: true }) banner!: HeroBanner;

  /**
   * Whether this slide is currently active/visible
   * Used to control animations and visibility
   */
  @Input() isActive: boolean = false;

  /**
   * Text color theme (light or dark)
   * Determines text color for headline and subheadline
   * @default Uses banner.theme.textColor
   */
  @Input() textColor?: 'light' | 'dark';

  /**
   * Show/hide gradient overlay
   * @default true
   */
  @Input() showOverlay: boolean = true;

  /**
   * Overlay opacity (0-1)
   * @default Uses banner.theme.overlayOpacity or 0.3
   */
  @Input() overlayOpacity?: number;

  /**
   * Enable/disable click on entire slide
   * @default true
   */
  @Input() clickable: boolean = true;

  /**
   * Enable/disable CTA button
   * @default Uses banner.cta.visible
   */
  @Input() showCTA?: boolean;

  // ============================================
  // Outputs - Events emitted to parent
  // ============================================

  /**
   * Emitted when the slide background is clicked
   * Parent should handle navigation
   */
  @Output() bannerClick = new EventEmitter<void>();

  /**
   * Emitted when the CTA button is clicked
   * Parent should handle CTA action and analytics
   */
  @Output() ctaClick = new EventEmitter<void>();

  // ============================================
  // Host Bindings - CSS classes on component element
  // ============================================

  /**
   * Bind active class to host element
   * Allows parent to style active slide via CSS
   */
  @HostBinding('class.hero-slide--active')
  get isActiveClass(): boolean {
    return this.isActive;
  }

  /**
   * Bind slide class to host element
   */
  @HostBinding('class.hero-slide')
  readonly slideClass = true;

  // ============================================
  // Getters - Computed values for template
  // ============================================

  /**
   * Get text color for headline/subheadline
   * Prioritizes @Input, then theme, then default 'light'
   */
  get effectiveTextColor(): 'light' | 'dark' {
    return this.textColor || this.banner.theme.textColor || 'light';
  }

  /**
   * Get overlay opacity
   * Prioritizes @Input, then theme, then default 0.3
   */
  get effectiveOverlayOpacity(): number {
    return this.overlayOpacity ?? this.banner.theme.overlayOpacity ?? 0.3;
  }

  /**
   * Get whether CTA should be visible
   * Checks multiple sources: @Input, banner.cta.visible
   */
  get shouldShowCTA(): boolean {
    if (this.showCTA !== undefined) {
      return this.showCTA;
    }
    return this.banner.cta.visible !== false;
  }

  /**
   * Get background image URL
   * Uses mobile image if available on small screens
   */
  get backgroundImageUrl(): string {
    // Could be extended to check window size for mobile image
    return this.banner.image.url;
  }

  /**
   * Get gradient direction CSS class
   */
  get gradientDirectionClass(): string {
    return `gradient-${this.banner.theme.gradientDirection || 'diagonal'}`;
  }

  // ============================================
  // Event Handlers - Pure delegation to outputs
  // ============================================

  /**
   * Handle click on slide background
   * Simply emits event to parent (no logic)
   */
  onSlideBackgroundClick(): void {
    if (this.clickable) {
      this.bannerClick.emit();
    }
  }

  /**
   * Handle click on CTA button
   * Simply emits event to parent (no logic)
   *
   * @param event Mouse event (for stopPropagation)
   */
  onCTAButtonClick(event: Event): void {
    event.stopPropagation(); // Prevent slide click
    this.ctaClick.emit();
  }

  /**
   * Handle keyboard activation (Enter/Space)
   * For accessibility support
   *
   * @param event Keyboard event
   */
  onKeyDown(event: KeyboardEvent): void {
    if ((event.key === 'Enter' || event.key === ' ') && this.clickable) {
      event.preventDefault();
      this.bannerClick.emit();
    }
  }

  /**
   * Handle image load success
   * Tracks successful lazy loading of banner image
   *
   * @param event Load event (optional)
   */
  onImageLoad(event?: Event): void {
    console.log('✅ Hero banner image loaded:', this.banner.name.english);

    // Add 'loaded' class for fade-in effect
    if (event) {
      const imgElement = event.target as HTMLImageElement;
      imgElement.classList.add('loaded');
    }
  }

  /**
   * Handle image load error
   * Provides fallback behavior if image fails to load
   *
   * @param event Error event
   */
  onImageError(event: Event): void {
    console.error('❌ Hero banner image failed to load:', {
      bannerId: this.banner.id,
      bannerName: this.banner.name.english,
      imageUrl: this.backgroundImageUrl,
    });

    // Set fallback image or styling
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = 'assets/images/hero-placeholder.jpg'; // Fallback image
    imgElement.alt = 'Banner image unavailable';
    imgElement.classList.add('loaded'); // Show fallback image
  }
}
