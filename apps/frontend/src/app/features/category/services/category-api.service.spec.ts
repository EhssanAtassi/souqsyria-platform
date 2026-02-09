/**
 * @file category-api.service.spec.ts
 * @description Unit tests for the CategoryApiService
 *
 * TEST COVERAGE:
 * - getTree() HTTP call to /categories/tree
 * - getFeatured(limit) HTTP call to /categories/featured with limit parameter
 * - Correct use of environment apiUrl
 * - Type-safe response handling
 *
 * @author SouqSyria Development Team
 * @since 2026-02-07
 */

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { CategoryApiService } from './category-api.service';
import { CategoryTreeResponse, FeaturedCategoriesResponse, CategoryTreeNode, FeaturedCategory } from '../models/category-tree.interface';
import { environment } from '../../../../environments/environment';

// =============================================================================
// TEST DATA
// =============================================================================

/** Mock category tree response matching backend API shape */
const MOCK_TREE_RESPONSE: CategoryTreeResponse = {
  data: [
    {
      id: 1,
      name: 'Electronics',
      nameAr: '\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0627\u062A',
      slug: 'electronics',
      icon: 'devices',
      image: 'electronics.jpg',
      children: [
        {
          id: 10,
          name: 'Mobile Phones',
          nameAr: '\u0647\u0648\u0627\u062A\u0641 \u0645\u062D\u0645\u0648\u0644\u0629',
          slug: 'mobile-phones',
          icon: 'smartphone',
          image: 'phones.jpg',
          children: [],
        },
      ],
    },
    {
      id: 2,
      name: 'Fashion',
      nameAr: '\u0623\u0632\u064A\u0627\u0621',
      slug: 'fashion',
      icon: 'checkroom',
      image: 'fashion.jpg',
      children: [],
    },
  ],
};

/** Mock featured categories response matching backend API shape */
const MOCK_FEATURED_RESPONSE: FeaturedCategoriesResponse = {
  data: [
    {
      id: 1,
      name: 'Electronics',
      nameAr: '\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0627\u062A',
      slug: 'electronics',
      image: 'electronics.jpg',
      icon: 'devices',
      productCount: 45,
      sortOrder: 10,
    },
    {
      id: 2,
      name: 'Fashion',
      nameAr: '\u0623\u0632\u064A\u0627\u0621',
      slug: 'fashion',
      image: 'fashion.jpg',
      icon: 'checkroom',
      productCount: 38,
      sortOrder: 20,
    },
  ],
};

// =============================================================================
// TEST SUITE
// =============================================================================

