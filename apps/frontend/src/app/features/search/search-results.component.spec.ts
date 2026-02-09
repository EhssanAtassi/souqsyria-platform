/**
 * @file search-results.component.spec.ts
 * @description Unit tests for SearchResultsComponent.
 * Validates search query extraction from URL, product service integration,
 * loading/error/empty/data display states, and bilingual support.
 *
 * Child components (ProductCardComponent) are replaced with a lightweight
 * stub to isolate the page component logic and avoid nested dependency issues.
 * The real Router from provideRouter is used so that RouterLink directives
 * in the template resolve correctly; Router.navigate is spied on separately.
 *
 * @swagger
 * tags:
 *   - name: SearchResultsComponent Tests
 *     description: Verifies the search results page orchestration
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, throwError, Subject, BehaviorSubject } from 'rxjs';
import { convertToParamMap, ParamMap } from '@angular/router';
import { SearchResultsComponent } from './search-results.component';
import { ProductService } from '../../features/products/services/product.service';
import { CartService } from '../../store/cart/cart.service';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { Product } from '../../shared/interfaces/product.interface';
import {
  ProductListItem,
  ProductListMeta,
  ProductListResponse,
} from '../../features/products/models/product-list.interface';

// ---------------------------------------------------------------------------
// Stub components to replace children and avoid nested dependency issues
// ---------------------------------------------------------------------------

/**
 * @description Stub for ProductCardComponent to prevent nested template rendering
 */
