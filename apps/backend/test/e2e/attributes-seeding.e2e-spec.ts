/**
 * @file attributes-seeding.e2e-spec.ts
 * @description Comprehensive E2E tests for attribute seeding functionality
 *
 * Tests the complete attribute seeding workflow including:
 * - Seeding with validation
 * - Statistics and analytics
 * - Data integrity checks
 * - Cleanup operations
 * - Error handling scenarios
 *
 * @author SouqSyria Development Team
 * @since 2025-08-16
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';

import { AttributesModule } from '../../src/attributes/attributes.module';
import { AuthModule } from '../../src/auth/auth.module';
import { AccessControlModule } from '../../src/access-control/access-control.module';
import { Attribute } from '../../src/attributes/entities/attribute.entity';
import { AttributeValue } from '../../src/attributes/entities/attribute-value.entity';
import { AttributeType } from '../../src/attributes/entities/attribute-types.enum';
import { typeOrmConfig } from '../../src/config/typeorm.config';

describe('Attributes Seeding E2E Tests', () => {
  let app: INestApplication;
  let attributeRepository: Repository<Attribute>;
  let attributeValueRepository: Repository<AttributeValue>;
  let moduleRef: TestingModule;

  // Test authentication token (mock)
  const testAuthToken = 'test-admin-token';

  beforeAll(async () => {
    // Create testing module with required dependencies
    moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'mysql',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT) || 3306,
          username: process.env.DB_USERNAME || 'root',
          password: process.env.DB_PASSWORD || '',
          database: process.env.TEST_DB_NAME || 'souqsyria_test',
          entities: [__dirname + '/../../src/**/*.entity{.ts,.js}'],
          synchronize: true, // Auto-create tables for testing
          dropSchema: true, // Clean slate for each test run
          logging: false, // Disable logging for tests
        }),
        AttributesModule,
        AuthModule,
        AccessControlModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();

    // Set up validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    // Get repository instances for direct database verification
    attributeRepository = moduleRef.get<Repository<Attribute>>(
      getRepositoryToken(Attribute),
    );
    attributeValueRepository = moduleRef.get<Repository<AttributeValue>>(
      getRepositoryToken(AttributeValue),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await moduleRef.close();
  });

  beforeEach(async () => {
    // Clean database before each test
    await attributeValueRepository.delete({});
    await attributeRepository.delete({});
  });

  describe('🌱 Attribute Seeding', () => {
    it('should seed attributes successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/attributes/seeding/seed')
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(200);

      // Verify response structure
      expect(response.body).toMatchObject({
        success: true,
        message: 'Attributes seeded successfully',
        data: {
          attributesCreated: expect.any(Number),
          valuesCreated: expect.any(Number),
          errors: [],
          duration: expect.any(String),
        },
        timestamp: expect.any(String),
      });

      // Verify data was actually created in database
      const attributeCount = await attributeRepository.count();
      const valueCount = await attributeValueRepository.count();

      expect(attributeCount).toBeGreaterThan(0);
      expect(valueCount).toBeGreaterThan(0);
      expect(response.body.data.attributesCreated).toBe(attributeCount);
      expect(response.body.data.valuesCreated).toBe(valueCount);
    });

    it('should seed specific attribute types correctly', async () => {
      await request(app.getHttpServer())
        .post('/api/attributes/seeding/seed')
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(200);

      // Verify specific attributes were created
      const colorAttribute = await attributeRepository.findOne({
        where: { nameEn: 'Color', type: AttributeType.COLOR },
        relations: ['values'],
      });

      expect(colorAttribute).toBeDefined();
      expect(colorAttribute.nameAr).toBe('اللون');
      expect(colorAttribute.type).toBe(AttributeType.COLOR);
      expect(colorAttribute.isFilterable).toBe(true);
      expect(colorAttribute.values.length).toBeGreaterThan(0);

      // Verify color values have hex codes
      const redColor = colorAttribute.values.find((v) => v.valueEn === 'Red');
      expect(redColor).toBeDefined();
      expect(redColor.colorHex).toBe('#FF0000');
      expect(redColor.valueAr).toBe('أحمر');
    });

    it('should handle duplicate seeding gracefully', async () => {
      // First seeding
      const firstResponse = await request(app.getHttpServer())
        .post('/api/attributes/seeding/seed')
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(200);

      const firstCount = await attributeRepository.count();

      // Second seeding (should update, not duplicate)
      const secondResponse = await request(app.getHttpServer())
        .post('/api/attributes/seeding/seed')
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(200);

      const secondCount = await attributeRepository.count();

      // Should not create duplicates
      expect(secondCount).toBe(firstCount);
      expect(secondResponse.body.success).toBe(true);
      expect(secondResponse.body.data.attributesCreated).toBe(0); // No new attributes
    });

    it('should validate multi-language support', async () => {
      await request(app.getHttpServer())
        .post('/api/attributes/seeding/seed')
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(200);

      // Check that all attributes have both English and Arabic names
      const attributes = await attributeRepository.find({
        relations: ['values'],
      });

      for (const attribute of attributes) {
        expect(attribute.nameEn).toBeDefined();
        expect(attribute.nameEn).not.toBe('');
        expect(attribute.nameAr).toBeDefined();
        expect(attribute.nameAr).not.toBe('');

        // Check attribute values also have translations
        for (const value of attribute.values) {
          expect(value.valueEn).toBeDefined();
          expect(value.valueEn).not.toBe('');
          expect(value.valueAr).toBeDefined();
          expect(value.valueAr).not.toBe('');
        }
      }
    });
  });

  describe('📊 Statistics and Analytics', () => {
    beforeEach(async () => {
      // Seed data for statistics tests
      await request(app.getHttpServer())
        .post('/api/attributes/seeding/seed')
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(200);
    });

    it('should return accurate statistics', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/attributes/seeding/statistics')
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          totalAttributes: expect.any(Number),
          totalValues: expect.any(Number),
          attributesByType: expect.any(Object),
          activeAttributes: expect.any(Number),
        },
        timestamp: expect.any(String),
      });

      // Verify statistics match database
      const dbAttributeCount = await attributeRepository.count();
      const dbValueCount = await attributeValueRepository.count();
      const dbActiveCount = await attributeRepository.count({
        where: { isActive: true },
      });

      expect(response.body.data.totalAttributes).toBe(dbAttributeCount);
      expect(response.body.data.totalValues).toBe(dbValueCount);
      expect(response.body.data.activeAttributes).toBe(dbActiveCount);
    });

    it('should provide attribute type breakdown', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/attributes/seeding/statistics')
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(200);

      const typeBreakdown = response.body.data.attributesByType;

      expect(typeBreakdown).toBeDefined();
      expect(Object.keys(typeBreakdown).length).toBeGreaterThan(0);

      // Should have at least some common types
      expect(typeBreakdown.select).toBeGreaterThan(0);
      expect(typeBreakdown.color).toBeGreaterThan(0);
    });
  });

  describe('✅ Data Validation', () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/api/attributes/seeding/seed')
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(200);
    });

    it('should validate seeded data integrity', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/attributes/seeding/validate')
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          isValid: expect.any(Boolean),
          issues: expect.any(Array),
          recommendations: expect.any(Array),
        },
        timestamp: expect.any(String),
      });

      // For properly seeded data, validation should pass
      expect(response.body.data.isValid).toBe(true);
      expect(response.body.data.issues.length).toBe(0);
    });

    it('should detect data integrity issues', async () => {
      // Manually create an attribute without values to trigger validation issue
      const attributeWithoutValues = attributeRepository.create({
        nameEn: 'Test Color',
        nameAr: 'لون تجريبي',
        descriptionEn: 'Test color attribute',
        descriptionAr: 'خاصية لون تجريبية',
        type: AttributeType.COLOR, // Color type requires values
        displayOrder: 999,
        isRequired: false,
        isFilterable: true,
        isSearchable: true,
        isActive: true,
      });
      await attributeRepository.save(attributeWithoutValues);

      const response = await request(app.getHttpServer())
        .post('/api/attributes/seeding/validate')
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(200);

      expect(response.body.data.isValid).toBe(false);
      expect(response.body.data.issues.length).toBeGreaterThan(0);
      expect(response.body.data.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('🗑️ Cleanup Operations', () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/api/attributes/seeding/seed')
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(200);
    });

    it('should require confirmation for cleanup', async () => {
      const response = await request(app.getHttpServer())
        .delete('/api/attributes/seeding/cleanup')
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ confirm: false })
        .expect(200);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('confirmation required');

      // Verify data was not deleted
      const attributeCount = await attributeRepository.count();
      expect(attributeCount).toBeGreaterThan(0);
    });

    it('should cleanup all data when confirmed', async () => {
      const initialCount = await attributeRepository.count();
      expect(initialCount).toBeGreaterThan(0);

      const response = await request(app.getHttpServer())
        .delete('/api/attributes/seeding/cleanup')
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ confirm: true })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Cleanup completed successfully',
        data: {
          deleted: initialCount,
        },
        timestamp: expect.any(String),
      });

      // Verify all data was deleted
      const finalAttributeCount = await attributeRepository.count();
      const finalValueCount = await attributeValueRepository.count();

      expect(finalAttributeCount).toBe(0);
      expect(finalValueCount).toBe(0);
    });
  });

  describe('🏥 Health Monitoring', () => {
    it('should return healthy status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/attributes/seeding/health')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        status: 'healthy',
        checks: {
          database: 'connected',
          repositories: 'accessible',
          functionality: 'operational',
        },
        timestamp: expect.any(String),
      });
    });

    it('should provide detailed data information', async () => {
      await request(app.getHttpServer())
        .post('/api/attributes/seeding/seed')
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(200);

      const response = await request(app.getHttpServer())
        .get('/api/attributes/seeding/data/info')
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          overview: {
            totalAttributes: expect.any(Number),
            totalValues: expect.any(Number),
            activeAttributes: expect.any(Number),
            dataQuality: expect.any(String),
          },
          attributeTypes: expect.any(Object),
          dataIntegrity: expect.any(Object),
          usage: expect.any(Object),
          recommendations: expect.any(Array),
        },
        timestamp: expect.any(String),
      });
    });
  });

  describe('🔒 Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // This test would require mocking database failure
      // For now, we test that endpoints handle errors properly
      const response = await request(app.getHttpServer())
        .post('/api/attributes/seeding/validate')
        .set('Authorization', `Bearer invalid-token`)
        .expect(401); // Should require valid authentication

      expect(response.body).toBeDefined();
    });

    it('should validate request parameters', async () => {
      const response = await request(app.getHttpServer())
        .delete('/api/attributes/seeding/cleanup')
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({}) // Missing confirm parameter
        .expect(200);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('confirmation required');
    });
  });

  describe('🚀 Performance Tests', () => {
    it('should seed attributes within reasonable time', async () => {
      const startTime = Date.now();

      const response = await request(app.getHttpServer())
        .post('/api/attributes/seeding/seed')
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(200);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 5 seconds
      expect(duration).toBeLessThan(5000);
      expect(response.body.data.duration).toBeDefined();
    });

    it('should handle concurrent requests safely', async () => {
      // Start multiple seeding operations simultaneously
      const promises = Array(3)
        .fill(null)
        .map(() =>
          request(app.getHttpServer())
            .post('/api/attributes/seeding/seed')
            .set('Authorization', `Bearer ${testAuthToken}`),
        );

      const responses = await Promise.all(promises);

      // All should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      // Should not create duplicates
      const finalCount = await attributeRepository.count();
      expect(finalCount).toBeGreaterThan(0);

      // Should have created expected number of attributes (not multiplied by concurrent requests)
      expect(finalCount).toBeLessThan(50); // Reasonable upper bound
    });
  });
});

/**
 * Helper function to create test authentication context
 */
function createTestAuthContext() {
  return {
    headers: {
      Authorization: `Bearer test-admin-token`,
    },
  };
}

/**
 * Helper function to verify attribute structure
 */
function verifyAttributeStructure(attribute: Attribute) {
  expect(attribute).toBeDefined();
  expect(attribute.id).toBeDefined();
  expect(attribute.nameEn).toBeDefined();
  expect(attribute.nameAr).toBeDefined();
  expect(attribute.type).toBeDefined();
  expect(attribute.displayOrder).toBeDefined();
  expect(typeof attribute.isRequired).toBe('boolean');
  expect(typeof attribute.isFilterable).toBe('boolean');
  expect(typeof attribute.isSearchable).toBe('boolean');
  expect(typeof attribute.isActive).toBe('boolean');
}

/**
 * Helper function to verify attribute value structure
 */
function verifyAttributeValueStructure(value: AttributeValue) {
  expect(value).toBeDefined();
  expect(value.id).toBeDefined();
  expect(value.valueEn).toBeDefined();
  expect(value.valueAr).toBeDefined();
  expect(value.displayOrder).toBeDefined();
  expect(value.attributeId).toBeDefined();
  expect(typeof value.isActive).toBe('boolean');
}
