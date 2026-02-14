/**
 * @file public-products.service.s3.spec.ts
 * @description Jest test suite covering searchProducts(), getFeaturedProducts(),
 * and the 'rating' sort branch in getPublicFeed().
 * Targets uncovered lines: 101-175 (searchProducts), 300 (rating sort),
 * and 652-733 (getFeaturedProducts) to bring coverage above 80%.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PublicProductsService } from './public-products.service';
import { ProductEntity } from '../../entities/product.entity';
import { GetPublicProductsDto } from '../dto/get-public-products.dto';

/**
 * Mock query builder for TypeORM Repository
 * Provides chainable methods to simulate database queries in isolation
 */
class MockQueryBuilder {
  private mockData: any[] = [];
  private mockCount = 0;
  private singleMockData: any = null;

  /** @description Stores all andWhere calls for assertion */
  andWhereCalls: Array<{ condition: string; params?: Record<string, any> }> =
    [];
  /** @description Stores all orderBy calls for assertion */
  orderByCalls: Array<{ column: string; direction: string }> = [];
  /** @description Stores all addOrderBy calls for assertion */
  addOrderByCalls: Array<{ column: string; direction: string }> = [];
  /** @description Stores all setParameter calls for assertion */
  setParameterCalls: Array<{ key: string; value: any }> = [];
  /** @description Stores the limit value if set */
  limitValue: number | null = null;
  /** @description Stores the skip value */
  skipValue: number | null = null;
  /** @description Stores the take value */
  takeValue: number | null = null;

  select(_fields: string[] | string): this {
    return this;
  }
  from(_tableName: string, _alias: string): this {
    return this;
  }
  leftJoinAndSelect(_relation: string, _alias: string): this {
    return this;
  }
  where(_condition: string, _params?: Record<string, any>): this {
    return this;
  }

  andWhere(condition: string, params?: Record<string, any>): this {
    this.andWhereCalls.push({ condition, params });
    return this;
  }

  orderBy(column: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
    this.orderByCalls.push({ column, direction });
    return this;
  }

  addOrderBy(column: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
    this.addOrderByCalls.push({ column, direction });
    return this;
  }

  skip(amount: number): this {
    this.skipValue = amount;
    return this;
  }

  take(amount: number): this {
    this.takeValue = amount;
    return this;
  }

  limit(amount: number): this {
    this.limitValue = amount;
    return this;
  }

  setParameter(key: string, value: any): this {
    this.setParameterCalls.push({ key, value });
    return this;
  }

  async getMany(): Promise<any[]> {
    if (this.limitValue !== null) {
      return this.mockData.slice(0, this.limitValue);
    }
    return this.mockData;
  }

  async getOne(): Promise<any> {
    return this.singleMockData;
  }

  async getManyAndCount(): Promise<[any[], number]> {
    return [this.mockData, this.mockCount];
  }

  async getRawMany(): Promise<any[]> {
    return this.mockData;
  }

  /** @description Sets mock data array for getMany / getManyAndCount */
  setMockData(data: any[]): this {
    this.mockData = data;
    return this;
  }

  /** @description Sets mock count for getManyAndCount */
  setMockCount(count: number): this {
    this.mockCount = count;
    return this;
  }

  /** @description Sets single mock result for getOne */
  setSingleMockData(data: any): this {
    this.singleMockData = data;
    return this;
  }
}

