/**
 * @file syrian-manufacturer.service.ts
 * @description Enterprise Syrian Manufacturer Service with Comprehensive Business Logic
 *
 * BUSINESS FEATURES:
 * - Comprehensive manufacturer management with Syrian localization
 * - Advanced search and filtering with performance optimization
 * - Business registration validation and compliance checking
 * - Integration with Syrian governorate and address system
 * - Performance analytics and quality scoring
 * - Document management and verification support
 * - Multi-language support with Arabic/English localization
 *
 * @author SouqSyria Development Team
 * @since 2025-08-09
 * @version 2.0.0 - Enterprise Edition
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  FindOptionsWhere,
  Like,
  In,
  SelectQueryBuilder,
} from 'typeorm';

import {
  SyrianManufacturerEntity,
  SyrianManufacturerVerificationStatus,
  SyrianManufacturerBusinessType,
  SyrianManufacturerSizeCategory,
} from '../entities/syrian-manufacturer.entity';
import { User } from '../../users/entities/user.entity';
import { SyrianGovernorateEntity } from '../../addresses/entities/syrian-governorate.entity';
import { ProductEntity } from '../../products/entities/product.entity';

import { SyrianManufacturerWorkflowService } from './syrian-manufacturer-workflow.service';

/**
 * Paginated manufacturers response
 */
export interface PaginatedManufacturers {
  manufacturers: SyrianManufacturerEntity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Manufacturer search and filter parameters
 */
export interface ManufacturerQueryParams {
  search?: string;
  verificationStatus?: SyrianManufacturerVerificationStatus;
  businessType?: SyrianManufacturerBusinessType;
  sizeCategory?: SyrianManufacturerSizeCategory;
  governorateId?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  hasProducts?: boolean;
  minQualityScore?: number;
  minRating?: number;
  sortBy?:
    | 'createdAt'
    | 'updatedAt'
    | 'nameEn'
    | 'nameAr'
    | 'qualityScore'
    | 'totalProducts'
    | 'averageRating';
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
  includeInactive?: boolean;
}

/**
 * Manufacturer creation parameters
 */
export interface CreateManufacturerParams {
  nameEn: string;
  nameAr: string;
  brandNameEn?: string;
  brandNameAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  businessType: SyrianManufacturerBusinessType;
  sizeCategory?: SyrianManufacturerSizeCategory;
  employeeCount?: number;
  foundedYear?: number;
  syrianTaxId?: string;
  commercialRegistry?: string;
  industrialLicense?: string;
  exportLicense?: string;
  governorateId?: number;
  addressEn?: string;
  addressAr?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  bannerUrl?: string;
  galleryImages?: string[];
  socialMediaLinks?: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    twitter?: string;
    youtube?: string;
  };
  marketingPreferences?: {
    allowEmailMarketing?: boolean;
    allowSmsMarketing?: boolean;
    preferredLanguage?: 'en' | 'ar' | 'both';
    contactFrequency?: 'daily' | 'weekly' | 'monthly' | 'never';
  };
  metadata?: {
    specializations?: string[];
    certifications?: string[];
    exportMarkets?: string[];
    customFields?: Record<string, any>;
  };
}

/**
 * Manufacturer update parameters
 */
export interface UpdateManufacturerParams
  extends Partial<CreateManufacturerParams> {
  verificationDocuments?: {
    commercialRegistry?: string;
    taxCertificate?: string;
    industrialLicense?: string;
    qualityCertificates?: string[];
    exportDocuments?: string[];
  };
}

/**
 * Manufacturer analytics data
 */
export interface ManufacturerAnalytics {
  manufacturerId: number;
  nameEn: string;
  nameAr: string;
  performanceMetrics: {
    qualityScore: number;
    totalProducts: number;
    activeProducts: number;
    averageRating: number;
    totalReviews: number;
    monthlyRevenueSyp: number;
    deliveryPerformance: number;
    customerSatisfaction: number;
    returnRate: number;
  };
  complianceStatus: {
    complianceScore: number;
    riskLevel: string;
    missingDocuments: string[];
    requiredActions: string[];
  };
  businessInsights: {
    topProducts: Array<{
      id: number;
      nameEn: string;
      nameAr: string;
      salesCount: number;
      rating: number;
    }>;
    marketTrends: {
      monthlyGrowth: number;
      seasonalTrends: string[];
    };
  };
}

@Injectable()
export class SyrianManufacturerService {
  private readonly logger = new Logger(SyrianManufacturerService.name);

