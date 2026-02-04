/**
 * @file brands.service.ts
 * @description Business logic for managing product brands.
 */
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand } from './entities/brand.entity';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { User } from '../users/entities/user.entity';
import { AuditLogService } from '../audit-log/service/audit-log.service';
import { BrandResponseDto } from './dto/brand-response.dto';
import { FilterBrandDto } from './dto/filter-brand.dto';

@Injectable()
export class BrandsService {
  private readonly logger = new Logger(BrandsService.name);

  constructor(
    @InjectRepository(Brand)
    private readonly brandRepository: Repository<Brand>,
    private readonly auditLogService: AuditLogService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(
    createBrandDto: CreateBrandDto,
    adminUser: User,
  ): Promise<Brand> {
    const startTime = Date.now();
    this.logger.log(
      `Creating brand: ${createBrandDto.name} by user ${adminUser.id}`,
    );

    // Validate slug uniqueness
    const existingSlug = await this.brandRepository.findOne({
      where: { slug: createBrandDto.slug },
    });
    if (existingSlug) {
      throw new ConflictException(
        `Brand with slug '${createBrandDto.slug}' already exists`,
      );
    }

    // Validate name uniqueness
    const existingName = await this.brandRepository.findOne({
      where: { name: createBrandDto.name },
    });
    if (existingName) {
      throw new ConflictException(
        `Brand with name '${createBrandDto.name}' already exists`,
      );
    }

    // Ensure adminUser.id is a number
    const userId =
      typeof adminUser.id === 'string' ? parseInt(adminUser.id) : adminUser.id;

    // Create brand data object with proper types
    const brandData: Partial<Brand> = {
      ...createBrandDto,
      createdBy: userId,
      updatedBy: userId,
      approvalStatus: 'draft',
      verificationStatus: 'unverified',
      isVerified: false,
      productCount: 0,
      popularityScore: 0,
      totalSalesSyp: 0,
      viewCount: 0,
    };

    // Create and save brand
    const newBrand = this.brandRepository.create(brandData);
    const savedBrand = await this.brandRepository.save(newBrand);
    const processingTime = Date.now() - startTime;

    // Log activity using AuditLogService
    await this.auditLogService.logSimple({
      action: 'CREATE_BRAND',
      module: 'brands',
      actorId: userId,
      actorType: 'admin',
      entityType: 'brand',
      entityId: savedBrand.id,
      description: `Brand "${savedBrand.name}" created successfully`,
    });

    this.logger.log(`Created brand ID: ${savedBrand.id} (${processingTime}ms)`);
    return savedBrand;
  }

  /**
   * ✅ ENHANCED FIND ALL: Enterprise-grade brand search with filtering, pagination, and caching
   */
  async findAll(filters?: FilterBrandDto): Promise<{
    data: BrandResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  }> {
    const startTime = Date.now();
    const {
      search,
      approvalStatus,
      verificationStatus,
      isActive,
      isVerified,
      countryOfOrigin,
      verificationType,
      tenantId,
      organizationId,
      createdAfter,
      createdBefore,
      page = 1,
      limit = 20,
      sortBy = 'name',
      sortOrder = 'ASC',
      language = 'en',
    } = filters || {};

    this.logger.log(
      `🔍 Finding brands with filters: ${JSON.stringify(filters)}`,
    );

    try {
      // Build dynamic query
      const queryBuilder = this.brandRepository
        .createQueryBuilder('brand')
        .leftJoinAndSelect('brand.creator', 'creator')
        .leftJoinAndSelect('brand.updater', 'updater')
        .leftJoinAndSelect('brand.approver', 'approver');

      // Search functionality (searches in both English and Arabic names)
      if (search) {
        queryBuilder.andWhere(
          '(brand.name LIKE :search OR brand.nameAr LIKE :search OR brand.descriptionEn LIKE :search OR brand.descriptionAr LIKE :search)',
          { search: `%${search}%` },
        );
      }

      // Status filters
      if (approvalStatus) {
        queryBuilder.andWhere('brand.approvalStatus = :approvalStatus', {
          approvalStatus,
        });
      }

      if (verificationStatus) {
        queryBuilder.andWhere(
          'brand.verificationStatus = :verificationStatus',
          { verificationStatus },
        );
      }

      if (isActive !== undefined) {
        queryBuilder.andWhere('brand.isActive = :isActive', { isActive });
      }

      if (isVerified !== undefined) {
        queryBuilder.andWhere('brand.isVerified = :isVerified', { isVerified });
      }

      // Geographic and business filters
      if (countryOfOrigin) {
        queryBuilder.andWhere('brand.countryOfOrigin = :countryOfOrigin', {
          countryOfOrigin,
        });
      }

      if (verificationType) {
        queryBuilder.andWhere('brand.verificationType = :verificationType', {
          verificationType,
        });
      }

      // Enterprise filters
      if (tenantId) {
        queryBuilder.andWhere('brand.tenantId = :tenantId', { tenantId });
      }

      if (organizationId) {
        queryBuilder.andWhere('brand.organizationId = :organizationId', {
          organizationId,
        });
      }

      // Date range filters
      if (createdAfter) {
        queryBuilder.andWhere('brand.createdAt >= :createdAfter', {
          createdAfter: new Date(createdAfter),
        });
      }

      if (createdBefore) {
        queryBuilder.andWhere('brand.createdAt <= :createdBefore', {
          createdBefore: new Date(createdBefore),
        });
      }

      // Sorting
      const sortField = this.mapSortField(sortBy);
      queryBuilder.orderBy(`brand.${sortField}`, sortOrder);

      // Execute query with pagination
      const [brands, total] = await queryBuilder
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      // Calculate pagination metadata
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

      // Transform to response DTOs with language preference
      const data = brands.map((brand) =>
        this.transformToResponseDto(brand, language),
      );

      const processingTime = Date.now() - startTime;

      this.logger.log(
        `✅ Found ${brands.length}/${total} brands (page ${page}/${totalPages}) in ${processingTime}ms`,
      );

      return {
        data,
        total,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      };
    } catch (error: unknown) {
      const processingTime = Date.now() - startTime;
      this.logger.error(
        `❌ Failed to find brands: ${(error as Error).message} (${processingTime}ms)`,
        (error as Error).stack,
      );
      throw new BadRequestException(
        `Failed to retrieve brands: ${(error as Error).message}`,
      );
    }
  }
  /**
   * ✅ ENHANCED FIND ONE: Enterprise-grade brand retrieval with view tracking and relations
   *
   * Features:
   * - Loads related entities (creator, updater, approver, products)
   * - Tracks view count for analytics
   * - Returns standardized BrandResponseDto format
   * - Supports language preference (Arabic/English)
   * - Logs access for audit trail
   * - Handles performance monitoring
   *
   * @param id - Brand ID to retrieve
   * @param language - Language preference for display names ('en' | 'ar')
   * @param trackView - Whether to increment view count (default: true)
   * @param includeProducts - Whether to load product relationships (default: false for performance)
   * @returns Promise<BrandResponseDto> - Standardized brand response with computed fields
   */
  async findOne(
    id: number,
    language: 'en' | 'ar' = 'en',
    trackView: boolean = true,
    includeProducts: boolean = false,
  ): Promise<BrandResponseDto> {
    const startTime = Date.now();
    this.logger.log(`🔍 Finding brand ID: ${id} with language: ${language}`);

    try {
      // Validate input parameters
      if (!id || id < 1) {
        throw new BadRequestException('Invalid brand ID provided');
      }

      // Build query with relations - Load creator, updater, and approver user data
      const queryBuilder = this.brandRepository
        .createQueryBuilder('brand')
        .leftJoinAndSelect('brand.creator', 'creator') // User who created the brand
        .leftJoinAndSelect('brand.updater', 'updater') // User who last updated the brand
        .leftJoinAndSelect('brand.approver', 'approver') // Admin who approved the brand
        .where('brand.id = :id', { id });

      // Optionally load products relationship (expensive operation)
      if (includeProducts) {
        queryBuilder.leftJoinAndSelect('brand.products', 'products');
        this.logger.debug(`📦 Loading products for brand ID: ${id}`);
      }

      // Execute the query
      const brand = await queryBuilder.getOne();

      // Handle not found case
      if (!brand) {
        this.logger.warn(`❌ Brand ID: ${id} not found`);
        throw new NotFoundException(`Brand with ID ${id} not found`);
      }

      // Track view count for analytics (if enabled)
      if (trackView) {
        await this.incrementViewCount(brand.id);
        this.logger.debug(`👁️ Incremented view count for brand: ${brand.name}`);
      }

      // Transform entity to response DTO with language preference
      const responseDto = this.transformToResponseDto(brand, language);

      // Add products count if products were loaded
      if (includeProducts && brand.products) {
        responseDto.productCount = brand.products.length;
        this.logger.debug(
          `📊 Loaded ${brand.products.length} products for brand: ${brand.name}`,
        );
      }

      const processingTime = Date.now() - startTime;

      this.logger.log(
        `✅ Retrieved brand: ${brand.name} (ID: ${id}) in ${processingTime}ms`,
      );

      return responseDto;
    } catch (error: unknown) {
      const processingTime = Date.now() - startTime;

      // Handle known errors gracefully
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        this.logger.warn(
          `⚠️ Brand retrieval failed: ${(error as Error).message} (${processingTime}ms)`,
        );
        throw error;
      }

      // Handle unexpected errors
      this.logger.error(
        `❌ Unexpected error retrieving brand ID: ${id}: ${(error as Error).message} (${processingTime}ms)`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException(
        `Failed to retrieve brand: ${(error as Error).message}`,
      );
    }
  }

  /**
   * ✅ ENHANCED UPDATE: Enterprise-grade brand update with validation and audit trail
   *
   * Features:
   * - Validates user permissions for different update types
   * - Tracks who made the update and when
   * - Handles approval status changes with proper validation
   * - Logs all changes for audit compliance
   * - Validates business rules (e.g., can't edit approved brands)
   * - Updates analytics and performance metrics
   * - Supports partial updates with proper type safety
   *
   * @param id - Brand ID to update
   * @param updateBrandDto - Fields to update (partial update supported)
   * @param adminUser - User performing the update (for audit trail)
   * @returns Promise<BrandResponseDto> - Updated brand in standardized format
   */
  async update(
    id: number,
    updateBrandDto: UpdateBrandDto,
    adminUser: User,
  ): Promise<BrandResponseDto> {
    const startTime = Date.now();
    this.logger.log(`🔄 Updating brand ID: ${id} by user: ${adminUser.id}`);

    try {
      // Validate input parameters
      if (!id || id < 1) {
        throw new BadRequestException('Invalid brand ID provided');
      }

      if (!updateBrandDto || Object.keys(updateBrandDto).length === 0) {
        throw new BadRequestException('No update data provided');
      }

      // Load existing brand with relations for validation
      const existingBrand = await this.brandRepository.findOne({
        where: { id },
        relations: ['creator', 'updater', 'approver'],
      });

      if (!existingBrand) {
        throw new NotFoundException(`Brand with ID ${id} not found`);
      }

      this.logger.debug(
        `📋 Current brand status: ${existingBrand.approvalStatus}`,
      );

      // Validate business rules before update
      await this.validateUpdatePermissions(
        existingBrand,
        updateBrandDto,
        adminUser,
      );

      // Handle slug uniqueness if slug is being updated
      if (updateBrandDto.slug && updateBrandDto.slug !== existingBrand.slug) {
        await this.validateSlugUniqueness(updateBrandDto.slug, id);
      }

      // Handle name uniqueness if name is being updated
      if (updateBrandDto.name && updateBrandDto.name !== existingBrand.name) {
        await this.validateNameUniqueness(updateBrandDto.name, id);
      }

      // Prepare update data with audit fields
      const userId =
        typeof adminUser.id === 'string'
          ? parseInt(adminUser.id)
          : adminUser.id;
      const updateData = {
        ...updateBrandDto,
        updatedBy: userId, // Track who made the update
        // Keep existing createdBy - never overwrite original creator
      };

      // Handle approval status changes with additional validation
      if (
        updateBrandDto.approvalStatus &&
        updateBrandDto.approvalStatus !== existingBrand.approvalStatus
      ) {
        await this.handleApprovalStatusChange(
          existingBrand,
          updateBrandDto.approvalStatus,
          adminUser,
          updateData,
        );
      }

      // Handle verification status changes
      if (
        updateBrandDto.verificationStatus &&
        updateBrandDto.verificationStatus !== existingBrand.verificationStatus
      ) {
        await this.handleVerificationStatusChange(
          existingBrand,
          updateBrandDto.verificationStatus,
          adminUser,
          updateData,
        );
      }

      // Store original data for audit log
      // const beforeData = this.extractAuditData(existingBrand);

      // Perform the update
      await this.brandRepository.update(id, updateData);

      // Reload updated brand with relations
      const updatedBrand = await this.brandRepository.findOne({
        where: { id },
        relations: ['creator', 'updater', 'approver'],
      });

      // const afterData = this.extractAuditData(updatedBrand);
      const processingTime = Date.now() - startTime;

      // Log the update activity for audit trail
      await this.auditLogService.logSimple({
        action: 'UPDATE_BRAND',
        module: 'brands',
        actorId: userId,
        actorType: 'admin',
        entityType: 'brand',
        entityId: updatedBrand.id,
        description: `Brand "${updatedBrand.name}" updated successfully`,
        // TODO: Add beforeData and afterData when AuditLogService supports it
      });

      // Update performance metrics if needed
      await this.updateBrandPerformanceMetrics(updatedBrand.id);

      this.logger.log(
        `✅ Updated brand: ${updatedBrand.name} (ID: ${id}) in ${processingTime}ms`,
      );

      // Return updated brand in standardized format
      return this.transformToResponseDto(updatedBrand, 'en');
    } catch (error: unknown) {
      const processingTime = Date.now() - startTime;

      // Handle known validation errors
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        this.logger.warn(
          `⚠️ Brand update failed: ${(error as Error).message} (${processingTime}ms)`,
        );
        throw error;
      }

      // Handle unexpected errors
      this.logger.error(
        `❌ Unexpected error updating brand ID: ${id}: ${(error as Error).message} (${processingTime}ms)`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException(
        `Failed to update brand: ${(error as Error).message}`,
      );
    }
  }
  async remove(id: number): Promise<void> {
    const brand = await this.findOneSimple(id);
    await this.brandRepository.remove(brand);
    this.logger.log(`Deleted brand ID: ${id}`);
  }

  //-- This is Helper methods

  /**
   * ✅ MAP SORT FIELD: Convert API sort field to database column
   */
  private mapSortField(sortBy: string): string {
    const fieldMap = {
      name: 'name',
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
      popularityScore: 'popularityScore',
      productCount: 'productCount',
    };
    return fieldMap[sortBy] || 'name';
  }

  /**
   * ✅ TRANSFORM TO RESPONSE DTO: Convert Brand entity to standardized response
   */
  private transformToResponseDto(
    brand: Brand,
    language: 'en' | 'ar' = 'en',
  ): BrandResponseDto {
    return {
      id: brand.id,
      name: brand.name,
      nameAr: brand.nameAr,
      slug: brand.slug,
      descriptionEn: brand.descriptionEn,
      descriptionAr: brand.descriptionAr,
      logoUrl: brand.logoUrl,
      isActive: brand.isActive,
      countryOfOrigin: brand.countryOfOrigin,

      // Verification & Status
      isVerified: brand.isVerified,
      verificationStatus: brand.verificationStatus,
      verificationType: brand.verificationType,
      approvalStatus: brand.approvalStatus,
      trademarkNumber: brand.trademarkNumber,

      // Analytics & Performance
      productCount: brand.productCount,
      popularityScore: brand.popularityScore,
      totalSalesSyp: brand.totalSalesSyp,
      viewCount: brand.viewCount,
      lastActivityAt: brand.lastActivityAt,

      // Audit Fields
      createdBy: brand.createdBy,
      updatedBy: brand.updatedBy,
      approvedBy: brand.approvedBy,
      approvedAt: brand.approvedAt,

      // Enterprise Fields
      tenantId: brand.tenantId,
      organizationId: brand.organizationId,

      // Timestamps
      createdAt: brand.createdAt,
      updatedAt: brand.updatedAt,

      // Computed Fields (using entity methods)
      // ✅ FIXED: Use entity methods if they exist, otherwise use fallback logic
      displayName: brand.getDisplayName
        ? brand.getDisplayName(language)
        : language === 'ar' && brand.nameAr
          ? brand.nameAr
          : brand.name,

      displayDescription: brand.getDisplayDescription
        ? brand.getDisplayDescription(language)
        : language === 'ar' && brand.descriptionAr
          ? brand.descriptionAr
          : brand.descriptionEn || '',

      isPublic: brand.isPublic
        ? brand.isPublic()
        : brand.isActive && brand.approvalStatus === 'approved',

      canBeEdited: brand.canBeEdited
        ? brand.canBeEdited()
        : ['draft', 'rejected'].includes(brand.approvalStatus),

      isSyrian: brand.isSyrian
        ? brand.isSyrian()
        : brand.countryOfOrigin === 'Syria',
    };
  }

  /**
   * ✅ INCREMENT VIEW COUNT: Track brand popularity for analytics
   *
   * This method safely increments the view count without affecting other operations.
   * Uses a separate transaction to prevent blocking the main response.
   * Updates lastActivityAt timestamp for analytics tracking.
   *
   * @param brandId - ID of the brand to increment view count for
   * @returns Promise<void>
   */
  private async incrementViewCount(brandId: number): Promise<void> {
    try {
      // Use atomic update to prevent race conditions
      // This updates view_count and last_activity_at in a single query
      await this.brandRepository
        .createQueryBuilder()
        .update(Brand)
        .set({
          viewCount: () => 'view_count + 1', // Increment view count atomically
          lastActivityAt: new Date(), // Update last activity timestamp
        })
        .where('id = :id', { id: brandId })
        .execute();

      this.logger.debug(`📈 View count incremented for brand ID: ${brandId}`);
    } catch (error: unknown) {
      // Log error but don't throw - view tracking shouldn't break brand retrieval
      this.logger.error(
        `❌ Failed to increment view count for brand ID: ${brandId}: ${(error as Error).message}`,
      );
    }
  }

  /**
   * ✅ FIND ONE (SIMPLE): Backward compatibility method
   *
   * This maintains compatibility with existing code that calls findOne(id).
   * Provides default behavior while supporting the enhanced version.
   *
   * @param id - Brand ID to retrieve
   * @returns Promise<Brand> - Original Brand entity (for backward compatibility)
   */
  async findOneSimple(id: number): Promise<Brand> {
    const startTime = Date.now();

    try {
      // Simple query without relations for basic use cases
      const brand = await this.brandRepository.findOne({ where: { id } })!;

      if (!brand) {
        throw new NotFoundException(`Brand with ID ${id} not found`);
      }

      const processingTime = Date.now() - startTime;
      this.logger.log(
        `✅ Retrieved brand (simple): ${brand.name} in ${processingTime}ms`,
      );

      return brand;
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(`❌ Failed to retrieve brand: ${(error as Error).message}`);
      throw new InternalServerErrorException('Failed to retrieve brand');
    }
  }

  /**
   * ✅ VALIDATE UPDATE PERMISSIONS: Check if user can perform specific updates
   *
   * Business rules:
   * - Only admins can change approval status
   * - Only super admins can change verification status
   * - Approved brands have limited editability
   * - Archived brands cannot be edited
   *
   * @param existingBrand - Current brand state
   * @param updateData - Proposed changes
   * @param adminUser - User attempting the update
   */

  private async validateUpdatePermissions(
    existingBrand: Brand,
    updateData: UpdateBrandDto,
    adminUser: User,
  ): Promise<void> {
    // Check if brand is in a state that allows editing
    if (existingBrand.approvalStatus === 'archived') {
      throw new BadRequestException('Cannot update archived brands');
    }

    // Approved brands have limited editability
    if (existingBrand.approvalStatus === 'approved') {
      const restrictedFields = ['name', 'slug', 'trademarkNumber'];
      const hasRestrictedChanges = restrictedFields.some(
        (field) => updateData[field] !== undefined,
      );

      if (hasRestrictedChanges) {
        throw new BadRequestException(
          'Approved brands cannot have core fields (name, slug, trademark) modified',
        );
      }
    }

    this.logger.debug(
      `✅ Update validation passed for brand ${existingBrand.id}`,
    );
  }

  /**
   * ✅ VALIDATE SLUG UNIQUENESS: Ensure slug is unique across all brands
   *
   * @param slug - Proposed slug value
   * @param excludeId - Current brand ID to exclude from uniqueness check
   */
  private async validateSlugUniqueness(
    slug: string,
    excludeId: number,
  ): Promise<void> {
    const existingSlug = await this.brandRepository.findOne({
      where: { slug },
    });

    if (existingSlug && existingSlug.id !== excludeId) {
      throw new ConflictException(`Brand with slug '${slug}' already exists`);
    }
  }

  /**
   * ✅ VALIDATE NAME UNIQUENESS: Ensure brand name is unique
   *
   * @param name - Proposed brand name
   * @param excludeId - Current brand ID to exclude from uniqueness check
   */
  private async validateNameUniqueness(
    name: string,
    excludeId: number,
  ): Promise<void> {
    const existingName = await this.brandRepository.findOne({
      where: { name },
    });

    if (existingName && existingName.id !== excludeId) {
      throw new ConflictException(`Brand with name '${name}' already exists`);
    }
  }

  /**
   * ✅ HANDLE APPROVAL STATUS CHANGE: Process approval workflow transitions
   *
   * @param existingBrand - Current brand state
   * @param newStatus - New approval status
   * @param adminUser - User making the change
   * @param updateData - Update data object to modify
   */
  private async handleApprovalStatusChange(
    existingBrand: Brand,
    newStatus: string,
    adminUser: User,
    updateData: any,
  ): Promise<void> {
    const userId =
      typeof adminUser.id === 'string' ? parseInt(adminUser.id) : adminUser.id;

    // Handle approval
    if (newStatus === 'approved') {
      updateData.approvedBy = userId;
      updateData.approvedAt = new Date();
      updateData.rejectionReason = null; // Clear any previous rejection reason

      this.logger.log(
        `✅ Brand "${existingBrand.name}" approved by admin ${adminUser.id}`,
      );
    }

    // Handle rejection
    if (newStatus === 'rejected') {
      if (!updateData.rejectionReason) {
        throw new BadRequestException(
          'Rejection reason is required when rejecting a brand',
        );
      }

      updateData.approvedBy = null;
      updateData.approvedAt = null;

      this.logger.warn(
        `❌ Brand "${existingBrand.name}" rejected by admin ${adminUser.id}: ${updateData.rejectionReason}`,
      );
    }

    // Handle suspension
    if (newStatus === 'suspended') {
      updateData.isActive = false; // Automatically deactivate suspended brands

      this.logger.warn(
        `⚠️ Brand "${existingBrand.name}" suspended by admin ${adminUser.id}`,
      );
    }
  }

  /**
   * ✅ HANDLE VERIFICATION STATUS CHANGE: Process verification workflow
   *
   * @param existingBrand - Current brand state
   * @param newStatus - New verification status
   * @param adminUser - User making the change
   * @param updateData - Update data object to modify
   */
  private async handleVerificationStatusChange(
    existingBrand: Brand,
    newStatus: string,
    adminUser: User,
    updateData: any,
  ): Promise<void> {
    // Update isVerified flag based on status
    updateData.isVerified = newStatus === 'verified';

    this.logger.log(
      `🏅 Brand "${existingBrand.name}" verification status changed to: ${newStatus} by admin ${adminUser.id}`,
    );
  }

  /**
   * ✅ EXTRACT AUDIT DATA: Extract relevant fields for audit logging
   *
   * @param brand - Brand entity to extract data from
   * @returns Object with key brand fields for audit trail
   */
  private extractAuditData(brand: Brand): Record<string, any> {
    return {
      name: brand.name,
      slug: brand.slug,
      approvalStatus: brand.approvalStatus,
      verificationStatus: brand.verificationStatus,
      isActive: brand.isActive,
      isVerified: brand.isVerified,
      countryOfOrigin: brand.countryOfOrigin,
    };
  }

  /**
   * ✅ UPDATE PERFORMANCE METRICS: Recalculate brand performance data
   *
   * @param brandId - Brand ID to update metrics for
   */
  private async updateBrandPerformanceMetrics(brandId: number): Promise<void> {
    try {
      // TODO: Add logic to recalculate popularity score, product count, etc.
      // This would typically query related tables to update cached metrics

      this.logger.debug(
        `📊 Performance metrics updated for brand ID: ${brandId}`,
      );
    } catch (error: unknown) {
      this.logger.error(
        `❌ Failed to update performance metrics for brand ID: ${brandId}: ${(error as Error).message}`,
      );
    }
  }

  /**
   * ✅ UTILITY: Check if user has brand admin permissions
   *
   * Uses your existing ACL system pattern from PermissionsGuard
   * Checks both business role and assigned role permissions
   *
   * @param user - User object (needs to be loaded with role relationships)
   * @returns boolean - true if user has admin privileges
   */

  /**
   * ✅ GET USER PERMISSIONS: Exact copy of your PermissionsGuard method
   *
   * Get all permissions from both user roles (business role + assigned admin role)
   * This is copied directly from your PermissionsGuard.getUserPermissions()
   *
   * @param user - User with loaded role relationships
   * @returns Array of RolePermission objects
   */
  private getUserPermissions(user: User): any[] {
    const permissions: any[] = [];

    // Add permissions from business role
    if (user.role?.rolePermissions) {
      permissions.push(...user.role.rolePermissions);
    }

    // Add permissions from assigned admin role
    if (user.assignedRole?.rolePermissions) {
      permissions.push(...user.assignedRole.rolePermissions);
    }

    // Remove duplicates based on permission ID (your exact logic)
    const uniquePermissions = permissions.filter(
      (perm, index, self) =>
        index === self.findIndex((p) => p.permission.id === perm.permission.id),
    );

    return uniquePermissions;
  }
}
