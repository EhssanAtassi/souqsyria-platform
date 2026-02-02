/**
 * Hero Banner Service
 * Enterprise-grade service for managing hero banner data and API communication
 *
 * Features:
 * - HTTP API integration with NestJS backend
 * - Mock data support for offline development
 * - Caching layer for performance
 * - Analytics tracking (impressions, clicks)
 * - Error handling and retry logic
 * - Observable-based reactive patterns
 *
 * @swagger
 * components:
 *   schemas:
 *     HeroBannerService:
 *       type: object
 *       description: Service for hero banner management
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError, BehaviorSubject } from 'rxjs';
import { map, catchError, tap, shareReplay, delay } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  HeroBanner,
  HeroBannerQueryFilters,
  BannerTrackingEvent,
  CreateHeroBannerDTO,
  UpdateHeroBannerDTO,
  CTAVariant,
  CTASize,
  ThemeColor,
  BannerRouteType,
  HeroBannerType,
  BannerStatus,
} from '../interfaces/hero-banner.interface';
import {
  PromoCard,
  PromoCardQueryFilters,
  PromoCardClickEvent
} from '../../../shared/interfaces/promo-card.interface';

/**
 * Hero Banner Service
 *
 * @example
 * // In component
 * constructor(private heroBannerService: HeroBannerService) {}
 *
 * ngOnInit() {
 *   // Get active hero banners
 *   this.heroBannerService.getActiveHeroBanners().subscribe(banners => {
 *     this.heroBanners = banners;
 *   });
 *
 *   // Track impression
 *   this.heroBannerService.trackImpression(bannerId).subscribe();
 * }
 */