  constructor(
    @InjectRepository(SyrianManufacturerEntity)
    private readonly manufacturerRepository: Repository<SyrianManufacturerEntity>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(SyrianGovernorateEntity)
    private readonly governorateRepository: Repository<SyrianGovernorateEntity>,

    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,

    private readonly workflowService: SyrianManufacturerWorkflowService,
  ) {}

  /**
   * Create a new manufacturer
   */
  async createManufacturer(
    params: CreateManufacturerParams,
    createdBy?: User,
  ): Promise<SyrianManufacturerEntity> {
    this.logger.log(
      `Creating new manufacturer: ${params.nameEn} (${params.nameAr})`,
    );

    // Check for duplicate tax ID if provided
    if (params.syrianTaxId) {
      const existingTaxId = await this.manufacturerRepository.findOne({
        where: { syrianTaxId: params.syrianTaxId, isActive: true },
      });

      if (existingTaxId) {
        throw new ConflictException(
          `Manufacturer with Syrian Tax ID ${params.syrianTaxId} already exists`,
        );
      }
    }

    // Check for duplicate commercial registry if provided
    if (params.commercialRegistry) {
      const existingRegistry = await this.manufacturerRepository.findOne({
        where: {
          commercialRegistry: params.commercialRegistry,
          isActive: true,
        },
      });

      if (existingRegistry) {
        throw new ConflictException(
          `Manufacturer with Commercial Registry ${params.commercialRegistry} already exists`,
        );
      }
    }

    // Validate and get governorate if provided
    let governorate: SyrianGovernorateEntity | undefined;
    if (params.governorateId) {
      governorate = await this.governorateRepository.findOne({
        where: { id: params.governorateId },
      });

      if (!governorate) {
        throw new BadRequestException(
          `Syrian governorate ${params.governorateId} not found`,
        );
      }
    }

    // Validate business information
    await this.validateBusinessInformation(params);

    // Create manufacturer entity
    const manufacturer = this.manufacturerRepository.create({
      ...params,
      governorate,
      createdBy,
      verificationStatus: SyrianManufacturerVerificationStatus.DRAFT,
      isActive: true,
      qualityScore: 0,
      totalProducts: 0,
      activeProducts: 0,
      averageRating: 0,
      totalReviews: 0,
      monthlyRevenueSyp: 0,
      deliveryPerformance: 0,
      customerSatisfaction: 0,
      returnRate: 0,
      sortOrder: 0,
    });

    const savedManufacturer =
      await this.manufacturerRepository.save(manufacturer);

    // Initialize workflow
    await this.workflowService.initializeManufacturerWorkflow(
      savedManufacturer.id,
    );

    this.logger.log(
      `Manufacturer ${savedManufacturer.id} created successfully`,
    );
    return savedManufacturer;
  }

  /**
   * Get manufacturer by ID with full details
   */
  async getManufacturerById(
    id: number,
    includeInactive: boolean = false,
  ): Promise<SyrianManufacturerEntity> {
    const whereConditions: FindOptionsWhere<SyrianManufacturerEntity> = { id };

    if (!includeInactive) {
      whereConditions.isActive = true;
      whereConditions.deletedAt = undefined;
    }

    const manufacturer = await this.manufacturerRepository.findOne({
      where: whereConditions,
      relations: [
        'governorate',
        'createdBy',
        'updatedBy',
        'verifiedBy',
        'products',
      ],
    });

    if (!manufacturer) {
      throw new NotFoundException(`Manufacturer ${id} not found`);
    }

    return manufacturer;
  }

