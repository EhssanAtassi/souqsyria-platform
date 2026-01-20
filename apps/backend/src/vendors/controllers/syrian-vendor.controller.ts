/**
 * @file syrian-vendor.controller.ts
 * @description Enterprise Syrian Vendor Management Controller
 *
 * ENDPOINTS:
 * - Comprehensive vendor CRUD operations with Syrian localization
 * - Advanced workflow management (9-state verification process)
 * - Performance monitoring and analytics
 * - SLA monitoring and compliance tracking
 * - Bulk operations for enterprise management
 * - Real-time vendor search and filtering
 * - Syrian business compliance and regulatory features
 * - Full Arabic/English bilingual support
 *
 * @author SouqSyria Development Team
 * @since 2025-08-10
 * @version 2.0.0 - Enterprise Edition
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
  ParseIntPipe,
  BadRequestException,
  NotFoundException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
  ApiParam,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';

// Services
import { VendorsService } from '../vendors.service';
import { SyrianVendorWorkflowService } from '../services/syrian-vendor-workflow.service';

// Guards and Decorators
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../access-control/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserFromToken } from '../../common/interfaces/user-from-token.interface';

// DTOs
import {
  CreateSyrianVendorDto,
  UpdateSyrianVendorDto,
  VendorWorkflowActionDto,
  VendorAnalyticsQueryDto,
  VendorSearchQueryDto,
  BulkVendorActionDto,
} from '../dto/syrian-vendor.dto';

// Entities
import { SyrianVendorVerificationStatus } from '../entities/syrian-vendor.entity';

@ApiTags('🏪 Syrian Vendor Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('syrian-vendors')
export class SyrianVendorController {
  private readonly logger = new Logger(SyrianVendorController.name);

  constructor(
    private readonly vendorsService: VendorsService,
    private readonly workflowService: SyrianVendorWorkflowService,
  ) {}

  /**
   * CREATE VENDOR
   *
   * Register a new Syrian vendor with comprehensive business information
   */
  @Post()
  @ApiOperation({
    summary: 'Create new Syrian vendor',
    description:
      'Register a new vendor with comprehensive Syrian business information, bilingual support, and regulatory compliance',
  })
  @ApiBody({
    type: CreateSyrianVendorDto,
    description: 'Vendor creation data with Syrian localization',
  })
  @ApiCreatedResponse({
    description: 'Vendor created successfully',
    schema: {
      example: {
        id: 123,
        storeNameEn: 'Damascus Electronics Store',
        storeNameAr: 'متجر دمشق للإلكترونيات',
        verificationStatus: 'draft',
        businessType: 'limited_liability',
        vendorCategory: 'retailer',
        governorate: {
          id: 1,
          nameEn: 'Damascus',
          nameAr: 'دمشق',
        },
        qualityScore: 70,
        isActive: false,
        verificationProgress: 85,
        createdAt: '2025-08-10T10:00:00.000Z',
        nextActions: [
          'Complete document upload',
          'Submit for verification',
          'Wait for admin review',
        ],
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid vendor data or validation errors',
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated',
  })
  async createVendor(
    @CurrentUser() user: UserFromToken,
    @Body() createVendorDto: CreateSyrianVendorDto,
  ) {
    this.logger.log(
      `User ${user.id} creating Syrian vendor: ${createVendorDto.storeNameEn}`,
    );

    const vendor =
      await this.vendorsService.createSyrianVendor(createVendorDto);

    return {
      ...vendor,
      verificationProgress: vendor.getVerificationProgress(),
      formattedRevenue: vendor.getFormattedRevenue(),
      nextActions: this.getNextActionsForStatus(vendor.verificationStatus),
      localization: {
        storeName: vendor.getStoreName(
          createVendorDto.preferredLanguage || 'both',
        ),
        storeDescription: vendor.getStoreDescription(
          createVendorDto.preferredLanguage || 'both',
        ),
        verificationStatus: vendor.getVerificationStatusLocalized('en'),
        verificationStatusAr: vendor.getVerificationStatusLocalized('ar'),
      },
    };
  }

  /**
   * GET VENDOR BY ID
   *
   * Retrieve detailed vendor information with localization support
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get vendor by ID',
    description:
      'Retrieve detailed Syrian vendor information with Arabic/English localization and performance metrics',
  })
  @ApiParam({
    name: 'id',
    description: 'Vendor ID',
    type: 'integer',
    example: 123,
  })
  @ApiQuery({
    name: 'language',
    required: false,
    enum: ['en', 'ar', 'both'],
    description: 'Response language preference',
    example: 'both',
  })
  @ApiQuery({
    name: 'includePerformanceMetrics',
    required: false,
    type: Boolean,
    description: 'Include detailed performance metrics',
    example: true,
  })
  @ApiOkResponse({
    description: 'Vendor information retrieved successfully',
    schema: {
      example: {
        id: 123,
        storeNameEn: 'Damascus Electronics Store',
        storeNameAr: 'متجر دمشق للإلكترونيات',
        verificationStatus: 'verified',
        businessType: 'limited_liability',
        vendorCategory: 'retailer',
        governorate: {
          id: 1,
          nameEn: 'Damascus',
          nameAr: 'دمشق',
        },
        qualityScore: 87.5,
        totalOrders: 1250,
        totalRevenueSyp: 18750000,
        customerSatisfactionRating: 4.3,
        fulfillmentRate: 94.2,
        returnRate: 3.1,
        performanceGrade: 'B+',
        verificationProgress: 100,
        isActive: true,
        createdAt: '2025-07-01T10:00:00.000Z',
        verificationCompletedAt: '2025-07-05T14:30:00.000Z',
        localization: {
          storeName: {
            en: 'Damascus Electronics Store',
            ar: 'متجر دمشق للإلكترونيات',
          },
          storeDescription: {
            en: 'Leading electronics retailer in Damascus',
            ar: 'متجر إلكترونيات رائد في دمشق',
          },
          verificationStatus: 'Verified',
          verificationStatusAr: 'موثق',
        },
        formattedRevenue: {
          syp: '18,750,000 SYP',
          usd: '$1,250.00',
          formatted: '١٨٬٧٥٠٬٠٠٠ ل.س',
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Vendor not found',
  })
  async getVendorById(
    @Param('id', ParseIntPipe) id: number,
    @Query('language') language: 'en' | 'ar' | 'both' = 'both',
    @Query('includePerformanceMetrics')
    includePerformanceMetrics: boolean = false,
  ) {
    this.logger.log(
      `Retrieving Syrian vendor ${id} with language: ${language}`,
    );

    const vendor = await this.vendorsService.findSyrianVendorById(id);

    if (!vendor) {
      throw new NotFoundException(`Vendor with ID ${id} not found`);
    }

    let performanceMetrics = null;
    if (includePerformanceMetrics) {
      performanceMetrics =
        await this.workflowService.updateVendorPerformanceMetrics(id);
    }

    return {
      ...vendor,
      verificationProgress: vendor.getVerificationProgress(),
      formattedRevenue: vendor.getFormattedRevenue(),
      localization: {
        storeName: vendor.getStoreName(language),
        storeDescription: vendor.getStoreDescription(language),
        verificationStatus: vendor.getVerificationStatusLocalized('en'),
        verificationStatusAr: vendor.getVerificationStatusLocalized('ar'),
      },
      performanceMetrics,
      nextActions: this.getNextActionsForStatus(vendor.verificationStatus),
    };
  }

  /**
   * UPDATE VENDOR
   *
   * Update vendor information with validation and workflow considerations
   */
  @Put(':id')
  @ApiOperation({
    summary: 'Update vendor information',
    description:
      'Update Syrian vendor information with validation and workflow state management',
  })
  @ApiParam({
    name: 'id',
    description: 'Vendor ID',
    type: 'integer',
    example: 123,
  })
  @ApiBody({
    type: UpdateSyrianVendorDto,
    description: 'Updated vendor data',
  })
  @ApiOkResponse({
    description: 'Vendor updated successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid update data',
  })
  @ApiNotFoundResponse({
    description: 'Vendor not found',
  })
  async updateVendor(
    @CurrentUser() user: UserFromToken,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateVendorDto: UpdateSyrianVendorDto,
  ) {
    this.logger.log(`User ${user.id} updating Syrian vendor ${id}`);

    const vendor = await this.vendorsService.updateSyrianVendor(
      id,
      updateVendorDto,
    );

    return {
      ...vendor,
      verificationProgress: vendor.getVerificationProgress(),
      formattedRevenue: vendor.getFormattedRevenue(),
      localization: {
        storeName: vendor.getStoreName('both'),
        storeDescription: vendor.getStoreDescription('both'),
        verificationStatus: vendor.getVerificationStatusLocalized('en'),
        verificationStatusAr: vendor.getVerificationStatusLocalized('ar'),
      },
      nextActions: this.getNextActionsForStatus(vendor.verificationStatus),
    };
  }

  /**
   * SEARCH AND FILTER VENDORS
   *
   * Advanced vendor search with Syrian-specific filters and localization
   */
  @Get()
  @ApiOperation({
    summary: 'Search and filter vendors',
    description:
      'Advanced vendor search with Syrian governorate filters, business type filtering, and Arabic/English search support',
  })
  @ApiQuery({
    name: 'searchTerm',
    required: false,
    type: String,
    description: 'Search term for vendor names (Arabic or English)',
    example: 'electronics',
  })
  @ApiQuery({
    name: 'governorateIds',
    required: false,
    type: [Number],
    description: 'Filter by Syrian governorate IDs',
    example: [1, 2],
  })
  @ApiQuery({
    name: 'verificationStatus',
    required: false,
    enum: SyrianVendorVerificationStatus,
    description: 'Filter by verification status',
    example: 'verified',
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
    example: 20,
  })
  @ApiQuery({
    name: 'language',
    required: false,
    enum: ['en', 'ar', 'both'],
    description: 'Response language',
    example: 'both',
  })
  @ApiOkResponse({
    description: 'Vendor search results',
    schema: {
      example: {
        vendors: [
          {
            id: 123,
            storeNameEn: 'Damascus Electronics Store',
            storeNameAr: 'متجر دمشق للإلكترونيات',
            verificationStatus: 'verified',
            businessType: 'limited_liability',
            qualityScore: 87.5,
            governorate: {
              id: 1,
              nameEn: 'Damascus',
              nameAr: 'دمشق',
            },
            totalOrders: 1250,
            isActive: true,
            createdAt: '2025-07-01T10:00:00.000Z',
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
        filters: {
          governorateDistribution: {
            Damascus: 15,
            Aleppo: 8,
            Homs: 5,
          },
          statusDistribution: {
            verified: 20,
            under_review: 5,
            rejected: 3,
          },
          businessTypeDistribution: {
            limited_liability: 12,
            sole_proprietorship: 8,
            partnership: 4,
          },
        },
      },
    },
  })
  async searchVendors(@Query() searchQuery: VendorSearchQueryDto) {
    this.logger.log(`Searching vendors with criteria:`, searchQuery);

    const result = await this.vendorsService.searchSyrianVendors(searchQuery);

    return {
      vendors: result.vendors.map((vendor) => ({
        ...vendor,
        verificationProgress: vendor.getVerificationProgress(),
        formattedRevenue: vendor.getFormattedRevenue(),
        localization: {
          storeName: vendor.getStoreName(searchQuery.language || 'both'),
          verificationStatus: vendor.getVerificationStatusLocalized('en'),
          verificationStatusAr: vendor.getVerificationStatusLocalized('ar'),
        },
      })),
      pagination: result.pagination,
      filters: result.filters,
      aggregations: result.aggregations,
    };
  }

  /**
   * VENDOR WORKFLOW MANAGEMENT
   */

  /**
   * Submit vendor for verification
   */
  @Post(':id/submit-for-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Submit vendor for verification',
    description:
      'Submit a vendor for the verification process after completing all required information',
  })
  @ApiParam({
    name: 'id',
    description: 'Vendor ID',
    type: 'integer',
    example: 123,
  })
  @ApiOkResponse({
    description: 'Vendor submitted for verification successfully',
    schema: {
      example: {
        success: true,
        fromStatus: 'draft',
        toStatus: 'submitted',
        transitionedAt: '2025-08-10T10:00:00.000Z',
        message: 'Vendor submitted for verification successfully',
        nextActions: [
          'Admin review will begin within 24 hours',
          'Document verification will be performed',
          'Business compliance checks will be conducted',
        ],
        slaDeadline: '2025-08-11T10:00:00.000Z',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Vendor not eligible for verification or invalid status',
  })
  async submitForVerification(
    @CurrentUser() user: UserFromToken,
    @Param('id', ParseIntPipe) vendorId: number,
  ) {
    this.logger.log(
      `User ${user.id} submitting vendor ${vendorId} for verification`,
    );

    const result = await this.workflowService.submitForVerification(
      vendorId,
      user.id,
    );

    return result;
  }

  /**
   * Start vendor review process
   */
  @Post(':id/start-review')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Start vendor review process (Admin)',
    description:
      'Begin the administrative review process for a submitted vendor',
  })
  @ApiParam({
    name: 'id',
    description: 'Vendor ID',
    type: 'integer',
    example: 123,
  })
  @ApiBody({
    type: VendorWorkflowActionDto,
    description: 'Review initiation details',
  })
  @ApiOkResponse({
    description: 'Review process started successfully',
  })
  async startReview(
    @CurrentUser() user: UserFromToken,
    @Param('id', ParseIntPipe) vendorId: number,
    @Body() actionDto: VendorWorkflowActionDto,
  ) {
    this.logger.log(`Admin ${user.id} starting review for vendor ${vendorId}`);

    const result = await this.workflowService.startReview(
      vendorId,
      user.id,
      actionDto.notes,
    );

    return result;
  }

  /**
   * Approve vendor
   */
  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Approve vendor (Admin)',
    description:
      'Approve a vendor after successful verification and activate their account',
  })
  @ApiParam({
    name: 'id',
    description: 'Vendor ID',
    type: 'integer',
    example: 123,
  })
  @ApiBody({
    type: VendorWorkflowActionDto,
    description: 'Approval details and notes',
  })
  @ApiOkResponse({
    description: 'Vendor approved successfully',
  })
  async approveVendor(
    @CurrentUser() user: UserFromToken,
    @Param('id', ParseIntPipe) vendorId: number,
    @Body() actionDto: VendorWorkflowActionDto,
  ) {
    this.logger.log(`Admin ${user.id} approving vendor ${vendorId}`);

    const result = await this.workflowService.approveVendor(
      vendorId,
      user.id,
      actionDto.notes,
    );

    return result;
  }

  /**
   * Reject vendor
   */
  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reject vendor (Admin)',
    description: 'Reject a vendor application with detailed reasoning',
  })
  @ApiParam({
    name: 'id',
    description: 'Vendor ID',
    type: 'integer',
    example: 123,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        rejectionReason: {
          type: 'string',
          description: 'Detailed reason for rejection',
          example:
            'Incomplete documentation: Missing commercial register certificate',
        },
      },
      required: ['rejectionReason'],
    },
  })
  @ApiOkResponse({
    description: 'Vendor rejected successfully',
  })
  async rejectVendor(
    @CurrentUser() user: UserFromToken,
    @Param('id', ParseIntPipe) vendorId: number,
    @Body() body: { rejectionReason: string },
  ) {
    this.logger.log(
      `Admin ${user.id} rejecting vendor ${vendorId}: ${body.rejectionReason}`,
    );

    const result = await this.workflowService.rejectVendor(
      vendorId,
      body.rejectionReason,
      user.id,
    );

    return result;
  }

  /**
   * Request clarification from vendor
   */
  @Post(':id/request-clarification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request clarification (Admin)',
    description:
      'Request additional information or clarification from the vendor',
  })
  @ApiParam({
    name: 'id',
    description: 'Vendor ID',
    type: 'integer',
    example: 123,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        clarificationRequest: {
          type: 'string',
          description: 'Specific clarification request',
          example:
            'Please provide a clearer image of your commercial register certificate',
        },
      },
      required: ['clarificationRequest'],
    },
  })
  @ApiOkResponse({
    description: 'Clarification requested successfully',
  })
  async requestClarification(
    @CurrentUser() user: UserFromToken,
    @Param('id', ParseIntPipe) vendorId: number,
    @Body() body: { clarificationRequest: string },
  ) {
    this.logger.log(
      `Admin ${user.id} requesting clarification from vendor ${vendorId}`,
    );

    const result = await this.workflowService.requestClarification(
      vendorId,
      body.clarificationRequest,
      user.id,
    );

    return result;
  }

  /**
   * Suspend vendor
   */
  @Post(':id/suspend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Suspend vendor (Admin)',
    description: 'Suspend a vendor account with optional duration',
  })
  @ApiParam({
    name: 'id',
    description: 'Vendor ID',
    type: 'integer',
    example: 123,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        suspensionReason: {
          type: 'string',
          description: 'Reason for suspension',
          example: 'Repeated customer complaints about product quality',
        },
        suspensionDurationDays: {
          type: 'number',
          description: 'Suspension duration in days (optional for indefinite)',
          example: 30,
        },
      },
      required: ['suspensionReason'],
    },
  })
  @ApiOkResponse({
    description: 'Vendor suspended successfully',
  })
  async suspendVendor(
    @CurrentUser() user: UserFromToken,
    @Param('id', ParseIntPipe) vendorId: number,
    @Body() body: { suspensionReason: string; suspensionDurationDays?: number },
  ) {
    this.logger.warn(
      `Admin ${user.id} suspending vendor ${vendorId}: ${body.suspensionReason}`,
    );

    const result = await this.workflowService.suspendVendor(
      vendorId,
      body.suspensionReason,
      user.id,
      body.suspensionDurationDays,
    );

    return result;
  }

  /**
   * PERFORMANCE AND ANALYTICS
   */

  /**
   * Get vendor performance metrics
   */
  @Get(':id/performance-metrics')
  @ApiOperation({
    summary: 'Get vendor performance metrics',
    description:
      'Retrieve detailed performance metrics and quality scoring for a vendor',
  })
  @ApiParam({
    name: 'id',
    description: 'Vendor ID',
    type: 'integer',
    example: 123,
  })
  @ApiOkResponse({
    description: 'Performance metrics retrieved successfully',
    schema: {
      example: {
        vendorId: 123,
        qualityScore: 87.5,
        totalOrders: 1250,
        totalRevenueSyp: 18750000,
        customerSatisfactionRating: 4.3,
        responseTimeHours: 8.5,
        fulfillmentRate: 94.2,
        returnRate: 3.1,
        performanceGrade: 'B+',
        improvementAreas: ['Response Time', 'Return Rate'],
        recommendations: [
          'Implement automated responses for faster customer service',
          'Review product descriptions to reduce returns',
        ],
        lastUpdated: '2025-08-10T10:00:00.000Z',
      },
    },
  })
  async getVendorPerformanceMetrics(
    @Param('id', ParseIntPipe) vendorId: number,
  ) {
    this.logger.log(`Retrieving performance metrics for vendor ${vendorId}`);

    const metrics =
      await this.workflowService.updateVendorPerformanceMetrics(vendorId);

    return {
      ...metrics,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Get vendor analytics
   */
  @Get('analytics/overview')
  @ApiOperation({
    summary: 'Get vendor analytics overview',
    description:
      'Comprehensive vendor analytics with Syrian market insights, business type distribution, and performance metrics',
  })
  @ApiQuery({
    name: 'startDate',
    required: true,
    type: String,
    description: 'Start date for analytics period',
    example: '2025-01-01T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    type: String,
    description: 'End date for analytics period',
    example: '2025-08-10T23:59:59.000Z',
  })
  @ApiOkResponse({
    description: 'Vendor analytics retrieved successfully',
    schema: {
      example: {
        totalVendors: 125,
        verificationStats: {
          verified: 85,
          under_review: 15,
          rejected: 10,
          draft: 15,
        },
        businessTypeDistribution: {
          limited_liability: 45,
          sole_proprietorship: 35,
          partnership: 25,
          joint_stock: 15,
          cooperative: 5,
        },
        vendorCategoryDistribution: {
          retailer: 55,
          wholesaler: 25,
          manufacturer: 20,
          distributor: 15,
          importer: 10,
        },
        governorateDistribution: {
          Damascus: 45,
          Aleppo: 25,
          Homs: 15,
          Latakia: 12,
          Hama: 10,
        },
        averageQualityScore: 78.3,
        totalRevenueSyp: 2500000000,
        performanceGrades: {
          'A+': 5,
          A: 15,
          'B+': 25,
          B: 35,
          'C+': 20,
          C: 15,
          D: 5,
          F: 5,
        },
      },
    },
  })
  async getVendorAnalytics(@Query() query: VendorAnalyticsQueryDto) {
    this.logger.log(
      `Generating vendor analytics for period: ${query.startDate} to ${query.endDate}`,
    );

    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    const analytics = await this.workflowService.getVendorAnalytics(
      startDate,
      endDate,
    );

    return {
      ...analytics,
      period: {
        startDate: query.startDate,
        endDate: query.endDate,
        days: Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
        ),
      },
      generatedAt: new Date().toISOString(),
      currency: 'SYP',
    };
  }

  /**
   * SLA MONITORING
   */

  /**
   * Get SLA compliance monitoring
   */
  @Get('sla/compliance-monitoring')
  @ApiOperation({
    summary: 'Get SLA compliance monitoring',
    description:
      'Monitor vendor verification SLA compliance, overdue cases, and performance metrics',
  })
  @ApiOkResponse({
    description: 'SLA compliance data retrieved successfully',
    schema: {
      example: {
        totalVendors: 45,
        breachingDeadlines: [
          {
            vendorId: 123,
            storeNameEn: 'Damascus Electronics',
            storeNameAr: 'دمشق للإلكترونيات',
            currentStatus: 'under_review',
            daysPastDeadline: 5,
            priority: 'high',
            recommendedAction: 'Request manager intervention',
          },
        ],
        upcomingDeadlines: [
          {
            vendorId: 124,
            storeNameEn: 'Aleppo Trading',
            storeNameAr: 'تجارة حلب',
            currentStatus: 'submitted',
            daysUntilDeadline: 1,
            priority: 'urgent',
          },
        ],
        averageProcessingTime: 4.2,
        slaComplianceRate: 87.5,
      },
    },
  })
  async getSlaComplianceMonitoring() {
    this.logger.log('Retrieving SLA compliance monitoring data');

    const slaResults = await this.workflowService.monitorSlaCompliance();

    return {
      ...slaResults,
      reportGeneratedAt: new Date().toISOString(),
      recommendations: this.generateSlaRecommendations(slaResults),
    };
  }

  /**
   * BULK OPERATIONS
   */

  /**
   * Bulk vendor actions
   */
  @Post('bulk-actions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Perform bulk actions on vendors',
    description:
      'Execute bulk actions on multiple vendors for efficient management',
  })
  @ApiBody({
    type: BulkVendorActionDto,
    description: 'Bulk action parameters',
  })
  @ApiOkResponse({
    description: 'Bulk action completed',
    schema: {
      example: {
        action: 'activate',
        processed: 25,
        failed: 2,
        results: [
          {
            vendorId: 123,
            success: true,
            message: 'Vendor activated successfully',
          },
          {
            vendorId: 124,
            success: false,
            error: 'Vendor verification required before activation',
          },
        ],
        summary: {
          totalRequested: 27,
          successful: 25,
          failed: 2,
          processingTime: '2.3s',
        },
      },
    },
  })
  async performBulkActions(
    @CurrentUser() user: UserFromToken,
    @Body() bulkActionDto: BulkVendorActionDto,
  ) {
    this.logger.log(
      `Admin ${user.id} performing bulk action: ${bulkActionDto.action} on ${bulkActionDto.vendorIds.length} vendors`,
    );

    const result = await this.vendorsService.performBulkVendorActions(
      bulkActionDto,
      user.id,
    );

    return {
      ...result,
      executedAt: new Date().toISOString(),
      executedBy: user.id,
    };
  }

  /**
   * PRIVATE HELPER METHODS
   */

  private getNextActionsForStatus(
    status: SyrianVendorVerificationStatus,
  ): string[] {
    switch (status) {
      case SyrianVendorVerificationStatus.DRAFT:
        return [
          'Complete all required information',
          'Upload necessary documents',
          'Submit for verification',
        ];
      case SyrianVendorVerificationStatus.SUBMITTED:
        return [
          'Wait for admin review to begin',
          'Ensure documents are clear and valid',
          'Check email for updates',
        ];
      case SyrianVendorVerificationStatus.UNDER_REVIEW:
        return [
          'Review is in progress',
          'Admin is verifying documents',
          'Wait for review completion',
        ];
      case SyrianVendorVerificationStatus.VERIFIED:
        return [
          'Start adding products',
          'Configure shipping methods',
          'Set up payment information',
        ];
      case SyrianVendorVerificationStatus.REJECTED:
        return [
          'Review rejection reasons',
          'Address identified issues',
          'Resubmit after corrections',
        ];
      case SyrianVendorVerificationStatus.REQUIRES_CLARIFICATION:
        return [
          'Review clarification request',
          'Provide requested information',
          'Respond within 48 hours',
        ];
      case SyrianVendorVerificationStatus.PENDING_DOCUMENTS:
        return [
          'Upload missing documents',
          'Ensure document quality',
          'Submit within 7 days',
        ];
      case SyrianVendorVerificationStatus.SUSPENDED:
        return [
          'Contact support for details',
          'Address suspension reasons',
          'Wait for review period',
        ];
      case SyrianVendorVerificationStatus.EXPIRED:
        return [
          'Renew verification documents',
          'Update business information',
          'Resubmit for verification',
        ];
      default:
        return ['Contact support for assistance'];
    }
  }

  private generateSlaRecommendations(slaResults: any): string[] {
    const recommendations: string[] = [];

    if (slaResults.slaComplianceRate < 90) {
      recommendations.push(
        'SLA compliance is below target. Consider increasing review team capacity.',
      );
    }

    if (slaResults.breachingDeadlines.length > 0) {
      recommendations.push(
        `${slaResults.breachingDeadlines.length} vendors are past deadline. Immediate attention required.`,
      );
    }

    if (slaResults.averageProcessingTime > 5) {
      recommendations.push(
        'Average processing time is above 5 days. Review workflow efficiency.',
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        'SLA compliance is performing well. Continue monitoring for optimization opportunities.',
      );
    }

    return recommendations;
  }
}
