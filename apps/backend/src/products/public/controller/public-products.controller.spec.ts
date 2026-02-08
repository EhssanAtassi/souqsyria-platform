/**
 * @file public-products.controller.spec.ts
 * @description Unit tests for the PublicProductsController, covering the public product catalog endpoints
 */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PublicProductsController } from './public-products.controller';
import { PublicProductsService } from '../service/public-products.service';
import { GetPublicProductsDto } from '../dto/get-public-products.dto';

describe('PublicProductsController', () => {
  let controller: PublicProductsController;
  let mockService: any;

  beforeEach(async () => {
    // Create mock service
    mockService = {
      getPublicFeed: jest.fn(),
      searchProducts: jest.fn(),
      getProductBySlug: jest.fn(),
      getFeaturedProducts: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PublicProductsController],
      providers: [
        {
          provide: PublicProductsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<PublicProductsController>(PublicProductsController);
  });

  describe('getPublicProducts()', () => {
    /**
     * Test that getPublicProducts returns 200 with correct response shape
     */
    it('should return 200 with correct response shape', async () => {
      // Arrange
      const mockResponse = {
        data: [
          {
            id: 1,
            slug: 'product-1',
            nameEn: 'Product 1',
            nameAr: 'منتج 1',
            mainImage: 'http://example.com/img1.jpg',
            basePrice: 100,
            discountPrice: null,
            currency: 'SYP',
            categoryId: 1,
            categoryNameEn: 'Category 1',
            categoryNameAr: 'الفئة 1',
            stockStatus: 'in_stock',
            rating: 0,
            reviewCount: 0,
          },
        ],
        meta: {
          total: 1,
          page: 1,
          limit: 20,
          totalPages: 1,
        },
      };

      mockService.getPublicFeed.mockResolvedValue(mockResponse);

      const filters: GetPublicProductsDto = { page: 1, limit: 20 };

      // Act
      const result = await controller.getPublicProducts(filters);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(result.data).toBeDefined();
      expect(result.meta).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    /**
     * Test that getPublicProducts passes query params to service correctly
     */
    it('should pass query params to service correctly', async () => {
      // Arrange
      mockService.getPublicFeed.mockResolvedValue({ data: [], meta: {} });

      const filters: GetPublicProductsDto = {
        page: 2,
        limit: 10,
        search: 'Damascus',
        categoryId: 5,
        manufacturerId: 3,
        minPrice: 50000,
        maxPrice: 500000,
        sortBy: 'price_asc',
      };

      // Act
      await controller.getPublicProducts(filters);

      // Assert
      expect(mockService.getPublicFeed).toHaveBeenCalledWith(filters);
      expect(mockService.getPublicFeed).toHaveBeenCalledTimes(1);
    });

    /**
     * Test that getPublicProducts returns 404 when service throws NotFoundException
     */
    it('should propagate NotFoundException from service', async () => {
      // Arrange
      const notFoundError = new NotFoundException(
        'Requested page 5 exceeds available pages (2). Total products: 50.',
      );

      mockService.getPublicFeed.mockRejectedValue(notFoundError);

      const filters: GetPublicProductsDto = { page: 5, limit: 20 };

      // Act & Assert
      await expect(controller.getPublicProducts(filters)).rejects.toThrow(
        NotFoundException,
      );
    });

    /**
     * Test that getPublicProducts with no parameters defaults to page 1, limit 20
     */
    it('should work with no parameters (defaults applied by DTO)', async () => {
      // Arrange
      mockService.getPublicFeed.mockResolvedValue({ data: [], meta: {} });

      const filters: GetPublicProductsDto = {};

      // Act
      await controller.getPublicProducts(filters);

      // Assert
      expect(mockService.getPublicFeed).toHaveBeenCalled();
    });

    /**
     * Test that getPublicProducts returns empty data array when no products match
     */
    it('should return empty data array when no products match filters', async () => {
      // Arrange
      const mockResponse = {
        data: [],
        meta: {
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0,
        },
      };

      mockService.getPublicFeed.mockResolvedValue(mockResponse);

      const filters: GetPublicProductsDto = { search: 'nonexistent' };

      // Act
      const result = await controller.getPublicProducts(filters);

      // Assert
      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
    });

    /**
     * Test that getPublicProducts returns multiple products in one request
     */
    it('should return multiple products in one request', async () => {
      // Arrange
      const mockResponse = {
        data: [
          {
            id: 1,
            slug: 'product-1',
            nameEn: 'Product 1',
            nameAr: 'منتج 1',
            mainImage: 'http://example.com/img1.jpg',
            basePrice: 100,
            discountPrice: null,
            currency: 'SYP',
            categoryId: 1,
            categoryNameEn: 'Category 1',
            categoryNameAr: 'الفئة 1',
            stockStatus: 'in_stock',
            rating: 0,
            reviewCount: 0,
          },
          {
            id: 2,
            slug: 'product-2',
            nameEn: 'Product 2',
            nameAr: 'منتج 2',
            mainImage: 'http://example.com/img2.jpg',
            basePrice: 200,
            discountPrice: 180,
            currency: 'SYP',
            categoryId: 2,
            categoryNameEn: 'Category 2',
            categoryNameAr: 'الفئة 2',
            stockStatus: 'low_stock',
            rating: 0,
            reviewCount: 0,
          },
        ],
        meta: {
          total: 2,
          page: 1,
          limit: 20,
          totalPages: 1,
        },
      };

      mockService.getPublicFeed.mockResolvedValue(mockResponse);

      const filters: GetPublicProductsDto = { page: 1, limit: 20 };

      // Act
      const result = await controller.getPublicProducts(filters);

      // Assert
      expect(result.data).toHaveLength(2);
      expect(result.data[0].id).toBe(1);
      expect(result.data[1].id).toBe(2);
    });

    /**
     * Test that getPublicProducts with categoryId filter
     */
    it('should pass categoryId filter to service', async () => {
      // Arrange
      mockService.getPublicFeed.mockResolvedValue({ data: [], meta: {} });

      const filters: GetPublicProductsDto = { categoryId: 5 };

      // Act
      await controller.getPublicProducts(filters);

      // Assert
      expect(mockService.getPublicFeed).toHaveBeenCalledWith(
        expect.objectContaining({ categoryId: 5 }),
      );
    });

    /**
     * Test that getPublicProducts with manufacturerId filter
     */
    it('should pass manufacturerId filter to service', async () => {
      // Arrange
      mockService.getPublicFeed.mockResolvedValue({ data: [], meta: {} });

      const filters: GetPublicProductsDto = { manufacturerId: 3 };

      // Act
      await controller.getPublicProducts(filters);

      // Assert
      expect(mockService.getPublicFeed).toHaveBeenCalledWith(
        expect.objectContaining({ manufacturerId: 3 }),
      );
    });

    /**
     * Test that getPublicProducts with price range filters
     */
    it('should pass minPrice and maxPrice filters to service', async () => {
      // Arrange
      mockService.getPublicFeed.mockResolvedValue({ data: [], meta: {} });

      const filters: GetPublicProductsDto = { minPrice: 50000, maxPrice: 500000 };

      // Act
      await controller.getPublicProducts(filters);

      // Assert
      expect(mockService.getPublicFeed).toHaveBeenCalledWith(
        expect.objectContaining({ minPrice: 50000, maxPrice: 500000 }),
      );
    });

    /**
     * Test that getPublicProducts with sortBy filter
     */
    it('should pass sortBy filter to service', async () => {
      // Arrange
      mockService.getPublicFeed.mockResolvedValue({ data: [], meta: {} });

      const filters: GetPublicProductsDto = { sortBy: 'price_asc' };

      // Act
      await controller.getPublicProducts(filters);

      // Assert
      expect(mockService.getPublicFeed).toHaveBeenCalledWith(
        expect.objectContaining({ sortBy: 'price_asc' }),
      );
    });
  });

  describe('searchProducts()', () => {
    /**
     * Test that searchProducts calls service with valid search query
     */
    it('should call service with valid search query', async () => {
      // Arrange
      mockService.searchProducts.mockResolvedValue({ data: [], meta: {} });

      const searchQuery = 'Damascus Steel';
      const filters: GetPublicProductsDto = { page: 1, limit: 20 };

      // Act
      await controller.searchProducts(searchQuery, filters);

      // Assert
      expect(mockService.searchProducts).toHaveBeenCalledWith(searchQuery, filters);
    });

    /**
     * Test that searchProducts returns search results with correct shape
     */
    it('should return search results with correct shape', async () => {
      // Arrange
      const mockResponse = {
        data: [
          {
            id: 1,
            slug: 'damascus-steel-knife',
            nameEn: 'Damascus Steel Knife',
            nameAr: 'سكين دمشقي',
            shortDescription: 'A beautiful Damascus steel knife',
            mainImage: 'http://example.com/img1.jpg',
            finalPrice: 100000,
            currency: 'SYP',
            category: {
              id: 1,
              nameEn: 'Cutlery',
              nameAr: 'الأدوات المعدنية',
              slug: 'cutlery',
            },
            manufacturer: {
              id: 2,
              name: 'Damascus Crafts',
            },
          },
        ],
        meta: {
          total: 1,
          page: 1,
          limit: 20,
          searchQuery: 'Damascus Steel',
          hasResults: true,
        },
      };

      mockService.searchProducts.mockResolvedValue(mockResponse);

      const searchQuery = 'Damascus Steel';
      const filters: GetPublicProductsDto = {};

      // Act
      const result = await controller.searchProducts(searchQuery, filters);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(result.meta.searchQuery).toBe('Damascus Steel');
      expect(result.meta.hasResults).toBe(true);
    });
  });

  describe('getProductBySlug()', () => {
    /**
     * Test that getProductBySlug returns product details with correct shape
     */
    it('should return product details with correct shape', async () => {
      // Arrange
      const mockProduct = {
        id: 1,
        slug: 'damascus-steel-knife',
        nameEn: 'Damascus Steel Knife',
        nameAr: 'سكين دمشقي',
        category: {
          id: 1,
          nameEn: 'Cutlery',
          nameAr: 'أدوات المطبخ',
        },
        pricing: {
          basePrice: 100000,
          discountPrice: 90000,
          currency: 'SYP',
        },
        images: [
          {
            id: 1,
            imageUrl: 'http://example.com/img1.jpg',
          },
        ],
      };

      mockService.getProductBySlug.mockResolvedValue(mockProduct);

      // Act
      const result = await controller.getProductBySlug('damascus-steel-knife');

      // Assert
      expect(result).toEqual(mockProduct);
      expect(result.id).toBe(1);
      expect(result.slug).toBe('damascus-steel-knife');
    });

    /**
     * Test that getProductBySlug calls service with correct slug
     */
    it('should call service with correct slug', async () => {
      // Arrange
      mockService.getProductBySlug.mockResolvedValue({});

      const slug = 'test-product-slug';

      // Act
      await controller.getProductBySlug(slug);

      // Assert
      expect(mockService.getProductBySlug).toHaveBeenCalledWith(slug);
    });

    /**
     * Test that getProductBySlug throws NotFoundException when product doesn't exist
     */
    it('should propagate NotFoundException when product not found', async () => {
      // Arrange
      const notFoundError = new NotFoundException(
        'Product with slug "invalid-slug" not found or not available',
      );

      mockService.getProductBySlug.mockRejectedValue(notFoundError);

      // Act & Assert
      await expect(controller.getProductBySlug('invalid-slug')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getFeaturedProducts()', () => {
    /**
     * Test that getFeaturedProducts returns featured products with correct shape
     */
    it('should return featured products with correct shape', async () => {
      // Arrange
      const mockResponse = {
        data: [
          {
            id: 1,
            name_en: 'Featured Product 1',
            name_ar: 'منتج مميز 1',
            slug: 'featured-product-1',
            sku: 'FP-001',
            currency: 'SYP',
            base_price: 500000,
            discount_price: 450000,
            discount_percentage: 10,
            image_url: 'http://example.com/img1.jpg',
            is_featured: true,
            featured_priority: 100,
            featured_badge: 'Best Seller',
            category: {
              id: 1,
              name_en: 'Category 1',
              name_ar: 'الفئة 1',
              slug: 'category-1',
              parent_id: null,
            },
            status: 'published',
            approval_status: 'approved',
            is_active: true,
            is_published: true,
            created_at: '2025-01-01T00:00:00Z',
            promotional_text: 'Amazing product',
          },
        ],
        meta: {
          total: 1,
          limit: 3,
        },
      };

      mockService.getFeaturedProducts.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.getFeaturedProducts();

      // Assert
      expect(result).toEqual(mockResponse);
      expect(result.data).toBeDefined();
      expect(result.meta).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    /**
     * Test that getFeaturedProducts passes limit parameter to service
     */
    it('should pass limit parameter to service', async () => {
      // Arrange
      mockService.getFeaturedProducts.mockResolvedValue({ data: [], meta: {} });

      // Act
      await controller.getFeaturedProducts(5);

      // Assert
      expect(mockService.getFeaturedProducts).toHaveBeenCalledWith(
        5,
        undefined,
        undefined,
        'featured',
      );
    });

    /**
     * Test that getFeaturedProducts passes categoryId parameter to service
     */
    it('should pass categoryId parameter to service', async () => {
      // Arrange
      mockService.getFeaturedProducts.mockResolvedValue({ data: [], meta: {} });

      // Act
      await controller.getFeaturedProducts(3, 5);

      // Assert
      expect(mockService.getFeaturedProducts).toHaveBeenCalledWith(
        3,
        5,
        undefined,
        'featured',
      );
    });

    /**
     * Test that getFeaturedProducts passes parentCategoryId parameter to service
     */
    it('should pass parentCategoryId parameter to service', async () => {
      // Arrange
      mockService.getFeaturedProducts.mockResolvedValue({ data: [], meta: {} });

      // Act
      await controller.getFeaturedProducts(3, undefined, 10);

      // Assert
      expect(mockService.getFeaturedProducts).toHaveBeenCalledWith(
        3,
        undefined,
        10,
        'featured',
      );
    });

    /**
     * Test that getFeaturedProducts passes sort parameter to service
     */
    it('should pass sort parameter to service', async () => {
      // Arrange
      mockService.getFeaturedProducts.mockResolvedValue({ data: [], meta: {} });

      // Act
      await controller.getFeaturedProducts(3, undefined, undefined, 'best_seller');

      // Assert
      expect(mockService.getFeaturedProducts).toHaveBeenCalledWith(
        3,
        undefined,
        undefined,
        'best_seller',
      );
    });

    /**
     * Test that getFeaturedProducts defaults to limit 3 when not provided
     */
    it('should default to limit 3 when not provided', async () => {
      // Arrange
      mockService.getFeaturedProducts.mockResolvedValue({ data: [], meta: {} });

      // Act
      await controller.getFeaturedProducts();

      // Assert
      expect(mockService.getFeaturedProducts).toHaveBeenCalledWith(
        3,
        undefined,
        undefined,
        'featured',
      );
    });

    /**
     * Test that getFeaturedProducts defaults to sort featured when not provided
     */
    it('should default to sort featured when not provided', async () => {
      // Arrange
      mockService.getFeaturedProducts.mockResolvedValue({ data: [], meta: {} });

      // Act
      await controller.getFeaturedProducts(5);

      // Assert
      expect(mockService.getFeaturedProducts).toHaveBeenCalledWith(
        5,
        undefined,
        undefined,
        'featured',
      );
    });
  });
});
