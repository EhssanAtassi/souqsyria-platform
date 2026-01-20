/**
 * @file categories.service.ts
 * @description Core Categories Service for basic CRUD operations
 *
 * RESPONSIBILITIES:
 * - Basic CRUD operations (create, read, update, delete)
 * - Entity validation and business rules
 * - Audit logging integration
 * - Error handling and performance tracking
 *
 * DELEGATES TO:
 * - CategoryHierarchyService for parent/child management
 * - CategoryApprovalService for workflow operations
 * - CategorySearchService for search and filtering
 * - CategoryAnalyticsService for metrics and performance
 *
 * @author SouqSyria Development Team
 * @since 2025-06-01
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
import { Category } from '../entities/category.entity';
import { User } from '../../users/entities/user.entity';
import { AuditLogService } from '../../audit-log/service/audit-log.service';
import { CategoryHierarchyService } from './category-hierarchy.service';
import { CategoryApprovalService } from './category-approval.service';
import {
  CategoryResponseDto,
  CreateCategoryDto,
  UpdateCategoryDto,
} from '../dto/index-dto';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly auditLogService: AuditLogService,
    private readonly hierarchyService: CategoryHierarchyService,
    private readonly approvalService: CategoryApprovalService,
  ) {
    this.logger.log('🚀 Core Categories Service initialized');
  }

  /**
   * GET FEATURED CATEGORIES
   *
   * Simple direct query for featured categories without complex search service
   * Used for homepage and promotional displays
   *
   * @param limit - Maximum number of featured categories (default: 4)
   * @returns Featured categories array
   */
  async getFeaturedCategories(limit: number = 4): Promise<Category[]> {
    this.logger.log(`⭐ Getting featured categories (limit: ${limit})`);

    const sanitizedLimit = Math.min(Math.max(1, limit || 4), 20);

    const categories = await this.categoryRepository.find({
      where: {
        isFeatured: true,
        isActive: true,
        approvalStatus: 'approved',
      },
      order: {
        featuredPriority: 'DESC',
        sortOrder: 'ASC',
        createdAt: 'DESC',
      },
      take: sanitizedLimit,
    });

    this.logger.log(`✅ Found ${categories.length} featured categories`);
    return categories;
  }

  // ============================================================================
  // CORE CRUD OPERATIONS
  // ============================================================================

  /**
   * CREATE CATEGORY
   *
   * Creates a new category with validation and audit logging.
   * Delegates hierarchy management to CategoryHierarchyService.
   *
   * @param createCategoryDto - Category creation data
   * @param adminUser - Admin creating the category
   * @returns Created category response
   */
  async create(
    createCategoryDto: CreateCategoryDto,
    adminUser: User,
  ): Promise<CategoryResponseDto> {
    const startTime = Date.now();
    this.logger.log(
      `Creating category: ${createCategoryDto.nameEn} by admin: ${adminUser.id}`,
    );

    try {
      // 1. Validate unique names and slug
      await this.validateUniqueNames(
        createCategoryDto.nameEn,
        createCategoryDto.nameAr,
        createCategoryDto.slug,
        createCategoryDto.parentId,
      );

      // 2. Validate Syrian market rules
      await this.validateSyrianMarketRules(createCategoryDto);

      // 3. Handle hierarchy validation (delegate to hierarchy service)
      const hierarchyData =
        await this.hierarchyService.validateAndPrepareHierarchy(
          createCategoryDto.parentId,
        );

      // 4. Create category entity
      const userId =
        typeof adminUser.id === 'string'
          ? parseInt(adminUser.id)
          : adminUser.id;

      const category = this.categoryRepository.create({
        ...createCategoryDto,
        ...hierarchyData, // depth, path, parent from hierarchy service
        approvalStatus: 'draft', // Always start as draft
        createdBy: userId,
        updatedBy: userId,
        productCount: 0,
        viewCount: 0,
        popularityScore: 0,
      });

      // 5. Save category
      const savedCategory = await this.categoryRepository.save(category);

      // 6. Update parent metrics if needed
      if (hierarchyData.parent) {
        await this.hierarchyService.updateParentMetrics(
          hierarchyData.parent.id,
        );
      }

      // 7. Log audit trail
      await this.auditLogService.logSimple({
        action: 'CREATE_CATEGORY',
        module: 'categories',
        actorId: userId,
        actorType: 'admin',
        entityType: 'category',
        entityId: savedCategory.id,
        description: `Category "${savedCategory.nameEn}" created`,
      });

      const processingTime = Date.now() - startTime;
      this.logger.log(
        `✅ Category created: ID ${savedCategory.id} (${processingTime}ms)`,
      );

      return await this.findById(savedCategory.id, 'en');
    } catch (error) {
      this.logger.error(
        `❌ Failed to create category: ${error.message}`,
        error.stack,
      );

      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to create category');
    }
  }

  /**
   * FIND CATEGORY BY ID
   *
   * Retrieves a single category with all details and relationships.
   *
   * @param id - Category ID
   * @param language - Language preference
   * @returns Category response with full details
   */
  async findById(
    id: number,
    language: 'en' | 'ar' = 'en',
  ): Promise<CategoryResponseDto> {
    this.logger.log(`Finding category by ID: ${id}`);

    try {
      if (!id || id < 1) {
        throw new BadRequestException('Invalid category ID');
      }

      const category = await this.categoryRepository.findOne({
        where: { id },
        relations: ['parent', 'children', 'creator', 'updater', 'approver'],
      });

      if (!category) {
        throw new NotFoundException(`Category with ID ${id} not found`);
      }

      // Delegate breadcrumb generation to hierarchy service
      const breadcrumbs = await this.hierarchyService.generateBreadcrumbs(
        category,
        language,
      );

      return this.transformToResponseDto(category, language, breadcrumbs);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      this.logger.error(`❌ Failed to find category ${id}: ${error.message}`);
      throw new InternalServerErrorException(`Failed to find category ${id}`);
    }
  }

  /**
   * UPDATE CATEGORY
   *
   * Updates category with business rule validation.
   * Delegates approval workflow to CategoryApprovalService.
   *
   * @param id - Category ID to update
   * @param updateCategoryDto - Update data
   * @param adminUser - Admin performing update
   * @returns Updated category response
   */
  async update(
    id: number,
    updateCategoryDto: UpdateCategoryDto,
    adminUser: User,
  ): Promise<CategoryResponseDto> {
    const startTime = Date.now();
    this.logger.log(`Updating category ${id} by admin: ${adminUser.id}`);

    try {
      // 1. Get existing category
      const existingCategory = await this.categoryRepository.findOne({
        where: { id },
        relations: ['parent', 'children'],
      });

      if (!existingCategory) {
        throw new NotFoundException(`Category with ID ${id} not found`);
      }

      // 2. Validate update permissions and rules
      await this.validateCategoryUpdate(
        id,
        updateCategoryDto,
        existingCategory,
        adminUser,
      );

      // 3. Handle hierarchy changes (delegate to hierarchy service)
      if (updateCategoryDto.parentId !== undefined) {
        await this.hierarchyService.handleParentChange(
          existingCategory,
          updateCategoryDto.parentId,
        );
      }

      // 4. Handle approval status changes (delegate to approval service)
      if (
        updateCategoryDto.approvalStatus &&
        updateCategoryDto.approvalStatus !== existingCategory.approvalStatus
      ) {
        await this.approvalService.handleStatusChange(
          existingCategory,
          updateCategoryDto.approvalStatus,
          adminUser,
          updateCategoryDto,
        );
      }

      // 5. Prepare update data
      const userId =
        typeof adminUser.id === 'string'
          ? parseInt(adminUser.id)
          : adminUser.id;
      const updateData = {
        ...updateCategoryDto,
        updatedBy: userId,
      };

      // Remove undefined values
      Object.keys(updateData).forEach((key) => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      // 6. Perform update
      await this.categoryRepository.update(id, updateData);

      // 7. Log audit trail
      await this.auditLogService.logSimple({
        action: 'UPDATE_CATEGORY',
        module: 'categories',
        actorId: userId,
        actorType: 'admin',
        entityType: 'category',
        entityId: id,
        description: `Category "${existingCategory.nameEn}" updated`,
      });

      const processingTime = Date.now() - startTime;
      this.logger.log(`✅ Category updated: ID ${id} (${processingTime}ms)`);

      return await this.findById(id, 'en');
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      this.logger.error(`❌ Failed to update category ${id}: ${error.message}`);
      throw new InternalServerErrorException(`Failed to update category ${id}`);
    }
  }

  /**
   * SOFT DELETE CATEGORY
   *
   * Soft deletes category with hierarchy management.
   * Delegates hierarchy cleanup to CategoryHierarchyService.
   *
   * @param id - Category ID to delete
   * @param adminUser - Admin performing deletion
   * @returns Deletion result
   */
  async softDelete(
    id: number,
    adminUser: User,
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Soft deleting category ${id} by admin: ${adminUser.id}`);

    try {
      const category = await this.categoryRepository.findOne({
        where: { id },
        relations: ['children', 'products'],
      });

      if (!category) {
        throw new NotFoundException(`Category with ID ${id} not found`);
      }

      // Validate deletion rules
      await this.validateCategoryDeletion(category, adminUser);

      // Handle children (delegate to hierarchy service)
      await this.hierarchyService.handleCategoryDeletion(category);

      // Perform soft delete
      await this.categoryRepository.softDelete(id);

      // Log audit trail
      const userId =
        typeof adminUser.id === 'string'
          ? parseInt(adminUser.id)
          : adminUser.id;
      await this.auditLogService.logSimple({
        action: 'DELETE_CATEGORY',
        module: 'categories',
        actorId: userId,
        actorType: 'admin',
        entityType: 'category',
        entityId: id,
        description: `Category "${category.nameEn}" soft deleted`,
      });

      this.logger.log(`✅ Category soft deleted: ID ${id}`);

      return {
        success: true,
        message: `Category "${category.nameEn}" deleted successfully`,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      this.logger.error(`❌ Failed to delete category ${id}: ${error.message}`);
      throw new InternalServerErrorException(`Failed to delete category ${id}`);
    }
  }

  /**
   * RESTORE CATEGORY
   *
   * Restores a soft-deleted category.
   *
   * @param id - Category ID to restore
   * @param adminUser - Admin performing restoration
   * @returns Restored category response
   */
  async restore(id: number, adminUser: User): Promise<CategoryResponseDto> {
    this.logger.log(`Restoring category ${id} by admin: ${adminUser.id}`);

    try {
      await this.categoryRepository.restore(id);

      const userId =
        typeof adminUser.id === 'string'
          ? parseInt(adminUser.id)
          : adminUser.id;
      await this.auditLogService.logSimple({
        action: 'RESTORE_CATEGORY',
        module: 'categories',
        actorId: userId,
        actorType: 'admin',
        entityType: 'category',
        entityId: id,
        description: `Category restored`,
      });

      return await this.findById(id, 'en');
    } catch (error) {
      this.logger.error(
        `❌ Failed to restore category ${id}: ${error.message}`,
      );
      throw new InternalServerErrorException(
        `Failed to restore category ${id}`,
      );
    }
  }

  // ============================================================================
  // VALIDATION METHODS
  // ============================================================================

  /**
   * VALIDATE UNIQUE NAMES AND SLUG
   */
  private async validateUniqueNames(
    nameEn: string,
    nameAr: string,
    slug: string,
    parentId?: number,
    excludeId?: number,
  ): Promise<void> {
    // Check slug uniqueness globally
    const slugQuery = this.categoryRepository
      .createQueryBuilder('category')
      .where('category.deletedAt IS NULL')
      .andWhere('LOWER(category.slug) = LOWER(:slug)', { slug });

    if (excludeId) {
      slugQuery.andWhere('category.id != :excludeId', { excludeId });
    }

    const existingSlug = await slugQuery.getOne();
    if (existingSlug) {
      throw new ConflictException(
        `Category with slug '${slug}' already exists`,
      );
    }

    // Check name uniqueness within same parent level
    const nameQuery = this.categoryRepository
      .createQueryBuilder('category')
      .where('category.deletedAt IS NULL')
      .andWhere(
        '(LOWER(category.nameEn) = LOWER(:nameEn) OR LOWER(category.nameAr) = LOWER(:nameAr))',
        { nameEn, nameAr },
      );

    if (parentId) {
      nameQuery.andWhere('category.parent = :parentId', { parentId });
    } else {
      nameQuery.andWhere('category.parent IS NULL');
    }

    if (excludeId) {
      nameQuery.andWhere('category.id != :excludeId', { excludeId });
    }

    const existingName = await nameQuery.getOne();
    if (existingName) {
      throw new ConflictException(
        'Category name already exists in this hierarchy level',
      );
    }
  }

  /**
   * VALIDATE SYRIAN MARKET RULES
   */
  private async validateSyrianMarketRules(
    categoryDto: CreateCategoryDto | UpdateCategoryDto,
  ): Promise<void> {
    if (!categoryDto.nameAr || categoryDto.nameAr.trim().length === 0) {
      throw new BadRequestException(
        'Arabic name is required for Syrian market',
      );
    }

    if (categoryDto.commissionRate !== undefined) {
      if (categoryDto.commissionRate < 0.5 || categoryDto.commissionRate > 15) {
        throw new BadRequestException(
          'Commission rate must be between 0.5% and 15%',
        );
      }
    }

    if (categoryDto.minPrice !== undefined && categoryDto.minPrice < 100) {
      throw new BadRequestException(
        'Minimum price cannot be less than 100 SYP',
      );
    }

    if (
      categoryDto.maxPrice !== undefined &&
      categoryDto.maxPrice > 100000000
    ) {
      throw new BadRequestException(
        'Maximum price cannot exceed 100,000,000 SYP',
      );
    }
  }

  /**
   * VALIDATE CATEGORY UPDATE
   */
  private async validateCategoryUpdate(
    id: number,
    updateDto: UpdateCategoryDto,
    existingCategory: Category,
    adminUser: User,
  ): Promise<void> {
    // Validate unique names if changing
    if (updateDto.nameEn || updateDto.nameAr || updateDto.slug) {
      await this.validateUniqueNames(
        updateDto.nameEn || existingCategory.nameEn,
        updateDto.nameAr || existingCategory.nameAr,
        updateDto.slug || existingCategory.slug,
        updateDto.parentId !== undefined
          ? updateDto.parentId
          : existingCategory.parent?.id,
        id,
      );
    }

    // Validate Syrian market rules
    await this.validateSyrianMarketRules(updateDto);

    // Check approved category restrictions
    if (existingCategory.approvalStatus === 'approved') {
      const restrictedFields = ['nameEn', 'nameAr', 'slug'];
      const hasRestrictedChanges = restrictedFields.some(
        (field) => updateDto[field] !== undefined,
      );

      if (hasRestrictedChanges) {
        // Check if user has super admin permission
        const userPermissions = this.getUserPermissions(adminUser);
        const hasSuperAdminPermission = userPermissions.some(
          (perm) => perm.permission.name === 'category.edit-approved',
        );

        if (!hasSuperAdminPermission) {
          throw new BadRequestException(
            'Approved categories can only be edited by super administrators',
          );
        }
      }
    }
  }

  /**
   * VALIDATE CATEGORY DELETION
   */
  private async validateCategoryDeletion(
    category: Category,
    adminUser: User,
  ): Promise<void> {
    if (category.productCount > 0) {
      throw new BadRequestException(
        `Cannot delete category with ${category.productCount} active products`,
      );
    }

    const userPermissions = this.getUserPermissions(adminUser);
    const permissionNames = userPermissions.map((p) => p.permission.name);

    if (!permissionNames.includes('category.delete')) {
      throw new BadRequestException(
        'Insufficient permissions to delete categories',
      );
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * TRANSFORM TO RESPONSE DTO
   */
  private transformToResponseDto(
    category: Category,
    language: 'en' | 'ar' = 'en',
    breadcrumbs?: any,
  ): CategoryResponseDto {
    return {
      id: category.id,
      nameEn: category.nameEn,
      nameAr: category.nameAr,
      name: category.getDisplayName(language),
      slug: category.slug,
      descriptionEn: category.descriptionEn,
      descriptionAr: category.descriptionAr,
      description: category.getDisplayDescription(language),
      iconUrl: category.iconUrl,
      bannerUrl: category.bannerUrl,
      themeColor: category.themeColor,
      seoTitle: category.seoTitle,
      seoDescription: category.seoDescription,
      seoSlug: category.seoSlug,
      approvalStatus: category.approvalStatus,
      isActive: category.isActive,
      isFeatured: category.isFeatured,
      showInNav: category.showInNav,
      depthLevel: category.depthLevel,
      categoryPath: category.categoryPath,
      sortOrder: category.sortOrder,
      commissionRate: category.commissionRate,
      minPrice: category.minPrice,
      maxPrice: category.maxPrice,
      productCount: category.productCount,
      viewCount: category.viewCount,
      popularityScore: category.popularityScore,
      lastActivityAt: category.lastActivityAt,
      createdBy: category.createdBy,
      updatedBy: category.updatedBy,
      approvedBy: category.approvedBy,
      approvedAt: category.approvedAt,
      rejectionReason: category.rejectionReason,
      tenantId: category.tenantId,
      organizationId: category.organizationId,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      displayName: category.getDisplayName(language),
      displayDescription: category.getDisplayDescription(language),
      url: category.generateUrl(language),
      isPublic: category.isPublic(),
      canBeEdited: category.canBeEdited(),
      isRootCategory: category.isRootCategory(),
      hasChildren: category.hasChildren(),
      needsAdminAttention: category.needsAdminAttention(),
      breadcrumbs,
      parent: category.parent
        ? {
            id: category.parent.id,
            name: category.parent.getDisplayName(language),
            slug: category.parent.getSlug(language),
          }
        : null,
      children:
        category.children?.map((child) => ({
          id: child.id,
          name: child.getDisplayName(language),
          slug: child.getSlug(language),
          isActive: child.isActive,
          productCount: child.productCount,
        })) || [],
    };
  }

  /**
   * GET USER PERMISSIONS (copied from your ACL pattern)
   */
  private getUserPermissions(user: User): any[] {
    const permissions: any[] = [];

    if (user.role?.rolePermissions) {
      permissions.push(...user.role.rolePermissions);
    }

    if (user.assignedRole?.rolePermissions) {
      permissions.push(...user.assignedRole.rolePermissions);
    }

    return permissions.filter(
      (perm, index, self) =>
        index === self.findIndex((p) => p.permission.id === perm.permission.id),
    );
  }

  // ============================================================================
  // BACKWARDS COMPATIBILITY
  // ============================================================================

  /**
   * Legacy methods for controller compatibility
   */
  async findAll(): Promise<Category[]> {
    // This will be handled by CategorySearchService in the next file
    const categories = await this.categoryRepository.find({
      where: { isActive: true },
      relations: ['parent', 'children'],
      order: { sortOrder: 'ASC', nameEn: 'ASC' },
    });
    return categories;
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['parent', 'children'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async remove(id: number): Promise<void> {
    const dummyAdmin = { id: 1 } as User;
    await this.softDelete(id, dummyAdmin);
  }

  /**
   * Generic find method for repository access
   * Used by public controllers for flexible querying
   */
  async find(options: any): Promise<Category[]> {
    return await this.categoryRepository.find(options);
  }
}
