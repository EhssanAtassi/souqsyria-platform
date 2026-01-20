/**
 * @file shipment-seeder.service.spec.ts
 * @description Unit tests for ShipmentSeederService
 *
 * COVERAGE:
 * - Syrian shipping companies seeding
 * - Legacy shipping companies seeding
 * - Sample shipments creation
 * - Status logs generation
 * - Bulk shipment operations
 * - Data integrity verification
 * - Error handling and edge cases
 *
 * @author SouqSyria Development Team
 * @since 2025-08-20
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import {
  ShipmentSeederService,
  ShipmentSeedingConfig,
} from './shipment-seeder.service';
import { SyrianShippingCompanyEntity } from '../entities/syrian-shipping-company.entity';
import { ShippingCompany } from '../entities/shipping-company.entity';
import { Shipment } from '../entities/shipment.entity';
import { ShipmentStatusLog } from '../entities/shipment-status-log.entity';
import { ShipmentItem } from '../entities/shipment-item.entity';

describe('ShipmentSeederService', () => {
  let service: ShipmentSeederService;
  let syrianShippingCompanyRepository: jest.Mocked<
    Repository<SyrianShippingCompanyEntity>
  >;
  let shippingCompanyRepository: jest.Mocked<Repository<ShippingCompany>>;
  let shipmentRepository: jest.Mocked<Repository<Shipment>>;
  let shipmentStatusLogRepository: jest.Mocked<Repository<ShipmentStatusLog>>;
  let shipmentItemRepository: jest.Mocked<Repository<ShipmentItem>>;
  let dataSource: jest.Mocked<DataSource>;
  let mockManager: any;

  beforeEach(async () => {
    // Create mock manager for transactions
    mockManager = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShipmentSeederService,
        {
          provide: getRepositoryToken(SyrianShippingCompanyEntity),
          useValue: {
            count: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ShippingCompany),
          useValue: {
            count: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Shipment),
          useValue: {
            count: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ShipmentStatusLog),
          useValue: {
            count: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ShipmentItem),
          useValue: {
            count: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn((callback) => callback(mockManager)),
          },
        },
      ],
    }).compile();

    service = module.get<ShipmentSeederService>(ShipmentSeederService);
    syrianShippingCompanyRepository = module.get(
      getRepositoryToken(SyrianShippingCompanyEntity),
    );
    shippingCompanyRepository = module.get(getRepositoryToken(ShippingCompany));
    shipmentRepository = module.get(getRepositoryToken(Shipment));
    shipmentStatusLogRepository = module.get(
      getRepositoryToken(ShipmentStatusLog),
    );
    shipmentItemRepository = module.get(getRepositoryToken(ShipmentItem));
    dataSource = module.get(DataSource);
  });

  describe('🏗️ Service Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have all required repositories injected', () => {
      expect(syrianShippingCompanyRepository).toBeDefined();
      expect(shippingCompanyRepository).toBeDefined();
      expect(shipmentRepository).toBeDefined();
      expect(shipmentStatusLogRepository).toBeDefined();
      expect(shipmentItemRepository).toBeDefined();
      expect(dataSource).toBeDefined();
    });
  });

  describe('🚀 seedAll()', () => {
    it('should seed all components with default configuration', async () => {
      // Mock successful operations
      mockManager.findOne.mockResolvedValue(null); // No existing data
      mockManager.create.mockReturnValue({});
      mockManager.save.mockResolvedValue({});

      const result = await service.seedAll();

      expect(result).toMatchObject({
        syrianCompaniesCreated: expect.any(Number),
        legacyCompaniesCreated: expect.any(Number),
        shipmentsCreated: expect.any(Number),
        statusLogsCreated: expect.any(Number),
        totalExecutionTime: expect.any(Number),
        errors: [],
        warnings: [],
      });

      expect(dataSource.transaction).toHaveBeenCalled();
    });

    it('should respect custom seeding configuration', async () => {
      const config: ShipmentSeedingConfig = {
        syrianCompanies: true,
        legacyCompanies: false,
        sampleShipments: false,
        statusLogs: false,
        bulkShipments: 0,
      };

      mockManager.findOne.mockResolvedValue(null);
      mockManager.create.mockReturnValue({});
      mockManager.save.mockResolvedValue({});

      const result = await service.seedAll(config);

      expect(result.syrianCompaniesCreated).toBeGreaterThan(0);
      expect(result.legacyCompaniesCreated).toBe(0);
      expect(result.shipmentsCreated).toBe(0);
      expect(result.statusLogsCreated).toBe(0);
    });

    it('should handle bulk shipments when configured', async () => {
      const config: ShipmentSeedingConfig = {
        syrianCompanies: true,
        legacyCompanies: false,
        sampleShipments: false,
        statusLogs: false,
        bulkShipments: 100,
        performanceTest: true,
      };

      mockManager.findOne
        .mockResolvedValueOnce(null) // No existing Syrian company
        .mockResolvedValueOnce(null) // No existing legacy company
        .mockResolvedValueOnce({ id: 1, nameEn: 'Test Company' }); // Syrian company exists for bulk

      mockManager.create.mockReturnValue({});
      mockManager.save.mockResolvedValue({});

      const result = await service.seedAll(config);

      expect(result.shipmentsCreated).toBe(100);
      expect(result.syrianCompaniesCreated).toBeGreaterThan(0);
    });

    it('should handle errors gracefully', async () => {
      // Mock error during transaction
      dataSource.transaction.mockRejectedValue(new Error('Database error'));

      await expect(service.seedAll()).rejects.toThrow('Database error');
    });
  });

  describe('📊 getSeedingStats()', () => {
    it('should return comprehensive statistics', async () => {
      // Mock repository counts
      syrianShippingCompanyRepository.count.mockResolvedValue(2);
      shippingCompanyRepository.count.mockResolvedValue(3);
      shipmentRepository.count.mockResolvedValue(1500);
      shipmentStatusLogRepository.count.mockResolvedValue(4500);

      // Mock shipments by status query
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { shipment_status: 'created', count: '150' },
          { shipment_status: 'delivered', count: '450' },
        ]),
      };

      (shipmentRepository.createQueryBuilder as jest.Mock).mockReturnValue(
        mockQueryBuilder,
      );

      const stats = await service.getSeedingStats();

      expect(stats).toMatchObject({
        overview: {
          syrianShippingCompanies: 2,
          legacyShippingCompanies: 3,
          totalShipments: 1500,
          statusLogs: 4500,
        },
        shipmentsByStatus: {
          created: 150,
          delivered: 450,
        },
        lastUpdated: expect.any(String),
      });
    });
  });

  describe('🔍 verifyDataIntegrity()', () => {
    it('should pass integrity check with valid data', async () => {
      // Mock query builders for integrity checks
      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
        select: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };

      (shipmentRepository.createQueryBuilder as jest.Mock).mockReturnValue(
        mockQueryBuilder,
      );

      // Mock stats
      syrianShippingCompanyRepository.count.mockResolvedValue(2);
      shippingCompanyRepository.count.mockResolvedValue(3);
      shipmentRepository.count.mockResolvedValue(100);
      shipmentStatusLogRepository.count.mockResolvedValue(300);

      const result = await service.verifyDataIntegrity();

      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.summary).toBeDefined();
    });

    it('should detect integrity issues', async () => {
      // Mock query builders to return issues
      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getCount: jest
          .fn()
          .mockResolvedValueOnce(5) // 5 orphaned shipments
          .mockResolvedValueOnce(2) // 2 invalid tracking codes
          .mockResolvedValueOnce(3), // 3 shipments without cost
        select: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };

      (shipmentRepository.createQueryBuilder as jest.Mock).mockReturnValue(
        mockQueryBuilder,
      );

      // Mock stats
      syrianShippingCompanyRepository.count.mockResolvedValue(2);
      shippingCompanyRepository.count.mockResolvedValue(3);
      shipmentRepository.count.mockResolvedValue(100);
      shipmentStatusLogRepository.count.mockResolvedValue(300);

      const result = await service.verifyDataIntegrity();

      expect(result.isValid).toBe(false);
      expect(result.issues.length).toBeGreaterThanOrEqual(3);
      expect(
        result.issues.some((issue) =>
          issue.includes('5 shipments without assigned shipping company'),
        ),
      ).toBe(true);
    });

    it('should handle verification errors', async () => {
      (shipmentRepository.createQueryBuilder as jest.Mock).mockImplementation(
        () => {
          throw new Error('Database connection failed');
        },
      );

      const result = await service.verifyDataIntegrity();

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain(
        'Integrity check failed: Database connection failed',
      );
      expect(result.summary).toBeNull();
    });
  });

  describe('🧹 clearAllData()', () => {
    it('should clear all data in correct order', async () => {
      mockManager.delete.mockResolvedValue({ affected: 1 });

      await service.clearAllData();

      // Verify deletion order (FK constraints)
      expect(mockManager.delete).toHaveBeenNthCalledWith(
        1,
        ShipmentStatusLog,
        {},
      );
      expect(mockManager.delete).toHaveBeenNthCalledWith(2, ShipmentItem, {});
      expect(mockManager.delete).toHaveBeenNthCalledWith(3, Shipment, {});
      expect(mockManager.delete).toHaveBeenNthCalledWith(
        4,
        SyrianShippingCompanyEntity,
        {},
      );
      expect(mockManager.delete).toHaveBeenNthCalledWith(
        5,
        ShippingCompany,
        {},
      );
    });

    it('should handle deletion errors', async () => {
      mockManager.delete.mockRejectedValue(
        new Error('FK constraint violation'),
      );

      await expect(service.clearAllData()).rejects.toThrow(
        'FK constraint violation',
      );
    });
  });

  describe('🎯 Edge Cases and Error Handling', () => {
    it('should skip existing Syrian companies', async () => {
      mockManager.findOne.mockResolvedValue({
        id: 1,
        nameEn: 'Existing Company',
      });

      const result = await service.seedAll({
        syrianCompanies: true,
        legacyCompanies: false,
        sampleShipments: false,
        statusLogs: false,
      });

      expect(result.syrianCompaniesCreated).toBe(0);
    });

    it('should handle large bulk shipment requests efficiently', async () => {
      const config: ShipmentSeedingConfig = {
        syrianCompanies: false,
        legacyCompanies: false,
        sampleShipments: false,
        statusLogs: false,
        bulkShipments: 5000,
        performanceTest: true,
      };

      mockManager.findOne.mockResolvedValue({ id: 1, nameEn: 'Test Company' });
      mockManager.create.mockReturnValue({});
      mockManager.save.mockResolvedValue([]);

      const result = await service.seedAll(config);

      expect(result.shipmentsCreated).toBe(5000);
      // Verify chunked inserts were used (multiple save calls)
      expect(mockManager.save).toHaveBeenCalledTimes(50); // 5000/100 chunks
    });

    it('should handle missing Syrian company for bulk shipments', async () => {
      const config: ShipmentSeedingConfig = {
        syrianCompanies: false,
        legacyCompanies: false,
        sampleShipments: false,
        statusLogs: false,
        bulkShipments: 100,
      };

      mockManager.findOne.mockResolvedValue(null); // No Syrian company found

      const result = await service.seedAll(config);

      expect(result.shipmentsCreated).toBe(0);
    });

    it('should handle status log creation when no shipments exist', async () => {
      mockManager.findOne.mockResolvedValue(null); // No shipments found

      const result = await service.seedAll({
        syrianCompanies: false,
        legacyCompanies: false,
        sampleShipments: false,
        statusLogs: true,
      });

      expect(result.statusLogsCreated).toBe(0);
    });
  });

  describe('📈 Performance Testing', () => {
    it('should generate realistic bulk data for performance tests', async () => {
      const config: ShipmentSeedingConfig = {
        syrianCompanies: false,
        legacyCompanies: false,
        sampleShipments: false,
        statusLogs: false,
        bulkShipments: 1000,
        performanceTest: true,
      };

      mockManager.findOne.mockResolvedValue({ id: 1, nameEn: 'Test Company' });
      mockManager.create.mockImplementation((entity, data) => data);
      mockManager.save.mockResolvedValue([]);

      const result = await service.seedAll(config);

      expect(result.shipmentsCreated).toBe(1000);
      expect(result.totalExecutionTime).toBeGreaterThan(0);
    });
  });
});
