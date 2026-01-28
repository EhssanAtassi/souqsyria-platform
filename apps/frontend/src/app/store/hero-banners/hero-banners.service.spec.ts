/**
 * Hero Banners Service Unit Tests (Akita Service Layer)
 *
 * Testing strategy:
 * - API data loading (success and error cases)
 * - Store integration (setLoading, set, setError)
 * - Bilingual content handling
 * - Caching behavior
 * - Analytics tracking
 *
 * Following TDD: These tests will FAIL until implementation is complete
 */

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HeroBannersService } from './hero-banners.service';
import { HeroBannersStore } from './hero-banners.store';
import { HeroBannersQuery } from './hero-banners.query';
import { HeroBannerService } from '../../features/hero-banners/services/hero-banner.service';
import { HeroBanner } from '../../features/hero-banners/interfaces/hero-banner.interface';
import { of, throwError } from 'rxjs';

describe('HeroBannersService', () => {
  let service: HeroBannersService;
  let store: HeroBannersStore;
  let query: HeroBannersQuery;
  let heroBannerApiService: jasmine.SpyObj<HeroBannerService>;

  // Mock API response in HeroBanner format (already transformed by API service)
  const mockApiResponse: any[] = [
    {
      id: 'test-banner-001',
      name: { english: 'Damascus Steel Collection', arabic: 'مجموعة الفولاذ الدمشقي' },
      headline: { english: 'Authentic Damascus Steel', arabic: 'فولاذ دمشقي أصيل' },
      subheadline: { english: 'Handcrafted by Syrian artisans', arabic: 'صنع يدوياً من قبل الحرفيين السوريين' },
      image: {
        url: '/assets/damascus-steel.jpg',
        tabletUrl: '/assets/damascus-steel-tablet.jpg',
        mobileUrl: '/assets/damascus-steel-mobile.jpg',
        alt: { english: 'Damascus Steel', arabic: 'فولاذ دمشقي' }
      },
      cta: {
        text: { english: 'Shop Now', arabic: 'تسوق الآن' },
        variant: 'primary',
        size: 'large',
        color: 'golden-wheat',
        icon: 'arrow_forward',
        iconPosition: 'right',
        visible: true,
        action: { type: 'category', url: '/category/damascus-steel' }
      },
      tracking: {
        source: 'hero-banner',
        medium: 'homepage',
        campaign: 'damascus-steel-2025'
      },
      schedule: {
        startDate: new Date('2025-01-01T00:00:00.000Z'),
        endDate: new Date('2025-12-31T23:59:59.999Z'),
        timezone: 'Asia/Damascus'
      },
      type: 'main',
      status: 'active',
      priority: 100,
      analytics: {
        impressions: 1500,
        clicks: 85,
        clickThroughRate: 5.67,
        conversions: 12,
        conversionRate: 14.12,
        revenue: 1800,
        lastUpdated: new Date('2025-01-10T12:00:00.000Z')
      },
      metadata: {
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
        updatedAt: new Date('2025-01-10T12:00:00.000Z')
      }
    }
  ];

  beforeEach(() => {
    // Create spy object for HeroBannerService
    const heroBannerApiServiceSpy = jasmine.createSpyObj('HeroBannerService', [
      'getActiveHeroBanners'
    ]);

    // Create store manually first so HeroBannersQuery field initializers can access it
    store = new HeroBannersStore();
    query = new HeroBannersQuery(store);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: HeroBannersStore, useValue: store },
        { provide: HeroBannersQuery, useValue: query },
        HeroBannersService,
        { provide: HeroBannerService, useValue: heroBannerApiServiceSpy }
      ]
    });

    service = TestBed.inject(HeroBannersService);
    heroBannerApiService = TestBed.inject(HeroBannerService) as jasmine.SpyObj<HeroBannerService>;
  });

  afterEach(() => {
    store.destroy();
  });

  describe('Load Active Banners', () => {
    it('should load active banners successfully', (done) => {
      heroBannerApiService.getActiveHeroBanners.and.returnValue(of(mockApiResponse as any));

      service.loadActiveBanners();

      // Verify loading state was set
      setTimeout(() => {
        query.selectAll().subscribe(banners => {
          expect(banners.length).toBe(1);
          expect(banners[0].id).toBe('test-banner-001');
          expect(banners[0].name.english).toBe('Damascus Steel Collection');
          expect(banners[0].name.arabic).toBe('مجموعة الفولاذ الدمشقي');
          done();
        });
      }, 100);
    });

    it('should set loading to true when starting load', () => {
      heroBannerApiService.getActiveHeroBanners.and.returnValue(of(mockApiResponse as any));

      // Spy on store methods
      spyOn(store, 'setLoading');

      service.loadActiveBanners();

      expect(store.setLoading).toHaveBeenCalledWith(true);
    });

    it('should set loading to false after successful load', (done) => {
      heroBannerApiService.getActiveHeroBanners.and.returnValue(of(mockApiResponse as any));

      service.loadActiveBanners();

      setTimeout(() => {
        query.selectLoading$.subscribe(loading => {
          expect(loading).toBe(false);
          done();
        });
      }, 100);
    });

    it('should handle API error gracefully', (done) => {
      const errorMessage = 'Network error';
      heroBannerApiService.getActiveHeroBanners.and.returnValue(
        throwError(() => new Error(errorMessage))
      );

      service.loadActiveBanners();

      setTimeout(() => {
        query.selectError$.subscribe(error => {
          expect(error).toContain(errorMessage);
          done();
        });
      }, 100);
    });

    it('should set loading to false after error', (done) => {
      heroBannerApiService.getActiveHeroBanners.and.returnValue(
        throwError(() => new Error('Failed'))
      );

      service.loadActiveBanners();

      setTimeout(() => {
        query.selectLoading$.subscribe(loading => {
          expect(loading).toBe(false);
          done();
        });
      }, 100);
    });

    it('should clear error on successful load', (done) => {
      heroBannerApiService.getActiveHeroBanners.and.returnValue(of(mockApiResponse as any));

      // Set initial error
      store.setError('Previous error');

      service.loadActiveBanners();

      setTimeout(() => {
        query.selectError$.subscribe(error => {
          expect(error).toBeNull();
          done();
        });
      }, 100);
    });
  });

  describe('Store Integration', () => {
    it('should add banners to store via set()', (done) => {
      heroBannerApiService.getActiveHeroBanners.and.returnValue(of(mockApiResponse as any));

      service.loadActiveBanners();

      setTimeout(() => {
        const state = store.getValue();
        expect(state.ids).toContain('test-banner-001');
        expect(state.entities?.['test-banner-001']).toBeDefined();
        done();
      }, 100);
    });

    it('should replace existing banners on reload', (done) => {
      // Add initial banner
      const initialBanner: any = {
        id: 'old-banner',
        name: { english: 'Old Banner', arabic: 'بانر قديم' }
      };
      store.add(initialBanner);

      heroBannerApiService.getActiveHeroBanners.and.returnValue(of(mockApiResponse as any));

      service.loadActiveBanners();

      setTimeout(() => {
        query.selectAll().subscribe(banners => {
          expect(banners.length).toBe(1);
          expect(banners[0].id).toBe('test-banner-001');
          expect(banners.find(b => b.id === 'old-banner')).toBeUndefined();
          done();
        });
      }, 100);
    });
  });

  describe('Bilingual Content Mapping', () => {
    it('should map English content correctly from API response', (done) => {
      heroBannerApiService.getActiveHeroBanners.and.returnValue(of(mockApiResponse as any));

      service.loadActiveBanners();

      setTimeout(() => {
        query.selectEntity('test-banner-001').subscribe(banner => {
          expect(banner?.name.english).toBe('Damascus Steel Collection');
          expect(banner?.headline.english).toBe('Authentic Damascus Steel');
          expect(banner?.subheadline?.english).toBe('Handcrafted by Syrian artisans');
          expect(banner?.cta.text.english).toBe('Shop Now');
          done();
        });
      }, 100);
    });

    it('should map Arabic content correctly from API response', (done) => {
      heroBannerApiService.getActiveHeroBanners.and.returnValue(of(mockApiResponse as any));

      service.loadActiveBanners();

      setTimeout(() => {
        query.selectEntity('test-banner-001').subscribe(banner => {
          expect(banner?.name.arabic).toBe('مجموعة الفولاذ الدمشقي');
          expect(banner?.headline.arabic).toBe('فولاذ دمشقي أصيل');
          expect(banner?.subheadline?.arabic).toBe('صنع يدوياً من قبل الحرفيين السوريين');
          expect(banner?.cta.text.arabic).toBe('تسوق الآن');
          done();
        });
      }, 100);
    });
  });

  describe('Data Transformation', () => {
    it('should store banner type correctly', (done) => {
      heroBannerApiService.getActiveHeroBanners.and.returnValue(of(mockApiResponse as any));

      service.loadActiveBanners();

      setTimeout(() => {
        query.selectEntity('test-banner-001').subscribe(banner => {
          expect(banner?.type).toBe('main');
          done();
        });
      }, 100);
    });

    it('should store banner status correctly', (done) => {
      heroBannerApiService.getActiveHeroBanners.and.returnValue(of(mockApiResponse as any));

      service.loadActiveBanners();

      setTimeout(() => {
        query.selectEntity('test-banner-001').subscribe(banner => {
          expect(banner?.status).toBe('active');
          done();
        });
      }, 100);
    });

    it('should map image URLs correctly', (done) => {
      heroBannerApiService.getActiveHeroBanners.and.returnValue(of(mockApiResponse as any));

      service.loadActiveBanners();

      setTimeout(() => {
        query.selectEntity('test-banner-001').subscribe(banner => {
          expect(banner?.image.url).toBe('/assets/damascus-steel.jpg');
          expect(banner?.image.tabletUrl).toBe('/assets/damascus-steel-tablet.jpg');
          expect(banner?.image.mobileUrl).toBe('/assets/damascus-steel-mobile.jpg');
          done();
        });
      }, 100);
    });

    it('should map CTA properties correctly', (done) => {
      heroBannerApiService.getActiveHeroBanners.and.returnValue(of(mockApiResponse as any));

      service.loadActiveBanners();

      setTimeout(() => {
        query.selectEntity('test-banner-001').subscribe(banner => {
          expect(banner?.cta.variant).toBe('primary');
          expect(banner?.cta.size).toBe('large');
          expect(banner?.cta.color).toBe('golden-wheat');
          expect(banner?.cta.icon).toBe('arrow_forward');
          expect(banner?.cta.iconPosition).toBe('right');
          expect(banner?.cta.visible).toBe(true);
          done();
        });
      }, 100);
    });

    it('should map analytics data correctly', (done) => {
      heroBannerApiService.getActiveHeroBanners.and.returnValue(of(mockApiResponse as any));

      service.loadActiveBanners();

      setTimeout(() => {
        query.selectEntity('test-banner-001').subscribe(banner => {
          expect(banner?.analytics.impressions).toBe(1500);
          expect(banner?.analytics.clicks).toBe(85);
          expect(banner?.analytics.clickThroughRate).toBe(5.67);
          expect(banner?.analytics.conversions).toBe(12);
          expect(banner?.analytics.conversionRate).toBe(14.12);
          expect(banner?.analytics.revenue).toBe(1800);
          done();
        });
      }, 100);
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP 500 error', (done) => {
      heroBannerApiService.getActiveHeroBanners.and.returnValue(
        throwError(() => ({ status: 500, message: 'Internal Server Error' }))
      );

      service.loadActiveBanners();

      setTimeout(() => {
        query.selectError$.subscribe(error => {
          expect(error).toBeTruthy();
          done();
        });
      }, 100);
    });

    it('should handle network error', (done) => {
      heroBannerApiService.getActiveHeroBanners.and.returnValue(
        throwError(() => ({ status: 0, message: 'Network error' }))
      );

      service.loadActiveBanners();

      setTimeout(() => {
        query.selectError$.subscribe(error => {
          expect(error).toBeTruthy();
          done();
        });
      }, 100);
    });

    it('should handle empty response', (done) => {
      heroBannerApiService.getActiveHeroBanners.and.returnValue(of([]));

      service.loadActiveBanners();

      setTimeout(() => {
        query.selectAll().subscribe(banners => {
          expect(banners).toEqual([]);
          done();
        });
      }, 100);
    });
  });

  describe('Clear Cache', () => {
    it('should clear cached data', () => {
      // Add banners to store
      heroBannerApiService.getActiveHeroBanners.and.returnValue(of(mockApiResponse as any));
      service.loadActiveBanners();

      // Clear cache
      service.clearCache();

      // Store should be reset
      const state = store.getValue();
      expect(state.ids).toEqual([]);
      expect(state.entities).toEqual({});
    });

    it('should reset error state when clearing cache', () => {
      store.setError('Some error');
      service.clearCache();

      const state = store.getValue();
      expect(state.error).toBeNull();
    });
  });
});
