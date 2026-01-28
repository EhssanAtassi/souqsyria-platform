/**
 * @file category-hierarchy.service.ts
 * @description Category Hierarchy Management Service
 *
 * RESPONSIBILITIES:
 * - Parent/child relationship management
 * - Hierarchy path calculation and maintenance
 * - Depth level management and validation
 * - Circular hierarchy prevention
 * - Breadcrumb generation
 * - Hierarchy restructuring operations
 * - Category tree building and navigation
 *
 * BUSINESS RULES:
 * - Maximum hierarchy depth: 5 levels (0-4)
 * - No circular hierarchies allowed
 * - Path format: "Electronics/Smartphones/iPhone"
 * - Automatic depth calculation
 * - Children inherit parent's approval constraints
 *
 * @author SouqSyria Development Team
 * @since 2025-06-01
 */

import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import {
  CategoryBreadcrumbDto,
  CategoryMoveResult,
  CategoryTreeResponseDto,
  HierarchyValidationResult,
} from '../dto/index-dto';

@Injectable()
export class CategoryHierarchyService {
  private readonly logger = new Logger(CategoryHierarchyService.name);
  private readonly MAX_DEPTH = 4; // 0-4 = 5 levels maximum
  private readonly cache = new Map<string, any>();

  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {
    this.logger.log('🌲 Category Hierarchy Service initialized');
  }

  // ============================================================================
  // HIERARCHY VALIDATION AND SETUP
  // ============================================================================

