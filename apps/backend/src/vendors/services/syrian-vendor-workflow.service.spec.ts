/**
 * @file syrian-vendor-workflow.service.spec.ts
 * @description Unit tests for SyrianVendorWorkflowService
 *
 * Tests enterprise Syrian vendor workflow functionality including:
 * - 9-state vendor verification workflow with automated transitions
 * - SLA monitoring and escalation management
 * - Performance analytics and quality scoring
 * - Syrian business compliance and regulatory checks
 * - Automated workflow monitoring and alerts
 * - Cultural formatting and Arabic/English localization
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

import { SyrianVendorWorkflowService } from './syrian-vendor-workflow.service';
import {
  SyrianVendorEntity,
  SyrianVendorVerificationStatus,
  SyrianBusinessType,
  SyrianVendorCategory,
} from '../entities/syrian-vendor.entity';
import { User } from '../../users/entities/user.entity';
import { SyrianGovernorateEntity } from '../../addresses/entities/syrian-governorate.entity';

/**
 * Helper function to add SyrianVendorEntity methods to mock vendor objects.
 * TypeScript requires entity methods to be present when typing as SyrianVendorEntity.
 * This adds mock implementations of all entity methods.
 */
const addVendorEntityMethods = (
  vendor: Partial<SyrianVendorEntity>,
): SyrianVendorEntity => {
  return {
    ...vendor,
    getStoreName: jest.fn().mockImplementation((lang = 'both') => {
      if (lang === 'en') return vendor.storeNameEn || 'Test Store';
      if (lang === 'ar') return vendor.storeNameAr || 'متجر اختبار';
      return {
        en: vendor.storeNameEn || 'Test Store',
        ar: vendor.storeNameAr || 'متجر اختبار',
      };
    }),
    getStoreDescription: jest.fn().mockImplementation((lang = 'both') => {
      if (lang === 'en') return vendor.storeDescriptionEn || 'Test Description';
      if (lang === 'ar') return vendor.storeDescriptionAr || 'وصف اختبار';
      return {
        en: vendor.storeDescriptionEn || 'Test Description',
        ar: vendor.storeDescriptionAr || 'وصف اختبار',
      };
    }),
    getFormattedRevenue: jest.fn().mockReturnValue({
      syp: `${vendor.totalRevenueSyp || 0} SYP`,
      usd: `$${(vendor.totalRevenueUsd || 0).toFixed(2)}`,
      formatted: `${vendor.totalRevenueSyp || 0} SYP`,
    }),
    getVerificationProgress: jest.fn().mockReturnValue(75),
    // Only add default if not already provided
    isEligibleForVerification: (vendor as any).isEligibleForVerification || jest.fn().mockReturnValue(true),
    getVerificationStatusLocalized: jest.fn().mockImplementation((lang = 'en') => {
      const statusMap = {
        en: { draft: 'Draft', submitted: 'Submitted', verified: 'Verified' },
        ar: { draft: 'مسودة', submitted: 'مقدم', verified: 'موثق' },
      };
      return statusMap[lang]?.[vendor.verificationStatus as string] || vendor.verificationStatus;
    }),
  } as unknown as SyrianVendorEntity;
};

