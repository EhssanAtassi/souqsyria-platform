/**
 * @file image-gallery.component.ts
 * @description Product image gallery with desktop zoom, mobile Swiper carousel,
 * thumbnail strip, and fullscreen overlay with pinch-to-zoom.
 *
 * @swagger
 * tags:
 *   - name: ImageGallery
 *     description: Product image gallery for detail page (SS-PROD-008)
 */
import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  effect,
  ViewChild,
  ElementRef,
  AfterViewInit,
  DestroyRef,
  inject,
  CUSTOM_ELEMENTS_SCHEMA,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { register } from 'swiper/element';
import { SwiperOptions } from 'swiper/types';
import { Navigation } from 'swiper/modules';
import { Pagination } from 'swiper/modules';
import { Zoom } from 'swiper/modules';
import { ProductDetailImage } from '../../models/product-detail.interface';

/**
 * @description Register Swiper custom elements with only the modules this gallery needs:
 * Navigation (prev/next arrows), Pagination (fraction counter), and Zoom (fullscreen pinch-to-zoom).
 * This avoids importing the full Swiper bundle (~125KB) and only pulls in ~40KB.
 */
register();

/**
 * @description Image gallery component for the product detail page.
 * Desktop: static main image with CSS zoom lens on hover + thumbnails.
 * Mobile: Swiper carousel with fraction pagination + fullscreen pinch-to-zoom.
 */
