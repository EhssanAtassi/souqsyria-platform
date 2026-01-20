/**
 * @file kyc-comprehensive.e2e-spec.ts
 * @description Comprehensive E2E tests for Syrian KYC system
 *
 * COVERAGE:
 * - KYC document lifecycle (8-state workflow)
 * - Syrian document types and regulatory compliance
 * - Seeding operations and data integrity
 * - Arabic/English localization
 * - Workflow transitions and validation
 * - Enterprise features (SLA monitoring, audit trails)
 * - Performance and bulk operations
 * - Compliance and risk assessment
 *
 * @author SouqSyria Development Team
 * @since 2025-08-20
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';
import { DataSource } from 'typeorm';

import { AppModule } from '../../src/app.module';
import { KycModule } from '../../src/kyc/kyc.module';

// Entities
import { SyrianKycDocumentEntity } from '../../src/kyc/entities/syrian-kyc-document.entity';
import { SyrianKycStatusLog } from '../../src/kyc/entities/syrian-kyc-status-log.entity';
import { User } from '../../src/users/entities/user.entity';
import { SyrianGovernorateEntity } from '../../src/addresses/entities/syrian-governorate.entity';

// Enums
import {
  SyrianKycStatus,
  SyrianKycVerificationLevel,
  SyrianKycDocumentType,
  SyrianGovernorateCode,
} from '../../src/kyc/enums/syrian-kyc.enums';

describe('🆔 KYC System E2E Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let testUser: User;
  let testReviewer: User;
  let testGovernorate: SyrianGovernorateEntity;
  let testKycDocument: SyrianKycDocumentEntity;

  // Test data for KYC document creation
  const kycDocumentData = {
    documentType: SyrianKycDocumentType.SYRIAN_ID,
    titleEn: 'Test Syrian National ID Card',
    titleAr: 'بطاقة شخصية سورية تجريبية',
    status: SyrianKycStatus.DRAFT,
    verificationLevel: SyrianKycVerificationLevel.BASIC,
    fileDetails: {
      originalUrl: 'https://storage.souqsyria.com/kyc/test_syrian_id_001.jpg',
      thumbnailUrl: 'https://storage.souqsyria.com/kyc/test_thumb_001.jpg',
      fileName: 'test_syrian_id_001.jpg',
      fileSize: 2048576,
      mimeType: 'image/jpeg',
      uploadedAt: new Date(),
      checksum: 'sha256:test123abc456...',
    },
    documentData: {
      documentNumber: 'TEST12345678901',
      fullName: 'أحمد محمد التجريبي',
      fullNameEn: 'Ahmad Mohammed Al-Tajribi',
      dateOfBirth: '1990-01-15',
      placeOfBirth: 'Damascus',
      placeOfBirthAr: 'دمشق',
      nationality: 'Syrian',
      nationalityAr: 'سوري',
      gender: 'Male',
      genderAr: 'ذكر',
      issueDate: '2020-01-01',
      expiryDate: '2030-01-01',
      issuingAuthority: 'Ministry of Interior',
      issuingAuthorityAr: 'وزارة الداخلية',
    },
    addressInfo: {
      addressLine1: 'Damascus, Test District',
      addressLine1Ar: 'دمشق، حي التجريب',
      addressLine2: 'Building 15, Floor 3',
      addressLine2Ar: 'البناء رقم 15، الطابق الثالث',
      postalCode: '12345',
      phone: '+963987654321',
      email: 'test@example.com',
    },
    validationResults: {
      isValid: true,
      validationScore: 95.5,
      complianceLevel: 'HIGH' as const,
      ocrConfidence: 98.2,
      faceMatchScore: 94.1,
      documentAuthenticity: true,
      riskScore: 12.3,
      validationChecks: {
        formatValid: true,
        checksumValid: true,
        expDateValid: true,
        issuerValid: true,
        duplicateCheck: false,
      },
      validationErrors: [],
      validationWarnings: [],
    },
    complianceData: {
      complianceChecks: {
        sanctionsCheck: 'CLEAR' as const,
        pepsCheck: 'CLEAR' as const,
        amlCheck: 'LOW_RISK' as const,
        kycTier: 'TIER_2' as const,
      },
      riskAssessment: {
        overallRisk: 'LOW' as const,
        riskScore: 15.2,
        riskFactors: ['NEW_CUSTOMER'],
        mitigatingFactors: ['VALID_DOCUMENTS', 'GOOD_REFERENCES', 'LOCAL_ADDRESS'],
      },
      regulatoryFlags: [],
      lastComplianceCheck: new Date(),
    },
    slaTracking: {
      slaHours: 72,
      expectedReviewTime: new Date(Date.now() + 72 * 60 * 60 * 1000),
      isOverdue: false,
      hoursOverdue: 0,
      escalationLevel: 0,
      processingTime: null,
      onTimeProcessing: null,
      delayReasons: [],
    },
    priority: 'NORMAL' as const,
    isActive: true,
    clientIp: '192.168.1.100',
    userAgent: 'Test E2E Agent v1.0.0',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));

    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);

    // Clean up existing test data
    await cleanupTestData();

    // Create test dependencies
    await createTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await app.close();
  });

  // Helper functions
  async function cleanupTestData() {
    if (dataSource?.isInitialized) {
      await dataSource.query('SET FOREIGN_KEY_CHECKS = 0');

      // Clean in dependency order
      await dataSource.getRepository(SyrianKycStatusLog).delete({});
      await dataSource.getRepository(SyrianKycDocumentEntity).delete({});

      await dataSource.query('SET FOREIGN_KEY_CHECKS = 1');
    }
  }

  async function createTestData() {
    // Create test users
    const userRepo = dataSource.getRepository(User);
    
    testUser = await userRepo.save({
      email: 'testkyc@example.com',
      firstName: 'Test KYC',
      lastName: 'User',
      phone: '+963987654321',
    });

    testReviewer = await userRepo.save({
      email: 'reviewer@example.com',
      firstName: 'KYC',
      lastName: 'Reviewer',
      phone: '+963987654322',
    });

    // Create test governorate (if not exists)
    const governorateRepo = dataSource.getRepository(SyrianGovernorateEntity);
    testGovernorate = await governorateRepo.findOne({ where: { code: 'damascus' } });
    
    if (!testGovernorate) {
      testGovernorate = await governorateRepo.save({
        code: 'damascus',
        nameEn: 'Damascus',
        nameAr: 'دمشق',
        isActive: true,
      });
    }
  }

  describe('📋 KYC Document Management', () => {
    describe('POST /api/v1/kyc/documents', () => {
      it('should create a new KYC document with Syrian localization', async () => {
        const testKycData = {
          ...kycDocumentData,
          userId: testUser.id,
          governorateId: testGovernorate.id,
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/kyc/documents')
          .send(testKycData)
          .expect(201);

        expect(response.body).toMatchObject({
          id: expect.any(Number),
          documentType: SyrianKycDocumentType.SYRIAN_ID,
          titleEn: 'Test Syrian National ID Card',
          titleAr: 'بطاقة شخصية سورية تجريبية',
          status: SyrianKycStatus.DRAFT,
          verificationLevel: SyrianKycVerificationLevel.BASIC,
          isActive: true,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        });

        // Verify Arabic localization
        expect(response.body.documentData.fullName).toBe('أحمد محمد التجريبي');
        expect(response.body.documentData.placeOfBirthAr).toBe('دمشق');
        expect(response.body.addressInfo.addressLine1Ar).toContain('دمشق');

        // Verify nested structures
        expect(response.body.fileDetails.fileName).toBe('test_syrian_id_001.jpg');
        expect(response.body.validationResults.isValid).toBe(true);
        expect(response.body.complianceData.complianceChecks.sanctionsCheck).toBe('CLEAR');
        expect(response.body.slaTracking.slaHours).toBe(72);

        testKycDocument = response.body;
      });

      it('should validate required fields for KYC document creation', async () => {
        const invalidData = {
          documentType: SyrianKycDocumentType.SYRIAN_ID,
          titleEn: '', // Invalid - empty
          titleAr: 'عنوان عربي',
          // Missing required fields
        };

        await request(app.getHttpServer())
          .post('/api/v1/kyc/documents')
          .send(invalidData)
          .expect(400);
      });

      it('should handle different Syrian document types', async () => {
        const businessLicenseData = {
          ...kycDocumentData,
          userId: testUser.id,
          governorateId: testGovernorate.id,
          documentType: SyrianKycDocumentType.BUSINESS_LICENSE,
          titleEn: 'Test Commercial Business License',
          titleAr: 'رخصة العمل التجاري التجريبية',
          verificationLevel: SyrianKycVerificationLevel.BUSINESS,
          documentData: {
            ...kycDocumentData.documentData,
            businessName: 'Test Damascus Tech Solutions',
            businessNameAr: 'دمشق لحلول التقنية التجريبية',
            businessType: 'Information Technology Services',
            businessTypeAr: 'خدمات تقنية المعلومات',
            registrationNumber: 'TEST-REG-2025-5678',
            taxId: 'TEST-TAX-987654321',
            chamberNumber: 'TEST-CC-2025-1111',
          },
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/kyc/documents')
          .send(businessLicenseData)
          .expect(201);

        expect(response.body.documentType).toBe(SyrianKycDocumentType.BUSINESS_LICENSE);
        expect(response.body.verificationLevel).toBe(SyrianKycVerificationLevel.BUSINESS);
        expect(response.body.documentData.businessNameAr).toContain('دمشق');
        expect(response.body.documentData.businessTypeAr).toContain('تقنية');
      });
    });

    describe('GET /api/v1/kyc/documents', () => {
      it('should retrieve KYC documents with filtering and pagination', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/kyc/documents')
          .query({ 
            status: SyrianKycStatus.DRAFT,
            verificationLevel: SyrianKycVerificationLevel.BASIC,
            limit: 10,
          })
          .expect(200);

        expect(response.body).toMatchObject({
          data: expect.any(Array),
          total: expect.any(Number),
          page: expect.any(Number),
          limit: expect.any(Number),
        });

        if (response.body.data.length > 0) {
          const document = response.body.data[0];
          expect(document.status).toBe(SyrianKycStatus.DRAFT);
          expect(document.verificationLevel).toBe(SyrianKycVerificationLevel.BASIC);
          expect(document).toHaveProperty('titleAr');
          expect(document).toHaveProperty('documentData');
          expect(document).toHaveProperty('validationResults');
        }
      });

      it('should support Arabic language headers', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/kyc/documents')
          .set('Accept-Language', 'ar')
          .expect(200);

        expect(response.body.data).toBeDefined();
        if (response.body.data.length > 0) {
          const document = response.body.data[0];
          expect(document).toHaveProperty('titleAr');
          expect(document).toHaveProperty('documentData');
          expect(document.documentData).toHaveProperty('placeOfBirthAr');
        }
      });

      it('should filter by document type', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/kyc/documents')
          .query({ documentType: SyrianKycDocumentType.SYRIAN_ID })
          .expect(200);

        expect(Array.isArray(response.body.data)).toBe(true);
        if (response.body.data.length > 0) {
          response.body.data.forEach((doc) => {
            expect(doc.documentType).toBe(SyrianKycDocumentType.SYRIAN_ID);
          });
        }
      });
    });

    describe('GET /api/v1/kyc/documents/:id', () => {
      it('should retrieve a specific KYC document with complete details', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/v1/kyc/documents/${testKycDocument.id}`)
          .expect(200);

        expect(response.body).toMatchObject({
          id: testKycDocument.id,
          documentType: SyrianKycDocumentType.SYRIAN_ID,
          titleEn: testKycDocument.titleEn,
          titleAr: testKycDocument.titleAr,
          status: SyrianKycStatus.DRAFT,
          fileDetails: expect.any(Object),
          documentData: expect.any(Object),
          validationResults: expect.any(Object),
          complianceData: expect.any(Object),
          slaTracking: expect.any(Object),
        });

        // Verify nested structures
        expect(response.body.fileDetails.fileName).toBe('test_syrian_id_001.jpg');
        expect(response.body.documentData.documentNumber).toBe('TEST12345678901');
        expect(response.body.validationResults.validationScore).toBe(95.5);
        expect(response.body.complianceData.riskAssessment.overallRisk).toBe('LOW');
        expect(response.body.slaTracking.slaHours).toBe(72);
      });

      it('should return 404 for non-existent KYC document', async () => {
        await request(app.getHttpServer())
          .get('/api/v1/kyc/documents/99999')
          .expect(404);
      });
    });

    describe('PUT /api/v1/kyc/documents/:id', () => {
      it('should update KYC document with preserved localization', async () => {
        const updateData = {
          titleEn: 'Updated Test Syrian ID Card',
          titleAr: 'بطاقة شخصية سورية محدثة تجريبية',
          reviewNotes: 'Updated for testing purposes',
          reviewNotesAr: 'محدث لأغراض الاختبار',
          validationResults: {
            ...testKycDocument.validationResults,
            validationScore: 97.0,
          },
        };

        const response = await request(app.getHttpServer())
          .put(`/api/v1/kyc/documents/${testKycDocument.id}`)
          .send(updateData)
          .expect(200);

        expect(response.body.titleEn).toBe('Updated Test Syrian ID Card');
        expect(response.body.titleAr).toBe('بطاقة شخصية سورية محدثة تجريبية');
        expect(response.body.reviewNotesAr).toBe('محدث لأغراض الاختبار');
        expect(response.body.validationResults.validationScore).toBe(97.0);
        expect(response.body.updatedAt).not.toBe(testKycDocument.updatedAt);
      });
    });
  });

  describe('🔄 KYC Workflow Management', () => {
    describe('PUT /api/v1/kyc/documents/:id/status', () => {
      it('should update document status through workflow states', async () => {
        // Update to SUBMITTED
        const response1 = await request(app.getHttpServer())
          .put(`/api/v1/kyc/documents/${testKycDocument.id}/status`)
          .send({
            status: SyrianKycStatus.SUBMITTED,
            notes: 'Document submitted for review',
            notesAr: 'تم تقديم الوثيقة للمراجعة',
          })
          .expect(200);

        expect(response1.body.status).toBe(SyrianKycStatus.SUBMITTED);

        // Update to UNDER_REVIEW
        const response2 = await request(app.getHttpServer())
          .put(`/api/v1/kyc/documents/${testKycDocument.id}/status`)
          .send({
            status: SyrianKycStatus.UNDER_REVIEW,
            notes: 'Document assigned to reviewer',
            notesAr: 'تم تعيين الوثيقة للمراجع',
            reviewerId: testReviewer.id,
            metadata: {
              reviewerName: 'KYC Reviewer',
              assignedAt: new Date().toISOString(),
            },
          })
          .expect(200);

        expect(response2.body.status).toBe(SyrianKycStatus.UNDER_REVIEW);
        expect(response2.body.reviewedBy).toBeDefined();

        // Update to APPROVED
        const response3 = await request(app.getHttpServer())
          .put(`/api/v1/kyc/documents/${testKycDocument.id}/status`)
          .send({
            status: SyrianKycStatus.APPROVED,
            notes: 'Document approved after verification',
            notesAr: 'تمت الموافقة على الوثيقة بعد التحقق',
            reviewerId: testReviewer.id,
            metadata: {
              reviewDuration: '28.5 hours',
              validationScore: 96.5,
            },
          })
          .expect(200);

        expect(response3.body.status).toBe(SyrianKycStatus.APPROVED);
        expect(response3.body.reviewedAt).toBeDefined();
        expect(response3.body.reviewNotes).toBeDefined();
        expect(response3.body.reviewNotesAr).toBeDefined();
      });

      it('should prevent invalid status transitions', async () => {
        // Create a new document in DRAFT status
        const newDocData = {
          ...kycDocumentData,
          userId: testUser.id,
          governorateId: testGovernorate.id,
          titleEn: 'Invalid Transition Test Document',
          titleAr: 'وثيقة اختبار انتقال غير صحيح',
        };

        const createResponse = await request(app.getHttpServer())
          .post('/api/v1/kyc/documents')
          .send(newDocData)
          .expect(201);

        // Try to jump from DRAFT directly to APPROVED (invalid transition)
        await request(app.getHttpServer())
          .put(`/api/v1/kyc/documents/${createResponse.body.id}/status`)
          .send({
            status: SyrianKycStatus.APPROVED,
            notes: 'Invalid direct transition to approved',
            notesAr: 'انتقال مباشر غير صحيح إلى موافق عليه',
          })
          .expect(400);
      });

      it('should handle REQUIRES_CLARIFICATION status with detailed feedback', async () => {
        // Create another test document
        const clarificationDocData = {
          ...kycDocumentData,
          userId: testUser.id,
          governorateId: testGovernorate.id,
          titleEn: 'Clarification Test Document',
          titleAr: 'وثيقة اختبار توضيح',
          documentData: {
            ...kycDocumentData.documentData,
            documentNumber: 'CLARIF12345678901',
          },
        };

        const createResponse = await request(app.getHttpServer())
          .post('/api/v1/kyc/documents')
          .send(clarificationDocData)
          .expect(201);

        // Submit document
        await request(app.getHttpServer())
          .put(`/api/v1/kyc/documents/${createResponse.body.id}/status`)
          .send({
            status: SyrianKycStatus.SUBMITTED,
            notes: 'Document submitted',
            notesAr: 'تم تقديم الوثيقة',
          })
          .expect(200);

        // Move to under review
        await request(app.getHttpServer())
          .put(`/api/v1/kyc/documents/${createResponse.body.id}/status`)
          .send({
            status: SyrianKycStatus.UNDER_REVIEW,
            notes: 'Under review',
            notesAr: 'قيد المراجعة',
            reviewerId: testReviewer.id,
          })
          .expect(200);

        // Request clarification
        const clarificationResponse = await request(app.getHttpServer())
          .put(`/api/v1/kyc/documents/${createResponse.body.id}/status`)
          .send({
            status: SyrianKycStatus.REQUIRES_CLARIFICATION,
            notes: 'Document image quality is poor. Please provide clearer image.',
            notesAr: 'جودة صورة الوثيقة رديئة. يرجى تقديم صورة أوضح.',
            reviewerId: testReviewer.id,
            clarificationRequired: true,
            clarificationDetails: {
              issues: ['poor_image_quality', 'unclear_text'],
              requiredActions: [
                'Upload clearer image',
                'Ensure all text is readable',
              ],
              deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            },
          })
          .expect(200);

        expect(clarificationResponse.body.status).toBe(SyrianKycStatus.REQUIRES_CLARIFICATION);
        expect(clarificationResponse.body.reviewNotesAr).toContain('جودة');
        expect(clarificationResponse.body.slaTracking.isOverdue).toBe(false);
      });
    });

    describe('GET /api/v1/kyc/documents/:id/status-history', () => {
      it('should retrieve complete status history with Arabic notes', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/v1/kyc/documents/${testKycDocument.id}/status-history`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);

        // Verify status progression
        const statusHistory = response.body.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        expect(statusHistory[0].newStatus).toBe(SyrianKycStatus.SUBMITTED);

        // Verify Arabic localization in status logs
        const arabicLog = statusHistory.find(log => log.notesAr);
        if (arabicLog) {
          expect(arabicLog.notesAr).toBeDefined();
          expect(typeof arabicLog.notesAr).toBe('string');
        }

        // Verify metadata tracking
        const logWithMetadata = statusHistory.find(log => log.metadata);
        if (logWithMetadata) {
          expect(logWithMetadata.metadata).toBeDefined();
          expect(typeof logWithMetadata.metadata).toBe('object');
        }
      });
    });
  });

  describe('🌱 KYC Seeding Operations', () => {
    describe('POST /api/v1/seed/kyc/all', () => {
      it('should seed complete KYC system with comprehensive test data', async () => {
        const seedingConfig = {
          sampleDocuments: true,
          statusLogs: true,
          allWorkflowStates: true,
          bulkDocuments: 0,
          performanceTest: false,
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/seed/kyc/all')
          .send(seedingConfig)
          .expect(201);

        expect(response.body).toMatchObject({
          message: expect.stringContaining('KYC system seeded successfully'),
          stats: {
            documentsCreated: expect.any(Number),
            statusLogsCreated: expect.any(Number),
            workflowStatesCreated: expect.any(Number),
            totalExecutionTime: expect.any(Number),
            errors: [],
            warnings: expect.any(Array),
          },
          timestamp: expect.any(String),
        });

        // Verify seeded data exists
        expect(response.body.stats.documentsCreated).toBeGreaterThan(0);
        expect(response.body.stats.workflowStatesCreated).toBe(8); // All 8 workflow states
        expect(response.body.stats.totalExecutionTime).toBeGreaterThan(0);
      });

      it('should handle bulk KYC document seeding for performance testing', async () => {
        const bulkConfig = {
          sampleDocuments: false,
          statusLogs: false,
          allWorkflowStates: false,
          bulkDocuments: 50,
          performanceTest: true,
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/seed/kyc/all')
          .send(bulkConfig)
          .expect(201);

        expect(response.body.stats.documentsCreated).toBe(50);
        expect(response.body.stats.totalExecutionTime).toBeGreaterThan(0);

        // Verify performance metrics
        const averageTimePerDocument = response.body.stats.totalExecutionTime / 50;
        expect(averageTimePerDocument).toBeLessThan(100); // Should be less than 100ms per document
      });
    });

    describe('POST /api/v1/seed/kyc/documents', () => {
      it('should seed only sample KYC documents with Syrian localization', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/seed/kyc/documents')
          .expect(201);

        expect(response.body).toMatchObject({
          message: expect.stringContaining('Sample KYC documents seeded successfully'),
          count: expect.any(Number),
          executionTime: expect.any(Number),
          timestamp: expect.any(String),
        });

        // Verify documents were created
        const documentsResponse = await request(app.getHttpServer())
          .get('/api/v1/kyc/documents')
          .expect(200);

        const syrianIdDoc = documentsResponse.body.data.find(
          doc => doc.documentType === SyrianKycDocumentType.SYRIAN_ID && 
                 doc.titleAr.includes('البطاقة الشخصية'),
        );
        expect(syrianIdDoc).toBeDefined();
        expect(syrianIdDoc.documentData.nationalityAr).toBe('سوري');
      });
    });

    describe('POST /api/v1/seed/kyc/workflow-states', () => {
      it('should create documents in all 8 workflow states', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/seed/kyc/workflow-states')
          .expect(201);

        expect(response.body).toMatchObject({
          message: expect.stringContaining('workflow state documents seeded successfully'),
          count: 8, // All 8 workflow states
          executionTime: expect.any(Number),
          timestamp: expect.any(String),
        });

        // Verify all workflow states are represented
        const documentsResponse = await request(app.getHttpServer())
          .get('/api/v1/kyc/documents')
          .expect(200);

        const workflowStates = [
          SyrianKycStatus.DRAFT,
          SyrianKycStatus.SUBMITTED,
          SyrianKycStatus.UNDER_REVIEW,
          SyrianKycStatus.REQUIRES_CLARIFICATION,
          SyrianKycStatus.APPROVED,
          SyrianKycStatus.REJECTED,
          SyrianKycStatus.EXPIRED,
          SyrianKycStatus.SUSPENDED,
        ];

        workflowStates.forEach(status => {
          const docInStatus = documentsResponse.body.data.find(doc => doc.status === status);
          expect(docInStatus).toBeDefined();
          expect(docInStatus.titleAr).toContain(getArabicStatusDescription(status));
        });
      });
    });

    describe('POST /api/v1/seed/kyc/bulk', () => {
      it('should seed bulk documents with configurable count', async () => {
        const bulkCount = 25;
        const response = await request(app.getHttpServer())
          .post('/api/v1/seed/kyc/bulk')
          .send({ count: bulkCount })
          .expect(201);

        expect(response.body).toMatchObject({
          message: expect.stringContaining(`Successfully seeded ${bulkCount} bulk KYC documents`),
          documentsCreated: bulkCount,
          executionTime: expect.any(Number),
          averageTimePerDocument: expect.any(Number),
          timestamp: expect.any(String),
        });

        expect(response.body.averageTimePerDocument).toBeLessThan(50); // Performance check
      });

      it('should validate bulk count limits', async () => {
        await request(app.getHttpServer())
          .post('/api/v1/seed/kyc/bulk')
          .send({ count: 15000 }) // Exceeds limit
          .expect(500);
      });
    });

    describe('GET /api/v1/seed/kyc/stats', () => {
      it('should return comprehensive KYC seeding statistics', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/seed/kyc/stats')
          .expect(200);

        expect(response.body).toMatchObject({
          overview: {
            totalDocuments: expect.any(Number),
            statusLogs: expect.any(Number),
          },
          documentsByStatus: expect.any(Object),
          documentsByLevel: expect.any(Object),
          documentsByType: expect.any(Object),
          lastUpdated: expect.any(String),
        });

        // Verify status breakdown totals match
        const statusBreakdown = response.body.documentsByStatus;
        const totalFromBreakdown = Object.values(statusBreakdown).reduce(
          (sum: number, count: number) => sum + count,
          0,
        );
        expect(totalFromBreakdown).toBe(response.body.overview.totalDocuments);

        // Verify all verification levels are represented
        expect(response.body.documentsByLevel).toHaveProperty('basic');
        expect(response.body.documentsByLevel).toHaveProperty('business');
      });
    });

    describe('GET /api/v1/seed/kyc/verify', () => {
      it('should verify KYC data integrity after seeding', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/seed/kyc/verify')
          .expect(200);

        expect(response.body).toMatchObject({
          isValid: expect.any(Boolean),
          issues: expect.any(Array),
          summary: expect.any(Object),
          verificationTime: expect.any(Number),
          timestamp: expect.any(String),
        });

        // If valid, should have no issues
        if (response.body.isValid) {
          expect(response.body.issues).toHaveLength(0);
        }

        // Verification should complete quickly
        expect(response.body.verificationTime).toBeLessThan(5000); // Less than 5 seconds

        expect(response.body.summary.overview).toBeDefined();
      });
    });
  });

  describe('🔍 Advanced KYC Features', () => {
    it('should handle multi-currency document validation', async () => {
      const multiCurrencyDoc = {
        ...kycDocumentData,
        userId: testUser.id,
        governorateId: testGovernorate.id,
        titleEn: 'Multi-Currency Business License',
        titleAr: 'رخصة عمل متعددة العملات',
        documentType: SyrianKycDocumentType.BUSINESS_LICENSE,
        documentData: {
          ...kycDocumentData.documentData,
          businessName: 'Syrian Multi-Currency Exchange',
          businessNameAr: 'الصرافة السورية متعددة العملات',
          declaredCapital: {
            amountSYP: 50000000, // 50M SYP
            amountUSD: 20000,    // 20K USD
            amountEUR: 18000,    // 18K EUR
            exchangeRates: {
              SYPU: 2500,
              SYEU: 2750,
            },
          },
        },
        validationResults: {
          ...kycDocumentData.validationResults,
          currencyValidation: {
            capitalRequirementsMet: true,
            exchangeRatesValid: true,
            complianceLevel: 'HIGH',
          },
        },
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/kyc/documents')
        .send(multiCurrencyDoc)
        .expect(201);

      expect(response.body.documentData.businessNameAr).toContain('متعددة العملات');
      expect(response.body.documentData.declaredCapital).toBeDefined();
      expect(response.body.validationResults.currencyValidation).toBeDefined();
    });

    it('should support Syrian governorate filtering', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/kyc/documents')
        .query({ governorate: 'damascus' })
        .expect(200);

      expect(response.body.data).toBeDefined();
      if (response.body.data.length > 0) {
        response.body.data.forEach((doc) => {
          if (doc.governorate) {
            expect(doc.governorate.code).toBe('damascus');
          }
        });
      }
    });

    it('should handle SLA monitoring and escalation', async () => {
      // Create document with overdue SLA
      const overdueDoc = {
        ...kycDocumentData,
        userId: testUser.id,
        governorateId: testGovernorate.id,
        titleEn: 'Overdue SLA Test Document',
        titleAr: 'وثيقة اختبار SLA متأخرة',
        status: SyrianKycStatus.UNDER_REVIEW,
        slaTracking: {
          slaHours: 72,
          expectedReviewTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
          isOverdue: true,
          hoursOverdue: 24,
          escalationLevel: 1,
          processingTime: null,
          onTimeProcessing: false,
          delayReasons: ['HIGH_WORKLOAD', 'COMPLEXITY'],
        },
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/kyc/documents')
        .send(overdueDoc)
        .expect(201);

      expect(response.body.slaTracking.isOverdue).toBe(true);
      expect(response.body.slaTracking.hoursOverdue).toBe(24);
      expect(response.body.slaTracking.escalationLevel).toBe(1);
      expect(response.body.slaTracking.delayReasons).toContain('HIGH_WORKLOAD');
    });

    it('should search KYC documents by Arabic text', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/kyc/documents')
        .query({ search: 'دمشق' }) // Search for "Damascus" in Arabic
        .expect(200);

      expect(response.body.data).toBeDefined();
      if (response.body.data.length > 0) {
        const foundArabicDoc = response.body.data.some(
          doc => 
            doc.titleAr.includes('دمشق') || 
            doc.documentData?.placeOfBirthAr?.includes('دمشق') ||
            doc.addressInfo?.addressLine1Ar?.includes('دمشق')
        );
        expect(foundArabicDoc).toBe(true);
      }
    });
  });

  describe('⚡ Performance and Scalability', () => {
    it('should handle large dataset queries efficiently', async () => {
      const startTime = Date.now();

      const response = await request(app.getHttpServer())
        .get('/api/v1/kyc/documents')
        .query({ limit: 100 })
        .expect(200);

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      // Query should complete within 2 seconds
      expect(queryTime).toBeLessThan(2000);
      expect(response.body.data).toBeDefined();
    });

    it('should provide KYC compliance analytics', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/kyc/analytics/compliance')
        .expect(200);

      expect(response.body).toMatchObject({
        complianceOverview: expect.any(Object),
        riskDistribution: expect.any(Object),
        processingMetrics: expect.any(Object),
        regulatoryFlags: expect.any(Array),
      });
    });
  });

  describe('🔧 Error Handling and Edge Cases', () => {
    it('should handle malformed document data gracefully', async () => {
      const malformedData = {
        documentType: 'invalid_type',
        fileDetails: 'not an object',
        validationResults: ['should be object'],
      };

      await request(app.getHttpServer())
        .post('/api/v1/kyc/documents')
        .send(malformedData)
        .expect(400);
    });

    it('should return proper error messages for Arabic content', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/kyc/documents')
        .send({})
        .set('Accept-Language', 'ar')
        .expect(400);

      // Should still return valid error structure
      expect(response.body).toHaveProperty('message');
    });

    it('should handle concurrent status updates safely', async () => {
      if (testKycDocument) {
        // Create multiple concurrent update requests
        const updatePromises = Array.from({ length: 5 }, (_, i) =>
          request(app.getHttpServer())
            .put(`/api/v1/kyc/documents/${testKycDocument.id}/status`)
            .send({
              status: SyrianKycStatus.UNDER_REVIEW,
              notes: `Concurrent update ${i}`,
              notesAr: `تحديث متزامن ${i}`,
            }),
        );

        const results = await Promise.allSettled(updatePromises);

        // At least one should succeed, others might fail with conflict
        const successful = results.filter((r) => r.status === 'fulfilled');
        expect(successful.length).toBeGreaterThan(0);
      }
    });
  });

  // Helper function to get Arabic status descriptions
  function getArabicStatusDescription(status: SyrianKycStatus): string {
    const statusMap = {
      [SyrianKycStatus.DRAFT]: 'المسودة',
      [SyrianKycStatus.SUBMITTED]: 'مُقدم',
      [SyrianKycStatus.UNDER_REVIEW]: 'قيد المراجعة',
      [SyrianKycStatus.REQUIRES_CLARIFICATION]: 'توضيح',
      [SyrianKycStatus.APPROVED]: 'موافق عليه',
      [SyrianKycStatus.REJECTED]: 'مرفوض',
      [SyrianKycStatus.EXPIRED]: 'منتهي الصلاحية',
      [SyrianKycStatus.SUSPENDED]: 'معلق',
    };
    return statusMap[status] || status;
  }
});