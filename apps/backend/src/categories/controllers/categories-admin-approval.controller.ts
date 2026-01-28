/**
 * @file categories-admin-approval.controller.ts
 * @description Admin Controller for Category Approval Workflow Operations
 *
 * RESPONSIBILITIES:
 * - Category approval workflow management
 * - Status transitions (draft → pending → approved → rejected)
 * - Bulk approval operations
 * - Pending categories management
 * - Approval analytics and reporting
 *
 * SCOPE:
 * - POST   /admin/categories/:id/approve     - Approve category
 * - POST   /admin/categories/:id/reject      - Reject category
 * - GET    /admin/categories/pending-approval - List pending categories
 * - POST   /admin/categories/bulk-status-change - Bulk status operations
 *
 * @author SouqSyria Development Team
 * @since 2025-06-01
 * @version 2.0.0 - Extracted from monolithic admin controller
 */

import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Logger,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

// Import Guards and Decorators
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../access-control/guards/permissions.guard';
import { Permissions } from '../../access-control/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

// Import Services
import { CategoryApprovalService } from '../services/category-approval.service';

// Import DTOs and Types
import { ApproveCategoryDto } from '../dto/approve-category.dto';
import { RejectCategoryDto } from '../dto/reject-category.dto';
import { PendingCategoriesQueryDto } from '../dto/pending-categories-query.dto';
import { BulkStatusChangeDto } from '../dto/bulk-status-change.dto';

// Import Entities
import { User } from '../../users/entities/user.entity';

/**
 * ADMIN CATEGORIES APPROVAL CONTROLLER
 *
 * Handles approval workflow operations with comprehensive validation and audit trails.
 * Focused on category approval lifecycle management.
 *
 * Route Pattern: /api/admin/categories/*
 * Authentication: JWT + ACL Permissions
 * Audit: All approval operations logged with detailed context
 */
