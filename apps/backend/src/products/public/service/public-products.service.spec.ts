/**
 * @file public-products.service.spec.ts
 * @description Unit tests for the PublicProductsService, covering the public product catalog API
 */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PublicProductsService } from './public-products.service';
import { ProductEntity } from '../../entities/product.entity';
import { GetPublicProductsDto } from '../dto/get-public-products.dto';
import { ReviewsService } from '../../reviews/services/reviews.service';
import { Category } from '../../../categories/entities/category.entity';
import { CategoryHierarchyService } from '../../../categories/services/category-hierarchy.service';

describe('PublicProductsService', () => {
  let service: PublicProductsService;
  let mockRepository: any;
  let mockQueryBuilder: any;

  beforeEach(async () => {
    // Create mock QueryBuilder with chainable methods
    mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
      getMany: jest.fn(),
      setParameter: jest.fn().mockReturnThis(),
    };

    // Create mock repository
    mockRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      increment: jest.fn(),
    };

    /** @description Mock ReviewsService to satisfy DI for PublicProductsService */
    const mockReviewsService = {
      getReviewSummary: jest.fn().mockResolvedValue({
        averageRating: 0,
        totalReviews: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      }),
    };

    /** @description Mock Category repository for category lookups */
    const mockCategoryRepo = {
      findOne: jest.fn().mockResolvedValue(null),
    };

    /** @description Mock CategoryHierarchyService for breadcrumb hierarchy */
    const mockCategoryHierarchyService = {
      getAncestors: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublicProductsService,
        {
          provide: getRepositoryToken(ProductEntity),
          useValue: mockRepository,
        },
        {
          provide: ReviewsService,
          useValue: mockReviewsService,
        },
        {
          provide: getRepositoryToken(Category),
          useValue: mockCategoryRepo,
        },
        {
          provide: CategoryHierarchyService,
          useValue: mockCategoryHierarchyService,
        },
      ],
    }).compile();

    service = module.get<PublicProductsService>(PublicProductsService);
  });

  describe('getPublicFeed()', () => {
    /**
     * Test that getPublicFeed returns paginated results with correct response shape
     */
    it('should return paginated results with correct response shape', async () => {
      // Arrange
      const mockProducts = [
        {
          id: 1,
          slug: 'product-1',
          nameEn: 'Product 1',
          nameAr: 'منتج 1',
          images: [{ imageUrl: 'http://example.com/img1.jpg' }],
          pricing: { basePrice: 100, discountPrice: null, currency: 'SYP' },
          category: { id: 1, nameEn: 'Category 1', nameAr: 'الفئة 1' },
          variants: [],
        },
      ];

      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockProducts, 1]);

      const dto: GetPublicProductsDto = { page: 1, limit: 20 };

      // Act
      const result = await service.getPublicFeed(dto);

      // Assert
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.meta).toHaveProperty('total');
      expect(result.meta).toHaveProperty('page');
      expect(result.meta).toHaveProperty('limit');
      expect(result.meta).toHaveProperty('totalPages');
    });

    /**
     * Test that getPublicFeed respects page and limit parameters
     */
    it('should respect page and limit parameters', async () => {
      // Arrange
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      const dto: GetPublicProductsDto = { page: 2, limit: 10 };

      // Act
      await service.getPublicFeed(dto);

      // Assert
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
    });

    /**
     * Test that getPublicFeed caps limit at 100 maximum
     */
    it('should cap limit at maximum of 100', async () => {
      // Arrange
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      const dto: GetPublicProductsDto = { page: 1, limit: 200 };

      // Act
      await service.getPublicFeed(dto);

      // Assert
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(100);
    });

    /**
     * Test that getPublicFeed calculates totalPages correctly
     */
    it('should calculate totalPages correctly (50 items with limit 20 = 3 pages)', async () => {
      // Arrange
      const mockProducts = Array(20)
        .fill(null)
        .map((_, i) => ({
          id: i + 1,
          slug: `product-${i + 1}`,
          nameEn: `Product ${i + 1}`,
          nameAr: `منتج ${i + 1}`,
          images: [],
          pricing: { basePrice: 100, discountPrice: null, currency: 'SYP' },
          category: null,
          variants: [],
        }));

      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockProducts, 50]);

      const dto: GetPublicProductsDto = { page: 1, limit: 20 };

      // Act
      const result = await service.getPublicFeed(dto);

      // Assert
      expect(result.meta.totalPages).toBe(3);
      expect(result.meta.total).toBe(50);
    });

    /**
     * Test that getPublicFeed throws NotFoundException when page exceeds totalPages
     */
    it('should throw NotFoundException when page exceeds totalPages', async () => {
      // Arrange
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 50]);

      const dto: GetPublicProductsDto = { page: 5, limit: 20 };

      // Act & Assert
      await expect(service.getPublicFeed(dto)).rejects.toThrow(NotFoundException);
      await expect(service.getPublicFeed(dto)).rejects.toThrow(
        /Requested page 5 exceeds available pages/,
      );
    });

    /**
     * Test that getPublicFeed does not throw when page equals totalPages
     */
    it('should not throw when page equals totalPages', async () => {
      // Arrange
      const mockProducts = Array(10)
        .fill(null)
        .map((_, i) => ({
          id: i + 1,
          slug: `product-${i + 1}`,
          nameEn: `Product ${i + 1}`,
          nameAr: `منتج ${i + 1}`,
          images: [],
          pricing: { basePrice: 100, discountPrice: null, currency: 'SYP' },
          category: null,
          variants: [],
        }));

      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockProducts, 30]);

      const dto: GetPublicProductsDto = { page: 3, limit: 10 };

      // Act & Assert
      expect(await service.getPublicFeed(dto)).toBeDefined();
      expect(mockQueryBuilder.getManyAndCount).toHaveBeenCalled();
    });

    /**
     * Test that getPublicFeed does not throw NotFoundException when total is 0
     */
    it('should not throw NotFoundException when total is 0 even with page > 0', async () => {
      // Arrange
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      const dto: GetPublicProductsDto = { page: 10, limit: 20 };

      // Act & Assert
      const result = await service.getPublicFeed(dto);
      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
    });

    /**
     * Test that getPublicFeed computes stock status as in_stock for totalStock > 5
     */
    it('should compute stock status as in_stock when totalStock > 5', async () => {
      // Arrange
      const mockProducts = [
        {
          id: 1,
          slug: 'product-1',
          nameEn: 'Product 1',
          nameAr: 'منتج 1',
          images: [],
          pricing: { basePrice: 100, discountPrice: null, currency: 'SYP' },
          category: null,
          variants: [
            {
              id: 1,
              stocks: [{ quantity: 10 }],
            },
          ],
        },
      ];

      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockProducts, 1]);

      const dto: GetPublicProductsDto = { page: 1, limit: 20 };

      // Act
      const result = await service.getPublicFeed(dto);

      // Assert
      expect(result.data[0].stockStatus).toBe('in_stock');
    });

    /**
     * Test that getPublicFeed computes stock status as low_stock for 1-5 totalStock
     */
    it('should compute stock status as low_stock when totalStock is 1-5', async () => {
      // Arrange
      const mockProducts = [
        {
          id: 1,
          slug: 'product-1',
          nameEn: 'Product 1',
          nameAr: 'منتج 1',
          images: [],
          pricing: { basePrice: 100, discountPrice: null, currency: 'SYP' },
          category: null,
          variants: [
            {
              id: 1,
              stocks: [{ quantity: 3 }],
            },
          ],
        },
      ];

      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockProducts, 1]);

      const dto: GetPublicProductsDto = { page: 1, limit: 20 };

      // Act
      const result = await service.getPublicFeed(dto);

      // Assert
      expect(result.data[0].stockStatus).toBe('low_stock');
    });

    /**
     * Test that getPublicFeed computes stock status as out_of_stock for totalStock = 0
     */
    it('should compute stock status as out_of_stock when totalStock is 0', async () => {
      // Arrange
      const mockProducts = [
        {
          id: 1,
          slug: 'product-1',
          nameEn: 'Product 1',
          nameAr: 'منتج 1',
          images: [],
          pricing: { basePrice: 100, discountPrice: null, currency: 'SYP' },
          category: null,
          variants: [
            {
              id: 1,
              stocks: [{ quantity: 0 }],
            },
          ],
        },
      ];

      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockProducts, 1]);

      const dto: GetPublicProductsDto = { page: 1, limit: 20 };

      // Act
      const result = await service.getPublicFeed(dto);

      // Assert
      expect(result.data[0].stockStatus).toBe('out_of_stock');
    });

    /**
     * Test that getPublicFeed defaults stock status to in_stock when no variants exist
     */
    it('should default stock status to in_stock when no variants exist', async () => {
      // Arrange
      const mockProducts = [
        {
          id: 1,
          slug: 'product-1',
          nameEn: 'Product 1',
          nameAr: 'منتج 1',
          images: [],
          pricing: { basePrice: 100, discountPrice: null, currency: 'SYP' },
          category: null,
          variants: [],
        },
      ];

      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockProducts, 1]);

      const dto: GetPublicProductsDto = { page: 1, limit: 20 };

      // Act
      const result = await service.getPublicFeed(dto);

      // Assert
      expect(result.data[0].stockStatus).toBe('in_stock');
    });

    /**
     * Test that getPublicFeed applies search filter
     */
    it('should apply search filter', async () => {
      // Arrange
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      const dto: GetPublicProductsDto = { page: 1, limit: 20, search: 'Damascus' };

      // Act
      await service.getPublicFeed(dto);

      // Assert — search now uses FULLTEXT index with LIKE fallback
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(MATCH(product.nameEn, product.nameAr) AGAINST(:ftSearch IN BOOLEAN MODE) OR product.nameEn LIKE :search OR product.nameAr LIKE :search)',
        { ftSearch: 'Damascus', search: '%Damascus%' },
      );
    });

    /**
     * Test that getPublicFeed does not apply search filter when search is empty
     */
    it('should not apply search filter when search is empty', async () => {
      // Arrange
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      const dto: GetPublicProductsDto = { page: 1, limit: 20, search: '' };

      // Act
      await service.getPublicFeed(dto);

      // Assert
      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalledWith(
        expect.stringContaining('nameEn LIKE'),
        expect.any(Object),
      );
    });

    /**
     * Test that getPublicFeed applies category filter
     */
    it('should apply category filter', async () => {
      // Arrange
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      const dto: GetPublicProductsDto = { page: 1, limit: 20, categoryId: 5 };

      // Act
      await service.getPublicFeed(dto);

      // Assert
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'product.category_id = :cid',
        { cid: 5 },
      );
    });

    /**
     * Test that getPublicFeed applies manufacturer filter
     */
    it('should apply manufacturer filter', async () => {
      // Arrange
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      const dto: GetPublicProductsDto = { page: 1, limit: 20, manufacturerId: 3 };

      // Act
      await service.getPublicFeed(dto);

      // Assert
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'product.manufacturer_id = :mid',
        { mid: 3 },
      );
    });

    /**
     * Test that getPublicFeed applies minimum price filter
     */
    it('should apply minimum price filter', async () => {
      // Arrange
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      const dto: GetPublicProductsDto = { page: 1, limit: 20, minPrice: 50000 };

      // Act
      await service.getPublicFeed(dto);

      // Assert
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(pricing.discountPrice IS NOT NULL AND pricing.discountPrice >= :min) OR (pricing.discountPrice IS NULL AND pricing.basePrice >= :min)',
        { min: 50000 },
      );
    });

    /**
     * Test that getPublicFeed applies maximum price filter
     */
    it('should apply maximum price filter', async () => {
      // Arrange
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      const dto: GetPublicProductsDto = { page: 1, limit: 20, maxPrice: 500000 };

      // Act
      await service.getPublicFeed(dto);

      // Assert
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(pricing.discountPrice IS NOT NULL AND pricing.discountPrice <= :max) OR (pricing.discountPrice IS NULL AND pricing.basePrice <= :max)',
        { max: 500000 },
      );
    });

    /**
     * Test that getPublicFeed sorts by price ascending when sortBy is price_asc
     */
    it('should sort by price ascending when sortBy is price_asc', async () => {
      // Arrange
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      const dto: GetPublicProductsDto = { page: 1, limit: 20, sortBy: 'price_asc' };

      // Act
      await service.getPublicFeed(dto);

      // Assert
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'COALESCE(pricing.discountPrice, pricing.basePrice)',
        'ASC',
      );
    });

    /**
     * Test that getPublicFeed sorts by price descending when sortBy is price_desc
     */
    it('should sort by price descending when sortBy is price_desc', async () => {
      // Arrange
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      const dto: GetPublicProductsDto = { page: 1, limit: 20, sortBy: 'price_desc' };

      // Act
      await service.getPublicFeed(dto);

      // Assert
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'COALESCE(pricing.discountPrice, pricing.basePrice)',
        'DESC',
      );
    });

    /**
     * Test that getPublicFeed sorts by creation date descending by default (newest)
     */
    it('should sort by creation date descending (newest) by default', async () => {
      // Arrange
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      const dto: GetPublicProductsDto = { page: 1, limit: 20 };

      // Act
      await service.getPublicFeed(dto);

      // Assert
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('product.createdAt', 'DESC');
    });

    /**
     * Test that getPublicFeed applies all filters together
     */
    it('should apply all filters together', async () => {
      // Arrange
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      const dto: GetPublicProductsDto = {
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
      await service.getPublicFeed(dto);

      // Assert
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(MATCH(product.nameEn, product.nameAr) AGAINST(:ftSearch IN BOOLEAN MODE) OR product.nameEn LIKE :search OR product.nameAr LIKE :search)',
        expect.any(Object),
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'product.category_id = :cid',
        expect.any(Object),
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'product.manufacturer_id = :mid',
        expect.any(Object),
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'COALESCE(pricing.discountPrice, pricing.basePrice)',
        'ASC',
      );
    });

    /**
     * Test that getPublicFeed accumulates stock across multiple variants
     */
    it('should accumulate stock across multiple variants', async () => {
      // Arrange
      const mockProducts = [
        {
          id: 1,
          slug: 'product-1',
          nameEn: 'Product 1',
          nameAr: 'منتج 1',
          images: [],
          pricing: { basePrice: 100, discountPrice: null, currency: 'SYP' },
          category: null,
          variants: [
            {
              id: 1,
              stocks: [{ quantity: 3 }],
            },
            {
              id: 2,
              stocks: [{ quantity: 4 }],
            },
          ],
        },
      ];

      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockProducts, 1]);

      const dto: GetPublicProductsDto = { page: 1, limit: 20 };

      // Act
      const result = await service.getPublicFeed(dto);

      // Assert
      expect(result.data[0].stockStatus).toBe('in_stock'); // 3 + 4 = 7 > 5
    });

    /**
     * Test that getPublicFeed accumulates stock across multiple warehouses in one variant
     */
    it('should accumulate stock across multiple warehouses in one variant', async () => {
      // Arrange
      const mockProducts = [
        {
          id: 1,
          slug: 'product-1',
          nameEn: 'Product 1',
          nameAr: 'منتج 1',
          images: [],
          pricing: { basePrice: 100, discountPrice: null, currency: 'SYP' },
          category: null,
          variants: [
            {
              id: 1,
              stocks: [{ quantity: 2 }, { quantity: 2 }, { quantity: 2 }],
            },
          ],
        },
      ];

      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockProducts, 1]);

      const dto: GetPublicProductsDto = { page: 1, limit: 20 };

      // Act
      const result = await service.getPublicFeed(dto);

      // Assert
      expect(result.data[0].stockStatus).toBe('in_stock'); // 2 + 2 + 2 = 6 > 5
    });

    /**
     * Test that getPublicFeed handles null pricing gracefully
     */
    it('should handle null pricing gracefully', async () => {
      // Arrange
      const mockProducts = [
        {
          id: 1,
          slug: 'product-1',
          nameEn: 'Product 1',
          nameAr: 'منتج 1',
          images: [],
          pricing: null,
          category: null,
          variants: [],
        },
      ];

      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockProducts, 1]);

      const dto: GetPublicProductsDto = { page: 1, limit: 20 };

      // Act
      const result = await service.getPublicFeed(dto);

      // Assert
      expect(result.data[0].basePrice).toBeUndefined();
      expect(result.data[0].discountPrice).toBeNull();
      expect(result.data[0].currency).toBe('SYP'); // defaults to SYP
    });
  });

  // =========================================================================
  // INCREMENT VIEW COUNT
  // =========================================================================

  describe('incrementViewCount()', () => {
    /**
     * @description Verifies incrementViewCount calls repository.increment with correct parameters
     */
    it('should call repository increment with correct slug and conditions', async () => {
      // Arrange
      const slug = 'damascus-knife';
      mockRepository.increment.mockResolvedValue({ affected: 1 });

      // Act
      await service.incrementViewCount(slug);

      // Assert
      expect(mockRepository.increment).toHaveBeenCalledWith(
        { slug, isActive: true, isPublished: true, is_deleted: false },
        'viewCount',
        1,
      );
    });

    /**
     * @description Verifies incrementViewCount throws NotFoundException when no product is found
     */
    it('should throw NotFoundException when no product matches the slug', async () => {
      // Arrange
      const slug = 'nonexistent-product';
      mockRepository.increment.mockResolvedValue({ affected: 0 });

      // Act & Assert
      await expect(service.incrementViewCount(slug)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.incrementViewCount(slug)).rejects.toThrow(
        /Product with slug "nonexistent-product" not found/,
      );
    });

    /**
     * @description Verifies incrementViewCount resolves successfully for a valid product
     */
    it('should resolve successfully when a product is found and incremented', async () => {
      // Arrange
      const slug = 'valid-product';
      mockRepository.increment.mockResolvedValue({ affected: 1 });

      // Act & Assert - should not throw
      await expect(
        service.incrementViewCount(slug),
      ).resolves.toBeUndefined();
    });

    /**
     * @description Verifies incrementViewCount re-throws non-NotFoundException errors
     */
    it('should re-throw unexpected database errors', async () => {
      // Arrange
      const slug = 'some-product';
      const dbError = new Error('Database connection lost');
      mockRepository.increment.mockRejectedValue(dbError);

      // Act & Assert
      await expect(service.incrementViewCount(slug)).rejects.toThrow(
        'Database connection lost',
      );
    });

    /**
     * @description Verifies incrementViewCount increments by exactly 1
     */
    it('should increment viewCount by exactly 1', async () => {
      // Arrange
      const slug = 'test-product';
      mockRepository.increment.mockResolvedValue({ affected: 1 });

      // Act
      await service.incrementViewCount(slug);

      // Assert - third argument should be 1
      expect(mockRepository.increment).toHaveBeenCalledWith(
        expect.any(Object),
        'viewCount',
        1,
      );
    });
  });
});
