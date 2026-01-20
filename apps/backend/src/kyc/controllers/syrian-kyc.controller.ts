/**
 * @file syrian-kyc.controller.ts
 * @description Enterprise Syrian KYC Controller with Comprehensive APIs
 *
 * ENDPOINTS:
 * - KYC document submission with Syrian localization
 * - Document review and approval workflows
 * - Compliance tracking and analytics
 * - Bulk operations for admin efficiency
 * - Syrian regulatory compliance features
 * - Performance monitoring and SLA tracking
 * - Arabic/English localized responses
 *
 * @author SouqSyria Development Team
 * @since 2025-08-09
 * @version 2.0.0 - Enterprise Edition
 */

import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';

import { SyrianKycService } from '../services/syrian-kyc.service';
import {
  SyrianKycWorkflowService,
  KycSLAMonitoring,
  KycWorkflowMetrics,
} from '../services/syrian-kyc-workflow.service';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../access-control/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserFromToken } from '../../common/interfaces/user-from-token.interface';

import {
  SubmitSyrianKycDto,
  ReviewSyrianKycDto,
  KycDocumentQueryDto,
} from '../dto/submit-syrian-kyc.dto';
import {
  SyrianKycStatus,
  SyrianKycDocumentType,
} from '../enums/syrian-kyc.enums';

/**
 * Bulk operations DTO
 */
class BulkKycActionDto {
  /**
   * Array of KYC document IDs to process
   */
  documentIds: number[];

  /**
   * Target status for bulk operation
   */
  targetStatus: SyrianKycStatus;

  /**
   * Reason for bulk action (English)
   */
  reason?: string;

  /**
   * Reason for bulk action (Arabic)
   */
  reasonAr?: string;
}