describe('PublicProductsService - S3 Coverage (searchProducts, rating sort, getFeaturedProducts)', () => {
  let service: PublicProductsService;
  let mockProductRepository: any;
  let mockQueryBuilder: MockQueryBuilder;

  beforeEach(async () => {
    mockQueryBuilder = new MockQueryBuilder();

    mockProductRepository = {
      createQueryBuilder: jest.fn(() => mockQueryBuilder),
      manager: {
        createQueryBuilder: jest.fn(() => mockQueryBuilder),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublicProductsService,
        {
          provide: getRepositoryToken(ProductEntity),
          useValue: mockProductRepository,
        },
      ],
    }).compile();

    service = module.get<PublicProductsService>(PublicProductsService);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // searchProducts() — covers lines 101-175
  // ─────────────────────────────────────────────────────────────────────────
  describe('searchProducts()', () => {
    /** @description Should return paginated data with correct meta shape */
    it('should return paginated results with correct response shape', async () => {
      // Arrange
      const products = [
        {
          id: 1,
          slug: 'damascus-knife',
          nameEn: 'Damascus Knife',
          nameAr: 'سكين دمشقي',
          descriptions: [{ description: 'Fine Damascus steel' }],
          images: [{ imageUrl: 'https://example.com/img.jpg' }],
          pricing: {
            basePrice: 50000,
            discountPrice: 40000,
            currency: 'SYP',
          },
          category: {
            id: 1,
            nameEn: 'Cutlery',
            nameAr: 'أدوات مائدة',
            slug: 'cutlery',
          },
          manufacturer: { id: 3, name: 'Damascus Forge' },
        },
      ];
      mockQueryBuilder.setMockData(products).setMockCount(1);

      const filters: GetPublicProductsDto = { page: 1, limit: 20 };

      // Act
      const result = await service.searchProducts('Damascus', filters);

      // Assert
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
      expect(result.meta.searchQuery).toBe('Damascus');
      expect(result.meta.hasResults).toBe(true);
    });

    /** @description Should map product fields including discount price fallback */
    it('should map product response fields correctly with discountPrice', async () => {
      // Arrange
      const products = [
        {
          id: 10,
          slug: 'product-10',
          nameEn: 'Product Ten',
          nameAr: 'المنتج عشرة',
          descriptions: [{ description: 'Short desc' }],
          images: [{ imageUrl: 'https://example.com/p10.jpg' }],
          pricing: {
            basePrice: 100000,
            discountPrice: 80000,
            currency: 'SYP',
          },
          category: {
            id: 2,
            nameEn: 'Electronics',
            nameAr: 'إلكترونيات',
            slug: 'electronics',
          },
          manufacturer: { id: 5, name: 'TechCo' },
        },
      ];
      mockQueryBuilder.setMockData(products).setMockCount(1);

      // Act
      const result = await service.searchProducts('product', {
        page: 1,
        limit: 20,
      });

      // Assert — discountPrice should be preferred as finalPrice
      expect(result.data[0].finalPrice).toBe(80000);
      expect(result.data[0].currency).toBe('SYP');
      expect(result.data[0].mainImage).toBe('https://example.com/p10.jpg');
      expect(result.data[0].category).toEqual({
        id: 2,
        nameEn: 'Electronics',
        nameAr: 'إلكترونيات',
        slug: 'electronics',
      });
      expect(result.data[0].manufacturer).toEqual({
        id: 5,
        name: 'TechCo',
      });
    });

    /** @description Should use basePrice when discountPrice is null */
    it('should fall back to basePrice when discountPrice is null', async () => {
      // Arrange
      const products = [
        {
          id: 1,
          slug: 'no-discount',
          nameEn: 'No Discount',
          nameAr: 'بدون خصم',
          descriptions: [],
          images: [],
          pricing: {
            basePrice: 75000,
            discountPrice: null,
            currency: 'SYP',
          },
          category: null,
          manufacturer: null,
        },
      ];
      mockQueryBuilder.setMockData(products).setMockCount(1);

      // Act
      const result = await service.searchProducts('no discount', {
        page: 1,
        limit: 20,
      });

      // Assert
      expect(result.data[0].finalPrice).toBe(75000);
    });

    /** @description Should return null category and manufacturer when missing */
    it('should return null for category and manufacturer when not present', async () => {
      // Arrange
      const products = [
        {
          id: 1,
          slug: 'uncategorised',
          nameEn: 'Uncategorised',
          nameAr: 'غير مصنف',
          descriptions: [],
          images: [],
          pricing: { basePrice: 1000, discountPrice: null, currency: 'SYP' },
          category: null,
          manufacturer: null,
        },
      ];
      mockQueryBuilder.setMockData(products).setMockCount(1);

      // Act
      const result = await service.searchProducts('uncategorised', {
        page: 1,
        limit: 20,
      });

      // Assert
      expect(result.data[0].category).toBeNull();
      expect(result.data[0].manufacturer).toBeNull();
    });

    /** @description Should apply FULLTEXT search when query is non-empty */
    it('should apply FULLTEXT search filter when searchQuery is non-empty', async () => {
      // Arrange
      mockQueryBuilder.setMockData([]).setMockCount(0);

      // Act
      await service.searchProducts('steel knife', { page: 1, limit: 20 });

      // Assert — verify the FULLTEXT andWhere call was made
      const ftCall = mockQueryBuilder.andWhereCalls.find(
        (c) =>
          c.condition.includes('MATCH') &&
          c.condition.includes('AGAINST') &&
          c.condition.includes('BOOLEAN MODE'),
      );
      expect(ftCall).toBeDefined();
      expect(ftCall!.params).toEqual({
        ftSearch: 'steel knife',
        search: '%steel knife%',
      });
    });

    /** @description Should order by FULLTEXT relevance when searchQuery is provided */
    it('should order by relevance score when searchQuery is provided', async () => {
      // Arrange
      mockQueryBuilder.setMockData([]).setMockCount(0);

      // Act
      await service.searchProducts('phone', { page: 1, limit: 20 });

      // Assert — should use CASE-based relevance ordering, not createdAt
      const relevanceOrder = mockQueryBuilder.orderByCalls.find((c) =>
        c.column.includes('CASE'),
      );
      expect(relevanceOrder).toBeDefined();
      expect(relevanceOrder!.direction).toBe('ASC');

      // Should also set the ftSearch and nameSearch parameters
      const ftParam = mockQueryBuilder.setParameterCalls.find(
        (c) => c.key === 'ftSearch',
      );
      const nameParam = mockQueryBuilder.setParameterCalls.find(
        (c) => c.key === 'nameSearch',
      );
      expect(ftParam).toBeDefined();
      expect(ftParam!.value).toBe('phone');
      expect(nameParam).toBeDefined();
      expect(nameParam!.value).toBe('%phone%');
    });

    /** @description Should order by createdAt DESC when searchQuery is empty */
    it('should order by createdAt DESC when searchQuery is empty', async () => {
      // Arrange
      mockQueryBuilder.setMockData([]).setMockCount(0);

      // Act
      await service.searchProducts('', { page: 1, limit: 20 });

      // Assert
      const dateOrder = mockQueryBuilder.orderByCalls.find(
        (c) => c.column === 'product.createdAt' && c.direction === 'DESC',
      );
      expect(dateOrder).toBeDefined();
    });

    /** @description Should not apply FULLTEXT when searchQuery is empty string */
    it('should not apply search filter when searchQuery is empty', async () => {
      // Arrange
      mockQueryBuilder.setMockData([]).setMockCount(0);

      // Act
      await service.searchProducts('', { page: 1, limit: 20 });

      // Assert
      const ftCall = mockQueryBuilder.andWhereCalls.find((c) =>
        c.condition.includes('MATCH'),
      );
      expect(ftCall).toBeUndefined();
    });

    /** @description Should apply categoryId filter */
    it('should apply categoryId filter when provided', async () => {
      // Arrange
      mockQueryBuilder.setMockData([]).setMockCount(0);

      // Act
      await service.searchProducts('test', {
        page: 1,
        limit: 20,
        categoryId: 7,
      });

      // Assert
      const catCall = mockQueryBuilder.andWhereCalls.find(
        (c) => c.condition === 'product.category_id = :cid',
      );
      expect(catCall).toBeDefined();
      expect(catCall!.params).toEqual({ cid: 7 });
    });

    /** @description Should apply manufacturerId filter */
    it('should apply manufacturerId filter when provided', async () => {
      // Arrange
      mockQueryBuilder.setMockData([]).setMockCount(0);

      // Act
      await service.searchProducts('test', {
        page: 1,
        limit: 20,
        manufacturerId: 4,
      });

      // Assert
      const mfgCall = mockQueryBuilder.andWhereCalls.find(
        (c) => c.condition === 'product.manufacturer_id = :mid',
      );
      expect(mfgCall).toBeDefined();
      expect(mfgCall!.params).toEqual({ mid: 4 });
    });

    /** @description Should apply minPrice filter */
    it('should apply minPrice filter when provided', async () => {
      // Arrange
      mockQueryBuilder.setMockData([]).setMockCount(0);

      // Act
      await service.searchProducts('test', {
        page: 1,
        limit: 20,
        minPrice: 10000,
      });

      // Assert
      const minCall = mockQueryBuilder.andWhereCalls.find((c) =>
        c.condition.includes('pricing.basePrice >= :min'),
      );
      expect(minCall).toBeDefined();
      expect(minCall!.params).toEqual({ min: 10000 });
    });

    /** @description Should apply maxPrice filter */
    it('should apply maxPrice filter when provided', async () => {
      // Arrange
      mockQueryBuilder.setMockData([]).setMockCount(0);

      // Act
      await service.searchProducts('test', {
        page: 1,
        limit: 20,
        maxPrice: 500000,
      });

      // Assert
      const maxCall = mockQueryBuilder.andWhereCalls.find((c) =>
        c.condition.includes('pricing.basePrice <= :max'),
      );
      expect(maxCall).toBeDefined();
      expect(maxCall!.params).toEqual({ max: 500000 });
    });

    /** @description Should respect pagination skip/take correctly */
    it('should compute correct skip and take for page 3 with limit 10', async () => {
      // Arrange
      mockQueryBuilder.setMockData([]).setMockCount(0);

      // Act
      await service.searchProducts('test', { page: 3, limit: 10 });

      // Assert
      expect(mockQueryBuilder.skipValue).toBe(20); // (3-1) * 10
      expect(mockQueryBuilder.takeValue).toBe(10);
    });

    /** @description Should cap limit at 100 */
    it('should cap limit at 100 when a larger value is provided', async () => {
      // Arrange
      mockQueryBuilder.setMockData([]).setMockCount(0);

      // Act
      await service.searchProducts('test', { page: 1, limit: 999 });

      // Assert
      expect(mockQueryBuilder.takeValue).toBe(100);
    });

    /** @description Should default page to 1 and limit to 20 when not provided */
    it('should default page to 1 and limit to 20 when filters are empty', async () => {
      // Arrange
      mockQueryBuilder.setMockData([]).setMockCount(0);

      // Act
      const result = await service.searchProducts('query', {} as any);

      // Assert
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
      expect(mockQueryBuilder.skipValue).toBe(0);
      expect(mockQueryBuilder.takeValue).toBe(20);
    });

    /** @description Should return hasResults false when total is 0 */
    it('should return hasResults false when no products match', async () => {
      // Arrange
      mockQueryBuilder.setMockData([]).setMockCount(0);

      // Act
      const result = await service.searchProducts('zzz_nonexistent', {
        page: 1,
        limit: 20,
      });

      // Assert
      expect(result.meta.hasResults).toBe(false);
      expect(result.meta.total).toBe(0);
      expect(result.data).toHaveLength(0);
    });

    /** @description Should handle null images array */
    it('should handle null images gracefully and return null mainImage', async () => {
      // Arrange
      const products = [
        {
          id: 1,
          slug: 'no-img',
          nameEn: 'No Image',
          nameAr: 'بدون صورة',
          descriptions: [],
          images: null,
          pricing: { basePrice: 1000, discountPrice: null, currency: 'SYP' },
          category: null,
          manufacturer: null,
        },
      ];
      mockQueryBuilder.setMockData(products).setMockCount(1);

      // Act
      const result = await service.searchProducts('no image', {
        page: 1,
        limit: 20,
      });

      // Assert
      expect(result.data[0].mainImage).toBeNull();
    });

    /** @description Should return empty shortDescription when descriptions array is empty */
    it('should return empty shortDescription when descriptions is empty', async () => {
      // Arrange
      const products = [
        {
          id: 1,
          slug: 'no-desc',
          nameEn: 'No Desc',
          nameAr: 'بدون وصف',
          descriptions: [],
          images: [],
          pricing: { basePrice: 1000, discountPrice: null, currency: 'SYP' },
          category: null,
          manufacturer: null,
        },
      ];
      mockQueryBuilder.setMockData(products).setMockCount(1);

      // Act
      const result = await service.searchProducts('no desc', {
        page: 1,
        limit: 20,
      });

      // Assert
      expect(result.data[0].shortDescription).toBe('');
    });

    /** @description Should handle null pricing gracefully */
    it('should handle null pricing and default currency to SYP', async () => {
      // Arrange
      const products = [
        {
          id: 1,
          slug: 'no-pricing',
          nameEn: 'No Pricing',
          nameAr: 'بدون سعر',
          descriptions: [],
          images: [],
          pricing: null,
          category: null,
          manufacturer: null,
        },
      ];
      mockQueryBuilder.setMockData(products).setMockCount(1);

      // Act
      const result = await service.searchProducts('no pricing', {
        page: 1,
        limit: 20,
      });

      // Assert
      expect(result.data[0].finalPrice).toBeUndefined();
      expect(result.data[0].currency).toBe('SYP');
    });

    /** @description Should return empty searchQuery in meta when query is empty */
    it('should return empty searchQuery in meta when query is empty string', async () => {
      // Arrange
      mockQueryBuilder.setMockData([]).setMockCount(0);

      // Act
      const result = await service.searchProducts('', { page: 1, limit: 20 });

      // Assert
      expect(result.meta.searchQuery).toBe('');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // getPublicFeed() — covers line 300 (rating sort branch)
  // ─────────────────────────────────────────────────────────────────────────
  describe('getPublicFeed() - Rating Sort', () => {
    /** @description Should order by createdAt DESC when sortBy is rating (placeholder) */
    it('should order by createdAt DESC when sortBy is "rating"', async () => {
      // Arrange
      const filters: GetPublicProductsDto = {
        page: 1,
        limit: 20,
        sortBy: 'rating',
      };

      const products = [
        {
          id: 1,
          slug: 'rated-product',
          nameEn: 'Rated Product',
          nameAr: 'منتج مقيم',
          images: [],
          pricing: { basePrice: 1000, discountPrice: null, currency: 'SYP' },
          category: null,
          variants: [],
        },
      ];
      mockQueryBuilder.setMockData(products).setMockCount(1);

      // Act
      const result = await service.getPublicFeed(filters);

      // Assert — rating sort currently falls back to createdAt DESC
      const createdAtOrder = mockQueryBuilder.orderByCalls.find(
        (c) => c.column === 'product.createdAt' && c.direction === 'DESC',
      );
      expect(createdAtOrder).toBeDefined();
      expect(result.data).toHaveLength(1);
      expect(result.data[0].rating).toBe(0);
      expect(result.data[0].reviewCount).toBe(0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // getFeaturedProducts() — covers lines 652-733
  // ─────────────────────────────────────────────────────────────────────────
  describe('getFeaturedProducts()', () => {
    /** @description Should return featured products with correct response shape */
    it('should return featured products with data and meta', async () => {
      // Arrange
      const products = [
        {
          id: 1,
          nameEn: 'Featured Product',
          nameAr: 'منتج مميز',
          slug: 'featured-product',
          sku: 'FP-001',
          currency: 'SYP',
          isFeatured: true,
          featuredPriority: 10,
          featuredBadge: 'HOT',
          featuredStartDate: null,
          featuredEndDate: null,
          isBestSeller: false,
          salesCount: 50,
          status: 'published',
          approvalStatus: 'approved',
          isActive: true,
          isPublished: true,
          createdAt: new Date('2025-06-01'),
          pricing: {
            basePrice: 100000,
            discountPrice: 85000,
            currency: 'SYP',
            isActive: true,
          },
          images: [{ imageUrl: 'https://example.com/featured.jpg' }],
          category: {
            id: 1,
            nameEn: 'Electronics',
            nameAr: 'إلكترونيات',
            slug: 'electronics',
            parent: { id: 10 },
          },
          descriptions: [{ description: 'Promotional text here' }],
        },
      ];
      mockQueryBuilder.setMockData(products);

      // Act
      const result = await service.getFeaturedProducts(3);

      // Assert
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.limit).toBe(3);
    });

    /** @description Should map all featured product response fields correctly */
    it('should map response fields in snake_case format', async () => {
      // Arrange
      const product = {
        id: 5,
        nameEn: 'Premium Widget',
        nameAr: 'أداة فاخرة',
        slug: 'premium-widget',
        sku: 'PW-005',
        currency: 'SYP',
        isFeatured: true,
        featuredPriority: 5,
        featuredBadge: 'NEW',
        featuredStartDate: new Date('2025-01-01'),
        featuredEndDate: new Date('2026-12-31'),
        isBestSeller: true,
        salesCount: 200,
        status: 'published',
        approvalStatus: 'approved',
        isActive: true,
        isPublished: true,
        createdAt: new Date('2025-06-15'),
        pricing: {
          basePrice: 50000,
          discountPrice: 35000,
          currency: 'SYP',
          isActive: true,
        },
        images: [{ imageUrl: 'https://example.com/widget.jpg' }],
        category: {
          id: 3,
          nameEn: 'Gadgets',
          nameAr: 'أدوات',
          slug: 'gadgets',
          parent: { id: 1 },
        },
        descriptions: [{ description: 'Best widget in town' }],
      };
      mockQueryBuilder.setMockData([product]);

      // Act
      const result = await service.getFeaturedProducts(5);

      // Assert
      const item = result.data[0];
      expect(item.id).toBe(5);
      expect(item.name_en).toBe('Premium Widget');
      expect(item.name_ar).toBe('أداة فاخرة');
      expect(item.slug).toBe('premium-widget');
      expect(item.sku).toBe('PW-005');
      expect(item.currency).toBe('SYP');
      expect(item.base_price).toBe(50000);
      expect(item.discount_price).toBe(35000);
      expect(item.discount_percentage).toBe(30); // (50000-35000)/50000 * 100 = 30
      expect(item.image_url).toBe('https://example.com/widget.jpg');
      expect(item.is_featured).toBe(true);
      expect(item.featured_priority).toBe(5);
      expect(item.featured_badge).toBe('NEW');
      expect(item.is_best_seller).toBe(true);
      expect(item.sales_count).toBe(200);
      expect(item.status).toBe('published');
      expect(item.approval_status).toBe('approved');
      expect(item.is_active).toBe(true);
      expect(item.is_published).toBe(true);
      expect(item.promotional_text).toBe('Best widget in town');
      expect(item.category).toEqual({
        id: 3,
        name_en: 'Gadgets',
        name_ar: 'أدوات',
        slug: 'gadgets',
        parent_id: 1,
      });
    });

    /** @description Should compute discount_percentage as 0 when basePrice is 0 */
    it('should compute discount_percentage as 0 when basePrice is 0', async () => {
      // Arrange
      const product = {
        id: 1,
        nameEn: 'Free Product',
        nameAr: 'منتج مجاني',
        slug: 'free',
        sku: 'FREE-001',
        currency: 'SYP',
        isFeatured: true,
        featuredPriority: 1,
        featuredBadge: null,
        featuredStartDate: null,
        featuredEndDate: null,
        isBestSeller: false,
        salesCount: 0,
        status: 'published',
        approvalStatus: 'approved',
        isActive: true,
        isPublished: true,
        createdAt: new Date(),
        pricing: {
          basePrice: 0,
          discountPrice: 0,
          currency: 'SYP',
          isActive: true,
        },
        images: [],
        category: null,
        descriptions: [],
      };
      mockQueryBuilder.setMockData([product]);

      // Act
      const result = await service.getFeaturedProducts(1);

      // Assert
      expect(result.data[0].discount_percentage).toBe(0);
    });

    /** @description Should use basePrice as discountPrice when discountPrice is falsy (0 or null) */
    it('should use basePrice as discount_price when discountPrice is falsy', async () => {
      // Arrange
      const product = {
        id: 1,
        nameEn: 'No Discount',
        nameAr: 'بدون خصم',
        slug: 'no-discount',
        sku: 'ND-001',
        currency: 'SYP',
        isFeatured: true,
        featuredPriority: 1,
        featuredBadge: null,
        featuredStartDate: null,
        featuredEndDate: null,
        isBestSeller: false,
        salesCount: 0,
        status: 'published',
        approvalStatus: 'approved',
        isActive: true,
        isPublished: true,
        createdAt: new Date(),
        pricing: {
          basePrice: 80000,
          discountPrice: null,
          currency: 'SYP',
          isActive: true,
        },
        images: [],
        category: null,
        descriptions: [],
      };
      mockQueryBuilder.setMockData([product]);

      // Act
      const result = await service.getFeaturedProducts(1);

      // Assert — discountPrice || basePrice = 80000
      expect(result.data[0].discount_price).toBe(80000);
      expect(result.data[0].discount_percentage).toBe(0);
    });

    /** @description Should return null image_url when product has no images */
    it('should return null image_url when product has no images', async () => {
      // Arrange
      const product = {
        id: 1,
        nameEn: 'No Image',
        nameAr: 'بدون صورة',
        slug: 'no-image',
        sku: 'NI-001',
        currency: 'SYP',
        isFeatured: true,
        featuredPriority: 1,
        featuredBadge: null,
        featuredStartDate: null,
        featuredEndDate: null,
        isBestSeller: false,
        salesCount: 0,
        status: 'published',
        approvalStatus: 'approved',
        isActive: true,
        isPublished: true,
        createdAt: new Date(),
        pricing: { basePrice: 1000, discountPrice: null, isActive: true },
        images: [],
        category: null,
        descriptions: [],
      };
      mockQueryBuilder.setMockData([product]);

      // Act
      const result = await service.getFeaturedProducts(1);

      // Assert
      expect(result.data[0].image_url).toBeNull();
    });

    /** @description Should return null category when product has no category */
    it('should return null category when product has no category', async () => {
      // Arrange
      const product = {
        id: 1,
        nameEn: 'No Category',
        nameAr: 'بدون فئة',
        slug: 'no-category',
        sku: 'NC-001',
        currency: 'SYP',
        isFeatured: true,
        featuredPriority: 1,
        featuredBadge: null,
        featuredStartDate: null,
        featuredEndDate: null,
        isBestSeller: false,
        salesCount: 0,
        status: 'published',
        approvalStatus: 'approved',
        isActive: true,
        isPublished: true,
        createdAt: new Date(),
        pricing: { basePrice: 1000, discountPrice: null, isActive: true },
        images: [],
        category: null,
        descriptions: [],
      };
      mockQueryBuilder.setMockData([product]);

      // Act
      const result = await service.getFeaturedProducts(1);

      // Assert
      expect(result.data[0].category).toBeNull();
    });

    /** @description Should return null parent_id when category has no parent */
    it('should return null parent_id when category has no parent', async () => {
      // Arrange
      const product = {
        id: 1,
        nameEn: 'Root Category Product',
        nameAr: 'منتج فئة رئيسية',
        slug: 'root-cat',
        sku: 'RC-001',
        currency: 'SYP',
        isFeatured: true,
        featuredPriority: 1,
        featuredBadge: null,
        featuredStartDate: null,
        featuredEndDate: null,
        isBestSeller: false,
        salesCount: 0,
        status: 'published',
        approvalStatus: 'approved',
        isActive: true,
        isPublished: true,
        createdAt: new Date(),
        pricing: { basePrice: 1000, discountPrice: null, isActive: true },
        images: [],
        category: {
          id: 1,
          nameEn: 'Root',
          nameAr: 'رئيسي',
          slug: 'root',
          parent: null,
        },
        descriptions: [],
      };
      mockQueryBuilder.setMockData([product]);

      // Act
      const result = await service.getFeaturedProducts(1);

      // Assert
      expect(result.data[0].category.parent_id).toBeNull();
    });

    /** @description Should return empty promotional_text when descriptions is empty */
    it('should return empty promotional_text when no descriptions exist', async () => {
      // Arrange
      const product = {
        id: 1,
        nameEn: 'No Desc',
        nameAr: 'بدون وصف',
        slug: 'no-desc',
        sku: 'NODESC-001',
        currency: 'SYP',
        isFeatured: true,
        featuredPriority: 1,
        featuredBadge: null,
        featuredStartDate: null,
        featuredEndDate: null,
        isBestSeller: false,
        salesCount: 0,
        status: 'published',
        approvalStatus: 'approved',
        isActive: true,
        isPublished: true,
        createdAt: new Date(),
        pricing: { basePrice: 1000, discountPrice: null, isActive: true },
        images: [],
        category: null,
        descriptions: [],
      };
      mockQueryBuilder.setMockData([product]);

      // Act
      const result = await service.getFeaturedProducts(1);

      // Assert
      expect(result.data[0].promotional_text).toBe('');
    });

    /** @description Should sanitize limit to minimum 1 and maximum 20 */
    it('should sanitize limit to min 1 and max 20', async () => {
      // Arrange
      mockQueryBuilder.setMockData([]);

      // Act — with excessive limit
      await service.getFeaturedProducts(50);

      // Assert
      expect(mockQueryBuilder.limitValue).toBe(20);
    });

    /** @description Should enforce minimum limit of 1 */
    it('should enforce minimum limit of 1 even when 0 is passed', async () => {
      // Arrange
      mockQueryBuilder.setMockData([]);

      // Act
      await service.getFeaturedProducts(0);

      // Assert — Math.max(1, 0 || 3) = Math.max(1, 3) = 3
      expect(mockQueryBuilder.limitValue).toBe(3);
    });

    /** @description Should default limit to 3 when not provided */
    it('should default limit to 3 when called without arguments', async () => {
      // Arrange
      mockQueryBuilder.setMockData([]);

      // Act
      await service.getFeaturedProducts();

      // Assert
      expect(mockQueryBuilder.limitValue).toBe(3);
    });

    /** @description Should apply categoryId filter when provided */
    it('should filter by categoryId when provided', async () => {
      // Arrange
      mockQueryBuilder.setMockData([]);

      // Act
      await service.getFeaturedProducts(3, 5);

      // Assert
      const catCall = mockQueryBuilder.andWhereCalls.find(
        (c) => c.condition === 'product.category_id = :categoryId',
      );
      expect(catCall).toBeDefined();
      expect(catCall!.params).toEqual({ categoryId: 5 });
    });

    /** @description Should apply parentCategoryId filter when provided */
    it('should filter by parentCategoryId when provided', async () => {
      // Arrange
      mockQueryBuilder.setMockData([]);

      // Act
      await service.getFeaturedProducts(3, undefined, 10);

      // Assert
      const parentCall = mockQueryBuilder.andWhereCalls.find((c) =>
        c.condition.includes('category.parent_id = :parentCategoryId'),
      );
      expect(parentCall).toBeDefined();
      expect(parentCall!.params).toEqual({ parentCategoryId: 10 });
    });

    /** @description Should not apply category filters when none provided */
    it('should not apply category or parent filters when not provided', async () => {
      // Arrange
      mockQueryBuilder.setMockData([]);

      // Act
      await service.getFeaturedProducts(3);

      // Assert
      const catCall = mockQueryBuilder.andWhereCalls.find(
        (c) => c.condition === 'product.category_id = :categoryId',
      );
      const parentCall = mockQueryBuilder.andWhereCalls.find((c) =>
        c.condition.includes('parent_id'),
      );
      expect(catCall).toBeUndefined();
      expect(parentCall).toBeUndefined();
    });

    /** @description Should apply date filtering for featured campaigns */
    it('should apply featured date range filters', async () => {
      // Arrange
      mockQueryBuilder.setMockData([]);

      // Act
      await service.getFeaturedProducts(3);

      // Assert — should contain both start and end date filters
      const startDateCall = mockQueryBuilder.andWhereCalls.find((c) =>
        c.condition.includes('featuredStartDate'),
      );
      const endDateCall = mockQueryBuilder.andWhereCalls.find((c) =>
        c.condition.includes('featuredEndDate'),
      );
      expect(startDateCall).toBeDefined();
      expect(endDateCall).toBeDefined();
    });

    /** @description Should order by createdAt DESC when sort is new_arrivals */
    it('should order by createdAt DESC when sort is new_arrivals', async () => {
      // Arrange
      mockQueryBuilder.setMockData([]);

      // Act
      await service.getFeaturedProducts(3, undefined, undefined, 'new_arrivals');

      // Assert
      const order = mockQueryBuilder.orderByCalls.find(
        (c) => c.column === 'product.createdAt' && c.direction === 'DESC',
      );
      expect(order).toBeDefined();
    });

    /** @description Should order by salesCount DESC then featuredPriority for best_seller */
    it('should order by salesCount DESC then featuredPriority for best_seller sort', async () => {
      // Arrange
      mockQueryBuilder.setMockData([]);

      // Act
      await service.getFeaturedProducts(
        3,
        undefined,
        undefined,
        'best_seller',
      );

      // Assert
      const salesOrder = mockQueryBuilder.orderByCalls.find(
        (c) => c.column === 'product.salesCount' && c.direction === 'DESC',
      );
      expect(salesOrder).toBeDefined();

      const priorityOrder = mockQueryBuilder.addOrderByCalls.find(
        (c) =>
          c.column === 'product.featuredPriority' && c.direction === 'DESC',
      );
      expect(priorityOrder).toBeDefined();

      const dateOrder = mockQueryBuilder.addOrderByCalls.find(
        (c) => c.column === 'product.createdAt' && c.direction === 'DESC',
      );
      expect(dateOrder).toBeDefined();
    });

    /** @description Should order by featuredPriority DESC then createdAt for default featured sort */
    it('should order by featuredPriority DESC then createdAt for default (featured) sort', async () => {
      // Arrange
      mockQueryBuilder.setMockData([]);

      // Act
      await service.getFeaturedProducts(3, undefined, undefined, 'featured');

      // Assert
      const priorityOrder = mockQueryBuilder.orderByCalls.find(
        (c) =>
          c.column === 'product.featuredPriority' && c.direction === 'DESC',
      );
      expect(priorityOrder).toBeDefined();

      const dateOrder = mockQueryBuilder.addOrderByCalls.find(
        (c) => c.column === 'product.createdAt' && c.direction === 'DESC',
      );
      expect(dateOrder).toBeDefined();
    });

    /** @description Should handle pricing with null values gracefully */
    it('should handle null pricing gracefully and default basePrice to 0', async () => {
      // Arrange
      const product = {
        id: 1,
        nameEn: 'No Pricing',
        nameAr: 'بدون سعر',
        slug: 'no-pricing',
        sku: 'NP-001',
        currency: 'SYP',
        isFeatured: true,
        featuredPriority: 1,
        featuredBadge: null,
        featuredStartDate: null,
        featuredEndDate: null,
        isBestSeller: false,
        salesCount: 0,
        status: 'published',
        approvalStatus: 'approved',
        isActive: true,
        isPublished: true,
        createdAt: new Date(),
        pricing: null,
        images: [],
        category: null,
        descriptions: [],
      };
      mockQueryBuilder.setMockData([product]);

      // Act
      const result = await service.getFeaturedProducts(1);

      // Assert
      expect(result.data[0].base_price).toBe(0);
      expect(result.data[0].discount_price).toBe(0);
      expect(result.data[0].discount_percentage).toBe(0);
    });

    /** @description Should return empty data array when no featured products exist */
    it('should return empty data array when no featured products exist', async () => {
      // Arrange
      mockQueryBuilder.setMockData([]);

      // Act
      const result = await service.getFeaturedProducts(3);

      // Assert
      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
    });
  });
});
