/**
 * @file product-carousel.component.ts
 * @description Reusable horizontal product carousel with Swiper.js integration
 * Displays product cards in a scrollable carousel with navigation arrows
 *
 * @swagger
 * tags:
 *   - name: ProductCarousel
 *     description: Homepage product carousel component (SS-PROD-CAROUSEL)
 */
import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  ViewChild,
  ElementRef,
  AfterViewInit,
  DestroyRef,
  inject,
  CUSTOM_ELEMENTS_SCHEMA,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { register } from 'swiper/element';
import { SwiperOptions } from 'swiper/types';
import { Navigation, Pagination } from 'swiper/modules';
import { ProductListItem } from '../../models/product-list.interface';
import { ProductCardComponent } from '../product-card/product-card.component';

/**
 * @description Register Swiper custom elements with Navigation and Pagination modules
 * Navigation: prev/next arrows, Pagination: dots or fraction counter
 */
register();

/**
 * @description Product carousel component for homepage sections.
 * Desktop: 4 cards per view with navigation arrows.
 * Tablet: 2 cards per view.
 * Mobile: 1 card per view with swipe gestures.
 * Renders ProductCardComponent for each product item.
 */
@Component({
  selector: 'app-product-carousel',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductCardComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './product-carousel.component.html',
  styleUrls: ['./product-carousel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCarouselComponent implements AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);

  /** Array of products to display in carousel */
  products = input.required<ProductListItem[]>();

  /** Section title in English */
  title = input.required<string>();

  /** Section title in Arabic */
  titleAr = input.required<string>();

  /** Current UI language */
  language = input<'en' | 'ar'>('en');

  /** Loading state for skeleton display */
  loading = input<boolean>(false);

  /** Optional "View All" link route */
  viewAllRoute = input<string | null>(null);

  /** Emits when user clicks Add to Cart on a product */
  addToCart = output<ProductListItem>();

  /** Emits when user clicks Add to Wishlist on a product */
  addToWishlist = output<ProductListItem>();

  @ViewChild('swiperContainer') swiperContainer!: ElementRef;

  private swiperInstance: any = null;

  /** Computed section title based on language */
  sectionTitle = computed(() => {
    const lang = this.language();
    return lang === 'ar' ? this.titleAr() : this.title();
  });

  /** Computed "View All" label based on language */
  viewAllLabel = computed(() => {
    const lang = this.language();
    return lang === 'ar' ? 'عرض الكل' : 'View All';
  });

  /** Computed skeleton array for loading state */
  skeletonArray = computed(() => Array(4).fill(0));

  ngAfterViewInit(): void {
    this.initSwiper();
    this.destroyRef.onDestroy(() => this.destroySwiper());
  }

  /**
   * @description Handles Add to Cart event from product card
   * @param product - Product that was added to cart
   */
  onAddToCart(product: ProductListItem): void {
    this.addToCart.emit(product);
  }

  /**
   * @description Handles Add to Wishlist event from product card
   * @param product - Product that was added to wishlist
   */
  onAddToWishlist(product: ProductListItem): void {
    this.addToWishlist.emit(product);
  }

  /**
   * @description Initializes Swiper carousel with responsive breakpoints
   * Mobile: 1 card, Tablet: 2 cards, Desktop: 4 cards
   * Navigation arrows enabled, auto-scroll disabled
   * @private
   */
  private initSwiper(): void {
    if (!this.swiperContainer?.nativeElement) return;

    const el = this.swiperContainer.nativeElement;
    Object.assign(el, {
      modules: [Navigation, Pagination],
      slidesPerView: 1,
      spaceBetween: 16,
      navigation: { enabled: true },
      pagination: { enabled: false },
      speed: 400,
      grabCursor: true,
      breakpoints: {
        640: {
          slidesPerView: 2,
          spaceBetween: 16,
        },
        1024: {
          slidesPerView: 4,
          spaceBetween: 24,
        },
      },
    } satisfies SwiperOptions);

    el.initialize();
    this.swiperInstance = el.swiper;
  }

  /**
   * @description Cleans up Swiper instance to prevent memory leaks
   * @private
   */
  private destroySwiper(): void {
    if (this.swiperInstance) {
      this.swiperInstance.destroy(true, true);
      this.swiperInstance = null;
    }
  }
}