@ApiTags('Admin Categories - Approval Workflow')
@ApiBearerAuth()
@Controller('admin/categories')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CategoriesAdminApprovalController {
  private readonly logger = new Logger(CategoriesAdminApprovalController.name);

  constructor(
    private readonly categoryApprovalService: CategoryApprovalService,
  ) {
    this.logger.log('🔐 Admin Categories Approval Controller initialized');
  }

  // ============================================================================
  // APPROVE CATEGORY
  // ============================================================================

  @Post(':id/approve')
  @Permissions('category.approve')
  @ApiOperation({
    summary: 'Approve category by ID',
    description: `
      Approve a pending category and make it publicly visible.
      
      Features:
      • Complete approval workflow validation
      • Syrian market compliance checks
      • Automatic status transition to 'approved'
      • Optional approval notes for audit trail
      • Auto-activation option for immediate visibility
      • Comprehensive audit logging
      
      Business Rules:
      • Only pending categories can be approved
      • Category must meet all Syrian market requirements
      • Arabic content validation (name, description)
      • Commission rate validation (0.5% - 15%)
      • SEO requirements validation
      • Admin permission validation
      
      Post-Approval Actions:
      • Auto-activate category if configured
      • Update parent category metrics
      • Trigger cache invalidation
      • Send approval notifications
    `,
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Category ID to approve',
    example: 1,
  })
  @ApiBody({
    type: ApproveCategoryDto,
    description: 'Approval data with optional notes',
    examples: {
      'basic-approval': {
        summary: 'Basic Approval',
        description: 'Simple approval without notes',
        value: {
          autoActivate: true,
        },
      },
      'approval-with-notes': {
        summary: 'Approval with Notes',
        description: 'Approval with admin notes for audit trail',
        value: {
          approvalNotes:
            'Category meets all Syrian market guidelines. Approved for immediate activation.',
          autoActivate: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Category approved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Category approved successfully' },
        approvedCategory: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            nameEn: { type: 'string', example: 'Electronics' },
            nameAr: { type: 'string', example: 'إلكترونيات' },
            approvalStatus: { type: 'string', example: 'approved' },
            isActive: { type: 'boolean', example: true },
            approvedBy: { type: 'number', example: 5 },
            approvedAt: { type: 'string', format: 'date-time' },
          },
        },
        metadata: {
          type: 'object',
          properties: {
            processingTime: { type: 'number', example: 156 },
            requestId: { type: 'string', example: 'approve_1_1672531200' },
            approvalNotes: {
              type: 'string',
              example: 'Category meets guidelines',
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Category not eligible for approval or validation failed',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions to approve categories',
  })
  async approveCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() approveCategoryDto: ApproveCategoryDto,
    @CurrentUser() adminUser: User,
  ) {
    const startTime = Date.now();
    const requestId = `approve_${id}_${Date.now()}`;

    this.logger.log(
      `✅ [${requestId}] Approving category ID: ${id} by admin ${adminUser.id}`,
    );

    try {
      // Validate category ID
      if (!id || id < 1) {
        this.logger.warn(`⚠️ [${requestId}] Invalid category ID: ${id}`);
        throw new BadRequestException('Invalid category ID');
      }

      // Call approval service
      await this.categoryApprovalService.approveCategory(
        id,
        adminUser,
        approveCategoryDto.approvalNotes,
      );

      const processingTime = Date.now() - startTime;

      this.logger.log(
        `✅ [${requestId}] Category approved successfully (${processingTime}ms)`,
      );

      return {
        success: true,
        message: 'Category approved successfully',
        approvedCategory: {
          id,
          approvalStatus: 'approved',
          isActive: approveCategoryDto.autoActivate ?? true,
          approvedBy: adminUser.id,
          approvedAt: new Date(),
        },
        metadata: {
          processingTime,
          requestId,
          approvalNotes: approveCategoryDto.approvalNotes,
          autoActivated: approveCategoryDto.autoActivate ?? true,
        },
      };
    } catch (error: unknown) {
      const processingTime = Date.now() - startTime;

      this.logger.error(
        `❌ [${requestId}] Category approval failed: ${(error as Error).message} (${processingTime}ms)`,
      );

      throw error;
    }
  }

  // ============================================================================
  // REJECT CATEGORY
  // ============================================================================

  @Post(':id/reject')
  @Permissions('category.approve') // Same permission as approve for workflow management
  @ApiOperation({
    summary: 'Reject category by ID',
    description: `
      Reject a category with mandatory reason and detailed audit trail.
      
      Features:
      • Complete rejection workflow validation
      • Mandatory rejection reason for transparency
      • Automatic status transition to 'rejected'
      • Auto-deactivation for safety
      • Detailed rejection analytics
      • Comprehensive audit logging
      
      Business Rules:
      • Only pending categories can be rejected
      • Rejection reason is mandatory (max 1000 characters)
      • Category automatically deactivated upon rejection
      • Admin permission validation required
      • Rejection creates detailed audit trail
      
      Post-Rejection Actions:
      • Auto-deactivate category for safety
      • Update category hierarchy metrics
      • Send rejection notification with reason
      • Log detailed rejection analytics
    `,
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Category ID to reject',
    example: 1,
  })
  @ApiBody({
    type: RejectCategoryDto,
    description: 'Rejection data with mandatory reason',
    examples: {
      'content-violation': {
        summary: 'Content Policy Violation',
        description: 'Rejection due to content not meeting guidelines',
        value: {
          rejectionReason:
            'Category name and description do not comply with Syrian market content guidelines. Please provide Arabic translations and ensure cultural appropriateness.',
        },
      },
      'technical-issues': {
        summary: 'Technical Requirements',
        description: 'Rejection due to technical requirements not met',
        value: {
          rejectionReason:
            'Category missing required SEO fields and commission rate is outside acceptable range (0.5% - 15%). Please complete all mandatory fields.',
        },
      },
      'business-rules': {
        summary: 'Business Rule Violation',
        description: 'Rejection due to business rule violations',
        value: {
          rejectionReason:
            'Category hierarchy exceeds maximum depth of 5 levels. Please restructure category tree or move to appropriate parent category.',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Category rejected successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Category rejected with reason' },
        rejectedCategory: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            nameEn: { type: 'string', example: 'Electronics' },
            nameAr: { type: 'string', example: 'إلكترونيات' },
            approvalStatus: { type: 'string', example: 'rejected' },
            isActive: { type: 'boolean', example: false },
            rejectionReason: {
              type: 'string',
              example: 'Does not meet Syrian market guidelines',
            },
            rejectedBy: { type: 'number', example: 5 },
            rejectedAt: { type: 'string', format: 'date-time' },
          },
        },
        metadata: {
          type: 'object',
          properties: {
            processingTime: { type: 'number', example: 203 },
            requestId: { type: 'string', example: 'reject_1_1672531200' },
            reasonLength: { type: 'number', example: 87 },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  @ApiResponse({
    status: 400,
    description:
      'Category not eligible for rejection or missing rejection reason',
  })
  async rejectCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() rejectCategoryDto: RejectCategoryDto,
    @CurrentUser() adminUser: User,
  ) {
    const startTime = Date.now();
    const requestId = `reject_${id}_${Date.now()}`;

    this.logger.log(
      `❌ [${requestId}] Rejecting category ID: ${id} by admin ${adminUser.id}`,
    );

    try {
      // Validate rejection reason
      if (!rejectCategoryDto.rejectionReason?.trim()) {
        this.logger.warn(`⚠️ [${requestId}] Rejection reason is required`);
        throw new BadRequestException('Rejection reason is required');
      }

      this.logger.debug(
        `📝 [${requestId}] Rejection reason: ${rejectCategoryDto.rejectionReason}`,
      );

      // Call rejection service
      await this.categoryApprovalService.rejectCategory(
        id,
        adminUser,
        rejectCategoryDto.rejectionReason,
      );

      const processingTime = Date.now() - startTime;

      this.logger.log(
        `❌ [${requestId}] Category rejected successfully (${processingTime}ms)`,
      );

      return {
        success: true,
        message: 'Category rejected with reason',
        rejectedCategory: {
          id,
          approvalStatus: 'rejected',
          isActive: false,
          rejectionReason: rejectCategoryDto.rejectionReason,
          rejectedBy: adminUser.id,
          rejectedAt: new Date(),
        },
        metadata: {
          processingTime,
          requestId,
          reasonLength: rejectCategoryDto.rejectionReason.length,
        },
      };
    } catch (error: unknown) {
      const processingTime = Date.now() - startTime;

      this.logger.error(
        `❌ [${requestId}] Category rejection failed: ${(error as Error).message} (${processingTime}ms)`,
      );

      throw error;
    }
  }

  // ============================================================================
  // GET PENDING CATEGORIES
  // ============================================================================

  @Get('pending-approval')
  @Permissions('category.approve')
  @ApiOperation({
    summary: 'Get categories pending approval',
    description: `
      Retrieve categories awaiting approval with comprehensive filtering and analytics.
      
      Features:
      • Multi-status filtering (draft, pending, rejected)
      • Advanced pagination with metadata
      • Creator information for accountability
      • Submission timestamps and aging analysis
      • Priority scoring based on business rules
      • Summary statistics for dashboard
      
      Filtering Options:
      • Status: draft, pending, rejected, all
      • Date range: created after/before specific dates
      • Creator: filter by submitting user
      • Priority: high, medium, low priority categories
      • Aging: categories older than X days
      
      Analytics Included:
      • Total pending categories count
      • Average approval time
      • Oldest pending category
      • Approval rate statistics
      • Creator distribution
    `,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['draft', 'pending', 'rejected', 'all'],
    description: 'Filter by approval status',
    example: 'pending',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: 'number',
    description: 'Page number for pagination',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: 'number',
    description: 'Items per page (max 50)',
    example: 20,
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['createdAt', 'updatedAt', 'nameEn', 'priority'],
    description: 'Field to sort by',
    example: 'createdAt',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Sort direction',
    example: 'DESC',
  })
  @ApiResponse({
    status: 200,
    description: 'Pending categories retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              nameEn: { type: 'string', example: 'Electronics' },
              nameAr: { type: 'string', example: 'إلكترونيات' },
              approvalStatus: { type: 'string', example: 'pending' },
              createdAt: { type: 'string', format: 'date-time' },
              creator: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 3 },
                  name: { type: 'string', example: 'Ahmad Manager' },
                  email: { type: 'string', example: 'ahmad@souqsyria.com' },
                },
              },
              daysWaiting: { type: 'number', example: 5 },
              priority: {
                type: 'string',
                enum: ['high', 'medium', 'low'],
                example: 'medium',
              },
            },
          },
        },
        pagination: {
          type: 'object',
          properties: {
            total: { type: 'number', example: 45 },
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 20 },
            totalPages: { type: 'number', example: 3 },
          },
        },
        summary: {
          type: 'object',
          properties: {
            pendingCount: { type: 'number', example: 12 },
            draftCount: { type: 'number', example: 8 },
            rejectedCount: { type: 'number', example: 3 },
            oldestPending: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  })
  async getPendingCategories(@Query() queryDto: PendingCategoriesQueryDto) {
    const startTime = Date.now();
    const requestId = `pending_${Date.now()}`;

    this.logger.log(`📋 [${requestId}] Fetching pending approval categories`);

    try {
      const result =
        await this.categoryApprovalService.getPendingCategories(queryDto);
      const processingTime = Date.now() - startTime;

      this.logger.log(
        `✅ [${requestId}] Retrieved ${result.data.length} pending categories (${processingTime}ms)`,
      );

      return {
        success: true,
        message: `Found ${result.data.length} categories awaiting approval`,
        ...result,
        metadata: {
          processingTime,
          requestId,
          generatedAt: new Date(),
        },
      };
    } catch (error: unknown) {
      const processingTime = Date.now() - startTime;

      this.logger.error(
        `❌ [${requestId}] Failed to retrieve pending categories: ${(error as Error).message} (${processingTime}ms)`,
      );

      throw error;
    }
  }

  // ============================================================================
  // BULK STATUS CHANGE
  // ============================================================================

  @Post('bulk-status-change')
  @Permissions('category.bulk-manage')
  @ApiOperation({
    summary: 'Bulk status change for multiple categories',
    description: `
      Change the approval status of multiple categories simultaneously.
      
      Features:
      • Batch processing with progress tracking
      • Individual validation per category
      • Partial success handling with detailed results
      • Comprehensive error reporting
      • Audit trail for all changes
      • Performance optimization for large batches
      
      Business Rules:
      • Maximum 50 categories per batch
      • Individual validation per category
      • Rejection requires mandatory reason
      • Failed categories don't affect successful ones
      • Complete audit trail for all operations
      
      Supported Status Changes:
      • draft → pending, approved
      • pending → approved, rejected
      • rejected → draft, pending
      • approved → suspended, archived
      • suspended → approved, archived
    `,
  })
  @ApiBody({
    type: BulkStatusChangeDto,
    description: 'Bulk status change data',
    examples: {
      'bulk-approval': {
        summary: 'Bulk Approval',
        description: 'Approve multiple pending categories',
        value: {
          categoryIds: [1, 2, 3, 4, 5],
          newStatus: 'approved',
          reason:
            'Bulk approval after review meeting - all categories meet Syrian market guidelines',
          autoActivate: true,
        },
      },
      'bulk-rejection': {
        summary: 'Bulk Rejection',
        description: 'Reject multiple categories with reason',
        value: {
          categoryIds: [6, 7, 8],
          newStatus: 'rejected',
          reason:
            'Categories do not meet current Syrian market content standards. Require Arabic translations and cultural adaptations.',
          autoActivate: false,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Bulk status change completed',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Bulk status change completed: 4/5 categories updated',
        },
        results: {
          type: 'object',
          properties: {
            totalRequested: { type: 'number', example: 5 },
            successful: { type: 'number', example: 4 },
            failed: { type: 'number', example: 1 },
            skipped: { type: 'number', example: 0 },
            successfulIds: {
              type: 'array',
              items: { type: 'number' },
              example: [1, 2, 3, 4],
            },
            failedIds: {
              type: 'array',
              items: { type: 'number' },
              example: [5],
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  categoryId: { type: 'number' },
                  error: { type: 'string' },
                },
              },
            },
          },
        },
        operationSummary: {
          type: 'object',
          properties: {
            newStatus: { type: 'string', example: 'approved' },
            reason: { type: 'string', example: 'Bulk approval' },
            performedBy: { type: 'number', example: 5 },
            performedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request data or too many categories',
  })
  async bulkStatusChange(
    @Body() bulkStatusChangeDto: BulkStatusChangeDto,
    @CurrentUser() adminUser: User,
  ) {
    const startTime = Date.now();
    const requestId = `bulk_status_${Date.now()}`;

    this.logger.log(
      `🔄 [${requestId}] Bulk status change: ${bulkStatusChangeDto.categoryIds.length} categories to ${bulkStatusChangeDto.newStatus} by admin ${adminUser.id}`,
    );

    try {
      // Validate request data
      if (
        !bulkStatusChangeDto.categoryIds ||
        bulkStatusChangeDto.categoryIds.length === 0
      ) {
        this.logger.warn(`⚠️ [${requestId}] No category IDs provided`);
        throw new BadRequestException('At least one category ID is required');
      }

      if (bulkStatusChangeDto.categoryIds.length > 50) {
        this.logger.warn(
          `⚠️ [${requestId}] Too many categories: ${bulkStatusChangeDto.categoryIds.length}`,
        );
        throw new BadRequestException(
          'Cannot update more than 50 categories at once',
        );
      }

      // Validate rejection requires reason
      if (
        bulkStatusChangeDto.newStatus === 'rejected' &&
        !bulkStatusChangeDto.reason?.trim()
      ) {
        this.logger.warn(`⚠️ [${requestId}] Rejection requires reason`);
        throw new BadRequestException(
          'Rejection reason is required when rejecting categories',
        );
      }

      this.logger.debug(
        `📝 [${requestId}] Bulk operation: ${bulkStatusChangeDto.categoryIds.length} categories, status=${bulkStatusChangeDto.newStatus}, reason="${bulkStatusChangeDto.reason}"`,
      );

      // Call bulk service
      const results = await this.categoryApprovalService.bulkStatusChange(
        bulkStatusChangeDto,
        adminUser,
      );

      const processingTime = Date.now() - startTime;

      this.logger.log(
        `✅ [${requestId}] Bulk status change completed: ${results.successful}/${results.totalRequested} successful in ${processingTime}ms`,
      );

      return {
        success: true,
        message: `Bulk status change completed: ${results.successful}/${results.totalRequested} categories updated`,
        results,
        operationSummary: {
          newStatus: bulkStatusChangeDto.newStatus,
          reason: bulkStatusChangeDto.reason,
          performedBy: adminUser.id,
          performedAt: new Date(),
        },
        metadata: {
          processingTime,
          requestId,
        },
      };
    } catch (error: unknown) {
      const processingTime = Date.now() - startTime;

      this.logger.error(
        `❌ [${requestId}] Bulk status change failed: ${(error as Error).message} (${processingTime}ms)`,
      );

      throw error;
    }
  }
}