@ApiTags('🔐 Syrian KYC & Compliance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('syrian-kyc')
export class SyrianKycController {
  private readonly logger = new Logger(SyrianKycController.name);

  constructor(
    private readonly kycService: SyrianKycService,
    private readonly workflowService: SyrianKycWorkflowService,
  ) {}

  /**
   * SUBMIT KYC DOCUMENT
   *
   * Submits a new KYC document with Syrian localization and compliance validation
   */
  @Post()
  @ApiOperation({
    summary: 'Submit KYC document for verification',
    description:
      'Submit a new KYC document with Syrian regulatory compliance validation, Arabic localization support, and automated workflow initialization',
  })
  @ApiBody({
    type: SubmitSyrianKycDto,
    description: 'KYC document submission data with Syrian localization',
    examples: {
      syrianId: {
        summary: 'Submit Syrian National ID',
        value: {
          documentType: 'syrian_id',
          titleEn: 'Syrian National Identity Card',
          titleAr: 'البطاقة الشخصية السورية',
          verificationLevel: 'basic',
          fileDetails: {
            originalUrl: 'https://storage.souqsyria.com/kyc/syrian_id_123.jpg',
            fileName: 'syrian_national_id.jpg',
            fileSize: 2048576,
            mimeType: 'image/jpeg',
            checksum: 'sha256:abc123...',
          },
          documentData: {
            documentNumber: '12345678901',
            fullName: 'أحمد محمد الأحمد',
            fullNameEn: 'Ahmad Mohammed Al-Ahmad',
            dateOfBirth: '1990-01-15',
            placeOfBirth: 'دمشق',
            placeOfBirthEn: 'Damascus',
            nationality: 'سوري',
            nationalityEn: 'Syrian',
            issueDate: '2020-01-01',
            expiryDate: '2030-01-01',
          },
          governorateId: 1,
          priority: 'NORMAL',
        },
      },
      businessLicense: {
        summary: 'Submit Business License',
        value: {
          documentType: 'business_license',
          titleEn: 'Business Operating License',
          titleAr: 'رخصة مزاولة النشاط التجاري',
          verificationLevel: 'business',
          fileDetails: {
            originalUrl:
              'https://storage.souqsyria.com/kyc/business_license_456.pdf',
            fileName: 'business_license.pdf',
            fileSize: 1024000,
            mimeType: 'application/pdf',
          },
          documentData: {
            businessName: 'شركة التجارة السورية المحدودة',
            businessNameEn: 'Syrian Trading Company Ltd.',
            registrationNumber: 'REG-2025-001234',
            taxId: 'TAX-SYR-987654321',
            issueDate: '2025-01-01',
            expiryDate: '2026-01-01',
          },
          priority: 'HIGH',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'KYC document submitted successfully',
    schema: {
      example: {
        id: 1001,
        documentType: 'syrian_id',
        titleEn: 'Syrian National Identity Card',
        titleAr: 'البطاقة الشخصية السورية',
        status: 'submitted',
        statusAr: 'مُقدم للمراجعة',
        verificationLevel: 'basic',
        priority: 'NORMAL',
        fileDetails: {
          originalUrl: 'https://storage.souqsyria.com/kyc/syrian_id_123.jpg',
          fileName: 'syrian_national_id.jpg',
          fileSize: 2048576,
        },
        workflow: {
          currentStatus: 'submitted',
          expectedReviewTime: '2025-08-12T10:00:00.000Z',
          slaHours: 72,
        },
        createdAt: '2025-08-09T10:00:00.000Z',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid document data or validation errors',
    schema: {
      examples: {
        invalidFileType: {
          summary: 'Invalid File Type',
          value: {
            message:
              'File type image/gif is not supported. Allowed types: image/jpeg, image/png, application/pdf',
            error: 'Bad Request',
            statusCode: 400,
          },
        },
        fileTooLarge: {
          summary: 'File Too Large',
          value: {
            message: 'File size cannot exceed 50MB',
            error: 'Bad Request',
            statusCode: 400,
          },
        },
      },
    },
  })
  @ApiConflictResponse({
    description: 'Document already exists for this type',
    schema: {
      example: {
        message:
          'You already have an active syrian_id document. Please wait for review completion.',
        error: 'Conflict',
        statusCode: 409,
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated',
  })
  @ApiForbiddenResponse({
    description: 'User does not have permission to submit KYC documents',
  })
  async submitKycDocument(
    @CurrentUser() user: UserFromToken,
    @Body() submitDto: SubmitSyrianKycDto,
  ) {
    this.logger.log(
      `User ${user.id} submitting KYC document: ${submitDto.documentType}`,
    );

    const document = await this.kycService.submitKycDocument(
      user as any,
      submitDto,
      // In real implementation, extract from request
      '192.168.1.1', // clientIp
      'Mozilla/5.0...', // userAgent
    );

    return {
      id: document.id,
      documentType: document.documentType,
      titleEn: document.titleEn,
      titleAr: document.titleAr,
      status: document.status,
      statusAr: this.getStatusNameAr(document.status),
      verificationLevel: document.verificationLevel,
      priority: document.priority,
      fileDetails: {
        originalUrl: document.fileDetails.originalUrl,
        fileName: document.fileDetails.fileName,
        fileSize: document.fileDetails.fileSize,
      },
      workflow: {
        currentStatus: document.status,
        expectedReviewTime: new Date(Date.now() + 72 * 60 * 60 * 1000), // 72 hours
        slaHours: 72,
      },
      createdAt: document.createdAt,
    };
  }

  /**
   * GET USER KYC DOCUMENTS
   *
   * Retrieves all KYC documents for the authenticated user
   */
  @Get('my-documents')
  @ApiOperation({
    summary: 'Get user KYC documents',
    description:
      'Retrieve all KYC documents for the authenticated user with status history and compliance summary',
  })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Include soft-deleted documents',
    example: false,
  })
  @ApiOkResponse({
    description: 'User KYC documents retrieved successfully',
    schema: {
      example: {
        documents: [
          {
            id: 1001,
            documentType: 'syrian_id',
            titleEn: 'Syrian National Identity Card',
            titleAr: 'البطاقة الشخصية السورية',
            status: 'approved',
            statusAr: 'موافق عليه',
            verificationLevel: 'basic',
            reviewedAt: '2025-08-10T14:30:00.000Z',
            reviewNotes: 'Document approved successfully',
            reviewNotesAr: 'تمت الموافقة على الوثيقة بنجاح',
            createdAt: '2025-08-09T10:00:00.000Z',
          },
        ],
        complianceSummary: {
          overallStatus: 'APPROVED',
          complianceScore: 100,
          documentsRequired: 2,
          documentsApproved: 2,
          riskLevel: 'LOW',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated',
  })
  async getUserKycDocuments(
    @CurrentUser() user: UserFromToken,
    @Query('includeInactive') includeInactive: boolean = false,
  ) {
    this.logger.log(`User ${user.id} retrieving KYC documents`);

    const documents = await this.kycService.getUserKycDocuments(
      user.id,
      includeInactive,
    );
    const complianceSummary = await this.kycService.getUserKycComplianceSummary(
      user.id,
    );

    return {
      documents: documents.map((doc) => ({
        id: doc.id,
        documentType: doc.documentType,
        titleEn: doc.titleEn,
        titleAr: doc.titleAr,
        status: doc.status,
        statusAr: this.getStatusNameAr(doc.status),
        verificationLevel: doc.verificationLevel,
        priority: doc.priority,
        reviewedAt: doc.reviewedAt,
        reviewNotes: doc.reviewNotes,
        reviewNotesAr: doc.reviewNotesAr,
        expiresAt: doc.expiresAt,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      })),
      complianceSummary,
    };
  }

  /**
   * GET KYC DOCUMENT DETAILS
   *
   * Retrieves detailed information about a specific KYC document
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get KYC document details',
    description:
      'Retrieve comprehensive details of a specific KYC document including status history and workflow information',
  })
  @ApiParam({
    name: 'id',
    description: 'KYC document ID',
    example: 1001,
  })
  @ApiOkResponse({
    description: 'KYC document details retrieved successfully',
    schema: {
      example: {
        id: 1001,
        documentType: 'syrian_id',
        titleEn: 'Syrian National Identity Card',
        titleAr: 'البطاقة الشخصية السورية',
        status: 'under_review',
        statusAr: 'قيد المراجعة',
        verificationLevel: 'basic',
        fileDetails: {
          originalUrl: 'https://storage.souqsyria.com/kyc/syrian_id_123.jpg',
          fileName: 'syrian_national_id.jpg',
          fileSize: 2048576,
        },
        documentData: {
          fullName: 'أحمد محمد الأحمد',
          documentNumber: '12345678901',
          issueDate: '2020-01-01',
          expiryDate: '2030-01-01',
        },
        slaTracking: {
          slaHours: 72,
          expectedReviewTime: '2025-08-12T10:00:00.000Z',
          isOverdue: false,
          escalationLevel: 0,
        },
        statusHistory: [
          {
            status: 'submitted',
            statusAr: 'مُقدم للمراجعة',
            changedAt: '2025-08-09T10:00:00.000Z',
          },
          {
            status: 'under_review',
            statusAr: 'قيد المراجعة',
            changedAt: '2025-08-09T14:00:00.000Z',
          },
        ],
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'KYC document not found',
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated',
  })
  async getKycDocumentById(
    @CurrentUser() user: UserFromToken,
    @Param('id', ParseIntPipe) id: number,
  ) {
    this.logger.log(`User ${user.id} retrieving KYC document ${id}`);

    const document = await this.kycService.getKycDocumentById(id);

    // Check if user owns the document or is admin
    if (document.user.id !== user.id) {
      // TODO: Check admin permissions
      throw new NotFoundException('KYC document not found');
    }

    return {
      id: document.id,
      documentType: document.documentType,
      titleEn: document.titleEn,
      titleAr: document.titleAr,
      status: document.status,
      statusAr: this.getStatusNameAr(document.status),
      verificationLevel: document.verificationLevel,
      priority: document.priority,
      fileDetails: document.fileDetails,
      documentData: document.documentData,
      addressInfo: document.addressInfo,
      slaTracking: document.slaTracking,
      reviewNotes: document.reviewNotes,
      reviewNotesAr: document.reviewNotesAr,
      reviewedAt: document.reviewedAt,
      expiresAt: document.expiresAt,
      statusHistory: document.statusLogs?.map((log) => ({
        status: log.toStatus,
        statusAr: this.getStatusNameAr(log.toStatus),
        descriptionEn: log.descriptionEn,
        descriptionAr: log.descriptionAr,
        changedAt: log.createdAt,
      })),
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    };
  }

  /**
   * ADMIN: SEARCH KYC DOCUMENTS
   *
   * Advanced search and filtering for KYC documents (admin only)
   */
  @Get('admin/search')
  @ApiOperation({
    summary: 'Search KYC documents (Admin)',
    description:
      'Advanced search and filtering of KYC documents with comprehensive filters, pagination, and sorting',
  })
  @ApiQuery({
    name: 'documentType',
    required: false,
    enum: SyrianKycDocumentType,
    description: 'Filter by document type',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: SyrianKycStatus,
    description: 'Filter by document status',
  })
  @ApiQuery({
    name: 'overdueOnly',
    required: false,
    type: Boolean,
    description: 'Show only overdue documents',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
    example: 10,
  })
  @ApiOkResponse({
    description: 'KYC documents search results',
    schema: {
      example: {
        documents: [
          {
            id: 1001,
            user: {
              id: 501,
              email: 'ahmad@example.com',
              fullName: 'Ahmad Al-Syrian',
            },
            documentType: 'syrian_id',
            status: 'under_review',
            priority: 'NORMAL',
            createdAt: '2025-08-09T10:00:00.000Z',
            slaStatus: 'ON_TIME',
          },
        ],
        pagination: {
          total: 150,
          page: 1,
          limit: 10,
          totalPages: 15,
        },
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'User does not have admin permissions',
  })
  async searchKycDocuments(
    @CurrentUser() user: UserFromToken,
    @Query() queryDto: KycDocumentQueryDto,
  ) {
    this.logger.log(`Admin ${user.id} searching KYC documents`);

    const result = await this.kycService.searchKycDocuments(queryDto);

    return {
      documents: result.documents.map((doc) => ({
        id: doc.id,
        user: {
          id: doc.user.id,
          email: doc.user.email,
          fullName: doc.user.fullName,
        },
        documentType: doc.documentType,
        titleEn: doc.titleEn,
        titleAr: doc.titleAr,
        status: doc.status,
        statusAr: this.getStatusNameAr(doc.status),
        priority: doc.priority,
        verificationLevel: doc.verificationLevel,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        slaStatus: this.calculateSlaStatus(doc),
      })),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  /**
   * ADMIN: REVIEW KYC DOCUMENT
   *
   * Review and approve/reject KYC documents
   */
  @Put('admin/:id/review')
  @ApiOperation({
    summary: 'Review KYC document (Admin)',
    description:
      'Approve or reject a KYC document with detailed review notes in Arabic and English',
  })
  @ApiParam({
    name: 'id',
    description: 'KYC document ID to review',
    example: 1001,
  })
  @ApiBody({
    type: ReviewSyrianKycDto,
    description: 'Review decision and notes',
    examples: {
      approve: {
        summary: 'Approve Document',
        value: {
          status: 'approved',
          reviewNotes:
            'Document verified successfully. All information is accurate.',
          reviewNotesAr: 'تم التحقق من الوثيقة بنجاح. جميع المعلومات دقيقة.',
          sendNotification: true,
        },
      },
      reject: {
        summary: 'Reject Document',
        value: {
          status: 'rejected',
          reviewNotes:
            'Document image is not clear. Please resubmit with better quality.',
          reviewNotesAr:
            'صورة الوثيقة غير واضحة. يرجى إعادة التقديم بجودة أفضل.',
          sendNotification: true,
        },
      },
      clarification: {
        summary: 'Request Clarification',
        value: {
          status: 'requires_clarification',
          reviewNotes:
            'Please provide additional documentation to verify your address.',
          reviewNotesAr: 'يرجى تقديم وثائق إضافية للتحقق من عنوانك.',
          sendNotification: true,
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'KYC document reviewed successfully',
    schema: {
      example: {
        id: 1001,
        status: 'approved',
        statusAr: 'موافق عليه',
        reviewNotes: 'Document verified successfully',
        reviewNotesAr: 'تم التحقق من الوثيقة بنجاح',
        reviewedAt: '2025-08-10T14:30:00.000Z',
        reviewedBy: {
          id: 1,
          email: 'admin@souqsyria.com',
        },
        workflow: {
          previousStatus: 'under_review',
          currentStatus: 'approved',
          processingTime: 28.5,
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'KYC document not found',
  })
  @ApiBadRequestResponse({
    description: 'Invalid review status or document not in reviewable state',
  })
  @ApiForbiddenResponse({
    description: 'User does not have admin permissions',
  })
  async reviewKycDocument(
    @CurrentUser() user: UserFromToken,
    @Param('id', ParseIntPipe) id: number,
    @Body() reviewDto: ReviewSyrianKycDto,
  ) {
    this.logger.log(
      `Admin ${user.id} reviewing KYC document ${id}: ${reviewDto.status}`,
    );

    const document = await this.kycService.reviewKycDocument(
      id,
      reviewDto,
      user.id,
    );

    return {
      id: document.id,
      status: document.status,
      statusAr: this.getStatusNameAr(document.status),
      reviewNotes: document.reviewNotes,
      reviewNotesAr: document.reviewNotesAr,
      reviewedAt: document.reviewedAt,
      reviewedBy: document.reviewedBy
        ? {
            id: document.reviewedBy.id,
            email: document.reviewedBy.email,
          }
        : null,
      workflow: {
        currentStatus: document.status,
        processingTime: this.calculateProcessingTime(document),
      },
    };
  }

  /**
   * ADMIN: BULK OPERATIONS
   *
   * Perform bulk operations on multiple KYC documents
   */
  @Put('admin/bulk-action')
  @ApiOperation({
    summary: 'Bulk KYC operations (Admin)',
    description:
      'Perform bulk approve/reject operations on multiple KYC documents for administrative efficiency',
  })
  @ApiBody({
    description: 'Bulk action parameters',
    schema: {
      type: 'object',
      properties: {
        documentIds: {
          type: 'array',
          items: { type: 'number' },
          example: [1001, 1002, 1003],
        },
        targetStatus: {
          type: 'string',
          enum: ['approved', 'rejected'],
          example: 'approved',
        },
        reason: {
          type: 'string',
          example: 'Bulk approval after verification',
        },
        reasonAr: {
          type: 'string',
          example: 'موافقة جماعية بعد التحقق',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Bulk operation completed',
    schema: {
      example: {
        results: {
          successful: [1001, 1002],
          failed: [
            {
              id: 1003,
              error: 'Document already approved',
            },
          ],
        },
        summary: {
          total: 3,
          successful: 2,
          failed: 1,
          successRate: 67,
        },
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'User does not have admin permissions',
  })
  async bulkKycAction(
    @CurrentUser() user: UserFromToken,
    @Body() bulkDto: BulkKycActionDto,
  ) {
    this.logger.log(
      `Admin ${user.id} performing bulk KYC action on ${bulkDto.documentIds.length} documents`,
    );

    const results = await this.workflowService.bulkTransition(
      bulkDto.documentIds,
      bulkDto.targetStatus,
      user.id,
      bulkDto.reason,
      bulkDto.reasonAr,
    );

    return {
      results,
      summary: {
        total: bulkDto.documentIds.length,
        successful: results.successful.length,
        failed: results.failed.length,
        successRate: Math.round(
          (results.successful.length / bulkDto.documentIds.length) * 100,
        ),
      },
    };
  }

  /**
   * ADMIN: WORKFLOW ANALYTICS
   *
   * Get KYC workflow performance metrics and analytics
   */
  @Get('admin/analytics/workflow')
  @ApiOperation({
    summary: 'Get KYC workflow analytics (Admin)',
    description:
      'Comprehensive analytics including processing times, bottlenecks, SLA compliance, and performance metrics',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    description: 'Number of days to analyze',
    example: 30,
  })
  @ApiQuery({
    name: 'documentType',
    required: false,
    enum: SyrianKycDocumentType,
    description: 'Filter by specific document type',
  })
  @ApiOkResponse({
    description: 'KYC workflow analytics retrieved successfully',
    schema: {
      example: {
        metrics: {
          totalDocuments: 1250,
          averageProcessingTime: 18.5,
          slaViolations: 45,
          slaComplianceRate: 96.4,
          statusDistribution: {
            submitted: 15,
            under_review: 25,
            approved: 890,
            rejected: 120,
          },
          bottlenecks: [
            {
              status: 'under_review',
              averageStayTime: 32.5,
              documentCount: 145,
            },
          ],
          performanceByType: [
            {
              documentType: 'syrian_id',
              averageTime: 16.2,
              approvalRate: 94.5,
            },
          ],
        },
        period: {
          startDate: '2025-07-10T00:00:00.000Z',
          endDate: '2025-08-09T23:59:59.000Z',
          days: 30,
        },
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'User does not have admin permissions',
  })
  async getKycWorkflowAnalytics(
    @CurrentUser() user: UserFromToken,
    @Query('days') days: number = 30,
    @Query('documentType') documentType?: SyrianKycDocumentType,
  ): Promise<{ metrics: KycWorkflowMetrics; period: any }> {
    this.logger.log(`Admin ${user.id} requesting KYC workflow analytics`);

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    const metrics = await this.workflowService.getWorkflowMetrics(
      startDate,
      endDate,
      documentType,
    );

    return {
      metrics,
      period: {
        startDate,
        endDate,
        days,
      },
    };
  }

  /**
   * ADMIN: OVERDUE DOCUMENTS
   *
   * Get list of KYC documents that are overdue for review
   */
  @Get('admin/analytics/overdue')
  @ApiOperation({
    summary: 'Get overdue KYC documents (Admin)',
    description:
      'List of KYC documents that have exceeded their SLA timeframes and require attention',
  })
  @ApiOkResponse({
    description: 'Overdue KYC documents retrieved successfully',
    schema: {
      example: {
        overdueDocuments: [
          {
            documentId: 1001,
            user: {
              id: 501,
              email: 'ahmad@example.com',
            },
            documentType: 'syrian_id',
            currentStatus: 'under_review',
            hoursOverdue: 6,
            escalationLevel: 1,
            slaHours: 72,
          },
        ],
        summary: {
          total: 12,
          level1Escalation: 8,
          level2Escalation: 3,
          level3Escalation: 1,
        },
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'User does not have admin permissions',
  })
  async getOverdueKycDocuments(@CurrentUser() user: UserFromToken): Promise<{
    overdueDocuments: Array<any>;
    summary: {
      total: number;
      level1Escalation: number;
      level2Escalation: number;
      level3Escalation: number;
    };
  }> {
    this.logger.log(`Admin ${user.id} requesting overdue KYC documents`);

    const overdueDocuments = await this.workflowService.getOverdueDocuments();

    const summary = {
      total: overdueDocuments.length,
      level1Escalation: overdueDocuments.filter((d) => d.escalationLevel === 1)
        .length,
      level2Escalation: overdueDocuments.filter((d) => d.escalationLevel === 2)
        .length,
      level3Escalation: overdueDocuments.filter((d) => d.escalationLevel === 3)
        .length,
    };

    return {
      overdueDocuments: overdueDocuments.map((doc) => ({
        documentId: doc.documentId,
        currentStatus: doc.currentStatus,
        hoursOverdue: doc.hoursOverdue,
        escalationLevel: doc.escalationLevel,
        slaHours: doc.slaHours,
      })),
      summary,
    };
  }

  /**
   * DELETE KYC DOCUMENT
   *
   * Soft delete a KYC document (user can only delete their own drafts)
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete KYC document',
    description:
      'Soft delete a KYC document. Users can only delete their own documents that are not approved.',
  })
  @ApiParam({
    name: 'id',
    description: 'KYC document ID to delete',
    example: 1001,
  })
  @ApiOkResponse({
    description: 'KYC document deleted successfully',
    schema: {
      example: {
        message: 'KYC document deleted successfully',
        deletedDocumentId: 1001,
        deletedAt: '2025-08-09T15:30:00.000Z',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'KYC document not found',
  })
  @ApiBadRequestResponse({
    description:
      'Cannot delete approved documents or documents belonging to other users',
  })
  async deleteKycDocument(
    @CurrentUser() user: UserFromToken,
    @Param('id', ParseIntPipe) id: number,
  ) {
    this.logger.log(`User ${user.id} deleting KYC document ${id}`);

    await this.kycService.deleteKycDocument(id, user.id);

    return {
      message: 'KYC document deleted successfully',
      deletedDocumentId: id,
      deletedAt: new Date(),
    };
  }

  /**
   * PRIVATE HELPER METHODS
   */

  private getStatusNameAr(status: SyrianKycStatus): string {
    const statusNames: Record<SyrianKycStatus, string> = {
      [SyrianKycStatus.DRAFT]: 'مسودة',
      [SyrianKycStatus.SUBMITTED]: 'مُقدم للمراجعة',
      [SyrianKycStatus.UNDER_REVIEW]: 'قيد المراجعة',
      [SyrianKycStatus.REQUIRES_CLARIFICATION]: 'يحتاج توضيح',
      [SyrianKycStatus.APPROVED]: 'موافق عليه',
      [SyrianKycStatus.REJECTED]: 'مرفوض',
      [SyrianKycStatus.EXPIRED]: 'منتهي الصلاحية',
      [SyrianKycStatus.SUSPENDED]: 'معلق',
    };

    return statusNames[status] || status;
  }

  private calculateSlaStatus(
    document: any,
  ): 'ON_TIME' | 'OVERDUE' | 'CRITICAL' {
    if (!document.slaTracking) return 'ON_TIME';

    if (document.slaTracking.isOverdue) {
      return document.slaTracking.escalationLevel >= 2 ? 'CRITICAL' : 'OVERDUE';
    }

    return 'ON_TIME';
  }

  private calculateProcessingTime(document: any): number {
    const created = new Date(document.createdAt).getTime();
    const updated = new Date(document.updatedAt).getTime();
    return Math.round(((updated - created) / (1000 * 60 * 60)) * 10) / 10; // Hours with 1 decimal
  }
}
