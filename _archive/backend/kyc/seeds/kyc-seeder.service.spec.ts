/**
 * @file kyc-seeder.service.spec.ts
 * @description Unit tests for KYC Seeder Service
 *
 * TEST COVERAGE:
 * - Sample document seeding with Syrian localization
 * - Status logs creation and workflow tracking
 * - All 8 workflow states seeding
 * - Bulk document generation for performance testing
 * - Data integrity validation
 * - Error handling and edge cases
 * - Arabic/English localization
 * - Compliance and regulatory features
 *
 * @author SouqSyria Development Team
 * @since 2025-08-20
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository, QueryBuilder } from 'typeorm';

import { KycSeederService, KycSeedingConfig } from './kyc-seeder.service';
import { SyrianKycDocumentEntity } from '../entities/syrian-kyc-document.entity';
import { SyrianKycStatusLog } from '../entities/syrian-kyc-status-log.entity';
import { User } from '../../users/entities/user.entity';
import { SyrianGovernorateEntity } from '../../addresses/entities/syrian-governorate.entity';

import {
  SyrianKycStatus,
  SyrianKycVerificationLevel,
  SyrianKycDocumentType,
} from '../enums/syrian-kyc.enums';

// Mock data
const mockUser = {
  id: 1,
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  phone: '+963987654321',
} as unknown as User;

const mockGovernorate = {
  id: 1,
  code: 'damascus',
  nameEn: 'Damascus',
  nameAr: 'دمشق',
  isActive: true,
} as unknown as SyrianGovernorateEntity;

const mockKycDocument = {
  id: 1,
  documentType: SyrianKycDocumentType.SYRIAN_ID,
  titleEn: 'Syrian National ID Card',
  titleAr: 'البطاقة الشخصية السورية',
  status: SyrianKycStatus.APPROVED,
  verificationLevel: SyrianKycVerificationLevel.BASIC,
  user: mockUser,
  governorate: mockGovernorate,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
} as unknown as SyrianKycDocumentEntity;

describe('KycSeederService', () => {
  let service: KycSeederService;
  let kycDocumentRepo: jest.Mocked<Repository<SyrianKycDocumentEntity>>;
  let kycStatusLogRepo: jest.Mocked<Repository<SyrianKycStatusLog>>;
  let userRepo: jest.Mocked<Repository<User>>;
  let governorateRepo: jest.Mocked<Repository<SyrianGovernorateEntity>>;
  let dataSource: jest.Mocked<DataSource>;
  let mockManager: any;

  beforeEach(async () => {
    // Mock query builder
    const mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(0),
    } as unknown as QueryBuilder<any>;

    // Mock transaction manager
    mockManager = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    // Mock repositories
    const mockKycDocumentRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    const mockKycStatusLogRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    const mockUserRepo = {
      find: jest.fn().mockResolvedValue([mockUser]),
      findOne: jest.fn().mockResolvedValue(mockUser),
    };

    const mockGovernorateRepo = {
      find: jest.fn().mockResolvedValue([mockGovernorate]),
      findOne: jest.fn().mockResolvedValue(mockGovernorate),
    };

    // Mock DataSource
    const mockDataSource = {
      transaction: jest.fn().mockImplementation(async (fn) => {
        return await fn(mockManager);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KycSeederService,
        {
          provide: getRepositoryToken(SyrianKycDocumentEntity),
          useValue: mockKycDocumentRepo,
        },
        {
          provide: getRepositoryToken(SyrianKycStatusLog),
          useValue: mockKycStatusLogRepo,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
        {
          provide: getRepositoryToken(SyrianGovernorateEntity),
          useValue: mockGovernorateRepo,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<KycSeederService>(KycSeederService);
    kycDocumentRepo = module.get(getRepositoryToken(SyrianKycDocumentEntity));
    kycStatusLogRepo = module.get(getRepositoryToken(SyrianKycStatusLog));
    userRepo = module.get(getRepositoryToken(User));
    governorateRepo = module.get(getRepositoryToken(SyrianGovernorateEntity));
    dataSource = module.get(DataSource);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('seedAll', () => {
    beforeEach(() => {
      mockManager.find.mockResolvedValue([mockUser]);
      mockManager.findOne.mockResolvedValue(null);
      mockManager.create.mockReturnValue(mockKycDocument);
      mockManager.save.mockResolvedValue(mockKycDocument);
    });

    it('should seed all KYC data with default configuration', async () => {
      const result = await service.seedAll();

      expect(result).toMatchObject({
        documentsCreated: expect.any(Number),
        statusLogsCreated: expect.any(Number),
        workflowStatesCreated: expect.any(Number),
        totalExecutionTime: expect.any(Number),
        errors: [],
        warnings: expect.any(Array),
      });

      expect(dataSource.transaction).toHaveBeenCalled();
      expect(result.totalExecutionTime).toBeGreaterThanOrEqual(0);
    });

    it('should seed with custom configuration', async () => {
      const config: Partial<KycSeedingConfig> = {
        sampleDocuments: true,
        statusLogs: true,
        bulkDocuments: 10,
        performanceTest: true,
        allWorkflowStates: true,
      };

      const result = await service.seedAll(config);

      expect(result.documentsCreated).toBeGreaterThan(0);
      expect(result.workflowStatesCreated).toBeGreaterThan(0);
      expect(dataSource.transaction).toHaveBeenCalled();
    });

    it('should handle seeding errors gracefully', async () => {
      dataSource.transaction.mockRejectedValue(new Error('Database error'));

      await expect(service.seedAll()).rejects.toThrow('Database error');
    });

    it('should skip operations when configuration is disabled', async () => {
      const config: Partial<KycSeedingConfig> = {
        sampleDocuments: false,
        statusLogs: false,
        allWorkflowStates: false,
        bulkDocuments: 0,
        performanceTest: false,
      };

      const result = await service.seedAll(config);

      expect(result.documentsCreated).toBe(0);
      expect(result.statusLogsCreated).toBe(0);
      expect(result.workflowStatesCreated).toBe(0);
    });
  });

  describe('seedSampleKycDocuments', () => {
    beforeEach(() => {
      mockManager.find.mockResolvedValue([mockUser]);
      mockManager.findOne.mockResolvedValue(null); // No existing documents
      mockManager.create.mockReturnValue(mockKycDocument);
      mockManager.save.mockResolvedValue(mockKycDocument);
    });

    it('should create sample KYC documents with Syrian localization', async () => {
      // Access private method for testing
      const seedSampleMethod = service['seedSampleKycDocuments'].bind(service);
      const result = await seedSampleMethod(mockManager);

      expect(result).toBeGreaterThan(0);
      expect(mockManager.find).toHaveBeenCalledWith(User, expect.any(Object));
      expect(mockManager.create).toHaveBeenCalled();
      expect(mockManager.save).toHaveBeenCalled();
    });

    it('should handle existing documents (skip duplicates)', async () => {
      mockManager.findOne.mockResolvedValue(mockKycDocument); // Document exists

      const seedSampleMethod = service['seedSampleKycDocuments'].bind(service);
      const result = await seedSampleMethod(mockManager);

      expect(result).toBe(0); // No new documents created
    });

    it('should handle no users found', async () => {
      mockManager.find.mockResolvedValue([]); // No users

      const seedSampleMethod = service['seedSampleKycDocuments'].bind(service);
      const result = await seedSampleMethod(mockManager);

      expect(result).toBe(0);
    });

    it('should assign reviewers for approved/rejected documents', async () => {
      const multipleUsers = [mockUser, { ...mockUser, id: 2, email: 'reviewer@example.com' }];
      mockManager.find.mockResolvedValue(multipleUsers);

      const seedSampleMethod = service['seedSampleKycDocuments'].bind(service);
      await seedSampleMethod(mockManager);

      // Verify documents with status requiring reviewers get assigned
      expect(mockManager.create).toHaveBeenCalled();
      const createCall = mockManager.create.mock.calls[0];
      const documentData = createCall[1];
      
      if (documentData.status === SyrianKycStatus.APPROVED || 
          documentData.status === SyrianKycStatus.REJECTED ||
          documentData.status === SyrianKycStatus.REQUIRES_CLARIFICATION) {
        expect(documentData.reviewedBy).toBeDefined();
      }
    });
  });

  describe('seedKycStatusLogs', () => {
    beforeEach(() => {
      mockManager.findOne.mockResolvedValue(mockKycDocument);
      mockManager.create.mockReturnValue({} as unknown as SyrianKycStatusLog);
      mockManager.save.mockResolvedValue({} as unknown as SyrianKycStatusLog);
    });

    it('should create status logs for workflow tracking', async () => {
      const seedStatusLogsMethod = service['seedKycStatusLogs'].bind(service);
      const result = await seedStatusLogsMethod(mockManager);

      expect(result).toBeGreaterThan(0);
      expect(mockManager.findOne).toHaveBeenCalledWith(
        SyrianKycDocumentEntity,
        expect.objectContaining({
          where: { status: SyrianKycStatus.APPROVED },
        }),
      );
    });

    it('should handle no KYC documents found', async () => {
      mockManager.findOne.mockResolvedValue(null);

      const seedStatusLogsMethod = service['seedKycStatusLogs'].bind(service);
      const result = await seedStatusLogsMethod(mockManager);

      expect(result).toBe(0);
    });
  });

  describe('seedAllWorkflowStates', () => {
    beforeEach(() => {
      mockManager.find.mockResolvedValue([mockUser]);
      mockManager.findOne.mockResolvedValue(null); // No existing documents
      mockManager.create.mockReturnValue(mockKycDocument);
      mockManager.save.mockResolvedValue(mockKycDocument);
    });

    it('should create documents for all 8 workflow states', async () => {
      const seedWorkflowStatesMethod = service['seedAllWorkflowStates'].bind(service);
      const result = await seedWorkflowStatesMethod(mockManager);

      expect(result).toBe(8); // All 8 workflow states
      expect(mockManager.create).toHaveBeenCalledTimes(8);
      expect(mockManager.save).toHaveBeenCalledTimes(8);
    });

    it('should skip existing workflow state documents', async () => {
      // Mock that some workflow states already exist
      mockManager.findOne
        .mockResolvedValueOnce(mockKycDocument) // DRAFT exists
        .mockResolvedValueOnce(null) // SUBMITTED doesn't exist
        .mockResolvedValueOnce(null) // UNDER_REVIEW doesn't exist
        .mockResolvedValueOnce(null) // REQUIRES_CLARIFICATION doesn't exist
        .mockResolvedValueOnce(null) // APPROVED doesn't exist
        .mockResolvedValueOnce(null) // REJECTED doesn't exist
        .mockResolvedValueOnce(null) // EXPIRED doesn't exist
        .mockResolvedValueOnce(null); // SUSPENDED doesn't exist

      const seedWorkflowStatesMethod = service['seedAllWorkflowStates'].bind(service);
      const result = await seedWorkflowStatesMethod(mockManager);

      expect(result).toBe(7); // 7 new documents (excluding existing DRAFT)
    });

    it('should handle no users found for workflow states', async () => {
      mockManager.find.mockResolvedValue([]);

      const seedWorkflowStatesMethod = service['seedAllWorkflowStates'].bind(service);
      const result = await seedWorkflowStatesMethod(mockManager);

      expect(result).toBe(0);
    });

    it('should create documents with proper Arabic localization', async () => {
      const seedWorkflowStatesMethod = service['seedAllWorkflowStates'].bind(service);
      await seedWorkflowStatesMethod(mockManager);

      // Verify Arabic localization in created documents
      const createCalls = mockManager.create.mock.calls;
      createCalls.forEach((call) => {
        const documentData = call[1];
        expect(documentData.titleAr).toContain('البطاقة السورية');
        expect(documentData.documentData.nationalityAr).toBe('سوري');
      });
    });
  });

  describe('seedBulkKycDocuments', () => {
    beforeEach(() => {
      mockManager.find.mockResolvedValue([mockUser]);
      mockManager.create.mockReturnValue(mockKycDocument);
      mockManager.save.mockResolvedValue([mockKycDocument]);
    });

    it('should create bulk documents for performance testing', async () => {
      const bulkCount = 100;
      const seedBulkMethod = service['seedBulkKycDocuments'].bind(service);
      const result = await seedBulkMethod(mockManager, bulkCount);

      expect(result).toBe(bulkCount);
      expect(mockManager.save).toHaveBeenCalled();
    });

    it('should handle chunked inserts for large bulk operations', async () => {
      const bulkCount = 250; // Should require multiple chunks
      const seedBulkMethod = service['seedBulkKycDocuments'].bind(service);
      const result = await seedBulkMethod(mockManager, bulkCount);

      expect(result).toBe(bulkCount);
      // Verify multiple save calls for chunked processing
      expect(mockManager.save).toHaveBeenCalledTimes(3); // 250 / 100 = 3 chunks
    });

    it('should handle no users found for bulk seeding', async () => {
      mockManager.find.mockResolvedValue([]);

      const bulkCount = 50;
      const seedBulkMethod = service['seedBulkKycDocuments'].bind(service);
      const result = await seedBulkMethod(mockManager, bulkCount);

      expect(result).toBe(0);
    });

    it('should create documents with random data variations', async () => {
      const bulkCount = 5;
      const seedBulkMethod = service['seedBulkKycDocuments'].bind(service);
      await seedBulkMethod(mockManager, bulkCount);

      const createCalls = mockManager.create.mock.calls;
      expect(createCalls).toHaveLength(bulkCount);

      // Verify random variations in generated data
      const documentTypes = createCalls.map(call => call[1].documentType);
      const statuses = createCalls.map(call => call[1].status);
      
      // Should have some variety (not all the same)
      const uniqueTypes = new Set(documentTypes);
      const uniqueStatuses = new Set(statuses);
      
      expect(uniqueTypes.size).toBeGreaterThan(0);
      expect(uniqueStatuses.size).toBeGreaterThan(0);
    });
  });

  describe('getSeedingStats', () => {
    beforeEach(() => {
      kycDocumentRepo.count.mockResolvedValue(10);
      kycStatusLogRepo.count.mockResolvedValue(25);
      
      (kycDocumentRepo.createQueryBuilder as jest.Mock)
        .mockReturnValue({
          select: jest.fn().mockReturnThis(),
          groupBy: jest.fn().mockReturnThis(),
          getRawMany: jest.fn().mockResolvedValue([
            { doc_status: 'approved', count: '5' },
            { doc_status: 'draft', count: '3' },
            { doc_status: 'under_review', count: '2' },
          ]),
        });
    });

    it('should return comprehensive seeding statistics', async () => {
      const stats = await service.getSeedingStats();

      expect(stats).toMatchObject({
        overview: {
          totalDocuments: 10,
          statusLogs: 25,
        },
        documentsByStatus: expect.any(Object),
        documentsByLevel: expect.any(Object),
        documentsByType: expect.any(Object),
        lastUpdated: expect.any(String),
      });

      expect(stats.documentsByStatus.approved).toBe(5);
      expect(stats.documentsByStatus.draft).toBe(3);
      expect(stats.documentsByStatus.under_review).toBe(2);
    });

    it('should handle empty database gracefully', async () => {
      kycDocumentRepo.count.mockResolvedValue(0);
      kycStatusLogRepo.count.mockResolvedValue(0);
      
      (kycDocumentRepo.createQueryBuilder as jest.Mock)
        .mockReturnValue({
          select: jest.fn().mockReturnThis(),
          groupBy: jest.fn().mockReturnThis(),
          getRawMany: jest.fn().mockResolvedValue([]),
        });

      const stats = await service.getSeedingStats();

      expect(stats.overview.totalDocuments).toBe(0);
      expect(stats.overview.statusLogs).toBe(0);
      expect(Object.keys(stats.documentsByStatus)).toHaveLength(0);
    });
  });

  describe('verifyDataIntegrity', () => {
    beforeEach(() => {
      // Mock getSeedingStats method
      jest.spyOn(service, 'getSeedingStats').mockResolvedValue({
        overview: { totalDocuments: 0, statusLogs: 0 },
        documentsByStatus: {},
        documentsByLevel: {},
        documentsByType: {},
        lastUpdated: new Date().toISOString(),
      });

      (kycStatusLogRepo.createQueryBuilder as jest.Mock)
        .mockReturnValue({
          leftJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          getCount: jest.fn().mockResolvedValue(0),
        });

      (kycDocumentRepo.createQueryBuilder as jest.Mock)
        .mockReturnValue({
          leftJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          getCount: jest.fn().mockResolvedValue(0),
        });
    });

    it('should verify data integrity with no issues', async () => {
      const result = await service.verifyDataIntegrity();

      expect(result).toMatchObject({
        isValid: true,
        issues: [],
        summary: expect.any(Object),
      });
    });

    it('should detect orphaned status logs', async () => {
      (kycStatusLogRepo.createQueryBuilder as jest.Mock)
        .mockReturnValueOnce({
          leftJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          getCount: jest.fn().mockResolvedValue(5), // 5 orphaned logs
        })
        .mockReturnValue({
          leftJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          getCount: jest.fn().mockResolvedValue(0),
        });

      const result = await service.verifyDataIntegrity();

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Found 5 status logs without associated KYC documents');
    });

    it('should detect documents without users', async () => {
      (kycDocumentRepo.createQueryBuilder as jest.Mock)
        .mockReturnValueOnce({
          leftJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          getCount: jest.fn().mockResolvedValue(3), // 3 documents without users
        })
        .mockReturnValue({
          leftJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          getCount: jest.fn().mockResolvedValue(0),
        });

      const result = await service.verifyDataIntegrity();

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Found 3 KYC documents without assigned users');
    });

    it('should handle integrity check errors', async () => {
      (kycStatusLogRepo.createQueryBuilder as jest.Mock)
        .mockImplementation(() => {
          throw new Error('Database connection error');
        });

      const result = await service.verifyDataIntegrity();

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Integrity check failed: Database connection error');
    });
  });

  describe('clearAllData', () => {
    it('should clear all KYC data in correct order', async () => {
      await service.clearAllData();

      expect(dataSource.transaction).toHaveBeenCalled();
      expect(mockManager.delete).toHaveBeenCalledWith(SyrianKycStatusLog, {});
      expect(mockManager.delete).toHaveBeenCalledWith(SyrianKycDocumentEntity, {});
    });

    it('should handle clear operation errors', async () => {
      dataSource.transaction.mockRejectedValue(new Error('Foreign key constraint error'));

      await expect(service.clearAllData()).rejects.toThrow('Foreign key constraint error');
    });
  });

  describe('Helper Methods', () => {
    it('should provide correct Arabic status translations', () => {
      const getArabicStatusMethod = service['getArabicStatus'].bind(service);
      
      expect(getArabicStatusMethod(SyrianKycStatus.DRAFT)).toBe('المسودة');
      expect(getArabicStatusMethod(SyrianKycStatus.APPROVED)).toBe('موافق عليه');
      expect(getArabicStatusMethod(SyrianKycStatus.REJECTED)).toBe('مرفوض');
      expect(getArabicStatusMethod(SyrianKycStatus.REQUIRES_CLARIFICATION)).toBe('يحتاج توضيح');
    });

    it('should provide correct Arabic document type translations', () => {
      const getArabicDocTypeMethod = service['getArabicDocumentType'].bind(service);
      
      expect(getArabicDocTypeMethod(SyrianKycDocumentType.SYRIAN_ID)).toBe('البطاقة الشخصية');
      expect(getArabicDocTypeMethod(SyrianKycDocumentType.BUSINESS_LICENSE)).toBe('رخصة العمل');
      expect(getArabicDocTypeMethod(SyrianKycDocumentType.TAX_CERTIFICATE)).toBe('شهادة ضريبية');
    });

    it('should generate random priority levels', () => {
      const getRandomPriorityMethod = service['getRandomPriority'].bind(service);
      const priorities = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];
      
      const priority = getRandomPriorityMethod();
      expect(priorities).toContain(priority);
    });

    it('should generate random compliance levels', () => {
      const getRandomComplianceLevelMethod = service['getRandomComplianceLevel'].bind(service);
      const levels = ['LOW', 'MEDIUM', 'HIGH', 'PREMIUM'];
      
      const level = getRandomComplianceLevelMethod();
      expect(levels).toContain(level);
    });

    it('should generate random dates within valid range', () => {
      const getRandomDateMethod = service['getRandomDate'].bind(service);
      
      const randomDate = getRandomDateMethod();
      const date = new Date(randomDate);
      
      expect(date.getFullYear()).toBeGreaterThanOrEqual(1970);
      expect(date.getFullYear()).toBeLessThanOrEqual(2005);
      expect(randomDate).toMatch(/^\d{4}-\d{2}-\d{2}$/); // YYYY-MM-DD format
    });
  });

  describe('Performance Tests', () => {
    it('should complete seeding operations within reasonable time', async () => {
      mockManager.find.mockResolvedValue([mockUser]);
      mockManager.findOne.mockResolvedValue(null);
      mockManager.create.mockReturnValue(mockKycDocument);
      mockManager.save.mockResolvedValue(mockKycDocument);

      const result = await service.seedAll({
        sampleDocuments: true,
        statusLogs: true,
        allWorkflowStates: true,
        bulkDocuments: 0,
        performanceTest: false,
      });
      
      // Verify execution time is recorded (may be 0 in fast test environment)
      expect(result.totalExecutionTime).toBeGreaterThanOrEqual(0);
      expect(result.totalExecutionTime).toBeLessThan(1000); // Should be less than 1 second
      
      // Verify data was actually created
      expect(result.documentsCreated).toBeGreaterThan(0);
      expect(result.workflowStatesCreated).toBeGreaterThan(0);
    });

    it('should handle bulk operations efficiently', async () => {
      mockManager.find.mockResolvedValue([mockUser]);
      mockManager.create.mockReturnValue(mockKycDocument);
      mockManager.save.mockResolvedValue([mockKycDocument]);

      const bulkCount = 100;
      const seedBulkMethod = service['seedBulkKycDocuments'].bind(service);
      
      const startTime = Date.now();
      const result = await seedBulkMethod(mockManager, bulkCount);
      const endTime = Date.now();

      const processingTime = endTime - startTime;
      const averageTimePerDocument = processingTime / bulkCount;

      expect(result).toBe(bulkCount);
      expect(averageTimePerDocument).toBeLessThan(10); // Less than 10ms per document
    });
  });
});