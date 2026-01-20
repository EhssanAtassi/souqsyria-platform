/**
 * @file vendor-workflow.e2e-spec.ts
 * @description Syrian Vendor Workflow and Business Verification E2E Tests
 *
 * Tests enterprise vendor workflow functionality including:
 * - Complete 9-state verification workflow with SLA monitoring
 * - Syrian business compliance and regulatory checks
 * - Performance metrics and quality scoring system
 * - Automated escalation and workflow management
 * - Arabic/English bilingual workflow support
 * - Enterprise analytics and reporting
 *
 * @author SouqSyria Development Team
 * @since 2025-08-17
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';

import { AppModule } from '../../src/app.module';
import { SyrianVendorEntity } from '../../src/vendors/entities/syrian-vendor.entity';
import { User } from '../../src/users/entities/user.entity';
import { SyrianGovernorateEntity } from '../../src/addresses/entities/syrian-governorate.entity';
import {
  SyrianVendorVerificationStatus,
  SyrianBusinessType,
  SyrianVendorCategory,
} from '../../src/vendors/entities/syrian-vendor.entity';

describe('Syrian Vendor Workflow & Business Verification (E2E)', () => {
  let app: INestApplication;
  let vendorToken: string;
  let reviewerToken: string;
  let adminToken: string;
  let managerToken: string;
  let testVendor: any;
  let testVendor2: any;
  let testVendor3: any;
  let damascusGovernorate: any;
  let aleppoGovernorate: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [SyrianVendorEntity, User, SyrianGovernorateEntity],
          synchronize: true,
          logging: false,
        }),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Create test data
    await createTestData();
  });

  afterAll(async () => {
    await app.close();
  });

  /**
   * Creates comprehensive test data for workflow testing
   */
  async function createTestData() {
    // Create test users with different roles
    const vendorUserResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'workflow.vendor@souqsyria.com',
        password: 'WorkflowPassword123!',
        full_name: 'أحمد التاجر للاختبار',
        phone: '+963987111111',
      });
    vendorToken = vendorUserResponse.body.access_token;

    const reviewerUserResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'workflow.reviewer@souqsyria.com',
        password: 'ReviewerPassword123!',
        full_name: 'مراجع سير العمل',
        phone: '+963987222222',
        role: 'reviewer',
      });
    reviewerToken = reviewerUserResponse.body.access_token;

    const adminUserResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'workflow.admin@souqsyria.com',
        password: 'AdminPassword123!',
        full_name: 'مدير سير العمل',
        phone: '+963987333333',
        role: 'admin',
      });
    adminToken = adminUserResponse.body.access_token;

    const managerUserResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'workflow.manager@souqsyria.com',
        password: 'ManagerPassword123!',
        full_name: 'مدير العمليات',
        phone: '+963987444444',
        role: 'manager',
      });
    managerToken = managerUserResponse.body.access_token;

    // Create governorates
    const damascusResponse = await request(app.getHttpServer())
      .post('/admin/governorates')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nameEn: 'Damascus',
        nameAr: 'دمشق',
        code: 'DM',
        isActive: true,
      });
    damascusGovernorate = damascusResponse.body;

    const aleppoResponse = await request(app.getHttpServer())
      .post('/admin/governorates')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nameEn: 'Aleppo',
        nameAr: 'حلب',
        code: 'AL',
        isActive: true,
      });
    aleppoGovernorate = aleppoResponse.body;

    // Create test vendors for workflow testing
    const vendor1Response = await request(app.getHttpServer())
      .post('/syrian-vendors')
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({
        userId: vendorUserResponse.body.user.id,
        storeNameEn: 'Damascus Technology Hub',
        storeNameAr: 'مركز تقنية دمشق',
        storeDescriptionEn:
          'Advanced technology solutions for Syrian businesses',
        storeDescriptionAr: 'حلول تقنية متقدمة للأعمال السورية',
        governorateId: damascusGovernorate.id,
        businessType: SyrianBusinessType.LIMITED_LIABILITY,
        vendorCategory: SyrianVendorCategory.MANUFACTURER,
        contactPhone: '+963987111111',
        contactEmail: 'damascus.tech@souqsyria.com',
        address: 'منطقة التقنية، دمشق، سوريا',
        commercialRegisterNumber: 'CR-DM-TECH-2024-001',
        taxIdNumber: 'TAX-TECH-123456789',
        industrialLicenseNumber: 'IL-TECH-2024-001',
        websiteUrl: 'https://damascus-tech.sy',
        socialMediaLinks: {
          facebook: 'https://facebook.com/damascus.tech',
          linkedin: 'https://linkedin.com/company/damascus-tech',
        },
      });
    testVendor = vendor1Response.body;

    // Create additional vendors for bulk testing
    const vendor2UserResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'vendor2@souqsyria.com',
        password: 'Password123!',
        full_name: 'فاطمة التاجرة',
        phone: '+963987555555',
      });

    const vendor2Response = await request(app.getHttpServer())
      .post('/syrian-vendors')
      .set('Authorization', `Bearer ${vendor2UserResponse.body.access_token}`)
      .send({
        userId: vendor2UserResponse.body.user.id,
        storeNameEn: 'Aleppo Traditional Crafts',
        storeNameAr: 'الحرف التقليدية الحلبية',
        governorateId: aleppoGovernorate.id,
        businessType: SyrianBusinessType.SOLE_PROPRIETORSHIP,
        vendorCategory: SyrianVendorCategory.CRAFTSMAN,
        contactPhone: '+963987555555',
        contactEmail: 'aleppo.crafts@souqsyria.com',
        address: 'سوق المدينة، حلب، سوريا',
      });
    testVendor2 = vendor2Response.body;

    const vendor3UserResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'vendor3@souqsyria.com',
        password: 'Password123!',
        full_name: 'عمر التاجر',
        phone: '+963987666666',
      });

    const vendor3Response = await request(app.getHttpServer())
      .post('/syrian-vendors')
      .set('Authorization', `Bearer ${vendor3UserResponse.body.access_token}`)
      .send({
        userId: vendor3UserResponse.body.user.id,
        storeNameEn: 'Homs Food Products',
        storeNameAr: 'منتجات حمص الغذائية',
        governorateId: damascusGovernorate.id, // Using Damascus for variety
        businessType: SyrianBusinessType.LIMITED_LIABILITY,
        vendorCategory: SyrianVendorCategory.WHOLESALER,
        contactPhone: '+963987666666',
        contactEmail: 'homs.food@souqsyria.com',
        address: 'المنطقة الصناعية، حمص، سوريا',
      });
    testVendor3 = vendor3Response.body;
  }

  describe('📋 Complete Workflow: Draft → Verified', () => {
    it('should complete full verification workflow for manufacturer vendor', async () => {
      // Step 1: Submit for verification (Draft → Submitted)
      const submitResponse = await request(app.getHttpServer())
        .post(`/workflow/vendors/${testVendor.id}/submit`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .expect(200);

      expect(submitResponse.body).toEqual(
        expect.objectContaining({
          success: true,
          fromStatus: SyrianVendorVerificationStatus.DRAFT,
          toStatus: SyrianVendorVerificationStatus.SUBMITTED,
          message: 'Vendor submitted for verification successfully',
          nextActions: expect.arrayContaining([
            'Admin review will begin within 24 hours',
            'Document verification will be performed',
            'Business compliance checks will be conducted',
          ]),
          slaDeadline: expect.any(String),
        }),
      );

      // Verify vendor status changed
      const vendorCheck1 = await request(app.getHttpServer())
        .get(`/syrian-vendors/${testVendor.id}`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .expect(200);

      expect(vendorCheck1.body.verificationStatus).toBe(
        SyrianVendorVerificationStatus.SUBMITTED,
      );
      expect(new Date(vendorCheck1.body.nextReviewDate)).toBeInstanceOf(Date);
      expect(vendorCheck1.body.workflowPriority).toBe('high'); // Manufacturers get high priority

      // Step 2: Start review process (Submitted → Under Review)
      const reviewResponse = await request(app.getHttpServer())
        .post(`/workflow/vendors/${testVendor.id}/start-review`)
        .set('Authorization', `Bearer ${reviewerToken}`)
        .send({
          notes:
            'Starting comprehensive review of technology manufacturer. Checking all Syrian business compliance requirements.',
        })
        .expect(200);

      expect(reviewResponse.body).toEqual(
        expect.objectContaining({
          success: true,
          fromStatus: SyrianVendorVerificationStatus.SUBMITTED,
          toStatus: SyrianVendorVerificationStatus.UNDER_REVIEW,
          message: 'Vendor review process started',
          slaDeadline: expect.any(String),
        }),
      );

      // Step 3: Request clarification (Under Review → Requires Clarification)
      const clarificationResponse = await request(app.getHttpServer())
        .post(`/workflow/vendors/${testVendor.id}/request-clarification`)
        .set('Authorization', `Bearer ${reviewerToken}`)
        .send({
          clarificationRequest:
            'Please provide updated industrial license and quality certification documents. الرجاء تقديم الترخيص الصناعي المحدث وشهادات الجودة.',
        })
        .expect(200);

      expect(clarificationResponse.body).toEqual(
        expect.objectContaining({
          success: true,
          fromStatus: SyrianVendorVerificationStatus.UNDER_REVIEW,
          toStatus: SyrianVendorVerificationStatus.REQUIRES_CLARIFICATION,
          message: 'Clarification requested from vendor',
          nextActions: expect.arrayContaining([
            'Vendor has 48 hours to respond',
          ]),
        }),
      );

      // Step 4: Approve vendor (Requires Clarification → Verified)
      const approvalResponse = await request(app.getHttpServer())
        .post(`/workflow/vendors/${testVendor.id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          notes:
            'All documentation verified. Industrial license confirmed. Syrian business compliance requirements met. Quality standards approved.',
        })
        .expect(200);

      expect(approvalResponse.body).toEqual(
        expect.objectContaining({
          success: true,
          fromStatus: SyrianVendorVerificationStatus.REQUIRES_CLARIFICATION,
          toStatus: SyrianVendorVerificationStatus.VERIFIED,
          transitionedAt: expect.any(String),
          message: expect.stringContaining('Vendor approved successfully'),
          nextActions: expect.arrayContaining([
            'Vendor can now list products',
            'Commission rates have been applied',
            'Performance monitoring has started',
            'Annual verification reminder set',
          ]),
        }),
      );

      // Final verification
      const finalVendorCheck = await request(app.getHttpServer())
        .get(`/syrian-vendors/${testVendor.id}`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .expect(200);

      expect(finalVendorCheck.body).toEqual(
        expect.objectContaining({
          verificationStatus: SyrianVendorVerificationStatus.VERIFIED,
          isActive: true,
          qualityScore: expect.any(Number),
          verificationCompletedAt: expect.any(String),
          verificationExpiresAt: expect.any(String), // 1 year validity
        }),
      );

      expect(finalVendorCheck.body.qualityScore).toBeGreaterThan(70);
    });

    it('should handle rejection workflow with proper messaging', async () => {
      // Submit second vendor
      await request(app.getHttpServer())
        .post(`/workflow/vendors/${testVendor2.id}/submit`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Start review
      await request(app.getHttpServer())
        .post(`/workflow/vendors/${testVendor2.id}/start-review`)
        .set('Authorization', `Bearer ${reviewerToken}`)
        .expect(200);

      // Reject vendor
      const rejectionResponse = await request(app.getHttpServer())
        .post(`/workflow/vendors/${testVendor2.id}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          rejectionReason:
            'Incomplete business documentation. Missing required commercial register and tax compliance certificates. يجب تقديم السجل التجاري الكامل وشهادات الامتثال الضريبي.',
        })
        .expect(200);

      expect(rejectionResponse.body).toEqual(
        expect.objectContaining({
          success: true,
          toStatus: SyrianVendorVerificationStatus.REJECTED,
          message: 'Vendor rejected',
          nextActions: expect.arrayContaining([
            'Vendor has been notified of rejection',
            'Vendor can address issues and resubmit',
            'All products have been deactivated',
          ]),
        }),
      );

      // Verify vendor is inactive and rejected
      const rejectedVendorCheck = await request(app.getHttpServer())
        .get(`/syrian-vendors/${testVendor2.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(rejectedVendorCheck.body.verificationStatus).toBe(
        SyrianVendorVerificationStatus.REJECTED,
      );
      expect(rejectedVendorCheck.body.isActive).toBe(false);
      expect(rejectedVendorCheck.body.verificationNotes).toContain(
        'Incomplete business documentation',
      );
    });

    it('should handle suspension workflow with duration', async () => {
      // First verify and activate the vendor
      await request(app.getHttpServer())
        .post(`/workflow/vendors/${testVendor3.id}/submit`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .post(`/workflow/vendors/${testVendor3.id}/start-review`)
        .set('Authorization', `Bearer ${reviewerToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .post(`/workflow/vendors/${testVendor3.id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Now suspend the verified vendor
      const suspensionResponse = await request(app.getHttpServer())
        .post(`/workflow/vendors/${testVendor3.id}/suspend`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          suspensionReason:
            'Multiple customer complaints regarding product quality and delivery delays. Quality score decreased significantly below acceptable standards.',
          suspensionDurationDays: 30,
        })
        .expect(200);

      expect(suspensionResponse.body).toEqual(
        expect.objectContaining({
          success: true,
          toStatus: SyrianVendorVerificationStatus.SUSPENDED,
          message: 'Vendor suspended for 30 days',
          nextActions: expect.arrayContaining([
            'All vendor products deactivated',
            'Vendor access restricted',
            expect.stringMatching(/Automatic review scheduled for/),
          ]),
        }),
      );

      // Verify suspension took effect
      const suspendedVendorCheck = await request(app.getHttpServer())
        .get(`/syrian-vendors/${testVendor3.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(suspendedVendorCheck.body.verificationStatus).toBe(
        SyrianVendorVerificationStatus.SUSPENDED,
      );
      expect(suspendedVendorCheck.body.isActive).toBe(false);
      expect(suspendedVendorCheck.body.escalationLevel).toBeGreaterThan(0);
      expect(new Date(suspendedVendorCheck.body.nextReviewDate)).toBeInstanceOf(
        Date,
      );
    });
  });

  describe('⚡ Performance Metrics and Quality Scoring', () => {
    it('should update vendor performance metrics with Syrian market factors', async () => {
      const performanceResponse = await request(app.getHttpServer())
        .post(`/workflow/vendors/${testVendor.id}/update-performance`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(performanceResponse.body).toEqual(
        expect.objectContaining({
          vendorId: testVendor.id,
          qualityScore: expect.any(Number),
          totalOrders: expect.any(Number),
          totalRevenueSyp: expect.any(Number),
          customerSatisfactionRating: expect.any(Number),
          responseTimeHours: expect.any(Number),
          fulfillmentRate: expect.any(Number),
          returnRate: expect.any(Number),
          performanceGrade: expect.stringMatching(/^[A-F][+]?$/),
          improvementAreas: expect.any(Array),
          recommendations: expect.any(Array),
        }),
      );

      // Quality score should be reasonable for a technology manufacturer
      expect(performanceResponse.body.qualityScore).toBeGreaterThanOrEqual(0);
      expect(performanceResponse.body.qualityScore).toBeLessThanOrEqual(100);

      // Should handle large SYP amounts
      expect(typeof performanceResponse.body.totalRevenueSyp).toBe('number');
    });

    it('should provide performance improvement recommendations', async () => {
      // Update performance for vendor with poor metrics (mocked)
      const performanceResponse = await request(app.getHttpServer())
        .post(`/workflow/vendors/${testVendor2.id}/update-performance`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      if (performanceResponse.body.improvementAreas.length > 0) {
        expect(performanceResponse.body.improvementAreas).toEqual(
          expect.arrayContaining([
            expect.stringMatching(
              /Customer Satisfaction|Order Fulfillment|Product Quality|Response Time/,
            ),
          ]),
        );
      }

      if (performanceResponse.body.recommendations.length > 0) {
        expect(performanceResponse.body.recommendations).toEqual(
          expect.arrayContaining([expect.stringContaining('improve')]),
        );
      }
    });

    it('should get vendors requiring performance review', async () => {
      const performanceReviewResponse = await request(app.getHttpServer())
        .get('/workflow/vendors/performance-review-required')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(performanceReviewResponse.body).toBeInstanceOf(Array);

      if (performanceReviewResponse.body.length > 0) {
        performanceReviewResponse.body.forEach((vendor: any) => {
          expect(vendor).toEqual(
            expect.objectContaining({
              id: expect.any(Number),
              storeNameEn: expect.any(String),
              storeNameAr: expect.any(String),
              verificationStatus: SyrianVendorVerificationStatus.VERIFIED,
              governorate: expect.objectContaining({
                nameEn: expect.any(String),
                nameAr: expect.any(String),
              }),
            }),
          );
        });
      }
    });
  });

  describe('📊 SLA Monitoring and Compliance', () => {
    it('should monitor comprehensive SLA compliance across all workflow states', async () => {
      const slaResponse = await request(app.getHttpServer())
        .get('/workflow/sla-monitoring')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(slaResponse.body).toEqual(
        expect.objectContaining({
          totalVendors: expect.any(Number),
          breachingDeadlines: expect.any(Array),
          upcomingDeadlines: expect.any(Array),
          averageProcessingTime: expect.any(Number),
          slaComplianceRate: expect.any(Number),
        }),
      );

      expect(slaResponse.body.slaComplianceRate).toBeGreaterThanOrEqual(0);
      expect(slaResponse.body.slaComplianceRate).toBeLessThanOrEqual(100);

      // Check breach details if any exist
      if (slaResponse.body.breachingDeadlines.length > 0) {
        slaResponse.body.breachingDeadlines.forEach((breach: any) => {
          expect(breach).toEqual(
            expect.objectContaining({
              vendorId: expect.any(Number),
              storeNameEn: expect.any(String),
              storeNameAr: expect.any(String),
              currentStatus: expect.any(String),
              daysPastDeadline: expect.any(Number),
              priority: expect.stringMatching(/^(low|normal|high|urgent)$/),
              recommendedAction: expect.any(String),
            }),
          );
        });
      }

      // Check upcoming deadlines if any exist
      if (slaResponse.body.upcomingDeadlines.length > 0) {
        slaResponse.body.upcomingDeadlines.forEach((upcoming: any) => {
          expect(upcoming).toEqual(
            expect.objectContaining({
              vendorId: expect.any(Number),
              storeNameEn: expect.any(String),
              storeNameAr: expect.any(String),
              currentStatus: expect.any(String),
              daysUntilDeadline: expect.any(Number),
              priority: expect.stringMatching(/^(low|normal|high|urgent)$/),
            }),
          );
        });
      }
    });

    it('should provide appropriate recommended actions for different SLA breaches', async () => {
      // This test checks that the system provides context-appropriate recommendations
      const slaResponse = await request(app.getHttpServer())
        .get('/workflow/sla-monitoring')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      slaResponse.body.breachingDeadlines.forEach((breach: any) => {
        // Recommended actions should be specific to the workflow state
        switch (breach.currentStatus) {
          case SyrianVendorVerificationStatus.SUBMITTED:
            expect([
              'Assign to reviewer immediately',
              'Escalate to senior reviewer',
            ]).toContain(breach.recommendedAction);
            break;
          case SyrianVendorVerificationStatus.UNDER_REVIEW:
            expect([
              'Follow up with assigned reviewer',
              'Request manager intervention',
            ]).toContain(breach.recommendedAction);
            break;
          case SyrianVendorVerificationStatus.PENDING_DOCUMENTS:
            expect([
              'Send reminder to vendor',
              'Send final reminder or reject',
            ]).toContain(breach.recommendedAction);
            break;
          case SyrianVendorVerificationStatus.REQUIRES_CLARIFICATION:
            expect([
              'Send clarification reminder',
              'Contact vendor directly',
            ]).toContain(breach.recommendedAction);
            break;
        }
      });
    });
  });

  describe('📈 Workflow Analytics and Reporting', () => {
    it('should generate comprehensive workflow analytics for date range', async () => {
      const startDate = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000,
      ).toISOString(); // 30 days ago
      const endDate = new Date().toISOString();

      const analyticsResponse = await request(app.getHttpServer())
        .get('/workflow/analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          startDate,
          endDate,
        })
        .expect(200);

      expect(analyticsResponse.body).toEqual(
        expect.objectContaining({
          totalVendors: expect.any(Number),
          verificationStats: expect.any(Object),
          businessTypeDistribution: expect.any(Object),
          vendorCategoryDistribution: expect.any(Object),
          governorateDistribution: expect.any(Object),
          averageQualityScore: expect.any(Number),
          totalRevenueSyp: expect.any(Number),
          performanceGrades: expect.any(Object),
        }),
      );

      // Verify verification status distributions include our test data
      const verificationStats = analyticsResponse.body.verificationStats;
      expect(verificationStats).toHaveProperty(
        SyrianVendorVerificationStatus.VERIFIED,
      );

      // Verify business type distributions
      const businessTypes = analyticsResponse.body.businessTypeDistribution;
      expect(businessTypes).toHaveProperty(
        SyrianBusinessType.LIMITED_LIABILITY,
      );
      expect(businessTypes).toHaveProperty(
        SyrianBusinessType.SOLE_PROPRIETORSHIP,
      );

      // Verify vendor category distributions
      const vendorCategories =
        analyticsResponse.body.vendorCategoryDistribution;
      expect(vendorCategories).toHaveProperty(
        SyrianVendorCategory.MANUFACTURER,
      );
      expect(vendorCategories).toHaveProperty(SyrianVendorCategory.CRAFTSMAN);
      expect(vendorCategories).toHaveProperty(SyrianVendorCategory.WHOLESALER);

      // Verify governorate distributions
      const governorates = analyticsResponse.body.governorateDistribution;
      expect(governorates).toHaveProperty('Damascus');
      expect(governorates).toHaveProperty('Aleppo');
    });

    it('should provide workflow processing time analytics', async () => {
      const slaResponse = await request(app.getHttpServer())
        .get('/workflow/sla-monitoring')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(slaResponse.body.averageProcessingTime).toBeGreaterThanOrEqual(0);

      // If we have completed workflows, processing time should be reasonable
      if (slaResponse.body.averageProcessingTime > 0) {
        expect(slaResponse.body.averageProcessingTime).toBeLessThan(30); // Less than 30 days average
      }
    });

    it('should track workflow performance by priority levels', async () => {
      const analyticsResponse = await request(app.getHttpServer())
        .get('/workflow/priority-analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(analyticsResponse.body).toEqual(
        expect.objectContaining({
          priorityDistribution: expect.any(Object),
          averageProcessingTimeByPriority: expect.any(Object),
          escalationStatistics: expect.any(Object),
        }),
      );

      // Should have different priority levels
      const priorities = analyticsResponse.body.priorityDistribution;
      expect(
        Object.keys(priorities).some((p) =>
          ['low', 'normal', 'high', 'urgent'].includes(p),
        ),
      ).toBe(true);
    });
  });

  describe('🌍 Syrian Business Compliance', () => {
    it('should validate Syrian business registration requirements', async () => {
      // Test workflow respects Syrian business compliance
      const vendorCheck = await request(app.getHttpServer())
        .get(`/syrian-vendors/${testVendor.id}`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .expect(200);

      // Verified vendor should have all Syrian business requirements
      expect(vendorCheck.body.verificationStatus).toBe(
        SyrianVendorVerificationStatus.VERIFIED,
      );
      expect(vendorCheck.body.commercialRegisterNumber).toMatch(/^CR-/);
      expect(vendorCheck.body.taxIdNumber).toMatch(/^TAX-/);
      expect(vendorCheck.body.industrialLicenseNumber).toMatch(/^IL-/);

      // Should have Syrian governorate
      expect(['Damascus', 'Aleppo']).toContain(
        vendorCheck.body.governorate.nameEn,
      );
      expect(vendorCheck.body.governorate.nameAr).toMatch(/[\u0600-\u06FF]/);
    });

    it('should handle Arabic workflow notes and communications', async () => {
      // Create a vendor specifically for Arabic workflow testing
      const arabicUserResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'arabic.workflow@souqsyria.com',
          password: 'ArabicPassword123!',
          full_name: 'محمد العربي للاختبار',
          phone: '+963987777777',
        });

      const arabicVendorResponse = await request(app.getHttpServer())
        .post('/syrian-vendors')
        .set('Authorization', `Bearer ${arabicUserResponse.body.access_token}`)
        .send({
          userId: arabicUserResponse.body.user.id,
          storeNameEn: 'Arabic Workflow Test Store',
          storeNameAr: 'متجر اختبار سير العمل العربي',
          storeDescriptionEn: 'Testing Arabic workflow support',
          storeDescriptionAr: 'اختبار دعم سير العمل باللغة العربية',
          governorateId: damascusGovernorate.id,
          businessType: SyrianBusinessType.SOLE_PROPRIETORSHIP,
          vendorCategory: SyrianVendorCategory.RETAILER,
          contactPhone: '+963987777777',
          contactEmail: 'arabic.test@souqsyria.com',
          address: 'شارع الاختبار، دمشق، سوريا',
        });

      const arabicVendor = arabicVendorResponse.body;

      // Test Arabic workflow progression
      await request(app.getHttpServer())
        .post(`/workflow/vendors/${arabicVendor.id}/submit`)
        .set('Authorization', `Bearer ${arabicUserResponse.body.access_token}`)
        .expect(200);

      await request(app.getHttpServer())
        .post(`/workflow/vendors/${arabicVendor.id}/start-review`)
        .set('Authorization', `Bearer ${reviewerToken}`)
        .send({
          notes:
            'بدء مراجعة شاملة للمتجر العربي. فحص جميع المتطلبات والوثائق المطلوبة للامتثال التجاري السوري.',
        })
        .expect(200);

      const clarificationResponse = await request(app.getHttpServer())
        .post(`/workflow/vendors/${arabicVendor.id}/request-clarification`)
        .set('Authorization', `Bearer ${reviewerToken}`)
        .send({
          clarificationRequest:
            'يرجى تقديم الوثائق التالية: شهادة السجل التجاري المحدثة، شهادة الامتثال الضريبي، إثبات العنوان التجاري. Please provide updated commercial register, tax compliance certificate, and business address proof.',
        })
        .expect(200);

      expect(clarificationResponse.body.success).toBe(true);

      // Verify Arabic text is preserved in workflow
      const arabicVendorCheck = await request(app.getHttpServer())
        .get(`/syrian-vendors/${arabicVendor.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(arabicVendorCheck.body.verificationNotes).toContain(
        'تقديم الوثائق',
      );
      expect(arabicVendorCheck.body.storeNameAr).toBe(
        'متجر اختبار سير العمل العربي',
      );
    });

    it('should prioritize vendors based on Syrian business factors', async () => {
      // Manufacturers should get high priority in workflow
      const manufacturerCheck = await request(app.getHttpServer())
        .get(`/syrian-vendors/${testVendor.id}`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .expect(200);

      expect(manufacturerCheck.body.vendorCategory).toBe(
        SyrianVendorCategory.MANUFACTURER,
      );
      expect(manufacturerCheck.body.workflowPriority).toBe('high');

      // Sole proprietorship craftsman should get lower priority
      const craftsmanCheck = await request(app.getHttpServer())
        .get(`/syrian-vendors/${testVendor2.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(craftsmanCheck.body.vendorCategory).toBe(
        SyrianVendorCategory.CRAFTSMAN,
      );
      expect(craftsmanCheck.body.businessType).toBe(
        SyrianBusinessType.SOLE_PROPRIETORSHIP,
      );
    });

    it('should calculate quality scores with Syrian market factors', async () => {
      const verifiedVendorCheck = await request(app.getHttpServer())
        .get(`/syrian-vendors/${testVendor.id}`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .expect(200);

      // Technology manufacturer in Damascus with complete documentation should have high quality score
      expect(verifiedVendorCheck.body.qualityScore).toBeGreaterThan(80);
      expect(verifiedVendorCheck.body.businessType).toBe(
        SyrianBusinessType.LIMITED_LIABILITY,
      );
      expect(verifiedVendorCheck.body.vendorCategory).toBe(
        SyrianVendorCategory.MANUFACTURER,
      );
      expect(verifiedVendorCheck.body.governorate.nameEn).toBe('Damascus');
      expect(verifiedVendorCheck.body.industrialLicenseNumber).toBeTruthy();
    });
  });

  describe('🔄 Workflow State Validation', () => {
    it('should enforce valid workflow state transitions', async () => {
      // Create a new vendor for state validation testing
      const stateTestUserResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'state.test@souqsyria.com',
          password: 'StatePassword123!',
          full_name: 'اختبار الحالة',
          phone: '+963987888888',
        });

      const stateTestVendorResponse = await request(app.getHttpServer())
        .post('/syrian-vendors')
        .set(
          'Authorization',
          `Bearer ${stateTestUserResponse.body.access_token}`,
        )
        .send({
          userId: stateTestUserResponse.body.user.id,
          storeNameEn: 'State Validation Test',
          storeNameAr: 'اختبار التحقق من الحالة',
          governorateId: damascusGovernorate.id,
          businessType: SyrianBusinessType.LIMITED_LIABILITY,
          vendorCategory: SyrianVendorCategory.RETAILER,
          contactPhone: '+963987888888',
          contactEmail: 'state.test@souqsyria.com',
          address: 'شارع الاختبار، دمشق، سوريا',
        });

      const stateTestVendor = stateTestVendorResponse.body;

      // Try to start review without submitting first (should fail)
      await request(app.getHttpServer())
        .post(`/workflow/vendors/${stateTestVendor.id}/start-review`)
        .set('Authorization', `Bearer ${reviewerToken}`)
        .expect(400); // Bad Request

      // Try to approve without review (should fail)
      await request(app.getHttpServer())
        .post(`/workflow/vendors/${stateTestVendor.id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400); // Bad Request

      // Try to reject from draft status (should fail)
      await request(app.getHttpServer())
        .post(`/workflow/vendors/${stateTestVendor.id}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ rejectionReason: 'Test rejection' })
        .expect(400); // Bad Request

      // Proper workflow should work
      await request(app.getHttpServer())
        .post(`/workflow/vendors/${stateTestVendor.id}/submit`)
        .set(
          'Authorization',
          `Bearer ${stateTestUserResponse.body.access_token}`,
        )
        .expect(200);

      await request(app.getHttpServer())
        .post(`/workflow/vendors/${stateTestVendor.id}/start-review`)
        .set('Authorization', `Bearer ${reviewerToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .post(`/workflow/vendors/${stateTestVendor.id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should handle duplicate workflow actions gracefully', async () => {
      // Try to approve already verified vendor (should fail)
      await request(app.getHttpServer())
        .post(`/workflow/vendors/${testVendor.id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ notes: 'Duplicate approval attempt' })
        .expect(400);

      // Try to submit already verified vendor (should fail)
      await request(app.getHttpServer())
        .post(`/workflow/vendors/${testVendor.id}/submit`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .expect(400);
    });

    it('should track escalation levels during workflow', async () => {
      const suspendedVendorCheck = await request(app.getHttpServer())
        .get(`/syrian-vendors/${testVendor3.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(suspendedVendorCheck.body.escalationLevel).toBeGreaterThan(0);
      expect(suspendedVendorCheck.body.verificationStatus).toBe(
        SyrianVendorVerificationStatus.SUSPENDED,
      );
    });
  });

  describe('🔒 Workflow Authorization', () => {
    it('should enforce role-based workflow permissions', async () => {
      // Vendor users can only submit their own vendors
      await request(app.getHttpServer())
        .post(`/workflow/vendors/${testVendor2.id}/submit`)
        .set('Authorization', `Bearer ${vendorToken}`) // Wrong vendor token
        .expect(403);

      // Only reviewers and above can start reviews
      await request(app.getHttpServer())
        .post(`/workflow/vendors/${testVendor.id}/start-review`)
        .set('Authorization', `Bearer ${vendorToken}`) // Vendor token, should fail
        .expect(403);

      // Only admins can approve/reject
      await request(app.getHttpServer())
        .post(`/workflow/vendors/${testVendor.id}/approve`)
        .set('Authorization', `Bearer ${reviewerToken}`) // Reviewer token, should fail
        .expect(403);
    });

    it('should require authentication for all workflow operations', async () => {
      await request(app.getHttpServer())
        .post(`/workflow/vendors/${testVendor.id}/submit`)
        .expect(401);

      await request(app.getHttpServer())
        .get('/workflow/sla-monitoring')
        .expect(401);

      await request(app.getHttpServer()).get('/workflow/analytics').expect(401);
    });
  });
});
