import { Component, ChangeDetectionStrategy, Input, OnInit, DestroyRef, inject, AfterViewInit, ElementRef, ViewChild, CUSTOM_ELEMENTS_SCHEMA, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { register } from 'swiper/element/bundle';

// Register Swiper web components
register();

@Component({
  selector: 'app-slider-image-swiper',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './slider-image-swiper.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,

  styleUrls: ['./slider-image-swiper.component.scss']
})
export class SliderImageSwiperComponent implements OnInit, AfterViewInit {
  @Input() images: { src: string; alt?: string; link?: string; hasError?: boolean }[] = [];
  @Input() offerBaseUrl?: string = '/offers';
  @Input() category?: string;
  @Input() autoplay: boolean = true;
  @Input() intervalMs: number = 4000;
  @Input() pauseOnHover: boolean = true;

  @ViewChild('swiperContainer', { static: false }) swiperContainer!: ElementRef;

  currentDirection: 'rtl' | 'ltr' = 'ltr';
  swiperInstance: any;
  isAutoplayPaused: boolean = false;
  isComponentReady: boolean = false;

  private destroyRef = inject(DestroyRef);

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.detectDirection();
    this.validateInputs();
  }

  ngAfterViewInit(): void {
    this.initializeSwiper();
    this.isComponentReady = true;
    this.cdr.detectChanges();

    // Register cleanup on destroy
    this.destroyRef.onDestroy(() => {
      this.destroySwiper();
    });
  }

  private detectDirection(): void {
    if (typeof document !== 'undefined') {
      const docDir = document.documentElement.getAttribute('dir');
      this.currentDirection = docDir === 'rtl' ? 'rtl' : 'ltr';
    }
  }

  private validateInputs(): void {
    if (!this.images || this.images.length === 0) {
      console.warn('SliderImageSwiperComponent: No images provided');
    }

    if (this.intervalMs < 1000) {
      console.warn('SliderImageSwiperComponent: Interval too short, setting to 1000ms');
      this.intervalMs = 1000;
    }
  }

  private async initializeSwiper(): Promise<void> {
    if (!this.swiperContainer?.nativeElement) {
      console.error('SliderImageSwiperComponent: Swiper container not found');
      return;
    }

    try {
      const swiperEl = this.swiperContainer.nativeElement;

      // Configure Swiper parameters
      const swiperConfig = {
        slidesPerView: 1,
        spaceBetween: 0,
        loop: this.images.length > 1,
        autoplay: this.autoplay && this.images.length > 1 ? {
          delay: this.intervalMs,
          disableOnInteraction: false,
          pauseOnMouseEnter: this.pauseOnHover
        } : false,
        navigation: {
          enabled: this.images.length > 1
        },
        pagination: {
          enabled: this.images.length > 1,
          type: 'fraction'
        },
        direction: 'horizontal',
        effect: 'slide',
        speed: 600,
        grabCursor: true,
        watchSlidesProgress: true,
        preloadImages: false,
        lazy: true
      };

      // Apply configuration
      Object.assign(swiperEl, swiperConfig);

      // Initialize the swiper
      swiperEl.initialize();
      this.swiperInstance = swiperEl.swiper;

      // Add event listeners
      this.addSwiperEventListeners();

    } catch (error) {
      console.error('SliderImageSwiperComponent: Failed to initialize Swiper', error);
    }
  }

  private addSwiperEventListeners(): void {
    if (!this.swiperInstance) return;

    // Mouse enter/leave for autoplay control
    if (this.pauseOnHover && this.autoplay) {
      this.swiperContainer.nativeElement.addEventListener('mouseenter', () => {
        this.pauseAutoplay();
      });

      this.swiperContainer.nativeElement.addEventListener('mouseleave', () => {
        this.resumeAutoplay();
      });
    }

    // Keyboard navigation support
    this.swiperContainer.nativeElement.addEventListener('keydown', (event: KeyboardEvent) => {
      this.handleKeyboardNavigation(event);
    });

    // Swiper events
    this.swiperInstance.on('slideChange', () => {
      // Optional: Track slide changes for analytics
      this.onSlideChange();
    });

    this.swiperInstance.on('autoplayPause', () => {
      this.isAutoplayPaused = true;
    });

    this.swiperInstance.on('autoplayResume', () => {
      this.isAutoplayPaused = false;
    });
  }

  private handleKeyboardNavigation(event: KeyboardEvent): void {
    if (!this.hasNavigation()) return;

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        if (this.currentDirection === 'rtl') {
          this.nextSlide();
        } else {
          this.previousSlide();
        }
        break;
      case 'ArrowRight':
        event.preventDefault();
        if (this.currentDirection === 'rtl') {
          this.previousSlide();
        } else {
          this.nextSlide();
        }
        break;
      case 'Home':
        event.preventDefault();
        this.goToSlide(0);
        break;
      case 'End':
        event.preventDefault();
        this.goToSlide(this.images.length - 1);
        break;
      case ' ':
        // Space handled in template
        break;
    }
  }

  private destroySwiper(): void {
    if (this.swiperInstance) {
      try {
        this.swiperInstance.destroy(true, true);
        this.swiperInstance = null;
      } catch (error) {
        console.error('SliderImageSwiperComponent: Error destroying Swiper', error);
      }
    }
  }

  // Public methods for external control
  pauseAutoplay(): void {
    if (this.swiperInstance && this.swiperInstance.autoplay) {
      this.swiperInstance.autoplay.pause();
    }
  }

  resumeAutoplay(): void {
    if (this.swiperInstance && this.swiperInstance.autoplay && this.autoplay) {
      this.swiperInstance.autoplay.resume();
    }
  }

  goToSlide(index: number): void {
    if (this.swiperInstance && index >= 0 && index < this.images.length) {
      this.swiperInstance.slideTo(index);
    }
  }

  nextSlide(): void {
    if (this.swiperInstance) {
      this.swiperInstance.slideNext();
    }
  }

  previousSlide(): void {
    if (this.swiperInstance) {
      this.swiperInstance.slidePrev();
    }
  }

  onSlideClick(item: { src: string; alt?: string; link?: string }, event?: Event): void {
    // Prevent navigation if user is dragging
    if (event && this.swiperInstance?.touches?.diff > 5) {
      return;
    }

    const targetUrl = this.getNavigationUrl(item);
    if (targetUrl) {
      try {
        this.router.navigateByUrl(targetUrl);
      } catch (error) {
        console.error('SliderImageSwiperComponent: Navigation failed', error);
      }
    }
  }

  onImageError(event: Event, imageItem: any, index: number): void {
    console.warn(`SliderImageSwiperComponent: Failed to load image at index ${index}:`, imageItem.src);

    // Mark image as having error
    if (this.images[index]) {
      this.images[index].hasError = true;
    }

    // Optional: Replace with fallback image
    const imgElement = event.target as HTMLImageElement;
    if (imgElement) {
      imgElement.src = 'assets/images/placeholder-image.svg'; // Fallback image
      imgElement.alt = this.currentDirection === 'rtl' ? 'الصورة غير متاحة' : 'Image not available';
    }
  }

  onImageLoad(event: Event, index: number): void {
    // Mark image as successfully loaded
    if (this.images[index]) {
      this.images[index].hasError = false;
    }

    console.log(`SliderImageSwiperComponent: Image loaded successfully at index ${index}`);
  }

  private onSlideChange(): void {
    // Optional: Implement slide change tracking for analytics
    if (this.swiperInstance) {
      const activeIndex = this.swiperInstance.activeIndex;
      console.log(`SliderImageSwiperComponent: Slide changed to index ${activeIndex}`);
    }
  }

  getNavigationUrl(item: { src: string; alt?: string; link?: string }): string | null {
    if (item.link) {
      return item.link;
    }

    if (this.offerBaseUrl) {
      return this.category ? `${this.offerBaseUrl}/${this.category}` : this.offerBaseUrl;
    }

    return null;
  }

  // Utility methods for template
  hasNavigation(): boolean {
    return this.images.length > 1;
  }

  getAutoplayConfig(): any {
    if (!this.autoplay || this.images.length <= 1) {
      return false;
    }

    return {
      delay: this.intervalMs,
      disableOnInteraction: false,
      pauseOnMouseEnter: this.pauseOnHover
    };
  }

  trackByImage(index: number, item: any): any {
    return item.src || index;
  }
}
