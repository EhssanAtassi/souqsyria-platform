/**
 * @file categories-seeding.e2e-spec.ts
 * @description End-to-End tests for Categories Seeding functionality
 *
 * FEATURES TESTED:
 * - Comprehensive category seeding with hierarchical structure
 * - Category-specific seeding (Root, Electronics, Fashion, Food)
 * - Statistics and health monitoring
 * - Cleanup and maintenance operations
 * - Validation and dry-run capabilities
 * - Hierarchical integrity validation
 *
 * @author SouqSyria Development Team
 * @since 2025-08-14
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { Category } from '../../src/categories/entities/category.entity';
import { User } from '../../src/users/entities/user.entity';
import { CategoriesModule } from '../../src/categories/categories.module';
import { UsersModule } from '../../src/users/users.module';
import { AuditLogModule } from '../../src/audit-log/audit-log.module';
import { GuardsModule } from '../../src/common/guards/guards.module';
import { CATEGORY_STATISTICS } from '../../src/categories/seeds/category-seeds.data';

describe('Categories Seeding (e2e)', () => {
  let app: INestApplication;
  let categoryRepository: Repository<Category>;
  let userRepository: Repository<User>;
  let testUser: User;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'mysql',
          host: 'localhost',
          port: 3306,
          username: 'root',
          password: '',
          database: 'souqsyria_test',
          entities: [Category, User],
          synchronize: true,
          dropSchema: true,
        }),
        TypeOrmModule.forFeature([Category, User]),
        CategoriesModule,
        UsersModule,
        AuditLogModule,
        GuardsModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    categoryRepository = moduleFixture.get('CategoryRepository');
    userRepository = moduleFixture.get('UserRepository');

    // Create test user
    testUser = await userRepository.save({
      email: 'test@souqsyria.com',
      fullName: 'Test User',
      firebaseUid: 'test-uid',
      isVerified: true,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up categories before each test
    await categoryRepository.delete({});
  });

  describe('GET /categories/seeding/data/info', () => {
    it('should return seed data information', async () => {
      const response = await request(app.getHttpServer())
        .get('/categories/seeding/data/info')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toEqual(CATEGORY_STATISTICS);
      expect(response.body.categoryTypes).toHaveProperty('root');
      expect(response.body.categoryTypes).toHaveProperty('electronics');
      expect(response.body.categoryTypes).toHaveProperty('fashion');
      expect(response.body.categoryTypes).toHaveProperty('food');
      expect(response.body.hierarchy).toHaveProperty('levels');
    });
  });

  describe('GET /categories/seeding/statistics', () => {
    it('should return comprehensive seeding statistics', async () => {
      const response = await request(app.getHttpServer())
        .get('/categories/seeding/statistics')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('seedData');
      expect(response.body.data).toHaveProperty('database');
      expect(response.body.data).toHaveProperty('comparison');
      expect(response.body.data.database.totalCategories).toBe(0);
      expect(response.body.data.comparison.seedingProgress).toBe(0);
    });
  });

  describe('POST /categories/seeding/validate', () => {
    it('should validate seed data without making changes', async () => {
      const response = await request(app.getHttpServer())
        .post('/categories/seeding/validate')
        .send({
          includeRoot: true,
          includeElectronics: true,
          includeFashion: false,
          includeFood: false,
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('result');
      expect(response.body.result).toHaveProperty('success');
      expect(response.body.result.totalProcessed).toBeGreaterThan(0);
      expect(response.body.result.errors).toBe(0);

      // Ensure no categories were actually created
      const categoryCount = await categoryRepository.count();
      expect(categoryCount).toBe(0);
    });

    it('should detect validation errors', async () => {
      const response = await request(app.getHttpServer())
        .post('/categories/seeding/validate')
        .send({
          minPopularityScore: 150, // Invalid score > 100
        })
        .expect(200);

      expect(response.body).toHaveProperty('result');
      expect(response.body.result.totalProcessed).toBe(0);
    });
  });

  describe('POST /categories/seeding/seed/root', () => {
    it('should seed only root categories', async () => {
      const response = await request(app.getHttpServer())
        .post('/categories/seeding/seed/root')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('result');
      expect(response.body.result.created).toEqual(CATEGORY_STATISTICS.root);
      expect(response.body.result.errors).toBe(0);

      // Verify in database
      const categories = await categoryRepository.find();
      expect(categories).toHaveLength(CATEGORY_STATISTICS.root);

      // All should be root level (depth 0)
      const rootCategories = categories.filter((cat) => cat.depthLevel === 0);
      expect(rootCategories).toHaveLength(CATEGORY_STATISTICS.root);
    });

    it('should skip duplicates on second run', async () => {
      // First run
      await request(app.getHttpServer())
        .post('/categories/seeding/seed/root')
        .expect(200);

      // Second run
      const response = await request(app.getHttpServer())
        .post('/categories/seeding/seed/root')
        .expect(200);

      expect(response.body.result.created).toBe(0);
      expect(response.body.result.skipped).toEqual(CATEGORY_STATISTICS.root);

      // Verify no duplicates in database
      const categories = await categoryRepository.find();
      expect(categories).toHaveLength(CATEGORY_STATISTICS.root);
    });
  });

  describe('POST /categories/seeding/seed/electronics', () => {
    it('should require parent categories first', async () => {
      const response = await request(app.getHttpServer())
        .post('/categories/seeding/seed/electronics')
        .expect(500);

      expect(response.body).toHaveProperty('message');
    });

    it('should seed electronics subcategories after root', async () => {
      // First seed root categories
      await request(app.getHttpServer())
        .post('/categories/seeding/seed/root')
        .expect(200);

      // Then seed electronics
      const response = await request(app.getHttpServer())
        .post('/categories/seeding/seed/electronics')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.result.created).toBe(4); // 4 electronics subcategories
      expect(response.body.result.errors).toBe(0);

      // Verify hierarchy in database
      const electronicsParent = await categoryRepository.findOne({
        where: { slug: 'electronics' },
      });
      expect(electronicsParent).toBeTruthy();
      expect(electronicsParent.depthLevel).toBe(0);

      const smartphones = await categoryRepository.findOne({
        where: { slug: 'smartphones' },
        relations: ['parent'],
      });
      expect(smartphones).toBeTruthy();
      expect(smartphones.depthLevel).toBe(1);
      expect(smartphones.parent.slug).toBe('electronics');
    });
  });

  describe('POST /categories/seeding/seed (Full Hierarchical)', () => {
    it('should seed all categories with proper hierarchy', async () => {
      const response = await request(app.getHttpServer())
        .post('/categories/seeding/seed')
        .send({
          includeRoot: true,
          includeElectronics: true,
          includeFashion: true,
          includeFood: true,
          validateHierarchy: true,
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.result.created).toEqual(CATEGORY_STATISTICS.total);
      expect(response.body.result.errors).toBe(0);
      expect(response.body.result.hierarchy.hierarchyValidation).toBe(true);

      // Verify hierarchy levels
      const rootCategories = await categoryRepository.find({
        where: { depthLevel: 0 },
      });
      const level1Categories = await categoryRepository.find({
        where: { depthLevel: 1 },
      });

      expect(rootCategories).toHaveLength(CATEGORY_STATISTICS.root);
      expect(level1Categories).toHaveLength(CATEGORY_STATISTICS.subcategories);

      // Verify specific parent-child relationships
      const smartphones = await categoryRepository.findOne({
        where: { slug: 'smartphones' },
        relations: ['parent'],
      });
      expect(smartphones.parent.slug).toBe('electronics');
    });

    it('should support dry run without creating records', async () => {
      const response = await request(app.getHttpServer())
        .post('/categories/seeding/seed')
        .send({
          dryRun: true,
          validateHierarchy: true,
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.result.totalProcessed).toEqual(
        CATEGORY_STATISTICS.total,
      );
      expect(response.body.result.errors).toBe(0);

      // Verify no categories were created
      const categoryCount = await categoryRepository.count();
      expect(categoryCount).toBe(0);
    });

    it('should support filtering options', async () => {
      const response = await request(app.getHttpServer())
        .post('/categories/seeding/seed')
        .send({
          includeRoot: true,
          includeElectronics: false,
          includeFashion: false,
          includeFood: false,
          onlyFeatured: true,
          minPopularityScore: 85,
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.result.created).toBeGreaterThan(0);
      expect(response.body.result.created).toBeLessThan(
        CATEGORY_STATISTICS.total,
      );

      // Verify only featured categories were created
      const categories = await categoryRepository.find();
      for (const category of categories) {
        expect(category.isFeatured).toBe(true);
        expect(category.popularityScore).toBeGreaterThanOrEqual(85);
      }
    });
  });

  describe('GET /categories/seeding/hierarchy/preview', () => {
    it('should return hierarchy preview', async () => {
      const response = await request(app.getHttpServer())
        .get('/categories/seeding/hierarchy/preview')
        .query({ maxDepth: 1 })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('hierarchy');
      expect(response.body).toHaveProperty('statistics');
      expect(response.body.hierarchy).toBeInstanceOf(Array);
      expect(response.body.statistics.levelCounts).toHaveProperty('0');
      expect(response.body.statistics.levelCounts).toHaveProperty('1');
    });
  });

  describe('DELETE /categories/seeding/cleanup', () => {
    beforeEach(async () => {
      // Seed some categories first
      await request(app.getHttpServer()).post('/categories/seeding/seed').send({
        includeRoot: true,
        includeElectronics: true,
        includeFashion: false,
        includeFood: false,
      });
    });

    it('should support dry run cleanup', async () => {
      const response = await request(app.getHttpServer())
        .delete('/categories/seeding/cleanup')
        .query({ dryRun: true, onlySeedData: true })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.deletedCount).toBeGreaterThan(0);
      expect(response.body.message).toContain('Would delete');

      // Verify categories still exist
      const categoryCount = await categoryRepository.count();
      expect(categoryCount).toBeGreaterThan(0);
    });

    it('should cleanup seed data categories', async () => {
      const initialCount = await categoryRepository.count();
      expect(initialCount).toBeGreaterThan(0);

      const response = await request(app.getHttpServer())
        .delete('/categories/seeding/cleanup')
        .query({ onlySeedData: true })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.deletedCount).toBe(initialCount);

      // Verify categories were deleted
      const finalCount = await categoryRepository.count();
      expect(finalCount).toBe(0);
    });

    it('should require confirmation for complete deletion', async () => {
      const response = await request(app.getHttpServer())
        .delete('/categories/seeding/cleanup')
        .query({ onlySeedData: false })
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('confirmation code');
    });

    it('should perform complete deletion with confirmation', async () => {
      // Add a non-seed category
      await categoryRepository.save({
        nameEn: 'Custom Category',
        nameAr: 'فئة مخصصة',
        slug: 'custom-category',
        approvalStatus: 'approved',
        isActive: true,
        isFeatured: false,
        sortOrder: 999,
        showInNav: true,
        popularityScore: 50,
        depthLevel: 0,
        productCount: 0,
        viewCount: 0,
      });

      const initialCount = await categoryRepository.count();

      const response = await request(app.getHttpServer())
        .delete('/categories/seeding/cleanup')
        .query({
          onlySeedData: false,
          confirmationCode: 'DELETE_ALL_CATEGORIES_CONFIRMED',
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.deletedCount).toBe(initialCount);
      expect(response.body).toHaveProperty('warning');

      // Verify all categories were deleted
      const finalCount = await categoryRepository.count();
      expect(finalCount).toBe(0);
    });
  });

  describe('GET /categories/seeding/health', () => {
    it('should return healthy status when everything is working', async () => {
      const response = await request(app.getHttpServer())
        .get('/categories/seeding/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('database', 'connected');
      expect(response.body).toHaveProperty('seedDataIntegrity', 'valid');
      expect(response.body).toHaveProperty('hierarchyIntegrity', 'valid');
      expect(response.body).toHaveProperty('statistics');
      expect(response.body).toHaveProperty('lastCheck');
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid seeding options', async () => {
      const response = await request(app.getHttpServer())
        .post('/categories/seeding/seed')
        .send({
          batchSize: 5000, // Too large
          minPopularityScore: -10, // Invalid
          maxPopularityScore: 150, // Invalid
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should handle hierarchy validation failures', async () => {
      // This would test custom invalid hierarchy data
      // For this test, we'll simulate with electronics without root
      const response = await request(app.getHttpServer())
        .post('/categories/seeding/seed')
        .send({
          includeRoot: false,
          includeElectronics: true,
          validateHierarchy: true,
        })
        .expect(500);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Performance Tests', () => {
    it('should complete seeding within reasonable time', async () => {
      const startTime = Date.now();

      const response = await request(app.getHttpServer())
        .post('/categories/seeding/seed')
        .send({
          batchSize: 10, // Small batch for testing
        })
        .expect(200);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.body.result.processingTimeMs).toBeLessThan(30000); // 30 seconds max
      expect(duration).toBeLessThan(35000); // Including HTTP overhead

      // Verify performance metrics are returned
      expect(response.body.result.performance).toHaveProperty(
        'averageTimePerCategory',
      );
      expect(response.body.result.performance).toHaveProperty(
        'batchProcessingTime',
      );
      expect(response.body.result.performance).toHaveProperty(
        'dbOperationTime',
      );
    });

    it('should handle batch processing correctly', async () => {
      const response = await request(app.getHttpServer())
        .post('/categories/seeding/seed')
        .send({
          batchSize: 5,
        })
        .expect(200);

      expect(response.body.result.created).toEqual(CATEGORY_STATISTICS.total);
      expect(response.body.result.errors).toBe(0);

      // Verify all categories were created despite small batch size
      const categoryCount = await categoryRepository.count();
      expect(categoryCount).toEqual(CATEGORY_STATISTICS.total);
    });
  });

  describe('Arabic Localization', () => {
    it('should seed categories with proper Arabic names', async () => {
      await request(app.getHttpServer())
        .post('/categories/seeding/seed/root')
        .expect(200);

      const electronics = await categoryRepository.findOne({
        where: { slug: 'electronics' },
      });

      expect(electronics.nameEn).toBe('Electronics');
      expect(electronics.nameAr).toBe('إلكترونيات');
      expect(electronics.descriptionAr).toContain('الإلكترونيات الاستهلاكية');
      expect(electronics.seoSlug).toBe('الكترونيات');
    });

    it('should handle Syrian traditional categories', async () => {
      await request(app.getHttpServer())
        .post('/categories/seeding/seed/root')
        .expect(200);

      const traditionalCrafts = await categoryRepository.findOne({
        where: { slug: 'traditional-crafts' },
      });

      expect(traditionalCrafts.nameEn).toBe('Traditional Crafts');
      expect(traditionalCrafts.nameAr).toBe('حرف تقليدية');
      expect(traditionalCrafts.descriptionAr).toContain(
        'الحرف اليدوية السورية',
      );
      expect(traditionalCrafts.seoSlug).toBe('حرف-تقليدية');
    });
  });
});
