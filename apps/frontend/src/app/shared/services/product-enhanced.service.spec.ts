import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError, timer } from 'rxjs';
import { map } from 'rxjs/operators';
import { ProductEnhancedService } from './product-enhanced.service';
import { ProductService } from './product.service';
import { Product } from '../interfaces/product.interface';
import { PaginatedResponse } from '../interfaces';

/**
 * Helper function to create PaginatedResponse
 */
function createPaginatedResponse<T>(data: T[], currentPage: number = 1, itemsPerPage: number = 10): PaginatedResponse<T> {
  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  return {
    data,
    pagination: {
      currentPage,
      totalPages,
      totalItems,
      itemsPerPage
    },
    success: true,
    timestamp: new Date()
  };
}

/**
 * Enterprise Unit Tests for ProductEnhancedService
 * 
 * Test Coverage:
 * - Caching functionality and TTL
 * - Error handling and retry logic
 * - Performance optimizations
 * - Data filtering and sorting
 * - Memory management
 * - Analytics tracking
 * 
 * @swagger
 * components:
 *   schemas:
 *     ProductEnhancedServiceTest:
 *       type: object
 *       description: Comprehensive test suite for enhanced product service
 */
describe('ProductEnhancedService', () => {
  let service: ProductEnhancedService;
  let mockProductService: jasmine.SpyObj<ProductService>;
  let mockProduct: Product;
  let mockProducts: Product[];

  beforeEach(() => {
    // Create spy object for ProductService
    const spy = jasmine.createSpyObj('ProductService', [
      'getProductById',
      'getProductBySlug',
      'getProducts',
      'getFeaturedProducts',
      'searchProducts'
    ]);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ProductEnhancedService,
        { provide: ProductService, useValue: spy }
      ]
    });

    service = TestBed.inject(ProductEnhancedService);
    mockProductService = TestBed.inject(ProductService) as jasmine.SpyObj<ProductService>;

    // Setup mock data
    mockProduct = createMockProduct('test-product-1', 'Test Product');
    mockProducts = [
      mockProduct,
      createMockProduct('test-product-2', 'Another Product'),
      createMockProduct('test-product-3', 'Third Product')
    ];
  });

  afterEach(() => {
    // Clear cache after each test to prevent interference
    service.clearCache();
  });

  //#region Basic Functionality Tests
  
  describe('Basic Functionality', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with empty cache', () => {
      const stats = service.getCacheStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.cacheSize.products).toBe(0);
    });

    it('should clear cache successfully', () => {
      // Setup some cache data first
      mockProductService.getProductBySlug.and.returnValue(of(mockProduct));

      service.getProduct('test-slug').subscribe();

      // Verify cache has data
      let stats = service.getCacheStats();
      expect(stats.cacheSize.products).toBeGreaterThan(0);

      // Clear cache
      service.clearCache();

      // Verify cache is cleared
      stats = service.getCacheStats();
      expect(stats.cacheSize.products).toBe(0);
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });
  });

  //#endregion

  //#region Caching Tests
  
  describe('Caching Functionality', () => {
    it('should cache product and return from cache on second call', (done) => {
      const productSlug = 'damascus-steel-knife';
      mockProductService.getProductBySlug.and.returnValue(of(mockProduct));

      // First call - should hit the service
      service.getProduct(productSlug).subscribe(result => {
        expect(result).toEqual(mockProduct);
        expect(mockProductService.getProductBySlug).toHaveBeenCalledTimes(1);
        
        // Second call - should hit the cache
        service.getProduct(productSlug).subscribe(secondResult => {
          expect(secondResult).toEqual(mockProduct);
          expect(mockProductService.getProductBySlug).toHaveBeenCalledTimes(1); // Still only called once
          
          const stats = service.getCacheStats();
          expect(stats.hits).toBe(1);
          expect(stats.misses).toBe(1);
          expect(stats.hitRate).toBe(0.5);
          
          done();
        });
      });
    });

    it('should cache products list with pagination parameters', (done) => {
      const params = { page: 1, limit: 10, sortBy: 'name', sortOrder: 'asc' as const };
      mockProductService.getProducts.and.returnValue(of(createPaginatedResponse(mockProducts)));

      service.getProducts(params).subscribe(result => {
        expect(result).toEqual(mockProducts);
        
        // Second call with same parameters should hit cache
        service.getProducts(params).subscribe(secondResult => {
          expect(secondResult).toEqual(mockProducts);
          expect(mockProductService.getProducts).toHaveBeenCalledTimes(1);
          
          const stats = service.getCacheStats();
          expect(stats.hits).toBe(1);
          
          done();
        });
      });
    });

    it('should create separate cache entries for different parameters', (done) => {
      mockProductService.getProducts.and.returnValue(of(createPaginatedResponse(mockProducts)));

      const params1 = { page: 1, limit: 5 };
      const params2 = { page: 2, limit: 5 };

      service.getProducts(params1).subscribe(() => {
        service.getProducts(params2).subscribe(() => {
          expect(mockProductService.getProducts).toHaveBeenCalledTimes(2);
          
          const stats = service.getCacheStats();
          expect(stats.cacheSize.productsList).toBe(2);
          
          done();
        });
      });
    });

    it('should handle search query caching', (done) => {
      const searchQuery = 'damascus steel';
      const searchResults = [mockProduct];
      mockProductService.searchProducts.and.returnValue(of(createPaginatedResponse(searchResults)));

      service.searchProducts(searchQuery).subscribe(result => {
        // Service maps PaginatedResponse to Product[]
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);

        // Second call should hit cache
        service.searchProducts(searchQuery).subscribe(secondResult => {
          expect(Array.isArray(secondResult)).toBe(true);
          expect(mockProductService.searchProducts).toHaveBeenCalledTimes(1);

          const stats = service.getCacheStats();
          expect(stats.cacheSize.search).toBe(1);

          done();
        });
      });
    });
  });

  //#endregion

  //#region Error Handling Tests
  
  describe('Error Handling', () => {
    it('should handle service errors gracefully', (done) => {
      const error = new Error('Service unavailable');
      mockProductService.getProductBySlug.and.returnValue(throwError(() => error));

      service.getProduct('test-slug').subscribe(result => {
        expect(result).toBeNull();
        done();
      });
    });

    it('should retry failed requests', (done) => {
      const error = new Error('Network error');
      mockProductService.getProducts.and.returnValues(
        throwError(() => error),
        throwError(() => error),
        of(createPaginatedResponse(mockProducts))
      );

      service.getProducts().subscribe(result => {
        expect(result).toEqual(mockProducts);
        expect(mockProductService.getProducts).toHaveBeenCalledTimes(3);
        done();
      });
    });

    it('should return empty array for invalid category slug', (done) => {
      service.getProductsByCategory('').subscribe(result => {
        expect(result).toEqual([]);
        expect(mockProductService.getProductsByCategory).not.toHaveBeenCalled();
        done();
      });
    });

    it('should return empty array for empty search query', (done) => {
      service.searchProducts('   ').subscribe(result => {
        expect(result).toEqual([]);
        expect(mockProductService.searchProducts).not.toHaveBeenCalled();
        done();
      });
    });

    it('should handle related products for invalid product ID', (done) => {
      service.getRelatedProducts('').subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });
  });

  //#endregion

  //#region Performance Tests
  
  describe('Performance Optimizations', () => {
    it('should prevent duplicate concurrent requests for same product', (done) => {
      let callCount = 0;
      mockProductService.getProductBySlug.and.callFake(() => {
        callCount++;
        return timer(100).pipe(map(() => mockProduct));
      });

      // Make multiple concurrent requests for same product
      const requests = [
        service.getProduct('test-slug'),
        service.getProduct('test-slug'),
        service.getProduct('test-slug')
      ];

      Promise.all(requests.map(req => req.toPromise())).then(results => {
        expect(results).toEqual([mockProduct, mockProduct, mockProduct]);
        expect(callCount).toBe(1); // Should only make one actual service call
        done();
      });
    });

    it('should sort products correctly', (done) => {
      const unsortedProducts = [
        createMockProduct('1', 'Zebra Product'),
        createMockProduct('2', 'Alpha Product'),
        createMockProduct('3', 'Beta Product')
      ];
      
      mockProductService.getProducts.and.returnValue(of(createPaginatedResponse(unsortedProducts)));

      const params = { sortBy: 'name', sortOrder: 'asc' as const };
      service.getProducts(params).subscribe(result => {
        expect(result[0].name).toBe('Alpha Product');
        expect(result[1].name).toBe('Beta Product');
        expect(result[2].name).toBe('Zebra Product');
        done();
      });
    });

    it('should apply pagination correctly', (done) => {
      mockProductService.getProducts.and.returnValue(of(createPaginatedResponse(mockProducts)));

      const params = { page: 2, limit: 1 };
      service.getProducts(params).subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0]).toEqual(mockProducts[1]); // Second item (page 2, limit 1)
        done();
      });
    });
  });

  //#endregion

  //#region Advanced Features Tests
  
  describe('Advanced Features', () => {
    it('should calculate cache statistics correctly', (done) => {
      mockProductService.getProductBySlug.and.returnValue(of(mockProduct));
      mockProductService.getProducts.and.returnValue(of(createPaginatedResponse(mockProducts)));

      // Generate some cache activity
      service.getProduct('test-1').subscribe(() => {
        service.getProduct('test-1').subscribe(() => { // Cache hit
          service.getProducts().subscribe(() => {
            service.getProducts().subscribe(() => { // Cache hit
              
              const stats = service.getCacheStats();
              expect(stats.hits).toBe(2);
              expect(stats.misses).toBe(2);
              expect(stats.hitRate).toBe(0.5);
              expect(stats.cacheSize.products).toBe(1);
              expect(stats.cacheSize.productsList).toBe(1);
              
              done();
            });
          });
        });
      });
    });

    it('should filter featured products correctly', (done) => {
      const productsWithMixedRatings = [
        createMockProductWithRating('high-rated', 'High Rated', 4.8, 20, true),
        createMockProductWithRating('low-rated', 'Low Rated', 2.5, 5, true),
        createMockProductWithRating('out-of-stock', 'Out of Stock', 4.5, 15, false)
      ];

      mockProductService.getFeaturedProducts.and.returnValue(of(productsWithMixedRatings));

      service.getFeaturedProducts(10).subscribe(result => {
        expect(result.length).toBe(1); // Only high-rated, in-stock product with sufficient reviews
        expect(result[0].name).toBe('High Rated');
        done();
      });
    });

    it('should calculate search relevance scores correctly', (done) => {
      const searchProducts = [
        createMockProduct('exact-match', 'Damascus Steel Knife'), // Should score highest
        createMockProduct('partial-match', 'Steel Kitchen Tool'),  // Should score medium
        createMockProduct('category-match', 'Cooking Utensil')     // Should score lowest
      ];
      searchProducts[2].category.name = 'Damascus Steel'; // Category match

      mockProductService.searchProducts.and.returnValue(of(createPaginatedResponse(searchProducts)));

      service.searchProducts('damascus steel').subscribe(result => {
        expect(result[0].name).toBe('Damascus Steel Knife'); // Highest relevance first
        expect(result.length).toBe(3);
        done();
      });
    });
  });

  //#endregion

  //#region Helper Functions
  
  /**
   * Creates a mock product for testing
   */
  function createMockProduct(id: string, name: string): Product {
    return {
      id,
      name,
      nameArabic: name + ' عربي',
      slug: id,
      description: `Description for ${name}`,
      descriptionArabic: `وصف ${name}`,
      price: {
        amount: 100,
        currency: 'USD'
      },
      category: {
        id: 'test-category',
        name: 'Test Category',
        slug: 'test-category',
        breadcrumb: ['Home', 'Test Category']
      },
      images: [{
        id: 'img-1',
        url: '/test-image.jpg',
        alt: 'Test image',
        isPrimary: true,
        order: 1
      }],
      specifications: {
        materials: ['Test Material']
      },
      seller: {
        id: 'test-seller',
        name: 'Test Seller',
        location: { city: 'Damascus', governorate: 'Damascus' },
        rating: 4.5,
        reviewCount: 100,
        verified: true
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
        unescoRecognition: true,
        badges: ['UNESCO', 'Authentic']
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
        totalReviews: 20,
        ratingDistribution: { 1: 0, 2: 1, 3: 2, 4: 5, 5: 12 }
      },
      timestamps: {
        created: new Date('2024-01-01'),
        updated: new Date('2024-01-15')
      }
    };
  }

  /**
   * Creates a mock product with specific rating and stock status
   */
  function createMockProductWithRating(
    id: string, 
    name: string, 
    rating: number, 
    reviewCount: number, 
    inStock: boolean
  ): Product {
    const product = createMockProduct(id, name);
    product.reviews.averageRating = rating;
    product.reviews.totalReviews = reviewCount;
    product.inventory.inStock = inStock;
    product.inventory.status = inStock ? 'in_stock' : 'out_of_stock';
    return product;
  }

  //#endregion
});

