/**
 * @file vendors.service.spec.ts
 * @description Unit tests for VendorsService
 *
 * Tests main vendors service functionality including:
 * - Legacy CRUD operations compatibility
 * - Delegation to Syrian vendor service
 * - Service integration and method forwarding
 * - Error handling and validation
 * - Syrian market integration
 *
 * @author SouqSyria Development Team
 * @since 2025-08-17
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { VendorsService } from './vendors.service';
import { SyrianVendorService } from './services/syrian-vendor.service';
import { VendorEntity } from './entities/vendor.entity';
import { VendorMembershipEntity } from './entities/vendor-membership.entity';

describe('VendorsService', () => {
  let service: VendorsService;
  let syrianVendorService: jest.Mocked<SyrianVendorService>;
  let vendorRepository: jest.Mocked<Repository<VendorEntity>>;
  let membershipRepository: jest.Mocked<Repository<VendorMembershipEntity>>;

  // Test data
  let mockVendor: VendorEntity;
  let mockMembership: VendorMembershipEntity;
  let mockSyrianVendorResponse: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VendorsService,
        {
          provide: getRepositoryToken(VendorEntity),
          useFactory: () => ({
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          }),
        },
        {
          provide: getRepositoryToken(VendorMembershipEntity),
          useFactory: () => ({
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          }),
        },
        {
          provide: SyrianVendorService,
          useFactory: () => ({
            createSyrianVendor: jest.fn(),
            findSyrianVendorById: jest.fn(),
            updateSyrianVendor: jest.fn(),
            searchSyrianVendors: jest.fn(),
            performBulkVendorActions: jest.fn(),
            getVendorStatistics: jest.fn(),
          }),
        },
      ],
    }).compile();

    service = module.get<VendorsService>(VendorsService);
    syrianVendorService = module.get(SyrianVendorService);
    vendorRepository = module.get(getRepositoryToken(VendorEntity));
    membershipRepository = module.get(
      getRepositoryToken(VendorMembershipEntity),
    );

    // Initialize test data
    setupTestData();
  });

  function setupTestData() {
    mockVendor = {
      id: 1,
      userId: 100,
      storeName: 'Test Store',
      storeDescription: 'Test Description',
      contactEmail: 'test@example.com',
      contactPhone: '+963987654321',
      businessType: 'retailer',
      isActive: true,
      isVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;

    mockMembership = {
      id: 1,
      vendor: mockVendor,
      membershipType: 'basic',
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      isActive: true,
    } as any;

    mockSyrianVendorResponse = {
      id: 1,
      userId: 100,
      storeNameEn: 'Damascus Electronics Store',
      storeNameAr: 'متجر دمشق للإلكترونيات',
      storeDescriptionEn: 'Leading electronics retailer in Damascus',
      storeDescriptionAr: 'أفضل متجر إلكترونيات في دمشق',
      verificationStatus: 'draft',
      qualityScore: 75,
      isActive: false,
      governorate: {
        id: 1,
        nameEn: 'Damascus',
        nameAr: 'دمشق',
      },
    };
  }

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('🔄 Legacy CRUD Operations', () => {
    it('should find all vendors using repository', async () => {
      const mockVendors = [mockVendor];
      vendorRepository.find.mockResolvedValue(mockVendors);

      const result = await service.findAll();

      expect(result).toEqual(mockVendors);
      expect(vendorRepository.find).toHaveBeenCalledWith();
    });

    it('should find vendor by id using repository', async () => {
      vendorRepository.findOne.mockResolvedValue(mockVendor);

      const result = await service.findOne(1);

      expect(result).toEqual(mockVendor);
      expect(vendorRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should handle vendor not found in findOne', async () => {
      vendorRepository.findOne.mockResolvedValue(null);

      const result = await service.findOne(999);

      expect(result).toBeNull();
      expect(vendorRepository.findOne).toHaveBeenCalledWith({
        where: { id: 999 },
      });
    });

    it('should handle repository errors in findAll', async () => {
      const error = new Error('Database connection failed');
      vendorRepository.find.mockRejectedValue(error);

      await expect(service.findAll()).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should handle repository errors in findOne', async () => {
      const error = new Error('Database connection failed');
      vendorRepository.findOne.mockRejectedValue(error);

      await expect(service.findOne(1)).rejects.toThrow(
        'Database connection failed',
      );
    });
  });

  describe('🏪 Syrian Vendor Service Delegation', () => {
    it('should delegate createSyrianVendor to Syrian service', async () => {
      const createVendorDto = {
        userId: 100,
        storeNameEn: 'Damascus Electronics Store',
        storeNameAr: 'متجر دمشق للإلكترونيات',
        storeDescriptionEn: 'Leading electronics retailer',
        storeDescriptionAr: 'أفضل متجر إلكترونيات',
        governorateId: 1,
        businessType: 'limited_liability',
        vendorCategory: 'retailer',
        contactPhone: '+963987654321',
        contactEmail: 'damascus.electronics@souqsyria.com',
        address: 'شارع الثورة، دمشق',
      };

      syrianVendorService.createSyrianVendor.mockResolvedValue(
        mockSyrianVendorResponse,
      );

      const result = await service.createSyrianVendor(createVendorDto);

      expect(result).toEqual(mockSyrianVendorResponse);
      expect(syrianVendorService.createSyrianVendor).toHaveBeenCalledWith(
        createVendorDto,
      );
    });

    it('should delegate findSyrianVendorById to Syrian service', async () => {
      syrianVendorService.findSyrianVendorById.mockResolvedValue(
        mockSyrianVendorResponse,
      );

      const result = await service.findSyrianVendorById(1);

      expect(result).toEqual(mockSyrianVendorResponse);
      expect(syrianVendorService.findSyrianVendorById).toHaveBeenCalledWith(1);
    });

    it('should delegate updateSyrianVendor to Syrian service', async () => {
      const updateVendorDto = {
        storeDescriptionEn: 'Updated description',
        storeDescriptionAr: 'وصف محدث',
        qualityScore: 80,
      };

      const updatedVendor = { ...mockSyrianVendorResponse, ...updateVendorDto };
      syrianVendorService.updateSyrianVendor.mockResolvedValue(updatedVendor);

      const result = await service.updateSyrianVendor(1, updateVendorDto);

      expect(result).toEqual(updatedVendor);
      expect(syrianVendorService.updateSyrianVendor).toHaveBeenCalledWith(
        1,
        updateVendorDto,
      );
    });

    it('should delegate searchSyrianVendors to Syrian service', async () => {
      const searchQuery = {
        searchTerm: 'Damascus',
        governorateIds: [1],
        verificationStatus: 'verified',
        isActive: true,
        page: 1,
        limit: 10,
      };

      const searchResult = {
        vendors: [mockSyrianVendorResponse],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
        filters: {
          governorateDistribution: { Damascus: 1 },
          statusDistribution: { verified: 1 },
          businessTypeDistribution: { limited_liability: 1 },
        },
        aggregations: {
          averageQualityScore: 75,
          totalRevenueSyp: 15000000,
          averageOrderValue: 250000,
        },
      };

      syrianVendorService.searchSyrianVendors.mockResolvedValue(searchResult);

      const result = await service.searchSyrianVendors(searchQuery);

      expect(result).toEqual(searchResult);
      expect(syrianVendorService.searchSyrianVendors).toHaveBeenCalledWith(
        searchQuery,
      );
    });

    it('should delegate performBulkVendorActions to Syrian service', async () => {
      const bulkActionDto = {
        action: 'activate',
        vendorIds: [1, 2, 3],
        parameters: {},
      };

      const bulkResult = {
        action: 'activate',
        processed: 3,
        failed: 0,
        results: [
          {
            vendorId: 1,
            success: true,
            message: 'Vendor activated successfully',
          },
          {
            vendorId: 2,
            success: true,
            message: 'Vendor activated successfully',
          },
          {
            vendorId: 3,
            success: true,
            message: 'Vendor activated successfully',
          },
        ],
        summary: {
          totalRequested: 3,
          successful: 3,
          failed: 0,
          processingTime: '0.5s',
        },
      };

      syrianVendorService.performBulkVendorActions.mockResolvedValue(
        bulkResult,
      );
      const executorId = 1;

      const result = await service.performBulkVendorActions(
        bulkActionDto,
        executorId,
      );

      expect(result).toEqual(bulkResult);
      expect(syrianVendorService.performBulkVendorActions).toHaveBeenCalledWith(
        bulkActionDto,
        executorId,
      );
    });

    it('should delegate getVendorStatistics to Syrian service', async () => {
      const statistics = {
        totalVendors: 150,
        activeVendors: 120,
        verifiedVendors: 100,
        pendingVerification: 25,
        averageQualityScore: 78.5,
        totalRevenueSyp: 2500000000, // 2.5 billion SYP
        monthlyGrowth: 12.5,
      };

      syrianVendorService.getVendorStatistics.mockResolvedValue(statistics);

      const result = await service.getVendorStatistics();

      expect(result).toEqual(statistics);
      expect(syrianVendorService.getVendorStatistics).toHaveBeenCalledWith();
    });
  });

  describe('🌍 Syrian Market Integration', () => {
    it('should handle Syrian vendor creation with Arabic content', async () => {
      const arabicVendorDto = {
        userId: 101,
        storeNameEn: 'Aleppo Traditional Crafts',
        storeNameAr: 'الحرف التقليدية الحلبية',
        storeDescriptionEn: 'Authentic Syrian handcrafted items',
        storeDescriptionAr: 'منتجات يدوية سورية أصلية',
        governorateId: 2, // Aleppo
        businessType: 'sole_proprietorship',
        vendorCategory: 'craftsman',
        contactPhone: '+963989876543',
        contactEmail: 'aleppo.crafts@souqsyria.com',
        address: 'سوق المدينة، حلب',
        websiteUrl: 'https://aleppo-crafts.sy',
        socialMediaLinks: {
          facebook: 'https://facebook.com/aleppo.crafts',
          instagram: '@aleppo_crafts',
        },
      };

      const arabicVendorResponse = {
        ...mockSyrianVendorResponse,
        id: 2,
        userId: 101,
        storeNameEn: 'Aleppo Traditional Crafts',
        storeNameAr: 'الحرف التقليدية الحلبية',
        governorate: { id: 2, nameEn: 'Aleppo', nameAr: 'حلب' },
        businessType: 'sole_proprietorship',
        vendorCategory: 'craftsman',
      };

      syrianVendorService.createSyrianVendor.mockResolvedValue(
        arabicVendorResponse,
      );

      const result = await service.createSyrianVendor(arabicVendorDto);

      expect(result).toEqual(arabicVendorResponse);
      expect(result.storeNameAr).toContain('الحرف التقليدية الحلبية');
      expect(result.governorate.nameAr).toBe('حلب');
      expect(syrianVendorService.createSyrianVendor).toHaveBeenCalledWith(
        arabicVendorDto,
      );
    });

    it('should handle Syrian vendor search with Arabic terms', async () => {
      const arabicSearchQuery = {
        searchTerm: 'دمشق', // Damascus in Arabic
        governorateIds: [1],
        verificationStatus: 'verified',
        businessType: 'limited_liability',
        sortBy: 'qualityScore',
        sortOrder: 'DESC' as const,
        page: 1,
        limit: 20,
      };

      const arabicSearchResult = {
        vendors: [
          {
            ...mockSyrianVendorResponse,
            storeNameAr: 'متجر دمشق المركزي',
            storeDescriptionAr: 'متجر متخصص في الإلكترونيات والأجهزة',
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
        filters: {
          governorateDistribution: { Damascus: 1 },
          statusDistribution: { verified: 1 },
          businessTypeDistribution: { limited_liability: 1 },
        },
        aggregations: {
          averageQualityScore: 85,
          totalRevenueSyp: 50000000, // 50 million SYP
          averageOrderValue: 500000, // 500,000 SYP
        },
      };

      syrianVendorService.searchSyrianVendors.mockResolvedValue(
        arabicSearchResult,
      );

      const result = await service.searchSyrianVendors(arabicSearchQuery);

      expect(result).toEqual(arabicSearchResult);
      expect(result.vendors[0].storeNameAr).toContain('دمشق');
      expect(result.aggregations.totalRevenueSyp).toBe(50000000);
      expect(syrianVendorService.searchSyrianVendors).toHaveBeenCalledWith(
        arabicSearchQuery,
      );
    });

    it('should handle large SYP amounts in vendor statistics', async () => {
      const syrianStatistics = {
        totalVendors: 500,
        activeVendors: 420,
        verifiedVendors: 350,
        pendingVerification: 70,
        averageQualityScore: 82.3,
        totalRevenueSyp: 15000000000, // 15 billion SYP
        monthlyGrowth: 8.2,
      };

      syrianVendorService.getVendorStatistics.mockResolvedValue(
        syrianStatistics,
      );

      const result = await service.getVendorStatistics();

      expect(result).toEqual(syrianStatistics);
      expect(result.totalRevenueSyp).toBe(15000000000); // Verify large SYP amount
      expect(result.averageQualityScore).toBe(82.3);
      expect(result.monthlyGrowth).toBe(8.2);
      expect(syrianVendorService.getVendorStatistics).toHaveBeenCalledWith();
    });

    it('should handle bulk operations with Syrian governorate filters', async () => {
      const syrianBulkActionDto = {
        action: 'updatePriority',
        vendorIds: [1, 2, 3, 4, 5],
        parameters: {
          priority: 'high',
          reason: 'Damascus and Aleppo vendors priority boost',
          governorateFilter: [1, 2], // Damascus and Aleppo
        },
      };

      const syrianBulkResult = {
        action: 'updatePriority',
        processed: 5,
        failed: 0,
        results: [
          {
            vendorId: 1,
            success: true,
            message: 'Vendor priority updated to high',
          },
          {
            vendorId: 2,
            success: true,
            message: 'Vendor priority updated to high',
          },
          {
            vendorId: 3,
            success: true,
            message: 'Vendor priority updated to high',
          },
          {
            vendorId: 4,
            success: true,
            message: 'Vendor priority updated to high',
          },
          {
            vendorId: 5,
            success: true,
            message: 'Vendor priority updated to high',
          },
        ],
        summary: {
          totalRequested: 5,
          successful: 5,
          failed: 0,
          processingTime: '1.2s',
        },
      };

      syrianVendorService.performBulkVendorActions.mockResolvedValue(
        syrianBulkResult,
      );
      const executorId = 1;

      const result = await service.performBulkVendorActions(
        syrianBulkActionDto,
        executorId,
      );

      expect(result).toEqual(syrianBulkResult);
      expect(result.processed).toBe(5);
      expect(result.failed).toBe(0);
      expect(syrianVendorService.performBulkVendorActions).toHaveBeenCalledWith(
        syrianBulkActionDto,
        executorId,
      );
    });
  });

  describe('🔧 Error Handling', () => {
    it('should propagate Syrian service errors for vendor creation', async () => {
      const createVendorDto = {
        userId: 999,
        storeNameEn: 'Invalid Store',
        storeNameAr: 'متجر غير صحيح',
        governorateId: 99,
      };

      const error = new Error('User with ID 999 not found');
      syrianVendorService.createSyrianVendor.mockRejectedValue(error);

      await expect(service.createSyrianVendor(createVendorDto)).rejects.toThrow(
        'User with ID 999 not found',
      );
      expect(syrianVendorService.createSyrianVendor).toHaveBeenCalledWith(
        createVendorDto,
      );
    });

    it('should propagate Syrian service errors for vendor search', async () => {
      const searchQuery = { invalidParam: 'invalid' };
      const error = new Error('Invalid search parameters');
      syrianVendorService.searchSyrianVendors.mockRejectedValue(error);

      await expect(service.searchSyrianVendors(searchQuery)).rejects.toThrow(
        'Invalid search parameters',
      );
      expect(syrianVendorService.searchSyrianVendors).toHaveBeenCalledWith(
        searchQuery,
      );
    });

    it('should propagate Syrian service errors for bulk actions', async () => {
      const bulkActionDto = {
        action: 'invalid_action',
        vendorIds: [1, 2, 3],
      };

      const error = new Error('Unknown action: invalid_action');
      syrianVendorService.performBulkVendorActions.mockRejectedValue(error);
      const executorId = 1;

      await expect(
        service.performBulkVendorActions(bulkActionDto, executorId),
      ).rejects.toThrow('Unknown action: invalid_action');
      expect(syrianVendorService.performBulkVendorActions).toHaveBeenCalledWith(
        bulkActionDto,
        executorId,
      );
    });

    it('should handle Syrian service timeout errors gracefully', async () => {
      const error = new Error('Request timeout');
      syrianVendorService.getVendorStatistics.mockRejectedValue(error);

      await expect(service.getVendorStatistics()).rejects.toThrow(
        'Request timeout',
      );
      expect(syrianVendorService.getVendorStatistics).toHaveBeenCalledWith();
    });
  });

  describe('⚡ Performance and Service Integration', () => {
    it('should handle concurrent vendor operations', async () => {
      const vendor1 = { ...mockSyrianVendorResponse, id: 1 };
      const vendor2 = { ...mockSyrianVendorResponse, id: 2 };
      const vendor3 = { ...mockSyrianVendorResponse, id: 3 };

      syrianVendorService.findSyrianVendorById
        .mockResolvedValueOnce(vendor1)
        .mockResolvedValueOnce(vendor2)
        .mockResolvedValueOnce(vendor3);

      const operations = [
        service.findSyrianVendorById(1),
        service.findSyrianVendorById(2),
        service.findSyrianVendorById(3),
      ];

      const results = await Promise.all(operations);

      expect(results).toHaveLength(3);
      expect(results[0]).toEqual(vendor1);
      expect(results[1]).toEqual(vendor2);
      expect(results[2]).toEqual(vendor3);
      expect(syrianVendorService.findSyrianVendorById).toHaveBeenCalledTimes(3);
    });

    it('should maintain service isolation between legacy and Syrian services', async () => {
      // Legacy operations should not affect Syrian service
      vendorRepository.find.mockResolvedValue([mockVendor]);
      vendorRepository.findOne.mockResolvedValue(mockVendor);

      // Syrian operations should not affect legacy repository
      syrianVendorService.findSyrianVendorById.mockResolvedValue(
        mockSyrianVendorResponse,
      );
      syrianVendorService.getVendorStatistics.mockResolvedValue({
        totalVendors: 100,
        activeVendors: 80,
        verifiedVendors: 60,
        pendingVerification: 20,
        averageQualityScore: 75,
        totalRevenueSyp: 1000000000,
        monthlyGrowth: 5,
      });

      // Execute both legacy and Syrian operations
      const [legacyVendors, legacyVendor, syrianVendor, statistics] =
        await Promise.all([
          service.findAll(),
          service.findOne(1),
          service.findSyrianVendorById(1),
          service.getVendorStatistics(),
        ]);

      // Verify legacy operations
      expect(legacyVendors).toEqual([mockVendor]);
      expect(legacyVendor).toEqual(mockVendor);
      expect(vendorRepository.find).toHaveBeenCalledWith();
      expect(vendorRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });

      // Verify Syrian operations
      expect(syrianVendor).toEqual(mockSyrianVendorResponse);
      expect(statistics.totalVendors).toBe(100);
      expect(syrianVendorService.findSyrianVendorById).toHaveBeenCalledWith(1);
      expect(syrianVendorService.getVendorStatistics).toHaveBeenCalledWith();

      // Verify services are isolated (Syrian service calls don't affect repository)
      expect(vendorRepository.find).toHaveBeenCalledTimes(1);
      expect(vendorRepository.findOne).toHaveBeenCalledTimes(1);
      expect(syrianVendorService.findSyrianVendorById).toHaveBeenCalledTimes(1);
      expect(syrianVendorService.getVendorStatistics).toHaveBeenCalledTimes(1);
    });
  });
});