@Injectable({ providedIn: 'root' })
export class HeroBannerService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/hero-banners`;
  private readonly promoCardsBaseUrl = `${environment.apiUrl}/promo-cards`;

  /**
   * Cache for active hero banners
   * Uses shareReplay to prevent multiple API calls
   */
  private activeBannersCache$?: Observable<HeroBanner[]>;
  private cacheTimestamp = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Cache for active promo cards
   * Uses shareReplay to prevent multiple API calls
   */
  private promoCardsCache$?: Observable<PromoCard[]>;
  private promoCardsCacheTimestamp = 0;

  /**
   * Get all active hero banners
   * Implements caching to reduce API calls
   *
   * @returns Observable<HeroBanner[]> Active hero banners sorted by priority
   */
  getActiveHeroBanners(): Observable<HeroBanner[]> {
    // Check if cache is still valid
    const now = Date.now();
    if (this.activeBannersCache$ && now - this.cacheTimestamp < this.CACHE_DURATION) {
      return this.activeBannersCache$;
    }

    // Use mock data if backend is not available or enableMockData is true
    if (environment.enableMockData || environment.forceOfflineMode) {
      return this.getMockHeroBanners().pipe(
        delay(500), // Simulate network delay
        tap(() => {
          console.log('✅ Loaded hero banners from mock data');
          console.warn('⚠️ OFFLINE MODE: Serving mock data (enableMockData or forceOfflineMode enabled)');
        })
      );
    }

    // Fetch from backend API using /active endpoint (public endpoint)
    this.activeBannersCache$ = this.http
      .get<HeroBanner[]>(`${this.baseUrl}/active`)
      .pipe(
        map((banners) => this.mapResponseToBanners(banners)),
        tap((banners) => {
          console.log(`✅ Loaded ${banners.length} active hero banners from backend API`);
          this.cacheTimestamp = Date.now();
        }),
        catchError((error) => {
          console.error('❌ Failed to load hero banners from backend API:', error);
          console.log('⚠️ Falling back to mock data');
          // Fallback to mock data on error
          return this.getMockHeroBanners();
        }),
        shareReplay(1)
      );

    return this.activeBannersCache$;
  }

  /**
   * Get a single hero banner by ID
   *
   * @param id Banner ID
   * @returns Observable<HeroBanner> Hero banner data
   */
  getHeroBannerById(id: string): Observable<HeroBanner> {
    if (environment.enableMockData || environment.forceOfflineMode) {
      return this.getMockHeroBanners().pipe(
        map((banners) => banners.find((b) => b.id === id) || banners[0])
      );
    }

    return this.http.get<HeroBanner>(`${this.baseUrl}/${id}`).pipe(
      map((banner) => this.mapResponseToBanner(banner)),
      tap((banner) => console.log(`✅ Loaded hero banner: ${banner.name.english}`)),
      catchError((error) => {
        console.error(`❌ Failed to load hero banner ${id}:`, error);
        return throwError(() => new Error('Failed to load hero banner'));
      })
    );
  }

  /**
   * Get featured hero banner (highest priority active banner)
   *
   * @returns Observable<HeroBanner> Featured hero banner
   */
  getFeaturedBanner(): Observable<HeroBanner> {
    if (environment.enableMockData || environment.forceOfflineMode) {
      return this.getMockHeroBanners().pipe(
        map((banners) => banners[0]) // Return first banner as featured
      );
    }

    return this.http.get<HeroBanner>(`${this.baseUrl}/featured/current`).pipe(
      map((banner) => this.mapResponseToBanner(banner)),
      catchError((error) => {
        console.error('❌ Failed to load featured banner:', error);
        // Fallback to first active banner
        return this.getActiveHeroBanners().pipe(map((banners) => banners[0]));
      })
    );
  }

  /**
   * Query hero banners with filters
   *
   * @param filters Query filters
   * @returns Observable<HeroBanner[]> Filtered hero banners
   */
  queryHeroBanners(filters: HeroBannerQueryFilters): Observable<HeroBanner[]> {
    if (environment.enableMockData || environment.forceOfflineMode) {
      return this.getMockHeroBanners().pipe(
        map((banners) => this.applyMockFilters(banners, filters))
      );
    }

    let params = new HttpParams();

    if (filters.status) {
      const statusArray = Array.isArray(filters.status) ? filters.status : [filters.status];
      params = params.set('status', statusArray.join(','));
    }
    if (filters.type) {
      const typeArray = Array.isArray(filters.type) ? filters.type : [filters.type];
      params = params.set('type', typeArray.join(','));
    }
    if (filters.limit) {
      params = params.set('limit', filters.limit.toString());
    }
    if (filters.offset) {
      params = params.set('offset', filters.offset.toString());
    }
    if (filters.sortBy) {
      params = params.set('sortBy', filters.sortBy);
    }
    if (filters.sortOrder) {
      params = params.set('sortOrder', filters.sortOrder);
    }
    if (filters.includeAnalytics) {
      params = params.set('includeAnalytics', 'true');
    }

    return this.http.get<HeroBanner[]>(this.baseUrl, { params }).pipe(
      map((banners) => this.mapResponseToBanners(banners)),
      catchError((error) => {
        console.error('❌ Failed to query hero banners:', error);
        return of([]);
      })
    );
  }

  /**
   * Track banner impression (view)
   *
   * @param bannerId Banner ID
   * @param metadata Additional tracking metadata
   * @returns Observable<void>
   */
  trackImpression(bannerId: string, metadata?: any): Observable<void> {
    if (environment.enableMockData || environment.forceOfflineMode) {
      console.log(`📊 Mock: Tracked impression for banner ${bannerId}`, metadata);
      return of(void 0);
    }

    const payload = {
      bannerId,
      position: metadata?.position || 0,
      method: metadata?.method || 'auto',
      timestamp: new Date().toISOString(),
    };

    return this.http.post<void>(`${this.baseUrl}/track/impression`, payload).pipe(
      tap(() => console.log(`📊 Tracked impression for banner ${bannerId}`)),
      catchError((error) => {
        console.error('❌ Failed to track impression:', error);
        return of(void 0); // Don't fail on tracking errors
      })
    );
  }

  /**
   * Track banner click
   *
   * @param bannerId Banner ID
   * @param metadata Additional tracking metadata
   * @returns Observable<void>
   */
  trackClick(bannerId: string, metadata?: any): Observable<void> {
    if (environment.enableMockData || environment.forceOfflineMode) {
      console.log(`📊 Mock: Tracked click for banner ${bannerId}`, metadata);
      return of(void 0);
    }

    const payload = {
      bannerId,
      position: metadata?.position || 0,
      targetUrl: metadata?.targetUrl || '',
      timestamp: new Date().toISOString(),
    };

    return this.http.post<void>(`${this.baseUrl}/track/click`, payload).pipe(
      tap(() => console.log(`📊 Tracked click for banner ${bannerId}`)),
      catchError((error) => {
        console.error('❌ Failed to track click:', error);
        return of(void 0); // Don't fail on tracking errors
      })
    );
  }

  /**
   * Track CTA button click
   *
   * @param bannerId Banner ID
   * @param ctaText CTA button text
   * @param metadata Additional tracking metadata
   * @returns Observable<void>
   */
  trackCTAClick(bannerId: string, ctaText: string, metadata?: any): Observable<void> {
    if (environment.enableMockData || environment.forceOfflineMode) {
      console.log(`📊 Mock: Tracked CTA click "${ctaText}" for banner ${bannerId}`, metadata);
      return of(void 0);
    }

    const payload = {
      bannerId,
      ctaText,
      position: metadata?.position || 0,
      ctaType: metadata?.ctaType || 'primary',
      timestamp: new Date().toISOString(),
    };

    return this.http.post<void>(`${this.baseUrl}/track/cta`, payload).pipe(
      tap(() => console.log(`📊 Tracked CTA click "${ctaText}" for banner ${bannerId}`)),
      catchError((error) => {
        console.error('❌ Failed to track CTA click:', error);
        return of(void 0); // Don't fail on tracking errors
      })
    );
  }

  /**
   * Get Active Promo Cards
   * Fetches active promo cards for hero banner sidebar (30% area)
   * Implements caching to reduce API calls
   *
   * Promo cards are displayed in the 30% sidebar area alongside the 70% hero carousel.
   * Typically shows 2 stacked promo cards (top and bottom).
   *
   * @param limit - Maximum number of promo cards to load (default: 2)
   * @returns Observable<PromoCard[]> Active promo cards sorted by priority
   *
   * @example
   * // In component
   * this.heroBannerService.getPromoCards(2).subscribe(cards => {
   *   this.topPromoCard.set(cards[0]);
   *   this.bottomPromoCard.set(cards[1]);
   * });
   */
  getPromoCards(limit: number = 2): Observable<PromoCard[]> {
    // Check if cache is still valid
    const now = Date.now();
    if (
      this.promoCardsCache$ &&
      now - this.promoCardsCacheTimestamp < this.CACHE_DURATION
    ) {
      return this.promoCardsCache$.pipe(
        map((cards) => cards.slice(0, limit))
      );
    }

    // Use mock data if backend is not available or enableMockData is true
    if (environment.enableMockData || environment.forceOfflineMode) {
      return this.getMockPromoCards().pipe(
        map((cards) => cards.slice(0, limit)),
        delay(500), // Simulate network delay
        tap(() => {
          console.log(`✅ Loaded ${limit} promo cards from mock data`);
          console.warn('⚠️ OFFLINE MODE: Serving mock promo cards (enableMockData or forceOfflineMode enabled)');
        })
      );
    }

    // Fetch from backend API using /promo-cards/active endpoint (public endpoint)
    this.promoCardsCache$ = this.http
      .get<any[]>(`${this.promoCardsBaseUrl}/active`)
      .pipe(
        map((cards) => this.mapResponseToPromoCards(cards)),
        tap((cards) => {
          console.log(`✅ Loaded ${cards.length} active promo cards from backend API`);
          this.promoCardsCacheTimestamp = Date.now();
        }),
        catchError((error) => {
          console.error('❌ Failed to load promo cards from backend API:', error);
          console.error('❌ Error details:', {
            endpoint: `${this.promoCardsBaseUrl}/active`,
            error: error.message,
            status: error.status
          });
          console.log('⚠️ FALLBACK MODE: Falling back to mock promo cards');
          // Fallback to mock data on error
          return this.getMockPromoCards();
        }),
        shareReplay(1)
      );

    return this.promoCardsCache$.pipe(
      map((cards) => cards.slice(0, limit))
    );
  }

  /**
   * Track Promo Card Impression
   * Records when a promo card is viewed by a user
   *
   * @param promoCardId - The ID of the promo card that was viewed
   * @param metadata - Additional tracking metadata (position, method, etc.)
   * @returns Observable<void> - Silent analytics tracking (errors logged but not thrown)
   *
   * @example
   * // Track impression when promo card is displayed
   * this.heroBannerService.trackPromoCardImpression('promo-001', { position: 0 });
   */
  trackPromoCardImpression(promoCardId: string, metadata?: any): Observable<void> {
    if (environment.enableMockData || environment.forceOfflineMode) {
      console.log(`📊 Mock: Tracked promo card impression: ${promoCardId}`, metadata);
      return of(void 0);
    }

    const payload = {
      cardId: promoCardId,
      position: metadata?.position || 0,
      timestamp: new Date().toISOString(),
    };

    return this.http
      .post<void>(`${this.promoCardsBaseUrl}/track/impression`, payload)
      .pipe(
        tap(() => console.log(`📊 Tracked promo card impression: ${promoCardId}`)),
        catchError((error) => {
          console.error('❌ Failed to track promo card impression:', error);
          console.error('❌ Error details:', {
            promoCardId,
            endpoint: `${this.promoCardsBaseUrl}/track/impression`,
            payload,
            error: error.message
          });
          return of(void 0); // Don't fail on tracking errors
        })
      );
  }

  /**
   * Track Promo Card Click
   * Records when a promo card is clicked by a user
   *
   * @param promoCardId - The ID of the promo card that was clicked
   * @param metadata - Additional tracking metadata (position, targetUrl, etc.)
   * @returns Observable<void> - Silent analytics tracking (errors logged but not thrown)
   *
   * @example
   * // Track click when user clicks promo card
   * this.heroBannerService.trackPromoCardClick('promo-001', {
   *   position: 0,
   *   targetUrl: '/category/damascus-steel'
   * });
   */
  trackPromoCardClick(promoCardId: string, metadata?: any): Observable<void> {
    if (environment.enableMockData || environment.forceOfflineMode) {
      console.log(`📊 Mock: Tracked promo card click: ${promoCardId}`, metadata);
      return of(void 0);
    }

    const payload = {
      cardId: promoCardId,
      position: metadata?.position || 0,
      targetUrl: metadata?.targetUrl || '',
      timestamp: new Date().toISOString(),
    };

    return this.http
      .post<void>(`${this.promoCardsBaseUrl}/track/click`, payload)
      .pipe(
        tap(() => console.log(`📊 Tracked promo card click: ${promoCardId}`)),
        catchError((error) => {
          console.error('❌ Failed to track promo card click:', error);
          console.error('❌ Error details:', {
            promoCardId,
            endpoint: `${this.promoCardsBaseUrl}/track/click`,
            payload,
            error: error.message
          });
          return of(void 0); // Don't fail on tracking errors
        })
      );
  }

  /**
   * Clear cached banners and promo cards (force refresh)
   */
  clearCache(): void {
    this.activeBannersCache$ = undefined;
    this.cacheTimestamp = 0;
    this.promoCardsCache$ = undefined;
    this.promoCardsCacheTimestamp = 0;
    console.log('🗑️ Hero banner and promo card cache cleared');
  }

  /**
   * Get mock hero banners for offline development
   * Uses authentic Syrian marketplace themes with Golden Wheat colors
   *
   * @returns Observable<HeroBanner[]> Mock hero banners
   */
  private getMockHeroBanners(): Observable<HeroBanner[]> {
    const mockBanners: HeroBanner[] = [
      {
        id: 'hero-damascus-steel-001',
        name: {
          english: 'Damascus Steel Heritage Collection',
          arabic: 'مجموعة تراث الفولاذ الدمشقي',
        },
        type: 'main',
        status: 'active',
        priority: 100,
        image: {
          url: '/assets/images/products/exp1.png',
          alt: {
            english: 'Damascus Steel Heritage Collection',
            arabic: 'مجموعة تراث الفولاذ الدمشقي',
          },
          mobileUrl: '/assets/images/products/exp1.png',
          dimensions: { width: 1920, height: 800 },
          format: 'jpg',
          size: 245760,
        },
        headline: {
          english: 'Authentic Damascus Steel Collection',
          arabic: 'مجموعة الفولاذ الدمشقي الأصيل',
        },
        subheadline: {
          english: 'Handcrafted by Syrian artisans using 1000-year-old techniques',
          arabic: 'صُنع يدوياً من قبل الحرفيين السوريين بتقنيات عمرها ألف عام',
        },
        cta: {
          text: {
            english: 'Shop Damascus Steel',
            arabic: 'تسوق الفولاذ الدمشقي',
          },
          variant: 'primary',
          size: 'large',
          color: 'golden-wheat',
          icon: 'arrow_forward',
          iconPosition: 'right',
          visible: true,
        },
        targetRoute: {
          type: 'category',
          target: '/category/damascus-steel',
          tracking: {
            source: 'hero-banner',
            medium: 'homepage',
            campaign: 'damascus-steel-heritage-2025',
          },
        },
        schedule: {
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-12-31'),
          timezone: 'Asia/Damascus',
        },
        analytics: {
          impressions: 15420,
          clicks: 892,
          clickThroughRate: 5.78,
          conversions: 127,
          conversionRate: 14.24,
          revenue: 19050,
          lastUpdated: new Date(),
        },
        theme: {
          primaryColor: 'golden-wheat',
          secondaryColor: 'forest',
          textColor: 'light',
          overlayOpacity: 0.3,
          gradientDirection: 'diagonal',
        },
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date(),
      },
      {
        id: 'hero-aleppo-soap-002',
        name: {
          english: 'UNESCO Heritage Aleppo Soap',
          arabic: 'صابون حلب تراث اليونسكو',
        },
        type: 'main',
        status: 'active',
        priority: 90,
        image: {
          url: '/assets/images/products/1.png',
          alt: {
            english: 'Aleppo Soap Heritage',
            arabic: 'تراث صابون حلب',
          },
          mobileUrl: '/assets/images/products/1.png',
          dimensions: { width: 1920, height: 800 },
          format: 'jpg',
          size: 230400,
        },
        headline: {
          english: 'Premium Aleppo Soap - UNESCO Heritage',
          arabic: 'صابون حلب الفاخر - تراث اليونسكو',
        },
        subheadline: {
          english: 'Traditional craftsmanship recognized by UNESCO World Heritage',
          arabic: 'الحرفية التقليدية معترف بها من قبل التراث العالمي لليونسكو',
        },
        cta: {
          text: {
            english: 'Explore Heritage Soaps',
            arabic: 'استكشف صابون التراث',
          },
          variant: 'primary',
          size: 'large',
          color: 'forest',
          icon: 'explore',
          iconPosition: 'right',
          visible: true,
        },
        targetRoute: {
          type: 'category',
          target: '/category/beauty-wellness',
          tracking: {
            source: 'hero-banner',
            medium: 'homepage',
            campaign: 'aleppo-soap-unesco-2025',
          },
        },
        schedule: {
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-12-31'),
          timezone: 'Asia/Damascus',
        },
        analytics: {
          impressions: 12850,
          clicks: 756,
          clickThroughRate: 5.88,
          conversions: 98,
          conversionRate: 12.96,
          revenue: 14700,
          lastUpdated: new Date(),
        },
        theme: {
          primaryColor: 'forest',
          secondaryColor: 'golden-wheat',
          textColor: 'light',
          overlayOpacity: 0.25,
          gradientDirection: 'horizontal',
        },
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date(),
      },
      {
        id: 'hero-syrian-textiles-003',
        name: {
          english: 'Syrian Brocade & Textiles',
          arabic: 'البروكار والمنسوجات السورية',
        },
        type: 'main',
        status: 'active',
        priority: 80,
        image: {
          url: '/assets/images/products/5.png',
          alt: {
            english: 'Syrian Brocade Textiles',
            arabic: 'منسوجات البروكار السورية',
          },
          mobileUrl: '/assets/images/products/5.png',
          dimensions: { width: 1920, height: 800 },
          format: 'jpg',
          size: 256000,
        },
        headline: {
          english: 'Luxurious Hand-Woven Syrian Brocade',
          arabic: 'بروكار سوري منسوج يدوياً فاخر',
        },
        subheadline: {
          english: 'Traditional Damascus weaving with gold threads',
          arabic: 'نسيج دمشقي تقليدي بخيوط ذهبية',
        },
        cta: {
          text: {
            english: 'Discover Textiles',
            arabic: 'اكتشف المنسوجات',
          },
          variant: 'primary',
          size: 'large',
          color: 'syrian-gold',
          icon: 'auto_awesome',
          iconPosition: 'right',
          visible: true,
        },
        targetRoute: {
          type: 'category',
          target: '/category/textiles-fabrics',
          tracking: {
            source: 'hero-banner',
            medium: 'homepage',
            campaign: 'syrian-textiles-2025',
          },
        },
        schedule: {
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-12-31'),
          timezone: 'Asia/Damascus',
        },
        analytics: {
          impressions: 10240,
          clicks: 615,
          clickThroughRate: 6.01,
          conversions: 73,
          conversionRate: 11.87,
          revenue: 13140,
          lastUpdated: new Date(),
        },
        theme: {
          primaryColor: 'syrian-gold',
          secondaryColor: 'deep-umber',
          textColor: 'dark',
          overlayOpacity: 0.2,
          gradientDirection: 'vertical',
        },
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date(),
      },
    ];

    return of(mockBanners);
  }

  /**
   * Map API response to HeroBanner interface
   * Transforms flat backend DTO structure to nested frontend interface
   *
   * Backend returns flat camelCase properties (nameEn, nameAr, imageUrlDesktop, etc.)
   * Frontend expects nested BilingualContent objects and complex nested structures
   *
   * @param response API response data (HeroBannerPublicResponseDto format)
   * @returns HeroBanner Mapped hero banner with nested structure
   */
  private mapResponseToBanner(response: any): HeroBanner {
    return {
      id: response.id,

      // Map flat nameEn/nameAr → nested BilingualContent
      name: {
        english: response.nameEn || '',
        arabic: response.nameAr || '',
      },

      // Map flat headlineEn/headlineAr → nested BilingualContent
      headline: {
        english: response.headlineEn || '',
        arabic: response.headlineAr || '',
      },

      // Map flat subheadlineEn/subheadlineAr → nested BilingualContent (optional)
      subheadline: response.subheadlineEn
        ? {
            english: response.subheadlineEn,
            arabic: response.subheadlineAr || '',
          }
        : undefined,

      // Map flat image fields → nested BannerImage structure
      image: {
        url: response.imageUrlDesktop || '',
        alt: {
          english: response.imageAltEn || '',
          arabic: response.imageAltAr || '',
        },
        mobileUrl: response.imageUrlMobile,
        tabletUrl: response.imageUrlTablet,
        thumbnailUrl: undefined, // Not provided in public API
        dimensions: {
          width: 1920, // Default desktop dimensions
          height: 800,
        },
        format: this.extractImageFormat(response.imageUrlDesktop) || 'jpg',
        size: 0, // Not provided in public API
        focalPoint: {
          x: 0.5, // Center by default
          y: 0.5,
        },
      },

      // Map flat CTA fields → nested BannerCTA structure
      cta: {
        text: {
          english: response.ctaTextEn || '',
          arabic: response.ctaTextAr || '',
        },
        variant: (response.ctaVariant as CTAVariant) || 'primary',
        size: (response.ctaSize as CTASize) || 'large',
        color: (response.ctaColor as ThemeColor) || 'golden-wheat',
        icon: response.ctaIcon,
        iconPosition: (response.ctaIconPosition as 'left' | 'right') || 'right',
        visible: response.ctaVisible !== false, // Default to true
      },

      // Map flat target fields → nested BannerRoute structure
      targetRoute: {
        type: (response.targetType as BannerRouteType) || 'category',
        target: response.targetUrl || '/',
        external: response.targetType === 'external',
        tracking: response.trackingSource
          ? {
              source: response.trackingSource,
              medium: response.trackingMedium || '',
              campaign: response.trackingCampaign || '',
            }
          : undefined,
      },

      // Map flat schedule fields → nested BannerSchedule structure
      schedule: {
        startDate: new Date(response.scheduleStart || Date.now()),
        endDate: new Date(response.scheduleEnd || Date.now()),
        timezone: response.timezone || 'Asia/Damascus',
      },

      // Map analytics (Note: Public API excludes these, so use defaults)
      analytics: {
        impressions: response.impressions || 0,
        clicks: response.clicks || 0,
        clickThroughRate: response.clickThroughRate || 0,
        conversions: response.conversions || 0,
        conversionRate: response.conversionRate || 0,
        revenue: response.revenue || 0,
        lastUpdated: response.analyticsUpdatedAt
          ? new Date(response.analyticsUpdatedAt)
          : new Date(),
      },

      // Map flat theme fields → nested BannerTheme structure
      theme: {
        primaryColor: (response.ctaColor as ThemeColor) || 'golden-wheat',
        textColor: (response.textColor as 'light' | 'dark') || 'dark',
        overlayOpacity: response.overlayOpacity || 0.3,
        gradientDirection: 'diagonal',
        customClasses: [],
      },

      // Banner type mapping: Backend → Frontend
      // Backend: 'product_spotlight' | 'seasonal' | 'flash_sale' | 'brand_story' | 'cultural'
      // Frontend: 'main' | 'secondary' | 'promotional' | 'seasonal'
      type: this.mapBackendTypeToFrontend(response.type),

      // Banner status mapping: Backend approvalStatus + isActive + schedule → Frontend status
      status: this.mapBackendStatusToFrontend(
        response.approvalStatus,
        response.isActive,
        response.scheduleStart,
        response.scheduleEnd
      ),
      priority: response.priority || 0,

      // Timestamps
      createdAt: response.createdAt ? new Date(response.createdAt) : new Date(),
      updatedAt: response.updatedAt ? new Date(response.updatedAt) : new Date(),
      deleted: false,
    };
  }

  /**
   * Extract image format from URL
   *
   * @param url Image URL
   * @returns string Image format (jpg, png, webp, etc.)
   */
  private extractImageFormat(url: string | undefined): string {
    if (!url) return 'jpg';
    const match = url.match(/\.([a-z0-9]+)(\?|$)/i);
    return match ? match[1].toLowerCase() : 'jpg';
  }

  /**
   * Map backend banner type to frontend type
   *
   * Backend uses business-focused types: 'product_spotlight', 'flash_sale', 'brand_story', 'cultural', 'seasonal'
   * Frontend uses display-focused types: 'main', 'secondary', 'promotional', 'seasonal'
   *
   * Mapping strategy:
   * - product_spotlight → main (primary hero)
   * - flash_sale → promotional (urgent campaign)
   * - brand_story → secondary (storytelling)
   * - cultural → secondary (educational content)
   * - seasonal → seasonal (1:1 match)
   *
   * @param backendType Backend banner type from API
   * @returns HeroBannerType Frontend banner type
   */
  private mapBackendTypeToFrontend(
    backendType: string | undefined
  ): HeroBannerType {
    switch (backendType) {
      case 'product_spotlight':
        return 'main';
      case 'flash_sale':
        return 'promotional';
      case 'brand_story':
      case 'cultural':
        return 'secondary';
      case 'seasonal':
        return 'seasonal';
      default:
        return 'main'; // Default to main hero banner
    }
  }

  /**
   * Map backend approval status + active flag + schedule to frontend status
   *
   * Backend has:
   * - approvalStatus: 'draft' | 'pending' | 'approved' | 'rejected' | 'suspended' | 'archived'
   * - isActive: boolean (admin control)
   * - scheduleStart/scheduleEnd: Date (time-based activation)
   *
   * Frontend status:
   * - 'draft': Not ready for display
   * - 'scheduled': Approved but not yet started
   * - 'active': Currently displaying
   * - 'paused': Approved but manually disabled
   * - 'completed': Campaign finished
   *
   * @param approvalStatus Backend approval workflow status
   * @param isActive Backend active flag
   * @param scheduleStart Campaign start date
   * @param scheduleEnd Campaign end date
   * @returns BannerStatus Frontend banner status
   */
  private mapBackendStatusToFrontend(
    approvalStatus: string | undefined,
    isActive: boolean | undefined,
    scheduleStart: string | Date | undefined,
    scheduleEnd: string | Date | undefined
  ): BannerStatus {
    const now = new Date();
    const start = scheduleStart ? new Date(scheduleStart) : now;
    const end = scheduleEnd ? new Date(scheduleEnd) : now;

    // If not approved, it's a draft (includes pending, rejected, suspended)
    if (
      !approvalStatus ||
      approvalStatus === 'draft' ||
      approvalStatus === 'pending' ||
      approvalStatus === 'rejected' ||
      approvalStatus === 'suspended'
    ) {
      return 'draft';
    }

    // If archived, it's completed
    if (approvalStatus === 'archived') {
      return 'completed';
    }

    // If approved but schedule hasn't started yet, it's scheduled
    if (approvalStatus === 'approved' && now < start) {
      return 'scheduled';
    }

    // If approved but past end date, it's completed
    if (approvalStatus === 'approved' && now > end) {
      return 'completed';
    }

    // If approved, within schedule, but manually disabled, it's paused
    if (approvalStatus === 'approved' && isActive === false) {
      return 'paused';
    }

    // If approved, within schedule, and active, it's active
    if (
      approvalStatus === 'approved' &&
      isActive !== false &&
      now >= start &&
      now <= end
    ) {
      return 'active';
    }

    // Default to draft for safety
    return 'draft';
  }

  /**
   * Map array of API responses to HeroBanner array
   *
   * @param responses API response array
   * @returns HeroBanner[] Mapped hero banners
   */
  private mapResponseToBanners(responses: any[]): HeroBanner[] {
    return responses.map((response) => this.mapResponseToBanner(response));
  }

  /**
   * Map flat backend promo card DTO to nested frontend PromoCard interface
   *
   * Backend returns: titleEn, titleAr, descriptionEn, descriptionAr, imageUrl, linkUrl,
   *                  badgeTextEn, badgeTextAr, badgeClass, position, backgroundColor, textColor
   * Frontend expects: headline.english, description.arabic, image.url, badge.text.english,
   *                  targetRoute.target, etc.
   *
   * @description Transforms flat backend DTO structure to nested frontend interface structure
   * @param response Backend promo card DTO from API
   * @returns PromoCard Mapped promo card with nested structure
   */
  private mapResponseToPromoCard(response: any): PromoCard {
    return {
      id: response.id,
      name: { english: response.titleEn || '', arabic: response.titleAr || '' },
      type: 'product',
      status: 'active',
      priority: response.position === 1 ? 100 : 90,
      headline: { english: response.titleEn || '', arabic: response.titleAr || '' },
      description: { english: response.descriptionEn || '', arabic: response.descriptionAr || '' },
      image: {
        url: response.imageUrl || '',
        alt: { english: response.titleEn || '', arabic: response.titleAr || '' },
      },
      contentAlignment: 'left',
      badge: response.badgeTextEn ? {
        text: { english: response.badgeTextEn || '', arabic: response.badgeTextAr || '' },
        backgroundColor: response.backgroundColor || (response.badgeClass?.includes('sale') ? '#DC2626' : '#E94E1B'),
        textColor: response.textColor || '#FFFFFF',
        position: 'top-right',
        visible: true,
      } : undefined,
      targetRoute: {
        type: response.linkUrl?.startsWith('http') ? 'external' : 'category',
        target: response.linkUrl || '/',
        tracking: { source: 'promo-card', medium: 'homepage-sidebar', campaign: 'promo-' + response.id },
      },
      schedule: {
        startDate: response.startDate ? new Date(response.startDate) : new Date(),
        endDate: response.endDate ? new Date(response.endDate) : new Date('2026-12-31'),
        timezone: 'Asia/Damascus',
      },
      analytics: {
        impressions: response.impressions || 0,
        clicks: response.clicks || 0,
        clickThroughRate: response.clickThroughRate || 0,
        conversions: 0,
        conversionRate: 0,
        revenue: 0,
        lastUpdated: response.updatedAt ? new Date(response.updatedAt) : new Date(),
      },
      themeColor: 'golden-wheat',
      createdAt: response.createdAt ? new Date(response.createdAt) : new Date(),
      updatedAt: response.updatedAt ? new Date(response.updatedAt) : new Date(),
    };
  }

  /**
   * Map array of backend promo card DTOs to PromoCard array
   *
   * @description Batch transformation of promo card DTOs
   * @param responses Backend promo card DTO array
   * @returns PromoCard[] Mapped promo cards
   */
  private mapResponseToPromoCards(responses: any[]): PromoCard[] {
    return responses.map(r => this.mapResponseToPromoCard(r));
  }

  /**
   * Apply filters to mock banners (for offline development)
   *
   * @param banners Mock banners
   * @param filters Query filters
   * @returns HeroBanner[] Filtered banners
   */
  private applyMockFilters(
    banners: HeroBanner[],
    filters: HeroBannerQueryFilters
  ): HeroBanner[] {
    let filtered = [...banners];

    if (filters.status) {
      const statusArray = Array.isArray(filters.status) ? filters.status : [filters.status];
      filtered = filtered.filter((b) => statusArray.includes(b.status));
    }

    if (filters.type) {
      const typeArray = Array.isArray(filters.type) ? filters.type : [filters.type];
      filtered = filtered.filter((b) => typeArray.includes(b.type));
    }

    if (filters.sortBy) {
      filtered = this.sortMockBanners(filtered, filters.sortBy, filters.sortOrder);
    }

    if (filters.limit) {
      filtered = filtered.slice(0, filters.limit);
    }

    return filtered;
  }

  /**
   * Sort mock banners
   *
   * @param banners Banners to sort
   * @param sortBy Sort field
   * @param sortOrder Sort direction
   * @returns HeroBanner[] Sorted banners
   */
  private sortMockBanners(
    banners: HeroBanner[],
    sortBy: string,
    sortOrder: 'asc' | 'desc' = 'asc'
  ): HeroBanner[] {
    return banners.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'priority':
          comparison = a.priority - b.priority;
          break;
        case 'createdAt':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case 'impressions':
          comparison = a.analytics.impressions - b.analytics.impressions;
          break;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }

  /**
   * Detect device type from user agent
   *
   * @returns Device type
   */
  private detectDeviceType(): 'desktop' | 'tablet' | 'mobile' {
    if (typeof window === 'undefined') {
      return 'desktop';
    }

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isMobile = /mobile|android|iphone|ipad|phone/i.test(userAgent);
    const isTablet = /ipad|tablet|playbook|silk/i.test(userAgent);

    if (isTablet) {
      return 'tablet';
    }
    if (isMobile) {
      return 'mobile';
    }
    return 'desktop';
  }

  /**
   * Get mock promo cards for offline development
   * Uses authentic Syrian marketplace themes with Golden Wheat colors
   *
   * Provides 2 promo cards for the 30% sidebar area:
   * - Top card: Damascus Steel Collection (product promotion)
   * - Bottom card: Aleppo Soap Premium (category promotion)
   *
   * @returns Observable<PromoCard[]> Mock promo cards
   */
  private getMockPromoCards(): Observable<PromoCard[]> {
    const mockPromoCards: PromoCard[] = [
      {
        id: 'promo-damascus-steel-001',
        name: {
          english: 'Damascus Steel Collection Promo',
          arabic: 'عرض مجموعة الفولاذ الدمشقي',
        },
        type: 'product',
        status: 'active',
        priority: 100,
        headline: {
          english: 'Damascus Steel',
          arabic: 'الفولاذ الدمشقي',
        },
        description: {
          english: 'Authentic Handmade Craftsmanship',
          arabic: 'حرفية يدوية أصيلة',
        },
        image: {
          url: '/assets/images/products/exp1.png',
          alt: {
            english: 'Damascus Steel Collection',
            arabic: 'مجموعة الفولاذ الدمشقي',
          },
          focalPoint: {
            x: 0.5,
            y: 0.5,
          },
        },
        contentAlignment: 'left',
        badge: {
          text: {
            english: '20% OFF',
            arabic: '٪٢٠ خصم',
          },
          backgroundColor: '#E94E1B', // Orange
          textColor: '#FFFFFF',
          position: 'top-right',
          visible: true,
        },
        targetRoute: {
          type: 'category',
          target: '/category/damascus-steel',
          tracking: {
            source: 'promo-card',
            medium: 'homepage-sidebar',
            campaign: 'damascus-steel-2025',
            content: 'top-card',
          },
        },
        schedule: {
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-12-31'),
          timezone: 'Asia/Damascus',
        },
        analytics: {
          impressions: 8420,
          clicks: 512,
          clickThroughRate: 6.08,
          conversions: 67,
          conversionRate: 13.09,
          revenue: 8950,
          lastUpdated: new Date(),
        },
        themeColor: 'golden-wheat',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date(),
      },
      {
        id: 'promo-aleppo-soap-002',
        name: {
          english: 'Aleppo Soap Premium Promo',
          arabic: 'عرض صابون حلب الفاخر',
        },
        type: 'category',
        status: 'active',
        priority: 90,
        headline: {
          english: 'Premium Aleppo Soap',
          arabic: 'صابون حلب الفاخر',
        },
        description: {
          english: 'UNESCO Heritage Quality',
          arabic: 'جودة تراث اليونسكو',
        },
        image: {
          url: '/assets/images/products/1.png',
          alt: {
            english: 'Aleppo Soap Collection',
            arabic: 'مجموعة صابون حلب',
          },
          focalPoint: {
            x: 0.5,
            y: 0.5,
          },
        },
        contentAlignment: 'left',
        badge: {
          text: {
            english: '40% OFF',
            arabic: '٪٤٠ خصم',
          },
          backgroundColor: '#DC2626', // Red
          textColor: '#FFFFFF',
          position: 'top-right',
          visible: true,
        },
        targetRoute: {
          type: 'category',
          target: '/category/beauty-wellness',
          tracking: {
            source: 'promo-card',
            medium: 'homepage-sidebar',
            campaign: 'aleppo-soap-2025',
            content: 'bottom-card',
          },
        },
        schedule: {
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-12-31'),
          timezone: 'Asia/Damascus',
        },
        analytics: {
          impressions: 7140,
          clicks: 428,
          clickThroughRate: 5.99,
          conversions: 54,
          conversionRate: 12.62,
          revenue: 6720,
          lastUpdated: new Date(),
        },
        themeColor: 'forest',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date(),
      },
    ];

    return of(mockPromoCards);
  }
}