@Component({
  selector: 'app-image-gallery',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './image-gallery.component.html',
  styleUrls: ['./image-gallery.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'tabindex': '0',
    'role': 'region',
    '[attr.aria-label]': "language() === 'ar' ? 'معرض الصور' : 'Image gallery'",
    '[attr.aria-roledescription]': "language() === 'ar' ? 'معرض صور المنتج' : 'Product image gallery'"
  }
})
export class ImageGalleryComponent implements AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);

  /** Product images to display */
  images = input.required<ProductDetailImage[]>();

  /** Product name for alt text fallback */
  productName = input<string>('');

  /** Display language for RTL handling */
  language = input<'en' | 'ar'>('en');

  /** Externally controlled selected index (e.g., variant image switching) */
  selectedIndex = input<number>(0);

  /** Emits when the displayed image changes */
  imageChange = output<number>();

  /** Internal current image index */
  currentIndex = signal(0);

  /** Whether the CSS zoom lens is active (desktop hover) */
  isZoomActive = signal(false);

  /** Whether fullscreen overlay is open (mobile) */
  isFullscreenOpen = signal(false);

  /** Zoom lens background-position for CSS-driven zoom */
  zoomPosition = signal({ x: '50%', y: '50%' });

  /** Track which images have finished loading */
  imagesLoaded = signal<Set<number>>(new Set());

  /** Track which images failed to load */
  failedImages = signal<Set<number>>(new Set());

  /** Placeholder SVG for failed image loads */
  private readonly placeholderSvg = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23edebe0" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-family="Arial" font-size="18"%3EImage not available%3C/text%3E%3C/svg%3E';

  @ViewChild('swiperContainer') swiperContainer!: ElementRef;
  @ViewChild('fullscreenSwiper') fullscreenSwiper!: ElementRef;

  private swiperInstance: any = null;
  private fullscreenSwiperInstance: any = null;

  /** Currently displayed image based on currentIndex */
  currentImage = computed(() => {
    const imgs = this.images();
    const idx = this.currentIndex();
    if (!imgs || imgs.length === 0) return null;
    return imgs[Math.min(idx, imgs.length - 1)];
  });

  /** Whether there are multiple images (show thumbnails/navigation) */
  hasMultipleImages = computed(() => (this.images()?.length ?? 0) > 1);

  constructor() {
    // Sync external selectedIndex input to internal currentIndex
    effect(() => {
      const externalIdx = this.selectedIndex();
      const imgs = this.images();
      if (imgs && externalIdx >= 0 && externalIdx < imgs.length) {
        this.currentIndex.set(externalIdx);
        this.slideTo(externalIdx);
      }
    }, { allowSignalWrites: true });
  }

  ngAfterViewInit(): void {
    this.initSwiper();
    this.destroyRef.onDestroy(() => this.destroySwiper());
  }

  /**
   * @description Selects a thumbnail image
   * @param index - Image index to display
   */
  selectThumbnail(index: number): void {
    this.currentIndex.set(index);
    this.imageChange.emit(index);
    this.slideTo(index);
  }

  /**
   * @description Handles mouse move over main image for zoom lens
   * @param event - Mouse event from the main image container
   */
  onMainImageMouseMove(event: MouseEvent): void {
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    this.zoomPosition.set({ x: `${x}%`, y: `${y}%` });
  }

  /** @description Activates zoom lens on mouse enter */
  onMainImageMouseEnter(): void {
    this.isZoomActive.set(true);
  }

  /** @description Deactivates zoom lens on mouse leave */
  onMainImageMouseLeave(): void {
    this.isZoomActive.set(false);
  }

  /** @description Opens fullscreen overlay (mobile tap) */
  openFullscreen(): void {
    this.isFullscreenOpen.set(true);
    this.initFullscreenSwiper();
  }

  /** @description Closes fullscreen overlay */
  closeFullscreen(): void {
    this.isFullscreenOpen.set(false);
  }

  /**
   * @description Handles keyboard navigation for the image gallery.
   * ArrowLeft moves to previous image, ArrowRight moves to next image.
   * RTL-aware: arrows are reversed when language is 'ar'.
   * @param event - Keyboard event
   */
  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (!this.hasMultipleImages()) return;

    const imgs = this.images();
    const current = this.currentIndex();
    const isRtl = this.language() === 'ar';

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      // In RTL, left arrow goes forward (next); in LTR, left goes backward (prev)
      const newIndex = isRtl
        ? Math.min(current + 1, imgs.length - 1)
        : Math.max(current - 1, 0);
      this.selectThumbnail(newIndex);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      // In RTL, right arrow goes backward (prev); in LTR, right goes forward (next)
      const newIndex = isRtl
        ? Math.max(current - 1, 0)
        : Math.min(current + 1, imgs.length - 1);
      this.selectThumbnail(newIndex);
    }
  }

  /**
   * @description Marks an image as loaded (hides skeleton)
   * @param index - Image index that loaded
   */
  onImageLoad(index: number): void {
    this.imagesLoaded.update(set => {
      const newSet = new Set(set);
      newSet.add(index);
      return newSet;
    });
    // Remove from failed set if it was previously marked as failed
    this.failedImages.update(set => {
      const newSet = new Set(set);
      newSet.delete(index);
      return newSet;
    });
  }

  /**
   * @description Handles image loading errors by setting placeholder and marking as loaded
   * @param event - Image error event
   * @param index - Image index that failed to load
   */
  onImageError(event: Event, index: number): void {
    const img = event.target as HTMLImageElement;
    img.src = this.placeholderSvg;

    // Mark as both failed and loaded (so skeleton disappears)
    this.failedImages.update(set => {
      const newSet = new Set(set);
      newSet.add(index);
      return newSet;
    });
    this.imagesLoaded.update(set => {
      const newSet = new Set(set);
      newSet.add(index);
      return newSet;
    });
  }

  /**
   * @description Checks if an image has loaded (successfully or with error placeholder)
   * @param index - Image index to check
   * @returns True if the image has finished loading or failed
   */
  isImageLoaded(index: number): boolean {
    return this.imagesLoaded().has(index);
  }

  /**
   * @description Checks if an image failed to load
   * @param index - Image index to check
   * @returns True if the image failed to load
   */
  isImageFailed(index: number): boolean {
    return this.failedImages().has(index);
  }

  /** @description Initializes the mobile Swiper carousel with only Navigation + Pagination modules */
  private initSwiper(): void {
    if (!this.swiperContainer?.nativeElement) return;

    const el = this.swiperContainer.nativeElement;
    Object.assign(el, {
      modules: [Navigation, Pagination],
      slidesPerView: 1,
      spaceBetween: 0,
      pagination: { enabled: true, type: 'fraction' },
      navigation: { enabled: this.hasMultipleImages() },
      speed: 400,
      grabCursor: true,
    } satisfies SwiperOptions);

    el.initialize();
    this.swiperInstance = el.swiper;

    if (this.swiperInstance) {
      this.swiperInstance.on('slideChange', () => {
        const idx = this.swiperInstance.activeIndex;
        this.currentIndex.set(idx);
        this.imageChange.emit(idx);
      });
    }
  }

  /** @description Initializes the fullscreen Swiper with Zoom + Pagination modules */
  private initFullscreenSwiper(): void {
    setTimeout(() => {
      if (!this.fullscreenSwiper?.nativeElement) return;
      const el = this.fullscreenSwiper.nativeElement;
      Object.assign(el, {
        modules: [Zoom, Pagination],
        slidesPerView: 1,
        spaceBetween: 0,
        zoom: { maxRatio: 3 },
        pagination: { enabled: true, type: 'fraction' },
        initialSlide: this.currentIndex(),
        speed: 400,
      } satisfies SwiperOptions);
      el.initialize();
      // Store reference for cleanup
      this.fullscreenSwiperInstance = el.swiper;
    });
  }

  /** @description Navigates Swiper to a given index */
  private slideTo(index: number): void {
    if (this.swiperInstance && index >= 0) {
      this.swiperInstance.slideTo(index);
    }
  }

  /**
   * @description Cleans up all Swiper instances to prevent memory leaks
   * Destroys both main mobile carousel and fullscreen overlay Swiper
   */
  private destroySwiper(): void {
    // Destroy main mobile Swiper
    if (this.swiperInstance) {
      this.swiperInstance.destroy(true, true);
      this.swiperInstance = null;
    }

    // Destroy fullscreen Swiper if it exists
    if (this.fullscreenSwiperInstance) {
      this.fullscreenSwiperInstance.destroy(true, true);
      this.fullscreenSwiperInstance = null;
    }
  }
}
