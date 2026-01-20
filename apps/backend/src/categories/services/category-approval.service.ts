/**
 * @file category-approval.service.ts
 * @description Category Approval Workflow Service for SouqSyria
 *
 * RESPONSIBILITIES:
 * - Approval status transitions (draft → pending → approved → rejected)
 * - Workflow validation and business rules
 * - Admin notification system
 * - Approval permissions verification
 * - Syrian market compliance validation
 * - Audit trail for all approval actions
 *
 * BUSINESS RULES:
 * - Categories start as 'draft' status
 * - Only admins can approve/reject categories
 * - Approved categories require super-admin to edit core fields
 * - Rejection requires mandatory reason
 * - Syrian market categories need Arabic content validation
 *
 * @author SouqSyria Development Team
 * @since 2025-06-01
 */

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { User } from '../../users/entities/user.entity';
import { AuditLogService } from '../../audit-log/service/audit-log.service';
import { CategoryResponseDto, UpdateCategoryDto } from '../dto/index-dto';
import { PendingCategoriesQueryDto } from '../dto/pending-categories-query.dto';
import { BulkStatusChangeDto } from '../dto/bulk-status-change.dto';

/**
 * Status transition map - defines valid workflow transitions
 */
// Replace the existing VALID_TRANSITIONS with this:
const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ['pending', 'approved'],
  pending: ['approved', 'rejected'],
  approved: ['suspended', 'archived'],
  rejected: ['draft', 'pending'],
  suspended: ['approved', 'archived'],
  archived: [],
};

