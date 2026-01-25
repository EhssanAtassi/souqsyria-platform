/**
 * Hero Banners Query Unit Tests
 *
 * Testing strategy:
 * - Observable selectors (selectAll, selectActive, selectLoading)
 * - Filtered selectors (active banners, by type, by status)
 * - Computed selectors (featured banner)
 * - Reactive updates when store changes
 *
 * Following TDD: These tests will FAIL until implementation is complete
 */

import { TestBed } from '@angular/core/testing';
import { HeroBannersStore } from './hero-banners.store';
import { HeroBannersQuery } from './hero-banners.query';
import { HeroBanner, BannerStatus } from '../../features/hero-banners/interfaces/hero-banner.interface';
import { take } from 'rxjs/operators';

describe('HeroBannersQuery', () => {
  let store: HeroBannersStore;
  let query: HeroBannersQuery;

  // Mock banners for testing
  const createMockBanner = (
    id: string,
    status: BannerStatus,
    priority: number,
    type: 'main' | 'secondary' | 'promotional' | 'seasonal' = 'main'
  ): HeroBanner => ({
    id,
    name: {
      english: `Banner ${id}`,
      arabic: `بانر ${id}`
    },
    type,
    status,
    priority,
    image: {
      url: `/assets/${id}.jpg`,
      alt: {
        english: `Image ${id}`,
        arabic: `صورة ${id}`
      },
      dimensions: { width: 1920, height: 800 },
      format: 'jpg',
      size: 200000
    },
    headline: {
      english: `Headline ${id}`,
      arabic: `عنوان ${id}`
    },
    cta: {
      text: {
        english: 'Shop Now',
        arabic: 'تسوق الآن'
      },
      variant: 'primary',
      size: 'large',
      color: 'golden-wheat',
      visible: true
    },
    targetRoute: {
      type: 'category',
      target: `/category/${id}`
    },
    schedule: {
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      timezone: 'Asia/Damascus'
    },
    analytics: {
      impressions: 0,
      clicks: 0,
      clickThroughRate: 0,
      conversions: 0,
      conversionRate: 0,
      revenue: 0,
      lastUpdated: new Date()
    },
    theme: {
      primaryColor: 'golden-wheat',
      textColor: 'light',
      overlayOpacity: 0.3
    },
    createdAt: new Date(),
    updatedAt: new Date()
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HeroBannersStore, HeroBannersQuery]
    });

    store = TestBed.inject(HeroBannersStore);
    query = TestBed.inject(HeroBannersQuery);
  });

  afterEach(() => {
    store.destroy();
  });

  describe('Basic Selectors', () => {
    it('should select all banners', (done) => {
      const banner1 = createMockBanner('b1', 'active', 100);
      const banner2 = createMockBanner('b2', 'active', 90);

      store.set([banner1, banner2]);

      query.selectAll().pipe(take(1)).subscribe(banners => {
        expect(banners.length).toBe(2);
        expect(banners).toContain(banner1);
        expect(banners).toContain(banner2);
        done();
      });
    });

    it('should select loading state', (done) => {
      store.setLoading(true);

      query.selectLoading$.pipe(take(1)).subscribe(loading => {
        expect(loading).toBe(true);
        done();
      });
    });

    it('should select error state', (done) => {
      const errorMessage = 'Test error';
      store.setError(errorMessage);

      query.selectError$.pipe(take(1)).subscribe(error => {
        expect(error).toBe(errorMessage);
        done();
      });
    });

    it('should select has error flag', (done) => {
      store.setError('Some error');

      query.selectHasError$.pipe(take(1)).subscribe(hasError => {
        expect(hasError).toBe(true);
        done();
      });
    });
  });

  describe('Active Banners Selector', () => {
    it('should select only active banners', (done) => {
      const activeBanner1 = createMockBanner('b1', 'active', 100);
      const activeBanner2 = createMockBanner('b2', 'active', 90);
      const draftBanner = createMockBanner('b3', 'draft', 80);
      const pausedBanner = createMockBanner('b4', 'paused', 70);

      store.set([activeBanner1, activeBanner2, draftBanner, pausedBanner]);

      query.selectActiveBanners$.pipe(take(1)).subscribe(banners => {
        expect(banners.length).toBe(2);
        expect(banners.every(b => b.status === 'active')).toBe(true);
        expect(banners).toContain(activeBanner1);
        expect(banners).toContain(activeBanner2);
        done();
      });
    });

    it('should sort active banners by priority (descending)', (done) => {
      const banner1 = createMockBanner('b1', 'active', 50);
      const banner2 = createMockBanner('b2', 'active', 100);
      const banner3 = createMockBanner('b3', 'active', 75);

      store.set([banner1, banner2, banner3]);

      query.selectActiveBanners$.pipe(take(1)).subscribe(banners => {
        expect(banners[0].priority).toBe(100);
        expect(banners[1].priority).toBe(75);
        expect(banners[2].priority).toBe(50);
        done();
      });
    });

    it('should return empty array when no active banners', (done) => {
      const draftBanner = createMockBanner('b1', 'draft', 100);
      const pausedBanner = createMockBanner('b2', 'paused', 90);

      store.set([draftBanner, pausedBanner]);

      query.selectActiveBanners$.pipe(take(1)).subscribe(banners => {
        expect(banners.length).toBe(0);
        done();
      });
    });
  });

  describe('Featured Banner Selector', () => {
    it('should select banner with highest priority', (done) => {
      const banner1 = createMockBanner('b1', 'active', 50);
      const banner2 = createMockBanner('b2', 'active', 100);
      const banner3 = createMockBanner('b3', 'active', 75);

      store.set([banner1, banner2, banner3]);

      query.selectFeaturedBanner$.pipe(take(1)).subscribe(banner => {
        expect(banner).toBeDefined();
        expect(banner?.id).toBe('b2');
        expect(banner?.priority).toBe(100);
        done();
      });
    });

    it('should return undefined when no banners exist', (done) => {
      query.selectFeaturedBanner$.pipe(take(1)).subscribe(banner => {
        expect(banner).toBeUndefined();
        done();
      });
    });

    it('should only consider active banners for featured', (done) => {
      const draftBanner = createMockBanner('b1', 'draft', 100);
      const activeBanner = createMockBanner('b2', 'active', 50);

      store.set([draftBanner, activeBanner]);

      query.selectFeaturedBanner$.pipe(take(1)).subscribe(banner => {
        expect(banner?.id).toBe('b2');
        done();
      });
    });
  });

  describe('Banners by Type Selector', () => {
    it('should select main banners', (done) => {
      const mainBanner = createMockBanner('b1', 'active', 100, 'main');
      const secondaryBanner = createMockBanner('b2', 'active', 90, 'secondary');
      const promoBanner = createMockBanner('b3', 'active', 80, 'promotional');

      store.set([mainBanner, secondaryBanner, promoBanner]);

      query.selectBannersByType('main').pipe(take(1)).subscribe(banners => {
        expect(banners.length).toBe(1);
        expect(banners[0].type).toBe('main');
        done();
      });
    });

    it('should select promotional banners', (done) => {
      const mainBanner = createMockBanner('b1', 'active', 100, 'main');
      const promoBanner1 = createMockBanner('b2', 'active', 90, 'promotional');
      const promoBanner2 = createMockBanner('b3', 'active', 80, 'promotional');

      store.set([mainBanner, promoBanner1, promoBanner2]);

      query.selectBannersByType('promotional').pipe(take(1)).subscribe(banners => {
        expect(banners.length).toBe(2);
        expect(banners.every(b => b.type === 'promotional')).toBe(true);
        done();
      });
    });
  });

  describe('Banners by Status Selector', () => {
    it('should select scheduled banners', (done) => {
      const activeBanner = createMockBanner('b1', 'active', 100);
      const scheduledBanner1 = createMockBanner('b2', 'scheduled', 90);
      const scheduledBanner2 = createMockBanner('b3', 'scheduled', 80);

      store.set([activeBanner, scheduledBanner1, scheduledBanner2]);

      query.selectBannersByStatus('scheduled').pipe(take(1)).subscribe(banners => {
        expect(banners.length).toBe(2);
        expect(banners.every(b => b.status === 'scheduled')).toBe(true);
        done();
      });
    });

    it('should select draft banners', (done) => {
      const activeBanner = createMockBanner('b1', 'active', 100);
      const draftBanner = createMockBanner('b2', 'draft', 90);

      store.set([activeBanner, draftBanner]);

      query.selectBannersByStatus('draft').pipe(take(1)).subscribe(banners => {
        expect(banners.length).toBe(1);
        expect(banners[0].status).toBe('draft');
        done();
      });
    });
  });

  describe('Count Selectors', () => {
    it('should count total banners', (done) => {
      const banner1 = createMockBanner('b1', 'active', 100);
      const banner2 = createMockBanner('b2', 'draft', 90);
      const banner3 = createMockBanner('b3', 'paused', 80);

      store.set([banner1, banner2, banner3]);

      query.selectCount().pipe(take(1)).subscribe(count => {
        expect(count).toBe(3);
        done();
      });
    });

    it('should count active banners', (done) => {
      const activeBanner1 = createMockBanner('b1', 'active', 100);
      const activeBanner2 = createMockBanner('b2', 'active', 90);
      const draftBanner = createMockBanner('b3', 'draft', 80);

      store.set([activeBanner1, activeBanner2, draftBanner]);

      query.selectActiveCount$.pipe(take(1)).subscribe(count => {
        expect(count).toBe(2);
        done();
      });
    });
  });

  describe('Reactive Updates', () => {
    it('should emit new values when store updates', (done) => {
      const banner1 = createMockBanner('b1', 'active', 100);
      const banner2 = createMockBanner('b2', 'active', 90);

      // Initial state
      store.set([banner1]);

      let emissionCount = 0;
      query.selectAll().subscribe(banners => {
        emissionCount++;

        if (emissionCount === 1) {
          expect(banners.length).toBe(1);
          // Add second banner
          store.add(banner2);
        } else if (emissionCount === 2) {
          expect(banners.length).toBe(2);
          done();
        }
      });
    });

    it('should update active banners when status changes', (done) => {
      const banner = createMockBanner('b1', 'active', 100);
      store.add(banner);

      let emissionCount = 0;
      query.selectActiveBanners$.subscribe(banners => {
        emissionCount++;

        if (emissionCount === 1) {
          expect(banners.length).toBe(1);
          // Change status to paused
          store.update('b1', { status: 'paused' });
        } else if (emissionCount === 2) {
          expect(banners.length).toBe(0);
          done();
        }
      });
    });
  });

  describe('Entity Lookup', () => {
    it('should select entity by ID', (done) => {
      const banner = createMockBanner('test-id', 'active', 100);
      store.add(banner);

      query.selectEntity('test-id').pipe(take(1)).subscribe(entity => {
        expect(entity).toBeDefined();
        expect(entity?.id).toBe('test-id');
        done();
      });
    });

    it('should return undefined for non-existent ID', (done) => {
      query.selectEntity('non-existent').pipe(take(1)).subscribe(entity => {
        expect(entity).toBeUndefined();
        done();
      });
    });
  });
});
