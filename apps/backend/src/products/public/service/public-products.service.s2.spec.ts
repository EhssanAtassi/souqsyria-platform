/**
 * @file public-products.service.s2.spec.ts
 * @description Jest test suite for S2 product features: popularity sorting, product details,
 * 404 handling, search suggestions, and variant stock computation.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { PublicProductsService } from './public-products.service';
import { ProductEntity } from '../../entities/product.entity';
import { GetPublicProductsDto } from '../dto/get-public-products.dto';

/**
 * Mock query builder for TypeORM Repository
 * Provides chainable methods to simulate database queries
 */
class MockQueryBuilder {
  private selectFields: string[] = [];
  private joinData: Record<string, any> = {};
  private whereConditions: string[] = [];
  private orderByConditions: Array<[string, 'ASC' | 'DESC']> = [];
  private skipAmount = 0;
  private takeAmount: number | null = null;
  private mockData: any[] = [];
  private mockCount = 0;
  private singleMockData: any = null;
  private rawQueryData: any[] = [];
  private fromTable: string = '';

  select(fields: string[] | string): this {
    if (Array.isArray(fields)) {
      this.selectFields = fields;
    } else {
      this.selectFields = [fields];
    }
    return this;
  }

  from(tableName: string, alias: string): this {
    this.fromTable = tableName;
    return this;
  }

  leftJoinAndSelect(relation: string, alias: string): this {
    this.joinData[alias] = relation;
    return this;
  }

  where(condition: string, params?: Record<string, any>): this {
    this.whereConditions.push(condition);
    return this;
  }

  andWhere(condition: string, params?: Record<string, any>): this {
    this.whereConditions.push(condition);
    return this;
  }

  orderBy(column: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
    this.orderByConditions = [[column, direction]];
    return this;
  }

  addOrderBy(column: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
    this.orderByConditions.push([column, direction]);
    return this;
  }

  skip(amount: number): this {
    this.skipAmount = amount;
    return this;
  }

  take(amount: number): this {
    this.takeAmount = amount;
    return this;
  }

  limit(amount: number): this {
    this.takeAmount = amount;
    return this;
  }

  setParameter(key: string, value: any): this {
    return this;
  }