  /**
   * VALIDATE AND PREPARE HIERARCHY DATA FOR NEW CATEGORY
   *
   * Why needed: When creating categories, we need to validate the parent
   * relationship and calculate hierarchy data (depth, path) before saving.
   *
   * @param parentId - Parent category ID (null for root categories)
   * @returns Hierarchy data ready for category creation
   */
  async validateAndPrepareHierarchy(
    parentId?: number,
  ): Promise<HierarchyValidationResult> {
    this.logger.debug(`Validating hierarchy for parent ID: ${parentId}`);

    try {
      // Handle root category creation
      if (!parentId) {
        return {
          parent: null,
          depthLevel: 0,
          categoryPath: '', // Will be set to category name after creation
          isValid: true,
          maxDepthReached: false,
        };
      }

      // Validate parent exists and is accessible
      const parent = await this.validateParentCategory(parentId);

      // Check depth limits
      const newDepthLevel = parent.depthLevel + 1;
      if (newDepthLevel > this.MAX_DEPTH) {
        throw new BadRequestException(
          `Maximum category depth of ${this.MAX_DEPTH + 1} levels exceeded. Current parent is at level ${parent.depthLevel}.`,
        );
      }

      // Calculate category path (will be completed with actual name later)
      const categoryPath = parent.categoryPath || parent.nameEn;

      this.logger.debug(
        `✅ Hierarchy validated: parent="${parent.nameEn}", depth=${newDepthLevel}, path="${categoryPath}"`,
      );

      return {
        parent,
        depthLevel: newDepthLevel,
        categoryPath,
        isValid: true,
        maxDepthReached: newDepthLevel === this.MAX_DEPTH,
      };
    } catch (error: unknown) {
      this.logger.error(`❌ Hierarchy validation failed: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * VALIDATE PARENT CATEGORY
   *
   * Why needed: Ensures parent category exists, is active, approved,
   * and suitable for having child categories.
   *
   * @param parentId - Parent category ID to validate
   * @returns Valid parent category entity
   */
  async validateParentCategory(parentId: number): Promise<Category> {
    const parent = await this.categoryRepository.findOne({
      where: { id: parentId },
      relations: ['parent'],
    });

    if (!parent) {
      throw new NotFoundException(
        `Parent category with ID ${parentId} not found`,
      );
    }

    if (!parent.isActive) {
      throw new BadRequestException(
        'Cannot create category under inactive parent. Activate parent first.',
      );
    }

    if (parent.approvalStatus !== 'approved') {
      throw new BadRequestException(
        'Cannot create category under unapproved parent. Parent must be approved first.',
      );
    }

    // Check if parent is archived or suspended
    if (['archived', 'suspended'].includes(parent.approvalStatus)) {
      throw new BadRequestException(
        `Cannot create category under ${parent.approvalStatus} parent`,
      );
    }

    return parent;
  }

  /**
   * CHECK FOR CIRCULAR HIERARCHY
   *
   * Why needed: Prevents creating invalid hierarchy structures where
   * a category becomes its own ancestor (circular reference).
   *
   * @param categoryId - Category being moved
   * @param potentialParentId - Potential new parent ID
   * @returns true if this would create circular hierarchy
   */
  async wouldCreateCircularHierarchy(
    categoryId: number,
    potentialParentId: number,
  ): Promise<boolean> {
    this.logger.debug(
      `Checking circular hierarchy: category=${categoryId}, potentialParent=${potentialParentId}`,
    );

    if (categoryId === potentialParentId) {
      this.logger.warn('❌ Category cannot be its own parent');
      return true;
    }

    // Traverse up the potential parent's hierarchy to check for the category
    let currentParentId = potentialParentId;
    const visitedIds = new Set<number>(); // Prevent infinite loops

    while (currentParentId && !visitedIds.has(currentParentId)) {
      visitedIds.add(currentParentId);

      const parent = await this.categoryRepository.findOne({
        where: { id: currentParentId },
        relations: ['parent'],
      });

      if (!parent) break;

      if (parent.id === categoryId) {
        this.logger.warn(
          `❌ Circular hierarchy detected: category ${categoryId} found in parent chain`,
        );
        return true;
      }

      currentParentId = parent.parent?.id;
    }

    this.logger.debug('✅ No circular hierarchy detected');
    return false;
  }

  // ============================================================================
  // HIERARCHY RESTRUCTURING OPERATIONS
  // ============================================================================

  /**
   * HANDLE PARENT CHANGE
   *
   * Why needed: When updating a category's parent, we need to:
   * - Validate the new hierarchy structure
   * - Prevent circular references
   * - Recalculate depth levels and paths
   * - Update all descendant categories
   *
   * @param category - Category being moved
   * @param newParentId - New parent ID (null for root level)
   * @returns Result of the move operation
   */
  async handleParentChange(
    category: Category,
    newParentId: number | null,
  ): Promise<CategoryMoveResult> {
    const startTime = Date.now();
    this.logger.log(
      `Moving category "${category.nameEn}" (ID: ${category.id}) to parent: ${newParentId || 'root'}`,
    );

    try {
      let newParent: Category = null;
      let newDepthLevel = 0;
      let newCategoryPath = category.nameEn;

      // Validate new parent if specified
      if (newParentId !== null) {
        newParent = await this.validateParentCategory(newParentId);

        // Prevent circular hierarchy
        if (await this.wouldCreateCircularHierarchy(category.id, newParentId)) {
          throw new BadRequestException(
            'Cannot move category: this would create a circular hierarchy',
          );
        }

        // Check depth limits
        newDepthLevel = newParent.depthLevel + 1;
        if (newDepthLevel > this.MAX_DEPTH) {
          throw new BadRequestException(
            `Cannot move category: maximum hierarchy depth of ${this.MAX_DEPTH + 1} levels would be exceeded`,
          );
        }

        newCategoryPath = `${newParent.categoryPath}/${category.nameEn}`;
      }

      // Store old hierarchy info for rollback if needed
      const oldParentId = category.parent?.id;
      const oldDepthLevel = category.depthLevel;
      // const oldCategoryPath = category.categoryPath;

      // Update the category's hierarchy fields
      await this.categoryRepository.update(category.id, {
        parent: newParent,
        depthLevel: newDepthLevel,
        categoryPath: newCategoryPath,
      });

      // Recalculate hierarchy for all descendants
      const updatedDescendants = await this.recalculateDescendantHierarchy(
        category.id,
      );

      // Update metrics for old and new parents
      if (oldParentId) {
        await this.updateParentMetrics(oldParentId);
      }
      if (newParent) {
        await this.updateParentMetrics(newParent.id);
      }

      // Clear hierarchy caches
      this.clearHierarchyCache();

      const processingTime = Date.now() - startTime;
      this.logger.log(
        `✅ Category moved successfully: ${updatedDescendants.length} descendants updated (${processingTime}ms)`,
      );

      return {
        success: true,
        categoryId: category.id,
        oldParentId,
        newParentId,
        oldDepthLevel,
        newDepthLevel,
        updatedDescendants,
        processingTimeMs: processingTime,
        message: `Category "${category.nameEn}" moved to ${newParent ? newParent.nameEn : 'root level'}`,
      };
    } catch (error: unknown) {
      this.logger.error(
        `❌ Failed to move category ${category.id}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * RECALCULATE DESCENDANT HIERARCHY
   *
   * Why needed: When a category is moved, all its descendants need
   * their depth levels and paths recalculated to maintain consistency.
   *
   * @param categoryId - Root category ID to start recalculation from
   * @returns Array of updated descendant category IDs
   */
  async recalculateDescendantHierarchy(categoryId: number): Promise<number[]> {
    this.logger.debug(
      `Recalculating hierarchy for descendants of category ${categoryId}`,
    );

    const updatedCategories: number[] = [];

    try {
      // Get the updated category with its new hierarchy data
      const rootCategory = await this.categoryRepository.findOne({
        where: { id: categoryId },
        relations: ['parent'],
      });

      if (!rootCategory) {
        throw new NotFoundException(
          `Category ${categoryId} not found for hierarchy recalculation`,
        );
      }

      // Recursively update all descendants
      await this.recalculateHierarchyRecursive(rootCategory, updatedCategories);

      this.logger.debug(
        `✅ Hierarchy recalculated for ${updatedCategories.length} descendant categories`,
      );

      return updatedCategories;
    } catch (error: unknown) {
      this.logger.error(
        `❌ Failed to recalculate hierarchy for category ${categoryId}: ${(error as Error).message}`,
      );
      throw new InternalServerErrorException(
        'Failed to recalculate category hierarchy',
      );
    }
  }

  /**
   * RECURSIVE HIERARCHY RECALCULATION
   *
   * Private helper method for depth-first hierarchy updates.
   *
   * @param category - Current category to process
   * @param updatedCategories - Array to track updated category IDs
   */
  private async recalculateHierarchyRecursive(
    category: Category,
    updatedCategories: number[],
  ): Promise<void> {
    // Get all direct children of this category
    const children = await this.categoryRepository.find({
      where: { parent: { id: category.id } },
      relations: ['parent'],
    });

    for (const child of children) {
      // Calculate new hierarchy data
      const newDepthLevel = category.depthLevel + 1;
      const newCategoryPath = `${category.categoryPath}/${child.nameEn}`;

      // Update child's hierarchy
      await this.categoryRepository.update(child.id, {
        depthLevel: newDepthLevel,
        categoryPath: newCategoryPath,
      });

      updatedCategories.push(child.id);

      // Update the child object for next iteration
      child.depthLevel = newDepthLevel;
      child.categoryPath = newCategoryPath;

      // Recursively update this child's descendants
      await this.recalculateHierarchyRecursive(child, updatedCategories);
    }
  }

  // ============================================================================
  // CATEGORY DELETION HIERARCHY MANAGEMENT
  // ============================================================================

  /**
   * HANDLE CATEGORY DELETION
   *
   * Why needed: When deleting categories, we need to handle children
   * appropriately - either cascade delete, move to parent, or make root.
   *
   * @param category - Category being deleted
   * @param options - Deletion handling options
   * @returns Array of affected category IDs
   */
  async handleCategoryDeletion(
    category: Category,
    options: {
      cascade?: boolean;
      moveChildrenToParent?: boolean;
    } = {},
  ): Promise<number[]> {
    this.logger.log(
      `Handling deletion hierarchy for category: ${category.nameEn} (${category.children?.length || 0} children)`,
    );

    const affectedCategories: number[] = [];

    try {
      // Load children if not already loaded
      if (!category.children) {
        category.children = await this.categoryRepository.find({
          where: { parent: { id: category.id } },
          relations: ['parent'],
        });
      }

      if (category.children.length === 0) {
        this.logger.debug('No children to handle for category deletion');
        return affectedCategories;
      }

      if (options.cascade) {
        // Cascade delete all children
        for (const child of category.children) {
          await this.categoryRepository.softDelete(child.id);
          affectedCategories.push(child.id);

          // Recursively handle grandchildren
          const grandchildrenAffected = await this.handleCategoryDeletion(
            child,
            { cascade: true },
          );
          affectedCategories.push(...grandchildrenAffected);
        }

        this.logger.log(
          `Cascade deleted ${affectedCategories.length} child categories`,
        );
      } else if (options.moveChildrenToParent && category.parent) {
        // Move children to this category's parent (grandparent level)
        for (const child of category.children) {
          await this.categoryRepository.update(child.id, {
            parent: category.parent,
            depthLevel: category.parent.depthLevel + 1,
          });

          // Recalculate hierarchy for moved child and its descendants
          await this.recalculateDescendantHierarchy(child.id);
          affectedCategories.push(child.id);
        }

        this.logger.log(
          `Moved ${category.children.length} children to grandparent level`,
        );
      } else {
        // Make children root categories
        for (const child of category.children) {
          await this.categoryRepository.update(child.id, {
            parent: null,
            depthLevel: 0,
            categoryPath: child.nameEn,
          });

          // Recalculate hierarchy for new root category and its descendants
          await this.recalculateDescendantHierarchy(child.id);
          affectedCategories.push(child.id);
        }

        this.logger.log(
          `Made ${category.children.length} children into root categories`,
        );
      }

      // Clear hierarchy caches
      this.clearHierarchyCache();

      return affectedCategories;
    } catch (error: unknown) {
      this.logger.error(
        `❌ Failed to handle deletion hierarchy for category ${category.id}: ${(error as Error).message}`,
      );
      throw new InternalServerErrorException(
        'Failed to handle category deletion hierarchy',
      );
    }
  }

  // ============================================================================
  // BREADCRUMB AND NAVIGATION GENERATION
  // ============================================================================

  /**
   * GENERATE BREADCRUMBS
   *
   * Why needed: Creates navigation breadcrumbs for category pages
   * showing the full path from root to current category.
   *
   * @param category - Current category
   * @param language - Language preference for display names
   * @returns Array of breadcrumb items from root to current
   */
  async generateBreadcrumbs(
    category: Category,
    language: 'en' | 'ar' = 'en',
  ): Promise<CategoryBreadcrumbDto[]> {
    this.logger.debug(
      `Generating breadcrumbs for category: ${category.nameEn}`,
    );

    try {
      const cacheKey = `breadcrumbs_${category.id}_${language}`;

      // Check cache first
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < 300000) {
          // 5 minutes TTL
          this.logger.debug('📦 Cache hit for breadcrumbs');
          return cached.data;
        }
      }

      const breadcrumbs: CategoryBreadcrumbDto[] = [];
      let currentCategory = category;

      // Build breadcrumbs by traversing up the hierarchy
      while (currentCategory) {
        breadcrumbs.unshift({
          id: currentCategory.id,
          name: currentCategory.getDisplayName(language),
          slug: currentCategory.getSlug(language),
          url: currentCategory.generateUrl(language),
          isActive: currentCategory.isActive,
          depthLevel: currentCategory.depthLevel,
        });

        // Load parent if not already loaded
        if (
          currentCategory.parent &&
          typeof currentCategory.parent === 'number'
        ) {
          currentCategory = await this.categoryRepository.findOne({
            where: { id: currentCategory.parent as any },
            relations: ['parent'],
          });
        } else {
          currentCategory = currentCategory.parent;
        }
      }

      // Cache the result
      this.cache.set(cacheKey, { data: breadcrumbs, timestamp: Date.now() });

      this.logger.debug(`✅ Generated ${breadcrumbs.length} breadcrumb items`);
      return breadcrumbs;
    } catch (error: unknown) {
      this.logger.error(
        `❌ Failed to generate breadcrumbs for category ${category.id}: ${(error as Error).message}`,
      );

      // Return minimal breadcrumb if generation fails
      return [
        {
          id: category.id,
          name: category.getDisplayName(language),
          slug: category.getSlug(language),
          url: category.generateUrl(language),
          isActive: category.isActive,
          depthLevel: category.depthLevel,
        },
      ];
    }
  }

  /**
   * BUILD HIERARCHICAL TREE
   *
   * Why needed: Converts flat category list into nested tree structure
   * for frontend navigation menus and admin category management.
   *
   * @param categories - Flat array of categories
   * @param language - Language preference for display
   * @returns Hierarchical tree structure with parent-child relationships
   */
  buildHierarchicalTree(
    categories: Category[],
    language: 'en' | 'ar' = 'en',
  ): CategoryTreeResponseDto[] {
    this.logger.debug(
      `Building hierarchical tree from ${categories.length} categories`,
    );

    try {
      const categoryMap = new Map<number, CategoryTreeResponseDto>();
      const rootCategories: CategoryTreeResponseDto[] = [];

      // First pass: Create all tree nodes
      categories.forEach((category) => {
        const treeNode: CategoryTreeResponseDto = {
          id: category.id,
          name: category.getDisplayName(language),
          slug: category.getSlug(language),
          description: category.getDisplayDescription(language),
          depthLevel: category.depthLevel,
          parent: category.parent
            ? {
                id: category.parent.id,
                name: category.parent.getDisplayName
                  ? category.parent.getDisplayName(language)
                  : category.parent.nameEn,
                slug: category.parent.getSlug
                  ? category.parent.getSlug(language)
                  : category.parent.slug,
                depthLevel: category.parent.depthLevel || 0,
              }
            : null,
          children: [],
          hasChildren: false,
          isLeaf: true,
          isRoot: !category.parent,
          isActive: category.isActive,
          isFeatured: category.isFeatured,
          approvalStatus: category.approvalStatus,
          isPublic: category.isPublic(),
          productCount: category.productCount,
          viewCount: category.viewCount,
          popularityScore: category.popularityScore,
          lastActivityAt: category.lastActivityAt,
          sortOrder: category.sortOrder,
          position: 1, // Will be calculated properly later
          navigation: {
            url: category.generateUrl(language),
            urlAr: category.generateUrl('ar'),
            showInNav: category.showInNav,
            showInMobile: true,
            showInFooter: false,
            badge: null,
          },
          metadata: {
            totalDescendants: 0, // Will be calculated
            directChildrenCount: 0,
            maxSubtreeDepth: 0,
            totalProductCount: category.productCount,
            isFullyLoaded: true,
            supportsLazyLoading: false,
          },
          commissionRate: category.commissionRate,
          allowsProducts: true,
          requiresApproval: category.approvalStatus !== 'approved',
          createdAt: category.createdAt,
          updatedAt: category.updatedAt,
          nameEn: category.nameEn,
          nameAr: category.nameAr,
          responseLanguage: language,
          needsAttention: category.needsAdminAttention(),
          canEdit: category.canBeEdited(),
          canDelete: true, // Determine based on business rules
          canAddChildren: category.isActive,
          breadcrumbPath: category.categoryPath || category.nameEn,
        };

        categoryMap.set(category.id, treeNode);
      });

      // Second pass: Build parent-child relationships
      categories.forEach((category) => {
        const treeNode = categoryMap.get(category.id);

        if (category.parent && typeof category.parent === 'object') {
          const parentNode = categoryMap.get(category.parent.id);
          if (parentNode) {
            parentNode.children.push(treeNode);
            parentNode.hasChildren = true;
            parentNode.isLeaf = false;

            // Sort children by sortOrder and then by name
            parentNode.children.sort((a, b) => {
              if (a.sortOrder !== b.sortOrder) {
                return a.sortOrder - b.sortOrder;
              }
              return a.name.localeCompare(b.name);
            });
          }
        } else if (!category.parent) {
          rootCategories.push(treeNode);
        }
      });

      // Sort root categories
      rootCategories.sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) {
          return a.sortOrder - b.sortOrder;
        }
        return a.name.localeCompare(b.name);
      });

