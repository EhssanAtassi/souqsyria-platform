/**
 * @file syrian-manufacturer.controller.ts
 * @description Enterprise Syrian Manufacturer Controller with Comprehensive APIs
 *
 * ENDPOINTS:
 * - Manufacturer CRUD operations with Syrian localization
 * - Advanced search and filtering with performance optimization
 * - Verification workflow management and bulk operations
 * - Performance analytics and compliance reporting
 * - Integration with Syrian business registry system
 * - Arabic/English localized responses
 * - Comprehensive Swagger documentation
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

import { SyrianManufacturerService } from '../services/syrian-manufacturer.service';
import { SyrianManufacturerWorkflowService } from '../services/syrian-manufacturer-workflow.service';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../access-control/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserFromToken } from '../../common/interfaces/user-from-token.interface';

import {
  CreateSyrianManufacturerDto,
  UpdateSyrianManufacturerDto,
  VerifyManufacturerDto,
  ManufacturerQueryDto,
  BulkManufacturerActionDto,
} from '../dto/syrian-manufacturer.dto';
import {
  SyrianManufacturerVerificationStatus,
  SyrianManufacturerBusinessType,
} from '../entities/syrian-manufacturer.entity';

@ApiTags('🏭 Syrian Manufacturers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('syrian-manufacturers')
export class SyrianManufacturerController {
  private readonly logger = new Logger(SyrianManufacturerController.name);

  constructor(
    private readonly manufacturerService: SyrianManufacturerService,
    private readonly workflowService: SyrianManufacturerWorkflowService,
  ) {}

  /**
   * CREATE MANUFACTURER
   *
   * Creates a new Syrian manufacturer with comprehensive business information
   */
  @Post()
  @ApiOperation({
    summary: 'Create new Syrian manufacturer',
    description:
      'Create a comprehensive Syrian manufacturer profile with Arabic/English localization, business registration details, and compliance validation',
  })
  @ApiBody({
    type: CreateSyrianManufacturerDto,
    description: 'Manufacturer creation data with Syrian localization',
    examples: {
      localManufacturer: {
        summary: 'Syrian Local Manufacturer',
        value: {
          nameEn: 'Syrian Electronics Manufacturing Co.',
          nameAr: 'شركة الصناعات الإلكترونية السورية',
          brandNameEn: 'SyrTech',
          brandNameAr: 'سيرتك',
          descriptionEn:
            'Leading Syrian manufacturer of consumer electronics and industrial equipment since 1995.',
          descriptionAr:
            'شركة رائدة في تصنيع الإلكترونيات الاستهلاكية والمعدات الصناعية منذ عام 1995.',
          businessType: 'local_manufacturer',
          sizeCategory: 'medium',
          employeeCount: 75,
          foundedYear: 1995,
          syrianTaxId: 'TAX-SYR-123456789',
          commercialRegistry: 'REG-DAM-2023-001234',
          industrialLicense: 'IND-LIC-DM-456789',
          governorateId: 1,
          addressEn: 'Industrial Zone, Damascus, Building 15',
          addressAr: 'المنطقة الصناعية، دمشق، المبنى رقم 15',
          phone: '+963-11-1234567',
          mobile: '+963-987-654321',
          email: 'info@syrtech.sy',
          website: 'https://www.syrtech.sy',
          socialMediaLinks: {
            facebook: 'https://facebook.com/syrtech.official',
            instagram: 'https://instagram.com/syrtech_sy',
          },
          metadata: {
            specializations: ['electronics', 'industrial_equipment'],
            certifications: ['ISO_9001', 'ISO_14001'],
            exportMarkets: ['UAE', 'Jordan', 'Lebanon'],
          },
        },
      },
      internationalBrand: {
        summary: 'International Brand Distributor',
        value: {
          nameEn: 'Samsung Syria Distribution',
          nameAr: 'توزيع سامسونغ سوريا',
          brandNameEn: 'Samsung',
          brandNameAr: 'سامسونغ',
          businessType: 'authorized_dealer',
          sizeCategory: 'large',
          employeeCount: 150,
          governorateId: 2,
          phone: '+963-21-9876543',
          email: 'info@samsung.sy',
          website: 'https://www.samsung.sy',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Manufacturer created successfully',
    schema: {
      example: {
        id: 1,
        nameEn: 'Syrian Electronics Manufacturing Co.',
        nameAr: 'شركة الصناعات الإلكترونية السورية',
        businessType: 'local_manufacturer',
        verificationStatus: 'submitted',
        verificationStatusAr: 'مُقدم للتحقق',
        sizeCategory: 'medium',
        governorate: {
          id: 1,
          nameEn: 'Damascus',
          nameAr: 'دمشق',
        },
        isActive: true,
        qualityScore: 0,
        createdAt: '2025-08-09T10:00:00.000Z',
        workflow: {
          currentStatus: 'submitted',
          nextSteps: ['admin_review', 'document_verification'],
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid manufacturer data or validation errors',
    schema: {
      examples: {
        invalidTaxId: {
          summary: 'Invalid Tax ID Format',
          value: {
            message: 'Syrian Tax ID must follow format: TAX-SYR-XXXXXXXXX',
            error: 'Bad Request',
            statusCode: 400,
          },
        },
        invalidPhone: {
          summary: 'Invalid Phone Format',
          value: {
            message: 'Phone must follow Syrian format: +963-XX-XXXXXXX',
            error: 'Bad Request',
            statusCode: 400,
          },
        },
      },
    },
  })
  @ApiConflictResponse({
    description: 'Manufacturer with same tax ID or registry already exists',
    schema: {
      example: {
        message:
          'Manufacturer with Syrian Tax ID TAX-SYR-123456789 already exists',
        error: 'Conflict',
        statusCode: 409,
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated',
  })
  @ApiForbiddenResponse({
    description: 'User does not have permission to create manufacturers',
  })
  async createManufacturer(
    @CurrentUser() user: UserFromToken,
    @Body() createDto: CreateSyrianManufacturerDto,
  ) {
    this.logger.log(
      `User ${user.id} creating manufacturer: ${createDto.nameEn}`,
    );

    const manufacturer = await this.manufacturerService.createManufacturer(
      createDto,
      user as any,
    );

    return {
      id: manufacturer.id,
      nameEn: manufacturer.nameEn,
      nameAr: manufacturer.nameAr,
      businessType: manufacturer.businessType,
      verificationStatus: manufacturer.verificationStatus,
      verificationStatusAr: this.getVerificationStatusNameAr(
        manufacturer.verificationStatus,
      ),
      sizeCategory: manufacturer.sizeCategory,
      governorate: manufacturer.governorate
        ? {
            id: manufacturer.governorate.id,
            nameEn: manufacturer.governorate.nameEn,
            nameAr: manufacturer.governorate.nameAr,
          }
        : null,
      isActive: manufacturer.isActive,
      qualityScore: manufacturer.qualityScore,
      createdAt: manufacturer.createdAt,
      workflow: {
        currentStatus: manufacturer.verificationStatus,
        nextSteps: ['admin_review', 'document_verification'],
      },
    };
  }

  /**
   * SEARCH AND FILTER MANUFACTURERS
   *
   * Advanced search with comprehensive filtering and sorting options
   */
  @Get('search')
  @ApiOperation({
    summary: 'Search and filter manufacturers',
    description:
      'Advanced search functionality with comprehensive filters, sorting, and pagination. Supports Arabic/English search terms.',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search term for manufacturer names and brands',
    example: 'Syrian Electronics',
  })
  @ApiQuery({
    name: 'verificationStatus',
    required: false,
    enum: SyrianManufacturerVerificationStatus,
    description: 'Filter by verification status',
  })
  @ApiQuery({
    name: 'businessType',
    required: false,
    enum: SyrianManufacturerBusinessType,
    description: 'Filter by business type',
  })
  @ApiQuery({
    name: 'governorateId',
    required: false,
    type: Number,
    description: 'Filter by Syrian governorate',
    example: 1,
  })
  @ApiQuery({
    name: 'minQualityScore',
    required: false,
    type: Number,
    description: 'Minimum quality score (0-100)',
    example: 80,
  })
  @ApiQuery({
    name: 'hasProducts',
    required: false,
    type: Boolean,
    description: 'Filter manufacturers with products only',
    example: true,
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['createdAt', 'qualityScore', 'totalProducts', 'nameEn'],
    description: 'Sort field',
    example: 'qualityScore',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Sort order',
    example: 'DESC',
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
    description: 'Items per page (max 100)',
    example: 10,
  })
  @ApiOkResponse({
    description: 'Manufacturers search results',
    schema: {
      example: {
        manufacturers: [
          {
            id: 1,
            nameEn: 'Syrian Electronics Manufacturing Co.',
            nameAr: 'شركة الصناعات الإلكترونية السورية',
            businessType: 'local_manufacturer',
            verificationStatus: 'verified',
            qualityScore: 87,
            totalProducts: 245,
            averageRating: 4.3,
            governorate: {
              nameEn: 'Damascus',
              nameAr: 'دمشق',
            },
          },
        ],
        pagination: {
          total: 150,
          page: 1,
          limit: 10,
          totalPages: 15,
          hasNext: true,
          hasPrev: false,
        },
        filters: {
          applied: ['verificationStatus: verified', 'minQualityScore: 80'],
          available: {
            businessTypes: ['local_manufacturer', 'international_brand'],
            governorates: ['Damascus', 'Aleppo', 'Homs'],
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated',
  })
  async searchManufacturers(@Query() queryDto: ManufacturerQueryDto) {
    this.logger.log('Searching manufacturers with filters:', queryDto);

    const result = await this.manufacturerService.searchManufacturers(queryDto);

    return {
      manufacturers: result.manufacturers.map((manufacturer) => ({
        id: manufacturer.id,
        nameEn: manufacturer.nameEn,
        nameAr: manufacturer.nameAr,
        brandNameEn: manufacturer.brandNameEn,
        brandNameAr: manufacturer.brandNameAr,
        businessType: manufacturer.businessType,
        sizeCategory: manufacturer.sizeCategory,
        verificationStatus: manufacturer.verificationStatus,
        verificationStatusAr: this.getVerificationStatusNameAr(
          manufacturer.verificationStatus,
        ),
        qualityScore: manufacturer.qualityScore,
        totalProducts: manufacturer.totalProducts,
        averageRating: parseFloat(
          manufacturer.averageRating?.toString() || '0',
        ),
        governorate: manufacturer.governorate
          ? {
              id: manufacturer.governorate.id,
              nameEn: manufacturer.governorate.nameEn,
              nameAr: manufacturer.governorate.nameAr,
            }
          : null,
        isActive: manufacturer.isActive,
        isFeatured: manufacturer.isFeatured,
        logoUrl: manufacturer.logoUrl,
        createdAt: manufacturer.createdAt,
      })),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        hasNext: result.hasNext,
        hasPrev: result.hasPrev,
      },
    };
  }

  /**
   * GET MANUFACTURER BY ID
   *
   * Retrieve detailed manufacturer information with complete business profile
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get manufacturer by ID',
    description:
      'Retrieve comprehensive manufacturer details including business information, verification status, and performance metrics',
  })
  @ApiParam({
    name: 'id',
    description: 'Manufacturer ID',
    example: 1,
  })
  @ApiOkResponse({
    description: 'Manufacturer details retrieved successfully',
    schema: {
      example: {
        id: 1,
        nameEn: 'Syrian Electronics Manufacturing Co.',
        nameAr: 'شركة الصناعات الإلكترونية السورية',
        businessType: 'local_manufacturer',
        businessInformation: {
          syrianTaxId: 'TAX-SYR-123456789',
          commercialRegistry: 'REG-DAM-2023-001234',
          foundedYear: 1995,
          employeeCount: 75,
        },
        location: {
          governorate: {
            id: 1,
            nameEn: 'Damascus',
            nameAr: 'دمشق',
          },
          addressEn: 'Industrial Zone, Damascus, Building 15',
          addressAr: 'المنطقة الصناعية، دمشق، المبنى رقم 15',
        },
        contact: {
          phone: '+963-11-1234567',
          email: 'info@syrtech.sy',
          website: 'https://www.syrtech.sy',
        },
        verification: {
          status: 'verified',
          statusAr: 'محقق',
          verifiedAt: '2025-08-01T12:00:00.000Z',
          verifiedBy: {
            id: 2,
            email: 'admin@souqsyria.com',
          },
        },
        performance: {
          qualityScore: 87,
          totalProducts: 245,
          averageRating: 4.3,
          monthlyRevenueSyp: 2500000,
          customerSatisfaction: 92.3,
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Manufacturer not found',
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated',
  })
  async getManufacturerById(@Param('id', ParseIntPipe) id: number) {
    this.logger.log(`Retrieving manufacturer details for ID: ${id}`);

    const manufacturer = await this.manufacturerService.getManufacturerById(id);

    return {
      id: manufacturer.id,
      nameEn: manufacturer.nameEn,
      nameAr: manufacturer.nameAr,
      brandNameEn: manufacturer.brandNameEn,
      brandNameAr: manufacturer.brandNameAr,
      descriptionEn: manufacturer.descriptionEn,
      descriptionAr: manufacturer.descriptionAr,
      businessType: manufacturer.businessType,
      sizeCategory: manufacturer.sizeCategory,
      businessInformation: {
        syrianTaxId: manufacturer.syrianTaxId,
        commercialRegistry: manufacturer.commercialRegistry,
        industrialLicense: manufacturer.industrialLicense,
        exportLicense: manufacturer.exportLicense,
        foundedYear: manufacturer.foundedYear,
        employeeCount: manufacturer.employeeCount,
      },
      location: {
        governorate: manufacturer.governorate
          ? {
              id: manufacturer.governorate.id,
              nameEn: manufacturer.governorate.nameEn,
              nameAr: manufacturer.governorate.nameAr,
            }
          : null,
        addressEn: manufacturer.addressEn,
        addressAr: manufacturer.addressAr,
      },
      contact: {
        phone: manufacturer.phone,
        mobile: manufacturer.mobile,
        email: manufacturer.email,
        website: manufacturer.website,
      },
      media: {
        logoUrl: manufacturer.logoUrl,
        bannerUrl: manufacturer.bannerUrl,
        galleryImages: manufacturer.galleryImages,
      },
      verification: {
        status: manufacturer.verificationStatus,
        statusAr: this.getVerificationStatusNameAr(
          manufacturer.verificationStatus,
        ),
        verifiedAt: manufacturer.verifiedAt,
        verifiedBy: manufacturer.verifiedBy
          ? {
              id: manufacturer.verifiedBy.id,
              email: manufacturer.verifiedBy.email,
            }
          : null,
        verificationNotesEn: manufacturer.verificationNotesEn,
        verificationNotesAr: manufacturer.verificationNotesAr,
        hasDocuments: manufacturer.hasDocuments,
      },
      performance: {
        qualityScore: manufacturer.qualityScore,
        totalProducts: manufacturer.totalProducts,
        activeProducts: manufacturer.activeProducts,
        averageRating: parseFloat(
          manufacturer.averageRating?.toString() || '0',
        ),
        totalReviews: manufacturer.totalReviews,
        monthlyRevenueSyp: parseFloat(
          manufacturer.monthlyRevenueSyp?.toString() || '0',
        ),
        deliveryPerformance: parseFloat(
          manufacturer.deliveryPerformance?.toString() || '0',
        ),
        customerSatisfaction: parseFloat(
          manufacturer.customerSatisfaction?.toString() || '0',
        ),
        returnRate: parseFloat(manufacturer.returnRate?.toString() || '0'),
      },
      socialMedia: manufacturer.socialMediaLinks,
      metadata: manufacturer.metadata,
      isActive: manufacturer.isActive,
      isFeatured: manufacturer.isFeatured,
      createdAt: manufacturer.createdAt,
      updatedAt: manufacturer.updatedAt,
    };
  }

  /**
   * UPDATE MANUFACTURER
   *
   * Update manufacturer information and business details
   */
  @Put(':id')
  @ApiOperation({
    summary: 'Update manufacturer information',
    description:
      'Update comprehensive manufacturer profile including business registration, contact details, and verification documents',
  })
  @ApiParam({
    name: 'id',
    description: 'Manufacturer ID to update',
    example: 1,
  })
  @ApiBody({
    type: UpdateSyrianManufacturerDto,
    description: 'Updated manufacturer information',
    examples: {
      basicUpdate: {
        summary: 'Update Basic Information',
        value: {
          descriptionEn:
            'Updated description of our manufacturing capabilities and expertise.',
          descriptionAr: 'وصف محدث لقدراتنا التصنيعية وخبرتنا.',
          phone: '+963-11-7654321',
          website: 'https://www.syrtech-updated.sy',
        },
      },
      documentsUpdate: {
        summary: 'Upload Verification Documents',
        value: {
          verificationDocuments: {
            commercialRegistry:
              'https://storage.souqsyria.com/docs/updated-registry.pdf',
            taxCertificate:
              'https://storage.souqsyria.com/docs/updated-tax.pdf',
            qualityCertificates: [
              'https://storage.souqsyria.com/docs/iso-9001-2024.pdf',
            ],
          },
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Manufacturer updated successfully',
    schema: {
      example: {
        id: 1,
        nameEn: 'Syrian Electronics Manufacturing Co.',
        message: 'Manufacturer information updated successfully',
        updatedFields: ['descriptionEn', 'phone', 'website'],
        updatedAt: '2025-08-09T15:30:00.000Z',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Manufacturer not found',
  })
  @ApiBadRequestResponse({
    description: 'Invalid update data',
  })
  @ApiConflictResponse({
    description: 'Duplicate business registration information',
  })
  async updateManufacturer(
    @CurrentUser() user: UserFromToken,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateSyrianManufacturerDto,
  ) {
    this.logger.log(`User ${user.id} updating manufacturer ${id}`);

    const updatedManufacturer =
      await this.manufacturerService.updateManufacturer(
        id,
        updateDto,
        user as any,
      );

    return {
      id: updatedManufacturer.id,
      nameEn: updatedManufacturer.nameEn,
      nameAr: updatedManufacturer.nameAr,
      message: 'Manufacturer information updated successfully',
      messageAr: 'تم تحديث معلومات المُصنع بنجاح',
      verificationStatus: updatedManufacturer.verificationStatus,
      updatedAt: updatedManufacturer.updatedAt,
    };
  }

  /**
   * ADMIN: VERIFY MANUFACTURER
   *
   * Admin endpoint to verify or reject manufacturer applications
   */
  @Put('admin/:id/verify')
  @ApiOperation({
    summary: 'Verify manufacturer (Admin)',
    description:
      'Approve or reject manufacturer verification with detailed review notes in Arabic and English',
  })
  @ApiParam({
    name: 'id',
    description: 'Manufacturer ID to verify',
    example: 1,
  })
  @ApiBody({
    type: VerifyManufacturerDto,
    description: 'Verification decision and notes',
    examples: {
      approve: {
        summary: 'Approve Manufacturer',
        value: {
          status: 'verified',
          verificationNotesEn:
            'All documents verified successfully. Company meets all requirements and quality standards.',
          verificationNotesAr:
            'تم التحقق من جميع الوثائق بنجاح. الشركة تلبي جميع المتطلبات ومعايير الجودة.',
          sendNotification: true,
        },
      },
      reject: {
        summary: 'Reject Manufacturer',
        value: {
          status: 'rejected',
          verificationNotesEn:
            'Commercial registry document is expired. Please update and resubmit.',
          verificationNotesAr:
            'وثيقة السجل التجاري منتهية الصلاحية. يرجى التحديث وإعادة التقديم.',
          sendNotification: true,
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Manufacturer verification completed',
    schema: {
      example: {
        id: 1,
        nameEn: 'Syrian Electronics Manufacturing Co.',
        verificationStatus: 'verified',
        verificationStatusAr: 'محقق',
        verifiedAt: '2025-08-09T16:00:00.000Z',
        verifiedBy: {
          id: 2,
          email: 'admin@souqsyria.com',
        },
        qualityScore: 85,
        workflow: {
          previousStatus: 'under_review',
          currentStatus: 'verified',
          nextActions: ['quality_metrics_update', 'feature_eligibility'],
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Manufacturer not found',
  })
  @ApiBadRequestResponse({
    description:
      'Invalid verification status or manufacturer not in reviewable state',
  })
  @ApiForbiddenResponse({
    description: 'User does not have admin permissions',
  })
  async verifyManufacturer(
    @CurrentUser() user: UserFromToken,
    @Param('id', ParseIntPipe) id: number,
    @Body() verifyDto: VerifyManufacturerDto,
  ) {
    this.logger.log(
      `Admin ${user.id} verifying manufacturer ${id}: ${verifyDto.status}`,
    );

    const manufacturer = await this.workflowService.transitionStatus(
      id,
      verifyDto.status,
      user.id,
      verifyDto.verificationNotesEn,
      verifyDto.verificationNotesAr,
      {
        verificationNotesEn: verifyDto.verificationNotesEn,
        verificationNotesAr: verifyDto.verificationNotesAr,
        sendNotification: verifyDto.sendNotification,
      },
    );

    return {
      id: manufacturer.id,
      nameEn: manufacturer.nameEn,
      nameAr: manufacturer.nameAr,
      verificationStatus: manufacturer.verificationStatus,
      verificationStatusAr: this.getVerificationStatusNameAr(
        manufacturer.verificationStatus,
      ),
      verifiedAt: manufacturer.verifiedAt,
      verifiedBy: manufacturer.verifiedBy
        ? {
            id: manufacturer.verifiedBy.id,
            email: manufacturer.verifiedBy.email,
          }
        : null,
      verificationNotesEn: manufacturer.verificationNotesEn,
      verificationNotesAr: manufacturer.verificationNotesAr,
      qualityScore: manufacturer.qualityScore,
      workflow: {
        currentStatus: manufacturer.verificationStatus,
        isVerified: manufacturer.isVerified,
      },
    };
  }

  /**
   * GET FEATURED MANUFACTURERS
   *
   * Retrieve featured manufacturers for homepage display
   */
  @Get('public/featured')
  @ApiOperation({
    summary: 'Get featured manufacturers',
    description:
      'Retrieve featured manufacturers for public display with basic information and performance metrics',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of featured manufacturers',
    example: 10,
  })
  @ApiOkResponse({
    description: 'Featured manufacturers retrieved successfully',
    schema: {
      example: {
        manufacturers: [
          {
            id: 1,
            nameEn: 'Syrian Electronics Manufacturing Co.',
            nameAr: 'شركة الصناعات الإلكترونية السورية',
            logoUrl: 'https://storage.souqsyria.com/logos/syrtech.png',
            qualityScore: 87,
            totalProducts: 245,
            averageRating: 4.3,
            governorate: 'Damascus',
          },
        ],
        total: 8,
      },
    },
  })
  async getFeaturedManufacturers(@Query('limit') limit: number = 10) {
    const manufacturers =
      await this.manufacturerService.getFeaturedManufacturers(limit);

    return {
      manufacturers: manufacturers.map((manufacturer) => ({
        id: manufacturer.id,
        nameEn: manufacturer.nameEn,
        nameAr: manufacturer.nameAr,
        brandNameEn: manufacturer.brandNameEn,
        brandNameAr: manufacturer.brandNameAr,
        logoUrl: manufacturer.logoUrl,
        businessType: manufacturer.businessType,
        qualityScore: manufacturer.qualityScore,
        totalProducts: manufacturer.totalProducts,
        averageRating: parseFloat(
          manufacturer.averageRating?.toString() || '0',
        ),
        governorate: manufacturer.governorate?.nameEn,
        governorateAr: manufacturer.governorate?.nameAr,
      })),
      total: manufacturers.length,
    };
  }

  /**
   * GET MANUFACTURER ANALYTICS
   *
   * Comprehensive analytics and performance metrics for a manufacturer
   */
  @Get(':id/analytics')
  @ApiOperation({
    summary: 'Get manufacturer analytics',
    description:
      'Comprehensive analytics including performance metrics, compliance status, and business insights',
  })
  @ApiParam({
    name: 'id',
    description: 'Manufacturer ID',
    example: 1,
  })
  @ApiOkResponse({
    description: 'Manufacturer analytics retrieved successfully',
    schema: {
      example: {
        manufacturerId: 1,
        nameEn: 'Syrian Electronics Manufacturing Co.',
        nameAr: 'شركة الصناعات الإلكترونية السورية',
        performanceMetrics: {
          qualityScore: 87,
          totalProducts: 245,
          averageRating: 4.3,
          monthlyRevenueSyp: 2500000,
          customerSatisfaction: 92.3,
        },
        complianceStatus: {
          complianceScore: 95,
          riskLevel: 'LOW',
          missingDocuments: [],
          requiredActions: [],
        },
        businessInsights: {
          topProducts: [
            {
              id: 101,
              nameEn: 'Smart TV 55 inch',
              rating: 4.8,
              salesCount: 150,
            },
          ],
          marketTrends: {
            monthlyGrowth: 8.5,
            seasonalTrends: ['electronics_peak_season'],
          },
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Manufacturer not found',
  })
  async getManufacturerAnalytics(@Param('id', ParseIntPipe) id: number) {
    this.logger.log(`Retrieving analytics for manufacturer ${id}`);

    const analytics =
      await this.manufacturerService.getManufacturerAnalytics(id);

    return analytics;
  }

  /**
   * ADMIN: BULK MANUFACTURER OPERATIONS
   *
   * Perform bulk verification operations on multiple manufacturers
   */
  @Put('admin/bulk-action')
  @ApiOperation({
    summary: 'Bulk manufacturer operations (Admin)',
    description:
      'Perform bulk verification operations on multiple manufacturers for administrative efficiency',
  })
  @ApiBody({
    type: BulkManufacturerActionDto,
    description: 'Bulk operation parameters',
    examples: {
      bulkVerify: {
        summary: 'Bulk Verify Manufacturers',
        value: {
          manufacturerIds: [1, 2, 3, 4, 5],
          targetStatus: 'verified',
          reason:
            'Bulk verification after document review and compliance check',
          reasonAr: 'تحقق جماعي بعد مراجعة الوثائق وفحص الامتثال',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Bulk operation completed',
    schema: {
      example: {
        results: {
          successful: [1, 2, 4],
          failed: [
            {
              id: 3,
              error: 'Missing required documents',
            },
            {
              id: 5,
              error: 'Manufacturer already verified',
            },
          ],
        },
        summary: {
          total: 5,
          successful: 3,
          failed: 2,
          successRate: 60,
        },
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'User does not have admin permissions',
  })
  async bulkManufacturerAction(
    @CurrentUser() user: UserFromToken,
    @Body() bulkDto: BulkManufacturerActionDto,
  ) {
    this.logger.log(
      `Admin ${user.id} performing bulk action on ${bulkDto.manufacturerIds.length} manufacturers`,
    );

    const results = await this.workflowService.bulkUpdateStatus(
      bulkDto.manufacturerIds,
      bulkDto.targetStatus,
      user.id,
      bulkDto.reason,
      bulkDto.reasonAr,
    );

    return {
      results,
      summary: {
        total: bulkDto.manufacturerIds.length,
        successful: results.successful.length,
        failed: results.failed.length,
        successRate: Math.round(
          (results.successful.length / bulkDto.manufacturerIds.length) * 100,
        ),
      },
    };
  }

  /**
   * ADMIN: GET MANUFACTURER STATISTICS
   *
   * Comprehensive statistics and overview for admin dashboard
   */
  @Get('admin/statistics')
  @ApiOperation({
    summary: 'Get manufacturer statistics (Admin)',
    description:
      'Comprehensive statistics including verification status distribution, performance metrics, and geographic data',
  })
  @ApiOkResponse({
    description: 'Manufacturer statistics retrieved successfully',
    schema: {
      example: {
        overview: {
          total: 1250,
          verified: 890,
          pending: 145,
          rejected: 120,
        },
        distribution: {
          byBusinessType: {
            local_manufacturer: 450,
            international_brand: 320,
            authorized_dealer: 280,
            distributor: 200,
          },
          byGovernorate: {
            Damascus: 380,
            Aleppo: 250,
            Homs: 180,
            Lattakia: 150,
          },
        },
        topPerformers: [
          {
            id: 1,
            nameEn: 'Syrian Electronics Manufacturing Co.',
            qualityScore: 87,
          },
        ],
        trends: {
          monthlyGrowth: 8.5,
          verificationRate: 71.2,
        },
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'User does not have admin permissions',
  })
  async getManufacturerStatistics() {
    this.logger.log('Retrieving manufacturer statistics');

    const stats = await this.manufacturerService.getManufacturerStatistics();

    return {
      overview: {
        total: stats.total,
        verified: stats.verified,
        pending: stats.pending,
        rejected: stats.rejected,
        verificationRate:
          stats.total > 0
            ? Math.round((stats.verified / stats.total) * 100)
            : 0,
      },
      distribution: {
        byBusinessType: stats.byBusinessType,
        byGovernorate: stats.byGovernorate,
      },
      topPerformers: stats.topPerformers,
    };
  }

  /**
   * SOFT DELETE MANUFACTURER
   *
   * Soft delete a manufacturer (admin only)
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete manufacturer (Admin)',
    description:
      'Soft delete a manufacturer. This will deactivate the manufacturer but preserve data for compliance.',
  })
  @ApiParam({
    name: 'id',
    description: 'Manufacturer ID to delete',
    example: 1,
  })
  @ApiOkResponse({
    description: 'Manufacturer deleted successfully',
    schema: {
      example: {
        message: 'Manufacturer deleted successfully',
        messageAr: 'تم حذف المُصنع بنجاح',
        deletedManufacturerId: 1,
        deletedAt: '2025-08-09T18:00:00.000Z',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Manufacturer not found',
  })
  @ApiForbiddenResponse({
    description: 'User does not have admin permissions',
  })
  async deleteManufacturer(
    @CurrentUser() user: UserFromToken,
    @Param('id', ParseIntPipe) id: number,
  ) {
    this.logger.log(`User ${user.id} deleting manufacturer ${id}`);

    await this.manufacturerService.softDeleteManufacturer(id, user.id);

    return {
      message: 'Manufacturer deleted successfully',
      messageAr: 'تم حذف المُصنع بنجاح',
      deletedManufacturerId: id,
      deletedAt: new Date(),
    };
  }

  /**
   * PRIVATE HELPER METHODS
   */

  private getVerificationStatusNameAr(
    status: SyrianManufacturerVerificationStatus,
  ): string {
    const statusNames: Record<SyrianManufacturerVerificationStatus, string> = {
      [SyrianManufacturerVerificationStatus.DRAFT]: 'مسودة',
      [SyrianManufacturerVerificationStatus.SUBMITTED]: 'مُقدم للتحقق',
      [SyrianManufacturerVerificationStatus.UNDER_REVIEW]: 'قيد المراجعة',
      [SyrianManufacturerVerificationStatus.VERIFIED]: 'محقق',
      [SyrianManufacturerVerificationStatus.REJECTED]: 'مرفوض',
      [SyrianManufacturerVerificationStatus.SUSPENDED]: 'معلق',
      [SyrianManufacturerVerificationStatus.EXPIRED]: 'منتهي الصلاحية',
    };

    return statusNames[status] || status;
  }
}
