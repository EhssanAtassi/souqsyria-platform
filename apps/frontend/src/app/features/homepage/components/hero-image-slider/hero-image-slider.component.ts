import {
  Component,
  OnInit,
  signal,
  computed,
  input,
  ChangeDetectionStrategy,
  DestroyRef,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';

/**
 * Banner interface for hero slider
 *
 * @description Represents a single hero banner slide with bilingual support
 * and optional CTA text
 *
 * @swagger
 * components:
 *   schemas:
 *     HeroBanner:
 *       type: object
 *       properties:
 *         id: { type: number }
 *         title: { type: string }
 *         titleAr: { type: string }
 *         subtitle: { type: string }
 *         image: { type: string }
 *         link: { type: string }
 *         ctaText: { type: string, description: 'Optional CTA button label, defaults to Shop Now' }
 */
export interface HeroBanner {
  /** Unique slide identifier */
  id: number;
  /** English title displayed in Playfair Display */
  title: string;
  /** Arabic title displayed in Cairo font */
  titleAr: string;
  /** English subtitle / tagline */
  subtitle: string;
  /** Image URL (Unsplash CDN or local asset) */
  image: string;
  /** Navigation link on click */
  link: string;
  /** Optional CTA button text (default: 'Shop Now') */
  ctaText?: string;
}

/**
 * Hero Image Slider Component — Premium Redesign
 *
 * @description Full-width hero banner carousel with cinematic effects:
 * - Ken Burns zoom effect on active slides
 * - Staggered text entrance animations (title → titleAr → subtitle → CTA)
 * - Glassmorphism navigation arrows (hidden until hover)
 * - Animated pill-shape dot indicators with golden wheat glow
 * - Progress bar with pulsing glow
 * - Slide counter (e.g. "2 / 5")
 * - Image error fallback (gradient placeholder)
 * - CTA button with arrow icon
 *
 * @Input banners - Array of hero banner data
 */
@Component({
  selector: 'app-hero-image-slider',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './hero-image-slider.component.html',
  styleUrl: './hero-image-slider.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeroImageSliderComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  /** Banner data from parent component */
  banners = input<HeroBanner[]>([]);

  /** Current active slide index */
  currentSlide = signal<number>(0);

  /** Whether autoplay is active (pauses on hover) */
  isAutoplayActive = signal<boolean>(true);

  /** Progress bar percentage (0–100) */
  slideProgress = signal<number>(0);

  /**
   * Tracks which slide images have errored out
   * Key: slide index, Value: true if broken
   */
  imageErrors = signal<Record<number, boolean>>({});

  /** Autoplay interval in milliseconds */
  readonly AUTOPLAY_INTERVAL = 5000;

  /** Progress bar update tick in milliseconds */
  readonly PROGRESS_INTERVAL = 50;

  /** Total number of slides */
  totalSlides = computed(() => this.banners().length);

  /** Currently active banner data */
  currentBanner = computed(() => this.banners()[this.currentSlide()]);

  ngOnInit(): void {
    if (this.banners().length > 0) {
      this.startAutoplay();
    }
  }

  /**
   * Navigate to next slide (wraps around)
   */
  nextSlide(): void {
    const next = (this.currentSlide() + 1) % this.totalSlides();
    this.currentSlide.set(next);
    this.slideProgress.set(0);
  }

  /**
   * Navigate to previous slide (wraps around)
   */
  previousSlide(): void {
    const current = this.currentSlide();
    const prev = current === 0 ? this.totalSlides() - 1 : current - 1;
    this.currentSlide.set(prev);
    this.slideProgress.set(0);
  }

  /**
   * Navigate to specific slide by index
   * @param index - Target slide index
   */
  goToSlide(index: number): void {
    this.currentSlide.set(index);
    this.slideProgress.set(0);
  }

  /**
   * Pause autoplay on mouse enter
   */
  pauseAutoplay(): void {
    this.isAutoplayActive.set(false);
  }

  /**
   * Resume autoplay on mouse leave
   */
  resumeAutoplay(): void {
    this.isAutoplayActive.set(true);
  }

  /**
   * Handle image load error — shows gradient fallback
   * @param index - Index of the broken slide image
   */
  onImageError(index: number): void {
    this.imageErrors.update(errors => ({
      ...errors,
      [index]: true
    }));
  }

  /**
   * Start autoplay and progress bar animation
   * @private
   */
  private startAutoplay(): void {
    interval(this.AUTOPLAY_INTERVAL)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.isAutoplayActive()) {
          this.nextSlide();
        }
      });

    interval(this.PROGRESS_INTERVAL)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.isAutoplayActive()) {
          const progress = this.slideProgress() +
            (this.PROGRESS_INTERVAL / this.AUTOPLAY_INTERVAL) * 100;
          this.slideProgress.set(progress >= 100 ? 0 : progress);
        }
      });
  }
}
