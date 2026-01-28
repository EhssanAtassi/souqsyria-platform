/**
 * Hero Banners Store Unit Tests
 *
 * Testing strategy:
 * - Initial state verification
 * - State updates (loading, error)
 * - Entity operations (set, add, update, remove)
 * - Resettable store behavior
 *
 * Following TDD: These tests will FAIL until implementation is complete
 */

import { HeroBannersStore, HeroBannersState } from './hero-banners.store';
import { HeroBanner, BannerStatus } from '../../features/hero-banners/interfaces/hero-banner.interface';

describe('HeroBannersStore', () => {
  let store: HeroBannersStore;

  // Mock hero banner for testing
  const mockBanner: HeroBanner = {
    id: 'test-banner-001',
    name: {
      english: 'Test Banner',
      arabic: 'بانر اختبار'
    },
    type: 'main',
    status: 'active' as BannerStatus,
    priority: 100,
    image: {
      url: '/assets/test.jpg',
      alt: {
        english: 'Test Image',
        arabic: 'صورة اختبار'
      },
      dimensions: { width: 1920, height: 800 },
      format: 'jpg',
      size: 200000
    },
    headline: {
      english: 'Test Headline',
      arabic: 'عنوان اختبار'
    },
    subheadline: {
      english: 'Test Subheadline',
      arabic: 'عنوان فرعي اختبار'
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
      target: '/test-category'
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
  };

  beforeEach(() => {
    store = new HeroBannersStore();
  });

  afterEach(() => {
    store.destroy();
  });

  describe('Initial State', () => {
    it('should create store with default initial state', () => {
      const state = store.getValue();

      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.ids).toEqual([]);
      expect(state.entities).toEqual({});
    });

    it('should have correct store name', () => {
      expect(store.storeName).toBe('hero-banners');
    });

    it('should be resettable', () => {
      // Add data
      store.set([mockBanner]);
      store.update({ loading: true, error: 'test error' });

      // Reset
      store.reset();

      const state = store.getValue();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.ids).toEqual([]);
    });
  });

  describe('Loading State', () => {
    it('should update loading state to true', () => {
      store.setLoading(true);

      expect(store.getValue().loading).toBe(true);
    });

    it('should update loading state to false', () => {
      store.setLoading(true);
      store.setLoading(false);

      expect(store.getValue().loading).toBe(false);
    });
  });

  describe('Error State', () => {
    it('should set error message', () => {
      const errorMessage = 'Failed to load banners';
      store.setError(errorMessage);

      expect(store.getValue().error).toBe(errorMessage);
    });

    it('should clear error when set to null', () => {
      store.setError('Initial error');
      store.setError(null);

      expect(store.getValue().error).toBeNull();
    });

    it('should set error and disable loading', () => {
      store.setLoading(true);
      store.updateError('Error occurred');

      const state = store.getValue();
      expect(state.error).toBe('Error occurred');
      expect(state.loading).toBe(false);
    });
  });

  describe('Entity Operations', () => {
    it('should add a single banner', () => {
      store.add(mockBanner);

      const state = store.getValue();
      expect(state.ids).toContain(mockBanner.id);
      expect(state.entities?.[mockBanner.id]).toEqual(mockBanner);
    });

    it('should add multiple banners', () => {
      const banner2: HeroBanner = {
        ...mockBanner,
        id: 'test-banner-002',
        priority: 90
      };

      store.add([mockBanner, banner2]);

      const state = store.getValue();
      expect(state.ids?.length).toBe(2);
      expect(state.ids).toContain(mockBanner.id);
      expect(state.ids).toContain(banner2.id);
    });

    it('should set (replace) all banners', () => {
      // Add initial banner
      store.add(mockBanner);

      // Set new banner (should replace)
      const newBanner: HeroBanner = {
        ...mockBanner,
        id: 'new-banner',
        priority: 95
      };
      store.set([newBanner]);

      const state = store.getValue();
      expect(state.ids?.length).toBe(1);
      expect(state.ids).toContain(newBanner.id);
      expect(state.ids).not.toContain(mockBanner.id);
    });

    it('should update a banner', () => {
      store.add(mockBanner);

      const updatedPriority = 80;
      store.update(mockBanner.id, { priority: updatedPriority });

      const banner = store.getValue().entities?.[mockBanner.id];
      expect(banner?.priority).toBe(updatedPriority);
    });

    it('should remove a banner', () => {
      store.add(mockBanner);
      store.remove(mockBanner.id);

      const state = store.getValue();
      expect(state.ids).not.toContain(mockBanner.id);
      expect(state.entities?.[mockBanner.id]).toBeUndefined();
    });

    it('should upsert a banner (add if not exists)', () => {
      store.upsert(mockBanner.id, mockBanner);

      const state = store.getValue();
      expect(state.ids).toContain(mockBanner.id);
    });

    it('should upsert a banner (update if exists)', () => {
      store.add(mockBanner);

      const updatedBanner = {
        ...mockBanner,
        priority: 75
      };
      store.upsert(mockBanner.id, updatedBanner);

      const banner = store.getValue().entities?.[mockBanner.id];
      expect(banner?.priority).toBe(75);
    });
  });

  describe('Sorting by Priority', () => {
    it('should maintain banners sorted by priority (highest first)', () => {
      const banner1: HeroBanner = { ...mockBanner, id: 'b1', priority: 50 };
      const banner2: HeroBanner = { ...mockBanner, id: 'b2', priority: 100 };
      const banner3: HeroBanner = { ...mockBanner, id: 'b3', priority: 75 };

      store.set([banner1, banner2, banner3]);

      // IDs should be sorted by priority descending
      const state = store.getValue();
      const priorities = state.ids!.map(id => state.entities![id]?.priority || 0);

      // Verify descending order
      for (let i = 0; i < priorities.length - 1; i++) {
        expect(priorities[i]).toBeGreaterThanOrEqual(priorities[i + 1]);
      }
    });
  });

  describe('Bilingual Content Support', () => {
    it('should store English content correctly', () => {
      store.add(mockBanner);

      const banner = store.getValue().entities?.[mockBanner.id];
      expect(banner?.name.english).toBe('Test Banner');
      expect(banner?.headline.english).toBe('Test Headline');
    });

    it('should store Arabic content correctly', () => {
      store.add(mockBanner);

      const banner = store.getValue().entities?.[mockBanner.id];
      expect(banner?.name.arabic).toBe('بانر اختبار');
      expect(banner?.headline.arabic).toBe('عنوان اختبار');
    });
  });

  describe('Store Integration', () => {
    it('should handle API success workflow', () => {
      // Simulate API loading workflow
      store.setLoading(true);
      expect(store.getValue().loading).toBe(true);

      // Simulate successful API response
      store.set([mockBanner]);
      store.setLoading(false);
      store.setError(null);

      const state = store.getValue();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.ids).toContain(mockBanner.id);
    });

    it('should handle API error workflow', () => {
      // Simulate API loading
      store.setLoading(true);

      // Simulate API error - use updateError() which also disables loading
      const errorMsg = 'Network error';
      store.updateError(errorMsg);

      const state = store.getValue();
      expect(state.loading).toBe(false);
      expect(state.error).toBe(errorMsg);
    });
  });
});
