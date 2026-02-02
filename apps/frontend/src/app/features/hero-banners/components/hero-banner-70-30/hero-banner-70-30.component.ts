import {
  Component,
  OnInit,
  DestroyRef,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { HeroBannerService } from '../../services/hero-banner.service';
import { HeroBanner } from '../../interfaces/hero-banner.interface';
import { PromoCard } from '../../../../shared/interfaces/promo-card.interface';

// Presentational Components
import { HeroContainerComponent } from '../hero-container/hero-container.component';
import { PromoCardComponent } from '../../../../shared/components/promo-card/promo-card.component';
import { HeroSkeletonComponent } from '../../../../shared/components/hero-skeleton/hero-skeleton.component';

/**
 * HeroBanner70/30 Component (Smart Component)
 *
 * Main hero banner section with 70/30 split layout for homepage:
 * - 70% carousel area (left): Rotating hero banners (5 slides)
 * - 30% sidebar area (right): Stacked promotional cards (2 cards)
 *
 * Features:
 * - Automatic data loading from Akita store
 * - Loading skeleton states
 * - Error handling with fallback
 * - Analytics tracking for both carousel and promo cards
 * - Responsive breakpoints (stacks on mobile/tablet)
 * - Bilingual support (Arabic RTL / English LTR)
 * - Golden Wheat theme integration
 *
 * Layout Structure:
 * ```
 * ┌──────────────────────────────────────────────────────────┐
 * │  70% Hero Carousel        │  30% Promo Cards Sidebar    │
 * │  ┌──────────────────────┐ │  ┌────────────────────────┐ │
 * │  │  Banner 1            │ │  │  Top Promo Card        │ │
 * │  │  Banner 2            │ │  │  (Damascus Steel)      │ │
 * │  │  Banner 3            │ │  └────────────────────────┘ │
 * │  │  Banner 4            │ │  ┌────────────────────────┐ │
 * │  │  Banner 5            │ │  │  Bottom Promo Card     │ │
 * │  └──────────────────────┘ │  │  (Aleppo Soap)         │ │
 * │  [< > dots progress]      │  └────────────────────────┘ │
 * └──────────────────────────────────────────────────────────┘
 * ```
 *
 * Usage:
 * ```html
 * <app-hero-banner-70-30 />
 * ```
 *
 * @component
 * @standalone
 *
 * @example
 * // In homepage component
 * export class HomepageComponent {
 *   // Just add the component to the template
 *   // It handles all data loading and state management internally
 * }
 *
 * @swagger
 * components:
 *   schemas:
 *     HeroBanner7030Component:
 *       type: object
 *       description: Main hero banner with 70/30 carousel/promo split layout
 *       properties:
 *         none:
 *           type: void
 *           description: No inputs (smart component with automatic data loading)
 */
@Component({
  selector: 'app-hero-banner-70-30',
  standalone: true,
  imports: [
    CommonModule,
    HeroContainerComponent,
    PromoCardComponent,
    HeroSkeletonComponent
  ],
  templateUrl: './hero-banner-70-30.component.html',
  styleUrls: ['./hero-banner-70-30.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeroBanner7030Component implements OnInit {
  // Services
  private readonly heroBannerService = inject(HeroBannerService);
  private readonly destroyRef = inject(DestroyRef);

  // ============================================
  // Signals - Reactive State
  // ============================================

  /**
   * Hero banners for 70% carousel area
   */
  readonly heroBanners = signal<HeroBanner[]>([]);

  /**
   * Promo cards for 30% sidebar area
   */
  readonly promoCards = signal<PromoCard[]>([]);

  /**
   * Loading state
   */
  readonly isLoading = signal<boolean>(true);

  /**
   * Error state
   */
  readonly loadError = signal<Error | null>(null);

  /**
   * Offline mode indicator (serving mock/fallback data)
   */
  readonly isOfflineMode = signal<boolean>(false);

  /**
   * Track number of completed data requests
   */
  private completedRequests = 0;
  private readonly TOTAL_REQUESTS = 2;

  // ============================================
  // Computed Signals
  // ============================================

  /**
   * Top promo card (position 0)
   */
  readonly topPromoCard = computed(() => this.promoCards()[0] || null);

  /**
   * Bottom promo card (position 1)
   */
  readonly bottomPromoCard = computed(() => this.promoCards()[1] || null);

  /**
   * Has hero banner data to display
   */
  readonly hasHeroBanners = computed(() => this.heroBanners().length > 0);

  /**
   * Has promo card data to display
   */
  readonly hasPromoCards = computed(() => this.promoCards().length > 0);

  /**
   * Show loading skeleton
   */
  readonly shouldShowLoading = computed(() =>
    this.isLoading() && !this.hasHeroBanners() && !this.hasPromoCards()
  );

  /**
   * Show content (has data and not loading)
   */
  readonly shouldShowContent = computed(() =>
    !this.isLoading() || this.hasHeroBanners() || this.hasPromoCards()
  );

  /**
   * Show error UI
   */
  readonly shouldShowError = computed(() =>
    !!this.loadError() && !this.hasHeroBanners() && !this.hasPromoCards()
  );

  // ============================================
  // Lifecycle Hooks
  // ============================================

  ngOnInit(): void {
    // Load hero banners and promo cards in parallel
    this.loadHeroData();
  }

  // ============================================
  // Event Handlers
  // ============================================

  /**
   * Handle promo card click event
   * Tracks analytics for promo card clicks
   *
   * @param event Click event with promoCardId, position, targetRoute
   */
  onPromoCardClick(event: {
    promoCardId: string;
    position: number;
    targetRoute: string;
  }): void {
    console.log('📊 Promo Card Click:', event);

    // Track analytics via service with proper cleanup
    this.heroBannerService.trackPromoCardClick(event.promoCardId, {
      position: event.position,
      targetUrl: event.targetRoute,
      timestamp: new Date(),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  /**
   * Reload all hero data (force refresh)
   */
  reloadHeroData(): void {
    this.heroBannerService.clearCache();
    this.loadHeroData();
  }

  // ============================================
  // Private Methods
  // ============================================

  /**
   * Load hero banners and promo cards from service
   * Loads both datasets in parallel for optimal performance
   */
  private loadHeroData(): void {
    this.isLoading.set(true);
    this.loadError.set(null);
    this.completedRequests = 0;

    // Load hero banners (70% carousel area)
    this.heroBannerService
      .getActiveHeroBanners()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (banners) => {
          console.log(`✅ Hero 70/30: Loaded ${banners.length} hero banners`);
          this.heroBanners.set(banners);
          this.checkLoadingComplete();
        },
        error: (error) => {
          console.error('❌ Hero 70/30: Failed to load hero banners', error);
          this.loadError.set(error);
          this.checkLoadingComplete();
        },
      });

    // Load promo cards (30% sidebar area)
    this.heroBannerService
      .getPromoCards(2) // Load 2 promo cards (top and bottom)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (cards) => {
          console.log(`✅ Hero 70/30: Loaded ${cards.length} promo cards`);
          this.promoCards.set(cards);
          this.checkLoadingComplete();

          // Track impressions for promo cards with proper cleanup
          cards.forEach((card, index) => {
            this.heroBannerService.trackPromoCardImpression(card.id, {
              position: index,
              timestamp: new Date(),
            }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
          });
        },
        error: (error) => {
          console.error('❌ Hero 70/30: Failed to load promo cards', error);
          // Don't set error state - promo cards are optional
          // Still show hero banners even if promo cards fail
          this.checkLoadingComplete();
        },
      });
  }

  /**
   * Check if both hero banners and promo cards have finished loading
   * Sets isLoading to false when both requests are complete
   *
   * @description Tracks completed requests to ensure loading state is cleared even if both return empty arrays
   */
  private checkLoadingComplete(): void {
    this.completedRequests++;
    if (this.completedRequests >= this.TOTAL_REQUESTS) {
      this.isLoading.set(false);
    }
  }
}
