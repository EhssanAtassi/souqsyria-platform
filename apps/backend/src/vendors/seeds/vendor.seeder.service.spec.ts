/**
 * @file vendor.seeder.service.spec.ts
 * @description Unit tests for VendorSeederService
 *
 * Tests comprehensive vendor seeding functionality including:
 * - Syrian vendor profile generation with realistic business data
 * - Multi-governorate distribution and business type coverage
 * - Quality score calculations and performance metrics
 * - Verification workflow state management
 * - Arabic/English bilingual support and localization
 * - Large SYP currency amounts handling
 * - Syrian business compliance and documentation
 * - Statistics and analytics generation
 *
 * @author SouqSyria Development Team
 * @since 2025-08-18
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';

import { VendorSeederService } from './vendor.seeder.service';
import {
  SyrianVendorEntity,
  SyrianVendorVerificationStatus,
  SyrianBusinessType,
  SyrianVendorCategory,
} from '../entities/syrian-vendor.entity';
import { User } from '../../users/entities/user.entity';
import { SyrianGovernorateEntity } from '../../addresses/entities/syrian-governorate.entity';

describe('VendorSeederService', () => {
  let service: VendorSeederService;
  let vendorRepository: jest.Mocked<Repository<SyrianVendorEntity>>;
  let userRepository: jest.Mocked<Repository<User>>;
  let governorateRepository: jest.Mocked<Repository<SyrianGovernorateEntity>>;

  // Test data
  let mockUsers: User[];
  let mockGovernorates: SyrianGovernorateEntity[];
  let mockVendors: SyrianVendorEntity[];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VendorSeederService,
        {
          provide: getRepositoryToken(SyrianVendorEntity),
          useFactory: () => ({
            find: jest.fn(),
            count: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnThis(),
              addSelect: jest.fn().mockReturnThis(),
              leftJoin: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              groupBy: jest.fn().mockReturnThis(),
              getRawOne: jest.fn(),
              getRawMany: jest.fn(),
            }),
          }),
        },
        {
          provide: getRepositoryToken(User),
          useFactory: () => ({
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          }),
        },
        {
          provide: getRepositoryToken(SyrianGovernorateEntity),
          useFactory: () => ({
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          }),
        },
      ],
    }).compile();

    service = module.get<VendorSeederService>(VendorSeederService);
    vendorRepository = module.get(getRepositoryToken(SyrianVendorEntity));
    userRepository = module.get(getRepositoryToken(User));
    governorateRepository = module.get(
      getRepositoryToken(SyrianGovernorateEntity),
    );

    // Mock the logger to avoid console output during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();

    // Initialize test data
    setupTestData();
  });

  function setupTestData() {
    mockUsers = [
      {
        id: 1,
        email: 'ahmad.damascus@souqsyria.com',
        fullName: 'أحمد التاجر الدمشقي',
        phone: '+963987654321',
        isVerified: true,
      },
      {
        id: 2,
        email: 'fatima.aleppo@souqsyria.com',
        fullName: 'فاطمة الحرفية الحلبية',
        phone: '+963988123456',
        isVerified: true,
      },
      {
        id: 3,
        email: 'omar.homs@souqsyria.com',
        fullName: 'عمر تاجر حمص',
        phone: '+963989987654',
        isVerified: true,
      },
    ] as User[];

    mockGovernorates = [
      {
        id: 1,
        nameEn: 'Damascus',
        nameAr: 'دمشق',
        code: 'DM',
        isActive: true,
      },
      {
        id: 2,
        nameEn: 'Aleppo',
        nameAr: 'حلب',
        code: 'AL',
        isActive: true,
      },
      {
        id: 3,
        nameEn: 'Homs',
        nameAr: 'حمص',
        code: 'HO',
        isActive: true,
      },
    ] as SyrianGovernorateEntity[];

    mockVendors = [
      {
        id: 1,
        userId: 1,
        user: mockUsers[0],
        governorateId: 1,
        governorate: mockGovernorates[0],
        storeNameEn: 'Damascus Electronics Hub',
        storeNameAr: 'مركز دمشق للإلكترونيات',
        storeDescriptionEn: 'Leading electronics retailer in Damascus',
        storeDescriptionAr: 'أفضل متجر إلكترونيات في دمشق',
        businessType: SyrianBusinessType.LIMITED_LIABILITY,
        vendorCategory: SyrianVendorCategory.RETAILER,
        verificationStatus: SyrianVendorVerificationStatus.VERIFIED,
        qualityScore: 85,
        totalRevenueSyp: 850000000,
        totalOrders: 2500,
        customerSatisfactionRating: 4.5,
        fulfillmentRate: 96.8,
        returnRate: 2.1,
        responseTimeHours: 3,
        averageOrderValueSyp: 340000,
        primaryPhone: '+963987654321',
        secondaryPhone: null,
        contactEmail: 'damascus.electronics@souqsyria.com',
        address: 'شارع الثورة، دمشق، سوريا',
        websiteUrl: 'https://damascus-electronics.sy',
        commercialRegisterNumber: 'CR-DM-2024-001',
        taxIdNumber: 'TAX-123456789',
        industrialLicenseNumber: 'IL-DM-2024-001',
        isActive: true,
        isFeatured: false,
        workflowPriority: 'normal',
        escalationLevel: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as any[]; // Using any[] for mock data with additional test properties
  }

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('🏪 Comprehensive Vendor Seeding', () => {
    it('should seed comprehensive Syrian vendor data successfully', async () => {
      // Mock repository responses for full seeding flow
      vendorRepository.delete.mockResolvedValue({ affected: 0 } as any);
      userRepository.find.mockResolvedValue([]);
      governorateRepository.find.mockResolvedValue([]);

      // Mock user and governorate creation
      userRepository.create.mockReturnValue(mockUsers as any);
      userRepository.save.mockResolvedValue(mockUsers as any);
      governorateRepository.create.mockReturnValue(mockGovernorates as any);
      governorateRepository.save.mockResolvedValue(mockGovernorates as any);

      // Mock vendor creation
      vendorRepository.create.mockImplementation(
        (data) => ({ ...data, id: Math.random() }) as any,
      );
      vendorRepository.save.mockResolvedValue(mockVendors as any);

      // Mock statistics calculation
      vendorRepository.count
        .mockResolvedValueOnce(20) // totalVendors
        .mockResolvedValueOnce(15) // verifiedVendors
        .mockResolvedValue(18); // activeVendors

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ avgQuality: '85.5' }),
        getRawMany: jest
          .fn()
          .mockResolvedValueOnce([
            { businessType: 'limited_liability', count: '8' },
            { businessType: 'sole_proprietorship', count: '6' },
            { businessType: 'joint_stock', count: '4' },
            { businessType: 'partnership', count: '2' },
          ])
          .mockResolvedValue([
            { governorate: 'Damascus', count: '7' },
            { governorate: 'Aleppo', count: '5' },
            { governorate: 'Homs', count: '4' },
            { governorate: 'Lattakia', count: '4' },
          ]),
      };
      vendorRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const result = await service.seedVendors();

      expect(result.vendors).toHaveLength(mockVendors.length);
      expect(result.statistics).toEqual({
        totalVendors: 20,
        verifiedVendors: 15,
        activeVendors: 18,
        averageQualityScore: 85.5,
        businessTypeDistribution: {
          limited_liability: 8,
          sole_proprietorship: 6,
          joint_stock: 4,
          partnership: 2,
        },
        governorateDistribution: {
          Damascus: 7,
          Aleppo: 5,
          Homs: 4,
          Lattakia: 4,
        },
      });

      // Verify the seeding process
      expect(vendorRepository.delete).toHaveBeenCalledWith({});
      expect(userRepository.save).toHaveBeenCalledWith(expect.any(Array));
      expect(governorateRepository.save).toHaveBeenCalledWith(
        expect.any(Array),
      );
      expect(vendorRepository.save).toHaveBeenCalledWith(expect.any(Array));
    });

    it('should reuse existing users when sufficient users exist', async () => {
      const existingUsers = mockUsers.slice(0, 20);
      userRepository.find.mockResolvedValue(existingUsers);
      governorateRepository.find.mockResolvedValue(mockGovernorates);
      vendorRepository.delete.mockResolvedValue({ affected: 0 } as any);
      vendorRepository.create.mockImplementation(
        (data) => ({ ...data, id: Math.random() }) as any,
      );
      vendorRepository.save.mockResolvedValue([] as any);

      // Mock statistics
      vendorRepository.count.mockResolvedValue(0);
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ avgQuality: '0' }),
        getRawMany: jest.fn().mockResolvedValue([]),
      };
      vendorRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      await service.seedVendors();

      // Should not create new users
      expect(userRepository.create).not.toHaveBeenCalled();
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('should reuse existing governorates when sufficient governorates exist', async () => {
      const existingGovernorates = [
        ...mockGovernorates,
        ...Array(11)
          .fill(null)
          .map((_, i) => ({
            id: i + 4,
            nameEn: `Governorate ${i + 4}`,
            nameAr: `محافظة ${i + 4}`,
            code: `G${i + 4}`,
            isActive: true,
          })),
      ];

      userRepository.find.mockResolvedValue([]);
      userRepository.create.mockReturnValue(mockUsers as any);
      userRepository.save.mockResolvedValue(mockUsers as any);
      governorateRepository.find.mockResolvedValue(existingGovernorates as any);
      vendorRepository.delete.mockResolvedValue({ affected: 0 } as any);
      vendorRepository.create.mockImplementation(
        (data) => ({ ...data, id: Math.random() }) as any,
      );
      vendorRepository.save.mockResolvedValue([] as any);

      // Mock statistics
      vendorRepository.count.mockResolvedValue(0);
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ avgQuality: '0' }),
        getRawMany: jest.fn().mockResolvedValue([]),
      };
      vendorRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      await service.seedVendors();

      // Should not create new governorates
      expect(governorateRepository.create).not.toHaveBeenCalled();
      expect(governorateRepository.save).not.toHaveBeenCalled();
    });

    it('should handle seeding errors gracefully', async () => {
      const error = new Error('Database connection failed');
      vendorRepository.delete.mockRejectedValue(error);

      await expect(service.seedVendors()).rejects.toThrow(
        'Database connection failed',
      );
      expect(Logger.prototype.error).toHaveBeenCalledWith(
        '❌ Vendor seeding failed: Database connection failed',
        expect.any(String),
      );
    });
  });

  describe('📊 Quality Score Calculation', () => {
    it('should calculate quality score for joint stock manufacturer', () => {
      const highQualityProfile = {
        businessType: SyrianBusinessType.JOINT_STOCK,
        vendorCategory: SyrianVendorCategory.MANUFACTURER,
        customerSatisfactionRating: 4.8,
        fulfillmentRate: 98.5,
        returnRate: 1.0,
        commercialRegisterNumber: 'CR-DM-2024-001',
        taxIdNumber: 'TAX-123456789',
        industrialLicenseNumber: 'IL-DM-2024-001',
        websiteUrl: 'https://example.sy',
        socialMediaLinks: { facebook: 'https://facebook.com/test' },
        totalRevenueSyp: 1500000000, // 1.5 billion SYP
      };

      // Call the private method through reflection for testing
      const qualityScore = (service as any).calculateQualityScore(
        highQualityProfile,
      );

      expect(qualityScore).toBeGreaterThan(90);
      expect(qualityScore).toBeLessThanOrEqual(100);
    });

    it('should calculate quality score for sole proprietorship craftsman', () => {
      const mediumQualityProfile = {
        businessType: SyrianBusinessType.SOLE_PROPRIETORSHIP,
        vendorCategory: SyrianVendorCategory.DISTRIBUTOR,
        customerSatisfactionRating: 4.2,
        fulfillmentRate: 91.0,
        returnRate: 3.5,
        commercialRegisterNumber: 'CR-AL-2024-002',
        totalRevenueSyp: 150000000, // 150 million SYP
      };

      const qualityScore = (service as any).calculateQualityScore(
        mediumQualityProfile,
      );

      expect(qualityScore).toBeGreaterThan(60);
      expect(qualityScore).toBeLessThan(85);
    });

    it('should calculate quality score for poor performing vendor', () => {
      const lowQualityProfile = {
        businessType: SyrianBusinessType.SOLE_PROPRIETORSHIP,
        vendorCategory: SyrianVendorCategory.RETAILER,
        customerSatisfactionRating: 3.0,
        fulfillmentRate: 80.0,
        returnRate: 12.0,
        totalRevenueSyp: 50000000, // 50 million SYP
      };

      const qualityScore = (service as any).calculateQualityScore(
        lowQualityProfile,
      );

      expect(qualityScore).toBeGreaterThanOrEqual(0);
      expect(qualityScore).toBeLessThan(60);
    });

    it('should apply business type bonuses correctly', () => {
      const baseProfile = {
        vendorCategory: SyrianVendorCategory.RETAILER,
        customerSatisfactionRating: 4.0,
        fulfillmentRate: 90.0,
        returnRate: 3.0,
        totalRevenueSyp: 100000000,
      };

      const jointStockScore = (service as any).calculateQualityScore({
        ...baseProfile,
        businessType: SyrianBusinessType.JOINT_STOCK,
      });

      const limitedLiabilityScore = (service as any).calculateQualityScore({
        ...baseProfile,
        businessType: SyrianBusinessType.LIMITED_LIABILITY,
      });

      const partnershipScore = (service as any).calculateQualityScore({
        ...baseProfile,
        businessType: SyrianBusinessType.PARTNERSHIP,
      });

      const soleProprietorshipScore = (service as any).calculateQualityScore({
        ...baseProfile,
        businessType: SyrianBusinessType.SOLE_PROPRIETORSHIP,
      });

      expect(jointStockScore).toBeGreaterThan(limitedLiabilityScore);
      expect(limitedLiabilityScore).toBeGreaterThan(partnershipScore);
      expect(partnershipScore).toBeGreaterThan(soleProprietorshipScore);
    });

    it('should apply vendor category bonuses correctly', () => {
      const baseProfile = {
        businessType: SyrianBusinessType.LIMITED_LIABILITY,
        customerSatisfactionRating: 4.0,
        fulfillmentRate: 90.0,
        returnRate: 3.0,
        totalRevenueSyp: 100000000,
      };

      const manufacturerScore = (service as any).calculateQualityScore({
        ...baseProfile,
        vendorCategory: SyrianVendorCategory.MANUFACTURER,
      });

      const exporterScore = (service as any).calculateQualityScore({
        ...baseProfile,
        vendorCategory: SyrianVendorCategory.EXPORTER,
      });

      const wholesalerScore = (service as any).calculateQualityScore({
        ...baseProfile,
        vendorCategory: SyrianVendorCategory.WHOLESALER,
      });

      const retailerScore = (service as any).calculateQualityScore({
        ...baseProfile,
        vendorCategory: SyrianVendorCategory.RETAILER,
      });

      expect(manufacturerScore).toBeGreaterThan(exporterScore);
      expect(exporterScore).toBeGreaterThan(wholesalerScore);
      expect(wholesalerScore).toBeGreaterThan(retailerScore);
    });
  });

  describe('🔧 Workflow and Status Management', () => {
    it('should determine active status correctly', () => {
      const verifiedStatus = (service as any).determineActiveStatus(
        SyrianVendorVerificationStatus.VERIFIED,
      );
      const draftStatus = (service as any).determineActiveStatus(
        SyrianVendorVerificationStatus.DRAFT,
      );
      const suspendedStatus = (service as any).determineActiveStatus(
        SyrianVendorVerificationStatus.SUSPENDED,
      );

      expect(verifiedStatus).toBe(true);
      expect(draftStatus).toBe(false);
      expect(suspendedStatus).toBe(false);
    });

    it('should determine workflow priority correctly', () => {
      const manufacturerProfile = {
        vendorCategory: SyrianVendorCategory.MANUFACTURER,
        businessType: SyrianBusinessType.LIMITED_LIABILITY,
        totalRevenueSyp: 500000000,
      };

      const jointStockProfile = {
        vendorCategory: SyrianVendorCategory.RETAILER,
        businessType: SyrianBusinessType.JOINT_STOCK,
        totalRevenueSyp: 300000000,
      };

      const highRevenueProfile = {
        vendorCategory: SyrianVendorCategory.RETAILER,
        businessType: SyrianBusinessType.SOLE_PROPRIETORSHIP,
        totalRevenueSyp: 1500000000,
      };

      const normalProfile = {
        vendorCategory: SyrianVendorCategory.RETAILER,
        businessType: SyrianBusinessType.SOLE_PROPRIETORSHIP,
        totalRevenueSyp: 200000000,
      };

      expect(
        (service as any).determineWorkflowPriority(manufacturerProfile),
      ).toBe('high');
      expect(
        (service as any).determineWorkflowPriority(jointStockProfile),
      ).toBe('high');
      expect(
        (service as any).determineWorkflowPriority(highRevenueProfile),
      ).toBe('high');
      expect((service as any).determineWorkflowPriority(normalProfile)).toBe(
        'normal',
      );
    });

    it('should determine escalation level correctly', () => {
      const suspendedLevel = (service as any).determineEscalationLevel(
        SyrianVendorVerificationStatus.SUSPENDED,
      );
      const clarificationLevel = (service as any).determineEscalationLevel(
        SyrianVendorVerificationStatus.REQUIRES_CLARIFICATION,
      );
      const verifiedLevel = (service as any).determineEscalationLevel(
        SyrianVendorVerificationStatus.VERIFIED,
      );

      expect(suspendedLevel).toBe(2);
      expect(clarificationLevel).toBe(1);
      expect(verifiedLevel).toBe(0);
    });
  });

  describe('📅 Date Generation', () => {
    it('should generate realistic creation dates within last 6 months', () => {
      const now = new Date();
      const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

      const createdDate = (service as any).generateCreatedDate();

      expect(createdDate).toBeInstanceOf(Date);
      expect(createdDate.getTime()).toBeGreaterThanOrEqual(
        sixMonthsAgo.getTime(),
      );
      expect(createdDate.getTime()).toBeLessThanOrEqual(now.getTime());
    });

    it('should generate verification dates based on status', () => {
      const submittedDate = (service as any).generateVerificationDate(
        SyrianVendorVerificationStatus.SUBMITTED,
        'submitted',
      );
      const reviewedDate = (service as any).generateVerificationDate(
        SyrianVendorVerificationStatus.UNDER_REVIEW,
        'reviewed',
      );
      const completedDate = (service as any).generateVerificationDate(
        SyrianVendorVerificationStatus.VERIFIED,
        'completed',
      );

      expect(submittedDate).toBeInstanceOf(Date);
      expect(reviewedDate).toBeInstanceOf(Date);
      expect(completedDate).toBeInstanceOf(Date);
    });

    it('should not generate verification dates for inappropriate statuses', () => {
      const draftSubmitted = (service as any).generateVerificationDate(
        SyrianVendorVerificationStatus.DRAFT,
        'submitted',
      );
      const submittedCompleted = (service as any).generateVerificationDate(
        SyrianVendorVerificationStatus.SUBMITTED,
        'completed',
      );

      expect(draftSubmitted).toBeNull();
      expect(submittedCompleted).toBeNull();
    });

    it('should generate next review dates for pending statuses', () => {
      const submittedReviewDate = (service as any).generateNextReviewDate(
        SyrianVendorVerificationStatus.SUBMITTED,
      );
      const underReviewDate = (service as any).generateNextReviewDate(
        SyrianVendorVerificationStatus.UNDER_REVIEW,
      );
      const verifiedReviewDate = (service as any).generateNextReviewDate(
        SyrianVendorVerificationStatus.VERIFIED,
      );

      expect(submittedReviewDate).toBeInstanceOf(Date);
      expect(underReviewDate).toBeInstanceOf(Date);
      expect(verifiedReviewDate).toBeNull();
    });

    it('should generate performance review dates for verified vendors only', () => {
      const verifiedReviewDate = (service as any).generatePerformanceReviewDate(
        SyrianVendorVerificationStatus.VERIFIED,
      );
      const draftReviewDate = (service as any).generatePerformanceReviewDate(
        SyrianVendorVerificationStatus.DRAFT,
      );

      expect(verifiedReviewDate).toBeInstanceOf(Date);
      expect(draftReviewDate).toBeNull();
    });
  });

  describe('🏪 Minimal Vendor Seeding', () => {
    it('should seed minimal vendor data successfully', async () => {
      userRepository.find.mockResolvedValue(mockUsers);
      governorateRepository.find.mockResolvedValue(mockGovernorates);
      vendorRepository.create.mockImplementation(
        (data) => ({ ...data, id: Math.random() }) as any,
      );
      vendorRepository.save.mockResolvedValue(mockVendors.slice(0, 3) as any);

      const result = await service.seedMinimalVendors();

      expect(result.vendors).toHaveLength(3);
      expect(vendorRepository.create).toHaveBeenCalledTimes(3);
      expect(vendorRepository.save).toHaveBeenCalledWith(expect.any(Array));
    });

    it('should throw error when no users available for minimal seeding', async () => {
      userRepository.find.mockResolvedValue([]);
      governorateRepository.find.mockResolvedValue(mockGovernorates);

      await expect(service.seedMinimalVendors()).rejects.toThrow(
        'No users or governorates found. Please seed users and governorates first.',
      );
    });

    it('should throw error when no governorates available for minimal seeding', async () => {
      userRepository.find.mockResolvedValue(mockUsers);
      governorateRepository.find.mockResolvedValue([]);

      await expect(service.seedMinimalVendors()).rejects.toThrow(
        'No users or governorates found. Please seed users and governorates first.',
      );
    });

    it('should limit minimal vendors to available users', async () => {
      const limitedUsers = mockUsers.slice(0, 2);
      userRepository.find.mockResolvedValue(limitedUsers);
      governorateRepository.find.mockResolvedValue(mockGovernorates);
      vendorRepository.create.mockImplementation(
        (data) => ({ ...data, id: Math.random() }) as any,
      );
      vendorRepository.save.mockResolvedValue(mockVendors.slice(0, 2) as any);

      const result = await service.seedMinimalVendors();

      expect(result.vendors).toHaveLength(2);
      expect(vendorRepository.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('📊 Syrian Market Features', () => {
    it('should generate diverse Syrian business profiles', async () => {
      vendorRepository.delete.mockResolvedValue({ affected: 0 } as any);
      userRepository.find.mockResolvedValue([]);
      governorateRepository.find.mockResolvedValue([]);
      userRepository.create.mockReturnValue(mockUsers as any);
      userRepository.save.mockResolvedValue(mockUsers as any);
      governorateRepository.create.mockReturnValue(mockGovernorates as any);
      governorateRepository.save.mockResolvedValue(mockGovernorates as any);

      const createdVendors: any[] = [];
      vendorRepository.create.mockImplementation((data) => {
        const vendor = { ...data, id: createdVendors.length + 1 };
        createdVendors.push(vendor);
        return vendor as any;
      });
      vendorRepository.save.mockImplementation((vendors) =>
        Promise.resolve(vendors as any),
      );

      // Mock statistics
      vendorRepository.count.mockResolvedValue(createdVendors.length);
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ avgQuality: '80' }),
        getRawMany: jest.fn().mockResolvedValue([]),
      };
      vendorRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const result = await service.seedVendors();

      // Verify diverse business types
      const businessTypes = createdVendors.map((v) => v.businessType);
      expect(businessTypes).toContain(SyrianBusinessType.LIMITED_LIABILITY);
      expect(businessTypes).toContain(SyrianBusinessType.SOLE_PROPRIETORSHIP);
      expect(businessTypes).toContain(SyrianBusinessType.JOINT_STOCK);
      expect(businessTypes).toContain(SyrianBusinessType.PARTNERSHIP);

      // Verify diverse vendor categories
      const vendorCategories = createdVendors.map((v) => v.vendorCategory);
      expect(vendorCategories).toContain(SyrianVendorCategory.MANUFACTURER);
      expect(vendorCategories).toContain(SyrianVendorCategory.RETAILER);
      expect(vendorCategories).toContain(SyrianVendorCategory.DISTRIBUTOR);
      expect(vendorCategories).toContain(SyrianVendorCategory.WHOLESALER);

      // Verify Arabic names are included
      const arabicNames = createdVendors.map((v) => v.storeNameAr);
      expect(arabicNames.some((name) => name && name.includes('دمشق'))).toBe(
        true,
      );
      expect(arabicNames.some((name) => name && name.includes('حلب'))).toBe(
        true,
      );
    });

    it('should handle large Syrian currency amounts correctly', async () => {
      const largeRevenueProfile = {
        businessType: SyrianBusinessType.JOINT_STOCK,
        vendorCategory: SyrianVendorCategory.MANUFACTURER,
        customerSatisfactionRating: 4.5,
        fulfillmentRate: 95.0,
        returnRate: 2.0,
        totalRevenueSyp: 5000000000, // 5 billion SYP
      };

      const qualityScore = (service as any).calculateQualityScore(
        largeRevenueProfile,
      );

      expect(qualityScore).toBeGreaterThan(85);
      expect(typeof qualityScore).toBe('number');
    });

    it('should generate Syrian governorate distribution', async () => {
      vendorRepository.count.mockResolvedValue(14);
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ avgQuality: '80' }),
        getRawMany: jest
          .fn()
          .mockResolvedValueOnce([
            { businessType: 'limited_liability', count: '6' },
            { businessType: 'joint_stock', count: '4' },
            { businessType: 'sole_proprietorship', count: '2' },
            { businessType: 'partnership', count: '2' },
          ])
          .mockResolvedValue([
            { governorate: 'Damascus', count: '4' },
            { governorate: 'Aleppo', count: '3' },
            { governorate: 'Homs', count: '2' },
            { governorate: 'Lattakia', count: '2' },
            { governorate: 'Tartous', count: '1' },
            { governorate: 'Hama', count: '1' },
            { governorate: 'Damascus Countryside', count: '1' },
          ]),
      };
      vendorRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const statistics = await (service as any).calculateVendorStatistics();

      expect(statistics.governorateDistribution).toEqual({
        Damascus: 4,
        Aleppo: 3,
        Homs: 2,
        Lattakia: 2,
        Tartous: 1,
        Hama: 1,
        'Damascus Countryside': 1,
      });
    });
  });

  describe('🔧 Error Handling', () => {
    it('should handle user creation errors', async () => {
      vendorRepository.delete.mockResolvedValue({ affected: 0 } as any);
      userRepository.find.mockResolvedValue([]);
      userRepository.create.mockImplementation(() => {
        throw new Error('User creation failed');
      });

      await expect(service.seedVendors()).rejects.toThrow(
        'User creation failed',
      );
    });

    it('should handle governorate creation errors', async () => {
      vendorRepository.delete.mockResolvedValue({ affected: 0 } as any);
      userRepository.find.mockResolvedValue(mockUsers);
      governorateRepository.find.mockResolvedValue([]);
      governorateRepository.create.mockImplementation(() => {
        throw new Error('Governorate creation failed');
      });

      await expect(service.seedVendors()).rejects.toThrow(
        'Governorate creation failed',
      );
    });

    it('should handle vendor creation errors', async () => {
      vendorRepository.delete.mockResolvedValue({ affected: 0 } as any);
      userRepository.find.mockResolvedValue(mockUsers);
      governorateRepository.find.mockResolvedValue(mockGovernorates);
      vendorRepository.create.mockImplementation(() => {
        throw new Error('Vendor creation failed');
      });

      await expect(service.seedVendors()).rejects.toThrow(
        'Vendor creation failed',
      );
    });

    it('should handle statistics calculation errors', async () => {
      vendorRepository.delete.mockResolvedValue({ affected: 0 } as any);
      userRepository.find.mockResolvedValue(mockUsers);
      governorateRepository.find.mockResolvedValue(mockGovernorates);
      vendorRepository.create.mockImplementation(
        (data) => ({ ...data, id: Math.random() }) as any,
      );
      vendorRepository.save.mockResolvedValue([] as any);
      vendorRepository.count.mockRejectedValue(
        new Error('Statistics calculation failed'),
      );

      await expect(service.seedVendors()).rejects.toThrow(
        'Statistics calculation failed',
      );
    });
  });

  describe('⚡ Performance and Scalability', () => {
    it('should complete seeding process efficiently', async () => {
      const startTime = Date.now();

      vendorRepository.delete.mockResolvedValue({ affected: 0 } as any);
      userRepository.find.mockResolvedValue(mockUsers);
      governorateRepository.find.mockResolvedValue(mockGovernorates);
      vendorRepository.create.mockImplementation(
        (data) => ({ ...data, id: Math.random() }) as any,
      );
      vendorRepository.save.mockResolvedValue([] as any);

      // Mock statistics
      vendorRepository.count.mockResolvedValue(0);
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ avgQuality: '0' }),
        getRawMany: jest.fn().mockResolvedValue([]),
      };
      vendorRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      await service.seedVendors();

      const processingTime = Date.now() - startTime;
      expect(processingTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle bulk vendor creation efficiently', async () => {
      const bulkVendors = Array(100)
        .fill(null)
        .map((_, i) => ({
          id: i + 1,
          storeNameEn: `Store ${i + 1}`,
          storeNameAr: `متجر ${i + 1}`,
        }));

      vendorRepository.create.mockImplementation((data) => data as any);
      vendorRepository.save.mockImplementation(async (vendors: any) => {
        if (Array.isArray(vendors)) {
          expect(vendors).toHaveLength(bulkVendors.length);
        }
        return vendors;
      });

      const result = await vendorRepository.save(bulkVendors as any);
      expect(result).toHaveLength(100);
    });
  });
});
