/**
 * @file products-simple.e2e-spec.ts
 * @description Simple End-to-End tests for Products Seeding without database dependency
 *
 * FEATURES TESTED:
 * - Seed data structure validation
 * - Service initialization
 * - Controller endpoint availability
 * - Data integrity checks
 * - Product relationship validation
 * - Syrian business features validation
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

// Mock the TypeORM repositories
const mockProductRepository = {
  find: jest.fn().mockResolvedValue([]),
  findOne: jest.fn().mockResolvedValue(null), // Always return null to simulate no existing products
  count: jest.fn().mockResolvedValue(0),
  save: jest.fn().mockImplementation((entity) => {
    // For dry run tests, we want to simulate that save would work but don't count it
    return Promise.resolve({ ...entity, id: Math.random() });
  }),
  create: jest.fn().mockImplementation((entityData) => {
    // Return the entity data as if it was created
    return { ...entityData, id: Math.random() };
  }),
  delete: jest.fn().mockResolvedValue({ affected: 0 }),
  createQueryBuilder: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    having: jest.fn().mockReturnThis(),
    getCount: jest.fn().mockResolvedValue(0),
    getRawMany: jest.fn().mockResolvedValue([]),
  }),
  update: jest.fn().mockResolvedValue({ affected: 1 }),
};

const mockCategoryRepository = {
  findOne: jest.fn().mockImplementation(({ where }) => {
    // Mock existing categories for relationship validation
    const mockCategories = {
      electronics: { id: 1, slug: 'electronics', nameEn: 'Electronics' },
      fashion: { id: 2, slug: 'fashion', nameEn: 'Fashion' },
      'food-beverages': {
        id: 3,
        slug: 'food-beverages',
        nameEn: 'Food & Beverages',
      },
      'home-garden': { id: 4, slug: 'home-garden', nameEn: 'Home & Garden' },
      'books-education': {
        id: 5,
        slug: 'books-education',
        nameEn: 'Books & Education',
      },
    };
    return Promise.resolve(mockCategories[where.slug] || null);
  }),
};

const mockBrandRepository = {
  findOne: jest.fn().mockImplementation(({ where }) => {
    // Mock existing brands for relationship validation
    const mockBrands = {
      samsung: { id: 1, slug: 'samsung', name: 'Samsung' },
      lenovo: { id: 2, slug: 'lenovo', name: 'Lenovo' },
      lg: { id: 3, slug: 'lg', name: 'LG' },
      'damascus-heritage': {
        id: 4,
        slug: 'damascus-heritage',
        name: 'Damascus Heritage',
      },
      'al-ghouta': { id: 5, slug: 'al-ghouta', name: 'Al-Ghouta' },
      'levant-style': { id: 6, slug: 'levant-style', name: 'Levant Style' },
      'levant-publications': {
        id: 7,
        slug: 'levant-publications',
        name: 'Levant Publications',
      },
    };
    return Promise.resolve(mockBrands[where.slug] || null);
  }),
};

const mockVendorRepository = {
  findOne: jest.fn().mockResolvedValue({ id: 1, name: 'Test Vendor' }),
};

const mockManufacturerRepository = {
  findOne: jest.fn().mockImplementation(({ where }) => {
    // Mock existing manufacturers for relationship validation
    const mockManufacturers = {
      'Samsung Electronics': { id: 1, name: 'Samsung Electronics' },
      'Lenovo Group': { id: 2, name: 'Lenovo Group' },
      'LG Electronics': { id: 3, name: 'LG Electronics' },
      'Damascus Heritage Crafts': { id: 4, name: 'Damascus Heritage Crafts' },
      'Al-Ghouta Agricultural Co.': {
        id: 5,
        name: 'Al-Ghouta Agricultural Co.',
      },
      'Levant Style Co.': { id: 6, name: 'Levant Style Co.' },
      'Levant Publications': { id: 7, name: 'Levant Publications' },
    };
    return Promise.resolve(mockManufacturers[where.name] || null);
  }),
};

const mockDescriptionRepository = {
  save: jest.fn().mockResolvedValue({}),
  create: jest.fn().mockReturnValue({}),
};

// Mock the DataSource
const mockDataSource = {
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
};

describe('Products Seeding (Simple E2E)', () => {
  let app: INestApplication;
  let productSeederService: ProductSeederService;
  let module: TestingModule;

  beforeAll(async () => {
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

  afterAll(async () => {
    await app.close();
  });

  describe('Seed Data Structure', () => {
    it('should have valid product statistics', () => {
      expect(PRODUCT_STATISTICS).toBeDefined();
      expect(PRODUCT_STATISTICS.total).toBeGreaterThan(0);
      expect(PRODUCT_STATISTICS.electronics).toBeGreaterThan(0);
      expect(PRODUCT_STATISTICS.fashion).toBeGreaterThan(0);
      expect(PRODUCT_STATISTICS.food).toBeGreaterThan(0);
      expect(PRODUCT_STATISTICS.homeGarden).toBeGreaterThan(0);
      expect(PRODUCT_STATISTICS.booksEducation).toBeGreaterThan(0);
    });

    it('should have valid product seed data array', () => {
      expect(ALL_PRODUCT_SEEDS).toBeDefined();
      expect(Array.isArray(ALL_PRODUCT_SEEDS)).toBe(true);
      expect(ALL_PRODUCT_SEEDS.length).toBe(PRODUCT_STATISTICS.total);
    });

    it('should have valid product data structure', () => {
      const product = ALL_PRODUCT_SEEDS[0];
      expect(product).toHaveProperty('nameEn');
      expect(product).toHaveProperty('nameAr');
      expect(product).toHaveProperty('sku');
      expect(product).toHaveProperty('slug');
      expect(product).toHaveProperty('basePriceSYP');
      expect(product).toHaveProperty('categorySlug');
      expect(product).toHaveProperty('syrianBusinessFeatures');
      expect(product).toHaveProperty('vendorType');
    });

    it('should have proper Syrian business features', () => {
      const product = ALL_PRODUCT_SEEDS.find(
        (p) => p.nameEn === 'Traditional Syrian Thobe for Men',
      );
      expect(product).toBeTruthy();
      expect(product.syrianBusinessFeatures).toHaveProperty('madeInSyria');
      expect(product.syrianBusinessFeatures).toHaveProperty(
        'traditionalProduct',
      );
      expect(product.syrianBusinessFeatures).toHaveProperty('handmade');
      expect(product.syrianBusinessFeatures).toHaveProperty(
        'culturalSignificance',
      );
      expect(product.syrianBusinessFeatures.madeInSyria).toBe(true);
      expect(product.syrianBusinessFeatures.traditionalProduct).toBe(true);
    });

    it('should have valid pricing structure', () => {
      ALL_PRODUCT_SEEDS.forEach((product) => {
        expect(product.basePriceSYP).toBeGreaterThan(0);
        expect(['SYP', 'USD', 'EUR', 'TRY']).toContain(product.currency);
        expect(product.stockQuantity).toBeGreaterThanOrEqual(0);
        if (product.salePrice) {
          expect(product.salePrice).toBeLessThan(product.basePriceSYP);
        }
      });
    });

    it('should have proper vendor type distribution', () => {
      const individual = ALL_PRODUCT_SEEDS.filter(
        (p) => p.vendorType === 'individual',
      );
      const smallBusiness = ALL_PRODUCT_SEEDS.filter(
        (p) => p.vendorType === 'small_business',
      );
      const mediumBusiness = ALL_PRODUCT_SEEDS.filter(
        (p) => p.vendorType === 'medium_business',
      );
      const enterprise = ALL_PRODUCT_SEEDS.filter(
        (p) => p.vendorType === 'enterprise',
      );

      expect(individual.length).toBe(PRODUCT_STATISTICS.individual);
      expect(smallBusiness.length).toBe(PRODUCT_STATISTICS.smallBusiness);
      expect(mediumBusiness.length).toBe(PRODUCT_STATISTICS.mediumBusiness);
      expect(enterprise.length).toBe(PRODUCT_STATISTICS.enterprise);
    });

    it('should have proper category distribution', () => {
      const electronics = ALL_PRODUCT_SEEDS.filter(
        (p) => p.categorySlug === 'electronics',
      );
      const fashion = ALL_PRODUCT_SEEDS.filter(
        (p) => p.categorySlug === 'fashion',
      );
      const food = ALL_PRODUCT_SEEDS.filter(
        (p) => p.categorySlug === 'food-beverages',
      );

      expect(electronics.length).toBe(PRODUCT_STATISTICS.electronics);
      expect(fashion.length).toBe(PRODUCT_STATISTICS.fashion);
      expect(food.length).toBe(PRODUCT_STATISTICS.food);
    });
  });

  describe('Service Functionality', () => {
    it('should be defined', () => {
      expect(productSeederService).toBeDefined();
    });

    it('should validate product data successfully', async () => {
      const result = await productSeederService.seedProducts({
        validateOnly: true,
      });
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.totalProcessed).toBeGreaterThan(0);
      expect(result.errors).toBe(0);
    });

    it('should handle dry run successfully', async () => {
      const result = await productSeederService.seedProducts({ dryRun: true });
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.totalProcessed).toBeGreaterThan(0);
      expect(result.created).toBe(0); // No actual creation in dry run
    });

    it('should get statistics successfully', async () => {
      const stats = await productSeederService.getSeedingStatistics();
      expect(stats).toBeDefined();
      expect(stats.seedData).toEqual(PRODUCT_STATISTICS);
      expect(stats.database).toBeDefined();
      expect(stats.comparison).toBeDefined();
    });

    it('should perform health check successfully', async () => {
      const health = await productSeederService.healthCheck();
      expect(health).toBeDefined();
      expect(health.status).toBe('healthy');
      expect(health.database).toBe('connected');
      expect(health.seedDataIntegrity).toBe('valid');
    });

    it('should validate relationships successfully', async () => {
      const result = await productSeederService.seedProducts({
        validateOnly: true,
        validateRelationships: true,
      });
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.errors).toBe(0);
    });
  });

  describe('API Endpoints', () => {
    it('GET /products/seeding/data/info should return seed data information', async () => {
      const response = await request(app.getHttpServer())
        .get('/products/seeding/data/info')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toEqual(PRODUCT_STATISTICS);
      expect(response.body.categories).toHaveProperty('electronics');
      expect(response.body.categories).toHaveProperty('fashion');
      expect(response.body.categories).toHaveProperty('food');
      expect(response.body.businessFeatures).toHaveProperty('madeInSyria');
      expect(response.body.vendorTypes).toHaveProperty('smallBusiness');
    });

    it('GET /products/seeding/statistics should return comprehensive statistics', async () => {
      const response = await request(app.getHttpServer())
        .get('/products/seeding/statistics')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('seedData');
      expect(response.body.data).toHaveProperty('database');
      expect(response.body.data).toHaveProperty('comparison');
    });

    it('GET /products/seeding/products/preview should return product preview', async () => {
      const response = await request(app.getHttpServer())
        .get('/products/seeding/products/preview')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('products');
      expect(response.body).toHaveProperty('statistics');
      expect(Array.isArray(response.body.products)).toBe(true);
    });

    it('GET /products/seeding/products/preview with category filter should work', async () => {
      const response = await request(app.getHttpServer())
        .get('/products/seeding/products/preview')
        .query({ category: 'electronics' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.products.length).toBeGreaterThan(0);

      // All returned products should be electronics
      response.body.products.forEach((product) => {
        expect(product.categorySlug).toBe('electronics');
      });
    });

    it('GET /products/seeding/products/preview with Syrian filter should work', async () => {
      const response = await request(app.getHttpServer())
        .get('/products/seeding/products/preview')
        .query({ madeInSyria: true })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);

      // All returned products should be made in Syria
      response.body.products.forEach((product) => {
        expect(product.syrianBusinessFeatures.madeInSyria).toBe(true);
      });
    });

    it('GET /products/seeding/health should return healthy status', async () => {
      const response = await request(app.getHttpServer())
        .get('/products/seeding/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('database', 'connected');
      expect(response.body).toHaveProperty('seedDataIntegrity', 'valid');
      expect(response.body).toHaveProperty('message');
    });

    it('POST /products/seeding/validate should validate successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/products/seeding/validate')
        .send({
          includeElectronics: true,
          includeFashion: true,
          validateRelationships: true,
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('result');
      expect(response.body.result.success).toBe(true);
      expect(response.body.result.errors).toBe(0);
    });

    it('POST /products/seeding/seed with dry run should work', async () => {
      const response = await request(app.getHttpServer())
        .post('/products/seeding/seed')
        .send({
          dryRun: true,
          includeElectronics: true,
          includeFashion: false,
          includeFood: false,
          includeHomeGarden: false,
          includeBooksEducation: false,
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('result');
      expect(response.body.result.totalProcessed).toBeGreaterThan(0);
      expect(response.body.result.created).toBe(0); // Dry run shouldn't create
    });
  });

  describe('Category-Specific Seeding', () => {
    it('POST /products/seeding/seed/electronics should work', async () => {
      const response = await request(app.getHttpServer())
        .post('/products/seeding/seed/electronics')
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('result');
      expect(response.body.result.totalProcessed).toBe(
        PRODUCT_STATISTICS.electronics,
      );
    });

    it('POST /products/seeding/seed/fashion should work', async () => {
      const response = await request(app.getHttpServer())
        .post('/products/seeding/seed/fashion')
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.result.totalProcessed).toBe(
        PRODUCT_STATISTICS.fashion,
      );
    });

    it('POST /products/seeding/seed/food should work', async () => {
      const response = await request(app.getHttpServer())
        .post('/products/seeding/seed/food')
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.result.totalProcessed).toBe(PRODUCT_STATISTICS.food);
    });

    it('POST /products/seeding/seed/home-garden should work', async () => {
      const response = await request(app.getHttpServer())
        .post('/products/seeding/seed/home-garden')
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.result.totalProcessed).toBe(
        PRODUCT_STATISTICS.homeGarden,
      );
    });

    it('POST /products/seeding/seed/books-education should work', async () => {
      const response = await request(app.getHttpServer())
        .post('/products/seeding/seed/books-education')
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.result.totalProcessed).toBe(
        PRODUCT_STATISTICS.booksEducation,
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid seeding options', async () => {
      const response = await request(app.getHttpServer())
        .post('/products/seeding/seed')
        .send({
          batchSize: 500, // Too large
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should validate price ranges properly', async () => {
      const response = await request(app.getHttpServer())
        .post('/products/seeding/validate')
        .send({
          priceRangeMin: -1000, // Invalid
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should handle invalid price range relationship', async () => {
      const response = await request(app.getHttpServer())
        .post('/products/seeding/validate')
        .send({
          priceRangeMin: 1000000,
          priceRangeMax: 500000, // Min > Max
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Business Logic', () => {
    it('should have electronics products with tech features', () => {
      const smartphone = ALL_PRODUCT_SEEDS.find(
        (p) => p.nameEn === 'Samsung Galaxy A54 128GB',
      );
      expect(smartphone).toBeTruthy();
      expect(smartphone.categorySlug).toBe('electronics');
      expect(
        smartphone.attributes.some((attr) => attr.attributeName === 'Storage'),
      ).toBe(true);
      expect(smartphone.features.length).toBeGreaterThan(0);
    });

    it('should have fashion products with Syrian cultural significance', () => {
      const thobe = ALL_PRODUCT_SEEDS.find(
        (p) => p.nameEn === 'Traditional Syrian Thobe for Men',
      );
      expect(thobe).toBeTruthy();
      expect(thobe.categorySlug).toBe('fashion');
      expect(thobe.syrianBusinessFeatures.culturalSignificance).toBe(true);
      expect(thobe.syrianBusinessFeatures.handmade).toBe(true);
    });

    it('should have food products with Syrian origin', () => {
      const aleppoSpice = ALL_PRODUCT_SEEDS.find(
        (p) => p.nameEn === 'Authentic Aleppo Pepper - Premium Grade',
      );
      expect(aleppoSpice).toBeTruthy();
      expect(aleppoSpice.categorySlug).toBe('food-beverages');
      expect(aleppoSpice.syrianBusinessFeatures.madeInSyria).toBe(true);
      expect(aleppoSpice.syrianBusinessFeatures.traditionalProduct).toBe(true);
    });

    it('should have proper vendor type distribution for Syrian products', () => {
      const syrianProducts = ALL_PRODUCT_SEEDS.filter(
        (p) => p.syrianBusinessFeatures.madeInSyria,
      );

      const smallBusinessSyrian = syrianProducts.filter(
        (p) => p.vendorType === 'small_business',
      );
      const mediumBusinessSyrian = syrianProducts.filter(
        (p) => p.vendorType === 'medium_business',
      );

      expect(smallBusinessSyrian.length).toBeGreaterThan(0);
      expect(mediumBusinessSyrian.length).toBeGreaterThan(0);
    });

    it('should have proper pricing structure for different categories', () => {
      const electronics = ALL_PRODUCT_SEEDS.filter(
        (p) => p.categorySlug === 'electronics',
      );
      const food = ALL_PRODUCT_SEEDS.filter(
        (p) => p.categorySlug === 'food-beverages',
      );

      // Electronics should generally be more expensive than food
      const avgElectronicsPrice =
        electronics.reduce((sum, p) => sum + p.basePriceSYP, 0) /
        electronics.length;
      const avgFoodPrice =
        food.reduce((sum, p) => sum + p.basePriceSYP, 0) / food.length;

      expect(avgElectronicsPrice).toBeGreaterThan(avgFoodPrice);
    });
  });

  describe('Arabic Localization', () => {
    it('should have Arabic names for all products', () => {
      ALL_PRODUCT_SEEDS.forEach((product) => {
        expect(product.nameAr).toBeTruthy();
        expect(product.shortDescriptionAr).toBeTruthy();
        expect(product.detailedDescriptionAr).toBeTruthy();
        expect(product.targetAudienceAr).toBeTruthy();
      });
    });

    it('should have Arabic features for all products', () => {
      ALL_PRODUCT_SEEDS.forEach((product) => {
        expect(Array.isArray(product.featuresAr)).toBe(true);
        expect(product.featuresAr.length).toBeGreaterThan(0);
        expect(product.featuresAr.length).toBe(product.features.length);
      });
    });

    it('should have Arabic characters in Arabic fields', () => {
      const product = ALL_PRODUCT_SEEDS[0];
      // Check for Arabic characters (Unicode range for Arabic)
      const arabicRegex = /[\u0600-\u06FF]/;
      expect(arabicRegex.test(product.nameAr)).toBe(true);
      expect(arabicRegex.test(product.shortDescriptionAr)).toBe(true);
    });

    it('should have Arabic tags for Syrian products', () => {
      const syrianProducts = ALL_PRODUCT_SEEDS.filter(
        (p) => p.syrianBusinessFeatures.madeInSyria,
      );

      syrianProducts.forEach((product) => {
        expect(Array.isArray(product.tagsAr)).toBe(true);
        expect(product.tagsAr.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle batch processing options', async () => {
      const result = await productSeederService.seedProducts({
        dryRun: true,
        batchSize: 3,
      });

      expect(result.success).toBe(true);
      expect(result.performance).toBeDefined();
      expect(result.performance.batchProcessingTime).toBeGreaterThanOrEqual(0);
    });

    it('should provide performance metrics', async () => {
      const result = await productSeederService.seedProducts({
        validateOnly: true,
      });

      expect(result.performance).toBeDefined();
      expect(result.performance).toHaveProperty('averageTimePerProduct');
      expect(result.performance).toHaveProperty('batchProcessingTime');
      expect(result.performance).toHaveProperty('dbOperationTime');
      expect(result.performance).toHaveProperty('validationTime');
    });
  });
});
