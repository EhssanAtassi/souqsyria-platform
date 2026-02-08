/**
 * @file product.service.spec.ts
 * @description Unit tests for ProductService.
 * Validates HTTP GET calls to the products API with correct URL and query params.
 *
 * @swagger
 * tags:
 *   - name: ProductService Tests
 *     description: Verifies the HTTP client wrapper for public product catalog API
 */
import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ProductService, ProductQueryParams } from './product.service';
import {
  ProductListResponse,
  ProductListItem,
  ProductListMeta,
} from '../models/product-list.interface';
import { environment } from '../../../../environments/environment';

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
 * @description Creates a mock ProductListResponse
 * @param dataOverrides - Partial product fields applied to each mock product
 * @param metaOverrides - Partial meta fields
 * @returns Complete ProductListResponse
 */
function createMockResponse(
  dataOverrides: Partial<ProductListItem>[] = [{}],
  metaOverrides: Partial<ProductListMeta> = {}
): ProductListResponse {
  return {
    data: dataOverrides.map((o, i) =>
      createMockProduct({ id: i + 1, slug: `product-${i + 1}`, ...o })
    ),
    meta: createMockMeta(metaOverrides),
  };
}

describe('ProductService', () => {
  let service: ProductService;
  let httpController: HttpTestingController;

  /** @description Expected API base URL from environment config */
  const API_URL = environment.productApiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ProductService,
      ],
    });

    service = TestBed.inject(ProductService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    /** @description Verify no outstanding HTTP requests after each test */
    httpController.verify();
  });

  /**
   * @description Verifies that the service is created via Angular DI
   */
  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getProducts', () => {
    /**
     * @description Verifies the service calls the correct API URL
     */
    it('should call API with correct URL', () => {
      const mockResponse = createMockResponse();

      service.getProducts().subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpController.expectOne(API_URL);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    /**
     * @description Verifies page and limit are sent as query parameters
     */
    it('should pass page and limit as query params', () => {
      const params: ProductQueryParams = { page: 2, limit: 40 };
      const mockResponse = createMockResponse(
        [{}],
        { page: 2, limit: 40 }
      );

      service.getProducts(params).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpController.expectOne(
        (request) =>
          request.url === API_URL &&
          request.params.get('page') === '2' &&
          request.params.get('limit') === '40'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    /**
     * @description Verifies sortBy is sent as a query parameter
     */
    it('should pass sortBy as query param', () => {
      const params: ProductQueryParams = { sortBy: 'price_desc' };
      const mockResponse = createMockResponse();

      service.getProducts(params).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpController.expectOne(
        (request) =>
          request.url === API_URL &&
          request.params.get('sortBy') === 'price_desc'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    /**
     * @description Verifies that empty params result in no query parameters
     */
    it('should handle empty params with no query params sent', () => {
      const mockResponse = createMockResponse();

      service.getProducts({}).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpController.expectOne(API_URL);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys().length).toBe(0);
      req.flush(mockResponse);
    });

    /**
     * @description Verifies search, categoryId, minPrice, maxPrice query params
     */
    it('should pass search and filter params as query params', () => {
      const params: ProductQueryParams = {
        search: 'damascus',
        categoryId: 5,
        minPrice: 1000,
        maxPrice: 5000,
      };
      const mockResponse = createMockResponse();

      service.getProducts(params).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpController.expectOne(
        (request) =>
          request.url === API_URL &&
          request.params.get('search') === 'damascus' &&
          request.params.get('categoryId') === '5' &&
          request.params.get('minPrice') === '1000' &&
          request.params.get('maxPrice') === '5000'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    /**
     * @description Verifies the observable propagates HTTP errors
     */
    it('should propagate HTTP errors to subscribers', () => {
      const errorMessage = 'Server Error';

      service.getProducts().subscribe({
        next: () => fail('Expected an error, not a success response'),
        error: (error) => {
          expect(error.status).toBe(500);
        },
      });

      const req = httpController.expectOne(API_URL);
      req.flush(errorMessage, { status: 500, statusText: 'Server Error' });
    });
  });
});
