/**
 * @file product-list-page.component.spec.ts
 * @description Unit tests for ProductListPageComponent.
 * Validates loading/error/empty/data states, service integration,
 * query param routing, and pagination delegation.
 *
 * Child components (ProductCardComponent, ProductSkeletonComponent,
 * ProductsPaginationComponent) are replaced with lightweight stubs to
 * isolate the page component logic and avoid RouterLink dependency issues.
 *
 * @swagger
 * tags:
 *   - name: ProductListPageComponent Tests
 *     description: Verifies the smart product listing page orchestration
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
} from '@angular/core';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, throwError, Subject, BehaviorSubject } from 'rxjs';
import { ProductListPageComponent } from './product-list-page.component';
import { ProductService } from '../../services/product.service';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { ProductSkeletonComponent } from '../../components/product-skeleton/product-skeleton.component';
import { ProductsPaginationComponent } from '../../components/pagination/products-pagination.component';
import {
  ProductListItem,
  ProductListMeta,
  ProductListResponse,
} from '../../models/product-list.interface';

// ---------------------------------------------------------------------------
// Stub components to replace real children and avoid RouterLink issues
// ---------------------------------------------------------------------------

/**
 * @description Stub for ProductCardComponent to prevent RouterLink rendering
 */
@Component({
  selector: 'app-product-card',
  standalone: true,
  template: '<div class="stub-product-card"></div>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class StubProductCardComponent {
  product = input.required<ProductListItem>();
  language = input<'en' | 'ar'>('en');
  addToCart = output<ProductListItem>();
}

/**
 * @description Stub for ProductSkeletonComponent
 */
@Component({
  selector: 'app-product-skeleton',
  standalone: true,
  template: '<div class="stub-skeleton"></div>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class StubProductSkeletonComponent {}

/**
 * @description Stub for ProductsPaginationComponent
 */
@Component({
  selector: 'app-products-pagination',
  standalone: true,
  template: '<div class="stub-pagination"></div>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class StubProductsPaginationComponent {
  meta = input.required<ProductListMeta>();
  language = input<'en' | 'ar'>('en');
  pageChange = output<number>();
  limitChange = output<number>();
}

// ---------------------------------------------------------------------------
// Mock data factories
// ---------------------------------------------------------------------------

/**
 * @description Creates a mock ProductListItem with sensible defaults
 * @param overrides - Partial fields to override
 * @returns Complete ProductListItem
 */
function createMockProduct(
  overrides: Partial<ProductListItem> = {}
): ProductListItem {
  return {
    id: 1,
    slug: 'test-product',
    nameEn: 'Test Product',
    nameAr: 'منتج اختباري',
    mainImage: 'https://example.com/image.jpg',
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
 * @description Creates a mock ProductListMeta with sensible defaults
 * @param overrides - Partial fields to override
 * @returns Complete ProductListMeta
 */
function createMockMeta(
  overrides: Partial<ProductListMeta> = {}
): ProductListMeta {
  return {
    total: 100,
    page: 1,
    limit: 20,
    totalPages: 5,
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
      createMockProduct({
        id: i,
        slug: `product-${i}`,
        nameEn: `Product ${i}`,
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

describe('ProductListPageComponent', () => {
  let component: ProductListPageComponent;
  let fixture: ComponentFixture<ProductListPageComponent>;
  let productServiceSpy: jasmine.SpyObj<ProductService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let queryParams$: BehaviorSubject<Record<string, string>>;

  beforeEach(async () => {
    productServiceSpy = jasmine.createSpyObj('ProductService', [
      'getProducts',
    ]);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    /** @description BehaviorSubject to simulate ActivatedRoute queryParams */
    queryParams$ = new BehaviorSubject<Record<string, string>>({
      page: '1',
      limit: '20',
    });

    await TestBed.configureTestingModule({
      imports: [ProductListPageComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: ProductService, useValue: productServiceSpy },
        { provide: Router, useValue: routerSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: queryParams$.asObservable(),
            snapshot: { queryParams: { page: '1', limit: '20' } },
          },
        },
      ],
    })
      .overrideComponent(ProductListPageComponent, {
        remove: {
          imports: [
            ProductCardComponent,
            ProductSkeletonComponent,
            ProductsPaginationComponent,
          ],
        },
        add: {
          imports: [
            StubProductCardComponent,
            StubProductSkeletonComponent,
            StubProductsPaginationComponent,
          ],
        },
      })
      .compileComponents();
  });

  /**
   * @description Creates the component fixture and optionally triggers change detection
   * @param autoInit - Whether to call detectChanges (default: false)
   */
  function createComponent(autoInit: boolean = false): void {
    fixture = TestBed.createComponent(ProductListPageComponent);
    component = fixture.componentInstance;
    if (autoInit) {
      fixture.detectChanges();
    }
  }

  /**
   * @description Verifies the component instantiates successfully
   */
  it('should create', () => {
    productServiceSpy.getProducts.and.returnValue(
      of(createMockResponse())
    );
    createComponent(true);

    expect(component).toBeTruthy();
  });

  describe('Loading State', () => {
    /**
     * @description Verifies loading skeletons appear before API response arrives
     */
    it('should show loading skeletons initially', () => {
      /** @description Use a Subject to keep the Observable pending (no emission) */
      const pending$ = new Subject<ProductListResponse>();
      productServiceSpy.getProducts.and.returnValue(
        pending$.asObservable()
      );

      createComponent(true);

      const compiled: HTMLElement = fixture.nativeElement;
      const skeletons = compiled.querySelectorAll('app-product-skeleton');

      expect(component.loading()).toBeTrue();
      expect(skeletons.length).toBe(component.currentLimit());
    });

    /**
     * @description Verifies loading signal becomes false after data loads
     */
    it('should set loading to false after data loads', () => {
      productServiceSpy.getProducts.and.returnValue(
        of(createMockResponse())
      );
      createComponent(true);

      expect(component.loading()).toBeFalse();
    });
  });

  describe('Data State', () => {
    /**
     * @description Verifies product cards render after data loads successfully
     */
    it('should render product cards after data loads', () => {
      const response = createMockResponse(3);
      productServiceSpy.getProducts.and.returnValue(of(response));

      createComponent(true);

      const compiled: HTMLElement = fixture.nativeElement;
      const productCards = compiled.querySelectorAll('app-product-card');

      expect(productCards.length).toBe(3);
    });

    /**
     * @description Verifies the products signal holds the API response data
     */
    it('should populate products signal from API response', () => {
      const response = createMockResponse(5);
      productServiceSpy.getProducts.and.returnValue(of(response));

      createComponent(true);

      expect(component.products().length).toBe(5);
      expect(component.products()[0].nameEn).toBe('Product 1');
    });

    /**
     * @description Verifies the meta signal holds pagination metadata
     */
    it('should populate meta signal from API response', () => {
      const response = createMockResponse(3, {
        total: 100,
        page: 1,
        totalPages: 5,
      });
      productServiceSpy.getProducts.and.returnValue(of(response));

      createComponent(true);

      expect(component.meta()?.total).toBe(100);
      expect(component.meta()?.totalPages).toBe(5);
    });
  });

  describe('Empty State', () => {
    /**
     * @description Verifies empty state renders when no products are returned
     */
    it('should show empty state when no products returned', () => {
      const emptyResponse: ProductListResponse = {
        data: [],
        meta: createMockMeta({ total: 0, totalPages: 0 }),
      };
      productServiceSpy.getProducts.and.returnValue(of(emptyResponse));

      createComponent(true);

      const compiled: HTMLElement = fixture.nativeElement;
      const emptyEl = compiled.querySelector(
        '.product-list-page__empty'
      );
      const productCards =
        compiled.querySelectorAll('app-product-card');

      expect(emptyEl).toBeTruthy();
      expect(productCards.length).toBe(0);
    });

    /**
     * @description Verifies empty state message text
     */
    it('should display "No products found" in empty state', () => {
      const emptyResponse: ProductListResponse = {
        data: [],
        meta: createMockMeta({ total: 0, totalPages: 0 }),
      };
      productServiceSpy.getProducts.and.returnValue(of(emptyResponse));

      createComponent(true);

      const compiled: HTMLElement = fixture.nativeElement;
      const emptyTitle = compiled.querySelector(
        '.product-list-page__empty-title'
      );

      expect(emptyTitle?.textContent?.trim()).toBe('No products found');
    });
  });

  describe('Error State', () => {
    /**
     * @description Verifies error state renders on API failure
     */
    it('should show error state on API failure', () => {
      const errorResponse = {
        error: { message: 'Server unavailable' },
      };
      productServiceSpy.getProducts.and.returnValue(
        throwError(() => errorResponse)
      );

      createComponent(true);

      const compiled: HTMLElement = fixture.nativeElement;
      const errorEl = compiled.querySelector(
        '.product-list-page__error'
      );

      expect(errorEl).toBeTruthy();
      expect(component.error()).toBe('Server unavailable');
    });

    /**
     * @description Verifies the error signal holds the error message
     */
    it('should set error signal with message from API', () => {
      const errorResponse = {
        error: { message: 'Internal server error' },
      };
      productServiceSpy.getProducts.and.returnValue(
        throwError(() => errorResponse)
      );

      createComponent(true);

      expect(component.error()).toBe('Internal server error');
      expect(component.loading()).toBeFalse();
    });

    /**
     * @description Verifies fallback error message when API provides no message
     */
    it('should use fallback error message when API provides none', () => {
      productServiceSpy.getProducts.and.returnValue(
        throwError(() => ({}))
      );

      createComponent(true);

      expect(component.error()).toBe('Failed to load products');
    });

    /**
     * @description Verifies error state displays the error title text
     */
    it('should display error title matching the error message', () => {
      const errorResponse = {
        error: { message: 'Connection timeout' },
      };
      productServiceSpy.getProducts.and.returnValue(
        throwError(() => errorResponse)
      );

      createComponent(true);

      const compiled: HTMLElement = fixture.nativeElement;
      const errorTitle = compiled.querySelector(
        '.product-list-page__error-title'
      );

      expect(errorTitle?.textContent?.trim()).toBe('Connection timeout');
    });
  });

  describe('Service Integration', () => {
    /**
     * @description Verifies ProductService.getProducts is called on init
     */
    it('should call ProductService.getProducts on init', () => {
      productServiceSpy.getProducts.and.returnValue(
        of(createMockResponse())
      );

      createComponent(true);

      expect(productServiceSpy.getProducts).toHaveBeenCalled();
    });

    /**
     * @description Verifies the service is called with params derived from route queryParams
     */
    it('should call getProducts with params from route queryParams', () => {
      productServiceSpy.getProducts.and.returnValue(
        of(createMockResponse())
      );

      createComponent(true);

      expect(productServiceSpy.getProducts).toHaveBeenCalledWith(
        jasmine.objectContaining({
          page: 1,
          limit: 20,
          sortBy: 'newest',
        })
      );
    });

    /**
     * @description Verifies the service is re-called when queryParams change
     */
    it('should re-call getProducts when queryParams change', () => {
      productServiceSpy.getProducts.and.returnValue(
        of(createMockResponse())
      );

      createComponent(true);

      expect(productServiceSpy.getProducts).toHaveBeenCalledTimes(1);

      /** @description Emit new query params to simulate page navigation */
      queryParams$.next({ page: '2', limit: '20' });

      expect(productServiceSpy.getProducts).toHaveBeenCalledTimes(2);
      expect(productServiceSpy.getProducts).toHaveBeenCalledWith(
        jasmine.objectContaining({
          page: 2,
          limit: 20,
          sortBy: 'newest',
        })
      );
    });
  });

  describe('Navigation', () => {
    /**
     * @description Verifies router.navigate is called with page query param on page change
     */
    it('should navigate with page query param on page change', () => {
      productServiceSpy.getProducts.and.returnValue(
        of(createMockResponse())
      );

      createComponent(true);

      component.onPageChange(3);

      expect(routerSpy.navigate).toHaveBeenCalledWith([], {
        relativeTo: jasmine.anything(),
        queryParams: { page: 3 },
        queryParamsHandling: 'merge',
      });
    });

    /**
     * @description Verifies router.navigate on limit change resets to page 1
     */
    it('should navigate with page 1 and new limit on limit change', () => {
      productServiceSpy.getProducts.and.returnValue(
        of(createMockResponse())
      );

      createComponent(true);

      component.onLimitChange(40);

      expect(routerSpy.navigate).toHaveBeenCalledWith([], {
        relativeTo: jasmine.anything(),
        queryParams: { page: 1, limit: 40 },
        queryParamsHandling: 'merge',
      });
    });

    /**
     * @description Verifies router.navigate on sort change includes sort and resets page
     */
    it('should navigate with sort and page 1 on sort change', () => {
      productServiceSpy.getProducts.and.returnValue(
        of(createMockResponse())
      );

      createComponent(true);

      component.onSortChange('price_desc');

      expect(routerSpy.navigate).toHaveBeenCalledWith([], {
        relativeTo: jasmine.anything(),
        queryParams: { sort: 'price_desc', page: 1 },
        queryParamsHandling: 'merge',
      });
    });
  });

  describe('Retry', () => {
    /**
     * @description Verifies retryLoad re-calls the service with current pagination state
     */
    it('should re-call getProducts on retryLoad', () => {
      productServiceSpy.getProducts.and.returnValue(
        throwError(() => ({ error: { message: 'Error' } }))
      );

      createComponent(true);

      expect(productServiceSpy.getProducts).toHaveBeenCalledTimes(1);

      /** @description Switch the mock to return success for retry */
      productServiceSpy.getProducts.and.returnValue(
        of(createMockResponse())
      );

      component.retryLoad();

      expect(productServiceSpy.getProducts).toHaveBeenCalledTimes(2);
    });
  });

  describe('View Mode', () => {
    /**
     * @description Verifies the view mode toggles between grid and list
     */
    it('should toggle view mode from grid to list', () => {
      productServiceSpy.getProducts.and.returnValue(
        of(createMockResponse())
      );

      createComponent(true);

      expect(component.viewMode()).toBe('grid');

      component.toggleViewMode();

      expect(component.viewMode()).toBe('list');
    });

    /**
     * @description Verifies the view mode toggles back from list to grid
     */
    it('should toggle view mode from list to grid', () => {
      productServiceSpy.getProducts.and.returnValue(
        of(createMockResponse())
      );

      createComponent(true);

      component.toggleViewMode();
      component.toggleViewMode();

      expect(component.viewMode()).toBe('grid');
    });
  });

  describe('Localization', () => {
    /**
     * @description Verifies English page title
     */
    it('should display "All Products" as page title in English', () => {
      productServiceSpy.getProducts.and.returnValue(
        of(createMockResponse())
      );

      createComponent(true);

      expect(component.pageTitle).toBe('All Products');
    });

    /**
     * @description Verifies English empty message
     */
    it('should return "No products found" for English empty message', () => {
      productServiceSpy.getProducts.and.returnValue(
        of(createMockResponse())
      );

      createComponent(true);

      expect(component.emptyMessage).toBe('No products found');
    });
  });
});
