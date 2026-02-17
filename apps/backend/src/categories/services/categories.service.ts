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
import { FindManyOptions, Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { User } from '../../users/entities/user.entity';
import { RolePermission } from '../../access-control/entities/role-permission.entity';
import { AuditLogService } from '../../audit-log/service/audit-log.service';
import { CategoryHierarchyService } from './category-hierarchy.service';
import { CategoryApprovalService } from './category-approval.service';
import {
  CategoryResponseDto,
  CreateCategoryDto,
  UpdateCategoryDto,
} from '../dto/index-dto';
import { CategoryBreadcrumbDto } from '../dto/category-breadcrumb.dto';

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

  /**
   * GET CATEGORY TREE FOR MEGA MENU
   *
   * Retrieves complete 3-level category hierarchy optimized for frontend mega menus
   * Structure: Root > Children > Grandchildren
   *
   * Features:
   * - Only active and approved categories
   * - Eager loading 3 levels deep
   * - Sorted by sortOrder ASC
   * - Lightweight response (only essential fields)
   *
   * @returns Complete category tree structure (3 levels)
   */
  async getTree(): Promise<Category[]> {
    this.logger.log('🌳 Building category tree for mega menu (3 levels)');

    const startTime = Date.now();

    // Query root categories (parent IS NULL) with eager-loaded children 3 levels deep
    const rootCategories = await this.categoryRepository.find({
      where: {
        parent: null, // Root categories only
        isActive: true,
        approvalStatus: 'approved',
      },
      relations: ['children', 'children.children'], // Load 3 levels
      order: {
        sortOrder: 'ASC',
        nameEn: 'ASC',
      },
    });

    // Filter children to only include active + approved
    const filteredRoots = rootCategories.map((root) => {
      // Filter level 2 (children)
      if (root.children) {
        root.children = root.children
          .filter(
            (child) => child.isActive && child.approvalStatus === 'approved',
          )
          .sort((a, b) => a.sortOrder - b.sortOrder);

        // Filter level 3 (grandchildren)
        root.children.forEach((child) => {
          if (child.children) {
            child.children = child.children
              .filter(
                (grandchild) =>
                  grandchild.isActive &&
                  grandchild.approvalStatus === 'approved',
              )
              .sort((a, b) => a.sortOrder - b.sortOrder);
          }
        });
      }

      return root;
    });

    const processingTime = Date.now() - startTime;
    const totalCategories = filteredRoots.reduce(
      (sum, root) =>
        sum +
        1 +
        (root.children?.length || 0) +
        (root.children?.reduce(
          (childSum, child) => childSum + (child.children?.length || 0),
          0,
        ) || 0),
      0,
    );

    this.logger.log(
      `✅ Category tree built: ${filteredRoots.length} roots, ${totalCategories} total categories (${processingTime}ms)`,
    );

    return filteredRoots;
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
    } catch (error: unknown) {
      this.logger.error(
        `❌ Failed to create category: ${(error as Error).message}`,
        (error as Error).stack,
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
    } catch (error: unknown) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      this.logger.error(
        `❌ Failed to find category ${id}: ${(error as Error).message}`,
      );
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
    } catch (error: unknown) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      this.logger.error(
        `❌ Failed to update category ${id}: ${(error as Error).message}`,
      );
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
    } catch (error: unknown) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      this.logger.error(
        `❌ Failed to delete category ${id}: ${(error as Error).message}`,
      );
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
    } catch (error: unknown) {
      this.logger.error(
        `❌ Failed to restore category ${id}: ${(error as Error).message}`,
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
    breadcrumbs?: CategoryBreadcrumbDto[],
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
      megaMenuType: category.megaMenuType,
      isPinnedInNav: category.isPinnedInNav,
      megaMenuConfig: category.megaMenuConfig,
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
  private getUserPermissions(user: User): RolePermission[] {
    const permissions: RolePermission[] = [];

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
  async find(options: FindManyOptions<Category>): Promise<Category[]> {
    return await this.categoryRepository.find(options);
  }

  /**
   * FIND CATEGORY BY SLUG
   *
   * Retrieves a single category by its slug identifier.
   * Only returns categories that are active and approved for public access.
   *
   * @param slug - Category slug (e.g., 'damascus-steel', 'electronics')
   * @returns Category entity with parent and children relations, or null if not found
   */
  async findBySlug(slug: string): Promise<Category | null> {
    this.logger.log(`Finding category by slug: ${slug}`);

    try {
      const category = await this.categoryRepository.findOne({
        where: {
          slug,
          isActive: true,
          approvalStatus: 'approved' as
            | 'draft'
            | 'pending'
            | 'approved'
            | 'rejected'
            | 'suspended'
            | 'archived',
        },
        relations: ['parent', 'children'],
      });

      if (!category) {
        this.logger.warn(
          `Category with slug "${slug}" not found or not public`,
        );
        return null;
      }

      this.logger.log(
        `✅ Found category: ${category.nameEn} (ID: ${category.id})`,
      );
      return category;
    } catch (error: unknown) {
      this.logger.error(
        `❌ Failed to find category by slug "${slug}": ${(error as Error).message}`,
        (error as Error).stack,
      );
      return null;
    }
  }

  /**
   * SEARCH WITHIN CATEGORY (SS-CAT-006, S2 Enhanced)
   *
   * Search for products within a specific category with advanced filtering
   * Only returns products that are active, published, and approved
   * Only searches within active and approved categories
   *
   * Features:
   * - Full-text search on product nameEn, nameAr, and descriptions
   * - LEFT JOIN with product_descriptions for description search
   * - Pagination with total count
   * - Sort by: newest, price (asc/desc), popularity, rating
   * - Price range filtering (minPrice, maxPrice)
   * - Includes first product image
   * - Returns product pricing information
   * - MySQL LIKE for flexible search
   * - Accepts category ID (number) OR slug (string)
   *
   * @param categoryIdOrSlug - Category ID (number) or slug (string) to search within
   * @param search - Optional search keyword (min 2 chars recommended)
   * @param page - Page number (starts from 1)
   * @param limit - Items per page (max 100)
   * @param sortBy - Sort order: 'newest' | 'price_asc' | 'price_desc' | 'popularity' | 'rating'
   * @param minPrice - Minimum price filter (inclusive)
   * @param maxPrice - Maximum price filter (inclusive)
   * @returns Paginated product results with metadata
   * @throws NotFoundException if category doesn't exist or isn't public
   * @throws BadRequestException if minPrice > maxPrice
   */
  async searchWithinCategory(
    categoryIdOrSlug: number | string,
    search: string | undefined,
    page: number,
    limit: number,
    sortBy:
      | 'newest'
      | 'price_asc'
      | 'price_desc'
      | 'popularity'
      | 'rating' = 'newest',
    minPrice?: number,
    maxPrice?: number,
  ): Promise<{
    data: Array<{
      id: number;
      nameEn: string;
      nameAr: string;
      slug: string;
      mainImage: string | null;
      basePrice: number | null;
      discountPrice: number | null;
      currency: string;
      approvalStatus: string;
      isActive: boolean;
      isPublished: boolean;
    }>;
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const startTime = Date.now();
    this.logger.log(
      `🔍 Searching products in category ${categoryIdOrSlug}: search="${search || 'all'}", page=${page}, limit=${limit}, sortBy=${sortBy}, minPrice=${minPrice}, maxPrice=${maxPrice}`,
    );

    try {
      // 1. Resolve category (handle both ID and slug)
      let category: Category | null = null;
      let categoryId: number;

      if (typeof categoryIdOrSlug === 'number') {
        // Numeric ID provided
        categoryId = categoryIdOrSlug;
        category = await this.categoryRepository.findOne({
          where: { id: categoryId },
        });
      } else {
        // String slug provided
        category = await this.findBySlug(categoryIdOrSlug);
        if (category) {
          categoryId = category.id;
        }
      }

      if (!category) {
        throw new NotFoundException(`Category "${categoryIdOrSlug}" not found`);
      }

      if (!category.isActive || category.approvalStatus !== 'approved') {
        throw new NotFoundException(
          `Category "${categoryIdOrSlug}" is not publicly available`,
        );
      }

      // 2. Validate price filters
      if (
        minPrice !== undefined &&
        maxPrice !== undefined &&
        minPrice > maxPrice
      ) {
        throw new BadRequestException(
          `Minimum price (${minPrice}) cannot be greater than maximum price (${maxPrice})`,
        );
      }

      // 3. Calculate pagination offset
      const sanitizedPage = Math.max(1, page || 1);
      const sanitizedLimit = Math.min(Math.max(1, limit || 20), 100);
      const offset = (sanitizedPage - 1) * sanitizedLimit;

      // 4. Build TypeORM QueryBuilder for products
      const queryBuilder = this.categoryRepository.manager
        .getRepository('ProductEntity')
        .createQueryBuilder('product')
        .leftJoinAndSelect('product.pricing', 'pricing')
        .leftJoin('product.images', 'image')
        .leftJoin('product.descriptions', 'description')
        .addSelect([
          'image.id',
          'image.imageUrl',
          'image.sortOrder',
          'description.description',
        ])
        .where('product.category_id = :categoryId', { categoryId })
        .andWhere('product.isActive = :isActive', { isActive: true })
        .andWhere('product.isPublished = :isPublished', { isPublished: true })
        .andWhere('product.approvalStatus = :approvalStatus', {
          approvalStatus: 'approved',
        })
        .andWhere('product.is_deleted = :isDeleted', { isDeleted: false });

      // 5. Apply search filter if provided
      if (search && search.trim().length > 0) {
        const searchTerm = `%${search.trim().toLowerCase()}%`;
        queryBuilder.andWhere(
          '(LOWER(product.nameEn) LIKE :search OR LOWER(product.nameAr) LIKE :search OR LOWER(description.description) LIKE :search)',
          { search: searchTerm },
        );
      }

      // 6. Apply price filters if provided
      if (minPrice !== undefined) {
        queryBuilder.andWhere('pricing.basePrice >= :minPrice', { minPrice });
      }
      if (maxPrice !== undefined) {
        queryBuilder.andWhere('pricing.basePrice <= :maxPrice', { maxPrice });
      }

      // 7. Apply sort order based on sortBy parameter
      switch (sortBy) {
        case 'price_asc':
          // Lowest price first
          queryBuilder.orderBy('pricing.basePrice', 'ASC');
          break;
        case 'price_desc':
          // Highest price first
          queryBuilder.orderBy('pricing.basePrice', 'DESC');
          break;
        case 'popularity':
          // Most viewed products first, fallback to newest
          queryBuilder
            .orderBy('product.viewCount', 'DESC')
            .addOrderBy('product.createdAt', 'DESC');
          break;
        case 'rating':
          // Highest rated first (nulls last), fallback to newest
          queryBuilder
            .orderBy('product.averageRating', 'DESC', 'NULLS LAST')
            .addOrderBy('product.createdAt', 'DESC');
          break;
        case 'newest':
        default:
          // Newest products first (default)
          queryBuilder.orderBy('product.createdAt', 'DESC');
          break;
      }

      // 8. Add pagination
      queryBuilder.skip(offset).take(sanitizedLimit);

      // 9. Execute query and get total count
      const [products, total] = await queryBuilder.getManyAndCount();

      // 10. Transform results to response format
      const transformedData = products.map((product) => {
        // Get first image sorted by sortOrder
        const sortedImages = (product.images || []).sort(
          (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0),
        );
        const mainImage = sortedImages[0]?.imageUrl || null;

        return {
          id: product.id,
          nameEn: product.nameEn,
          nameAr: product.nameAr,
          slug: product.slug,
          mainImage,
          basePrice: product.pricing?.basePrice || null,
          discountPrice: product.pricing?.discountPrice || null,
          currency: product.pricing?.currency || 'SYP',
          approvalStatus: product.approvalStatus,
          isActive: product.isActive,
          isPublished: product.isPublished,
        };
      });

      // 11. Calculate metadata
      const totalPages = Math.ceil(total / sanitizedLimit);
      const processingTime = Date.now() - startTime;

      this.logger.log(
        `✅ Found ${transformedData.length}/${total} products in category ${categoryIdOrSlug} (${processingTime}ms)`,
      );

      return {
        data: transformedData,
        meta: {
          page: sanitizedPage,
          limit: sanitizedLimit,
          total,
          totalPages,
        },
      };
    } catch (error: unknown) {
      const processingTime = Date.now() - startTime;
      this.logger.error(
        `❌ Failed to search products in category ${categoryIdOrSlug}: ${(error as Error).message} (${processingTime}ms)`,
        (error as Error).stack,
      );

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Failed to search products in category ${categoryIdOrSlug}`,
      );
    }
  }
}
