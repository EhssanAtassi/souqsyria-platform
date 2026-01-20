/**
 * @file warehouses-seeding-simple.e2e-spec.ts
 * @description Simple E2E Tests for Warehouse Seeding System without full app bootstrap
 * Tests Syrian warehouse initialization, geographic validation, and enterprise features
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Repository, DataSource } from 'typeorm';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Warehouse } from '../../src/warehouses/entities/warehouse.entity';
import { WarehousesModule } from '../../src/warehouses/warehouses.module';
import { WarehouseSeederService } from '../../src/warehouses/seeds/warehouse-seeder.service';
import {
  ALL_WAREHOUSE_SEEDS,
  DAMASCUS_WAREHOUSES,
  WAREHOUSE_STATISTICS,
} from '../../src/warehouses/seeds/warehouse-seeds.data';

describe('Warehouse Seeding Simple (e2e)', () => {
  let app: INestApplication;
  let module: TestingModule;
  let warehouseRepository: Repository<Warehouse>;
  let warehouseSeederService: WarehouseSeederService;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'mysql',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_TEST_PORT) || 3307,
          username: process.env.DB_USER || 'root',
          password: process.env.DB_PASS || '',
          database: process.env.DB_TEST_NAME || 'souq_syria_test',
          entities: [Warehouse],
          synchronize: true,
          dropSchema: true,
        }),
        WarehousesModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get services and repositories
    warehouseRepository = moduleFixture.get<Repository<Warehouse>>(
      getRepositoryToken(Warehouse),
    );
    warehouseSeederService = moduleFixture.get<WarehouseSeederService>(
      WarehouseSeederService,
    );
    dataSource = moduleFixture.get<DataSource>(DataSource);

    // Cleanup any existing data
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await app.close();
  });

  beforeEach(async () => {
    // Clean database before each test
    await warehouseRepository.delete({});
  });

  describe('Warehouse Seed Data Validation', () => {
    it('should have valid warehouse seed data structure', () => {
      expect(ALL_WAREHOUSE_SEEDS).toBeDefined();
      expect(ALL_WAREHOUSE_SEEDS.length).toBeGreaterThan(0);
      expect(WAREHOUSE_STATISTICS.total).toBe(ALL_WAREHOUSE_SEEDS.length);
      expect(WAREHOUSE_STATISTICS.total).toBe(8); // Expected number of warehouses
    });

    it('should have valid Syrian coordinates for all warehouses', () => {
      ALL_WAREHOUSE_SEEDS.forEach((warehouse) => {
        // Syria boundaries: lat 32.0-37.5, lng 35.0-42.0
        expect(warehouse.latitude).toBeGreaterThanOrEqual(32.0);
        expect(warehouse.latitude).toBeLessThanOrEqual(37.5);
        expect(warehouse.longitude).toBeGreaterThanOrEqual(35.0);
        expect(warehouse.longitude).toBeLessThanOrEqual(42.0);
      });
    });

    it('should have required fields for all warehouses', () => {
      ALL_WAREHOUSE_SEEDS.forEach((warehouse) => {
        expect(warehouse.name).toBeTruthy();
        expect(warehouse.nameAr).toBeTruthy();
        expect(warehouse.city).toBeTruthy();
        expect(warehouse.address).toBeTruthy();
        expect(warehouse.governorate).toBeTruthy();
        expect(warehouse.capacity).toBeGreaterThan(0);
        expect([
          'main_hub',
          'regional_center',
          'local_depot',
          'specialized',
        ]).toContain(warehouse.warehouseType);
        expect(['high', 'medium', 'low']).toContain(warehouse.priorityLevel);
      });
    });

    it('should have diverse warehouse types and regions', () => {
      const types = new Set(ALL_WAREHOUSE_SEEDS.map((w) => w.warehouseType));
      const governorates = new Set(
        ALL_WAREHOUSE_SEEDS.map((w) => w.governorate),
      );

      expect(types.size).toBeGreaterThanOrEqual(3);
      expect(governorates.size).toBeGreaterThanOrEqual(5);
      expect(governorates).toContain('Damascus');
      expect(governorates).toContain('Aleppo');
    });
  });

  describe('Warehouse Seeding API Endpoints', () => {
    describe('POST /warehouses/seeding/seed', () => {
      it('should seed all warehouses successfully', async () => {
        const response = await request(app.getHttpServer())
          .post('/warehouses/seeding/seed')
          .send({
            includeDamascus: true,
            includeAleppo: true,
            includeLatakia: true,
            includeHoms: true,
            includeDaraa: true,
            includeLocalDepots: true,
            skipDuplicates: true,
            validateGeography: true,
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.result).toBeDefined();
        expect(response.body.result.totalProcessed).toBe(8);
        expect(response.body.result.created).toBe(8);
        expect(response.body.result.statistics).toBeDefined();
        expect(response.body.result.geography).toBeDefined();
        expect(response.body.message).toContain('created');

        // Verify warehouses were actually created in database
        const dbWarehouses = await warehouseRepository.find();
        expect(dbWarehouses.length).toBe(8);
      });

      it('should perform dry run without database changes', async () => {
        const response = await request(app.getHttpServer())
          .post('/warehouses/seeding/seed')
          .send({
            includeDamascus: true,
            includeAleppo: true,
            dryRun: true,
            validateGeography: true,
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.result.dryRunResults).toBeDefined();
        expect(response.body.result.created).toBe(0);
        expect(response.body.result.dryRunResults.wouldCreate).toBeGreaterThan(
          0,
        );

        // Verify no warehouses were created in database
        const dbWarehouses = await warehouseRepository.find();
        expect(dbWarehouses.length).toBe(0);
      });

      it('should filter warehouses by specific criteria', async () => {
        const response = await request(app.getHttpServer())
          .post('/warehouses/seeding/seed')
          .send({
            includeDamascus: true,
            includeAleppo: false,
            includeLatakia: false,
            includeHoms: false,
            includeDaraa: false,
            includeLocalDepots: false,
            specificTypes: ['main_hub'],
            onlyHighPriority: true,
            capacityRangeMin: 10000,
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.result.statistics.damascus).toBeGreaterThan(0);
        expect(response.body.result.statistics.aleppo).toBe(0);

        // Verify filtered results
        const dbWarehouses = await warehouseRepository.find();
        expect(dbWarehouses.length).toBeGreaterThan(0);
        expect(dbWarehouses.length).toBeLessThan(8);
      });
    });

    describe('POST /warehouses/seeding/validate', () => {
      it('should validate warehouse data successfully', async () => {
        const response = await request(app.getHttpServer())
          .post('/warehouses/seeding/validate')
          .send({
            includeDamascus: true,
            includeAleppo: true,
            validateGeography: true,
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.result.totalProcessed).toBeGreaterThan(0);
        expect(response.body.message).toContain('Validation completed');
      });
    });

    describe('Regional Seeding Endpoints', () => {
      it('should seed Damascus warehouses only', async () => {
        const response = await request(app.getHttpServer())
          .post('/warehouses/seeding/seed/damascus')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('Damascus seeding completed');

        // Verify only Damascus warehouses were created
        const dbWarehouses = await warehouseRepository.find();
        expect(dbWarehouses.length).toBe(2); // Damascus has 2 warehouses

        const damascusWarehouses = dbWarehouses.filter(
          (w) => w.city === 'Damascus' || w.city === 'Douma',
        );
        expect(damascusWarehouses.length).toBe(2);
      });

      it('should seed Aleppo warehouses only', async () => {
        const response = await request(app.getHttpServer())
          .post('/warehouses/seeding/seed/aleppo')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('Aleppo seeding completed');

        // Verify only Aleppo warehouses were created
        const dbWarehouses = await warehouseRepository.find();
        expect(dbWarehouses.length).toBe(1); // Aleppo has 1 warehouse
        expect(dbWarehouses[0].city).toBe('Aleppo');
      });

      it('should seed local depots only', async () => {
        const response = await request(app.getHttpServer())
          .post('/warehouses/seeding/seed/local-depots')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain(
          'Local depots seeding completed',
        );

        // Verify only local depots were created
        const dbWarehouses = await warehouseRepository.find();
        expect(dbWarehouses.length).toBe(2); // 2 local depots
      });
    });

    describe('Analytics and Information Endpoints', () => {
      it('should get warehouse statistics', async () => {
        // First seed some warehouses
        await request(app.getHttpServer())
          .post('/warehouses/seeding/seed/damascus')
          .expect(200);

        const response = await request(app.getHttpServer())
          .get('/warehouses/seeding/statistics')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.seedData).toBeDefined();
        expect(response.body.data.database).toBeDefined();
        expect(response.body.data.comparison).toBeDefined();
        expect(response.body.data.database.totalWarehouses).toBe(2);
        expect(response.body.message).toContain('warehouses');
      });

      it('should get warehouse data info', async () => {
        const response = await request(app.getHttpServer())
          .get('/warehouses/seeding/data/info')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.total).toBe(WAREHOUSE_STATISTICS.total);
        expect(response.body.data.regions).toBeDefined();
        expect(response.body.data.totalCapacity).toBeGreaterThan(0);
        expect(response.body.message).toContain('governorates');
      });

      it('should preview warehouses with filters', async () => {
        const response = await request(app.getHttpServer())
          .get('/warehouses/seeding/warehouses/preview')
          .query({
            region: 'damascus',
            type: 'main_hub',
            minCapacity: 10000,
            limit: 5,
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.warehouses).toBeDefined();
        expect(response.body.statistics).toBeDefined();
        expect(response.body.message).toContain('Found');
        expect(response.body.warehouses.length).toBeGreaterThan(0);
      });

      it('should get health check status', async () => {
        const response = await request(app.getHttpServer())
          .get('/warehouses/seeding/health')
          .expect(200);

        expect(response.body.status).toBe('healthy');
        expect(response.body.database).toBe('connected');
        expect(response.body.statistics).toBeDefined();
        expect(response.body.message).toContain('healthy');
      });
    });

    describe('Cleanup Operations', () => {
      it('should perform dry run cleanup', async () => {
        // First seed some warehouses
        await request(app.getHttpServer())
          .post('/warehouses/seeding/seed/damascus')
          .expect(200);

        const response = await request(app.getHttpServer())
          .delete('/warehouses/seeding/cleanup')
          .query({
            onlySeedData: true,
            dryRun: true,
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.deletedCount).toBe(0);
        expect(response.body.dryRunResults).toBeDefined();

        // Verify warehouses still exist
        const dbWarehouses = await warehouseRepository.find();
        expect(dbWarehouses.length).toBe(2);
      });

      it('should cleanup seed data warehouses only', async () => {
        // First seed some warehouses
        await request(app.getHttpServer())
          .post('/warehouses/seeding/seed/damascus')
          .expect(200);

        const response = await request(app.getHttpServer())
          .delete('/warehouses/seeding/cleanup')
          .query({
            onlySeedData: true,
            excludeActive: true,
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('deleted');

        // Verify warehouses were deleted
        const dbWarehouses = await warehouseRepository.find();
        expect(dbWarehouses.length).toBe(0);
      });
    });
  });

  describe('Warehouse Seeder Service Business Logic', () => {
    it('should validate Syrian coordinates correctly', async () => {
      const result =
        await warehouseSeederService.validateWarehouseData(DAMASCUS_WAREHOUSES);

      expect(result.isValid).toBe(true);
      expect(result.geographyCheck.coordinatesValid).toBe(
        DAMASCUS_WAREHOUSES.length,
      );
      expect(result.geographyCheck.coordinatesInvalid).toBe(0);
    });

    it('should detect invalid coordinates', async () => {
      const invalidWarehouse = {
        ...DAMASCUS_WAREHOUSES[0],
        name: 'Invalid Warehouse',
        latitude: 60.0, // Outside Syria
        longitude: 10.0, // Outside Syria
      };

      const result = await warehouseSeederService.validateWarehouseData([
        invalidWarehouse,
      ]);

      expect(result.isValid).toBe(false);
      expect(result.geographyCheck.coordinatesInvalid).toBe(1);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should filter warehouses by capacity range', async () => {
      const result = await warehouseSeederService.seedWarehouses({
        includeDamascus: true,
        includeAleppo: true,
        capacityRangeMin: 10000,
        dryRun: true,
      });

      expect(result.success).toBe(true);
      expect(result.totalProcessed).toBeGreaterThan(0);
      // Should only include warehouses with capacity >= 10000
    });

    it('should handle duplicate detection', async () => {
      // First seed Damascus warehouses
      await warehouseSeederService.seedWarehouses({
        includeDamascus: true,
        includeAleppo: false,
        includeLatakia: false,
        includeHoms: false,
        includeDaraa: false,
        includeLocalDepots: false,
      });

      // Try to seed again with skipDuplicates
      const result = await warehouseSeederService.seedWarehouses({
        includeDamascus: true,
        includeAleppo: false,
        includeLatakia: false,
        includeHoms: false,
        includeDaraa: false,
        includeLocalDepots: false,
        skipDuplicates: true,
      });

      expect(result.success).toBe(true);
      expect(result.skipped).toBe(2); // Damascus has 2 warehouses
      expect(result.created).toBe(0);
    });

    it('should calculate geography statistics correctly', async () => {
      const result = await warehouseSeederService.seedWarehouses({
        includeDamascus: true,
        includeAleppo: true,
        dryRun: true,
      });

      expect(result.geography.governoratesCovered).toBeGreaterThan(0);
      expect(result.geography.totalCapacity).toBeGreaterThan(0);
      expect(result.geography.averageCapacity).toBeGreaterThan(0);
      expect(result.geography.coordinateValidation).toContain('valid');
    });

    it('should perform batch processing correctly', async () => {
      const result = await warehouseSeederService.seedWarehouses({
        includeDamascus: true,
        includeAleppo: true,
        batchSize: 2,
      });

      expect(result.success).toBe(true);
      expect(result.performance.batchProcessingTime).toBeGreaterThan(0);
      expect(result.performance.averageTimePerWarehouse).toBeGreaterThan(0);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty filter results gracefully', async () => {
      const result = await warehouseSeederService.seedWarehouses({
        includeDamascus: false,
        includeAleppo: false,
        includeLatakia: false,
        includeHoms: false,
        includeDaraa: false,
        includeLocalDepots: false,
      });

      expect(result.success).toBe(true);
      expect(result.totalProcessed).toBe(0);
      expect(result.created).toBe(0);
    });

    it('should validate required confirmation for dangerous operations', async () => {
      try {
        await warehouseSeederService.cleanupWarehouses({
          onlySeedData: false,
          confirmationCode: 'WRONG_CODE',
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('Confirmation code required');
      }
    });
  });

  describe('Performance and Scalability', () => {
    it('should complete seeding within reasonable time', async () => {
      const startTime = Date.now();

      const result = await warehouseSeederService.seedWarehouses({
        includeDamascus: true,
        includeAleppo: true,
        includeLatakia: true,
        includeHoms: true,
        includeDaraa: true,
        includeLocalDepots: true,
      });

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(result.success).toBe(true);
      expect(processingTime).toBeLessThan(30000); // Should complete within 30 seconds
      expect(result.performance.averageTimePerWarehouse).toBeLessThan(5000); // Less than 5s per warehouse
    });

    it('should provide detailed performance metrics', async () => {
      const result = await warehouseSeederService.seedWarehouses({
        includeDamascus: true,
        includeAleppo: true,
      });

      expect(result.performance).toBeDefined();
      expect(result.performance.averageTimePerWarehouse).toBeGreaterThan(0);
      expect(result.performance.batchProcessingTime).toBeGreaterThan(0);
      expect(result.performance.dbOperationTime).toBeGreaterThan(0);
      expect(result.performance.validationTime).toBeGreaterThanOrEqual(0);
    });
  });

  // Helper functions
  async function cleanupTestData() {
    try {
      await warehouseRepository.delete({});
    } catch (error) {
      // Ignore cleanup errors
      console.log('Cleanup error (ignored):', error.message);
    }
  }
});
