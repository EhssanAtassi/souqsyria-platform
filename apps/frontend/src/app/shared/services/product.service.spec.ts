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
    id: 'test-product-1',
    name: 'Test Product',
    slug: 'test-product',
    description: 'Test description',
    price: {
      amount: 100,
      currency: 'USD'
    },
    category: {
      id: 'test-category-1',
      name: 'Test Category',
      slug: 'test-category',
      breadcrumb: ['Home', 'Test Category']
    },
    images: [
      {
        id: 'img-1',
        url: 'test.jpg',
        alt: 'Test image',
        isPrimary: true,
        order: 1
      }
    ],
    specifications: {
      materials: ['Test Material']
    },
    seller: {
      id: 'seller-1',
      name: 'Test Seller',
      location: { city: 'Damascus', governorate: 'Damascus' },
      verified: true,
      rating: 4.5,
      reviewCount: 10
    },
    shipping: {
      methods: [
        {
          id: 'standard',
          name: 'Standard',
          cost: { amount: 5, currency: 'USD' },
          deliveryTime: { min: 1, max: 3, unit: 'days' as const },
          trackingAvailable: true,
          insured: false
        }
      ],
      deliveryTimes: {}
    },
    authenticity: {
      certified: true,
      heritage: 'traditional',
      badges: ['Authentic']
    },
    inventory: {
      inStock: true,
      quantity: 10,
      status: 'in_stock',
      minOrderQuantity: 1,
      lowStockThreshold: 5
    },
    reviews: {
      averageRating: 4.5,
      totalReviews: 10,
      ratingDistribution: { 1: 0, 2: 0, 3: 1, 4: 3, 5: 6 }
    },
    timestamps: {
      created: new Date(),
      updated: new Date()
    },
    featured: false
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
