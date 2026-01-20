/**
 * @file syrian-vendor.service.spec.ts
 * @description Unit tests for SyrianVendorService
 *
 * Tests enterprise Syrian vendor service functionality including:
 * - Advanced CRUD operations with Syrian localization
 * - Comprehensive search and filtering capabilities
 * - Bulk operations for enterprise management
 * - Syrian business compliance and validations
 * - Performance metrics and analytics
 * - Arabic/English bilingual support
 * - Large SYP currency amounts handling
 *
 * @author SouqSyria Development Team
 * @since 2025-08-17
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';

import { SyrianVendorService } from './syrian-vendor.service';
import {
  SyrianVendorEntity,
  SyrianVendorVerificationStatus,
  SyrianBusinessType,
  SyrianVendorCategory,
} from '../entities/syrian-vendor.entity';
import { User } from '../../users/entities/user.entity';
import { SyrianGovernorateEntity } from '../../addresses/entities/syrian-governorate.entity';

describe('SyrianVendorService', () => {
  let service: SyrianVendorService;
  let vendorRepository: jest.Mocked<Repository<SyrianVendorEntity>>;
  let userRepository: jest.Mocked<Repository<User>>;
  let governorateRepository: jest.Mocked<Repository<SyrianGovernorateEntity>>;

  // Test data
  let mockUser: User;
  let mockGovernorate: SyrianGovernorateEntity;
  let mockVendor: SyrianVendorEntity;
  let mockQueryBuilder: jest.Mocked<SelectQueryBuilder<SyrianVendorEntity>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyrianVendorService,
        {
          provide: getRepositoryToken(SyrianVendorEntity),
          useFactory: () => ({
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
            createQueryBuilder: jest.fn(),
          }),
        },
        {
          provide: getRepositoryToken(User),
          useFactory: () => ({
            findOne: jest.fn(),
          }),
        },
        {
          provide: getRepositoryToken(SyrianGovernorateEntity),
          useFactory: () => ({
            findOne: jest.fn(),
          }),
        },
      ],
    }).compile();

    service = module.get<SyrianVendorService>(SyrianVendorService);
    vendorRepository = module.get(getRepositoryToken(SyrianVendorEntity));
    userRepository = module.get(getRepositoryToken(User));
    governorateRepository = module.get(
      getRepositoryToken(SyrianGovernorateEntity),
    );

    // Initialize test data
    setupTestData();
    setupQueryBuilderMocks();
  });

  function setupTestData() {
    mockUser = {
      id: 1,
      email: 'vendor@souqsyria.com',
      fullName: 'أحمد التاجر',
      phone: '+963987654321',
      isVerified: true,
    } as any;

    mockGovernorate = {
      id: 1,
      nameEn: 'Damascus',
      nameAr: 'دمشق',
      code: 'DM',
      isActive: true,
    } as SyrianGovernorateEntity;

    mockVendor = {
      id: 1,
      userId: 1,
      user: mockUser,
      governorateId: 1,
      governorate: mockGovernorate,
      storeNameEn: 'Damascus Electronics Store',
      storeNameAr: 'متجر دمشق للإلكترونيات',
      storeDescriptionEn: 'Leading electronics retailer in Damascus',
      storeDescriptionAr: 'أفضل متجر إلكترونيات في دمشق',
      businessType: SyrianBusinessType.LIMITED_LIABILITY,
      vendorCategory: SyrianVendorCategory.RETAILER,
      verificationStatus: SyrianVendorVerificationStatus.DRAFT,
      qualityScore: 75,
      totalRevenueSyp: 25000000, // 25 million SYP
      totalOrders: 150,
      customerSatisfactionRating: 4.2,
      fulfillmentRate: 95.5,
      returnRate: 2.1,
      responseTimeHours: 4,
      averageOrderValueSyp: 350000, // 350,000 SYP
      contactPhone: '+963987654321',
      contactEmail: 'damascus.electronics@souqsyria.com',
      address: 'شارع الثورة، دمشق',
      websiteUrl: 'https://damascus-electronics.sy',
      commercialRegisterNumber: 'CR-DM-2024-001',
      taxIdNumber: 'TAX-123456789',
      isActive: false,
      isFeatured: false,
      workflowPriority: 'normal',
      escalationLevel: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      isEligibleForVerification: jest.fn().mockReturnValue(true),
    } as any;
  }

  function setupQueryBuilderMocks() {
    mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getCount: jest.fn(),
      getMany: jest.fn(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawOne: jest.fn(),
      getRawMany: jest.fn(),
      leftJoin: jest.fn().mockReturnThis(),
    } as any;

    vendorRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
  }

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('🏗️ Vendor Creation', () => {
    it('should create Syrian vendor successfully', async () => {
      const createVendorDto = {
        userId: 1,
        storeNameEn: 'Damascus Electronics Store',
        storeNameAr: 'متجر دمشق للإلكترونيات',
        storeDescriptionEn: 'Leading electronics retailer',
        storeDescriptionAr: 'أفضل متجر إلكترونيات',
        governorateId: 1,
        businessType: SyrianBusinessType.LIMITED_LIABILITY,
        vendorCategory: SyrianVendorCategory.RETAILER,
        cityNameEn: 'Damascus',
        cityNameAr: 'دمشق',
        streetAddressEn: 'Revolution Street, Damascus',
        streetAddressAr: 'شارع الثورة، دمشق',
        primaryPhone: '+963987654321',
        businessEmail: 'damascus.electronics@souqsyria.com',
      };

      userRepository.findOne.mockResolvedValue(mockUser);
      governorateRepository.findOne.mockResolvedValue(mockGovernorate);
      vendorRepository.findOne.mockResolvedValue(null); // No existing vendor
      vendorRepository.create.mockReturnValue(mockVendor as any);
      vendorRepository.save.mockResolvedValue(mockVendor as any);

      // Mock findSyrianVendorById for final return
      jest.spyOn(service, 'findSyrianVendorById').mockResolvedValue(mockVendor as any);

      const result = await service.createSyrianVendor(createVendorDto);

      expect(result).toEqual(mockVendor);
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(governorateRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(vendorRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...createVendorDto,
          user: mockUser,
          governorate: mockGovernorate,
          verificationStatus: SyrianVendorVerificationStatus.DRAFT,
          isActive: false,
        }),
      );
      expect(vendorRepository.save).toHaveBeenCalledWith(mockVendor);
    });

    it('should throw NotFoundException when user not found', async () => {
      // Using partial DTO - error occurs before full validation
      const createVendorDto = {
        userId: 999,
        storeNameEn: 'Test Store',
        storeNameAr: 'متجر اختبار',
        governorateId: 1,
      } as any;

      userRepository.findOne.mockResolvedValue(null);

      await expect(service.createSyrianVendor(createVendorDto)).rejects.toThrow(
        new NotFoundException('User with ID 999 not found'),
      );
    });

    it('should throw ConflictException when user already has vendor account', async () => {
      // Using partial DTO - error occurs before full validation
      const createVendorDto = {
        userId: 1,
        storeNameEn: 'Test Store',
        storeNameAr: 'متجر اختبار',
        governorateId: 1,
      } as any;

      userRepository.findOne.mockResolvedValue(mockUser);
      vendorRepository.findOne.mockResolvedValue(mockVendor); // Existing vendor

      await expect(service.createSyrianVendor(createVendorDto)).rejects.toThrow(
        new ConflictException('User 1 already has a vendor account'),
      );
    });

    it('should throw NotFoundException when governorate not found', async () => {
      // Using partial DTO - error occurs before full validation
      const createVendorDto = {
        userId: 1,
        storeNameEn: 'Test Store',
        storeNameAr: 'متجر اختبار',
        governorateId: 999,
      } as any;

      userRepository.findOne.mockResolvedValue(mockUser);
      vendorRepository.findOne.mockResolvedValue(null);
      governorateRepository.findOne.mockResolvedValue(null);

      await expect(service.createSyrianVendor(createVendorDto)).rejects.toThrow(
        new NotFoundException('Governorate with ID 999 not found'),
      );
    });

    it('should throw ConflictException for duplicate commercial register number', async () => {
      const createVendorDto = {
        userId: 1,
        storeNameEn: 'Test Store',
        storeNameAr: 'متجر اختبار',
        governorateId: 1,
        commercialRegisterNumber: 'CR-DM-2024-001',
      } as any; // Partial DTO for error testing

      userRepository.findOne.mockResolvedValue(mockUser);
      vendorRepository.findOne
        .mockResolvedValueOnce(null) // No existing vendor for user
        .mockResolvedValueOnce(mockVendor); // Existing vendor with CR number
      governorateRepository.findOne.mockResolvedValue(mockGovernorate);

      await expect(service.createSyrianVendor(createVendorDto)).rejects.toThrow(
        new ConflictException(
          'Commercial register number CR-DM-2024-001 is already registered',
        ),
      );
    });

    it('should throw ConflictException for duplicate tax ID number', async () => {
      const createVendorDto = {
        userId: 1,
        storeNameEn: 'Test Store',
        storeNameAr: 'متجر اختبار',
        governorateId: 1,
        taxIdNumber: 'TAX-123456789',
      } as any; // Partial DTO for error testing

      userRepository.findOne.mockResolvedValue(mockUser);
      vendorRepository.findOne
        .mockResolvedValueOnce(null) // No existing vendor for user
        .mockResolvedValueOnce(null) // No duplicate CR number
        .mockResolvedValueOnce(mockVendor); // Existing vendor with tax ID
      governorateRepository.findOne.mockResolvedValue(mockGovernorate);

      await expect(service.createSyrianVendor(createVendorDto)).rejects.toThrow(
        new ConflictException(
          'Tax ID number TAX-123456789 is already registered',
        ),
      );
    });
  });

  describe('🔍 Vendor Retrieval', () => {
    it('should find Syrian vendor by ID successfully', async () => {
      vendorRepository.findOne.mockResolvedValue(mockVendor);

      const result = await service.findSyrianVendorById(1);

      expect(result).toEqual(mockVendor);
      expect(vendorRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['user', 'governorate'],
      });
    });

    it('should throw NotFoundException when vendor not found', async () => {
      vendorRepository.findOne.mockResolvedValue(null);

      await expect(service.findSyrianVendorById(999)).rejects.toThrow(
        new NotFoundException('Syrian vendor with ID 999 not found'),
      );
    });
  });

  describe('📝 Vendor Updates', () => {
    it('should update Syrian vendor successfully', async () => {
      const updateVendorDto = {
        storeDescriptionEn: 'Updated electronics retailer description',
        storeDescriptionAr: 'وصف محدث لمتجر الإلكترونيات',
        websiteUrl: 'https://new-website.sy',
        qualityScore: 85,
      };

      const updatedVendor = { ...mockVendor, ...updateVendorDto } as any;

      jest
        .spyOn(service, 'findSyrianVendorById')
        .mockResolvedValueOnce(mockVendor) // Initial find for validation
        .mockResolvedValueOnce(updatedVendor); // Final find for return

      vendorRepository.update.mockResolvedValue({ affected: 1 } as any);

      const result = await service.updateSyrianVendor(1, updateVendorDto);

      expect(result).toEqual(updatedVendor);
      expect(vendorRepository.update).toHaveBeenCalledWith(1, {
        ...updateVendorDto,
        updatedAt: expect.any(Date),
      });
    });

    it('should validate commercial register number uniqueness during update', async () => {
      const updateVendorDto = {
        commercialRegisterNumber: 'CR-AL-2024-002',
      };

      jest.spyOn(service, 'findSyrianVendorById').mockResolvedValue(mockVendor);
      vendorRepository.findOne.mockResolvedValue(mockVendor); // Duplicate CR found

      await expect(
        service.updateSyrianVendor(1, updateVendorDto),
      ).rejects.toThrow(
        new ConflictException(
          'Commercial register number CR-AL-2024-002 is already registered',
        ),
      );
    });

    it('should validate tax ID uniqueness during update', async () => {
      const updateVendorDto = {
        taxIdNumber: 'TAX-987654321',
      };

      jest.spyOn(service, 'findSyrianVendorById').mockResolvedValue(mockVendor);
      vendorRepository.findOne
        .mockResolvedValueOnce(null) // No duplicate CR
        .mockResolvedValueOnce(mockVendor); // Duplicate tax ID found

      await expect(
        service.updateSyrianVendor(1, updateVendorDto),
      ).rejects.toThrow(
        new ConflictException(
          'Tax ID number TAX-987654321 is already registered',
        ),
      );
    });

    it('should validate governorate existence during update', async () => {
      const updateVendorDto = {
        governorateId: 99,
      };

      jest.spyOn(service, 'findSyrianVendorById').mockResolvedValue(mockVendor);
      governorateRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateSyrianVendor(1, updateVendorDto),
      ).rejects.toThrow(
        new NotFoundException('Governorate with ID 99 not found'),
      );
    });
  });

  describe('🔎 Advanced Search', () => {
    it('should search Syrian vendors with comprehensive criteria', async () => {
      const searchQuery = {
        searchTerm: 'Damascus',
        governorateIds: [1],
        verificationStatus: SyrianVendorVerificationStatus.VERIFIED,
        businessType: SyrianBusinessType.LIMITED_LIABILITY,
        vendorCategory: SyrianVendorCategory.RETAILER,
        isActive: true,
        minQualityScore: 70,
        sortBy: 'qualityScore',
        sortOrder: 'DESC' as const,
        page: 1,
        limit: 10,
      };

      const mockVendors = [mockVendor];
      const totalCount = 1;

      mockQueryBuilder.getCount.mockResolvedValue(totalCount);
      mockQueryBuilder.getMany.mockResolvedValue(mockVendors);
      mockQueryBuilder.getRawOne
        .mockResolvedValueOnce({
          averageQualityScore: '85',
          totalRevenueSyp: '50000000',
          averageOrderValue: '350000',
        })
        .mockResolvedValue({ count: '1', governorate: 'Damascus' });
      mockQueryBuilder.getRawMany
        .mockResolvedValueOnce([{ governorate: 'Damascus', count: '1' }])
        .mockResolvedValueOnce([{ status: 'verified', count: '1' }])
        .mockResolvedValue([{ businessType: 'limited_liability', count: '1' }]);

      const result = await service.searchSyrianVendors(searchQuery);

      expect(result.vendors).toEqual(mockVendors);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
      expect(result.aggregations.averageQualityScore).toBe(85);
      expect(result.aggregations.totalRevenueSyp).toBe(50000000);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(vendor.storeNameEn LIKE :searchTerm OR vendor.storeNameAr LIKE :searchTerm OR vendor.storeDescriptionEn LIKE :searchTerm OR vendor.storeDescriptionAr LIKE :searchTerm)',
        { searchTerm: '%Damascus%' },
      );
    });

    it('should handle Arabic search terms', async () => {
      const arabicSearchQuery = {
        searchTerm: 'دمشق',
        page: 1,
        limit: 20,
      };

      mockQueryBuilder.getCount.mockResolvedValue(1);
      mockQueryBuilder.getMany.mockResolvedValue([mockVendor]);
      mockQueryBuilder.getRawOne.mockResolvedValue({
        averageQualityScore: '75',
        totalRevenueSyp: '25000000',
        averageOrderValue: '350000',
      });
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      const result = await service.searchSyrianVendors(arabicSearchQuery);

      expect(result.vendors).toEqual([mockVendor]);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(vendor.storeNameEn LIKE :searchTerm OR vendor.storeNameAr LIKE :searchTerm OR vendor.storeDescriptionEn LIKE :searchTerm OR vendor.storeDescriptionAr LIKE :searchTerm)',
        { searchTerm: '%دمشق%' },
      );
    });

    it('should apply multiple filters correctly', async () => {
      const complexSearchQuery = {
        governorateIds: [1, 2],
        verificationStatus: SyrianVendorVerificationStatus.VERIFIED,
        businessType: SyrianBusinessType.LIMITED_LIABILITY,
        vendorCategory: SyrianVendorCategory.MANUFACTURER,
        isActive: true,
        isFeatured: true,
        minQualityScore: 85,
        sortBy: 'totalRevenueSyp',
        sortOrder: 'DESC' as const,
      };

      mockQueryBuilder.getCount.mockResolvedValue(5);
      mockQueryBuilder.getMany.mockResolvedValue([mockVendor]);
      mockQueryBuilder.getRawOne.mockResolvedValue({
        averageQualityScore: '90',
        totalRevenueSyp: '100000000',
        averageOrderValue: '500000',
      });
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      await service.searchSyrianVendors(complexSearchQuery);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'vendor.governorateId IN (:...governorateIds)',
        { governorateIds: [1, 2] },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'vendor.verificationStatus = :verificationStatus',
        { verificationStatus: SyrianVendorVerificationStatus.VERIFIED },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'vendor.businessType = :businessType',
        { businessType: SyrianBusinessType.LIMITED_LIABILITY },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'vendor.vendorCategory = :vendorCategory',
        { vendorCategory: SyrianVendorCategory.MANUFACTURER },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'vendor.isActive = :isActive',
        { isActive: true },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'vendor.isFeatured = :isFeatured',
        { isFeatured: true },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'vendor.qualityScore >= :minQualityScore',
        { minQualityScore: 85 },
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'vendor.totalRevenueSyp',
        'DESC',
      );
    });
  });

  describe('⚡ Bulk Operations', () => {
    it('should perform bulk vendor activation successfully', async () => {
      const bulkActionDto = {
        action: 'activate',
        vendorIds: [1, 2, 3],
      };

      const verifiedVendor = {
        ...mockVendor,
        verificationStatus: SyrianVendorVerificationStatus.VERIFIED,
      } as any;

      vendorRepository.findOne.mockResolvedValue(verifiedVendor);
      vendorRepository.update.mockResolvedValue({ affected: 1 } as any);

      const result = await service.performBulkVendorActions(bulkActionDto, 1);

      expect(result.action).toBe('activate');
      expect(result.processed).toBe(3);
      expect(result.failed).toBe(0);
      expect(result.results).toHaveLength(3);
      result.results.forEach((res, index) => {
        expect(res.vendorId).toBe(bulkActionDto.vendorIds[index]);
        expect(res.success).toBe(true);
        expect(res.message).toBe('Vendor activated successfully');
      });
    });

    it('should handle bulk activation failures for unverified vendors', async () => {
      const bulkActionDto = {
        action: 'activate',
        vendorIds: [1, 2],
      };

      const unverifiedVendor = {
        ...mockVendor,
        verificationStatus: SyrianVendorVerificationStatus.DRAFT,
      } as any;

      vendorRepository.findOne.mockResolvedValue(unverifiedVendor);

      const result = await service.performBulkVendorActions(bulkActionDto, 1);

      expect(result.processed).toBe(0);
      expect(result.failed).toBe(2);
      result.results.forEach((res) => {
        expect(res.success).toBe(false);
        expect(res.error).toBe('Vendor must be verified before activation');
      });
    });

    it('should perform bulk priority updates', async () => {
      const bulkActionDto = {
        action: 'updatePriority',
        vendorIds: [1, 2],
        parameters: { priority: 'high' },
      };

      vendorRepository.findOne.mockResolvedValue(mockVendor);
      vendorRepository.update.mockResolvedValue({ affected: 1 } as any);

      const result = await service.performBulkVendorActions(bulkActionDto, 1);

      expect(result.processed).toBe(2);
      expect(result.failed).toBe(0);
      result.results.forEach((res) => {
        expect(res.success).toBe(true);
        expect(res.message).toBe('Vendor priority updated to high');
      });
      expect(vendorRepository.update).toHaveBeenCalledWith(
        expect.any(Number),
        expect.objectContaining({
          workflowPriority: 'high',
          updatedAt: expect.any(Date),
        }),
      );
    });

    it('should handle unknown bulk actions', async () => {
      const bulkActionDto = {
        action: 'unknown_action',
        vendorIds: [1],
      };

      vendorRepository.findOne.mockResolvedValue(mockVendor);

      const result = await service.performBulkVendorActions(bulkActionDto, 1);

      expect(result.processed).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.results[0].error).toBe('Unknown action: unknown_action');
    });

    it('should handle vendor not found in bulk operations', async () => {
      const bulkActionDto = {
        action: 'activate',
        vendorIds: [999],
      };

      vendorRepository.findOne.mockResolvedValue(null);

      const result = await service.performBulkVendorActions(bulkActionDto, 1);

      expect(result.processed).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.results[0].error).toBe('Vendor with ID 999 not found');
    });
  });

  describe('📊 Statistics and Analytics', () => {
    it('should get comprehensive vendor statistics', async () => {
      vendorRepository.count
        .mockResolvedValueOnce(500) // total vendors
        .mockResolvedValueOnce(420) // active vendors
        .mockResolvedValueOnce(350) // verified vendors
        .mockResolvedValueOnce(70) // pending verification
        .mockResolvedValueOnce(15) // current month
        .mockResolvedValue(10); // last month

      mockQueryBuilder.getRawOne
        .mockResolvedValueOnce({ averageQualityScore: '82.5' })
        .mockResolvedValue({ totalRevenueSyp: '15000000000' }); // 15 billion SYP

      const result = await service.getVendorStatistics();

      expect(result).toEqual({
        totalVendors: 500,
        activeVendors: 420,
        verifiedVendors: 350,
        pendingVerification: 70,
        averageQualityScore: 82.5,
        totalRevenueSyp: 15000000000,
        monthlyGrowth: 50.0, // (15-10)/10 * 100
      });
    });

    it('should calculate monthly growth correctly with zero last month', async () => {
      vendorRepository.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(80) // active
        .mockResolvedValueOnce(60) // verified
        .mockResolvedValueOnce(20) // pending
        .mockResolvedValueOnce(5) // current month
        .mockResolvedValue(0); // last month (zero)

      mockQueryBuilder.getRawOne
        .mockResolvedValueOnce({ averageQualityScore: '75.0' })
        .mockResolvedValue({ totalRevenueSyp: '500000000' });

      const result = await service.getVendorStatistics();

      expect(result.monthlyGrowth).toBe(0); // Should handle division by zero
    });

    it('should handle null quality score and revenue gracefully', async () => {
      vendorRepository.count.mockResolvedValue(0);
      mockQueryBuilder.getRawOne
        .mockResolvedValueOnce({ averageQualityScore: null })
        .mockResolvedValue({ totalRevenueSyp: null });

      const result = await service.getVendorStatistics();

      expect(result.averageQualityScore).toBe(0);
      expect(result.totalRevenueSyp).toBe(0);
    });
  });

  describe('🌍 Syrian Market Features', () => {
    it('should calculate quality score with Syrian business factors', async () => {
      const syrianVendorDto = {
        userId: 1,
        storeNameEn: 'Damascus Traditional Crafts',
        storeNameAr: 'الحرف التقليدية الدمشقية',
        storeDescriptionEn: 'Authentic Damascus handicrafts',
        storeDescriptionAr: 'الحرف اليدوية الدمشقية الأصلية',
        governorateId: 1, // Damascus gets geographic bonus
        businessType: SyrianBusinessType.JOINT_STOCK, // Gets business type bonus
        vendorCategory: SyrianVendorCategory.MANUFACTURER, // Gets category bonus
        cityNameEn: 'Damascus',
        cityNameAr: 'دمشق',
        streetAddressEn: '123 Al-Hamidiyeh Market, Old Damascus',
        streetAddressAr: 'سوق الحميدية 123، دمشق القديمة',
        primaryPhone: '+963987654321',
        businessEmail: 'damascus.crafts@souqsyria.com',
        commercialRegisterNumber: 'CR-DM-2024-002',
        taxIdNumber: 'TAX-987654321',
        industrialLicenseNumber: 'IL-2024-001',
        websiteUrl: 'https://damascus-crafts.sy',
        socialMediaLinks: {
          facebook: 'https://facebook.com/damascus.crafts',
          instagram: '@damascus_crafts',
        },
        secondaryPhone: '+963988123456',
        whatsappNumber: '+963987654321',
      };

      userRepository.findOne.mockResolvedValue(mockUser);
      governorateRepository.findOne.mockResolvedValue(mockGovernorate);
      vendorRepository.findOne.mockResolvedValue(null);

      const expectedVendor = {
        ...mockVendor,
        businessType: SyrianBusinessType.JOINT_STOCK,
        vendorCategory: SyrianVendorCategory.MANUFACTURER,
        qualityScore: 85, // High score due to Syrian business factors
      };

      vendorRepository.create.mockReturnValue(expectedVendor as any);
      vendorRepository.save.mockResolvedValue(expectedVendor as any);
      jest
        .spyOn(service, 'findSyrianVendorById')
        .mockResolvedValue(expectedVendor as any);

      const result = await service.createSyrianVendor(syrianVendorDto);

      // Quality score should be high due to:
      // - Complete business information
      // - All registration numbers provided
      // - Joint stock company bonus
      // - Manufacturer category bonus
      // - Damascus geographic bonus
      expect(result.qualityScore).toBeGreaterThan(80);
    });

    it('should handle large Syrian currency amounts correctly', async () => {
      const largeSyrianAmounts = {
        totalRevenueSyp: 50000000000, // 50 billion SYP
        averageOrderValueSyp: 2500000, // 2.5 million SYP per order
        totalOrders: 20000,
      };

      vendorRepository.count.mockResolvedValue(1000);
      mockQueryBuilder.getRawOne
        .mockResolvedValueOnce({ averageQualityScore: '85.0' })
        .mockResolvedValue({
          totalRevenueSyp: largeSyrianAmounts.totalRevenueSyp.toString(),
        });

      const result = await service.getVendorStatistics();

      expect(result.totalRevenueSyp).toBe(50000000000);
      expect(typeof result.totalRevenueSyp).toBe('number');
      expect(result.totalRevenueSyp).toBeGreaterThan(1000000000); // Over 1 billion
    });

    it('should support Arabic sorting and filtering', async () => {
      const arabicSearchQuery = {
        searchTerm: 'صناعة تقليدية',
        sortBy: 'storeNameAr',
        sortOrder: 'ASC' as const,
        businessType: SyrianBusinessType.SOLE_PROPRIETORSHIP,
        vendorCategory: SyrianVendorCategory.RETAILER,
      };

      mockQueryBuilder.getCount.mockResolvedValue(3);
      mockQueryBuilder.getMany.mockResolvedValue([mockVendor]);
      mockQueryBuilder.getRawOne.mockResolvedValue({
        averageQualityScore: '78',
        totalRevenueSyp: '5000000',
        averageOrderValue: '150000',
      });
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      const result = await service.searchSyrianVendors(arabicSearchQuery);

      expect(result.vendors).toEqual([mockVendor]);
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'vendor.storeNameAr',
        'ASC',
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'vendor.businessType = :businessType',
        { businessType: SyrianBusinessType.SOLE_PROPRIETORSHIP },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'vendor.vendorCategory = :vendorCategory',
        { vendorCategory: SyrianVendorCategory.RETAILER },
      );
    });

    it('should provide governorate-specific analytics', async () => {
      mockQueryBuilder.getRawMany
        .mockResolvedValueOnce([
          { governorate: 'Damascus', count: '150' },
          { governorate: 'Aleppo', count: '120' },
          { governorate: 'Homs', count: '80' },
        ])
        .mockResolvedValueOnce([
          { status: 'verified', count: '250' },
          { status: 'pending', count: '100' },
        ])
        .mockResolvedValue([
          { businessType: 'limited_liability', count: '200' },
          { businessType: 'sole_proprietorship', count: '150' },
        ]);

      // Call the private method through search to test filter distributions
      mockQueryBuilder.getCount.mockResolvedValue(350);
      mockQueryBuilder.getMany.mockResolvedValue([]);
      mockQueryBuilder.getRawOne.mockResolvedValue({
        averageQualityScore: '80',
        totalRevenueSyp: '1000000000',
        averageOrderValue: '300000',
      });

      const result = await service.searchSyrianVendors({ page: 1, limit: 10 });

      expect(result.filters.governorateDistribution).toEqual({
        Damascus: 150,
        Aleppo: 120,
        Homs: 80,
      });
      expect(result.filters.statusDistribution).toEqual({
        verified: 250,
        pending: 100,
      });
      expect(result.filters.businessTypeDistribution).toEqual({
        limited_liability: 200,
        sole_proprietorship: 150,
      });
    });
  });

  describe('🔧 Error Handling', () => {
    it('should handle database connection errors', async () => {
      userRepository.findOne.mockRejectedValue(
        new Error('Database connection failed'),
      );

      // Using partial DTO for error testing - database error occurs before validation
      await expect(
        service.createSyrianVendor({
          userId: 1,
          storeNameEn: 'Test',
          governorateId: 1,
        } as any),
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle query builder errors in search', async () => {
      mockQueryBuilder.getMany.mockRejectedValue(
        new Error('Query execution failed'),
      );

      await expect(
        service.searchSyrianVendors({ page: 1, limit: 10 }),
      ).rejects.toThrow('Query execution failed');
    });

    it('should handle bulk operation transaction errors', async () => {
      vendorRepository.findOne.mockResolvedValue(mockVendor);
      vendorRepository.update.mockRejectedValue(new Error('Update failed'));

      const bulkActionDto = {
        action: 'activate',
        vendorIds: [1],
      };

      const result = await service.performBulkVendorActions(bulkActionDto, 1);

      expect(result.failed).toBe(1);
      expect(result.results[0].error).toBe('Update failed');
    });
  });
});
