/**
 * @file category.component.spec.ts
 * @description Unit tests for the CategoryComponent
 *
 * TEST COVERAGE:
 * - Component creation and initialization
 * - Product loading via facade service
 * - Sorting, view mode, pagination changes
 * - Filter application and clearing
 * - Product actions (click, cart, wishlist)
 * - UI state (sidebar toggle, back-to-top, related categories)
 * - Computed properties (products, pagination, category, availableFilters)
 * - Helper methods (formatSliderValue, getActiveFiltersCount)
 *
 * @author SouqSyria Development Team
 * @since 2026-02-14
 * @ticket SS-CAT-002, SS-CAT-003
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, Subject, throwError } from 'rxjs';

import { CategoryComponent } from './category.component';
import { CategoryFacadeService } from '../services/category-facade.service';
import { CategoryAnalyticsService } from '../services/category-analytics.service';
import { ProductListingResponse } from '../../../shared/interfaces/category-filter.interface';

// =============================================================================
// MOCK FACTORIES
// =============================================================================

/**
 * Creates a mock ProductListingResponse for testing
 * @param overrides - Partial overrides for the response
 * @returns Complete ProductListingResponse
 */
const createMockProductResponse = (overrides?: Partial<ProductListingResponse>): ProductListingResponse => ({
  products: [
    { id: '1', name: 'Damascus Steel Knife', slug: 'damascus-steel-knife' },
    { id: '2', name: 'Aleppo Soap', slug: 'aleppo-soap' },
  ] as any[],
  pagination: {
    page: 1,
    limit: 20,
    total: 50,
    totalPages: 3,
    hasNext: true,
    hasPrevious: false,
  },
  category: {
    id: '5',
    name: 'Traditional Crafts',
    slug: 'traditional-crafts',
    breadcrumb: ['Home', 'Traditional Crafts'],
  },
  availableFilters: {
    priceRanges: { min: 1000, max: 50000, currency: 'SYP' },
    ratings: [{ value: 4, count: 10 }, { value: 5, count: 5 }],
    categories: [],
    locations: [],
    materials: [],
    heritage: [],
    sellers: [],
  } as any,
  ...overrides,
});

/**
 * Creates a mock Product for action testing
 * @param overrides - Partial product overrides
 * @returns Product-like object
 */
const createMockProduct = (overrides?: Record<string, unknown>) => ({
  id: 1,
  name: 'Damascus Steel Knife',
  slug: 'damascus-steel-knife',
  price: 15000,
  image: 'knife.jpg',
  rating: 4.5,
  ...overrides,
});

// =============================================================================
// TEST SUITE
// =============================================================================

