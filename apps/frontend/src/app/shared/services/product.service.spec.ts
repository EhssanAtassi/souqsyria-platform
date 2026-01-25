/**
 * @file product.service.spec.ts
 * @description Unit tests for base Product Service
 *
 * Test Coverage:
 * - Get products with pagination
 * - Get single product by ID and slug
 * - Get featured products
 * - Search products
 * - Get products by category
 * - Get related products
 */

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProductService } from './product.service';
import { Product } from '../interfaces/product.interface';

describe('ProductService', () => {
  let service: ProductService;
  let httpMock: HttpTestingController;
  const apiUrl = '/api/v1/products';

  // Mock product data
  const mockProduct: Product = {
    id: 1,
    nameEn: 'Test Product',
    nameAr: 'منتج اختبار',
    slug: 'test-product',
    descriptionEn: 'Test description',
    descriptionAr: 'وصف الاختبار',
    price: 1000,
    discount: 0,
    category: { id: 1, nameEn: 'Test Category', nameAr: 'فئة اختبار' },
    image: 'test.jpg',
    images: ['test.jpg'],
    rating: 4.5,
    reviewCount: 10,
    inStock: true,
    featured: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockProducts: Product[] = [mockProduct];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProductService]
    });
    service = TestBed.inject(ProductService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getProducts', () => {
    it('should fetch all products without parameters', (done) => {
      service.getProducts().subscribe((response) => {
        expect(response).toBeDefined();
        done();
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockProducts, total: 1, page: 1, limit: 10 });
    });

    it('should fetch products with pagination parameters', (done) => {
      service.getProducts({ page: 1, limit: 20 }).subscribe((response) => {
        expect(response).toBeDefined();
        done();
      });

      const req = httpMock.expectOne((request) =>
        request.url === apiUrl &&
        request.params.has('page') &&
        request.params.get('page') === '1'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockProducts, total: 1, page: 1, limit: 20 });
    });

    it('should fetch products with search parameter', (done) => {
      service.getProducts({ search: 'test' }).subscribe((response) => {
        expect(response).toBeDefined();
        done();
      });

      const req = httpMock.expectOne((request) =>
        request.url === apiUrl &&
        request.params.get('search') === 'test'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockProducts, total: 1, page: 1, limit: 10 });
    });

    it('should fetch products with category filter', (done) => {
      service.getProducts({ category: '1' }).subscribe((response) => {
        expect(response).toBeDefined();
        done();
      });

      const req = httpMock.expectOne((request) =>
        request.url === apiUrl &&
        request.params.get('category') === '1'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockProducts, total: 1, page: 1, limit: 10 });
    });
  });

  describe('getProductById', () => {
    it('should fetch product by ID', (done) => {
      service.getProductById(1).subscribe((product) => {
        expect(product).toEqual(mockProduct);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockProduct);
    });

    it('should handle numeric and string IDs', (done) => {
      service.getProductById('1').subscribe((product) => {
        expect(product).toEqual(mockProduct);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockProduct);
    });
  });

  describe('getProductBySlug', () => {
    it('should fetch product by slug', (done) => {
      service.getProductBySlug('test-product').subscribe((product) => {
        expect(product).toEqual(mockProduct);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/slug/test-product`);
      expect(req.request.method).toBe('GET');
      req.flush(mockProduct);
    });
  });

  describe('getFeaturedProducts', () => {
    it('should fetch featured products with default limit', (done) => {
      service.getFeaturedProducts().subscribe((products) => {
        expect(products).toEqual(mockProducts);
        done();
      });

      const req = httpMock.expectOne((request) =>
        request.url === `${apiUrl}/featured` &&
        request.params.get('limit') === '10' &&
        request.params.get('featured') === 'true'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockProducts);
    });

    it('should fetch featured products with custom limit', (done) => {
      service.getFeaturedProducts(20).subscribe((products) => {
        expect(products).toEqual(mockProducts);
        done();
      });

      const req = httpMock.expectOne((request) =>
        request.url === `${apiUrl}/featured` &&
        request.params.get('limit') === '20'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockProducts);
    });
  });

  describe('searchProducts', () => {
    it('should search products with query', (done) => {
      service.searchProducts('test').subscribe((response) => {
        expect(response).toBeDefined();
        done();
      });

      const req = httpMock.expectOne((request) =>
        request.url === `${apiUrl}/search` &&
        request.params.get('search') === 'test'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockProducts, total: 1, page: 1, limit: 10 });
    });

    it('should search products with query and pagination', (done) => {
      service.searchProducts('test', { page: 2, limit: 20 }).subscribe((response) => {
        expect(response).toBeDefined();
        done();
      });

      const req = httpMock.expectOne((request) =>
        request.url === `${apiUrl}/search` &&
        request.params.get('search') === 'test' &&
        request.params.get('page') === '2'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockProducts, total: 1, page: 2, limit: 20 });
    });
  });

  describe('getProductsByCategory', () => {
    it('should fetch products by category ID', (done) => {
      service.getProductsByCategory(1).subscribe((response) => {
        expect(response).toBeDefined();
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/category/1`);
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockProducts, total: 1, page: 1, limit: 10 });
    });

    it('should fetch products by category with pagination', (done) => {
      service.getProductsByCategory(1, { page: 1, limit: 15 }).subscribe((response) => {
        expect(response).toBeDefined();
        done();
      });

      const req = httpMock.expectOne((request) =>
        request.url === `${apiUrl}/category/1` &&
        request.params.get('limit') === '15'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockProducts, total: 1, page: 1, limit: 15 });
    });
  });

  describe('getRelatedProducts', () => {
    it('should fetch related products with default limit', (done) => {
      service.getRelatedProducts(1).subscribe((products) => {
        expect(products).toEqual(mockProducts);
        done();
      });

      const req = httpMock.expectOne((request) =>
        request.url === `${apiUrl}/1/related` &&
        request.params.get('limit') === '5'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockProducts);
    });

    it('should fetch related products with custom limit', (done) => {
      service.getRelatedProducts(1, 10).subscribe((products) => {
        expect(products).toEqual(mockProducts);
        done();
      });

      const req = httpMock.expectOne((request) =>
        request.url === `${apiUrl}/1/related` &&
        request.params.get('limit') === '10'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockProducts);
    });
  });
});
