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
 */
export interface HeroBanner {
  id: number;
  title: string;
  titleAr: string;
  subtitle: string;
  image: string;
  link: string;
}

/**
 * Hero Image Slider Component
 *
 * Displays full-width hero banner carousel with:
 * - Auto-play functionality (5 second intervals)
 * - Manual navigation (arrows + dot indicators)
 * - Progress bar animation
 * - Pause on hover
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

  // Input: Banner data from parent
  banners = input<HeroBanner[]>([]);

  // Slider state
  currentSlide = signal<number>(0);
  isAutoplayActive = signal<boolean>(true);
  slideProgress = signal<number>(0);

  readonly AUTOPLAY_INTERVAL = 5000; // 5 seconds
  readonly PROGRESS_INTERVAL = 50;   // 50ms for smooth animation

  // Computed values
  totalSlides = computed(() => this.banners().length);
  currentBanner = computed(() => this.banners()[this.currentSlide()]);

  ngOnInit(): void {
    if (this.banners().length > 0) {
      this.startAutoplay();
    }
  }

  /**
   * Navigate to next slide
   */
  nextSlide(): void {
    const next = (this.currentSlide() + 1) % this.totalSlides();
    this.currentSlide.set(next);
    this.slideProgress.set(0);
  }

  /**
   * Navigate to previous slide
   */
  previousSlide(): void {
    const current = this.currentSlide();
    const prev = current === 0 ? this.totalSlides() - 1 : current - 1;
    this.currentSlide.set(prev);
    this.slideProgress.set(0);
  }

  /**
   * Navigate to specific slide by index
   */
  goToSlide(index: number): void {
    this.currentSlide.set(index);
    this.slideProgress.set(0);
  }

  /**
   * Pause autoplay (on hover)
   */
  pauseAutoplay(): void {
    this.isAutoplayActive.set(false);
  }

  /**
   * Resume autoplay (on mouse leave)
   */
  resumeAutoplay(): void {
    this.isAutoplayActive.set(true);
  }

  /**
   * Start autoplay and progress bar animation
   * @private
   */
  private startAutoplay(): void {
    // Main autoplay interval (5 seconds)
    interval(this.AUTOPLAY_INTERVAL)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.isAutoplayActive()) {
          this.nextSlide();
        }
      });

    // Progress bar animation (50ms updates)
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
