/**
 * @file warehouses-seeding-integration.spec.ts
 * @description Integration tests for Warehouse Seeding System
 * Tests service logic and data validation without full e2e setup
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Warehouse } from '../../src/warehouses/entities/warehouse.entity';
import { WarehouseSeederService } from '../../src/warehouses/seeds/warehouse-seeder.service';
import { WarehouseSeederController } from '../../src/warehouses/seeds/warehouse-seeder.controller';
import {
  ALL_WAREHOUSE_SEEDS,
  DAMASCUS_WAREHOUSES,
  WAREHOUSE_STATISTICS,
} from '../../src/warehouses/seeds/warehouse-seeds.data';

describe('Warehouse Seeding Integration', () => {
  let service: WarehouseSeederService;
  let controller: WarehouseSeederController;
  let mockRepository: jest.Mocked<Repository<Warehouse>>;
  let mockDataSource: jest.Mocked<DataSource>;

  beforeEach(async () => {
    // Create mock repository
    mockRepository = {
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
    } as any;

    // Create mock data source
    mockDataSource = {
      transaction: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WarehouseSeederController],
      providers: [
        WarehouseSeederService,
        {
          provide: getRepositoryToken(Warehouse),
          useValue: mockRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<WarehouseSeederService>(WarehouseSeederService);
    controller = module.get<WarehouseSeederController>(
      WarehouseSeederController,
    );

    // Setup default mock implementations
    mockRepository.findOne.mockResolvedValue(null);
    mockRepository.create.mockImplementation(
      (data) => ({ id: Math.floor(Math.random() * 1000), ...data }) as any,
    );
    mockRepository.save.mockImplementation((warehouse) =>
      Promise.resolve(warehouse),
    );
    mockRepository.count.mockResolvedValue(0);
    mockDataSource.transaction.mockImplementation(async (callback) => {
      const manager = {
        findOne: mockRepository.findOne,
        create: mockRepository.create,
        save: mockRepository.save,
        update: mockRepository.update,
      };
      return callback(manager);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Warehouse Seed Data Integrity', () => {
    it('should have valid seed data structure', () => {
      expect(ALL_WAREHOUSE_SEEDS).toBeDefined();
      expect(Array.isArray(ALL_WAREHOUSE_SEEDS)).toBe(true);
      expect(ALL_WAREHOUSE_SEEDS.length).toBe(8);
      expect(WAREHOUSE_STATISTICS.total).toBe(8);
    });

    it('should have all required fields for each warehouse', () => {
      ALL_WAREHOUSE_SEEDS.forEach((warehouse, index) => {
        expect(warehouse.name, `Warehouse ${index} missing name`).toBeTruthy();
        expect(
          warehouse.nameAr,
          `Warehouse ${index} missing nameAr`,
        ).toBeTruthy();
        expect(warehouse.city, `Warehouse ${index} missing city`).toBeTruthy();
        expect(
          warehouse.address,
          `Warehouse ${index} missing address`,
        ).toBeTruthy();
        expect(
          warehouse.latitude,
          `Warehouse ${index} missing latitude`,
        ).toBeDefined();
        expect(
          warehouse.longitude,
          `Warehouse ${index} missing longitude`,
        ).toBeDefined();
        expect(
          warehouse.capacity,
          `Warehouse ${index} missing capacity`,
        ).toBeGreaterThan(0);
      });
    });

    it('should have valid Syrian coordinates', () => {
      ALL_WAREHOUSE_SEEDS.forEach((warehouse) => {
        // Syria boundaries
        expect(warehouse.latitude).toBeGreaterThanOrEqual(32.0);
        expect(warehouse.latitude).toBeLessThanOrEqual(37.5);
        expect(warehouse.longitude).toBeGreaterThanOrEqual(35.0);
        expect(warehouse.longitude).toBeLessThanOrEqual(42.0);
      });
    });

    it('should have proper warehouse type distribution', () => {
      const types = ALL_WAREHOUSE_SEEDS.map((w) => w.warehouseType);
      const typeDistribution = {
        main_hub: types.filter((t) => t === 'main_hub').length,
        regional_center: types.filter((t) => t === 'regional_center').length,
        local_depot: types.filter((t) => t === 'local_depot').length,
        specialized: types.filter((t) => t === 'specialized').length,
      };

      expect(typeDistribution.main_hub).toBeGreaterThan(0);
      expect(typeDistribution.regional_center).toBeGreaterThan(0);
      expect(typeDistribution.local_depot).toBeGreaterThan(0);
    });

    it('should have balanced geographic coverage', () => {
      const governorates = new Set(
        ALL_WAREHOUSE_SEEDS.map((w) => w.governorate),
      );
      expect(governorates.size).toBeGreaterThanOrEqual(6);
      expect(governorates).toContain('Damascus');
      expect(governorates).toContain('Aleppo');
      expect(governorates).toContain('Latakia');
    });
  });

  describe('WarehouseSeederService', () => {
    describe('seedWarehouses', () => {
      it('should seed all warehouses successfully', async () => {
        const result = await service.seedWarehouses({
          includeDamascus: true,
          includeAleppo: true,
          includeLatakia: true,
          includeHoms: true,
          includeDaraa: true,
          includeLocalDepots: true,
        });

        expect(result.success).toBe(true);
        expect(result.totalProcessed).toBe(8);
        expect(result.created).toBe(8);
        expect(result.updated).toBe(0);
        expect(result.skipped).toBe(0);
        expect(result.errors).toBe(0);
      });

      it('should perform dry run without creating records', async () => {
        const result = await service.seedWarehouses({
          includeDamascus: true,
          includeAleppo: true,
          dryRun: true,
        });

        expect(result.success).toBe(true);
        expect(result.created).toBe(0);
        expect(result.dryRunResults).toBeDefined();
        expect(result.dryRunResults!.wouldCreate).toBe(3); // Damascus (2) + Aleppo (1)
        expect(mockDataSource.transaction).not.toHaveBeenCalled();
      });

      it('should filter by specific regions', async () => {
        const result = await service.seedWarehouses({
          includeDamascus: true,
          includeAleppo: false,
          includeLatakia: false,
          includeHoms: false,
          includeDaraa: false,
          includeLocalDepots: false,
        });

        expect(result.success).toBe(true);
        expect(result.totalProcessed).toBe(2);
        expect(result.statistics.damascus).toBe(2);
        expect(result.statistics.aleppo).toBe(0);
      });

      it('should filter by warehouse type', async () => {
        const result = await service.seedWarehouses({
          includeDamascus: true,
          includeAleppo: true,
          includeLatakia: true,
          includeHoms: true,
          includeDaraa: true,
          includeLocalDepots: true,
          specificTypes: ['main_hub'],
        });

        expect(result.success).toBe(true);
        expect(result.totalProcessed).toBeGreaterThan(0);
        expect(result.totalProcessed).toBeLessThan(8);
      });

      it('should filter by capacity range', async () => {
        const result = await service.seedWarehouses({
          includeDamascus: true,
          includeAleppo: true,
          includeLatakia: true,
          includeHoms: true,
          includeDaraa: true,
          includeLocalDepots: true,
          capacityRangeMin: 10000,
        });

        expect(result.success).toBe(true);
        expect(result.totalProcessed).toBeGreaterThan(0);
        expect(result.totalProcessed).toBeLessThan(8);
      });

      it('should handle duplicate detection', async () => {
        // Mock existing warehouse
        mockRepository.findOne.mockResolvedValueOnce({
          id: 1,
          name: DAMASCUS_WAREHOUSES[0].name,
        } as any);

        const result = await service.seedWarehouses({
          includeDamascus: true,
          includeAleppo: false,
          includeLatakia: false,
          includeHoms: false,
          includeDaraa: false,
          includeLocalDepots: false,
          skipDuplicates: true,
        });

        expect(result.success).toBe(true);
        expect(result.skipped).toBe(1);
        expect(result.created).toBe(1);
      });
    });

    describe('validateWarehouseData', () => {
      it('should validate correct warehouse data', async () => {
        const result = await service.validateWarehouseData(DAMASCUS_WAREHOUSES);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.geographyCheck.coordinatesValid).toBe(2);
        expect(result.geographyCheck.coordinatesInvalid).toBe(0);
      });

      it('should detect invalid coordinates', async () => {
        const invalidWarehouse = {
          ...DAMASCUS_WAREHOUSES[0],
          name: 'Invalid Warehouse',
          latitude: 60.0, // Outside Syria
          longitude: 10.0, // Outside Syria
        };

        const result = await service.validateWarehouseData([invalidWarehouse]);

        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.geographyCheck.coordinatesInvalid).toBe(1);
      });

      it('should detect missing required fields', async () => {
        const invalidWarehouse = {
          ...DAMASCUS_WAREHOUSES[0],
          name: '', // Missing name
        };

        const result = await service.validateWarehouseData([invalidWarehouse]);

        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    describe('regional seeding methods', () => {
      it('should seed Damascus warehouses only', async () => {
        const result = await service.seedDamascusWarehouses();

        expect(result.success).toBe(true);
        expect(result.totalProcessed).toBe(2);
        expect(result.statistics.damascus).toBe(2);
        expect(result.statistics.aleppo).toBe(0);
      });

      it('should seed Aleppo warehouses only', async () => {
        const result = await service.seedAleppowWarehouses();

        expect(result.success).toBe(true);
        expect(result.totalProcessed).toBe(1);
        expect(result.statistics.aleppo).toBe(1);
        expect(result.statistics.damascus).toBe(0);
      });

      it('should seed local depots only', async () => {
        const result = await service.seedLocalDepots();

        expect(result.success).toBe(true);
        expect(result.totalProcessed).toBe(2);
        expect(result.statistics.localDepots).toBe(2);
        expect(result.statistics.damascus).toBe(0);
      });
    });

    describe('analytics methods', () => {
      it('should get warehouse statistics', async () => {
        mockRepository.count.mockResolvedValue(5);

        const result = await service.getWarehouseStatistics();

        expect(result.seedData).toBeDefined();
        expect(result.database.totalWarehouses).toBe(5);
        expect(result.comparison.seedingProgress).toBeDefined();
        expect(result.comparison.completionRate).toBeDefined();
      });

      it('should get warehouse data info', async () => {
        const result = await service.getWarehouseDataInfo();

        expect(result.total).toBe(8);
        expect(result.regions).toBeDefined();
        expect(result.totalCapacity).toBeGreaterThan(0);
        expect(result.governoratesCovered).toBeGreaterThan(0);
      });

      it('should get warehouse preview with filters', async () => {
        const result = await service.getWarehousePreview({
          region: 'damascus',
          type: 'main_hub',
          minCapacity: 10000,
        });

        expect(result.warehouses).toBeDefined();
        expect(result.statistics).toBeDefined();
        expect(Array.isArray(result.warehouses)).toBe(true);
      });
    });

    describe('health check', () => {
      it('should return healthy status', async () => {
        mockRepository.count.mockResolvedValue(5);

        const result = await service.healthCheck();

        expect(result.status).toBe('healthy');
        expect(result.database).toBe('connected');
        expect(result.statistics).toBeDefined();
      });

      it('should handle database errors', async () => {
        mockRepository.count.mockRejectedValue(
          new Error('Database connection failed'),
        );

        const result = await service.healthCheck();

        expect(result.status).toBe('unhealthy');
        expect(result.database).toBe('disconnected');
        expect(result.error).toBeDefined();
      });
    });

    describe('cleanup operations', () => {
      it('should perform dry run cleanup', async () => {
        const mockQueryBuilder = {
          where: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue([
            { id: 1, name: 'Damascus Central Distribution Hub' },
            { id: 2, name: 'Aleppo Northern Distribution Center' },
          ]),
        };
        mockRepository.createQueryBuilder.mockReturnValue(
          mockQueryBuilder as any,
        );

        const result = await service.cleanupWarehouses({
          onlySeedData: true,
          dryRun: true,
        });

        expect(result.success).toBe(true);
        expect(result.deletedCount).toBe(0);
        expect(result.dryRunResults).toBeDefined();
        expect(result.dryRunResults!.wouldDelete).toBe(2);
      });

      it('should cleanup seed data warehouses', async () => {
        const mockQueryBuilder = {
          where: jest.fn().mockReturnThis(),
          getMany: jest
            .fn()
            .mockResolvedValue([
              { id: 1, name: 'Damascus Central Distribution Hub' },
            ]),
        };
        mockRepository.createQueryBuilder.mockReturnValue(
          mockQueryBuilder as any,
        );
        mockRepository.remove.mockResolvedValue(undefined);

        const result = await service.cleanupWarehouses({
          onlySeedData: true,
        });

        expect(result.success).toBe(true);
        expect(result.deletedCount).toBe(1);
        expect(mockRepository.remove).toHaveBeenCalled();
      });

      it('should require confirmation for complete deletion', async () => {
        await expect(
          service.cleanupWarehouses({
            onlySeedData: false,
            confirmationCode: 'WRONG_CODE',
          }),
        ).rejects.toThrow('Confirmation code required');
      });
    });
  });

  describe('WarehouseSeederController', () => {
    it('should seed warehouses via controller', async () => {
      const result = await controller.seedWarehouses({
        includeDamascus: true,
        includeAleppo: true,
        skipDuplicates: true,
        validateGeography: true,
      });

      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
      expect(result.message).toContain('created');
    });

    it('should validate warehouses via controller', async () => {
      const result = await controller.validateWarehouses({
        includeDamascus: true,
        validateGeography: true,
      });

      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
      expect(result.message).toContain('Validation completed');
    });

    it('should get statistics via controller', async () => {
      mockRepository.count.mockResolvedValue(3);

      const result = await controller.getWarehouseStatistics();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.message).toContain('warehouses');
    });

    it('should get data info via controller', async () => {
      const result = await controller.getWarehouseDataInfo();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.message).toContain('governorates');
    });

    it('should get warehouse preview via controller', async () => {
      const result = await controller.getWarehousePreview({
        region: 'damascus',
        type: 'main_hub',
      });

      expect(result.success).toBe(true);
      expect(result.warehouses).toBeDefined();
      expect(result.message).toContain('Found');
    });

    it('should perform health check via controller', async () => {
      mockRepository.count.mockResolvedValue(5);

      const result = await controller.healthCheck();

      expect(result.status).toBe('healthy');
      expect(result.message).toContain('healthy');
    });
  });

  describe('Performance Considerations', () => {
    it('should handle large datasets efficiently', async () => {
      const startTime = Date.now();

      const result = await service.seedWarehouses({
        includeDamascus: true,
        includeAleppo: true,
        includeLatakia: true,
        includeHoms: true,
        includeDaraa: true,
        includeLocalDepots: true,
        batchSize: 5,
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      expect(result.performance.averageTimePerWarehouse).toBeLessThan(1000);
    });

    it('should provide detailed performance metrics', async () => {
      const result = await service.seedWarehouses({
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
