/**
 * Hero Container Component (Smart Component)
 * Enterprise-grade hero banner carousel with full state management
 *
 * Features:
 * - Automatic banner rotation with configurable interval
 * - Manual navigation (arrows, dots, keyboard)
 * - Analytics tracking (impressions, clicks, CTA interactions)
 * - Responsive design (mobile, tablet, desktop)
 * - RTL support for Arabic
 * - Error handling and retry logic
 * - Accessibility (ARIA labels, keyboard navigation)
 * - OnPush change detection for performance
 * - Angular signals for reactive state
 *
 * @swagger
 * components:
 *   schemas:
 *     HeroContainerComponent:
 *       type: object
 *       description: Smart container managing hero banner lifecycle
 */

import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  DestroyRef,
  inject,
  signal,
  computed,
  effect,
  Input,
  Output,
  EventEmitter,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval, Subject } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';

import { HeroBannerService } from '../../services/hero-banner.service';
import { HeroAnalyticsService } from '../../services/hero-analytics.service';
import {
  HeroBanner,
  BannerSlideEvent,
  CTAClickEvent,
} from '../../interfaces/hero-banner.interface';

// Presentational Components
import { HeroSlideComponent } from '../hero-slide/hero-slide.component';
import { HeroNavigationComponent } from '../hero-navigation/hero-navigation.component';
import { HeroDotsComponent } from '../hero-dots/hero-dots.component';
import { HeroProgressComponent } from '../hero-progress/hero-progress.component';

/**
 * Hero Container Component
 *
 * @example
 * <app-hero-container
 *   [autoplay]="true"
 *   [autoplayInterval]="5000"
 *   [pauseOnHover]="true"
 *   [showNavigation]="true"
 *   [showDots]="true"
 *   (bannerClick)="onBannerClick($event)"
 *   (ctaClick)="onCTAClick($event)"
 * ></app-hero-container>
 */
@Component({
  selector: 'app-hero-container',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    // Presentational Components (Dumb Components)
    HeroSlideComponent,
    HeroNavigationComponent,
    HeroDotsComponent,
    HeroProgressComponent,
  ],
  templateUrl: './hero-container.component.html',
  styleUrl: './hero-container.component.scss',
})
export class HeroContainerComponent implements OnInit {
  // Services
  private readonly heroBannerService = inject(HeroBannerService);
  private readonly heroAnalytics = inject(HeroAnalyticsService);
  private readonly destroyRef = inject(DestroyRef);

  // ============================================
  // Inputs - Configuration
  // ============================================

  /**
   * Enable automatic banner rotation
   */
  @Input() autoplay: boolean = true;

  /**
   * Autoplay interval in milliseconds
   */
  @Input() autoplayInterval: number = 5000;

  /**
   * Pause autoplay on hover
   */
  @Input() pauseOnHover: boolean = true;

  /**
   * Show navigation arrows
   */
  @Input() showNavigation: boolean = true;

  /**
   * Show navigation dots
   */
  @Input() showDots: boolean = true;

  /**
   * Show progress indicator
   */
  @Input() showProgress: boolean = true;

  /**
   * Enable keyboard navigation
   */
  @Input() enableKeyboardNav: boolean = true;

  /**
   * Enable touch/swipe gestures (mobile)
   */
  @Input() enableSwipe: boolean = true;

  // ============================================
  // Outputs - Events
  // ============================================

  /**
   * Emitted when a banner is clicked
   */
  @Output() bannerClick = new EventEmitter<HeroBanner>();

  /**
   * Emitted when a CTA button is clicked
   */
  @Output() ctaClick = new EventEmitter<CTAClickEvent>();

  /**
   * Emitted when slide changes
   */
  @Output() slideChange = new EventEmitter<BannerSlideEvent>();

  /**
   * Emitted when an error occurs
   */
  @Output() error = new EventEmitter<Error>();

  // ============================================
  // Signals - Reactive State
  // ============================================

  /**
   * Hero banners loaded from API/mock data
   */
  readonly heroBanners = signal<HeroBanner[]>([]);

  /**
   * Current active slide index
   */
  readonly currentSlideIndex = signal<number>(0);

  /**
   * Loading state
   */
  readonly isLoading = signal<boolean>(true);

  /**
   * Error state
   */
  readonly loadError = signal<Error | null>(null);

  /**
   * Autoplay active state
   */
  readonly isAutoplayActive = signal<boolean>(false);

