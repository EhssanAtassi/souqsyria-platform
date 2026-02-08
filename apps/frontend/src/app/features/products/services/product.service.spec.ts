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
import {
  ProductDetailResponse,
  SearchSuggestionItem,
} from '../models/product-detail.interface';
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

  describe('getProductBySlug', () => {
    /** @description Mock product detail response for slug-based lookups */
    const mockDetailResponse: ProductDetailResponse = {
      id: 1,
      slug: 'damascus-knife',
      nameEn: 'Damascus Knife',
      nameAr: '\u0633\u0643\u064a\u0646 \u062f\u0645\u0634\u0642\u064a',
      sku: 'DK-001',
      category: { id: 1, nameEn: 'Knives', nameAr: '\u0633\u0643\u0627\u0643\u064a\u0646', slug: 'knives' },
      manufacturer: null,
      vendor: null,
      pricing: { basePrice: 100, discountPrice: 80, currency: 'USD' },
      images: [{ id: 1, imageUrl: '/img.jpg', sortOrder: 0 }],
      descriptions: [{ language: 'en', shortDescription: 'Short', fullDescription: 'Full' }],
      variants: [],
      attributes: [],
      stockStatus: 'in_stock',
      totalStock: 10,
      relatedProducts: [],
    };

    /**
     * @description Verifies getProductBySlug calls GET with correct URL
     */
    it('should call GET with apiUrl/slug', () => {
      const slug = 'damascus-knife';

      service.getProductBySlug(slug).subscribe((response) => {
        expect(response).toEqual(mockDetailResponse);
      });

      const req = httpController.expectOne(`${API_URL}/${slug}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockDetailResponse);
    });

    /**
     * @description Verifies getProductBySlug propagates HTTP errors
     */
    it('should propagate HTTP errors for slug lookup', () => {
      const slug = 'nonexistent';

      service.getProductBySlug(slug).subscribe({
        next: () => fail('Expected an error'),
        error: (error) => {
          expect(error.status).toBe(404);
        },
      });

      const req = httpController.expectOne(`${API_URL}/${slug}`);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });

    /**
     * @description Verifies the response is typed as ProductDetailResponse
     */
    it('should return typed ProductDetailResponse', () => {
      const slug = 'damascus-knife';

      service.getProductBySlug(slug).subscribe((response) => {
        expect(response.id).toBe(1);
        expect(response.slug).toBe('damascus-knife');
        expect(response.nameEn).toBe('Damascus Knife');
        expect(response.pricing?.basePrice).toBe(100);
      });

      const req = httpController.expectOne(`${API_URL}/${slug}`);
      req.flush(mockDetailResponse);
    });
  });

  describe('getSearchSuggestions', () => {
    /** @description Mock suggestion items for search autocomplete */
    const mockSuggestions: { suggestions: SearchSuggestionItem[] } = {
      suggestions: [
        { text: 'Damascus Knife', textAr: '\u0633\u0643\u064a\u0646 \u062f\u0645\u0634\u0642\u064a', type: 'product', slug: 'damascus-knife' },
        { text: 'Damascus Steel', textAr: '\u0641\u0648\u0644\u0627\u0630 \u062f\u0645\u0634\u0642\u064a', type: 'category', slug: null },
      ],
    };

    /**
     * @description Verifies getSearchSuggestions calls GET with correct URL and query param
     */
    it('should call GET with apiUrl/suggestions and q param', () => {
      const query = 'damascus';

      service.getSearchSuggestions(query).subscribe((response) => {
        expect(response).toEqual(mockSuggestions);
      });

      const req = httpController.expectOne(
        (request) =>
          request.url === `${API_URL}/suggestions` &&
          request.params.get('q') === 'damascus'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockSuggestions);
    });

    /**
     * @description Verifies the query param is correctly encoded
     */
    it('should pass query string as q parameter', () => {
      const query = 'test query';

      service.getSearchSuggestions(query).subscribe();

      const req = httpController.expectOne(
        (request) =>
          request.url === `${API_URL}/suggestions` &&
          request.params.get('q') === 'test query'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ suggestions: [] });
    });

    /**
     * @description Verifies getSearchSuggestions propagates HTTP errors
     */
    it('should propagate HTTP errors for suggestions', () => {
      service.getSearchSuggestions('test').subscribe({
        next: () => fail('Expected an error'),
        error: (error) => {
          expect(error.status).toBe(500);
        },
      });

      const req = httpController.expectOne(
        (request) => request.url === `${API_URL}/suggestions`
      );
      req.flush('Error', { status: 500, statusText: 'Server Error' });
    });
  });
});