@Component({
  selector: 'app-product-card',
  standalone: true,
  template: '<div class="stub-product-card"></div>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class StubProductCardComponent {
  @Input() product!: Product;
  @Input() viewMode: 'grid' | 'list' = 'grid';
  @Input() showWishlist = true;
  @Input() showQuickAdd = true;
  @Output() addToCart = new EventEmitter<Product>();
  @Output() toggleWishlist = new EventEmitter<Product>();
  @Output() productClick = new EventEmitter<Product>();
}

// ---------------------------------------------------------------------------
// Mock data factories
// ---------------------------------------------------------------------------

/**
 * @description Creates a mock ProductListItem with sensible defaults
 * @param overrides - Partial fields to override
 * @returns Complete ProductListItem
 */
function createMockProductListItem(
  overrides: Partial<ProductListItem> = {}
): ProductListItem {
  return {
    id: 1,
    slug: 'damascus-steel-knife',
    nameEn: 'Damascus Steel Knife',
    nameAr: 'سكين فولاذ دمشقي',
    mainImage: 'https://example.com/knife.jpg',
    basePrice: 2500000,
    discountPrice: null,
    currency: 'SYP',
    categoryId: 1,
    categoryNameEn: 'Damascus Steel',
    categoryNameAr: 'فولاذ دمشقي',
    stockStatus: 'in_stock',
    rating: 4.5,
    reviewCount: 12,
    ...overrides,
  };
}

/**
 * @description Creates a mock ProductListMeta
 * @param overrides - Partial fields to override
 * @returns Complete ProductListMeta
 */
function createMockMeta(
  overrides: Partial<ProductListMeta> = {}
): ProductListMeta {
  return {
    total: 50,
    page: 1,
    limit: 20,
    totalPages: 3,
    ...overrides,
  };
}

/**
 * @description Creates a mock ProductListResponse with multiple products
 * @param count - Number of products to generate
 * @param metaOverrides - Partial meta fields
 * @returns Complete ProductListResponse
 */
function createMockResponse(
  count: number = 3,
  metaOverrides: Partial<ProductListMeta> = {}
): ProductListResponse {
  const data: ProductListItem[] = [];
  for (let i = 1; i <= count; i++) {
    data.push(
      createMockProductListItem({
        id: i,
        slug: `product-${i}`,
        nameEn: `Product ${i}`,
        nameAr: `منتج ${i}`,
      })
    );
  }
  return {
    data,
    meta: createMockMeta({ total: count, ...metaOverrides }),
  };
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('SearchResultsComponent', () => {
  let component: SearchResultsComponent;
  let fixture: ComponentFixture<SearchResultsComponent>;
  let productServiceSpy: jasmine.SpyObj<ProductService>;
  let cartServiceSpy: jasmine.SpyObj<CartService>;
  let router: Router;
  let navigateSpy: jasmine.Spy;
  let queryParamMap$: BehaviorSubject<ParamMap>;

  /**
   * @description Helper to create a ParamMap with a query string
   * @param q - The search query string, or empty string for no query
   * @returns ParamMap compatible with ActivatedRoute.queryParamMap
   */
  function makeQueryParamMap(q: string): ParamMap {
    return convertToParamMap(q ? { q } : {});
  }

  beforeEach(async () => {
    productServiceSpy = jasmine.createSpyObj('ProductService', ['getProducts']);
    cartServiceSpy = jasmine.createSpyObj('CartService', ['addToCart']);

    /** @description BehaviorSubject to simulate ActivatedRoute.queryParamMap */
    queryParamMap$ = new BehaviorSubject<ParamMap>(makeQueryParamMap(''));

    await TestBed.configureTestingModule({
      imports: [SearchResultsComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: ProductService, useValue: productServiceSpy },
        { provide: CartService, useValue: cartServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: queryParamMap$.asObservable(),
            snapshot: {
              queryParamMap: makeQueryParamMap(''),
            },
          },
        },
      ],
    })
      .overrideComponent(SearchResultsComponent, {
        remove: { imports: [ProductCardComponent] },
        add: { imports: [StubProductCardComponent] },
      })
      .compileComponents();

    /** @description Obtain the real Router from DI and spy on its navigate method */
    router = TestBed.inject(Router);
    navigateSpy = spyOn(router, 'navigate').and.returnValue(
      Promise.resolve(true)
    );
  });

  /**
   * @description Creates the component fixture and optionally triggers change detection
   * @param autoInit - Whether to call detectChanges immediately
   */
  function createComponent(autoInit: boolean = false): void {
    fixture = TestBed.createComponent(SearchResultsComponent);
    component = fixture.componentInstance;
    if (autoInit) {
      fixture.detectChanges();
    }
  }

  // =========================================================================
  // 1. Component creation
  // =========================================================================

  describe('Component Creation', () => {
    /**
     * @description Verifies the component instantiates successfully
     */
    it('should create the component', () => {
      createComponent(true);
      expect(component).toBeTruthy();
    });
  });

  // =========================================================================
  // 2. Reads query from URL queryParams
  // =========================================================================

  describe('Query Param Reading', () => {
    /**
     * @description Verifies the search query is read from URL queryParamMap
     */
    it('should read the search query from URL queryParamMap', () => {
      productServiceSpy.getProducts.and.returnValue(of(createMockResponse()));

      /** @description Emit query param with search term before component init */
      queryParamMap$.next(makeQueryParamMap('Aleppo soap'));

      createComponent(true);

      expect(component.searchQuery()).toBe('Aleppo soap');
      expect(component.originalSearchQuery()).toBe('Aleppo soap');
    });

    /**
     * @description Verifies the search query updates when queryParams change
     */
    it('should update searchQuery when queryParamMap changes', () => {
      productServiceSpy.getProducts.and.returnValue(of(createMockResponse()));

      queryParamMap$.next(makeQueryParamMap('initial'));
      createComponent(true);

      expect(component.searchQuery()).toBe('initial');

      /** @description Simulate navigation to a new search term */
      queryParamMap$.next(makeQueryParamMap('updated query'));
      fixture.detectChanges();

      expect(component.searchQuery()).toBe('updated query');
    });

    /**
     * @description Verifies the component handles empty query gracefully
     */
    it('should handle empty query parameter gracefully', () => {
      queryParamMap$.next(makeQueryParamMap(''));
      createComponent(true);

      expect(component.searchQuery()).toBe('');
      expect(productServiceSpy.getProducts).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 3. Calls ProductService with search query
  // =========================================================================

  describe('ProductService Integration', () => {
    /**
     * @description Verifies ProductService.getProducts is called with the correct search param
     */
    it('should call ProductService.getProducts with search query', () => {
      productServiceSpy.getProducts.and.returnValue(of(createMockResponse()));
      queryParamMap$.next(makeQueryParamMap('Damascus steel'));

      createComponent(true);

      expect(productServiceSpy.getProducts).toHaveBeenCalled();

      const calledArgs =
        productServiceSpy.getProducts.calls.mostRecent().args[0];
      expect(calledArgs.search).toBe('Damascus steel');
    });

    /**
     * @description Verifies pagination params are passed to the service
     */
    it('should pass pagination params to ProductService', () => {
      productServiceSpy.getProducts.and.returnValue(of(createMockResponse()));
      queryParamMap$.next(makeQueryParamMap('test'));

      createComponent(true);

      const calledArgs =
        productServiceSpy.getProducts.calls.mostRecent().args[0];
      expect(calledArgs.page).toBe(1);
      expect(calledArgs.limit).toBe(20);
    });

    /**
     * @description Verifies the service is NOT called when query is empty
     */
    it('should not call ProductService when query is empty', () => {
      queryParamMap$.next(makeQueryParamMap(''));
      createComponent(true);

      expect(productServiceSpy.getProducts).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 4. Displays product grid with results
  // =========================================================================

  describe('Product Grid Display', () => {
    /**
     * @description Verifies product cards render after data loads
     */
    it('should render product cards when results are available', () => {
      const response = createMockResponse(4);
      productServiceSpy.getProducts.and.returnValue(of(response));
      queryParamMap$.next(makeQueryParamMap('test'));

      createComponent(true);

      const compiled: HTMLElement = fixture.nativeElement;
      const productCards = compiled.querySelectorAll('app-product-card');

      expect(productCards.length).toBe(4);
    });

    /**
     * @description Verifies the products computed signal transforms API data
     */
    it('should populate products computed signal from API response', () => {
      const response = createMockResponse(3);
      productServiceSpy.getProducts.and.returnValue(of(response));
      queryParamMap$.next(makeQueryParamMap('test'));

      createComponent(true);

      expect(component.products().length).toBe(3);
      expect(component.products()[0].name).toBe('Product 1');
      expect(component.products()[0].slug).toBe('product-1');
    });

    /**
     * @description Verifies the search results grid container is present
     */
    it('should render the search-results-grid container', () => {
      productServiceSpy.getProducts.and.returnValue(of(createMockResponse()));
      queryParamMap$.next(makeQueryParamMap('test'));

      createComponent(true);

      const compiled: HTMLElement = fixture.nativeElement;
      const grid = compiled.querySelector('.search-results-grid');

      expect(grid).toBeTruthy();
    });
  });

  // =========================================================================
  // 5. Shows "Search results for X" with result count
  // =========================================================================

  describe('Results Header', () => {
    /**
     * @description Verifies the results header shows the search query
     */
    it('should display "Search Results for" with the search query', () => {
      productServiceSpy.getProducts.and.returnValue(
        of(createMockResponse(5))
      );
      queryParamMap$.next(makeQueryParamMap('Aleppo soap'));

      createComponent(true);

      const compiled: HTMLElement = fixture.nativeElement;
      const heading = compiled.querySelector('h1');

      expect(heading).toBeTruthy();
      expect(heading!.textContent).toContain('Search Results for');
      expect(heading!.textContent).toContain('Aleppo soap');
    });

    /**
     * @description Verifies the total results count is displayed
     */
    it('should display the total result count', () => {
      const response = createMockResponse(3, { total: 42 });
      productServiceSpy.getProducts.and.returnValue(of(response));
      queryParamMap$.next(makeQueryParamMap('test'));

      createComponent(true);

      expect(component.totalResults()).toBe(42);

      const compiled: HTMLElement = fixture.nativeElement;
      const resultCountText = compiled.textContent;

      expect(resultCountText).toContain('42');
      expect(resultCountText).toContain('products found');
    });

    /**
     * @description Verifies the hasResults computed signal returns true when products exist
     */
    it('should set hasResults to true when products are returned', () => {
      productServiceSpy.getProducts.and.returnValue(
        of(createMockResponse(3))
      );
      queryParamMap$.next(makeQueryParamMap('test'));

      createComponent(true);

      expect(component.hasResults()).toBeTrue();
    });
  });

  // =========================================================================
  // 6. Handles empty results (no products found)
  // =========================================================================

  describe('Empty Results', () => {
    /**
     * @description Verifies empty state renders when no products are returned
     */
    it('should show "No products found" when API returns empty data', () => {
      const emptyResponse: ProductListResponse = {
        data: [],
        meta: createMockMeta({ total: 0, totalPages: 0 }),
      };
      productServiceSpy.getProducts.and.returnValue(of(emptyResponse));
      queryParamMap$.next(makeQueryParamMap('nonexistent product'));

      createComponent(true);

      const compiled: HTMLElement = fixture.nativeElement;

      expect(component.hasResults()).toBeFalse();
      expect(compiled.textContent).toContain('No products found');
    });

    /**
     * @description Verifies no product cards render in empty state
     */
    it('should not render any product cards when results are empty', () => {
      const emptyResponse: ProductListResponse = {
        data: [],
        meta: createMockMeta({ total: 0, totalPages: 0 }),
      };
      productServiceSpy.getProducts.and.returnValue(of(emptyResponse));
      queryParamMap$.next(makeQueryParamMap('nonexistent'));

      createComponent(true);

      const compiled: HTMLElement = fixture.nativeElement;
      const productCards = compiled.querySelectorAll('app-product-card');

      expect(productCards.length).toBe(0);
    });

    /**
     * @description Verifies totalResults is 0 for empty results
     */
    it('should have totalResults equal to 0 for empty response', () => {
      const emptyResponse: ProductListResponse = {
        data: [],
        meta: createMockMeta({ total: 0, totalPages: 0 }),
      };
      productServiceSpy.getProducts.and.returnValue(of(emptyResponse));
      queryParamMap$.next(makeQueryParamMap('xyz'));

      createComponent(true);

      expect(component.totalResults()).toBe(0);
    });
  });

  // =========================================================================
  // 7. Handles loading state
  // =========================================================================

  describe('Loading State', () => {
    /**
     * @description Verifies loading spinner is visible while API request is pending
     */
    it('should show loading state while API request is pending', () => {
      /** @description Use Subject to keep the Observable pending */
      const pending$ = new Subject<ProductListResponse>();
      productServiceSpy.getProducts.and.returnValue(
        pending$.asObservable()
      );
      queryParamMap$.next(makeQueryParamMap('loading test'));

      createComponent(true);

      expect(component.isLoading()).toBeTrue();

      const compiled: HTMLElement = fixture.nativeElement;
      const spinner = compiled.querySelector('mat-spinner');

      expect(spinner).toBeTruthy();
    });

    /**
     * @description Verifies loading state clears after data arrives
     */
    it('should set isLoading to false after data loads successfully', () => {
      productServiceSpy.getProducts.and.returnValue(
        of(createMockResponse())
      );
      queryParamMap$.next(makeQueryParamMap('test'));

      createComponent(true);

      expect(component.isLoading()).toBeFalse();
    });

    /**
     * @description Verifies loading text is displayed alongside spinner
     */
    it('should display loading text while request is pending', () => {
      const pending$ = new Subject<ProductListResponse>();
      productServiceSpy.getProducts.and.returnValue(
        pending$.asObservable()
      );
      queryParamMap$.next(makeQueryParamMap('loading'));

      createComponent(true);

      const compiled: HTMLElement = fixture.nativeElement;

      expect(compiled.textContent).toContain('Searching Syrian products');
    });
  });

  // =========================================================================
  // 8. Handles error state
  // =========================================================================

  describe('Error State', () => {
    /**
     * @description Verifies isLoading becomes false on API error
     */
    it('should set isLoading to false after an API error', () => {
      productServiceSpy.getProducts.and.returnValue(
        throwError(() => new Error('Server unavailable'))
      );
      queryParamMap$.next(makeQueryParamMap('error test'));

      createComponent(true);

      expect(component.isLoading()).toBeFalse();
    });

    /**
     * @description Verifies productListingResponse remains null on error
     */
    it('should leave productListingResponse as null on API error', () => {
      productServiceSpy.getProducts.and.returnValue(
        throwError(() => new Error('Network error'))
      );
      queryParamMap$.next(makeQueryParamMap('error'));

      createComponent(true);

      expect(component.productListingResponse()).toBeNull();
    });

    /**
     * @description Verifies no product cards render when API fails
     */
    it('should render no product cards on API failure', () => {
      productServiceSpy.getProducts.and.returnValue(
        throwError(() => new Error('API down'))
      );
      queryParamMap$.next(makeQueryParamMap('fail'));

      createComponent(true);

      const compiled: HTMLElement = fixture.nativeElement;
      const productCards = compiled.querySelectorAll('app-product-card');

      expect(productCards.length).toBe(0);
    });

    /**
     * @description Verifies products computed signal returns empty array on error
     */
    it('should have empty products array when API returns an error', () => {
      productServiceSpy.getProducts.and.returnValue(
        throwError(() => ({ error: { message: 'Error' } }))
      );
      queryParamMap$.next(makeQueryParamMap('fail'));

      createComponent(true);

      expect(component.products().length).toBe(0);
    });
  });

  // =========================================================================
  // 9. Bilingual support (en/ar)
  // =========================================================================

  describe('Bilingual Support', () => {
    /**
     * @description Verifies sort options contain both English and Arabic labels
     */
    it('should have sort options with both English and Arabic labels', () => {
      createComponent(false);

      expect(component.sortOptions.length).toBeGreaterThan(0);

      const firstOption = component.sortOptions[0];
      expect(firstOption.label).toBeTruthy();
      expect(firstOption.labelAr).toBeTruthy();
    });

    /**
     * @description Verifies the searchQuery preserves Arabic input
     */
    it('should preserve Arabic search query from URL params', () => {
      productServiceSpy.getProducts.and.returnValue(
        of(createMockResponse())
      );
      queryParamMap$.next(makeQueryParamMap('صابون حلبي'));

      createComponent(true);

      expect(component.searchQuery()).toBe('صابون حلبي');
      expect(component.originalSearchQuery()).toBe('صابون حلبي');
    });

    /**
     * @description Verifies the breadcrumb includes the Arabic search query
     */
    it('should include Arabic query in breadcrumb', () => {
      productServiceSpy.getProducts.and.returnValue(
        of(createMockResponse())
      );
      queryParamMap$.next(makeQueryParamMap('فولاذ دمشقي'));

      createComponent(true);

      const breadcrumbs = component.getBreadcrumb();

      expect(breadcrumbs).toContain('"فولاذ دمشقي"');
    });

    /**
     * @description Verifies sort options include Arabic-specific sort labels
     */
    it('should provide Arabic sort label for newest option', () => {
      createComponent(false);

      const newestOption = component.sortOptions.find(
        (opt) => opt.value === 'newest'
      );

      expect(newestOption).toBeTruthy();
      expect(newestOption!.labelAr).toBe('الأحدث');
    });
  });

  // =========================================================================
  // Additional: Sorting and navigation
  // =========================================================================

  describe('Sorting and Navigation', () => {
    /**
     * @description Verifies sort change triggers a new search
     */
    it('should reload search results when sort changes', () => {
      productServiceSpy.getProducts.and.returnValue(
        of(createMockResponse())
      );
      queryParamMap$.next(makeQueryParamMap('test'));

      createComponent(true);

      const callCountBefore = productServiceSpy.getProducts.calls.count();

      component.onSortChange('price_asc');

      expect(
        productServiceSpy.getProducts.calls.count()
      ).toBeGreaterThan(callCountBefore);
      expect(component.currentSort()).toBe('price_asc');
    });

    /**
     * @description Verifies performSearch updates URL via router.navigate
     */
    it('should call router.navigate when performSearch is invoked', () => {
      productServiceSpy.getProducts.and.returnValue(
        of(createMockResponse())
      );
      queryParamMap$.next(makeQueryParamMap('initial'));

      createComponent(true);

      component.performSearch('new query');

      expect(navigateSpy).toHaveBeenCalledWith(
        [],
        jasmine.objectContaining({
          queryParams: jasmine.objectContaining({ q: 'new query' }),
          queryParamsHandling: 'merge',
        })
      );
    });

    /**
     * @description Verifies page resets to 1 when a new search is performed
     */
    it('should reset page to 1 when performing a new search', () => {
      productServiceSpy.getProducts.and.returnValue(
        of(createMockResponse())
      );
      queryParamMap$.next(makeQueryParamMap('initial'));

      createComponent(true);

      component.currentPage.set(3);
      component.performSearch('new query');

      expect(component.currentPage()).toBe(1);
    });
  });

  // =========================================================================
  // Additional: Filter management
  // =========================================================================

  describe('Filter Management', () => {
    /**
     * @description Verifies clearAllFilters resets all filter signals
     */
    it('should reset all filters when clearAllFilters is called', () => {
      productServiceSpy.getProducts.and.returnValue(
        of(createMockResponse())
      );
      queryParamMap$.next(makeQueryParamMap('test'));

      createComponent(true);

      /** @description Set some filters first */
      component.selectedRatings.set([5, 4]);
      component.onlyAuthentic.set(true);
      component.onlyFreeShipping.set(true);

      component.clearAllFilters();

      expect(component.selectedRatings().length).toBe(0);
      expect(component.onlyAuthentic()).toBeFalse();
      expect(component.onlyFreeShipping()).toBeFalse();
      expect(component.priceRange()).toEqual({ min: 0, max: 1000000 });
    });

    /**
     * @description Verifies getActiveFiltersCount returns correct count
     */
    it('should return correct active filters count', () => {
      createComponent(false);

      expect(component.getActiveFiltersCount()).toBe(0);

      component.selectedRatings.set([5]);
      component.onlyAuthentic.set(true);
      component.onlyOnSale.set(true);

      expect(component.getActiveFiltersCount()).toBe(3);
    });
  });
});