/** @description Unit tests for the CategoryApiService HTTP layer */
describe('CategoryApiService', () => {
  let service: CategoryApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CategoryApiService],
    });

    service = TestBed.inject(CategoryApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ===========================================================================
  // SERVICE CREATION
  // ===========================================================================

  /** @description Verifies service is properly injected */
  describe('Service Creation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });
  });

  // ===========================================================================
  // GET TREE
  // ===========================================================================

  /** @description Tests for the getTree() method */
  describe('getTree', () => {
    /**
     * Should call GET /categories/tree
     * Validates: Correct HTTP method and URL are used
     */
    it('should call GET /categories/tree', () => {
      service.getTree().subscribe((response) => {
        expect(response).toEqual(MOCK_TREE_RESPONSE);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/categories/tree`);
      expect(req.request.method).toBe('GET');
      req.flush(MOCK_TREE_RESPONSE);
    });

    /**
     * Should return CategoryTreeResponse with data array
     * Validates: Response type matches the expected interface
     */
    it('should return CategoryTreeResponse with data array', () => {
      service.getTree().subscribe((response) => {
        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.data).toHaveSize(2);
        expect(response.data[0].name).toBe('Electronics');
        expect(response.data[0].children).toHaveSize(1);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/categories/tree`);
      req.flush(MOCK_TREE_RESPONSE);
    });

    /**
     * Should use environment apiUrl as base URL
     * Validates: The request URL starts with the configured apiUrl
     */
    it('should use environment apiUrl', () => {
      service.getTree().subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/categories/tree`);
      expect(req.request.url).toBe(`${environment.apiUrl}/categories/tree`);
      req.flush(MOCK_TREE_RESPONSE);
    });

    /**
     * Should handle empty tree response
     * Validates: Graceful handling of empty data
     */
    it('should handle empty tree response', () => {
      const emptyResponse: CategoryTreeResponse = { data: [] };

      service.getTree().subscribe((response) => {
        expect(response.data).toEqual([]);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/categories/tree`);
      req.flush(emptyResponse);
    });

    /**
     * Should propagate HTTP errors
     * Validates: Observable error stream for network failures
     */
    it('should propagate HTTP errors', () => {
      service.getTree().subscribe({
        next: () => fail('Should have errored'),
        error: (error) => {
          expect(error.status).toBe(500);
        },
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/categories/tree`);
      req.flush('Internal Server Error', {
        status: 500,
        statusText: 'Internal Server Error',
      });
    });
  });

  // ===========================================================================
  // GET FEATURED
  // ===========================================================================

  /** @description Tests for the getFeatured(limit) method */
  describe('getFeatured', () => {
    /**
     * Should call GET /categories/featured with limit parameter
     * Validates: Correct URL and query parameter
     */
    it('should call GET /categories/featured with limit parameter', () => {
      service.getFeatured(8).subscribe((response) => {
        expect(response).toEqual(MOCK_FEATURED_RESPONSE);
      });

      const req = httpMock.expectOne(
        (request) =>
          request.url === `${environment.apiUrl}/categories/featured` &&
          request.params.get('limit') === '8',
      );
      expect(req.request.method).toBe('GET');
      req.flush(MOCK_FEATURED_RESPONSE);
    });

    /**
     * Should use default limit of 6 when not specified
     * Validates: Default parameter value
     */
    it('should use default limit of 6 when not specified', () => {
      service.getFeatured().subscribe();

      const req = httpMock.expectOne(
        (request) =>
          request.url === `${environment.apiUrl}/categories/featured` &&
          request.params.get('limit') === '6',
      );
      expect(req.request.method).toBe('GET');
      req.flush(MOCK_FEATURED_RESPONSE);
    });

    /**
     * Should use environment apiUrl as base URL
     * Validates: The request URL starts with the configured apiUrl
     */
    it('should use environment apiUrl', () => {
      service.getFeatured(4).subscribe();

      const req = httpMock.expectOne(
        (request) =>
          request.url === `${environment.apiUrl}/categories/featured`,
      );
      expect(req.request.url).toBe(`${environment.apiUrl}/categories/featured`);
      req.flush(MOCK_FEATURED_RESPONSE);
    });

    /**
     * Should send limit as string query parameter
     * Validates: Parameter is serialized as string (HTTP requirement)
     */
    it('should send limit as string query parameter', () => {
      service.getFeatured(12).subscribe();

      const req = httpMock.expectOne(
        (request) =>
          request.url === `${environment.apiUrl}/categories/featured` &&
          request.params.get('limit') === '12',
      );
      expect(req.request.params.get('limit')).toBe('12');
      req.flush(MOCK_FEATURED_RESPONSE);
    });

    /**
     * Should return FeaturedCategoriesResponse with data array
     * Validates: Response type matches expected interface
     */
    it('should return FeaturedCategoriesResponse with data array', () => {
      service.getFeatured(6).subscribe((response) => {
        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.data).toHaveSize(2);
        expect(response.data[0].productCount).toBe(45);
        expect(response.data[1].slug).toBe('fashion');
      });

      const req = httpMock.expectOne(
        (request) =>
          request.url === `${environment.apiUrl}/categories/featured`,
      );
      req.flush(MOCK_FEATURED_RESPONSE);
    });

    /**
     * Should handle empty featured response
     * Validates: Graceful handling of empty data
     */
    it('should handle empty featured response', () => {
      const emptyResponse: FeaturedCategoriesResponse = { data: [] };

      service.getFeatured(6).subscribe((response) => {
        expect(response.data).toEqual([]);
      });

      const req = httpMock.expectOne(
        (request) =>
          request.url === `${environment.apiUrl}/categories/featured`,
      );
      req.flush(emptyResponse);
    });

    /**
     * Should propagate HTTP errors
     * Validates: Observable error stream for network failures
     */
    it('should propagate HTTP errors', () => {
      service.getFeatured(6).subscribe({
        next: () => fail('Should have errored'),
        error: (error) => {
          expect(error.status).toBe(404);
        },
      });

      const req = httpMock.expectOne(
        (request) =>
          request.url === `${environment.apiUrl}/categories/featured`,
      );
      req.flush('Not Found', {
        status: 404,
        statusText: 'Not Found',
      });
    });
  });

  // ===========================================================================
  // SEARCH IN CATEGORY (SS-CAT-006)
  // ===========================================================================

  /** @description Tests for the searchInCategory(categoryId, search, page, limit) method */
  describe('searchInCategory', () => {
    /**
     * Should call correct URL for searchInCategory
     * Validates: Correct HTTP endpoint is called with category ID
     */
    it('should call correct URL for searchInCategory', () => {
      const mockResponse: SearchInCategoryResponse = {
        success: true,
        data: [
          {
            id: 1,
            nameEn: 'Damascus Steel Knife',
            nameAr: '\u0633\u0643\u064A\u0646',
            slug: 'damascus-knife',
            mainImage: 'knife.jpg',
            basePrice: 15000,
            discountPrice: 12000,
            currency: 'SYP',
            approvalStatus: 'approved',
            isActive: true,
            isPublished: true,
          },
        ],
        meta: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      };

      service.searchInCategory(5, 'damascus', 1, 20).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(
        (request) =>
          request.url === `${environment.apiUrl}/categories/5/products`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    /**
     * Should pass search, page, limit as query params
     * Validates: Query parameters are correctly serialized
     */
    it('should pass search, page, limit as query params', () => {
      const mockResponse: SearchInCategoryResponse = {
        success: true,
        data: [],
        meta: { page: 2, limit: 50, total: 0, totalPages: 0 },
      };

      service.searchInCategory(3, 'laptop', 2, 50).subscribe();

      const req = httpMock.expectOne(
        (request) =>
          request.url === `${environment.apiUrl}/categories/3/products` &&
          request.params.get('search') === 'laptop' &&
          request.params.get('page') === '2' &&
          request.params.get('limit') === '50'
      );
      expect(req.request.params.get('search')).toBe('laptop');
      expect(req.request.params.get('page')).toBe('2');
      expect(req.request.params.get('limit')).toBe('50');
      req.flush(mockResponse);
    });

    /**
     * Should use default pagination values
     * Validates: Default page=1 and limit=20 when not specified
     */
    it('should use default pagination values', () => {
      const mockResponse: SearchInCategoryResponse = {
        success: true,
        data: [],
        meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
      };

      service.searchInCategory(1, 'test').subscribe();

      const req = httpMock.expectOne(
        (request) =>
          request.url === `${environment.apiUrl}/categories/1/products` &&
          request.params.get('page') === '1' &&
          request.params.get('limit') === '20'
      );
      expect(req.request.params.get('page')).toBe('1');
      expect(req.request.params.get('limit')).toBe('20');
      req.flush(mockResponse);
    });

    /**
     * Should handle empty search results
     * Validates: Empty data array returned with correct metadata
     */
    it('should handle empty search results', () => {
      const mockResponse: SearchInCategoryResponse = {
        success: true,
        data: [],
        meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
      };

      service.searchInCategory(1, 'nonexistent', 1, 20).subscribe((response) => {
        expect(response.data).toEqual([]);
        expect(response.meta.total).toBe(0);
      });

      const req = httpMock.expectOne(
        (request) =>
          request.url === `${environment.apiUrl}/categories/1/products`
      );
      req.flush(mockResponse);
    });

    /**
     * Should propagate HTTP errors
     * Validates: Observable error stream for network failures
     */
    it('should propagate HTTP errors', () => {
      service.searchInCategory(1, 'test', 1, 20).subscribe({
        next: () => fail('Should have errored'),
        error: (error) => {
          expect(error.status).toBe(500);
        },
      });

      const req = httpMock.expectOne(
        (request) =>
          request.url === `${environment.apiUrl}/categories/1/products`
      );
      req.flush('Internal Server Error', {
        status: 500,
        statusText: 'Internal Server Error',
      });
    });

    /**
     * Should handle 404 for non-existent category
     * Validates: Not found error properly propagated
     */
    it('should handle 404 for non-existent category', () => {
      service.searchInCategory(99999, 'test', 1, 20).subscribe({
        next: () => fail('Should have errored'),
        error: (error) => {
          expect(error.status).toBe(404);
        },
      });

      const req = httpMock.expectOne(
        (request) =>
          request.url === `${environment.apiUrl}/categories/99999/products`
      );
      req.flush('Not Found', {
        status: 404,
        statusText: 'Not Found',
      });
    });

    /**
     * Should return product data with pricing and images
     * Validates: Complete product information in response
     */
    it('should return product data with pricing and images', () => {
      const mockResponse: SearchInCategoryResponse = {
        success: true,
        data: [
          {
            id: 1,
            nameEn: 'Product 1',
            nameAr: 'منتج 1',
            slug: 'product-1',
            mainImage: 'image1.jpg',
            basePrice: 1000,
            discountPrice: 800,
            currency: 'SYP',
            approvalStatus: 'approved',
            isActive: true,
            isPublished: true,
          },
        ],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      };

      service.searchInCategory(1, 'product', 1, 20).subscribe((response) => {
        expect(response.data[0]).toHaveProperty('id');
        expect(response.data[0]).toHaveProperty('nameEn');
        expect(response.data[0]).toHaveProperty('nameAr');
        expect(response.data[0]).toHaveProperty('mainImage');
        expect(response.data[0]).toHaveProperty('basePrice');
        expect(response.data[0]).toHaveProperty('discountPrice');
      });

      const req = httpMock.expectOne(
        (request) =>
          request.url === `${environment.apiUrl}/categories/1/products`
      );
      req.flush(mockResponse);
    });
  });
});
