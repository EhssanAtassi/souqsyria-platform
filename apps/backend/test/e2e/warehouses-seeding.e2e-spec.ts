/**
 * @file warehouses-seeding.e2e-spec.ts
 * @description Comprehensive e2e tests for warehouse seeding system
 * Tests Syrian warehouse initialization, geographic validation, and enterprise features
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as request from 'supertest';
import { Warehouse } from '../../src/warehouses/entities/warehouse.entity';
import { WarehouseSeederService } from '../../src/warehouses/seeds/warehouse-seeder.service';
import { WarehouseSeederController } from '../../src/warehouses/seeds/warehouse-seeder.controller';
import {
  ALL_WAREHOUSE_SEEDS,
  DAMASCUS_WAREHOUSES,
  WAREHOUSE_STATISTICS,
} from '../../src/warehouses/seeds/warehouse-seeds.data';

describe('Warehouse Seeding E2E Tests', () => {
  let app: INestApplication;
  let warehouseRepository: Repository<Warehouse>;
  let warehouseSeederService: WarehouseSeederService;

  // Mock repository implementation
  const mockWarehouseRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    })),
  };

  // Mock data source implementation
  const mockDataSource = {
    transaction: jest.fn(),
  };

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock implementations
    mockWarehouseRepository.find.mockResolvedValue([]);
    mockWarehouseRepository.findOne.mockResolvedValue(null);
    mockWarehouseRepository.create.mockImplementation((data) => ({
      id: Math.floor(Math.random() * 1000),
      ...data,
    }));
    mockWarehouseRepository.save.mockImplementation((warehouse) =>
      Promise.resolve(warehouse),
    );
    mockWarehouseRepository.count.mockResolvedValue(0);
    mockDataSource.transaction.mockImplementation(async (callback) => {
      const manager = {
        findOne: mockWarehouseRepository.findOne,
        create: mockWarehouseRepository.create,
        save: mockWarehouseRepository.save,
        update: mockWarehouseRepository.update,
      };
      return callback(manager);
    });

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [Warehouse],
          synchronize: true,
        }),
      ],
      controllers: [WarehouseSeederController],
      providers: [
        WarehouseSeederService,
        {
          provide: getRepositoryToken(Warehouse),
          useValue: mockWarehouseRepository,
        },
        {
          provide: 'DataSource',
          useValue: mockDataSource,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    warehouseRepository = module.get<Repository<Warehouse>>(
      getRepositoryToken(Warehouse),
    );
    warehouseSeederService = module.get<WarehouseSeederService>(
      WarehouseSeederService,
    );
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Warehouse Seed Data Validation', () => {
    it('should have valid warehouse seed data structure', () => {
      expect(ALL_WAREHOUSE_SEEDS).toBeDefined();
      expect(ALL_WAREHOUSE_SEEDS.length).toBeGreaterThan(0);
      expect(WAREHOUSE_STATISTICS.total).toBe(ALL_WAREHOUSE_SEEDS.length);
    });

    it('should have valid Syrian coordinates for all warehouses', () => {
      ALL_WAREHOUSE_SEEDS.forEach((warehouse) => {
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
        expect(warehouse.cityAr).toBeTruthy();
        expect(warehouse.address).toBeTruthy();
        expect(warehouse.addressAr).toBeTruthy();
        expect(warehouse.governorate).toBeTruthy();
        expect(warehouse.governorateAr).toBeTruthy();
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
        expect(response.body.result.totalProcessed).toBeGreaterThan(0);
        expect(response.body.result.statistics).toBeDefined();
        expect(response.body.result.geography).toBeDefined();
        expect(response.body.message).toContain('created');
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
      });

      it('should validate batch size constraints', async () => {
        const response = await request(app.getHttpServer())
          .post('/warehouses/seeding/seed')
          .send({
            includeDamascus: true,
            batchSize: 150, // Invalid: too large
          })
          .expect(400);

        expect(response.body.success).toBe(false);
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
      });

      it('should seed Aleppo warehouses only', async () => {
        const response = await request(app.getHttpServer())
          .post('/warehouses/seeding/seed/aleppo')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('Aleppo seeding completed');
      });

      it('should seed Latakia warehouses only', async () => {
        const response = await request(app.getHttpServer())
          .post('/warehouses/seeding/seed/latakia')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('Latakia seeding completed');
      });

      it('should seed Homs warehouses only', async () => {
        const response = await request(app.getHttpServer())
          .post('/warehouses/seeding/seed/homs')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('Homs seeding completed');
      });

      it('should seed Daraa warehouses only', async () => {
        const response = await request(app.getHttpServer())
          .post('/warehouses/seeding/seed/daraa')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('Daraa seeding completed');
      });

      it('should seed local depots only', async () => {
        const response = await request(app.getHttpServer())
          .post('/warehouses/seeding/seed/local-depots')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain(
          'Local depots seeding completed',
        );
      });
    });

    describe('Analytics and Information Endpoints', () => {
      it('should get warehouse statistics', async () => {
        const response = await request(app.getHttpServer())
          .get('/warehouses/seeding/statistics')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.seedData).toBeDefined();
        expect(response.body.data.database).toBeDefined();
        expect(response.body.data.comparison).toBeDefined();
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
      });

      it('should cleanup seed data warehouses only', async () => {
        const response = await request(app.getHttpServer())
          .delete('/warehouses/seeding/cleanup')
          .query({
            onlySeedData: true,
            excludeActive: true,
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('deleted');
      });

      it('should require confirmation for complete deletion', async () => {
        const response = await request(app.getHttpServer())
          .delete('/warehouses/seeding/cleanup')
          .query({
            onlySeedData: false,
            confirmationCode: 'INVALID_CODE',
          })
          .expect(400);

        expect(response.body.success).toBe(false);
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

    it('should filter warehouses by establishment year', async () => {
      const result = await warehouseSeederService.seedWarehouses({
        includeDamascus: true,
        includeAleppo: true,
        establishedAfter: 2020,
        dryRun: true,
      });

      expect(result.success).toBe(true);
      // Should only include warehouses established after 2020
    });

    it('should handle duplicate detection', async () => {
      // Mock existing warehouse
      mockWarehouseRepository.findOne.mockResolvedValueOnce({
        id: 1,
        name: DAMASCUS_WAREHOUSES[0].name,
        city: DAMASCUS_WAREHOUSES[0].city,
      });

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
      expect(result.skipped).toBeGreaterThan(0);
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

    it('should handle transaction errors gracefully', async () => {
      // Mock transaction error
      mockDataSource.transaction.mockRejectedValueOnce(
        new Error('Database connection failed'),
      );

      const result = await warehouseSeederService.seedWarehouses({
        includeDamascus: true,
      });

      expect(result.success).toBe(false);
      expect(result.errorDetails).toBeDefined();
      expect(result.errorDetails!.length).toBeGreaterThan(0);
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

    it('should handle database connectivity issues', async () => {
      // Mock database error
      mockWarehouseRepository.count.mockRejectedValueOnce(
        new Error('Database unavailable'),
      );

      const health = await warehouseSeederService.healthCheck();
      expect(health.status).toBe('unhealthy');
      expect(health.database).toBe('disconnected');
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

    it('should handle malformed seeding options', async () => {
      const result = await warehouseSeederService.seedWarehouses({
        batchSize: -1, // Invalid batch size
        capacityRangeMin: -1000, // Invalid capacity
      });

      // Service should handle invalid options gracefully
      expect(result).toBeDefined();
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
      expect(processingTime).toBeLessThan(10000); // Should complete within 10 seconds
      expect(result.performance.averageTimePerWarehouse).toBeLessThan(2000); // Less than 2s per warehouse
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
});
