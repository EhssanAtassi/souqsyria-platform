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
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { register } from 'swiper/element/bundle';
import { ProductDetailImage } from '../../models/product-detail.interface';

// Register Swiper custom elements
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

  @ViewChild('swiperContainer') swiperContainer!: ElementRef;
  @ViewChild('fullscreenSwiper') fullscreenSwiper!: ElementRef;

  private swiperInstance: any = null;

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
   * @description Marks an image as loaded (hides skeleton)
   * @param index - Image index that loaded
   */
  onImageLoad(index: number): void {
    this.imagesLoaded.update(set => {
      const newSet = new Set(set);
      newSet.add(index);
      return newSet;
    });
  }

  /**
   * @description Checks if an image has loaded
   * @param index - Image index to check
   * @returns True if the image has finished loading
   */
  isImageLoaded(index: number): boolean {
    return this.imagesLoaded().has(index);
  }

  /** @description Initializes the mobile Swiper carousel */
  private initSwiper(): void {
    if (!this.swiperContainer?.nativeElement) return;

    const el = this.swiperContainer.nativeElement;
    Object.assign(el, {
      slidesPerView: 1,
      spaceBetween: 0,
      pagination: { enabled: true, type: 'fraction' },
      navigation: { enabled: this.hasMultipleImages() },
      speed: 400,
      grabCursor: true,
    });

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

  /** @description Initializes the fullscreen Swiper with zoom module */
  private initFullscreenSwiper(): void {
    setTimeout(() => {
      if (!this.fullscreenSwiper?.nativeElement) return;
      const el = this.fullscreenSwiper.nativeElement;
      Object.assign(el, {
        slidesPerView: 1,
        spaceBetween: 0,
        zoom: { enabled: true, maxRatio: 3 },
        pagination: { enabled: true, type: 'fraction' },
        initialSlide: this.currentIndex(),
        speed: 400,
      });
      el.initialize();
    });
  }

  /** @description Navigates Swiper to a given index */
  private slideTo(index: number): void {
    if (this.swiperInstance && index >= 0) {
      this.swiperInstance.slideTo(index);
    }
  }

  /** @description Cleans up Swiper instance */
  private destroySwiper(): void {
    if (this.swiperInstance) {
      this.swiperInstance.destroy(true, true);
      this.swiperInstance = null;
    }
  }
}