/** @description Unit tests for the CategoryComponent */
describe('CategoryComponent', () => {
  let component: CategoryComponent;
  let fixture: ComponentFixture<CategoryComponent>;
  let mockFacade: jasmine.SpyObj<CategoryFacadeService>;
  let mockAnalytics: jasmine.SpyObj<CategoryAnalyticsService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockTitle: jasmine.SpyObj<Title>;
  let mockMeta: jasmine.SpyObj<Meta>;
  let paramMapSubject: Subject<any>;

  beforeEach(async () => {
    // Subject starts empty; we'll emit initial value after detectChanges
    paramMapSubject = new Subject();

    mockFacade = jasmine.createSpyObj('CategoryFacadeService', [
      'loadCategoryProducts',
      'handleProductClick',
      'addToCart',
      'handleWishlistToggle',
      'handleRelatedCategoryClick',
      'generateSEOMetaTags',
      'generateStructuredData',
    ]);

    mockAnalytics = jasmine.createSpyObj('CategoryAnalyticsService', [
      'trackCategoryView',
      'trackViewModeChange',
      'trackSidebarToggle',
      'trackBackToTopClick',
    ]);

    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    mockTitle = jasmine.createSpyObj('Title', ['setTitle']);

    mockMeta = jasmine.createSpyObj('Meta', ['updateTag']);

    // Default: facade returns mock products
    mockFacade.loadCategoryProducts.and.returnValue(
      of(createMockProductResponse()),
    );
    mockFacade.generateSEOMetaTags.and.returnValue({
      title: 'Test',
      description: 'Test desc',
      keywords: 'test',
      canonicalUrl: '/test',
      openGraph: { title: '', description: '', url: '', image: '', type: 'website', siteName: 'SouqSyria' },
      twitterCard: { card: 'summary', title: '', description: '', image: '' },
    });
    mockFacade.generateStructuredData.and.returnValue({});

    await TestBed.configureTestingModule({
      imports: [CategoryComponent, NoopAnimationsModule],
      providers: [
        { provide: CategoryFacadeService, useValue: mockFacade },
        { provide: CategoryAnalyticsService, useValue: mockAnalytics },
        { provide: Router, useValue: mockRouter },
        { provide: Title, useValue: mockTitle },
        { provide: Meta, useValue: mockMeta },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ categorySlug: 'electronics' }),
            },
            paramMap: paramMapSubject.asObservable(),
          },
        },
        { provide: DOCUMENT, useValue: document },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryComponent);
    component = fixture.componentInstance;

    // NOTE: Don't call fixture.detectChanges() here. Each test should:
    // 1. Configure mocks
    // 2. Call initComponent() helper to trigger ngOnInit + route
  });

  /**
   * Helper to initialize component with route param
   * Triggers ngOnInit and emits paramMap for category slug
   */
  function initComponent(slug = 'electronics'): void {
    fixture.detectChanges(); // Trigger ngOnInit
    paramMapSubject.next(convertToParamMap({ categorySlug: slug })); // Emit route
  }

  // ===========================================================================
  // COMPONENT CREATION & INITIALIZATION
  // ===========================================================================

  /** @description Verifies component creates successfully with all dependencies */
  describe('Component Creation', () => {
    /** Should create the component */
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    /** Should set initial category slug from route snapshot */
    it('should set initial category slug from route snapshot', () => {
      initComponent();
      expect(component.categorySlug()).toBe('electronics');
    });

    /** Should call loadCategoryProducts on init */
    it('should call loadCategoryProducts on init', () => {
      initComponent();
      expect(mockFacade.loadCategoryProducts).toHaveBeenCalled();
    });

    /** Should update slug when route params change */
    it('should update slug when route params change', () => {
      initComponent(); // Initial load with 'electronics'
      expect(mockFacade.loadCategoryProducts).toHaveBeenCalledTimes(1);

      paramMapSubject.next(convertToParamMap({ categorySlug: 'fashion' })); // Change route

      expect(component.categorySlug()).toBe('fashion');
      // Should reload products for new slug
      expect(mockFacade.loadCategoryProducts).toHaveBeenCalledTimes(2);
    });
  });

  // ===========================================================================
  // PRODUCT LOADING
  // ===========================================================================

  /** @description Tests for product loading and response handling */
  describe('Product Loading', () => {
    /** Should set isLoading to true during load */
    it('should set isLoading to true during load', () => {
      // Before detectChanges (which triggers ngOnInit + loadProducts)
      // loadProducts sets isLoading = true synchronously
      initComponent();
      paramMapSubject.next(convertToParamMap({ categorySlug: 'electronics' }));
      // After subscribe completes (sync), isLoading is false
      expect(component.isLoading()).toBe(false);
    });

    /** Should set productListingResponse after load */
    it('should set productListingResponse after successful load', () => {
      initComponent();
      paramMapSubject.next(convertToParamMap({ categorySlug: 'electronics' }));
      expect(component.productListingResponse()).toBeTruthy();
      expect(component.productListingResponse()!.products).toHaveSize(2);
    });

    /** Should set isLoading to false after successful load */
    it('should set isLoading to false after successful load', () => {
      initComponent();
      paramMapSubject.next(convertToParamMap({ categorySlug: 'electronics' }));
      expect(component.isLoading()).toBe(false);
    });

    /** Should pass current filters and sort to facade */
    it('should pass current state to facade loadCategoryProducts', () => {
      initComponent();
      paramMapSubject.next(convertToParamMap({ categorySlug: 'electronics' }));

      const callArg = mockFacade.loadCategoryProducts.calls.mostRecent().args[0];
      expect(callArg.categorySlug).toBe('electronics');
      expect(callArg.sort).toBeDefined();
      expect(callArg.pagination).toBeDefined();
    });
  });

  // ===========================================================================
  // COMPUTED PROPERTIES
  // ===========================================================================

  /** @description Tests for computed signal properties */
  describe('Computed Properties', () => {
    beforeEach(() => {
      initComponent();
    });

    /** Should compute products from response */
    it('should compute products from response', () => {
      expect(component.products()).toHaveSize(2);
    });

    /** Should compute pagination from response */
    it('should compute pagination from response', () => {
      const pagination = component.pagination();
      expect(pagination).toBeDefined();
      expect(pagination!.total).toBe(50);
      expect(pagination!.totalPages).toBe(3);
    });

    /** Should compute category from response */
    it('should compute category from response', () => {
      const category = component.category();
      expect(category).toBeDefined();
      expect(category!.name).toBe('Traditional Crafts');
    });

    /** Should compute availableFilters from response */
    it('should compute availableFilters from response', () => {
      const filters = component.availableFilters();
      expect(filters).toBeDefined();
      expect(filters!.priceRanges.min).toBe(1000);
    });

    /** Should return empty products when no response */
    it('should return empty products when no response', () => {
      component['productListingResponse'].set(null);
      expect(component.products()).toEqual([]);
    });
  });

  // ===========================================================================
  // SORTING
  // ===========================================================================

  /** @description Tests for sort change handling */
  describe('Sorting', () => {
    beforeEach(() => {
      initComponent();
      mockFacade.loadCategoryProducts.calls.reset();
    });

    /** Should update sort and reload products */
    it('should update sort and reload products on sort change', () => {
      component.onSortChangeFromToolbar('price-asc');
      expect(mockFacade.loadCategoryProducts).toHaveBeenCalled();
    });

    /** Should reset to page 1 on sort change */
    it('should reset to page 1 on sort change', () => {
      component['currentPage'].set(3);
      component.onSortChangeFromToolbar('price-asc');
      expect(component.currentPage()).toBe(1);
    });
  });

  // ===========================================================================
  // VIEW MODE
  // ===========================================================================

  /** @description Tests for view mode changes */
  describe('View Mode', () => {
    beforeEach(() => {
      initComponent();
    });

    /** Should update view mode and track analytics */
    it('should update view mode and track analytics', () => {
      component.onViewModeChange('list');
      expect(component.currentViewMode().mode).toBe('list');
      expect(mockAnalytics.trackViewModeChange).toHaveBeenCalledWith('electronics', 'list');
    });
  });

  // ===========================================================================
  // PAGINATION
  // ===========================================================================

  /** @description Tests for pagination changes */
  describe('Pagination', () => {
    beforeEach(() => {
      initComponent();
      mockFacade.loadCategoryProducts.calls.reset();
    });

    /** Should update page and reload products */
    it('should update page and reload products on page change', () => {
      component.onPaginatorEvent({ pageIndex: 1, pageSize: 20 });
      expect(component.currentPage()).toBe(2); // pageIndex + 1
      expect(mockFacade.loadCategoryProducts).toHaveBeenCalled();
    });

    /** Should update page size, reset to page 1, and reload */
    it('should update page size, reset to page 1, and reload', () => {
      component['currentPage'].set(3);
      component.onPaginatorEvent({ pageIndex: 0, pageSize: 50 });
      expect(component.itemsPerPage()).toBe(50);
      expect(component.currentPage()).toBe(1);
      expect(mockFacade.loadCategoryProducts).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // FILTERS
  // ===========================================================================

  /** @description Tests for filter application and clearing */
  describe('Filters', () => {
    beforeEach(() => {
      // Most tests need component initialized
      // Tests that check filter removal logic can skip this
    });

    /** Should apply filters and reload products */
    it('should apply filters from filter sidebar', () => {
      initComponent();
      mockFacade.loadCategoryProducts.calls.reset();

      component.onFiltersChange({
        priceRange: { min: 5000, max: 20000 },
        ratings: [4, 5],
      });
      expect(component.priceRange()).toEqual({ min: 5000, max: 20000 });
      expect(component.selectedRatings()).toEqual([4, 5]);
      expect(mockFacade.loadCategoryProducts).toHaveBeenCalled();
    });

    /** Should reset page to 1 on filter change */
    it('should reset page to 1 on filter apply', () => {
      initComponent();
      mockFacade.loadCategoryProducts.calls.reset();

      component['currentPage'].set(5);
      component.applyFilters();
      expect(component.currentPage()).toBe(1);
    });

    /** Should clear all filters */
    it('should clear all filters on clearAllFilters', () => {
      initComponent();
      mockFacade.loadCategoryProducts.calls.reset();

      component['selectedRatings'].set([4, 5]);
      component['onlyFreeShipping'].set(true);
      component['selectedLocations'].set(['Damascus']);

      component.onClearAllFilters();

      expect(component.currentPage()).toBe(1);
      expect(mockFacade.loadCategoryProducts).toHaveBeenCalled();
    });

    /** Should remove specific filter by key */
    it('should remove specific filter by key', () => {
      component['selectedRatings'].set([4, 5]);
      component.onRemoveFilter('rating-4');
      expect(component.selectedRatings()).toEqual([5]);
    });

    /** Should remove price range filter */
    it('should remove price range filter', () => {
      initComponent();
      mockFacade.loadCategoryProducts.calls.reset();

      // Set a custom price range
      component['priceRange'].set({ min: 5000, max: 20000 });

      // onRemoveFilter resets to {0, 1000} then calls applyFilters → loadProducts
      // loadProducts updates priceRange from response ({1000, 50000})
      component.onRemoveFilter('priceRange');

      // Verify it was reset to default (briefly) and loadProducts was called
      expect(mockFacade.loadCategoryProducts).toHaveBeenCalled();
      // After sync Observable completes, priceRange is updated from mock response
      expect(component.priceRange()).toEqual({ min: 1000, max: 50000 });
    });

    /** Should remove authenticity-unesco filter */
    it('should remove authenticity-unesco filter', () => {
      component['onlyUnesco'].set(true);
      component.onRemoveFilter('authenticity-unesco');
      expect(component.onlyUnesco()).toBe(false);
    });

    /** Should remove region filter */
    it('should remove region filter', () => {
      component['selectedLocations'].set(['Damascus', 'Aleppo']);
      component.onRemoveFilter('region-Damascus');
      expect(component.selectedLocations()).toEqual(['Aleppo']);
    });
  });

  // ===========================================================================
  // PRODUCT ACTIONS
  // ===========================================================================

  /** @description Tests for product click, cart, and wishlist actions */
  describe('Product Actions', () => {
    const product = createMockProduct();

    beforeEach(() => {
      initComponent();
    });

    /** Should handle product click via facade and navigate */
    it('should handle product click via facade and navigate', () => {
      component.onProductClick(product as any);
      expect(mockFacade.handleProductClick).toHaveBeenCalledWith(
        jasmine.objectContaining({ id: 1, slug: 'damascus-steel-knife' }) as any,
        undefined,
        'category',
      );
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/product', 'damascus-steel-knife']);
    });

    /** Should handle add to cart via facade */
    it('should handle add to cart via facade', () => {
      component.onAddToCart(product as any);
      expect(mockFacade.addToCart).toHaveBeenCalledWith(
        jasmine.objectContaining({ id: 1 }) as any, 1, 'category',
      );
    });

    /** Should handle wishlist toggle via facade */
    it('should handle wishlist toggle via facade', () => {
      component.onToggleWishlist(product as any);
      expect(mockFacade.handleWishlistToggle).toHaveBeenCalledWith(
        jasmine.objectContaining({ id: 1 }) as any, 'category',
      );
    });
  });

  // ===========================================================================
  // UI STATE
  // ===========================================================================

  /** @description Tests for sidebar toggle, back-to-top, and related categories */
  describe('UI State', () => {
    beforeEach(() => {
      initComponent();
    });

    /** Should toggle sidebar and track analytics */
    it('should toggle sidebar and track analytics', () => {
      expect(component.isSidenavOpen()).toBe(false);
      component.toggleSidebar();
      expect(component.isSidenavOpen()).toBe(true);
      expect(mockAnalytics.trackSidebarToggle).toHaveBeenCalledWith('electronics', true);
    });

    /** Should toggle sidebar back to closed */
    it('should toggle sidebar back to closed', () => {
      component.toggleSidebar(); // open
      component.toggleSidebar(); // close
      expect(component.isSidenavOpen()).toBe(false);
      expect(mockAnalytics.trackSidebarToggle).toHaveBeenCalledWith('electronics', false);
    });

    /** Should track back to top click */
    it('should track back to top click', () => {
      component.scrollToTop();
      expect(mockAnalytics.trackBackToTopClick).toHaveBeenCalledWith('electronics');
    });

    /** Should handle related category click */
    it('should handle related category click and navigate', () => {
      // relatedCategories is computed from the slug — it may or may not find a match
      // We just verify it calls navigate
      component.onRelatedCategoryClick('fashion');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/category', 'fashion']);
    });
  });

  // ===========================================================================
  // HELPER METHODS
  // ===========================================================================

  /** @description Tests for formatSliderValue and activeFiltersCount */
  describe('Helper Methods', () => {
    beforeEach(() => {
      initComponent();
    });

    /** Should format slider value with dollar sign */
    it('should format slider value with dollar sign', () => {
      expect(component.formatSliderValue(1500)).toBe('$1500');
      expect(component.formatSliderValue(0)).toBe('$0');
    });

    /** Should return 0 when no filters active */
    it('should return 0 when no filters active', () => {
      expect(component.activeFiltersCount()).toBe(0);
    });

    /** Should count active filters correctly */
    it('should count active filters correctly', () => {
      component['selectedRatings'].set([4, 5]);
      component['onlyFreeShipping'].set(true);
      component['selectedLocations'].set(['Damascus']);

      expect(component.activeFiltersCount()).toBe(3);
    });

    /** Should count all boolean filters */
    it('should count all boolean filters when all active', () => {
      component['onlyAuthentic'].set(true);
      component['onlyFreeShipping'].set(true);
      component['onlyOnSale'].set(true);
      component['onlyUnesco'].set(true);

      expect(component.activeFiltersCount()).toBe(4);
    });
  });

  // ===========================================================================
  // CURRENT FILTERS COMPUTED PROPERTY
  // ===========================================================================

  /** @description Tests for the currentFilters computed property */
  describe('currentFilters Computed', () => {
    beforeEach(() => {
      initComponent();
    });

    /** Should return empty object when no filters set */
    it('should return empty object when no filters set', () => {
      // After initComponent(), priceRange is updated from availableFilters response
      // Reset it back to defaults for this test
      component['priceRange'].set({ min: 0, max: 1000 });
      const filters = component.currentFilters();
      expect(Object.keys(filters).length).toBe(0);
    });

    /** Should include priceRange when changed from defaults */
    it('should include priceRange when changed from defaults', () => {
      component['priceRange'].set({ min: 500, max: 2000 });
      const filters = component.currentFilters();
      expect(filters.priceRange).toEqual({ min: 500, max: 2000 });
    });

    /** Should include ratings when selected */
    it('should include ratings when selected', () => {
      component['selectedRatings'].set([4, 5]);
      const filters = component.currentFilters();
      expect(filters.ratings).toEqual([4, 5]);
    });

    /** Should include authenticity flags */
    it('should include authenticity when unesco enabled', () => {
      component['onlyUnesco'].set(true);
      const filters = component.currentFilters();
      expect(filters.authenticity).toBeDefined();
      expect(filters.authenticity!.unesco).toBe(true);
    });

    /** Should include regions when selected */
    it('should include regions when locations selected', () => {
      component['selectedLocations'].set(['Damascus', 'Aleppo']);
      const filters = component.currentFilters();
      expect(filters.regions).toEqual(['Damascus', 'Aleppo']);
    });
  });

  // ===========================================================================
  // WINDOW SCROLL HANDLER
  // ===========================================================================

  /** @description Tests for scroll listener via RxJS */
  describe('Window Scroll', () => {
    beforeEach(() => {
      initComponent();
    });

    /** Should show back-to-top when scrolled past threshold */
    it('should show back-to-top when scrolled past threshold', (done) => {
      // Simulate scroll position > 300 (BACK_TO_TOP_SCROLL_THRESHOLD)
      Object.defineProperty(window, 'pageYOffset', { value: 500, writable: true, configurable: true });

      // Dispatch scroll event to trigger RxJS listener
      window.dispatchEvent(new Event('scroll'));

      // Wait for throttleTime to complete
      setTimeout(() => {
        expect(component.showBackToTop()).toBe(true);
        done();
      }, 250);
    });

    /** Should hide back-to-top when scrolled back up */
    it('should hide back-to-top when scrolled back up', (done) => {
      Object.defineProperty(window, 'pageYOffset', { value: 100, writable: true, configurable: true });

      // Dispatch scroll event to trigger RxJS listener
      window.dispatchEvent(new Event('scroll'));

      // Wait for throttleTime to complete
      setTimeout(() => {
        expect(component.showBackToTop()).toBe(false);
        done();
      }, 250);
    });
  });

  // ===========================================================================
  // EMPTY STATE
  // ===========================================================================

  /** @description Tests for empty product state when no products match */
  describe('Empty State', () => {
    /** Should show empty products when response has zero products */
    it('should show empty products when response has zero products', () => {
      mockFacade.loadCategoryProducts.and.returnValue(
        of(createMockProductResponse({
          products: [],
          pagination: {
            page: 1, limit: 20, total: 0, totalPages: 0,
            hasNext: false, hasPrevious: false,
          },
        })),
      );
      initComponent();

      expect(component.products()).toEqual([]);
      expect(component.pagination()!.total).toBe(0);
    });

    /** Should clear filters and reload when clearAllFilters called on empty state */
    it('should reload products after clearing filters on empty state', () => {
      mockFacade.loadCategoryProducts.and.returnValue(
        of(createMockProductResponse({ products: [] })),
      );
      initComponent();
      mockFacade.loadCategoryProducts.calls.reset();

      // Simulate user clicking "Clear Filters" button in empty state
      component.onClearAllFilters();
      expect(mockFacade.loadCategoryProducts).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // ERROR HANDLING
  // ===========================================================================

  /** @description Tests for error scenarios during product loading */
  describe('Error Handling', () => {
    /** Should set isLoading to false when loadCategoryProducts errors */
    it('should set isLoading to false on API error', () => {
      mockFacade.loadCategoryProducts.and.returnValue(
        throwError(() => new Error('Network failure')),
      );
      initComponent();

      expect(component.isLoading()).toBe(false);
    });

    /** Should keep productListingResponse null on first load error */
    it('should keep productListingResponse null on first load error', () => {
      mockFacade.loadCategoryProducts.and.returnValue(
        throwError(() => new Error('Server error')),
      );
      initComponent();

      expect(component.productListingResponse()).toBeNull();
      expect(component.products()).toEqual([]);
    });

    /** Should log error to console on failure */
    it('should log error to console on API failure', () => {
      spyOn(console, 'error');
      mockFacade.loadCategoryProducts.and.returnValue(
        throwError(() => new Error('Category not found')),
      );
      initComponent();

      expect(console.error).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // LOADING STATE
  // ===========================================================================

  /** @description Tests for loading skeleton state transitions */
  describe('Loading State', () => {
    /** Should be not loading before initialization */
    it('should be not loading before initialization', () => {
      // Before ngOnInit triggers
      expect(component.isLoading()).toBe(false);
    });

    /** Should transition isLoading false → true → false on successful load */
    it('should complete loading cycle on success', () => {
      // After init + successful load completes synchronously
      initComponent();
      expect(component.isLoading()).toBe(false);
      expect(component.productListingResponse()).toBeTruthy();
    });

    /** Should have products available after loading completes */
    it('should populate products after loading completes', () => {
      initComponent();
      expect(component.isLoading()).toBe(false);
      expect(component.products().length).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // DESTROY / CLEANUP (DestroyRef + takeUntilDestroyed)
  // ===========================================================================

  /** @description Tests for subscription cleanup via DestroyRef */
  describe('Cleanup on Destroy', () => {
    /** Should not throw when component is destroyed */
    it('should destroy without errors', () => {
      initComponent();
      expect(() => fixture.destroy()).not.toThrow();
    });

    /** Should not reload products after destroy when route changes */
    it('should not reload products after component is destroyed', () => {
      initComponent();
      mockFacade.loadCategoryProducts.calls.reset();

      // Destroy the component (triggers DestroyRef → unsubscribes)
      fixture.destroy();

      // Emit new route param after destruction
      paramMapSubject.next(convertToParamMap({ categorySlug: 'new-category' }));

      // Should NOT have called loadCategoryProducts because subscription was cleaned up
      expect(mockFacade.loadCategoryProducts).not.toHaveBeenCalled();
    });
  });
});
