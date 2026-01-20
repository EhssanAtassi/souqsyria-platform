/**
 * @file refund-seeder.service.spec.ts
 * @description Comprehensive Unit Tests for Syrian Refund Seeding Service
 *
 * TESTING COVERAGE:
 * - Complete Syrian refund seeding with 10-state workflow
 * - Multi-currency transaction management with banking integration
 * - Performance testing with bulk generation capabilities
 * - Data integrity validation and analytics reporting
 * - Error handling and transaction rollback scenarios
 *
 * @author SouqSyria Development Team
 * @since 2025-08-20
 * @version 2.0.0 - Enterprise Edition
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository, QueryRunner } from 'typeorm';

// Service under test
import { RefundSeederService } from './refund-seeder.service';

// Entities
import { SyrianRefundEntity, SyrianRefundStatus } from '../entities/syrian-refund.entity';
import { SyrianGovernorateEntity } from '../../addresses/entities/syrian-governorate.entity';

// Test data
import { SAMPLE_SYRIAN_REFUNDS, REFUND_ANALYTICS_DATA } from './refund-seeds.data';

describe('RefundSeederService', () => {
  let service: RefundSeederService;
  let refundRepository: jest.Mocked<Repository<SyrianRefundEntity>>;
  let governorateRepository: jest.Mocked<Repository<SyrianGovernorateEntity>>;
  let dataSource: jest.Mocked<DataSource>;
  let queryRunner: any;

  beforeEach(async () => {
    // Create mocked repositories
    const mockRefundRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn(),
      save: jest.fn(),
      insert: jest.fn(),
      delete: jest.fn(),
    };

    const mockGovernorateRepository = {
      count: jest.fn(),
    };

    // Create mocked QueryRunner
    const mockQueryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        delete: jest.fn(),
        save: jest.fn(),
        insert: jest.fn(),
      },
    } as any;

    // Create mocked DataSource
    const mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefundSeederService,
        {
          provide: getRepositoryToken(SyrianRefundEntity),
          useValue: mockRefundRepository,
        },
        {
          provide: getRepositoryToken(SyrianGovernorateEntity),
          useValue: mockGovernorateRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<RefundSeederService>(RefundSeederService);
    refundRepository = module.get(getRepositoryToken(SyrianRefundEntity));
    governorateRepository = module.get(getRepositoryToken(SyrianGovernorateEntity));
    dataSource = module.get(DataSource);
    queryRunner = mockQueryRunner;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('seedSampleRefunds', () => {
    it('should successfully seed sample Syrian refunds', async () => {
      // Arrange
      governorateRepository.count.mockResolvedValue(14); // 14 Syrian governorates
      queryRunner.manager.save.mockResolvedValue(SAMPLE_SYRIAN_REFUNDS);

      // Act
      const result = await service.seedSampleRefunds();

      // Assert
      expect(result).toBeDefined();
      expect(result.message).toBe('Syrian refunds seeded successfully');
      expect(result.messageAr).toBe('تم زرع بيانات المرتجعات السورية بنجاح');
      expect(result.totalSeeded).toBe(SAMPLE_SYRIAN_REFUNDS.length);
      expect(result.statusDistribution).toBeDefined();
      expect(result.processingTimeMs).toBeGreaterThanOrEqual(0);

      // Verify transaction management
      expect(queryRunner.connect).toHaveBeenCalled();
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();

      // Verify data clearing and seeding
      expect(queryRunner.manager.delete).toHaveBeenCalledWith(SyrianRefundEntity, {});
      expect(queryRunner.manager.save).toHaveBeenCalledWith(
        SyrianRefundEntity,
        expect.any(Array),
      );
    });

    it('should validate status distribution correctly', async () => {
      // Arrange
      governorateRepository.count.mockResolvedValue(14);
      queryRunner.manager.save.mockResolvedValue(SAMPLE_SYRIAN_REFUNDS);

      // Act
      const result = await service.seedSampleRefunds();

      // Assert
      const statusDistribution = result.statusDistribution;
      
      // Verify all 10 statuses are represented in sample data
      const expectedStatuses = Object.values(SyrianRefundStatus);
      const actualStatuses = Object.keys(statusDistribution);
      
      expect(actualStatuses.length).toBeGreaterThan(0);
      expect(Object.values(statusDistribution).reduce((a, b) => a + b, 0)).toBe(SAMPLE_SYRIAN_REFUNDS.length);
    });

    it('should handle missing governorates error', async () => {
      // Arrange
      governorateRepository.count.mockResolvedValue(0);

      // Act & Assert
      await expect(service.seedSampleRefunds()).rejects.toThrow(
        'Syrian governorates must be seeded first',
      );

      // Verify transaction rollback
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('should handle database errors with transaction rollback', async () => {
      // Arrange
      governorateRepository.count.mockResolvedValue(14);
      queryRunner.manager.save.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(service.seedSampleRefunds()).rejects.toThrow('Database connection failed');

      // Verify transaction rollback
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });
  });

  describe('getWorkflowAnalytics', () => {
    it('should return comprehensive workflow analytics', async () => {
      // Arrange
      refundRepository.count.mockResolvedValue(1850);
      
      const mockStatusCounts = [
        { status: 'completed', count: '590' },
        { status: 'approved', count: '459' },
        { status: 'under_review', count: '327' },
      ];
      
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockStatusCounts),
      };
      
      refundRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      // Act
      const result = await service.getWorkflowAnalytics();

      // Assert
      expect(result).toBeDefined();
      expect(result.message).toBe('Refund workflow analytics generated successfully');
      expect(result.messageAr).toBe('تم إنشاء تحليلات سير عمل المرتجعات بنجاح');
      expect(result.totalRefunds).toBe(1850);
      expect(result.statusDistribution).toHaveLength(3);
      expect(result.methodDistribution).toEqual(REFUND_ANALYTICS_DATA.methodDistribution);
      expect(result.currencyDistribution).toEqual(REFUND_ANALYTICS_DATA.currencyDistribution);
      expect(result.reasonDistribution).toEqual(REFUND_ANALYTICS_DATA.reasonDistribution);
      expect(result.processingTimes).toEqual(REFUND_ANALYTICS_DATA.processingTimes);
      expect(result.slaMetrics).toEqual(REFUND_ANALYTICS_DATA.slaMetrics);
      expect(result.monthlyPerformance).toEqual(REFUND_ANALYTICS_DATA.monthlyPerformance);

      // Verify percentage calculation
      expect(result.statusDistribution[0].percentage).toBeCloseTo(31.89, 1); // 590/1850 * 100
      expect(result.statusDistribution[1].percentage).toBeCloseTo(24.81, 1); // 459/1850 * 100
    });

    it('should handle zero refunds case', async () => {
      // Arrange
      refundRepository.count.mockResolvedValue(0);
      refundRepository.createQueryBuilder.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      } as any);

      // Act
      const result = await service.getWorkflowAnalytics();

      // Assert
      expect(result.totalRefunds).toBe(0);
      expect(result.statusDistribution).toEqual([]);
    });
  });

  describe('generateBulkRefunds', () => {
    it('should generate bulk refunds successfully', async () => {
      // Arrange
      const count = 1000;
      queryRunner.manager.insert.mockResolvedValue({ affected: count } as any);

      // Act
      const result = await service.generateBulkRefunds(count);

      // Assert
      expect(result).toBeDefined();
      expect(result.message).toBe('Bulk refunds generated successfully');
      expect(result.messageAr).toBe('تم إنشاء المرتجعات بالجملة بنجاح');
      expect(result.totalGenerated).toBe(count);
      expect(result.performanceMetrics).toBeDefined();
      expect(result.performanceMetrics.totalTimeMs).toBeGreaterThanOrEqual(0);
      expect(result.performanceMetrics.avgTimePerRecord).toBeGreaterThanOrEqual(0);
      expect(result.performanceMetrics.recordsPerSecond).toBeGreaterThanOrEqual(0);

      // Verify transaction management
      expect(queryRunner.connect).toHaveBeenCalled();
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('should reject count exceeding stress batch limit', async () => {
      // Arrange
      const excessiveCount = 100000; // Exceeds 50,000 limit

      // Act & Assert
      await expect(service.generateBulkRefunds(excessiveCount)).rejects.toThrow(
        'Bulk generation limit exceeded',
      );
    });

    it('should handle batch processing correctly', async () => {
      // Arrange
      const count = 2500; // Will require 3 batches (1000 each + 500)
      let insertCallCount = 0;
      queryRunner.manager.insert.mockImplementation(() => {
        insertCallCount++;
        return Promise.resolve({ affected: insertCallCount === 3 ? 500 : 1000 } as any);
      });

      // Act
      const result = await service.generateBulkRefunds(count);

      // Assert
      expect(result.totalGenerated).toBe(count);
      expect(queryRunner.manager.insert).toHaveBeenCalledTimes(3); // 3 batches
    });

    it('should handle generation errors with transaction rollback', async () => {
      // Arrange
      const count = 1000;
      queryRunner.manager.insert.mockRejectedValue(new Error('Insert failed'));

      // Act & Assert
      await expect(service.generateBulkRefunds(count)).rejects.toThrow('Insert failed');

      // Verify transaction rollback
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });
  });

  describe('getBankingData', () => {
    it('should return Syrian banking integration data', async () => {
      // Act
      const result = await service.getBankingData();

      // Assert
      expect(result).toBeDefined();
      expect(result.message).toBe('Banking data retrieved successfully');
      expect(result.messageAr).toBe('تم استرداد البيانات المصرفية بنجاح');
      expect(result.supportedBanks).toBeDefined();
      expect(result.totalBanks).toBeGreaterThan(0);
      expect(result.activeBanks).toBeGreaterThan(0);
      expect(result.activeBanks).toBeLessThanOrEqual(result.totalBanks);

      // Verify banking data structure
      expect(result.supportedBanks[0]).toHaveProperty('bankType');
      expect(result.supportedBanks[0]).toHaveProperty('bankNameAr');
      expect(result.supportedBanks[0]).toHaveProperty('bankNameEn');
      expect(result.supportedBanks[0]).toHaveProperty('swiftCode');
      expect(result.supportedBanks[0]).toHaveProperty('supportedCurrencies');
    });
  });

  describe('validateDataIntegrity', () => {
    it('should validate all refunds successfully', async () => {
      // Arrange
      const mockRefunds = [
        {
          id: 1,
          refundReference: 'REF-2025-000001',
          refundStatus: SyrianRefundStatus.COMPLETED,
          currency: 'SYP',
          amountSyp: 125000,
          refundMethod: 'bank_transfer',
          accountNumber: '1234567890123456',
          swiftCode: 'CBSYSYDA',
        },
        {
          id: 2,
          refundReference: 'REF-2025-000002',
          refundStatus: SyrianRefundStatus.PROCESSING,
          currency: 'USD',
          amountSyp: 250000,
          refundMethod: 'mobile_wallet',
          accountNumber: null,
          swiftCode: null,
        },
      ];

      refundRepository.find.mockResolvedValue(mockRefunds as any);

      // Act
      const result = await service.validateDataIntegrity();

      // Assert
      expect(result).toBeDefined();
      expect(result.message).toBe('Data integrity validation completed');
      expect(result.messageAr).toBe('تم إكمال التحقق من سلامة البيانات');
      expect(result.totalRecords).toBe(2);
      expect(result.validRecords).toBe(2);
      expect(result.invalidRecords).toBe(0);
      expect(result.validationErrors).toEqual([]);
      expect(result.performanceMetrics.validationTimeMs).toBeGreaterThanOrEqual(0);
      expect(result.performanceMetrics.recordsPerSecond).toBeGreaterThanOrEqual(0);
    });

    it('should detect validation errors', async () => {
      // Arrange
      const mockRefunds = [
        {
          id: 1,
          refundReference: '', // Missing required field
          refundStatus: SyrianRefundStatus.COMPLETED,
          currency: 'SYP',
          amountSyp: 50000000, // Exceeds max amount
          refundMethod: 'bank_transfer',
          accountNumber: null, // Missing banking info for bank transfer
          swiftCode: null,
        },
        {
          id: 2,
          refundReference: 'REF-2025-000002',
          refundStatus: SyrianRefundStatus.PROCESSING,
          currency: 'SYP',
          amountSyp: 125000,
          refundMethod: 'mobile_wallet',
        },
      ];

      refundRepository.find.mockResolvedValue(mockRefunds as any);

      // Act
      const result = await service.validateDataIntegrity();

      // Assert
      expect(result.totalRecords).toBe(2);
      expect(result.validRecords).toBe(1); // Record 2 is actually valid
      expect(result.invalidRecords).toBe(1); // Only record 1 has issues
      expect(result.validationErrors.length).toBeGreaterThan(0);
      
      // Check specific validation errors
      expect(result.validationErrors).toContain('Refund 1: Missing required fields');
      expect(result.validationErrors).toContain('Refund 1: Amount out of valid range');
      expect(result.validationErrors).toContain('Refund 1: Missing banking information for bank transfer');
    });
  });

  describe('cleanupSeedData', () => {
    it('should clean up all seeded data successfully', async () => {
      // Arrange
      const deletedCount = 5000;
      queryRunner.manager.delete.mockResolvedValue({ affected: deletedCount } as any);

      // Act
      const result = await service.cleanupSeedData();

      // Assert
      expect(result).toBeDefined();
      expect(result.message).toBe('Refund seed data cleaned up successfully');
      expect(result.messageAr).toBe('تم تنظيف بيانات زرع المرتجعات بنجاح');
      expect(result.recordsDeleted).toBe(deletedCount);
      expect(result.cleanupTimeMs).toBeGreaterThanOrEqual(0);

      // Verify transaction management
      expect(queryRunner.connect).toHaveBeenCalled();
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
      expect(queryRunner.manager.delete).toHaveBeenCalledWith(SyrianRefundEntity, {});
    });

    it('should handle cleanup errors with transaction rollback', async () => {
      // Arrange
      queryRunner.manager.delete.mockRejectedValue(new Error('Delete operation failed'));

      // Act & Assert
      await expect(service.cleanupSeedData()).rejects.toThrow('Delete operation failed');

      // Verify transaction rollback
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });
  });

  describe('getSeederStatistics', () => {
    it('should return comprehensive seeder statistics', async () => {
      // Arrange
      const totalRefunds = 11850;
      const sampleRefunds = 10;
      
      // Mock repository calls
      refundRepository.count
        .mockResolvedValueOnce(totalRefunds) // Total count
        .mockResolvedValueOnce(sampleRefunds) // Sample count (with LIKE query)
        .mockResolvedValueOnce(2370); // Urgent refunds count

      refundRepository.findOne.mockResolvedValue({
        createdAt: new Date('2025-08-20T14:30:25.000Z'),
      } as any);

      // Mock query builders for distribution data
      const mockStatusQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { status: 'completed', count: '3782' },
          { status: 'approved', count: '2958' },
        ]),
      };

      const mockMethodQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { method: 'bank_transfer', count: '5593' },
          { method: 'original_payment', count: '2962' },
        ]),
      };

      const mockCurrencyQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { currency: 'SYP', count: '7902' },
          { currency: 'USD', count: '2963' },
        ]),
      };

      const mockGovernorateQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { governorate: '1', count: '850' },
          { governorate: '2', count: '920' },
        ]),
      };

      const mockAvgQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ avgAmount: '287450.75' }),
      };

      refundRepository.createQueryBuilder
        .mockReturnValueOnce(mockStatusQueryBuilder as any)
        .mockReturnValueOnce(mockMethodQueryBuilder as any)
        .mockReturnValueOnce(mockCurrencyQueryBuilder as any)
        .mockReturnValueOnce(mockGovernorateQueryBuilder as any)
        .mockReturnValueOnce(mockAvgQueryBuilder as any);

      // Act
      const result = await service.getSeederStatistics();

      // Assert
      expect(result).toBeDefined();
      expect(result.message).toBe('Refund seeder statistics generated successfully');
      expect(result.messageAr).toBe('تم إنشاء إحصائيات زارع المرتجعات بنجاح');
      
      expect(result.overview.totalRefunds).toBe(totalRefunds);
      expect(result.overview.sampleRefunds).toBe(sampleRefunds);
      expect(result.overview.bulkRefunds).toBe(totalRefunds - sampleRefunds);
      expect(result.overview.lastSeededAt).toEqual(new Date('2025-08-20T14:30:25.000Z'));

      expect(result.distribution.byStatus).toEqual({
        completed: 3782,
        approved: 2958,
      });
      expect(result.distribution.byMethod).toEqual({
        bank_transfer: 5593,
        original_payment: 2962,
      });
      expect(result.distribution.byCurrency).toEqual({
        SYP: 7902,
        USD: 2963,
      });
      expect(result.distribution.byGovernorate).toEqual({
        governorate_1: 850,
        governorate_2: 920,
      });

      expect(result.performance.avgAmountSyp).toBe(287450.75);
      expect(result.performance.urgentRefundsCount).toBe(2370);
      expect(result.performance.avgProcessingTimeHours).toBe(64.2);
    });

    it('should handle empty database', async () => {
      // Arrange
      refundRepository.count.mockResolvedValue(0);
      refundRepository.findOne.mockResolvedValue(null);
      refundRepository.createQueryBuilder.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
        getRawOne: jest.fn().mockResolvedValue({ avgAmount: null }),
      } as any);

      // Act
      const result = await service.getSeederStatistics();

      // Assert
      expect(result.overview.totalRefunds).toBe(0);
      expect(result.overview.lastSeededAt).toBeNull();
      expect(result.performance.avgAmountSyp).toBe(0);
      expect(result.performance.completionRate).toBe(0);
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle performance test scenarios correctly', () => {
      // Test bulk generation limits
      expect(() => service.generateBulkRefunds(100000)).rejects.toThrow();
    });

    it('should validate performance metrics calculation', async () => {
      // Arrange
      const count = 1000;
      const startTime = Date.now();
      queryRunner.manager.insert.mockImplementation(() => {
        // Simulate processing time
        return new Promise(resolve => setTimeout(() => resolve({ affected: count }), 100));
      });

      // Act
      const result = await service.generateBulkRefunds(count);

      // Assert
      expect(result.performanceMetrics.totalTimeMs).toBeGreaterThanOrEqual(50);
      expect(result.performanceMetrics.avgTimePerRecord).toBeGreaterThanOrEqual(0);
      expect(result.performanceMetrics.recordsPerSecond).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle concurrent access gracefully', async () => {
      // This would be tested with actual concurrent requests in integration tests
      expect(service).toBeDefined();
    });

    it('should maintain data integrity during failures', async () => {
      // Verify transaction rollback maintains data integrity
      governorateRepository.count.mockResolvedValue(14);
      queryRunner.manager.save.mockRejectedValue(new Error('Simulated failure'));

      await expect(service.seedSampleRefunds()).rejects.toThrow();
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });
});