      this.logger.debug(
        `✅ Built hierarchical tree: ${rootCategories.length} root categories with ${categories.length - rootCategories.length} children`,
      );

      return rootCategories;
    } catch (error: unknown) {
      this.logger.error(
        `❌ Failed to build hierarchical tree: ${(error as Error).message}`,
        (error as Error).stack,
      );

      // Return flat structure as fallback
      // Replace the fallback return with:
      return categories.map((category) => ({
        id: category.id,
        name: category.getDisplayName(language),
        slug: category.getSlug(language),
        description: category.getDisplayDescription(language),
        depthLevel: category.depthLevel,
        parent: null,
        children: [],
        hasChildren: false,
        isLeaf: true,
        isRoot: true,
        isActive: category.isActive,
        isFeatured: category.isFeatured,
        approvalStatus: category.approvalStatus,
        isPublic: category.isPublic(),
        productCount: category.productCount,
        viewCount: category.viewCount,
        popularityScore: category.popularityScore,
        lastActivityAt: category.lastActivityAt,
        sortOrder: category.sortOrder,
        position: 1,
        navigation: {
          url: category.generateUrl(language),
          urlAr: category.generateUrl('ar'),
          showInNav: category.showInNav,
          showInMobile: true,
          showInFooter: false,
          badge: null,
        },
        metadata: {
          totalDescendants: 0,
          directChildrenCount: 0,
          maxSubtreeDepth: 0,
          totalProductCount: category.productCount,
          isFullyLoaded: true,
          supportsLazyLoading: false,
        },
        commissionRate: category.commissionRate,
        allowsProducts: true,
        requiresApproval: false,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
        nameEn: category.nameEn,
        nameAr: category.nameAr,
        responseLanguage: language,
        needsAttention: false,
        canEdit: true,
        canDelete: true,
        canAddChildren: true,
        breadcrumbPath: category.nameEn,
      }));
    }
  }

  // ============================================================================
  // METRICS AND PERFORMANCE UPDATES
  // ============================================================================

  /**
   * UPDATE PARENT METRICS
   *
   * Why needed: When child categories are added/removed/modified,
   * parent categories need their cached metrics updated.
   *
   * @param parentId - Parent category ID to update
   */
  async updateParentMetrics(parentId: number): Promise<void> {
    this.logger.debug(`Updating metrics for parent category: ${parentId}`);

    try {
      // Count direct children
      const childrenCount = await this.categoryRepository.count({
        where: {
          parent: { id: parentId },
          isActive: true,
        },
      });

      // Calculate total product count from all descendants
      const totalProductCount =
        await this.calculateDescendantProductCount(parentId);

      // Update last activity timestamp
      const lastActivityAt = new Date();

      await this.categoryRepository.update(parentId, {
        // Store children count if you add this field to entity later
        lastActivityAt,
        // You might want to add a childrenCount field to the entity
      });

      this.logger.debug(
        `✅ Updated parent metrics: ${childrenCount} children, ${totalProductCount} total products`,
      );
    } catch (error: unknown) {
      this.logger.error(
        `❌ Failed to update parent metrics for category ${parentId}: ${(error as Error).message}`,
      );
      // Don't throw error - metrics update shouldn't break main operations
    }
  }

  /**
   * CALCULATE DESCENDANT PRODUCT COUNT
   *
   * Recursively calculates total product count across all descendants.
   *
   * @param categoryId - Root category ID
   * @returns Total product count including all descendants
   */
  private async calculateDescendantProductCount(
    categoryId: number,
  ): Promise<number> {
    // This is a placeholder - in real implementation, you'd query the products table
    // or maintain cached counts in the category entity

    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
    });

    return category?.productCount || 0;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * GET CATEGORY DEPTH
   *
   * Calculates the depth of a category in the hierarchy.
   *
   * @param categoryId - Category ID to calculate depth for
   * @returns Depth level (0 = root, 1 = first level, etc.)
   */
  async getCategoryDepth(categoryId: number): Promise<number> {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
    });

    return category?.depthLevel || 0;
  }

  /**
   * GET CATEGORY PATH
   *
   * Returns the full path from root to specified category.
   *
   * @param categoryId - Category ID to get path for
   * @returns Category path string
   */
  async getCategoryPath(categoryId: number): Promise<string> {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
    });

    return category?.categoryPath || '';
  }

  /**
   * GET ROOT CATEGORIES
   *
   * Returns all top-level (root) categories.
   *
   * @param activeOnly - Whether to return only active categories
   * @returns Array of root categories
   */
  async getRootCategories(activeOnly: boolean = true): Promise<Category[]> {
    const where: any = { parent: null };
    if (activeOnly) {
      where.isActive = true;
      where.approvalStatus = 'approved';
    }

    return this.categoryRepository.find({
      where,
      order: { sortOrder: 'ASC', nameEn: 'ASC' },
    });
  }

  /**
   * GET CATEGORY CHILDREN
   *
   * Returns direct children of a category.
   *
   * @param parentId - Parent category ID
   * @param activeOnly - Whether to return only active children
   * @returns Array of child categories
   */
  async getCategoryChildren(
    parentId: number,
    activeOnly: boolean = true,
  ): Promise<Category[]> {
    const where: any = { parent: { id: parentId } };
    if (activeOnly) {
      where.isActive = true;
      where.approvalStatus = 'approved';
    }

    return this.categoryRepository.find({
      where,
      order: { sortOrder: 'ASC', nameEn: 'ASC' },
    });
  }

  /**
   * CLEAR HIERARCHY CACHE
   *
   * Clears all hierarchy-related cache entries.
   */
  private clearHierarchyCache(): void {
    const keysToDelete = Array.from(this.cache.keys()).filter(
      (key) =>
        key.startsWith('breadcrumbs_') ||
        key.startsWith('tree_') ||
        key.startsWith('nav_'),
    );

    keysToDelete.forEach((key) => this.cache.delete(key));

    this.logger.debug(
      `🧹 Cleared ${keysToDelete.length} hierarchy cache entries`,
    );
  }

  /**
   * GET PERFORMANCE METRICS
   *
   * Returns hierarchy service performance metrics.
   */
  getPerformanceMetrics() {
    return {
      cacheSize: this.cache.size,
      maxDepthLimit: this.MAX_DEPTH + 1,
      timestamp: new Date(),
    };
  }
}
