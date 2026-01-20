/**
 * @file vendors-comprehensive.e2e-spec.ts
 * @description Comprehensive E2E tests for Syrian Vendor API
 *
 * Tests complete vendor workflow including:
 * - Vendor registration and profile management
 * - 9-state verification workflow with Syrian business compliance
 * - Advanced search and filtering with Arabic/English localization
 * - Bulk operations for enterprise management
 * - Performance analytics and quality scoring
 * - SLA monitoring and compliance tracking
 * - Syrian market specific features and localization
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

describe('Syrian Vendor Management (E2E)', () => {
  let app: INestApplication;
  let userToken: string;
  let adminToken: string;
  let reviewerToken: string;
  let testUser: any;
  let adminUser: any;
  let reviewerUser: any;
  let damascusGovernorate: any;
  let aleppoGovernorate: any;
  let testVendor: any;

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
   * Creates test users, governorates, and authentication tokens
   */
  async function createTestData() {
    // Create test user (vendor)
    const userResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'vendor@souqsyria.com',
        password: 'VendorPassword123!',
        full_name: 'أحمد التاجر الدمشقي',
        phone: '+963987654321',
      });

    testUser = userResponse.body.user;
    userToken = userResponse.body.access_token;

    // Create admin user
    const adminResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'admin@souqsyria.com',
        password: 'AdminPassword123!',
        full_name: 'مدير النظام',
        phone: '+963988123456',
        role: 'admin',
      });

    adminUser = adminResponse.body.user;
    adminToken = adminResponse.body.access_token;

    // Create reviewer user
    const reviewerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'reviewer@souqsyria.com',
        password: 'ReviewerPassword123!',
        full_name: 'مراجع البائعين',
        phone: '+963989876543',
        role: 'reviewer',
      });

    reviewerUser = reviewerResponse.body.user;
    reviewerToken = reviewerResponse.body.access_token;

    // Create Syrian governorates
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
  }

  describe('🏪 Vendor Registration', () => {
    it('should register Syrian vendor with comprehensive business information', async () => {
      const vendorData = {
        userId: testUser.id,
        storeNameEn: 'Damascus Electronics Store',
        storeNameAr: 'متجر دمشق للإلكترونيات',
        storeDescriptionEn:
          'Leading electronics retailer in Damascus specializing in smartphones and computers',
        storeDescriptionAr:
          'أفضل متجر إلكترونيات في دمشق متخصص في الهواتف الذكية والحاسوب',
        governorateId: damascusGovernorate.id,
        businessType: SyrianBusinessType.LIMITED_LIABILITY,
        vendorCategory: SyrianVendorCategory.RETAILER,
        contactPhone: '+963987654321',
        contactEmail: 'damascus.electronics@souqsyria.com',
        address: 'شارع الثورة، دمشق، سوريا',
        websiteUrl: 'https://damascus-electronics.sy',
        socialMediaLinks: {
          facebook: 'https://facebook.com/damascus.electronics',
          instagram: '@damascus_electronics',
          telegram: '@damascus_electronics_sy',
        },
        commercialRegisterNumber: 'CR-DM-2024-001',
        taxIdNumber: 'TAX-123456789',
        industrialLicenseNumber: 'IL-DM-2024-001',
        secondaryPhone: '+963988123456',
        whatsappNumber: '+963987654321',
      };

      const response = await request(app.getHttpServer())
        .post('/syrian-vendors')
        .set('Authorization', `Bearer ${userToken}`)
        .send(vendorData)
        .expect(201);

      testVendor = response.body;

      expect(response.body).toEqual(
        expect.objectContaining({
          id: expect.any(Number),
          userId: testUser.id,
          storeNameEn: 'Damascus Electronics Store',
          storeNameAr: 'متجر دمشق للإلكترونيات',
          governorateId: damascusGovernorate.id,
          businessType: SyrianBusinessType.LIMITED_LIABILITY,
          vendorCategory: SyrianVendorCategory.RETAILER,
          verificationStatus: SyrianVendorVerificationStatus.DRAFT,
          qualityScore: expect.any(Number),
          isActive: false,
          commercialRegisterNumber: 'CR-DM-2024-001',
          taxIdNumber: 'TAX-123456789',
          socialMediaLinks: expect.objectContaining({
            facebook: 'https://facebook.com/damascus.electronics',
            instagram: '@damascus_electronics',
          }),
        }),
      );

      expect(response.body.qualityScore).toBeGreaterThan(70); // Should have decent initial score
    });

    it('should create Aleppo craftsman vendor with different business structure', async () => {
      // Create second test user for Aleppo vendor
      const aleppoUserResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'aleppo.craftsman@souqsyria.com',
          password: 'CraftsmanPassword123!',
          full_name: 'محمد الحرفي الحلبي',
          phone: '+963989123456',
        });

      const aleppoUser = aleppoUserResponse.body.user;
      const aleppoUserToken = aleppoUserResponse.body.access_token;

      const aleppoVendorData = {
        userId: aleppoUser.id,
        storeNameEn: 'Aleppo Traditional Crafts',
        storeNameAr: 'الحرف التقليدية الحلبية',
        storeDescriptionEn:
          'Authentic handmade Syrian crafts and traditional textiles',
        storeDescriptionAr: 'حرف يدوية سورية أصيلة ومنسوجات تقليدية',
        governorateId: aleppoGovernorate.id,
        businessType: SyrianBusinessType.SOLE_PROPRIETORSHIP,
        vendorCategory: SyrianVendorCategory.CRAFTSMAN,
        contactPhone: '+963989123456',
        contactEmail: 'aleppo.crafts@souqsyria.com',
        address: 'سوق المدينة، حلب، سوريا',
        websiteUrl: 'https://aleppo-crafts.sy',
        socialMediaLinks: {
          facebook: 'https://facebook.com/aleppo.crafts',
          instagram: '@aleppo_traditional_crafts',
        },
      };

      const response = await request(app.getHttpServer())
        .post('/syrian-vendors')
        .set('Authorization', `Bearer ${aleppoUserToken}`)
        .send(aleppoVendorData)
        .expect(201);

      expect(response.body).toEqual(
        expect.objectContaining({
          storeNameEn: 'Aleppo Traditional Crafts',
          storeNameAr: 'الحرف التقليدية الحلبية',
          governorateId: aleppoGovernorate.id,
          businessType: SyrianBusinessType.SOLE_PROPRIETORSHIP,
          vendorCategory: SyrianVendorCategory.CRAFTSMAN,
          verificationStatus: SyrianVendorVerificationStatus.DRAFT,
        }),
      );
    });

    it('should reject duplicate user vendor registration', async () => {
      const duplicateVendorData = {
        userId: testUser.id,
        storeNameEn: 'Another Store',
        storeNameAr: 'متجر آخر',
        governorateId: damascusGovernorate.id,
      };

      await request(app.getHttpServer())
        .post('/syrian-vendors')
        .set('Authorization', `Bearer ${userToken}`)
        .send(duplicateVendorData)
        .expect(409); // Conflict - user already has vendor account
    });

    it('should reject duplicate commercial register number', async () => {
      // Create third user
      const thirdUserResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'third.vendor@souqsyria.com',
          password: 'ThirdPassword123!',
          full_name: 'بائع ثالث',
          phone: '+963987987987',
        });

      const thirdUser = thirdUserResponse.body.user;
      const thirdUserToken = thirdUserResponse.body.access_token;

      const duplicateCRVendorData = {
        userId: thirdUser.id,
        storeNameEn: 'Third Store',
        storeNameAr: 'المتجر الثالث',
        governorateId: damascusGovernorate.id,
        commercialRegisterNumber: 'CR-DM-2024-001', // Same as first vendor
      };

      const response = await request(app.getHttpServer())
        .post('/syrian-vendors')
        .set('Authorization', `Bearer ${thirdUserToken}`)
        .send(duplicateCRVendorData)
        .expect(409);

      expect(response.body.message).toContain(
        'Commercial register number CR-DM-2024-001 is already registered',
      );
    });

    it('should validate governorate existence', async () => {
      // Create fourth user
      const fourthUserResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'fourth.vendor@souqsyria.com',
          password: 'FourthPassword123!',
          full_name: 'بائع رابع',
          phone: '+963986986986',
        });

      const fourthUser = fourthUserResponse.body.user;
      const fourthUserToken = fourthUserResponse.body.access_token;

      const invalidGovernorateData = {
        userId: fourthUser.id,
        storeNameEn: 'Invalid Governorate Store',
        storeNameAr: 'متجر محافظة غير صحيحة',
        governorateId: 999, // Non-existent governorate
      };

      const response = await request(app.getHttpServer())
        .post('/syrian-vendors')
        .set('Authorization', `Bearer ${fourthUserToken}`)
        .send(invalidGovernorateData)
        .expect(404);

      expect(response.body.message).toContain(
        'Governorate with ID 999 not found',
      );
    });
  });

  describe('🔍 Vendor Retrieval and Search', () => {
    it('should get vendor by ID with full relations', async () => {
      const response = await request(app.getHttpServer())
        .get(`/syrian-vendors/${testVendor.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          id: testVendor.id,
          storeNameEn: 'Damascus Electronics Store',
          storeNameAr: 'متجر دمشق للإلكترونيات',
          user: expect.objectContaining({
            id: testUser.id,
            fullName: 'أحمد التاجر الدمشقي',
          }),
          governorate: expect.objectContaining({
            id: damascusGovernorate.id,
            nameEn: 'Damascus',
            nameAr: 'دمشق',
          }),
        }),
      );
    });

    it('should search vendors with Arabic search term', async () => {
      const response = await request(app.getHttpServer())
        .get('/syrian-vendors/search')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          searchTerm: 'دمشق', // Damascus in Arabic
          page: 1,
          limit: 10,
        })
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          vendors: expect.arrayContaining([
            expect.objectContaining({
              storeNameAr: expect.stringContaining('دمشق'),
            }),
          ]),
          pagination: expect.objectContaining({
            page: 1,
            limit: 10,
            total: expect.any(Number),
            totalPages: expect.any(Number),
          }),
          filters: expect.objectContaining({
            governorateDistribution: expect.any(Object),
            statusDistribution: expect.any(Object),
            businessTypeDistribution: expect.any(Object),
          }),
          aggregations: expect.objectContaining({
            averageQualityScore: expect.any(Number),
            totalRevenueSyp: expect.any(Number),
            averageOrderValue: expect.any(Number),
          }),
        }),
      );
    });

    it('should search vendors with comprehensive filters', async () => {
      const response = await request(app.getHttpServer())
        .get('/syrian-vendors/search')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          governorateIds: [damascusGovernorate.id, aleppoGovernorate.id],
          businessType: SyrianBusinessType.LIMITED_LIABILITY,
          verificationStatus: SyrianVendorVerificationStatus.DRAFT,
          isActive: false,
          minQualityScore: 70,
          sortBy: 'qualityScore',
          sortOrder: 'DESC',
          page: 1,
          limit: 20,
        })
        .expect(200);

      expect(response.body.vendors).toBeInstanceOf(Array);
      expect(response.body.pagination.limit).toBe(20);

      // All returned vendors should match the filters
      response.body.vendors.forEach((vendor: any) => {
        expect([damascusGovernorate.id, aleppoGovernorate.id]).toContain(
          vendor.governorateId,
        );
        expect(vendor.qualityScore).toBeGreaterThanOrEqual(70);
      });
    });

    it('should search vendors with English search term', async () => {
      const response = await request(app.getHttpServer())
        .get('/syrian-vendors/search')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          searchTerm: 'Electronics',
          businessType: SyrianBusinessType.LIMITED_LIABILITY,
          vendorCategory: SyrianVendorCategory.RETAILER,
        })
        .expect(200);

      expect(response.body.vendors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            storeNameEn: expect.stringContaining('Electronics'),
            businessType: SyrianBusinessType.LIMITED_LIABILITY,
            vendorCategory: SyrianVendorCategory.RETAILER,
          }),
        ]),
      );
    });

    it('should handle empty search results gracefully', async () => {
      const response = await request(app.getHttpServer())
        .get('/syrian-vendors/search')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          searchTerm: 'NonexistentStore',
          verificationStatus: SyrianVendorVerificationStatus.VERIFIED,
        })
        .expect(200);

      expect(response.body.vendors).toHaveLength(0);
      expect(response.body.pagination.total).toBe(0);
      expect(response.body.aggregations.totalRevenueSyp).toBe(0);
    });
  });

  describe('📝 Vendor Profile Updates', () => {
    it('should update vendor profile information', async () => {
      const updateData = {
        storeDescriptionEn:
          'Updated: Premier electronics store in Damascus with 10+ years experience',
        storeDescriptionAr:
          'محدث: متجر إلكترونيات رائد في دمشق مع خبرة تزيد عن 10 سنوات',
        websiteUrl: 'https://new-damascus-electronics.sy',
        secondaryPhone: '+963988999888',
        socialMediaLinks: {
          facebook: 'https://facebook.com/damascus.electronics.updated',
          instagram: '@damascus_electronics_new',
          telegram: '@damascus_electronics_updated',
          tiktok: '@damascus_electronics_sy',
        },
      };

      const response = await request(app.getHttpServer())
        .put(`/syrian-vendors/${testVendor.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          id: testVendor.id,
          storeDescriptionEn: updateData.storeDescriptionEn,
          storeDescriptionAr: updateData.storeDescriptionAr,
          websiteUrl: updateData.websiteUrl,
          secondaryPhone: updateData.secondaryPhone,
          socialMediaLinks: expect.objectContaining({
            facebook: updateData.socialMediaLinks.facebook,
            instagram: updateData.socialMediaLinks.instagram,
            telegram: updateData.socialMediaLinks.telegram,
            tiktok: updateData.socialMediaLinks.tiktok,
          }),
          updatedAt: expect.any(String),
        }),
      );
    });

    it('should prevent updating to duplicate commercial register number', async () => {
      const updateData = {
        commercialRegisterNumber: 'CR-AL-2024-001', // Assume this exists for another vendor
      };

      // First create another vendor with this CR number
      const anotherUserResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'another@souqsyria.com',
          password: 'Password123!',
          full_name: 'بائع آخر',
          phone: '+963981234567',
        });

      const anotherVendorData = {
        userId: anotherUserResponse.body.user.id,
        storeNameEn: 'Another Store',
        storeNameAr: 'متجر آخر',
        governorateId: aleppoGovernorate.id,
        commercialRegisterNumber: 'CR-AL-2024-001',
      };

      await request(app.getHttpServer())
        .post('/syrian-vendors')
        .set('Authorization', `Bearer ${anotherUserResponse.body.access_token}`)
        .send(anotherVendorData)
        .expect(201);

      // Now try to update testVendor with the same CR number
      const response = await request(app.getHttpServer())
        .put(`/syrian-vendors/${testVendor.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(409);

      expect(response.body.message).toContain(
        'Commercial register number CR-AL-2024-001 is already registered',
      );
    });

    it('should update vendor governorate with validation', async () => {
      const updateData = {
        governorateId: aleppoGovernorate.id,
      };

      const response = await request(app.getHttpServer())
        .put(`/syrian-vendors/${testVendor.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.governorateId).toBe(aleppoGovernorate.id);
    });

    it('should reject invalid governorate in update', async () => {
      const updateData = {
        governorateId: 999,
      };

      const response = await request(app.getHttpServer())
        .put(`/syrian-vendors/${testVendor.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.message).toContain(
        'Governorate with ID 999 not found',
      );
    });
  });

  describe('🔄 Vendor Workflow Management', () => {
    it('should submit vendor for verification', async () => {
      const response = await request(app.getHttpServer())
        .post(`/syrian-vendors/${testVendor.id}/workflow/submit`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          fromStatus: SyrianVendorVerificationStatus.DRAFT,
          toStatus: SyrianVendorVerificationStatus.SUBMITTED,
          transitionedAt: expect.any(String),
          message: 'Vendor submitted for verification successfully',
          nextActions: expect.arrayContaining([
            'Admin review will begin within 24 hours',
            'Document verification will be performed',
            'Business compliance checks will be conducted',
          ]),
          slaDeadline: expect.any(String),
        }),
      );
    });

    it('should start review process as reviewer', async () => {
      const response = await request(app.getHttpServer())
        .post(`/syrian-vendors/${testVendor.id}/workflow/start-review`)
        .set('Authorization', `Bearer ${reviewerToken}`)
        .send({
          notes: 'Starting comprehensive business verification review',
        })
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          fromStatus: SyrianVendorVerificationStatus.SUBMITTED,
          toStatus: SyrianVendorVerificationStatus.UNDER_REVIEW,
          message: 'Vendor review process started',
          nextActions: expect.arrayContaining([
            'Document verification in progress',
            'Business compliance checks ongoing',
            'Quality assessment being conducted',
          ]),
        }),
      );
    });

    it('should request clarification during review', async () => {
      const clarificationRequest =
        'Please provide updated tax certificate and industrial license documentation. الرجاء تقديم شهادة ضريبية محدثة ووثائق الترخيص الصناعي';

      const response = await request(app.getHttpServer())
        .post(`/syrian-vendors/${testVendor.id}/workflow/request-clarification`)
        .set('Authorization', `Bearer ${reviewerToken}`)
        .send({
          clarificationRequest,
        })
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          fromStatus: SyrianVendorVerificationStatus.UNDER_REVIEW,
          toStatus: SyrianVendorVerificationStatus.REQUIRES_CLARIFICATION,
          message: 'Clarification requested from vendor',
          nextActions: expect.arrayContaining([
            'Vendor has been notified',
            'Vendor has 48 hours to respond',
          ]),
        }),
      );
    });

    it('should approve vendor after clarification', async () => {
      const approvalNotes =
        'All documents verified. Business registration confirmed. Quality standards met. Ready for activation.';

      const response = await request(app.getHttpServer())
        .post(`/syrian-vendors/${testVendor.id}/workflow/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          notes: approvalNotes,
        })
        .expect(200);

      expect(response.body).toEqual(
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

      // Verify vendor is now active
      const vendorCheck = await request(app.getHttpServer())
        .get(`/syrian-vendors/${testVendor.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(vendorCheck.body.verificationStatus).toBe(
        SyrianVendorVerificationStatus.VERIFIED,
      );
      expect(vendorCheck.body.isActive).toBe(true);
      expect(vendorCheck.body.qualityScore).toBeGreaterThan(70);
    });

    it('should suspend vendor for quality issues', async () => {
      const suspensionReason =
        'Multiple customer complaints about product quality and delayed shipping. Quality score dropped below acceptable levels.';

      const response = await request(app.getHttpServer())
        .post(`/syrian-vendors/${testVendor.id}/workflow/suspend`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          suspensionReason,
          suspensionDurationDays: 14, // 2 weeks suspension
        })
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          toStatus: SyrianVendorVerificationStatus.SUSPENDED,
          message: 'Vendor suspended for 14 days',
          nextActions: expect.arrayContaining([
            'All vendor products deactivated',
            'Vendor access restricted',
            expect.stringMatching(/Automatic review scheduled for/),
          ]),
        }),
      );
    });
  });

  describe('⚡ Bulk Operations', () => {
    let additionalVendorIds: number[];

    beforeAll(async () => {
      // Create additional vendors for bulk testing
      additionalVendorIds = [];

      for (let i = 1; i <= 3; i++) {
        const userResponse = await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email: `bulk.vendor.${i}@souqsyria.com`,
            password: 'BulkPassword123!',
            full_name: `بائع مجموعي ${i}`,
            phone: `+96398${i}${i}${i}${i}${i}${i}${i}`,
          });

        const vendorResponse = await request(app.getHttpServer())
          .post('/syrian-vendors')
          .set('Authorization', `Bearer ${userResponse.body.access_token}`)
          .send({
            userId: userResponse.body.user.id,
            storeNameEn: `Bulk Test Store ${i}`,
            storeNameAr: `متجر اختبار مجموعي ${i}`,
            governorateId:
              i % 2 === 0 ? damascusGovernorate.id : aleppoGovernorate.id,
            businessType: SyrianBusinessType.LIMITED_LIABILITY,
            vendorCategory: SyrianVendorCategory.RETAILER,
            contactPhone: `+96398${i}${i}${i}${i}${i}${i}${i}`,
            contactEmail: `bulk.vendor.${i}@souqsyria.com`,
            address: `Address ${i}`,
          })
          .expect(201);

        additionalVendorIds.push(vendorResponse.body.id);

        // Submit and verify vendors for bulk testing
        await request(app.getHttpServer())
          .post(`/syrian-vendors/${vendorResponse.body.id}/workflow/submit`)
          .set('Authorization', `Bearer ${userResponse.body.access_token}`);

        await request(app.getHttpServer())
          .post(
            `/syrian-vendors/${vendorResponse.body.id}/workflow/start-review`,
          )
          .set('Authorization', `Bearer ${reviewerToken}`);

        await request(app.getHttpServer())
          .post(`/syrian-vendors/${vendorResponse.body.id}/workflow/approve`)
          .set('Authorization', `Bearer ${adminToken}`);
      }
    });

    it('should perform bulk vendor activation', async () => {
      const bulkActionData = {
        action: 'activate',
        vendorIds: additionalVendorIds,
      };

      const response = await request(app.getHttpServer())
        .post('/syrian-vendors/bulk-actions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(bulkActionData)
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          action: 'activate',
          processed: 3,
          failed: 0,
          results: expect.arrayContaining([
            expect.objectContaining({
              success: true,
              message: 'Vendor activated successfully',
            }),
          ]),
          summary: expect.objectContaining({
            totalRequested: 3,
            successful: 3,
            failed: 0,
            processingTime: expect.stringMatching(/\d+\.\d+s/),
          }),
        }),
      );
    });

    it('should perform bulk priority updates', async () => {
      const bulkActionData = {
        action: 'updatePriority',
        vendorIds: additionalVendorIds.slice(0, 2),
        parameters: {
          priority: 'high',
        },
      };

      const response = await request(app.getHttpServer())
        .post('/syrian-vendors/bulk-actions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(bulkActionData)
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          action: 'updatePriority',
          processed: 2,
          failed: 0,
          results: expect.arrayContaining([
            expect.objectContaining({
              success: true,
              message: 'Vendor priority updated to high',
            }),
          ]),
        }),
      );
    });

    it('should handle bulk operations with some failures', async () => {
      const bulkActionData = {
        action: 'activate',
        vendorIds: [999, 998, additionalVendorIds[0]], // Non-existent IDs + valid ID
      };

      const response = await request(app.getHttpServer())
        .post('/syrian-vendors/bulk-actions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(bulkActionData)
        .expect(200);

      expect(response.body.processed).toBe(1); // Only 1 successful
      expect(response.body.failed).toBe(2); // 2 failed (non-existent vendors)
      expect(response.body.results).toHaveLength(3);

      const failedResults = response.body.results.filter(
        (r: any) => !r.success,
      );
      expect(failedResults).toHaveLength(2);
      failedResults.forEach((result: any) => {
        expect(result.error).toContain('not found');
      });
    });

    it('should reject unknown bulk actions', async () => {
      const bulkActionData = {
        action: 'unknown_action',
        vendorIds: [additionalVendorIds[0]],
      };

      const response = await request(app.getHttpServer())
        .post('/syrian-vendors/bulk-actions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(bulkActionData)
        .expect(200);

      expect(response.body.processed).toBe(0);
      expect(response.body.failed).toBe(1);
      expect(response.body.results[0].error).toContain(
        'Unknown action: unknown_action',
      );
    });
  });

  describe('📊 Analytics and Statistics', () => {
    it('should get comprehensive vendor statistics', async () => {
      const response = await request(app.getHttpServer())
        .get('/syrian-vendors/statistics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          totalVendors: expect.any(Number),
          activeVendors: expect.any(Number),
          verifiedVendors: expect.any(Number),
          pendingVerification: expect.any(Number),
          averageQualityScore: expect.any(Number),
          totalRevenueSyp: expect.any(Number),
          monthlyGrowth: expect.any(Number),
        }),
      );

      expect(response.body.totalVendors).toBeGreaterThan(0);
      expect(response.body.verifiedVendors).toBeGreaterThan(0);
      expect(response.body.averageQualityScore).toBeGreaterThan(0);
      expect(response.body.averageQualityScore).toBeLessThanOrEqual(100);
    });

    it('should get vendor analytics for date range', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-12-31';

      const response = await request(app.getHttpServer())
        .get('/syrian-vendors/analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          startDate,
          endDate,
        })
        .expect(200);

      expect(response.body).toEqual(
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

      // Check that Damascus and Aleppo are represented
      expect(response.body.governorateDistribution).toHaveProperty('Damascus');
      expect(response.body.governorateDistribution).toHaveProperty('Aleppo');
    });
  });

  describe('🔔 SLA Monitoring', () => {
    it('should monitor SLA compliance across vendor workflow', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/vendors/sla-monitoring')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          totalVendors: expect.any(Number),
          breachingDeadlines: expect.any(Array),
          upcomingDeadlines: expect.any(Array),
          averageProcessingTime: expect.any(Number),
          slaComplianceRate: expect.any(Number),
        }),
      );

      // Check that SLA compliance rate is a percentage
      expect(response.body.slaComplianceRate).toBeGreaterThanOrEqual(0);
      expect(response.body.slaComplianceRate).toBeLessThanOrEqual(100);
    });

    it('should provide recommended actions for breaching deadlines', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/vendors/sla-monitoring')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      if (response.body.breachingDeadlines.length > 0) {
        response.body.breachingDeadlines.forEach((breach: any) => {
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
    });
  });

  describe('🎯 Performance Metrics', () => {
    it('should update vendor performance metrics', async () => {
      const response = await request(app.getHttpServer())
        .post(`/admin/vendors/${testVendor.id}/update-performance`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toEqual(
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

      expect(response.body.qualityScore).toBeGreaterThanOrEqual(0);
      expect(response.body.qualityScore).toBeLessThanOrEqual(100);
    });

    it('should get vendors requiring performance review', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/vendors/performance-review-required')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);

      if (response.body.length > 0) {
        response.body.forEach((vendor: any) => {
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

  describe('🌍 Syrian Market Localization', () => {
    it('should support Arabic text in all vendor fields', async () => {
      const response = await request(app.getHttpServer())
        .get(`/syrian-vendors/${testVendor.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.storeNameAr).toMatch(/[\u0600-\u06FF\u0750-\u077F]/); // Arabic script
      expect(response.body.storeDescriptionAr).toMatch(
        /[\u0600-\u06FF\u0750-\u077F]/,
      );
      expect(response.body.address).toMatch(/[\u0600-\u06FF\u0750-\u077F]/);
    });

    it('should handle large SYP currency amounts correctly', async () => {
      const response = await request(app.getHttpServer())
        .get('/syrian-vendors/statistics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(typeof response.body.totalRevenueSyp).toBe('number');

      // Even if zero, should be a proper number type for SYP amounts
      if (response.body.totalRevenueSyp > 0) {
        expect(response.body.totalRevenueSyp).toBeGreaterThan(0);
      }
    });

    it('should provide bilingual search results', async () => {
      const response = await request(app.getHttpServer())
        .get('/syrian-vendors/search')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          searchTerm: 'Traditional', // English term that should match Arabic content
        })
        .expect(200);

      if (response.body.vendors.length > 0) {
        response.body.vendors.forEach((vendor: any) => {
          expect(vendor).toHaveProperty('storeNameEn');
          expect(vendor).toHaveProperty('storeNameAr');
          expect(vendor).toHaveProperty('storeDescriptionEn');
          expect(vendor).toHaveProperty('storeDescriptionAr');
        });
      }
    });

    it('should support Syrian governorate filtering', async () => {
      const response = await request(app.getHttpServer())
        .get('/syrian-vendors/search')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          governorateIds: [damascusGovernorate.id],
        })
        .expect(200);

      response.body.vendors.forEach((vendor: any) => {
        expect(vendor.governorateId).toBe(damascusGovernorate.id);
        expect(vendor.governorate.nameEn).toBe('Damascus');
        expect(vendor.governorate.nameAr).toBe('دمشق');
      });
    });

    it('should handle Syrian business types correctly', async () => {
      const response = await request(app.getHttpServer())
        .get('/syrian-vendors/search')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          businessType: SyrianBusinessType.LIMITED_LIABILITY,
        })
        .expect(200);

      response.body.vendors.forEach((vendor: any) => {
        expect(vendor.businessType).toBe(SyrianBusinessType.LIMITED_LIABILITY);
      });

      expect(response.body.filters.businessTypeDistribution).toHaveProperty(
        SyrianBusinessType.LIMITED_LIABILITY,
      );
    });

    it('should support Syrian phone number formats', async () => {
      const response = await request(app.getHttpServer())
        .get(`/syrian-vendors/${testVendor.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.contactPhone).toMatch(/^\+963\d{9}$/); // Syrian phone format

      if (response.body.secondaryPhone) {
        expect(response.body.secondaryPhone).toMatch(/^\+963\d{9}$/);
      }

      if (response.body.whatsappNumber) {
        expect(response.body.whatsappNumber).toMatch(/^\+963\d{9}$/);
      }
    });
  });

  describe('🔒 Authorization and Security', () => {
    it('should require authentication for vendor operations', async () => {
      await request(app.getHttpServer())
        .get('/syrian-vendors/search')
        .expect(401);

      await request(app.getHttpServer())
        .post('/syrian-vendors')
        .send({})
        .expect(401);
    });

    it('should restrict sensitive operations to admin users', async () => {
      await request(app.getHttpServer())
        .post(`/syrian-vendors/${testVendor.id}/workflow/approve`)
        .set('Authorization', `Bearer ${userToken}`) // Regular user
        .send({ notes: 'Trying to approve' })
        .expect(403); // Forbidden
    });

    it('should allow vendor owners to access their own data', async () => {
      const response = await request(app.getHttpServer())
        .get(`/syrian-vendors/${testVendor.id}`)
        .set('Authorization', `Bearer ${userToken}`) // Vendor owner
        .expect(200);

      expect(response.body.id).toBe(testVendor.id);
    });
  });
});