  /**
   * Autoplay paused state (e.g., on hover)
   */
  readonly isAutoplayPaused = signal<boolean>(false);

  /**
   * Component initialized state
   */
  readonly isInitialized = signal<boolean>(false);

  // ============================================
  // Computed Signals
  // ============================================

  /**
   * Current active banner
   */
  readonly currentBanner = computed(() => {
    const banners = this.heroBanners();
    const index = this.currentSlideIndex();
    return banners[index] || null;
  });

  /**
   * Total number of slides
   */
  readonly totalSlides = computed(() => this.heroBanners().length);

  /**
   * Has multiple slides (show navigation)
   */
  readonly hasMultipleSlides = computed(() => this.totalSlides() > 1);

  /**
   * Has valid data to display
   */
  readonly hasData = computed(() => this.heroBanners().length > 0);

  /**
   * Show error UI
   */
  readonly shouldShowError = computed(() => !!this.loadError() && !this.hasData());

  /**
   * Show loading UI
   */
  readonly shouldShowLoading = computed(() => this.isLoading() && !this.hasData());

  /**
   * Show hero content
   */
  readonly shouldShowContent = computed(() => this.hasData() && !this.isLoading());

  /**
   * Progress percentage for current slide
   */
  readonly slideProgress = signal<number>(0);

  // ============================================
  // Private State
  // ============================================

  private autoplaySubscription$ = new Subject<void>();
  private impressionTracked = new Set<string>(); // Track which banners have been tracked

  // Touch/Swipe State
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private touchStartTime: number = 0;
  private readonly MIN_SWIPE_DISTANCE: number = 50; // Minimum distance in pixels to trigger swipe
  private readonly MAX_SWIPE_TIME: number = 500; // Maximum time in ms for valid swipe
  private readonly MAX_VERTICAL_DRIFT: number = 100; // Maximum vertical movement allowed

  // ============================================
  // Lifecycle Hooks
  // ============================================

  constructor() {
    // Effect to start/stop autoplay based on state
    effect(() => {
      const shouldAutoplay = this.autoplay && this.hasMultipleSlides() && !this.isAutoplayPaused();
      if (shouldAutoplay && !this.isAutoplayActive()) {
        this.startAutoplay();
      } else if (!shouldAutoplay && this.isAutoplayActive()) {
        this.stopAutoplay();
      }
    });

    // Effect to track impressions when slide changes
    effect(() => {
      const banner = this.currentBanner();
      const index = this.currentSlideIndex();

      if (banner && this.isInitialized()) {
        this.trackImpressionIfNotTracked(banner, index);
      }
    });
  }

  ngOnInit(): void {
    // Initialize analytics session
    this.heroAnalytics.initializeSession();

    // Load hero banners
    this.loadHeroBanners();
  }

  // ============================================
  // Public Methods - API
  // ============================================

  /**
   * Navigate to next slide
   */
  next(): void {
    if (!this.hasMultipleSlides()) return;

    const newIndex = (this.currentSlideIndex() + 1) % this.totalSlides();
    this.goToSlide(newIndex, 'manual');
  }

  /**
   * Navigate to previous slide
   */
  previous(): void {
    if (!this.hasMultipleSlides()) return;

    const newIndex =
      this.currentSlideIndex() === 0
        ? this.totalSlides() - 1
        : this.currentSlideIndex() - 1;
    this.goToSlide(newIndex, 'manual');
  }

  /**
   * Navigate to specific slide
   *
   * @param index Slide index (0-based)
   * @param method Navigation method (auto, manual, keyboard)
   */
  goToSlide(index: number, method: 'auto' | 'manual' | 'keyboard' = 'manual'): void {
    if (index < 0 || index >= this.totalSlides()) {
      console.warn(`Invalid slide index: ${index}`);
      return;
    }

    const previousIndex = this.currentSlideIndex();

    if (previousIndex === index) {
      return; // Already on this slide
    }

    // Update slide index
    this.currentSlideIndex.set(index);

    // Reset progress
    this.slideProgress.set(0);

    // Emit slide change event
    const slideEvent: BannerSlideEvent = {
      previousIndex,
      currentIndex: index,
      totalSlides: this.totalSlides(),
      method,
      timestamp: new Date(),
    };
    this.slideChange.emit(slideEvent);

    // Track analytics
    const currentBanner = this.currentBanner();
    if (currentBanner) {
      this.heroAnalytics.trackSlideChange(slideEvent, currentBanner);
    }

    // Restart autoplay timer
    if (this.isAutoplayActive()) {
      this.restartAutoplay();
    }
  }