@Injectable()
export class CategoryApprovalService {
  private readonly logger = new Logger(CategoryApprovalService.name);

  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly auditLogService: AuditLogService,
  ) {
    this.logger.log('🔐 Category Approval Service initialized');
  }

  // ============================================================================
  // MAIN APPROVAL WORKFLOW METHODS
  // ============================================================================

  /**
   * HANDLE STATUS CHANGE
   *
   * Main method for processing approval status transitions.
   * Validates permissions, business rules, and executes the workflow.
   *
   * @param category - Category being updated
   * @param newStatus - Target approval status
   * @param adminUser - Admin performing the action
   * @param updateData - Additional update data (like rejection reason)
   * @returns Promise<void>
   */
  async handleStatusChange(
    category: Category,
    newStatus: string,
    adminUser: User,
    updateData: Partial<UpdateCategoryDto> = {},
  ): Promise<void> {
    const startTime = Date.now();
    this.logger.log(
      `🔄 Processing status change: ${category.nameEn} from "${category.approvalStatus}" to "${newStatus}" by admin ${adminUser.id}`,
    );

    try {
      // 1. Validate transition is allowed
      await this.validateStatusTransition(
        category.approvalStatus,
        newStatus as any,
      );

      // 2. Validate admin permissions
      await this.validateApprovalPermissions(adminUser, newStatus);

      // 3. Validate business rules for the new status
      await this.validateStatusBusinessRules(category, newStatus, updateData);

      // 4. Execute the status change
      await this.executeStatusChange(
        category,
        newStatus,
        adminUser,
        updateData,
      );

      // 5. Trigger post-approval actions
      await this.handlePostApprovalActions(category, newStatus, adminUser);

      const processingTime = Date.now() - startTime;
      this.logger.log(
        `✅ Status change completed: ${category.nameEn} is now "${newStatus}" (${processingTime}ms)`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Status change failed for category ${category.id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * SUBMIT FOR APPROVAL
   *
   * Moves a draft category to pending status for admin review.
   *
   * @param categoryId - Category ID to submit
   * @param submittingUser - User submitting for approval
   * @returns Promise<void>
   */
  async submitForApproval(
    categoryId: number,
    submittingUser: User,
  ): Promise<void> {
    this.logger.log(
      `📤 Submitting category ${categoryId} for approval by user ${submittingUser.id}`,
    );

    try {
      const category = await this.categoryRepository.findOne({
        where: { id: categoryId },
      });

      if (!category) {
        throw new BadRequestException(
          `Category with ID ${categoryId} not found`,
        );
      }

      // Validate category is ready for submission
      await this.validateReadyForApproval(category);

      // Change status to pending
      await this.handleStatusChange(category, 'pending', submittingUser);

      this.logger.log(`✅ Category ${categoryId} submitted for approval`);
    } catch (error) {
      this.logger.error(
        `❌ Failed to submit category ${categoryId} for approval: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * APPROVE CATEGORY
   *
   * Approves a pending category and makes it publicly visible.
   *
   * @param categoryId - Category ID to approve
   * @param adminUser - Admin performing the approval
   * @param notes - Optional approval notes
   * @returns Promise<void>
   */
  async approveCategory(
    categoryId: number,
    adminUser: User,
    notes?: string,
  ): Promise<void> {
    this.logger.log(
      `✅ Approving category ${categoryId} by admin ${adminUser.id}`,
    );

    try {
      const category = await this.categoryRepository.findOne({
        where: { id: categoryId },
      });

      if (!category) {
        throw new BadRequestException(
          `Category with ID ${categoryId} not found`,
        );
      }

      const updateData = notes ? { notes } : {};
      await this.handleStatusChange(
        category,
        'approved',
        adminUser,
        updateData,
      );

      this.logger.log(`✅ Category ${categoryId} approved successfully`);
    } catch (error) {
      this.logger.error(
        `❌ Failed to approve category ${categoryId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * REJECT CATEGORY
   *
   * Rejects a category with mandatory reason.
   *
   * @param categoryId - Category ID to reject
   * @param adminUser - Admin performing the rejection
   * @param rejectionReason - Mandatory reason for rejection
   * @returns Promise<void>
   */
  async rejectCategory(
    categoryId: number,
    adminUser: User,
    rejectionReason: string,
  ): Promise<void> {
    this.logger.log(
      `❌ Rejecting category ${categoryId} by admin ${adminUser.id}`,
    );

    try {
      if (!rejectionReason || rejectionReason.trim().length === 0) {
        throw new BadRequestException(
          'Rejection reason is mandatory when rejecting categories',
        );
      }

      const category = await this.categoryRepository.findOne({
        where: { id: categoryId },
      });

      if (!category) {
        throw new BadRequestException(
          `Category with ID ${categoryId} not found`,
        );
      }

      await this.handleStatusChange(category, 'rejected', adminUser, {
        rejectionReason,
      });

      this.logger.log(`❌ Category ${categoryId} rejected: ${rejectionReason}`);
    } catch (error) {
      this.logger.error(
        `❌ Failed to reject category ${categoryId}: ${error.message}`,
      );
      throw error;
    }
  }

  // ============================================================================
  // VALIDATION METHODS
  // ============================================================================

  /**
   * VALIDATE STATUS TRANSITION
   *
   * Ensures the requested status change follows valid workflow rules.
   *
   * @param currentStatus - Current approval status
   * @param newStatus - Target approval status
   */
  private async validateStatusTransition(
    currentStatus: string,
    newStatus: string,
  ): Promise<void> {
    this.logger.debug(`Validating transition: ${currentStatus} → ${newStatus}`);

    if (!VALID_TRANSITIONS[currentStatus as keyof typeof VALID_TRANSITIONS]) {
      throw new BadRequestException(`Invalid current status: ${currentStatus}`);
    }

    const validTransitions =
      VALID_TRANSITIONS[currentStatus as keyof typeof VALID_TRANSITIONS];

    if (!validTransitions.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition: cannot change from "${currentStatus}" to "${newStatus}". Valid transitions: ${validTransitions.join(', ')}`,
      );
    }

    this.logger.debug(`✅ Status transition validated`);
  }

  /**
   * VALIDATE APPROVAL PERMISSIONS
   *
   * Checks if the admin user has sufficient permissions for the action.
   *
   * @param adminUser - Admin user attempting the action
   * @param targetStatus - Target approval status
   */
  private async validateApprovalPermissions(
    adminUser: User,
    targetStatus: string,
  ): Promise<void> {
    this.logger.debug(
      `Validating permissions for user ${adminUser.id} to set status: ${targetStatus}`,
    );

    // Load user with role permissions
    const userWithRoles = await this.userRepository.findOne({
      where: { id: adminUser.id },
      relations: [
        'role',
        'role.rolePermissions',
        'role.rolePermissions.permission',
        'assignedRole',
        'assignedRole.rolePermissions',
        'assignedRole.rolePermissions.permission',
      ],
    });

    if (!userWithRoles) {
      throw new ForbiddenException('User not found');
    }

    const userPermissions = this.getUserPermissions(userWithRoles);
    const permissionNames = userPermissions.map((p) => p.permission.name);

    // Define required permissions for each action
    const requiredPermissions = {
      pending: ['category.submit', 'category.approve'], // Can submit or approve
      approved: ['category.approve'],
      rejected: ['category.approve'], // Same permission for approve/reject
      suspended: ['category.suspend'],
      archived: ['category.archive'],
    };

    const required = requiredPermissions[targetStatus] || [];
    const hasPermission = required.some((perm) =>
      permissionNames.includes(perm),
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `Insufficient permissions to set category status to "${targetStatus}". Required: ${required.join(' or ')}`,
      );
    }

    this.logger.debug(`✅ Permissions validated for status: ${targetStatus}`);
  }

  /**
   * VALIDATE STATUS BUSINESS RULES
   *
   * Applies business-specific validation rules for status changes.
   *
   * @param category - Category being updated
   * @param newStatus - Target status
   * @param updateData - Additional update data
   */
  private async validateStatusBusinessRules(
    category: Category,
    newStatus: string,
    updateData: Partial<UpdateCategoryDto>,
  ): Promise<void> {
    this.logger.debug(
      `Validating business rules for ${category.nameEn} → ${newStatus}`,
    );

    // Rejection requires reason
    if (newStatus === 'rejected') {
      if (
        !updateData.rejectionReason ||
        updateData.rejectionReason.trim().length === 0
      ) {
        throw new BadRequestException(
          'Rejection reason is mandatory when rejecting categories',
        );
      }

      if (updateData.rejectionReason.length > 500) {
        throw new BadRequestException(
          'Rejection reason cannot exceed 500 characters',
        );
      }
    }

    // Approval requires complete Syrian market data
    if (newStatus === 'approved') {
      await this.validateSyrianMarketCompliance(category);
    }

    // Suspension requires active status
    if (newStatus === 'suspended' && !category.isActive) {
      throw new BadRequestException(
        'Cannot suspend inactive categories. Activate first.',
      );
    }

    this.logger.debug(`✅ Business rules validated for status: ${newStatus}`);
  }

  /**
   * VALIDATE READY FOR APPROVAL
   *
   * Checks if category meets minimum requirements for submission.
   *
   * @param category - Category to validate
   */
  private async validateReadyForApproval(category: Category): Promise<void> {
    const issues: string[] = [];

    // Required fields validation
    if (!category.nameEn || category.nameEn.trim().length === 0) {
      issues.push('English name is required');
    }

    if (!category.nameAr || category.nameAr.trim().length === 0) {
      issues.push('Arabic name is required for Syrian market');
    }

    if (!category.slug || category.slug.trim().length === 0) {
      issues.push('URL slug is required');
    }

    // Category must be active
    if (!category.isActive) {
      issues.push('Category must be active to submit for approval');
    }

    // Check for existing approval
    if (category.approvalStatus !== 'draft') {
      issues.push(`Category is already in "${category.approvalStatus}" status`);
    }

    if (issues.length > 0) {
      throw new BadRequestException(
        `Category not ready for approval: ${issues.join(', ')}`,
      );
    }

    this.logger.debug(`✅ Category ready for approval: ${category.nameEn}`);
  }

  /**
   * VALIDATE SYRIAN MARKET COMPLIANCE
   *
   * Ensures category meets Syrian market requirements before approval.
   *
   * @param category - Category to validate
   */
  private async validateSyrianMarketCompliance(
    category: Category,
  ): Promise<void> {
    const issues: string[] = [];

    // Arabic content is mandatory for Syrian market
    if (!category.nameAr || category.nameAr.trim().length < 2) {
      issues.push('Arabic name must be at least 2 characters');
    }

    if (!category.descriptionAr || category.descriptionAr.trim().length === 0) {
      issues.push('Arabic description is required for approval');
    }

    // SEO requirements for Syrian market
    if (!category.seoSlug || category.seoSlug.trim().length === 0) {
      issues.push('Arabic SEO slug is required for Syrian market');
    }

    // Commission rate validation
    if (
      category.commissionRate !== null &&
      category.commissionRate !== undefined
    ) {
      if (category.commissionRate < 0.5 || category.commissionRate > 15) {
        issues.push('Commission rate must be between 0.5% and 15%');
      }
    }

    if (issues.length > 0) {
      throw new BadRequestException(
        `Syrian market compliance failed: ${issues.join(', ')}`,
      );
    }

    this.logger.debug(`✅ Syrian market compliance validated`);
  }

  // ============================================================================
  // EXECUTION METHODS
  // ============================================================================

  /**
   * EXECUTE STATUS CHANGE
   *
   * Performs the actual database update for status change.
   *
   * @param category - Category to update
   * @param newStatus - New approval status
   * @param adminUser - Admin performing the change
   * @param updateData - Additional update data
   */
  private async executeStatusChange(
    category: Category,
    newStatus: string,
    adminUser: User,
    updateData: Partial<UpdateCategoryDto>,
  ): Promise<void> {
    const userId =
      typeof adminUser.id === 'string' ? parseInt(adminUser.id) : adminUser.id;

    // Prepare update object
    const updates: Partial<Category> = {
      approvalStatus: newStatus as any,
      updatedBy: userId,
    };

    // Handle status-specific updates
    if (newStatus === 'approved') {
      updates.approvedBy = userId;
      updates.approvedAt = new Date();
      updates.rejectionReason = null; // Clear any previous rejection
    }

    if (newStatus === 'rejected') {
      updates.rejectionReason = updateData.rejectionReason;
      updates.approvedBy = null;
      updates.approvedAt = null;
    }

    if (newStatus === 'suspended') {
      updates.isActive = false; // Auto-deactivate suspended categories
    }

    // Execute the update
    await this.categoryRepository.update(category.id, updates);

    // Log the action
    await this.auditLogService.logSimple({
      action: `CATEGORY_${newStatus.toUpperCase()}`,
      module: 'categories',
      actorId: userId,
      actorType: 'admin',
      entityType: 'category',
      entityId: category.id,
      description: `Category "${category.nameEn}" status changed to ${newStatus}${
        updateData.rejectionReason ? ': ' + updateData.rejectionReason : ''
      }`,
    });

    this.logger.debug(
      `✅ Status change executed: ${category.id} → ${newStatus}`,
    );
  }

  /**
   * HANDLE POST-APPROVAL ACTIONS
   *
   * Executes additional actions after status change (notifications, etc).
   *
   * @param category - Updated category
   * @param newStatus - New status
   * @param adminUser - Admin who made the change
   */
  private async handlePostApprovalActions(
    category: Category,
    newStatus: string,
    adminUser: User,
  ): Promise<void> {
    this.logger.debug(
      `Executing post-approval actions for status: ${newStatus}`,
    );

    try {
      // Update last activity timestamp
      await this.categoryRepository.update(category.id, {
        lastActivityAt: new Date(),
      });

      // Status-specific actions
      switch (newStatus) {
        case 'approved':
          await this.handleApprovalActions(category, adminUser);
          break;
        case 'rejected':
          await this.handleRejectionActions(category, adminUser);
          break;
        case 'suspended':
          await this.handleSuspensionActions(category, adminUser);
          break;
      }

      this.logger.debug(`✅ Post-approval actions completed for ${newStatus}`);
    } catch (error) {
      this.logger.error(
        `❌ Post-approval actions failed: ${error.message}`,
        error.stack,
      );
      // Don't throw - main operation succeeded
    }
  }

  /**
   * HANDLE APPROVAL ACTIONS
   *
   * Actions to perform when a category is approved.
   */
  private async handleApprovalActions(
    category: Category,
    adminUser: User,
  ): Promise<void> {
    // Auto-activate approved categories
    if (!category.isActive) {
      await this.categoryRepository.update(category.id, {
        isActive: true,
      });
    }

    // TODO: Send notification to category creator
    // TODO: Update parent category metrics
    // TODO: Trigger cache invalidation for category tree

    this.logger.debug(
      `✅ Approval actions completed for category ${category.id}`,
    );
  }

  /**
   * HANDLE REJECTION ACTIONS
   *
   * Actions to perform when a category is rejected.
   */
  private async handleRejectionActions(
    category: Category,
    adminUser: User,
  ): Promise<void> {
    // Auto-deactivate rejected categories
    await this.categoryRepository.update(category.id, {
      isActive: false,
    });

    // TODO: Send rejection notification with reason
    // TODO: Log detailed rejection analytics

    this.logger.debug(
      `✅ Rejection actions completed for category ${category.id}`,
    );
  }

  /**
   * HANDLE SUSPENSION ACTIONS
   *
   * Actions to perform when a category is suspended.
   */
  private async handleSuspensionActions(
    category: Category,
    adminUser: User,
  ): Promise<void> {
    // TODO: Hide category from all public listings
    // TODO: Notify vendors about suspended category
    // TODO: Log suspension analytics

    this.logger.debug(
      `✅ Suspension actions completed for category ${category.id}`,
    );
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * GET USER PERMISSIONS
   *
   * Extracts all permissions from user's roles (business + assigned admin roles).
   * Follows the same pattern as your PermissionsGuard.
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

    // Remove duplicates based on permission ID
    const uniquePermissions = permissions.filter(
      (perm, index, self) =>
        index === self.findIndex((p) => p.permission.id === perm.permission.id),
    );

    return uniquePermissions;
  }

  /**
   * GET APPROVAL STATISTICS
   *
   * Returns approval workflow statistics for admin dashboard.
   */
  async getApprovalStatistics(): Promise<{
    pending: number;
    approved: number;
    rejected: number;
    total: number;
  }> {
    const [pending, approved, rejected, total] = await Promise.all([
      this.categoryRepository.count({ where: { approvalStatus: 'pending' } }),
      this.categoryRepository.count({ where: { approvalStatus: 'approved' } }),
      this.categoryRepository.count({ where: { approvalStatus: 'rejected' } }),
      this.categoryRepository.count(),
    ]);

    return { pending, approved, rejected, total };
  }

  /**
   * Transform category entity to response DTO
   */
  private transformToResponseDto(
    category: Category,
    language: 'en' | 'ar' = 'en',
  ): CategoryResponseDto {
    return {
      id: category.id,
      nameEn: category.nameEn,
      nameAr: category.nameAr,
      name: category.getDisplayName(language),
      displayName: category.getDisplayName(language),
      slug: category.slug,
      descriptionEn: category.descriptionEn,
      descriptionAr: category.descriptionAr,
      displayDescription: category.getDisplayDescription(language),
      iconUrl: category.iconUrl,
      bannerUrl: category.bannerUrl,
      themeColor: category.themeColor,
      approvalStatus: category.approvalStatus,
      isActive: category.isActive,
      isFeatured: category.isFeatured,
      sortOrder: category.sortOrder,
      showInNav: category.showInNav,
      productCount: category.productCount,
      viewCount: category.viewCount,
      popularityScore: category.popularityScore,
      depthLevel: category.depthLevel,
      categoryPath: category.categoryPath,
      isPublic: category.isPublic(),
      canBeEdited: category.canBeEdited(),
      isRootCategory: category.isRootCategory(),
      hasChildren: category.hasChildren(),
      needsAdminAttention: category.needsAdminAttention(),
      parent: category.parent
        ? {
            id: category.parent.id,
            name: category.parent.getDisplayName(language),
            slug: category.parent.slug,
          }
        : null,
      url: category.generateUrl(language),
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      createdBy: category.createdBy,
      updatedBy: category.updatedBy,
      approvedBy: category.approvedBy,
      approvedAt: category.approvedAt,
    };
  }

  /**
   * GET PENDING CATEGORIES
   *
   * Retrieves categories awaiting approval with pagination and filtering.
   *
   * @param queryDto - Query parameters for filtering and pagination
   * @returns Paginated list of pending categories with summary
   */
  async getPendingCategories(queryDto: PendingCategoriesQueryDto) {
    this.logger.log('📋 Fetching pending approval categories');

    try {
      // Build query with filters
      const queryBuilder = this.categoryRepository
        .createQueryBuilder('category')
        .leftJoinAndSelect('category.creator', 'creator')
        .leftJoinAndSelect('category.parent', 'parent');

      // Apply status filter
      if (queryDto.status) {
        queryBuilder.where('category.approvalStatus = :status', {
          status: queryDto.status,
        });
      } else {
        // Default: show draft, pending, and rejected
        queryBuilder.where('category.approvalStatus IN (:...statuses)', {
          statuses: ['draft', 'pending', 'rejected'],
        });
      }

      // Apply sorting
      const sortField = queryDto.sortBy || 'createdAt';
      const sortOrder = queryDto.sortOrder || 'DESC';
      queryBuilder.orderBy(`category.${sortField}`, sortOrder);

      // Get total count
      const total = await queryBuilder.getCount();

      // Apply pagination
      const page = queryDto.page || 1;
      const limit = queryDto.limit || 20;
      const skip = (page - 1) * limit;

      const categories = await queryBuilder.skip(skip).take(limit).getMany();

      // Calculate summary statistics
      const summary = await this.calculatePendingSummary();

      return {
        data: categories,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
        summary,
      };
    } catch (error) {
      this.logger.error(
        `❌ Failed to fetch pending categories: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Calculate summary statistics for pending categories
   */
  private async calculatePendingSummary() {
    const [pendingCount, draftCount, rejectedCount] = await Promise.all([
      this.categoryRepository.count({ where: { approvalStatus: 'pending' } }),
      this.categoryRepository.count({ where: { approvalStatus: 'draft' } }),
      this.categoryRepository.count({ where: { approvalStatus: 'rejected' } }),
    ]);

    // Get oldest pending category
    const oldestPending = await this.categoryRepository.findOne({
      where: { approvalStatus: 'pending' },
      order: { createdAt: 'ASC' },
    });

    return {
      pendingCount,
      draftCount,
      rejectedCount,
      oldestPending: oldestPending?.createdAt || null,
    };
  }

  /**
   * BULK STATUS CHANGE
   *
   * Changes the approval status of multiple categories simultaneously.
   *
   * @param bulkStatusChangeDto - Bulk operation data
   * @param adminUser - Admin performing the operation
   * @returns Results of bulk operation
   */
  async bulkStatusChange(
    bulkStatusChangeDto: BulkStatusChangeDto,
    adminUser: User,
  ) {
    this.logger.log(
      `🔄 Processing bulk status change: ${bulkStatusChangeDto.categoryIds.length} categories to ${bulkStatusChangeDto.newStatus}`,
    );

    const results = {
      totalRequested: bulkStatusChangeDto.categoryIds.length,
      successful: 0,
      failed: 0,
      skipped: 0,
      successfulIds: [],
      failedIds: [],
      errors: [],
    };

    try {
      // Process each category
      for (const categoryId of bulkStatusChangeDto.categoryIds) {
        try {
          // Find category
          const category = await this.categoryRepository.findOne({
            where: { id: categoryId },
          });

          if (!category) {
            results.failed++;
            results.failedIds.push(categoryId);
            results.errors.push({
              categoryId,
              error: 'Category not found',
            });
            continue;
          }

          // Update status
          await this.handleStatusChange(
            category,
            bulkStatusChangeDto.newStatus,
            adminUser,
            {
              rejectionReason: bulkStatusChangeDto.reason,
            },
          );

          results.successful++;
          results.successfulIds.push(categoryId);
        } catch (error) {
          results.failed++;
          results.failedIds.push(categoryId);
          results.errors.push({
            categoryId,
            error: error.message,
          });
        }
      }

      this.logger.log(
        `✅ Bulk status change completed: ${results.successful}/${results.totalRequested} successful`,
      );

      return results;
    } catch (error) {
      this.logger.error(`❌ Bulk status change failed: ${error.message}`);
      throw error;
    }
  }
}