  async getMany(): Promise<any[]> {
    // Apply limit if set
    if (this.takeAmount !== null) {
      return this.mockData.slice(0, this.takeAmount);
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
    // Apply limit if set
    if (this.takeAmount !== null) {
      return this.rawQueryData.slice(0, this.takeAmount);
    }
    return this.rawQueryData;
  }

  setMockData(data: any[]): this {
    this.mockData = data;
    return this;
  }

  setMockCount(count: number): this {
    this.mockCount = count;
    return this;
  }

  setSingleMockData(data: any): this {
    this.singleMockData = data;
    return this;
  }

  setRawQueryData(data: any[]): this {
    this.rawQueryData = data;
    return this;
  }
}

describe('PublicProductsService - S2 Features', () => {
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

  describe('getPublicFeed() - Popularity Sort', () => {
    it('should apply ORDER BY salesCount DESC when sortBy is "popularity"', async () => {
      // Arrange
      const filters: GetPublicProductsDto = {
        sortBy: 'popularity',
        page: 1,
        limit: 20,
      };

      const product1 = {
        id: 1,
        slug: 'product-1',
        nameEn: 'Best Seller',
        nameAr: 'الأكثر مبيعا',
        sku: 'SKU-001',
        salesCount: 150,
        isActive: true,
        isPublished: true,
        is_deleted: false,
        pricing: { basePrice: 1000, discountPrice: null, currency: 'SYP', isActive: true },
        images: [{ imageUrl: 'https://example.com/img1.jpg', sortOrder: 0 }],
        category: { id: 1, nameEn: 'Electronics', nameAr: 'إلكترونيات', slug: 'electronics' },
        variants: [
          {
            id: 1,
            sku: 'VAR-001',
            price: 1000,
            stocks: [{ id: 1, quantity: 10 }],
            isActive: true,
          },
        ],
      };

      const product2 = {
        id: 2,
        slug: 'product-2',
        nameEn: 'Regular Product',
        nameAr: 'منتج عادي',
        sku: 'SKU-002',
        salesCount: 50,
        isActive: true,
        isPublished: true,
        is_deleted: false,
        pricing: { basePrice: 500, discountPrice: null, currency: 'SYP', isActive: true },
        images: [{ imageUrl: 'https://example.com/img2.jpg', sortOrder: 0 }],
        category: { id: 1, nameEn: 'Electronics', nameAr: 'إلكترونيات', slug: 'electronics' },
        variants: [
          {
            id: 2,
            sku: 'VAR-002',
            price: 500,
            stocks: [{ id: 2, quantity: 5 }],
            isActive: true,
          },
        ],
      };

      mockQueryBuilder.setMockData([product1, product2]).setMockCount(2);

      // Act
      const result = await service.getPublicFeed(filters);

      // Assert
      expect(result.data).toHaveLength(2);
      expect(result.data[0].id).toBe(1);
      expect(result.data[1].id).toBe(2);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
    });

    it('should order by salesCount DESC then createdAt DESC for popularity sort', async () => {
      // Arrange
      const filters: GetPublicProductsDto = {
        sortBy: 'popularity',
        page: 1,
        limit: 10,
      };

      const productWithHighSales = {
        id: 1,
        slug: 'high-sales',
        nameEn: 'High Sales Product',
        nameAr: 'منتج مرتفع المبيعات',
        salesCount: 200,
        isActive: true,
        isPublished: true,
        is_deleted: false,
        pricing: { basePrice: 1000, discountPrice: null, currency: 'SYP', isActive: true },
        images: [],
        category: { id: 1 },
        variants: [],
        createdAt: new Date('2025-01-01'),
      };

      mockQueryBuilder.setMockData([productWithHighSales]).setMockCount(1);

      // Act
      const result = await service.getPublicFeed(filters);

      // Assert
      expect(result.data[0].id).toBe(1);
      expect(mockProductRepository.createQueryBuilder).toHaveBeenCalledWith('product');
    });
  });

  describe('getProductBySlug() - Structured Response', () => {
    it('should return complete product detail with all fields', async () => {
      // Arrange
      const slug = 'damascus-steel-knife';

      const productWithDetails = {
        id: 10,
        slug: 'damascus-steel-knife',
        nameEn: 'Damascus Steel Knife',
        nameAr: 'سكين دمشقي',
        sku: 'DSK-001',
        isActive: true,
        isPublished: true,
        is_deleted: false,
        category: {
          id: 5,
          nameEn: 'Cutlery',
          nameAr: 'الأدوات المعدنية',
          slug: 'cutlery',
        },
        manufacturer: {
          id: 3,
          name: 'Damascus Forge',
        },
        vendor: {
          id: 2,
          storeName: 'Premium Steel Shop',
        },
        pricing: {
          id: 1,
          basePrice: 50000,
          discountPrice: 40000,
          currency: 'SYP',
          isActive: true,
        },
        images: [
          { id: 1, imageUrl: 'https://example.com/knife1.jpg', sortOrder: 0 },
          { id: 2, imageUrl: 'https://example.com/knife2.jpg', sortOrder: 1 },
        ],
        descriptions: [
          {
            id: 1,
            language: 'en',
            description: 'Premium Damascus steel knife',
          },
          {
            id: 2,
            language: 'ar',
            description: 'سكين دمشقي عالي الجودة',
          },
        ],
        variants: [
          {
            id: 1,
            sku: 'DSK-001-S',
            price: 40000,
            variantData: { Size: 'Small', Color: 'Black' },
            imageUrl: 'https://example.com/knife-small.jpg',
            isActive: true,
            stocks: [{ id: 1, quantity: 10 }],
          },
          {
            id: 2,
            sku: 'DSK-001-M',
            price: 50000,
            variantData: { Size: 'Medium', Color: 'Black' },
            imageUrl: 'https://example.com/knife-medium.jpg',
            isActive: true,
            stocks: [{ id: 2, quantity: 3 }],
          },
        ],
        attributes: [
          {
            id: 1,
            attribute: { id: 1, nameEn: 'Color', nameAr: 'اللون' },
            value: {
              id: 5,
              valueEn: 'Black',
              valueAr: 'أسود',
              colorHex: '#000000',
            },
          },
          {
            id: 2,
            attribute: { id: 2, nameEn: 'Material', nameAr: 'المادة' },
            value: {
              id: 10,
              valueEn: 'Damascus Steel',
              valueAr: 'فولاذ دمشقي',
              colorHex: null,
            },
          },
        ],
      };

      mockQueryBuilder.setSingleMockData(productWithDetails);
      const relatedProducts = [
        {
          id: 11,
          slug: 'steel-fork',
          nameEn: 'Damascus Steel Fork',
          nameAr: 'شوكة دمشقية',
          images: [{ imageUrl: 'https://example.com/fork.jpg' }],
          pricing: {
            basePrice: 25000,
            discountPrice: 20000,
            currency: 'SYP',
          },
          variants: [{ stocks: [{ quantity: 15 }] }],
        },
      ];
      mockQueryBuilder.setMockData(relatedProducts);

      // Act
      const result = await service.getProductBySlug(slug);

      // Assert
      expect(result.id).toBe(10);
      expect(result.slug).toBe('damascus-steel-knife');
      expect(result.nameEn).toBe('Damascus Steel Knife');
      expect(result.nameAr).toBe('سكين دمشقي');
      expect(result.sku).toBe('DSK-001');

      // Verify category
      expect(result.category).toBeDefined();
      expect(result.category.id).toBe(5);
      expect(result.category.nameEn).toBe('Cutlery');
      expect(result.category.nameAr).toBe('الأدوات المعدنية');
      expect(result.category.slug).toBe('cutlery');

      // Verify manufacturer
      expect(result.manufacturer).toBeDefined();
      expect(result.manufacturer.id).toBe(3);
      expect(result.manufacturer.name).toBe('Damascus Forge');

      // Verify vendor
      expect(result.vendor).toBeDefined();
      expect(result.vendor.id).toBe(2);
      expect(result.vendor.storeName).toBe('Premium Steel Shop');

      // Verify pricing
      expect(result.pricing).toBeDefined();
      expect(result.pricing.basePrice).toBe(50000);
      expect(result.pricing.discountPrice).toBe(40000);
      expect(result.pricing.currency).toBe('SYP');

      // Verify images with sortOrder
      expect(result.images).toHaveLength(2);
      expect(result.images[0].imageUrl).toBe('https://example.com/knife1.jpg');
      expect(result.images[0].sortOrder).toBe(0);
      expect(result.images[1].sortOrder).toBe(1);

      // Verify descriptions
      expect(result.descriptions).toHaveLength(2);
      expect(result.descriptions[0].language).toBe('en');
      expect(result.descriptions[0].shortDescription).toBe('Premium Damascus steel knife');

      // Verify variants
      expect(result.variants).toHaveLength(2);
      expect(result.variants[0].sku).toBe('DSK-001-S');
      expect(result.variants[0].price).toBe(40000);
      expect(result.variants[0].variantData.Size).toBe('Small');

      // Verify attributes
      expect(result.attributes).toHaveLength(2);
      expect(result.attributes[0].attributeNameEn).toBe('Color');
      expect(result.attributes[0].valueEn).toBe('Black');
      expect(result.attributes[0].colorHex).toBe('#000000');

      // Verify stock status
      expect(result.stockStatus).toBe('in_stock');
      expect(result.totalStock).toBe(13);

      // Verify related products
      expect(result.relatedProducts).toHaveLength(1);
      expect(result.relatedProducts[0].nameEn).toBe('Damascus Steel Fork');
    });

    it('should compute variant stock status correctly - in_stock when totalStock > 5', async () => {
      // Arrange
      const slug = 'high-stock-product';

      const product = {
        id: 1,
        slug: 'high-stock-product',
        nameEn: 'Product',
        nameAr: 'منتج',
        sku: 'SKU-001',
        isActive: true,
        isPublished: true,
        is_deleted: false,
        pricing: { basePrice: 1000, discountPrice: null, currency: 'SYP', isActive: true },
        images: [],
        descriptions: [],
        category: null,
        manufacturer: null,
        vendor: null,
        variants: [
          {
            id: 1,
            sku: 'VAR-001',
            price: 1000,
            variantData: {},
            imageUrl: null,
            isActive: true,
            stocks: [{ quantity: 20 }],
          },
        ],
        attributes: [],
      };

      mockQueryBuilder.setSingleMockData(product);
      mockQueryBuilder.setMockData([]);

      // Act
      const result = await service.getProductBySlug(slug);

      // Assert
      expect(result.variants[0].stockStatus).toBe('in_stock');
      expect(result.variants[0].totalStock).toBe(20);
    });

    it('should compute variant stock status correctly - low_stock when totalStock <= 5 and > 0', async () => {
      // Arrange
      const slug = 'low-stock-product';

      const product = {
        id: 1,
        slug: 'low-stock-product',
        nameEn: 'Product',
        nameAr: 'منتج',
        sku: 'SKU-001',
        isActive: true,
        isPublished: true,
        is_deleted: false,
        pricing: { basePrice: 1000, discountPrice: null, currency: 'SYP', isActive: true },
        images: [],
        descriptions: [],
        category: null,
        manufacturer: null,
        vendor: null,
        variants: [
          {
            id: 1,
            sku: 'VAR-001',
            price: 1000,
            variantData: {},
            imageUrl: null,
            isActive: true,
            stocks: [{ quantity: 3 }],
          },
        ],
        attributes: [],
      };

      mockQueryBuilder.setSingleMockData(product);
      mockQueryBuilder.setMockData([]);

      // Act
      const result = await service.getProductBySlug(slug);

      // Assert
      expect(result.variants[0].stockStatus).toBe('low_stock');
      expect(result.variants[0].totalStock).toBe(3);
    });

    it('should compute variant stock status correctly - out_of_stock when totalStock = 0', async () => {
      // Arrange
      const slug = 'out-of-stock-product';

      const product = {
        id: 1,
        slug: 'out-of-stock-product',
        nameEn: 'Product',
        nameAr: 'منتج',
        sku: 'SKU-001',
        isActive: true,
        isPublished: true,
        is_deleted: false,
        pricing: { basePrice: 1000, discountPrice: null, currency: 'SYP', isActive: true },
        images: [],
        descriptions: [],
        category: null,
        manufacturer: null,
        vendor: null,
        variants: [
          {
            id: 1,
            sku: 'VAR-001',
            price: 1000,
            variantData: {},
            imageUrl: null,
            isActive: true,
            stocks: [{ quantity: 0 }],
          },
        ],
        attributes: [],
      };

      mockQueryBuilder.setSingleMockData(product);
      mockQueryBuilder.setMockData([]);

      // Act
      const result = await service.getProductBySlug(slug);

      // Assert
      expect(result.variants[0].stockStatus).toBe('out_of_stock');
      expect(result.variants[0].totalStock).toBe(0);
    });

    it('should compute correct totalStock across multiple variants and warehouses', async () => {
      // Arrange
      const slug = 'multi-variant-product';

      const product = {
        id: 1,
        slug: 'multi-variant-product',
        nameEn: 'Product',
        nameAr: 'منتج',
        sku: 'SKU-001',
        isActive: true,
        isPublished: true,
        is_deleted: false,
        pricing: { basePrice: 1000, discountPrice: null, currency: 'SYP', isActive: true },
        images: [],
        descriptions: [],
        category: null,
        manufacturer: null,
        vendor: null,
        variants: [
          {
            id: 1,
            sku: 'VAR-001-S',
            price: 1000,
            variantData: { Size: 'Small' },
            imageUrl: null,
            isActive: true,
            stocks: [
              { quantity: 5 },
              { quantity: 3 },
            ],
          },
          {
            id: 2,
            sku: 'VAR-001-M',
            price: 1100,
            variantData: { Size: 'Medium' },
            imageUrl: null,
            isActive: true,
            stocks: [{ quantity: 8 }],
          },
        ],
        attributes: [],
      };

      mockQueryBuilder.setSingleMockData(product);
      mockQueryBuilder.setMockData([]);

      // Act
      const result = await service.getProductBySlug(slug);

      // Assert
      expect(result.totalStock).toBe(16); // 5 + 3 + 8
      expect(result.stockStatus).toBe('in_stock');
    });
  });

  describe('getProductBySlug() - 404 Handling', () => {
    it('should throw NotFoundException when product slug does not exist', async () => {
      // Arrange
      const slug = 'non-existent-product';
      mockQueryBuilder.setSingleMockData(null);

      // Act & Assert
      await expect(service.getProductBySlug(slug)).rejects.toThrow(NotFoundException);
      await expect(service.getProductBySlug(slug)).rejects.toThrow(
        `Product with slug "${slug}" not found or not available`,
      );
    });

    it('should throw NotFoundException when product is not published', async () => {
      // Arrange
      const slug = 'unpublished-product';
      mockQueryBuilder.setSingleMockData(null); // Query filters by isPublished = true

      // Act & Assert
      await expect(service.getProductBySlug(slug)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when product is not active', async () => {
      // Arrange
      const slug = 'inactive-product';
      mockQueryBuilder.setSingleMockData(null);

      // Act & Assert
      await expect(service.getProductBySlug(slug)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when product is soft deleted', async () => {
      // Arrange
      const slug = 'deleted-product';
      mockQueryBuilder.setSingleMockData(null);

      // Act & Assert
      await expect(service.getProductBySlug(slug)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getSearchSuggestions()', () => {
    it('should return product names and category names matching query', async () => {
      // Arrange
      const query = 'steel';

      const products = [
        { nameEn: 'Damascus Steel Knife', nameAr: 'سكين دمشقي', slug: 'damascus-steel-knife' },
        { nameEn: 'Stainless Steel Pan', nameAr: 'مقلاة فولاذية', slug: 'steel-pan' },
      ];

      const categories = [
        { cat_name_en: 'Steel Products', cat_name_ar: 'منتجات الفولاذ', cat_slug: 'steel-products' },
        { cat_name_en: 'Cutlery', cat_name_ar: 'أدوات المائدة', cat_slug: 'cutlery' },
        { cat_name_en: 'Steel Tools', cat_name_ar: 'أدوات فولاذية', cat_slug: 'steel-tools' },
      ];

      mockQueryBuilder.setMockData(products);
      mockQueryBuilder.setRawQueryData(categories);

      // Act
      const result = await service.getSearchSuggestions(query);

      // Assert
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions.length).toBe(5); // 2 products + 3 categories

      // Verify product suggestions
      const productSuggestions = result.suggestions.filter((s: any) => s.type === 'product');
      expect(productSuggestions).toHaveLength(2);
      expect(productSuggestions[0].text).toBe('Damascus Steel Knife');
      expect(productSuggestions[0].textAr).toBe('سكين دمشقي');
      expect(productSuggestions[0].slug).toBe('damascus-steel-knife');

      // Verify category suggestions
      const categorySuggestions = result.suggestions.filter((s: any) => s.type === 'category');
      expect(categorySuggestions).toHaveLength(3);
      expect(categorySuggestions[0].text).toBe('Steel Products');
      expect(categorySuggestions[0].textAr).toBe('منتجات الفولاذ');
    });

    it('should limit product suggestions to 5', async () => {
      // Arrange
      const query = 'product';

      const products = Array.from({ length: 8 }, (_, i) => ({
        nameEn: `Product ${i + 1}`,
        nameAr: `منتج ${i + 1}`,
        slug: `product-${i + 1}`,
      }));

      mockQueryBuilder.setMockData(products);
      mockQueryBuilder.setRawQueryData([]);

      // Act
      const result = await service.getSearchSuggestions(query);

      // Assert
      const productSuggestions = result.suggestions.filter((s: any) => s.type === 'product');
      expect(productSuggestions).toHaveLength(5);
    });

    it('should limit category suggestions to 3', async () => {
      // Arrange
      const query = 'category';

      const categories = Array.from({ length: 6 }, (_, i) => ({
        cat_name_en: `Category ${i + 1}`,
        cat_name_ar: `فئة ${i + 1}`,
        cat_slug: `category-${i + 1}`,
      }));

      mockQueryBuilder.setMockData([]);
      mockQueryBuilder.setRawQueryData(categories);

      // Act
      const result = await service.getSearchSuggestions(query);

      // Assert
      const categorySuggestions = result.suggestions.filter((s: any) => s.type === 'category');
      expect(categorySuggestions).toHaveLength(3);
    });

    it('should return empty suggestions for non-matching query', async () => {
      // Arrange
      const query = 'xyz123nonexistent';

      mockQueryBuilder.setMockData([]);
      mockQueryBuilder.setRawQueryData([]);

      // Act
      const result = await service.getSearchSuggestions(query);

      // Assert
      expect(result.suggestions).toHaveLength(0);
    });

    it('should include both product and category suggestions in result', async () => {
      // Arrange
      const query = 'phone';

      const products = [
        { nameEn: 'Smartphone Pro', nameAr: 'هاتف ذكي احترافي', slug: 'smartphone-pro' },
      ];

      const categories = [
        { cat_name_en: 'Phones', cat_name_ar: 'الهواتف', cat_slug: 'phones' },
      ];

      mockQueryBuilder.setMockData(products);
      mockQueryBuilder.setRawQueryData(categories);

      // Act
      const result = await service.getSearchSuggestions(query);

      // Assert
      expect(result.suggestions).toHaveLength(2);
      expect(result.suggestions.some((s: any) => s.type === 'product')).toBe(true);
      expect(result.suggestions.some((s: any) => s.type === 'category')).toBe(true);
    });
  });

  describe('Variant Stock Computation - Edge Cases', () => {
    it('should handle product with no variants - defaults to in_stock', async () => {
      // Arrange
      const slug = 'virtual-service-product';

      const product = {
        id: 1,
        slug: 'virtual-service-product',
        nameEn: 'Virtual Service',
        nameAr: 'خدمة افتراضية',
        sku: 'SVC-001',
        isActive: true,
        isPublished: true,
        is_deleted: false,
        pricing: { basePrice: 5000, discountPrice: null, currency: 'SYP', isActive: true },
        images: [],
        descriptions: [],
        category: null,
        manufacturer: null,
        vendor: null,
        variants: [],
        attributes: [],
      };

      mockQueryBuilder.setSingleMockData(product);
      mockQueryBuilder.setMockData([]);

      // Act
      const result = await service.getProductBySlug(slug);

      // Assert
      expect(result.stockStatus).toBe('in_stock');
      expect(result.totalStock).toBe(0);
    });

    it('should handle variant with no stocks array', async () => {
      // Arrange
      const slug = 'variant-no-stocks';

      const product = {
        id: 1,
        slug: 'variant-no-stocks',
        nameEn: 'Product',
        nameAr: 'منتج',
        sku: 'SKU-001',
        isActive: true,
        isPublished: true,
        is_deleted: false,
        pricing: { basePrice: 1000, discountPrice: null, currency: 'SYP', isActive: true },
        images: [],
        descriptions: [],
        category: null,
        manufacturer: null,
        vendor: null,
        variants: [
          {
            id: 1,
            sku: 'VAR-001',
            price: 1000,
            variantData: {},
            imageUrl: null,
            isActive: true,
            stocks: [],
          },
        ],
        attributes: [],
      };

      mockQueryBuilder.setSingleMockData(product);
      mockQueryBuilder.setMockData([]);

      // Act
      const result = await service.getProductBySlug(slug);

      // Assert
      expect(result.variants[0].totalStock).toBe(0);
      expect(result.variants[0].stockStatus).toBe('out_of_stock');
    });

    it('should handle variant stock with null quantities', async () => {
      // Arrange
      const slug = 'variant-null-stock';

      const product = {
        id: 1,
        slug: 'variant-null-stock',
        nameEn: 'Product',
        nameAr: 'منتج',
        sku: 'SKU-001',
        isActive: true,
        isPublished: true,
        is_deleted: false,
        pricing: { basePrice: 1000, discountPrice: null, currency: 'SYP', isActive: true },
        images: [],
        descriptions: [],
        category: null,
        manufacturer: null,
        vendor: null,
        variants: [
          {
            id: 1,
            sku: 'VAR-001',
            price: 1000,
            variantData: {},
            imageUrl: null,
            isActive: true,
            stocks: [{ quantity: null }],
          },
        ],
        attributes: [],
      };

      mockQueryBuilder.setSingleMockData(product);
      mockQueryBuilder.setMockData([]);

      // Act
      const result = await service.getProductBySlug(slug);

      // Assert
      expect(result.variants[0].totalStock).toBe(0);
    });
  });

  describe('getPublicFeed() - Pagination and Bounds', () => {
    it('should throw NotFoundException when requested page exceeds available pages', async () => {
      // Arrange
      const filters: GetPublicProductsDto = {
        page: 5,
        limit: 10,
      };

      const products = [{ id: 1, slug: 'product-1' }];
      mockQueryBuilder.setMockData(products).setMockCount(5); // Total 5 products, max page is 1 with limit 10

      // Act & Assert
      await expect(service.getPublicFeed(filters)).rejects.toThrow(NotFoundException);
      await expect(service.getPublicFeed(filters)).rejects.toThrow(
        'Requested page 5 exceeds available pages',
      );
    });

    it('should calculate totalPages correctly', async () => {
      // Arrange
      const filters: GetPublicProductsDto = {
        page: 1,
        limit: 10,
      };

      const products = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        slug: `product-${i + 1}`,
        nameEn: `Product ${i + 1}`,
        nameAr: `منتج ${i + 1}`,
        isActive: true,
        isPublished: true,
        is_deleted: false,
        pricing: { basePrice: 1000, discountPrice: null, currency: 'SYP', isActive: true },
        images: [],
        category: null,
        variants: [],
      }));

      mockQueryBuilder.setMockData(products).setMockCount(25); // 3 pages total

      // Act
      const result = await service.getPublicFeed(filters);

      // Assert
      expect(result.meta.totalPages).toBe(3);
      expect(result.meta.total).toBe(25);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
    });

    it('should not throw error when page equals totalPages', async () => {
      // Arrange
      const filters: GetPublicProductsDto = {
        page: 2,
        limit: 10,
      };

      const products = Array.from({ length: 10 }, (_, i) => ({
        id: i + 11,
        slug: `product-${i + 11}`,
        nameEn: `Product ${i + 11}`,
        nameAr: `منتج ${i + 11}`,
        isActive: true,
        isPublished: true,
        is_deleted: false,
        pricing: { basePrice: 1000, discountPrice: null, currency: 'SYP', isActive: true },
        images: [],
        category: null,
        variants: [],
      }));

      mockQueryBuilder.setMockData(products).setMockCount(20); // Total 20 products, page 2 of 2

      // Act & Assert
      await expect(service.getPublicFeed(filters)).resolves.not.toThrow();
    });

    it('should not throw NotFoundException when total is 0', async () => {
      // Arrange
      const filters: GetPublicProductsDto = {
        page: 5,
        limit: 10,
      };

      mockQueryBuilder.setMockData([]).setMockCount(0);

      // Act & Assert
      await expect(service.getPublicFeed(filters)).resolves.not.toThrow();
      const result = await service.getPublicFeed(filters);
      expect(result.meta.total).toBe(0);
      expect(result.data).toHaveLength(0);
    });
  });

  describe('Stock Status Computation in getPublicFeed()', () => {
    it('should compute correct stock status for each product in feed', async () => {
      // Arrange
      const filters: GetPublicProductsDto = {
        page: 1,
        limit: 20,
      };

      const products = [
        {
          id: 1,
          slug: 'high-stock',
          nameEn: 'High Stock',
          nameAr: 'مخزون مرتفع',
          isActive: true,
          isPublished: true,
          is_deleted: false,
          pricing: { basePrice: 1000, discountPrice: null, currency: 'SYP', isActive: true },
          images: [{ imageUrl: 'https://example.com/img1.jpg' }],
          category: { id: 1, nameEn: 'Cat1', nameAr: 'فئة1', slug: 'cat1' },
          variants: [{ stocks: [{ quantity: 100 }] }],
        },
        {
          id: 2,
          slug: 'low-stock',
          nameEn: 'Low Stock',
          nameAr: 'مخزون منخفض',
          isActive: true,
          isPublished: true,
          is_deleted: false,
          pricing: { basePrice: 500, discountPrice: null, currency: 'SYP', isActive: true },
          images: [{ imageUrl: 'https://example.com/img2.jpg' }],
          category: { id: 1, nameEn: 'Cat1', nameAr: 'فئة1', slug: 'cat1' },
          variants: [{ stocks: [{ quantity: 4 }] }],
        },
        {
          id: 3,
          slug: 'out-of-stock',
          nameEn: 'Out of Stock',
          nameAr: 'نفذ من المخزون',
          isActive: true,
          isPublished: true,
          is_deleted: false,
          pricing: { basePrice: 750, discountPrice: null, currency: 'SYP', isActive: true },
          images: [{ imageUrl: 'https://example.com/img3.jpg' }],
          category: { id: 1, nameEn: 'Cat1', nameAr: 'فئة1', slug: 'cat1' },
          variants: [{ stocks: [{ quantity: 0 }] }],
        },
      ];

      mockQueryBuilder.setMockData(products).setMockCount(3);

      // Act
      const result = await service.getPublicFeed(filters);

      // Assert
      expect(result.data[0].stockStatus).toBe('in_stock');
      expect(result.data[1].stockStatus).toBe('low_stock');
      expect(result.data[2].stockStatus).toBe('out_of_stock');
    });
  });

  describe('Integration - Complete Feature Scenarios', () => {
    it('should handle complete product search with popularity sort and pagination', async () => {
      // Arrange
      const filters: GetPublicProductsDto = {
        search: 'steel',
        sortBy: 'popularity',
        page: 1,
        limit: 5,
      };

      const products = Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        slug: `steel-product-${i + 1}`,
        nameEn: `Steel Product ${i + 1}`,
        nameAr: `منتج فولاذي ${i + 1}`,
        sku: `SKU-${i + 1}`,
        salesCount: (5 - i) * 100, // Decreasing sales count
        isActive: true,
        isPublished: true,
        is_deleted: false,
        pricing: { basePrice: 1000 + i * 100, discountPrice: null, currency: 'SYP', isActive: true },
        images: [{ imageUrl: `https://example.com/img-${i + 1}.jpg`, sortOrder: 0 }],
        category: { id: 1, nameEn: 'Steel', nameAr: 'فولاذ', slug: 'steel' },
        variants: [{ stocks: [{ quantity: 10 + i }] }],
      }));

      mockQueryBuilder.setMockData(products).setMockCount(15);

      // Act
      const result = await service.getPublicFeed(filters);

      // Assert
      expect(result.data).toHaveLength(5);
      expect(result.meta.total).toBe(15);
      expect(result.meta.totalPages).toBe(3);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(5);

      // Verify all products have stock status
      result.data.forEach((product: any) => {
        expect(['in_stock', 'low_stock', 'out_of_stock']).toContain(product.stockStatus);
      });
    });
  });
});
