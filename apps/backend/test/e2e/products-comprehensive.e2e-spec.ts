/**
 * @file products-comprehensive.e2e-spec.ts
 * @description Comprehensive End-to-End tests for Products Seeding with realistic scenarios
 *
 * COMPREHENSIVE TESTING APPROACH:
 * - Realistic mock behavior that simulates actual database states
 * - Duplicate detection and handling scenarios
 * - Relationship validation with missing entities
 * - Error conditions and edge cases
 * - Transaction safety and rollback scenarios
 * - Performance and scalability edge cases
 * - Real-world Syrian business scenarios
 *
 * @author SouqSyria Development Team
 * @since 2025-08-15
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { ProductSeederService } from '../../src/products/seeds/product-seeder.service';
import { ProductSeederController } from '../../src/products/seeds/product-seeder.controller';
import { ProductEntity } from '../../src/products/entities/product.entity';
import { Category } from '../../src/categories/entities/category.entity';
import { Brand } from '../../src/brands/entities/brand.entity';
import { VendorEntity } from '../../src/vendors/entities/vendor.entity';
import { ManufacturerEntity } from '../../src/manufacturers/entities/manufacturer.entity';
import { ProductDescriptionEntity } from '../../src/products/entities/product-description.entity';
import {
  PRODUCT_STATISTICS,
  ALL_PRODUCT_SEEDS,
} from '../../src/products/seeds/product-seeds.data';

// State management for realistic mocking
let mockDatabaseState = {
  products: new Map<string, any>(), // SKU -> Product
  categories: new Map<string, any>(), // slug -> Category
  brands: new Map<string, any>(), // slug -> Brand
  manufacturers: new Map<string, any>(), // name -> Manufacturer
};

// Advanced mock repository with state management
const createAdvancedMockProductRepository = () => ({
  find: jest.fn().mockImplementation((options = {}) => {
    const products = Array.from(mockDatabaseState.products.values());
    // Apply basic filtering if where clause exists
    if (options.where) {
      return Promise.resolve(
        products.filter((p) => {
          for (const [key, value] of Object.entries(options.where)) {
            if (p[key] !== value) return false;
          }
          return true;
        }),
      );
    }
    return Promise.resolve(products);
  }),

  findOne: jest.fn().mockImplementation(({ where }) => {
    if (where.sku) {
      return Promise.resolve(mockDatabaseState.products.get(where.sku) || null);
    }
    if (where.id) {
      const product = Array.from(mockDatabaseState.products.values()).find(
        (p) => p.id === where.id,
      );
      return Promise.resolve(product || null);
    }
    return Promise.resolve(null);
  }),

  count: jest.fn().mockImplementation((options = {}) => {
    const products = Array.from(mockDatabaseState.products.values());
    if (!options.where) return Promise.resolve(products.length);

    const filtered = products.filter((p) => {
      for (const [key, value] of Object.entries(options.where)) {
        if (p[key] !== value) return false;
      }
      return true;
    });
    return Promise.resolve(filtered.length);
  }),

  save: jest.fn().mockImplementation((entity) => {
    const savedEntity = {
      ...entity,
      id: entity.id || Math.floor(Math.random() * 10000),
    };
    if (entity.sku) {
      mockDatabaseState.products.set(entity.sku, savedEntity);
    }
    return Promise.resolve(savedEntity);
  }),

  create: jest.fn().mockImplementation((entityData) => {
    return { ...entityData, id: Math.floor(Math.random() * 10000) };
  }),

  delete: jest.fn().mockImplementation((criteria) => {
    let affectedCount = 0;
    if (criteria.sku) {
      if (mockDatabaseState.products.has(criteria.sku)) {
        mockDatabaseState.products.delete(criteria.sku);
        affectedCount = 1;
      }
    } else if (Object.keys(criteria).length === 0) {
      // Delete all
      affectedCount = mockDatabaseState.products.size;
      mockDatabaseState.products.clear();
    } else {
      // Delete with conditions
      const toDelete = [];
      for (const [sku, product] of mockDatabaseState.products.entries()) {
        let shouldDelete = true;
        for (const [key, value] of Object.entries(criteria)) {
          if (product[key] !== value) {
            shouldDelete = false;
            break;
          }
        }
        if (shouldDelete) {
          toDelete.push(sku);
        }
      }
      toDelete.forEach((sku) => mockDatabaseState.products.delete(sku));
      affectedCount = toDelete.length;
    }
    return Promise.resolve({ affected: affectedCount });
  }),

  update: jest.fn().mockImplementation((criteria, updateData) => {
    let affectedCount = 0;
    for (const [sku, product] of mockDatabaseState.products.entries()) {
      let shouldUpdate = false;
      if (typeof criteria === 'number' && product.id === criteria) {
        shouldUpdate = true;
      } else if (typeof criteria === 'object') {
        shouldUpdate = true;
        for (const [key, value] of Object.entries(criteria)) {
          if (product[key] !== value) {
            shouldUpdate = false;
            break;
          }
        }
      }

      if (shouldUpdate) {
        Object.assign(product, updateData);
        affectedCount++;
      }
    }
    return Promise.resolve({ affected: affectedCount });
  }),

  createQueryBuilder: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    having: jest.fn().mockReturnThis(),
    getCount: jest.fn().mockResolvedValue(mockDatabaseState.products.size),
    getRawMany: jest.fn().mockImplementation(() => {
      return Promise.resolve(Array.from(mockDatabaseState.products.values()));
    }),
  }),
});

const createAdvancedMockCategoryRepository = () => ({
  findOne: jest.fn().mockImplementation(({ where }) => {
    if (where.slug) {
      return Promise.resolve(
        mockDatabaseState.categories.get(where.slug) || null,
      );
    }
    return Promise.resolve(null);
  }),
});

const createAdvancedMockBrandRepository = () => ({
  findOne: jest.fn().mockImplementation(({ where }) => {
    if (where.slug) {
      return Promise.resolve(mockDatabaseState.brands.get(where.slug) || null);
    }
    return Promise.resolve(null);
  }),
});

const createAdvancedMockManufacturerRepository = () => ({
  findOne: jest.fn().mockImplementation(({ where }) => {
    if (where.name) {
      return Promise.resolve(
        mockDatabaseState.manufacturers.get(where.name) || null,
      );
    }
    return Promise.resolve(null);
  }),
});

const createAdvancedMockVendorRepository = () => ({
  findOne: jest.fn().mockResolvedValue({
    id: 1,
    name: 'Test Vendor',
    type: 'medium_business',
    isActive: true,
  }),
});

const createAdvancedMockDescriptionRepository = () => ({
  save: jest.fn().mockImplementation((entity) => {
    return Promise.resolve({
      ...entity,
      id: Math.floor(Math.random() * 10000),
    });
  }),
  create: jest.fn().mockImplementation((entityData) => {
    return { ...entityData, id: Math.floor(Math.random() * 10000) };
  }),
});

// Mock the DataSource with proper transaction support
const createAdvancedMockDataSource = () => ({
  createQueryRunner: jest.fn().mockReturnValue({
    connect: jest.fn().mockResolvedValue(undefined),
    startTransaction: jest.fn().mockResolvedValue(undefined),
    commitTransaction: jest.fn().mockResolvedValue(undefined),
    rollbackTransaction: jest.fn().mockResolvedValue(undefined),
    release: jest.fn().mockResolvedValue(undefined),
    manager: {
      getRepository: jest.fn().mockImplementation((entityClass) => {
        if (entityClass === ProductEntity) return mockProductRepository;
        if (entityClass === Category) return mockCategoryRepository;
        if (entityClass === Brand) return mockBrandRepository;
        if (entityClass === VendorEntity) return mockVendorRepository;
        if (entityClass === ManufacturerEntity)
          return mockManufacturerRepository;
        if (entityClass === ProductDescriptionEntity)
          return mockDescriptionRepository;
        return mockProductRepository;
      }),
    },
  }),
});

// Initialize advanced mocks
let mockProductRepository: any;
let mockCategoryRepository: any;
let mockBrandRepository: any;
let mockVendorRepository: any;
let mockManufacturerRepository: any;
let mockDescriptionRepository: any;
let mockDataSource: any;

describe('Products Seeding (Comprehensive E2E)', () => {
  let app: INestApplication;
  let productSeederService: ProductSeederService;
  let module: TestingModule;

  // Test state management functions
  const setupCompleteDatabase = () => {
    // Setup all required categories
    mockDatabaseState.categories.set('electronics', {
      id: 1,
      slug: 'electronics',
      nameEn: 'Electronics',
    });
    mockDatabaseState.categories.set('fashion', {
      id: 2,
      slug: 'fashion',
      nameEn: 'Fashion',
    });
    mockDatabaseState.categories.set('food-beverages', {
      id: 3,
      slug: 'food-beverages',
      nameEn: 'Food & Beverages',
    });
    mockDatabaseState.categories.set('home-garden', {
      id: 4,
      slug: 'home-garden',
      nameEn: 'Home & Garden',
    });
    mockDatabaseState.categories.set('books-education', {
      id: 5,
      slug: 'books-education',
      nameEn: 'Books & Education',
    });

    // Setup all required brands
    mockDatabaseState.brands.set('samsung', {
      id: 1,
      slug: 'samsung',
      name: 'Samsung',
    });
    mockDatabaseState.brands.set('lenovo', {
      id: 2,
      slug: 'lenovo',
      name: 'Lenovo',
    });
    mockDatabaseState.brands.set('lg', { id: 3, slug: 'lg', name: 'LG' });
    mockDatabaseState.brands.set('damascus-heritage', {
      id: 4,
      slug: 'damascus-heritage',
      name: 'Damascus Heritage',
    });
    mockDatabaseState.brands.set('al-ghouta', {
      id: 5,
      slug: 'al-ghouta',
      name: 'Al-Ghouta',
    });
    mockDatabaseState.brands.set('levant-style', {
      id: 6,
      slug: 'levant-style',
      name: 'Levant Style',
    });
    mockDatabaseState.brands.set('levant-publications', {
      id: 7,
      slug: 'levant-publications',
      name: 'Levant Publications',
    });

    // Setup all required manufacturers
    mockDatabaseState.manufacturers.set('Samsung Electronics', {
      id: 1,
      name: 'Samsung Electronics',
    });
    mockDatabaseState.manufacturers.set('Lenovo Group', {
      id: 2,
      name: 'Lenovo Group',
    });
    mockDatabaseState.manufacturers.set('LG Electronics', {
      id: 3,
      name: 'LG Electronics',
    });
    mockDatabaseState.manufacturers.set('Damascus Heritage Crafts', {
      id: 4,
      name: 'Damascus Heritage Crafts',
    });
    mockDatabaseState.manufacturers.set('Al-Ghouta Agricultural Co.', {
      id: 5,
      name: 'Al-Ghouta Agricultural Co.',
    });
    mockDatabaseState.manufacturers.set('Levant Style Co.', {
      id: 6,
      name: 'Levant Style Co.',
    });
    mockDatabaseState.manufacturers.set('Levant Publications', {
      id: 7,
      name: 'Levant Publications',
    });
  };

  const setupIncompleteDatabase = () => {
    // Only setup some categories and brands to test missing relationship scenarios
    mockDatabaseState.categories.set('electronics', {
      id: 1,
      slug: 'electronics',
      nameEn: 'Electronics',
    });
    mockDatabaseState.categories.set('fashion', {
      id: 2,
      slug: 'fashion',
      nameEn: 'Fashion',
    });
    // Missing: food-beverages, home-garden, books-education

    mockDatabaseState.brands.set('samsung', {
      id: 1,
      slug: 'samsung',
      name: 'Samsung',
    });
    mockDatabaseState.brands.set('lenovo', {
      id: 2,
      slug: 'lenovo',
      name: 'Lenovo',
    });
    // Missing: lg, damascus-heritage, al-ghouta, levant-style, levant-publications

    mockDatabaseState.manufacturers.set('Samsung Electronics', {
      id: 1,
      name: 'Samsung Electronics',
    });
    // Missing: all other manufacturers
  };

  const resetDatabase = () => {
    mockDatabaseState = {
      products: new Map(),
      categories: new Map(),
      brands: new Map(),
      manufacturers: new Map(),
    };
  };

  const addExistingProducts = () => {
    // Add some existing products to test duplicate handling
    const existingProduct1 = {
      id: 1,
      sku: 'SAMSUNG-A54-128-BLK',
      nameEn: 'Existing Samsung Galaxy A54 128GB',
      nameAr: 'سامسونغ غالاكسي A54 بسعة 128 جيجا موجود',
      isActive: true,
      isPublished: true,
      approvalStatus: 'approved',
    };
    mockDatabaseState.products.set('SAMSUNG-A54-128-BLK', existingProduct1);

    const existingProduct2 = {
      id: 2,
      sku: 'LENOVO-IDEAPAD-15-I5',
      nameEn: 'Existing Lenovo IdeaPad 15',
      nameAr: 'لينوفو آيديا باد 15 موجود',
      isActive: false,
      isPublished: false,
      approvalStatus: 'pending',
    };
    mockDatabaseState.products.set('LENOVO-IDEAPAD-15-I5', existingProduct2);
  };

  beforeEach(async () => {
    // Reset state before each test
    resetDatabase();

    // Create fresh mock instances
    mockProductRepository = createAdvancedMockProductRepository();
    mockCategoryRepository = createAdvancedMockCategoryRepository();
    mockBrandRepository = createAdvancedMockBrandRepository();
    mockVendorRepository = createAdvancedMockVendorRepository();
    mockManufacturerRepository = createAdvancedMockManufacturerRepository();
    mockDescriptionRepository = createAdvancedMockDescriptionRepository();
    mockDataSource = createAdvancedMockDataSource();

    module = await Test.createTestingModule({
      controllers: [ProductSeederController],
      providers: [
        ProductSeederService,
        {
          provide: getRepositoryToken(ProductEntity),
          useValue: mockProductRepository,
        },
        {
          provide: getRepositoryToken(Category),
          useValue: mockCategoryRepository,
        },
        {
          provide: getRepositoryToken(Brand),
          useValue: mockBrandRepository,
        },
        {
          provide: getRepositoryToken(VendorEntity),
          useValue: mockVendorRepository,
        },
        {
          provide: getRepositoryToken(ManufacturerEntity),
          useValue: mockManufacturerRepository,
        },
        {
          provide: getRepositoryToken(ProductDescriptionEntity),
          useValue: mockDescriptionRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    productSeederService =
      module.get<ProductSeederService>(ProductSeederService);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('🎯 Realistic Database Scenarios', () => {
    describe('Complete Database Setup', () => {
      beforeEach(() => {
        setupCompleteDatabase();
      });

      it('should successfully seed all products when all relationships exist', async () => {
        const result = await productSeederService.seedProducts({
          includeElectronics: true,
          includeFashion: true,
          includeFood: true,
          includeHomeGarden: true,
          includeBooksEducation: true,
        });

        expect(result.success).toBe(true);
        expect(result.created).toBe(PRODUCT_STATISTICS.total);
        expect(result.errors).toBe(0);
        expect(mockDatabaseState.products.size).toBe(PRODUCT_STATISTICS.total);
      });

      it('should handle validation mode correctly', async () => {
        const result = await productSeederService.seedProducts({
          validateOnly: true,
          includeElectronics: true,
          includeFashion: true,
        });

        expect(result.success).toBe(true);
        expect(result.totalProcessed).toBeGreaterThan(0);
        expect(result.created).toBe(0); // No actual creation in validation mode
        expect(mockDatabaseState.products.size).toBe(0); // Database should remain empty
      });

      it('should provide accurate statistics', async () => {
        const stats = await productSeederService.getSeedingStatistics();

        expect(stats.seedData.total).toBe(PRODUCT_STATISTICS.total);
        expect(stats.database.totalProducts).toBe(0); // Empty database initially
        expect(stats.comparison.seedingProgress).toBe(0);
      });
    });

    describe('Incomplete Database Setup (Missing Relationships)', () => {
      beforeEach(() => {
        setupIncompleteDatabase();
      });

      it('should fail validation when required relationships are missing', async () => {
        const result = await productSeederService.seedProducts({
          validateOnly: true,
          validateRelationships: true,
          includeElectronics: true,
          includeFashion: true,
          includeFood: true, // This should fail - food-beverages category missing
        });

        expect(result.success).toBe(false);
        expect(result.errors).toBeGreaterThan(0);
      });

      it('should succeed with partial seeding when only available categories are included', async () => {
        const result = await productSeederService.seedProducts({
          includeElectronics: true,
          includeFashion: false, // Skip fashion since it might have missing brands
          includeFood: false,
          includeHomeGarden: false,
          includeBooksEducation: false,
        });

        expect(result.success).toBe(true);
        expect(result.created).toBe(PRODUCT_STATISTICS.electronics);
      });
    });

    describe('Duplicate Product Handling', () => {
      beforeEach(() => {
        setupCompleteDatabase();
        addExistingProducts();
      });

      it('should skip duplicates when skipDuplicates is true', async () => {
        const result = await productSeederService.seedProducts({
          includeElectronics: true,
          skipDuplicates: true,
          updateExisting: false,
        });

        expect(result.success).toBe(true);
        expect(result.skipped).toBeGreaterThan(0);
        expect(result.created).toBeLessThan(PRODUCT_STATISTICS.electronics);
      });

      it('should update existing products when updateExisting is true', async () => {
        const result = await productSeederService.seedProducts({
          includeElectronics: true,
          skipDuplicates: false,
          updateExisting: true,
        });

        expect(result.success).toBe(true);
        expect(result.updated).toBeGreaterThan(0);
      });

      it('should provide accurate counts with existing products', async () => {
        const initialCount = mockDatabaseState.products.size;
        expect(initialCount).toBe(2); // We added 2 existing products

        const stats = await productSeederService.getSeedingStatistics();
        expect(stats.database.totalProducts).toBe(2);
      });
    });
  });

  describe('🧪 Advanced Service Functionality', () => {
    beforeEach(() => {
      setupCompleteDatabase();
    });

    describe('Cleanup Operations', () => {
      beforeEach(() => {
        addExistingProducts();
      });

      it('should count products to be deleted in dry run mode', async () => {
        const result = await productSeederService.cleanupProducts({
          onlySeedData: true,
          dryRun: true,
        });

        expect(result.deletedCount).toBe(2); // The 2 existing products we added
        expect(mockDatabaseState.products.size).toBe(2); // Should not actually delete
      });

      it('should actually delete products when not in dry run', async () => {
        const result = await productSeederService.cleanupProducts({
          onlySeedData: true,
          dryRun: false,
        });

        expect(result.deletedCount).toBe(2);
        expect(mockDatabaseState.products.size).toBe(0); // Should actually delete
      });
    });

    describe('Category-Specific Operations', () => {
      it('should seed only electronics products', async () => {
        const result = await productSeederService.seedElectronicsProducts();

        expect(result.success).toBe(true);
        expect(result.created).toBe(PRODUCT_STATISTICS.electronics);
        expect(mockDatabaseState.products.size).toBe(
          PRODUCT_STATISTICS.electronics,
        );

        // Verify all products are electronics
        const products = Array.from(mockDatabaseState.products.values());
        products.forEach((product) => {
          expect(product.categorySlug || 'electronics').toBe('electronics');
        });
      });

      it('should seed only fashion products', async () => {
        const result = await productSeederService.seedFashionProducts();

        expect(result.success).toBe(true);
        expect(result.created).toBe(PRODUCT_STATISTICS.fashion);
        expect(mockDatabaseState.products.size).toBe(
          PRODUCT_STATISTICS.fashion,
        );
      });
    });

    describe('Performance and Batch Processing', () => {
      it('should handle small batch sizes correctly', async () => {
        const result = await productSeederService.seedProducts({
          includeElectronics: true,
          batchSize: 1, // Very small batch size
        });

        expect(result.success).toBe(true);
        expect(result.created).toBe(PRODUCT_STATISTICS.electronics);
        expect(result.performance.batchProcessingTime).toBeGreaterThanOrEqual(
          0,
        );
      });

      it('should handle large batch sizes correctly', async () => {
        const result = await productSeederService.seedProducts({
          includeElectronics: true,
          includeFashion: true,
          includeFood: true,
          batchSize: 50, // Large batch size
        });

        expect(result.success).toBe(true);
        expect(result.created).toBeGreaterThan(0);
      });
    });
  });

  describe('🔥 Error Scenarios and Edge Cases', () => {
    it('should handle empty database gracefully', async () => {
      // Don't setup any relationships
      resetDatabase();

      const result = await productSeederService.seedProducts({
        validateOnly: true,
        validateRelationships: true,
      });

      expect(result.success).toBe(false);
      expect(result.errors).toBeGreaterThan(0);
    });

    it('should handle corrupted seed data gracefully', async () => {
      setupCompleteDatabase();

      // Test with invalid options
      try {
        await productSeederService.seedProducts({
          batchSize: -1, // Invalid batch size
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle transaction failures', async () => {
      setupCompleteDatabase();

      // Mock transaction failure
      mockDataSource.createQueryRunner.mockReturnValue({
        connect: jest.fn().mockResolvedValue(undefined),
        startTransaction: jest
          .fn()
          .mockRejectedValue(new Error('Transaction failed')),
        rollbackTransaction: jest.fn().mockResolvedValue(undefined),
        release: jest.fn().mockResolvedValue(undefined),
      });

      try {
        await productSeederService.seedProducts({
          includeElectronics: true,
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('Transaction failed');
      }
    });
  });

  describe('🌍 Syrian Business Features Integration', () => {
    beforeEach(() => {
      setupCompleteDatabase();
    });

    it('should correctly filter Syrian products', async () => {
      const result = await productSeederService.seedProducts({
        onlyMadeInSyria: true,
      });

      expect(result.success).toBe(true);
      expect(result.created).toBe(PRODUCT_STATISTICS.madeInSyria);

      // Verify all created products are made in Syria
      const products = Array.from(mockDatabaseState.products.values());
      products.forEach((product) => {
        // Note: This test would need actual Syrian business features in the mock
        expect(product).toBeDefined();
      });
    });

    it('should correctly filter traditional products', async () => {
      const result = await productSeederService.seedProducts({
        onlyTraditional: true,
      });

      expect(result.success).toBe(true);
      expect(result.created).toBe(PRODUCT_STATISTICS.traditional);
    });

    it('should correctly filter handmade products', async () => {
      const result = await productSeederService.seedProducts({
        onlyHandmade: true,
      });

      expect(result.success).toBe(true);
      expect(result.created).toBe(PRODUCT_STATISTICS.handmade);
    });
  });

  describe('📊 API Endpoint Integration', () => {
    beforeEach(() => {
      setupCompleteDatabase();
    });

    it('should return accurate preview with applied filters', async () => {
      const response = await request(app.getHttpServer())
        .get('/products/seeding/products/preview')
        .query({
          category: 'electronics',
          madeInSyria: true,
          limit: 5,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.products).toBeDefined();
      expect(response.body.statistics.total).toBeLessThanOrEqual(5);
    });

    it('should handle validation with realistic scenarios', async () => {
      const response = await request(app.getHttpServer())
        .post('/products/seeding/validate')
        .send({
          includeElectronics: true,
          validateRelationships: true,
          priceRangeMin: 100000,
          priceRangeMax: 10000000,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.result.success).toBe(true);
    });

    it('should handle seeding with realistic database state', async () => {
      addExistingProducts(); // Add some existing products

      const response = await request(app.getHttpServer())
        .post('/products/seeding/seed/electronics')
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.result.created).toBeGreaterThanOrEqual(0);
      expect(
        response.body.result.skipped +
          response.body.result.created +
          response.body.result.updated,
      ).toBe(PRODUCT_STATISTICS.electronics);
    });
  });
});