describe('SyrianVendorWorkflowService', () => {
  let service: SyrianVendorWorkflowService;
  let vendorRepository: jest.Mocked<Repository<SyrianVendorEntity>>;
  let userRepository: jest.Mocked<Repository<User>>;
  let governorateRepository: jest.Mocked<Repository<SyrianGovernorateEntity>>;

  // Test data
  let mockUser: User;
  let mockReviewer: User;
  let mockGovernorate: SyrianGovernorateEntity;
  let mockVendor: SyrianVendorEntity;
  let mockQueryBuilder: jest.Mocked<SelectQueryBuilder<SyrianVendorEntity>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyrianVendorWorkflowService,
        {
          provide: getRepositoryToken(SyrianVendorEntity),
          useFactory: () => ({
            findOne: jest.fn(),
            find: jest.fn(),
            update: jest.fn(),
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

    service = module.get<SyrianVendorWorkflowService>(
      SyrianVendorWorkflowService,
    );
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
      fullName: 'أحمد التاجر السوري',
      phone: '+963987654321',
      isVerified: true,
    } as any;

    mockReviewer = {
      id: 2,
      email: 'reviewer@souqsyria.com',
      fullName: 'مراجع النظام',
      phone: '+963988123456',
      isVerified: true,
    } as any;

    mockGovernorate = {
      id: 1,
      nameEn: 'Damascus',
      nameAr: 'دمشق',
      code: 'DM',
      isActive: true,
    } as SyrianGovernorateEntity;

    // Use helper to add entity methods to mock vendor
    mockVendor = addVendorEntityMethods({
      id: 1,
      userId: 1,
      user: mockUser,
      governorateId: 1,
      governorate: mockGovernorate,
      storeNameEn: 'Damascus Traditional Store',
      storeNameAr: 'متجر دمشق التقليدي',
      storeDescriptionEn: 'Traditional Syrian products',
      storeDescriptionAr: 'منتجات سورية تقليدية',
      businessType: SyrianBusinessType.LIMITED_LIABILITY,
      vendorCategory: SyrianVendorCategory.RETAILER,
      verificationStatus: SyrianVendorVerificationStatus.DRAFT,
      qualityScore: 75,
      totalRevenueSyp: 15000000, // 15 million SYP
      totalRevenueUsd: 3000, // For revenue formatting
      totalOrders: 100,
      customerSatisfactionRating: 4.2,
      fulfillmentRate: 95.5,
      returnRate: 2.1,
      responseTimeHours: 6,
      contactPhone: '+963987654321',
      contactEmail: 'damascus.traditional@souqsyria.com',
      commercialRegisterNumber: 'CR-DM-2024-001',
      taxIdNumber: 'TAX-123456789',
      isActive: false,
      isFeatured: false,
      workflowPriority: 'normal',
      escalationLevel: 0,
      verificationNotes: '',
      requiredDocumentsCompleted: false,
      nextReviewDate: null,
      verificationSubmittedAt: null,
      verificationReviewedAt: null,
      verificationCompletedAt: null,
      verifiedByUserId: null,
      lastPerformanceReviewAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Partial<SyrianVendorEntity>);
  }

  function setupQueryBuilderMocks() {
    mockQueryBuilder = {
      leftJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawOne: jest.fn(),
      getRawMany: jest.fn(),
      getMany: jest.fn(),
      getCount: jest.fn(),
    } as any;

    vendorRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
  }

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('🚀 Workflow Submissions', () => {
    it('should submit vendor for verification successfully', async () => {
      const draftVendor = addVendorEntityMethods({
        ...mockVendor,
        verificationStatus: SyrianVendorVerificationStatus.DRAFT,
      });

      vendorRepository.findOne.mockResolvedValue(draftVendor);
      vendorRepository.update.mockResolvedValue({ affected: 1 } as any);

      const result = await service.submitForVerification(1, 1);

      expect(result.success).toBe(true);
      expect(result.fromStatus).toBe(SyrianVendorVerificationStatus.DRAFT);
      expect(result.toStatus).toBe(SyrianVendorVerificationStatus.SUBMITTED);
      expect(result.message).toBe(
        'Vendor submitted for verification successfully',
      );
      expect(result.nextActions).toContain(
        'Admin review will begin within 24 hours',
      );
      expect(result.slaDeadline).toBeInstanceOf(Date);

      expect(vendorRepository.update).toHaveBeenCalledWith(1, {
        verificationStatus: SyrianVendorVerificationStatus.SUBMITTED,
        verificationSubmittedAt: expect.any(Date),
        nextReviewDate: expect.any(Date),
        workflowPriority: expect.any(String),
      });
    });

    it('should throw error when submitting non-draft vendor', async () => {
      const submittedVendor = addVendorEntityMethods({
        ...mockVendor,
        verificationStatus: SyrianVendorVerificationStatus.SUBMITTED,
      });

      vendorRepository.findOne.mockResolvedValue(submittedVendor);

      await expect(service.submitForVerification(1, 1)).rejects.toThrow(
        new BadRequestException(
          'Vendor cannot be submitted from status: submitted',
        ),
      );
    });

    it('should throw error when vendor not eligible for verification', async () => {
      const ineligibleVendor = addVendorEntityMethods({
        ...mockVendor,
        verificationStatus: SyrianVendorVerificationStatus.DRAFT,
        isEligibleForVerification: jest.fn().mockReturnValue(false),
      });

      vendorRepository.findOne.mockResolvedValue(ineligibleVendor);

      await expect(service.submitForVerification(1, 1)).rejects.toThrow(
        new BadRequestException(
          'Vendor does not meet verification requirements',
        ),
      );
    });

    it('should determine workflow priority based on vendor characteristics', async () => {
      const manufacturerVendor = addVendorEntityMethods({
        ...mockVendor,
        vendorCategory: SyrianVendorCategory.MANUFACTURER,
        verificationStatus: SyrianVendorVerificationStatus.DRAFT,
      });

      vendorRepository.findOne.mockResolvedValue(manufacturerVendor);
      vendorRepository.update.mockResolvedValue({ affected: 1 } as any);

      await service.submitForVerification(1, 1);

      expect(vendorRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          workflowPriority: 'high', // Manufacturers get high priority
        }),
      );
    });
  });

  describe('🔍 Review Process', () => {
    it('should start review process successfully', async () => {
      const submittedVendor = addVendorEntityMethods({
        ...mockVendor,
        verificationStatus: SyrianVendorVerificationStatus.SUBMITTED,
      });

      vendorRepository.findOne.mockResolvedValue(submittedVendor);
      vendorRepository.update.mockResolvedValue({ affected: 1 } as any);

      const result = await service.startReview(
        1,
        2,
        'Starting comprehensive review',
      );

      expect(result.success).toBe(true);
      expect(result.fromStatus).toBe(SyrianVendorVerificationStatus.SUBMITTED);
      expect(result.toStatus).toBe(SyrianVendorVerificationStatus.UNDER_REVIEW);
      expect(result.message).toBe('Vendor review process started');
      expect(result.nextActions).toContain('Document verification in progress');

      expect(vendorRepository.update).toHaveBeenCalledWith(1, {
        verificationStatus: SyrianVendorVerificationStatus.UNDER_REVIEW,
        verificationReviewedAt: expect.any(Date),
        verifiedByUserId: 2,
        nextReviewDate: expect.any(Date),
        verificationNotes: 'Starting comprehensive review',
        escalationLevel: 0,
      });
    });

    it('should throw error when starting review from invalid status', async () => {
      const draftVendor = addVendorEntityMethods({
        ...mockVendor,
        verificationStatus: SyrianVendorVerificationStatus.DRAFT,
      });

      vendorRepository.findOne.mockResolvedValue(draftVendor);

      await expect(service.startReview(1, 2)).rejects.toThrow(
        new BadRequestException('Cannot start review from status: draft'),
      );
    });

    it('should reset escalation level when review starts', async () => {
      const escalatedVendor = addVendorEntityMethods({
        ...mockVendor,
        verificationStatus: SyrianVendorVerificationStatus.SUBMITTED,
        escalationLevel: 2,
      });

      vendorRepository.findOne.mockResolvedValue(escalatedVendor);
      vendorRepository.update.mockResolvedValue({ affected: 1 } as any);

      await service.startReview(1, 2);

      expect(vendorRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          escalationLevel: 0,
        }),
      );
    });
  });

  describe('✅ Vendor Approval', () => {
    it('should approve vendor successfully from under review', async () => {
      const reviewVendor = addVendorEntityMethods({
        ...mockVendor,
        verificationStatus: SyrianVendorVerificationStatus.UNDER_REVIEW,
      });

      vendorRepository.findOne.mockResolvedValue(reviewVendor);
      vendorRepository.update.mockResolvedValue({ affected: 1 } as any);

      const result = await service.approveVendor(
        1,
        2,
        'All documents verified',
      );

      expect(result.success).toBe(true);
      expect(result.fromStatus).toBe(
        SyrianVendorVerificationStatus.UNDER_REVIEW,
      );
      expect(result.toStatus).toBe(SyrianVendorVerificationStatus.VERIFIED);
      expect(result.message).toContain('Vendor approved successfully');
      expect(result.nextActions).toContain('Vendor can now list products');
      expect(result.nextActions).toContain('Annual verification reminder set');

      expect(vendorRepository.update).toHaveBeenCalledWith(1, {
        verificationStatus: SyrianVendorVerificationStatus.VERIFIED,
        verificationCompletedAt: expect.any(Date),
        verificationExpiresAt: expect.any(Date),
        verifiedByUserId: 2,
        verificationNotes: 'All documents verified',
        isActive: true,
        qualityScore: expect.any(Number),
        nextReviewDate: null,
        escalationLevel: 0,
      });
    });

    it('should approve vendor from requires clarification status', async () => {
      const clarificationVendor = addVendorEntityMethods({
        ...mockVendor,
        verificationStatus:
          SyrianVendorVerificationStatus.REQUIRES_CLARIFICATION,
      });

      vendorRepository.findOne.mockResolvedValue(clarificationVendor);
      vendorRepository.update.mockResolvedValue({ affected: 1 } as any);

      const result = await service.approveVendor(1, 2);

      expect(result.success).toBe(true);
      expect(result.toStatus).toBe(SyrianVendorVerificationStatus.VERIFIED);
    });

    it('should throw error when approving from invalid status', async () => {
      const draftVendor = addVendorEntityMethods({
        ...mockVendor,
        verificationStatus: SyrianVendorVerificationStatus.DRAFT,
      });

      vendorRepository.findOne.mockResolvedValue(draftVendor);

      await expect(service.approveVendor(1, 2)).rejects.toThrow(
        new BadRequestException('Cannot approve vendor from status: draft'),
      );
    });

    it('should calculate initial quality score on approval', async () => {
      const highQualityVendor = addVendorEntityMethods({
        ...mockVendor,
        verificationStatus: SyrianVendorVerificationStatus.UNDER_REVIEW,
        businessType: SyrianBusinessType.JOINT_STOCK,
        governorateId: 1, // Damascus
        requiredDocumentsCompleted: true,
        websiteUrl: 'https://example.com',
        socialMediaLinks: { facebook: 'fb.com/store' },
      });

      vendorRepository.findOne.mockResolvedValue(highQualityVendor);
      vendorRepository.update.mockResolvedValue({ affected: 1 } as any);

      const result = await service.approveVendor(1, 2);

      expect(result.message).toMatch(/quality score: \d+%/);
      expect(vendorRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          qualityScore: expect.any(Number),
        }),
      );
    });
  });

  describe('❌ Vendor Rejection', () => {
    it('should reject vendor successfully', async () => {
      const reviewVendor = addVendorEntityMethods({
        ...mockVendor,
        verificationStatus: SyrianVendorVerificationStatus.UNDER_REVIEW,
      });

      vendorRepository.findOne.mockResolvedValue(reviewVendor);
      vendorRepository.update.mockResolvedValue({ affected: 1 } as any);

      const result = await service.rejectVendor(
        1,
        'Incomplete documentation',
        2,
      );

      expect(result.success).toBe(true);
      expect(result.fromStatus).toBe(
        SyrianVendorVerificationStatus.UNDER_REVIEW,
      );
      expect(result.toStatus).toBe(SyrianVendorVerificationStatus.REJECTED);
      expect(result.message).toBe('Vendor rejected');
      expect(result.nextActions).toContain(
        'Vendor has been notified of rejection',
      );
      expect(result.nextActions).toContain(
        'Vendor can address issues and resubmit',
      );

      expect(vendorRepository.update).toHaveBeenCalledWith(1, {
        verificationStatus: SyrianVendorVerificationStatus.REJECTED,
        verificationReviewedAt: expect.any(Date),
        verifiedByUserId: 2,
        verificationNotes: 'Incomplete documentation',
        isActive: false,
        nextReviewDate: null,
        escalationLevel: 0,
      });
    });

    it('should throw error when rejecting from invalid status', async () => {
      const draftVendor = addVendorEntityMethods({
        ...mockVendor,
        verificationStatus: SyrianVendorVerificationStatus.DRAFT,
      });

      vendorRepository.findOne.mockResolvedValue(draftVendor);

      await expect(
        service.rejectVendor(1, 'Invalid status', 2),
      ).rejects.toThrow(
        new BadRequestException('Cannot reject vendor from status: draft'),
      );
    });
  });

  describe('📝 Clarification Requests', () => {
    it('should request clarification successfully', async () => {
      const reviewVendor = addVendorEntityMethods({
        ...mockVendor,
        verificationStatus: SyrianVendorVerificationStatus.UNDER_REVIEW,
      });

      vendorRepository.findOne.mockResolvedValue(reviewVendor);
      vendorRepository.update.mockResolvedValue({ affected: 1 } as any);

      const clarificationRequest = 'Please provide updated commercial register';
      const result = await service.requestClarification(
        1,
        clarificationRequest,
        2,
      );

      expect(result.success).toBe(true);
      expect(result.fromStatus).toBe(
        SyrianVendorVerificationStatus.UNDER_REVIEW,
      );
      expect(result.toStatus).toBe(
        SyrianVendorVerificationStatus.REQUIRES_CLARIFICATION,
      );
      expect(result.message).toBe('Clarification requested from vendor');
      expect(result.nextActions).toContain('Vendor has 48 hours to respond');
      expect(result.slaDeadline).toBeInstanceOf(Date);

      expect(vendorRepository.update).toHaveBeenCalledWith(1, {
        verificationStatus:
          SyrianVendorVerificationStatus.REQUIRES_CLARIFICATION,
        verificationReviewedAt: expect.any(Date),
        verifiedByUserId: 2,
        verificationNotes: clarificationRequest,
        nextReviewDate: expect.any(Date),
      });
    });

    it('should throw error when requesting clarification from invalid status', async () => {
      const submittedVendor = addVendorEntityMethods({
        ...mockVendor,
        verificationStatus: SyrianVendorVerificationStatus.SUBMITTED,
      });

      vendorRepository.findOne.mockResolvedValue(submittedVendor);

      await expect(service.requestClarification(1, 'Test', 2)).rejects.toThrow(
        new BadRequestException(
          'Cannot request clarification from status: submitted',
        ),
      );
    });
  });

  describe('⚠️ Vendor Suspension', () => {
    it('should suspend vendor temporarily', async () => {
      const verifiedVendor = addVendorEntityMethods({
        ...mockVendor,
        verificationStatus: SyrianVendorVerificationStatus.VERIFIED,
        escalationLevel: 1,
      });

      vendorRepository.findOne.mockResolvedValue(verifiedVendor);
      vendorRepository.update.mockResolvedValue({ affected: 1 } as any);

      const result = await service.suspendVendor(1, 'Quality issues', 2, 7);

      expect(result.success).toBe(true);
      expect(result.toStatus).toBe(SyrianVendorVerificationStatus.SUSPENDED);
      expect(result.message).toBe('Vendor suspended for 7 days');
      // Check that one of the nextActions contains the review schedule text
      expect(result.nextActions.some((action: string) => action.includes('Automatic review scheduled for'))).toBe(true);

      expect(vendorRepository.update).toHaveBeenCalledWith(1, {
        verificationStatus: SyrianVendorVerificationStatus.SUSPENDED,
        verificationReviewedAt: expect.any(Date),
        verifiedByUserId: 2,
        verificationNotes: 'Quality issues',
        isActive: false,
        nextReviewDate: expect.any(Date),
        escalationLevel: 2, // Incremented from 1
      });
    });

    it('should suspend vendor indefinitely', async () => {
      const verifiedVendor = addVendorEntityMethods({
        ...mockVendor,
        verificationStatus: SyrianVendorVerificationStatus.VERIFIED,
        escalationLevel: 0,
      });

      vendorRepository.findOne.mockResolvedValue(verifiedVendor);
      vendorRepository.update.mockResolvedValue({ affected: 1 } as any);

      const result = await service.suspendVendor(1, 'Severe violations', 2);

      expect(result.message).toBe('Vendor suspended indefinitely');
      expect(result.nextActions).toContain(
        'Manual review required for reactivation',
      );

      expect(vendorRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          nextReviewDate: null,
        }),
      );
    });

    it('should throw error when suspending already suspended vendor', async () => {
      const suspendedVendor = addVendorEntityMethods({
        ...mockVendor,
        verificationStatus: SyrianVendorVerificationStatus.SUSPENDED,
      });

      vendorRepository.findOne.mockResolvedValue(suspendedVendor);

      await expect(service.suspendVendor(1, 'Test', 2)).rejects.toThrow(
        new ConflictException('Vendor is already suspended'),
      );
    });
  });

  describe('📊 Performance Metrics', () => {
    it('should update vendor performance metrics successfully', async () => {
      const performanceVendor = addVendorEntityMethods({
        ...mockVendor,
        totalOrders: 200,
        totalRevenueSyp: 50000000, // 50 million SYP
        customerSatisfactionRating: 4.5,
        responseTimeHours: 2,
        fulfillmentRate: 98.5,
        returnRate: 1.5,
      });

      vendorRepository.findOne.mockResolvedValue(performanceVendor);
      vendorRepository.update.mockResolvedValue({ affected: 1 } as any);

      const result = await service.updateVendorPerformanceMetrics(1);

      expect(result.vendorId).toBe(1);
      expect(result.totalOrders).toBe(200);
      expect(result.totalRevenueSyp).toBe(50000000);
      expect(result.customerSatisfactionRating).toBe(4.5);
      expect(result.performanceGrade).toMatch(/^[A-F][+]?$/);
      expect(result.improvementAreas).toBeInstanceOf(Array);
      expect(result.recommendations).toBeInstanceOf(Array);
      expect(result.qualityScore).toBeGreaterThan(0);

      expect(vendorRepository.update).toHaveBeenCalledWith(1, {
        qualityScore: expect.any(Number),
        lastPerformanceReviewAt: expect.any(Date),
      });
    });

    it('should provide improvement recommendations for poor performance', async () => {
      const poorPerformanceVendor = addVendorEntityMethods({
        ...mockVendor,
        customerSatisfactionRating: 3.5, // Low satisfaction
        fulfillmentRate: 80, // Low fulfillment
        returnRate: 8, // High return rate
        responseTimeHours: 18, // Slow response
      });

      vendorRepository.findOne.mockResolvedValue(poorPerformanceVendor);
      vendorRepository.update.mockResolvedValue({ affected: 1 } as any);

      const result = await service.updateVendorPerformanceMetrics(1);

      expect(result.improvementAreas).toContain('Customer Satisfaction');
      expect(result.improvementAreas).toContain('Order Fulfillment');
      expect(result.improvementAreas).toContain('Product Quality');
      expect(result.improvementAreas).toContain('Response Time');

      expect(result.recommendations).toContain(
        'Focus on product quality and customer service improvement',
      );
      expect(result.recommendations).toContain(
        'Optimize inventory management and order processing',
      );
      expect(result.recommendations).toContain(
        'Review product descriptions and quality control processes',
      );
      expect(result.recommendations).toContain(
        'Implement automated responses and customer service training',
      );
    });

    it('should calculate performance grades correctly', async () => {
      const excellentVendor = addVendorEntityMethods({
        ...mockVendor,
        customerSatisfactionRating: 4.8,
        fulfillmentRate: 99,
        returnRate: 0.5,
        responseTimeHours: 1,
        totalOrders: 1000,
      });

      vendorRepository.findOne.mockResolvedValue(excellentVendor);
      vendorRepository.update.mockResolvedValue({ affected: 1 } as any);

      const result = await service.updateVendorPerformanceMetrics(1);

      expect(['A+', 'A']).toContain(result.performanceGrade);
    });

    it('should get vendors requiring performance review', async () => {
      const vendorsNeedingReview = [
        addVendorEntityMethods({ ...mockVendor, id: 1, lastPerformanceReviewAt: null }),
        addVendorEntityMethods({
          ...mockVendor,
          id: 2,
          lastPerformanceReviewAt: new Date(
            Date.now() - 35 * 24 * 60 * 60 * 1000,
          ),
        }),
      ];

      vendorRepository.find.mockResolvedValue(vendorsNeedingReview);

      const result = await service.getVendorsRequiringPerformanceReview();

      expect(result).toEqual(vendorsNeedingReview);
      expect(vendorRepository.find).toHaveBeenCalledWith({
        where: [
          {
            lastPerformanceReviewAt: null,
            verificationStatus: SyrianVendorVerificationStatus.VERIFIED,
          },
          { lastPerformanceReviewAt: expect.any(Object) },
        ],
        relations: ['governorate'],
        order: { lastPerformanceReviewAt: 'ASC' },
      });
    });
  });

  describe('⏰ SLA Monitoring', () => {
    it('should monitor SLA compliance across vendors', async () => {
      const now = new Date();
      const pastDeadline = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
      const upcomingDeadline = new Date(
        now.getTime() + 1 * 24 * 60 * 60 * 1000,
      ); // 1 day from now

      const vendorsInWorkflow = [
        addVendorEntityMethods({
          ...mockVendor,
          id: 1,
          verificationStatus: SyrianVendorVerificationStatus.UNDER_REVIEW,
          nextReviewDate: pastDeadline,
          workflowPriority: 'high',
        }),
        addVendorEntityMethods({
          ...mockVendor,
          id: 2,
          verificationStatus: SyrianVendorVerificationStatus.SUBMITTED,
          nextReviewDate: upcomingDeadline,
          workflowPriority: 'normal',
        }),
      ];

      const completedVendors = [
        addVendorEntityMethods({
          ...mockVendor,
          id: 3,
          verificationStatus: SyrianVendorVerificationStatus.VERIFIED,
          verificationSubmittedAt: new Date(
            now.getTime() - 5 * 24 * 60 * 60 * 1000,
          ),
          verificationCompletedAt: new Date(
            now.getTime() - 3 * 24 * 60 * 60 * 1000,
          ),
        }),
      ];

      vendorRepository.find
        .mockResolvedValueOnce(vendorsInWorkflow)
        .mockResolvedValue(completedVendors);

      const result = await service.monitorSlaCompliance();

      expect(result.totalVendors).toBe(2);
      expect(result.breachingDeadlines).toHaveLength(1);
      expect(result.upcomingDeadlines).toHaveLength(1);

      expect(result.breachingDeadlines[0]).toEqual({
        vendorId: 1,
        storeNameEn: mockVendor.storeNameEn,
        storeNameAr: mockVendor.storeNameAr,
        currentStatus: SyrianVendorVerificationStatus.UNDER_REVIEW,
        daysPastDeadline: 2,
        priority: 'high',
        recommendedAction: 'Follow up with assigned reviewer',
      });

      expect(result.upcomingDeadlines[0]).toEqual({
        vendorId: 2,
        storeNameEn: mockVendor.storeNameEn,
        storeNameAr: mockVendor.storeNameAr,
        currentStatus: SyrianVendorVerificationStatus.SUBMITTED,
        daysUntilDeadline: 1,
        priority: 'normal',
      });

      expect(result.averageProcessingTime).toBe(2.0); // 2 days processing time
      expect(result.slaComplianceRate).toBe(50.0); // 1 compliant out of 2
    });

    it('should provide appropriate recommended actions for breached SLAs', async () => {
      const now = new Date();

      const testCases = [
        {
          status: SyrianVendorVerificationStatus.SUBMITTED,
          daysPast: 5,
          expectedAction: 'Escalate to senior reviewer',
        },
        {
          status: SyrianVendorVerificationStatus.UNDER_REVIEW,
          daysPast: 7,
          expectedAction: 'Request manager intervention',
        },
        {
          status: SyrianVendorVerificationStatus.PENDING_DOCUMENTS,
          daysPast: 10,
          expectedAction: 'Send final reminder or reject',
        },
        {
          status: SyrianVendorVerificationStatus.REQUIRES_CLARIFICATION,
          daysPast: 3,
          expectedAction: 'Contact vendor directly',
        },
      ];

      for (const testCase of testCases) {
        const pastDeadline = new Date(
          now.getTime() - testCase.daysPast * 24 * 60 * 60 * 1000,
        );
        const vendorsInWorkflow = [
          addVendorEntityMethods({
            ...mockVendor,
            verificationStatus: testCase.status,
            nextReviewDate: pastDeadline,
            workflowPriority: 'normal',
          }),
        ];

        vendorRepository.find
          .mockResolvedValueOnce(vendorsInWorkflow)
          .mockResolvedValue([]);

        const result = await service.monitorSlaCompliance();

        expect(result.breachingDeadlines[0].recommendedAction).toBe(
          testCase.expectedAction,
        );
      }
    });

    it('should handle empty workflow correctly', async () => {
      vendorRepository.find.mockResolvedValue([]);

      const result = await service.monitorSlaCompliance();

      expect(result.totalVendors).toBe(0);
      expect(result.breachingDeadlines).toHaveLength(0);
      expect(result.upcomingDeadlines).toHaveLength(0);
      expect(result.averageProcessingTime).toBe(0);
      expect(result.slaComplianceRate).toBe(100);
    });
  });

  describe('📈 Analytics and Reporting', () => {
    it('should generate comprehensive vendor analytics', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const analyticsVendors = [
        addVendorEntityMethods({
          ...mockVendor,
          verificationStatus: SyrianVendorVerificationStatus.VERIFIED,
          businessType: SyrianBusinessType.LIMITED_LIABILITY,
          vendorCategory: SyrianVendorCategory.RETAILER,
          totalRevenueSyp: 25000000,
          qualityScore: 85,
        }),
        addVendorEntityMethods({
          ...mockVendor,
          id: 2,
          verificationStatus: SyrianVendorVerificationStatus.SUBMITTED,
          businessType: SyrianBusinessType.SOLE_PROPRIETORSHIP,
          vendorCategory: SyrianVendorCategory.MANUFACTURER,
          totalRevenueSyp: 10000000,
          qualityScore: 75,
          governorate: { ...mockGovernorate, nameEn: 'Aleppo', nameAr: 'حلب' },
        }),
      ];

      vendorRepository.find.mockResolvedValue(analyticsVendors);

      const result = await service.getVendorAnalytics(startDate, endDate);

      expect(result.totalVendors).toBe(2);
      expect(result.verificationStats).toEqual({
        [SyrianVendorVerificationStatus.VERIFIED]: 1,
        [SyrianVendorVerificationStatus.SUBMITTED]: 1,
      });
      expect(result.businessTypeDistribution).toEqual({
        [SyrianBusinessType.LIMITED_LIABILITY]: 1,
        [SyrianBusinessType.SOLE_PROPRIETORSHIP]: 1,
      });
      expect(result.vendorCategoryDistribution).toEqual({
        [SyrianVendorCategory.RETAILER]: 1,
        [SyrianVendorCategory.MANUFACTURER]: 1,
      });
      expect(result.governorateDistribution).toEqual({
        Damascus: 1,
        Aleppo: 1,
      });
      expect(result.averageQualityScore).toBe(80.0);
      expect(result.totalRevenueSyp).toBe(35000000);
      // Service calculates performance grades as B+ (85) and C+ (75)
      expect(result.performanceGrades).toHaveProperty('B+');
      expect(result.performanceGrades).toHaveProperty('C+');
    });

    it('should handle empty analytics data gracefully', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      vendorRepository.find.mockResolvedValue([]);

      const result = await service.getVendorAnalytics(startDate, endDate);

      expect(result.totalVendors).toBe(0);
      expect(result.verificationStats).toEqual({});
      expect(result.businessTypeDistribution).toEqual({});
      expect(result.vendorCategoryDistribution).toEqual({});
      expect(result.governorateDistribution).toEqual({});
      expect(result.averageQualityScore).toBe(0);
      expect(result.totalRevenueSyp).toBe(0);
      expect(result.performanceGrades).toEqual({});
    });
  });

  describe('🌍 Syrian Market Features', () => {
    it('should calculate quality scores with Syrian business factors', async () => {
      const syrianVendor = addVendorEntityMethods({
        ...mockVendor,
        verificationStatus: SyrianVendorVerificationStatus.UNDER_REVIEW, // Required for approval
        businessType: SyrianBusinessType.JOINT_STOCK,
        governorateId: 1, // Damascus
        requiredDocumentsCompleted: true,
        websiteUrl: 'https://damascus-store.sy',
        socialMediaLinks: { facebook: 'fb.com/store', instagram: '@store' },
      });

      vendorRepository.findOne.mockResolvedValue(syrianVendor);
      vendorRepository.update.mockResolvedValue({ affected: 1 } as any);

      const result = await service.approveVendor(1, 2);

      // Quality score should benefit from:
      // - Joint stock company bonus (+8)
      // - Damascus location bonus (+3)
      // - Complete documents bonus (+10)
      // - Website and social media bonus (+4)
      expect(vendorRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          qualityScore: expect.any(Number),
        }),
      );

      // The quality score should be relatively high due to Syrian business factors
      const updateCall = vendorRepository.update.mock.calls.find(
        (call) => call[0] === 1,
      );
      const qualityScore = updateCall[1].qualityScore;
      expect(qualityScore).toBeGreaterThan(80);
    });

    it('should handle Arabic vendor names in SLA monitoring', async () => {
      const arabicVendor = addVendorEntityMethods({
        ...mockVendor,
        storeNameEn: 'Damascus Traditional Crafts',
        storeNameAr: 'الحرف التقليدية الدمشقية',
        verificationStatus: SyrianVendorVerificationStatus.UNDER_REVIEW,
        nextReviewDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day overdue
      });

      vendorRepository.find
        .mockResolvedValueOnce([arabicVendor])
        .mockResolvedValue([]);

      const result = await service.monitorSlaCompliance();

      expect(result.breachingDeadlines[0].storeNameEn).toBe(
        'Damascus Traditional Crafts',
      );
      expect(result.breachingDeadlines[0].storeNameAr).toBe(
        'الحرف التقليدية الدمشقية',
      );
    });

    it('should prioritize manufacturers for workflow priority', async () => {
      const manufacturerVendor = addVendorEntityMethods({
        ...mockVendor,
        vendorCategory: SyrianVendorCategory.MANUFACTURER,
        verificationStatus: SyrianVendorVerificationStatus.DRAFT,
      });

      vendorRepository.findOne.mockResolvedValue(manufacturerVendor);
      vendorRepository.update.mockResolvedValue({ affected: 1 } as any);

      await service.submitForVerification(1, 1);

      expect(vendorRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          workflowPriority: 'high',
        }),
      );
    });

    it('should handle large SYP revenue amounts in performance metrics', async () => {
      const highRevenueVendor = addVendorEntityMethods({
        ...mockVendor,
        totalRevenueSyp: 500000000000, // 500 billion SYP
        totalOrders: 50000,
        customerSatisfactionRating: 4.5,
        fulfillmentRate: 98,
        returnRate: 1,
        responseTimeHours: 2,
      });

      vendorRepository.findOne.mockResolvedValue(highRevenueVendor);
      vendorRepository.update.mockResolvedValue({ affected: 1 } as any);

      const result = await service.updateVendorPerformanceMetrics(1);

      expect(result.totalRevenueSyp).toBe(500000000000);
      expect(typeof result.totalRevenueSyp).toBe('number');
      expect(result.qualityScore).toBeGreaterThan(80); // High revenue should contribute to quality
    });
  });

  describe('🔧 Error Handling', () => {
    it('should throw NotFoundException when vendor not found', async () => {
      vendorRepository.findOne.mockResolvedValue(null);

      await expect(service.submitForVerification(999, 1)).rejects.toThrow(
        new NotFoundException('Vendor with ID 999 not found'),
      );
    });

    it('should handle database errors gracefully', async () => {
      vendorRepository.findOne.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(service.submitForVerification(1, 1)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should handle update failures in workflow transitions', async () => {
      vendorRepository.findOne.mockResolvedValue(mockVendor);
      vendorRepository.update.mockRejectedValue(new Error('Update failed'));

      await expect(service.submitForVerification(1, 1)).rejects.toThrow(
        'Update failed',
      );
    });

    it('should handle analytics query failures', async () => {
      vendorRepository.find.mockRejectedValue(
        new Error('Analytics query failed'),
      );

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      await expect(
        service.getVendorAnalytics(startDate, endDate),
      ).rejects.toThrow('Analytics query failed');
    });
  });
});