  /**
   * Advanced search and filtering of manufacturers
   */
  async searchManufacturers(
    params: ManufacturerQueryParams,
  ): Promise<PaginatedManufacturers> {
    const page = params.page || 1;
    const limit = Math.min(params.limit || 10, 100); // Max 100 items per page
    const offset = (page - 1) * limit;

    const queryBuilder = this.manufacturerRepository
      .createQueryBuilder('manufacturer')
      .leftJoinAndSelect('manufacturer.governorate', 'governorate')
      .leftJoinAndSelect('manufacturer.verifiedBy', 'verifiedBy');

    // Apply basic filters
    if (!params.includeInactive) {
      queryBuilder.andWhere('manufacturer.isActive = :isActive', {
        isActive: true,
      });
      queryBuilder.andWhere('manufacturer.deletedAt IS NULL');
    }

    // Apply search
    if (params.search) {
      queryBuilder.andWhere(
        '(manufacturer.nameEn LIKE :search OR manufacturer.nameAr LIKE :search OR manufacturer.brandNameEn LIKE :search OR manufacturer.brandNameAr LIKE :search)',
        { search: `%${params.search}%` },
      );
    }

    // Apply filters
    if (params.verificationStatus) {
      queryBuilder.andWhere(
        'manufacturer.verificationStatus = :verificationStatus',
        {
          verificationStatus: params.verificationStatus,
        },
      );
    }

    if (params.businessType) {
      queryBuilder.andWhere('manufacturer.businessType = :businessType', {
        businessType: params.businessType,
      });
    }

    if (params.sizeCategory) {
      queryBuilder.andWhere('manufacturer.sizeCategory = :sizeCategory', {
        sizeCategory: params.sizeCategory,
      });
    }

    if (params.governorateId) {
      queryBuilder.andWhere('manufacturer.governorate.id = :governorateId', {
        governorateId: params.governorateId,
      });
    }

    if (params.isFeatured !== undefined) {
      queryBuilder.andWhere('manufacturer.isFeatured = :isFeatured', {
        isFeatured: params.isFeatured,
      });
    }

    if (params.hasProducts) {
      queryBuilder.andWhere('manufacturer.totalProducts > 0');
    }

    if (params.minQualityScore !== undefined) {
      queryBuilder.andWhere('manufacturer.qualityScore >= :minQualityScore', {
        minQualityScore: params.minQualityScore,
      });
    }

    if (params.minRating !== undefined) {
      queryBuilder.andWhere('manufacturer.averageRating >= :minRating', {
        minRating: params.minRating,
      });
    }

    // Count total before pagination
    const total = await queryBuilder.getCount();

    // Apply sorting
    const sortBy = params.sortBy || 'createdAt';
    const sortOrder = params.sortOrder || 'DESC';
    queryBuilder.orderBy(`manufacturer.${sortBy}`, sortOrder);

    // Secondary sort for consistent results
    queryBuilder.addOrderBy('manufacturer.id', 'DESC');

    // Apply pagination
    queryBuilder.skip(offset).take(limit);

    const manufacturers = await queryBuilder.getMany();

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      manufacturers,
      total,
      page,
      limit,
      totalPages,
      hasNext,
      hasPrev,
    };
  }

  /**
   * Update manufacturer information
   */
  async updateManufacturer(
    id: number,
    params: UpdateManufacturerParams,
    updatedBy?: User,
  ): Promise<SyrianManufacturerEntity> {
    this.logger.log(`Updating manufacturer ${id}`);

    const manufacturer = await this.getManufacturerById(id);

    // Check for duplicate tax ID if changed
    if (params.syrianTaxId && params.syrianTaxId !== manufacturer.syrianTaxId) {
      const existingTaxId = await this.manufacturerRepository.findOne({
        where: { syrianTaxId: params.syrianTaxId, isActive: true },
      });

      if (existingTaxId && existingTaxId.id !== id) {
        throw new ConflictException(
          `Another manufacturer with Syrian Tax ID ${params.syrianTaxId} already exists`,
        );
      }
    }

    // Validate and get governorate if changed
    if (
      params.governorateId &&
      params.governorateId !== manufacturer.governorate?.id
    ) {
      const governorate = await this.governorateRepository.findOne({
        where: { id: params.governorateId },
      });

      if (!governorate) {
        throw new BadRequestException(
          `Syrian governorate ${params.governorateId} not found`,
        );
      }

      manufacturer.governorate = governorate;
    }

    // Validate business information if provided
    if (this.hasBusinessInformation(params)) {
      await this.validateBusinessInformation(params);
    }

    // Update fields
    Object.assign(manufacturer, params);
    manufacturer.updatedBy = updatedBy;
    manufacturer.updatedAt = new Date();

    const updatedManufacturer =
      await this.manufacturerRepository.save(manufacturer);

    // Update quality metrics if it's a verified manufacturer
    if (
      manufacturer.verificationStatus ===
      SyrianManufacturerVerificationStatus.VERIFIED
    ) {
      await this.workflowService.updateQualityMetrics(id);
    }

    this.logger.log(`Manufacturer ${id} updated successfully`);
    return updatedManufacturer;
  }

  /**
   * Get featured manufacturers
   */
  async getFeaturedManufacturers(
    limit: number = 10,
  ): Promise<SyrianManufacturerEntity[]> {
    return this.manufacturerRepository.find({
      where: {
        isFeatured: true,
        isActive: true,
        verificationStatus: SyrianManufacturerVerificationStatus.VERIFIED,
        deletedAt: undefined,
      },
      relations: ['governorate'],
      order: { sortOrder: 'ASC', qualityScore: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get top manufacturers by quality score
   */
  async getTopManufacturers(
    limit: number = 20,
  ): Promise<SyrianManufacturerEntity[]> {
    return this.manufacturerRepository.find({
      where: {
        isActive: true,
        verificationStatus: SyrianManufacturerVerificationStatus.VERIFIED,
        deletedAt: undefined,
      },
      relations: ['governorate'],
      order: { qualityScore: 'DESC', totalProducts: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get manufacturers by business type
   */
  async getManufacturersByBusinessType(
    businessType: SyrianManufacturerBusinessType,
    limit: number = 50,
  ): Promise<SyrianManufacturerEntity[]> {
    return this.manufacturerRepository.find({
      where: {
        businessType,
        isActive: true,
        verificationStatus: SyrianManufacturerVerificationStatus.VERIFIED,
        deletedAt: undefined,
      },
      relations: ['governorate'],
      order: { qualityScore: 'DESC', createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get manufacturers by governorate
   */
  async getManufacturersByGovernorate(
    governorateId: number,
    limit: number = 50,
  ): Promise<SyrianManufacturerEntity[]> {
    return this.manufacturerRepository.find({
      where: {
        governorate: { id: governorateId },
        isActive: true,
        verificationStatus: SyrianManufacturerVerificationStatus.VERIFIED,
        deletedAt: undefined,
      },
      relations: ['governorate'],
      order: { qualityScore: 'DESC', totalProducts: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get comprehensive manufacturer analytics
   */
  async getManufacturerAnalytics(id: number): Promise<ManufacturerAnalytics> {
    const manufacturer = await this.getManufacturerById(id);

    // Get compliance status
    const complianceStatus =
      await this.workflowService.getManufacturerCompliance(id);

    // Get top products (simplified - would need proper sales data)
    const topProducts =
      manufacturer.products
        ?.filter((p) => p.isActive)
        .sort((a, b) => 0) // TODO: Implement proper sorting by product rating
        .slice(0, 10)
        .map((product) => ({
          id: product.id,
          nameEn: product.nameEn,
          nameAr: product.nameAr,
          salesCount: 0, // Placeholder - implement with actual sales data
          rating: 4.0, // Placeholder rating - implement with actual reviews
        })) || [];

    return {
      manufacturerId: manufacturer.id,
      nameEn: manufacturer.nameEn,
      nameAr: manufacturer.nameAr,
      performanceMetrics: {
        qualityScore: manufacturer.qualityScore || 0,
        totalProducts: manufacturer.totalProducts || 0,
        activeProducts: manufacturer.activeProducts || 0,
        averageRating: parseFloat(
          manufacturer.averageRating?.toString() || '0',
        ),
        totalReviews: manufacturer.totalReviews || 0,
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
      complianceStatus: {
        complianceScore: complianceStatus.complianceScore,
        riskLevel: complianceStatus.riskLevel,
        missingDocuments: complianceStatus.missingDocuments,
        requiredActions: complianceStatus.requiredActions,
      },
      businessInsights: {
        topProducts,
        marketTrends: {
          monthlyGrowth: 0, // Placeholder - implement with historical data
          seasonalTrends: [], // Placeholder - implement with market analysis
        },
      },
    };
  }

  /**
   * Soft delete manufacturer
   */
  async softDeleteManufacturer(
    id: number,
    deletedByUserId?: number,
  ): Promise<void> {
    const manufacturer = await this.getManufacturerById(id);

    manufacturer.isActive = false;
    manufacturer.deletedAt = new Date();
    manufacturer.deletedBy = deletedByUserId;

    await this.manufacturerRepository.save(manufacturer);

    this.logger.log(`Manufacturer ${id} soft deleted`);
  }

  /**
   * Restore soft-deleted manufacturer
   */
  async restoreManufacturer(id: number): Promise<SyrianManufacturerEntity> {
    const manufacturer = await this.getManufacturerById(id, true);

    if (!manufacturer.deletedAt) {
      throw new BadRequestException(`Manufacturer ${id} is not deleted`);
    }

    manufacturer.isActive = true;
    manufacturer.deletedAt = null;
    manufacturer.deletedBy = null;

    const restored = await this.manufacturerRepository.save(manufacturer);

    this.logger.log(`Manufacturer ${id} restored successfully`);
    return restored;
  }

  /**
   * Get manufacturer statistics
   */
  async getManufacturerStatistics(): Promise<{
    total: number;
    verified: number;
    pending: number;
    rejected: number;
    byBusinessType: Record<string, number>;
    byGovernorate: Record<string, number>;
    topPerformers: Array<{
      id: number;
      nameEn: string;
      qualityScore: number;
    }>;
  }> {
    const [total, verified, pending, rejected] = await Promise.all([
      this.manufacturerRepository.count({
        where: { isActive: true, deletedAt: undefined },
      }),
      this.manufacturerRepository.count({
        where: {
          verificationStatus: SyrianManufacturerVerificationStatus.VERIFIED,
          isActive: true,
          deletedAt: undefined,
        },
      }),
      this.manufacturerRepository.count({
        where: {
          verificationStatus: In([
            SyrianManufacturerVerificationStatus.SUBMITTED,
            SyrianManufacturerVerificationStatus.UNDER_REVIEW,
          ]),
          isActive: true,
          deletedAt: undefined,
        },
      }),
      this.manufacturerRepository.count({
        where: {
          verificationStatus: SyrianManufacturerVerificationStatus.REJECTED,
          isActive: true,
          deletedAt: undefined,
        },
      }),
    ]);

    // Get business type distribution
    const businessTypeResults = await this.manufacturerRepository
      .createQueryBuilder('manufacturer')
      .select('manufacturer.businessType', 'businessType')
      .addSelect('COUNT(*)', 'count')
      .where('manufacturer.isActive = :isActive', { isActive: true })
      .andWhere('manufacturer.deletedAt IS NULL')
      .groupBy('manufacturer.businessType')
      .getRawMany();

    const byBusinessType = businessTypeResults.reduce(
      (acc, result) => {
        acc[result.businessType] = parseInt(result.count);
        return acc;
      },
      {} as Record<string, number>,
    );

    // Get governorate distribution
    const governorateResults = await this.manufacturerRepository
      .createQueryBuilder('manufacturer')
      .leftJoin('manufacturer.governorate', 'governorate')
      .select('governorate.nameEn', 'governorate')
      .addSelect('COUNT(*)', 'count')
      .where('manufacturer.isActive = :isActive', { isActive: true })
      .andWhere('manufacturer.deletedAt IS NULL')
      .groupBy('governorate.id')
      .getRawMany();

    const byGovernorate = governorateResults.reduce(
      (acc, result) => {
        acc[result.governorate || 'Unknown'] = parseInt(result.count);
        return acc;
      },
      {} as Record<string, number>,
    );

    // Get top performers
    const topPerformers = await this.manufacturerRepository.find({
      where: {
        verificationStatus: SyrianManufacturerVerificationStatus.VERIFIED,
        isActive: true,
        deletedAt: undefined,
      },
      order: { qualityScore: 'DESC' },
      take: 10,
      select: ['id', 'nameEn', 'qualityScore'],
    });

    return {
      total,
      verified,
      pending,
      rejected,
      byBusinessType,
      byGovernorate,
      topPerformers: topPerformers.map((m) => ({
        id: m.id,
        nameEn: m.nameEn,
        qualityScore: m.qualityScore || 0,
      })),
    };
  }

  /**
   * PRIVATE HELPER METHODS
   */

  private async validateBusinessInformation(
    params: Partial<CreateManufacturerParams>,
  ): Promise<void> {
    // Validate Syrian Tax ID format (simplified)
    if (params.syrianTaxId && !params.syrianTaxId.match(/^TAX-SYR-\d{9,12}$/)) {
      throw new BadRequestException(
        'Invalid Syrian Tax ID format. Expected: TAX-SYR-XXXXXXXXX',
      );
    }

    // Validate Commercial Registry format (simplified)
    if (
      params.commercialRegistry &&
      !params.commercialRegistry.match(/^REG-[A-Z]{2,3}-\d{4}-\d{6}$/)
    ) {
      throw new BadRequestException(
        'Invalid Commercial Registry format. Expected: REG-XXX-YYYY-XXXXXX',
      );
    }

    // Validate email format
    if (params.email && !params.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      throw new BadRequestException('Invalid email address format');
    }

    // Validate website URL format
    if (params.website && !params.website.match(/^https?:\/\/.+/)) {
      throw new BadRequestException(
        'Website URL must start with http:// or https://',
      );
    }

    // Validate phone numbers (simplified Syrian format)
    if (params.phone && !params.phone.match(/^\+963-\d{2,3}-\d{6,7}$/)) {
      throw new BadRequestException(
        'Invalid phone format. Expected: +963-XX-XXXXXXX',
      );
    }

    if (params.mobile && !params.mobile.match(/^\+963-9\d{8}$/)) {
      throw new BadRequestException(
        'Invalid mobile format. Expected: +963-9XXXXXXXX',
      );
    }
  }

  private hasBusinessInformation(
    params: Partial<CreateManufacturerParams>,
  ): boolean {
    return !!(
      params.syrianTaxId ||
      params.commercialRegistry ||
      params.email ||
      params.website ||
      params.phone ||
      params.mobile
    );
  }
}