  /**
   * Pause autoplay
   */
  pauseAutoplay(): void {
    if (!this.isAutoplayActive()) return;

    this.isAutoplayPaused.set(true);
    const banner = this.currentBanner();
    if (banner) {
      this.heroAnalytics.trackAutoplayPause(banner, 'manual');
    }
  }

  /**
   * Resume autoplay
   */
  resumeAutoplay(): void {
    if (!this.autoplay) return;

    this.isAutoplayPaused.set(false);
    const banner = this.currentBanner();
    if (banner) {
      this.heroAnalytics.trackAutoplayResume(banner, 'manual');
    }
  }

  /**
   * Reload hero banners (force refresh)
   */
  reloadBanners(): void {
    this.heroBannerService.clearCache();
    this.loadHeroBanners();
  }

  // ============================================
  // Event Handlers
  // ============================================

  /**
   * Handle banner click event
   *
   * @param banner Banner that was clicked
   */
  onBannerClick(banner: HeroBanner): void {
    console.log('Hero Container: Banner clicked', banner.name.english);

    // Emit event
    this.bannerClick.emit(banner);

    // Track analytics
    const position = this.currentSlideIndex();
    const targetUrl = banner.targetRoute.target;
    this.heroAnalytics.trackClick(banner, position, targetUrl);

    // Track via service (for backend recording)
    this.heroBannerService.trackClick(banner.id, {
      position,
      targetUrl,
      timestamp: new Date(),
    }).subscribe();
  }

  /**
   * Handle CTA button click event
   *
   * @param banner Banner with CTA
   * @param ctaType CTA type
   */
  onCTAClick(banner: HeroBanner, ctaType: string = 'primary'): void {
    const ctaText = banner.cta.text.english;
    console.log('Hero Container: CTA clicked', {
      banner: banner.name.english,
      ctaText,
      ctaType,
    });

    // Emit event
    const ctaEvent: CTAClickEvent = {
      bannerId: banner.id,
      ctaText,
      targetRoute: banner.targetRoute.target,
      position: this.currentSlideIndex(),
      timestamp: new Date(),
    };
    this.ctaClick.emit(ctaEvent);

    // Track analytics
    this.heroAnalytics.trackCTAClick(banner, ctaType, this.currentSlideIndex());

    // Track via service
    this.heroBannerService.trackCTAClick(banner.id, ctaText, {
      position: this.currentSlideIndex(),
      ctaType,
      timestamp: new Date(),
    }).subscribe();
  }

  /**
   * Handle mouse enter (pause autoplay)
   */
  onMouseEnter(): void {
    if (!this.pauseOnHover || !this.isAutoplayActive()) return;

    this.isAutoplayPaused.set(true);
    const banner = this.currentBanner();
    if (banner) {
      this.heroAnalytics.trackAutoplayPause(banner, 'hover');
    }
  }

  /**
   * Handle mouse leave (resume autoplay)
   */
  onMouseLeave(): void {
    if (!this.pauseOnHover || !this.autoplay) return;

    this.isAutoplayPaused.set(false);
    const banner = this.currentBanner();
    if (banner) {
      this.heroAnalytics.trackAutoplayResume(banner, 'hover_end');
    }
  }

  /**
   * Handle keyboard navigation
   *
   * @param event Keyboard event
   */
  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (!this.enableKeyboardNav || !this.hasMultipleSlides()) return;

    // Check if user is typing in an input field
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      return;
    }

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        this.previous();
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.next();
        break;
      case 'Home':
        event.preventDefault();
        this.goToSlide(0, 'keyboard');
        break;
      case 'End':
        event.preventDefault();
        this.goToSlide(this.totalSlides() - 1, 'keyboard');
        break;
    }
  }

  /**
   * Handle touch start event
   * Records initial touch position and timestamp for swipe detection
   *
   * @param event Touch event
   */
  onTouchStart(event: TouchEvent): void {
    if (!this.enableSwipe || !this.hasMultipleSlides()) return;

    const touch = event.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    this.touchStartTime = Date.now();

    // Pause autoplay during swipe interaction
    if (this.isAutoplayActive()) {
      this.isAutoplayPaused.set(true);
    }
  }

  /**
   * Handle touch move event
   * Prevents default scrolling behavior if horizontal swipe is detected
   *
   * @param event Touch event
   */
  onTouchMove(event: TouchEvent): void {
    if (!this.enableSwipe || !this.hasMultipleSlides()) return;

    const touch = event.touches[0];
    const deltaX = Math.abs(touch.clientX - this.touchStartX);
    const deltaY = Math.abs(touch.clientY - this.touchStartY);

    // If swipe is more horizontal than vertical, prevent default scroll
    if (deltaX > deltaY) {
      event.preventDefault();
    }
  }

  /**
   * Handle touch end event
   * Detects swipe direction and triggers navigation if valid swipe
   *
   * @param event Touch event
   */
  onTouchEnd(event: TouchEvent): void {
    if (!this.enableSwipe || !this.hasMultipleSlides()) return;

    const touch = event.changedTouches[0];
    const touchEndX = touch.clientX;
    const touchEndY = touch.clientY;
    const touchEndTime = Date.now();

    // Calculate swipe metrics
    const deltaX = touchEndX - this.touchStartX;
    const deltaY = Math.abs(touchEndY - this.touchStartY);
    const swipeDistance = Math.abs(deltaX);
    const swipeTime = touchEndTime - this.touchStartTime;

    // Validate swipe gesture
    const isValidSwipe =
      swipeDistance >= this.MIN_SWIPE_DISTANCE &&
      swipeTime <= this.MAX_SWIPE_TIME &&
      deltaY <= this.MAX_VERTICAL_DRIFT;

    if (isValidSwipe) {
      // Determine swipe direction
      if (deltaX > 0) {
        // Swipe right → previous slide
        this.previous();
        console.log('👉 Swipe detected: RIGHT (previous)');
      } else {
        // Swipe left → next slide
        this.next();
        console.log('👈 Swipe detected: LEFT (next)');
      }

      // Track swipe analytics
      const banner = this.currentBanner();
      if (banner) {
        this.heroAnalytics.trackSwipeGesture(banner, deltaX > 0 ? 'right' : 'left', {
          distance: swipeDistance,
          duration: swipeTime,
        });
      }
    }

    // Resume autoplay after swipe interaction
    if (this.autoplay && this.isAutoplayPaused()) {
      this.isAutoplayPaused.set(false);
    }

    // Reset touch state
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchStartTime = 0;
  }

  // ============================================
  // Private Methods
  // ============================================

  /**
   * Load hero banners from service
   */
  private loadHeroBanners(): void {
    this.isLoading.set(true);
    this.loadError.set(null);

    this.heroBannerService
      .getActiveHeroBanners()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (banners) => {
          console.log(`✅ Hero Container: Loaded ${banners.length} banners`);
          this.heroBanners.set(banners);
          this.isLoading.set(false);
          this.isInitialized.set(true);

          // Track initial impression
          if (banners.length > 0) {
            this.trackImpressionIfNotTracked(banners[0], 0);
          }
        },
        error: (error) => {
          console.error('❌ Hero Container: Failed to load banners', error);
          this.loadError.set(error);
          this.isLoading.set(false);
          this.error.emit(error);
        },
      });
  }

  /**
   * Start autoplay timer
   */
  private startAutoplay(): void {
    if (this.isAutoplayActive()) return;

    this.isAutoplayActive.set(true);

    interval(this.autoplayInterval)
      .pipe(
        takeUntil(this.autoplaySubscription$),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        if (!this.isAutoplayPaused()) {
          this.next();
        }
      });

    console.log('▶️ Hero Container: Autoplay started');
  }

  /**
   * Stop autoplay timer
   */
  private stopAutoplay(): void {
    if (!this.isAutoplayActive()) return;

    this.autoplaySubscription$.next();
    this.isAutoplayActive.set(false);
    console.log('⏸️ Hero Container: Autoplay stopped');
  }

  /**
   * Restart autoplay timer
   * Useful when user manually changes slides
   */
  private restartAutoplay(): void {
    this.stopAutoplay();
    this.startAutoplay();
  }

  /**
   * Track banner impression if not already tracked
   *
   * @param banner Banner to track
   * @param position Position in carousel
   */
  private trackImpressionIfNotTracked(banner: HeroBanner, position: number): void {
    const trackingKey = `${banner.id}-${position}`;

    if (this.impressionTracked.has(trackingKey)) {
      return; // Already tracked
    }

    // Track analytics
    this.heroAnalytics.trackImpression(banner, position, 'auto');

    // Track via service (for backend recording)
    this.heroBannerService.trackImpression(banner.id, {
      position,
      timestamp: new Date(),
    }).subscribe();

    // Mark as tracked
    this.impressionTracked.add(trackingKey);
  }
}
