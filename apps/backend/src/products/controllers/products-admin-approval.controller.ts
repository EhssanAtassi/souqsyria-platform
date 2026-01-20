/**
 * @file products-admin-approval.controller.ts
 * @description Admin Controller for Product Approval Workflow
 *
 * RESPONSIBILITIES:
 * - Product approval workflow management
 * - Admin approval/rejection endpoints
 * - Bulk approval operations
 * - Pending products management
 * - Approval statistics and analytics
 *
 * ENDPOINTS:
 * - POST /admin/products/:id/approve - Approve product
 * - POST /admin/products/:id/reject - Reject product
 * - POST /admin/products/:id/submit - Submit for approval
 * - POST /admin/products/bulk-status - Bulk status change
 * - GET /admin/products/pending - Get pending products
 * - GET /admin/products/approval-stats - Get approval statistics
 *
 * @author SouqSyria Development Team
 * @since 2025-08-08
 * @version 1.0.0
 */

import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
  Logger,
} from '@nestjs/common';

import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserFromToken } from '../../common/interfaces/user-from-token.interface';
import { PermissionsGuard } from '../../access-control/guards/permissions.guard';
import { ProductApprovalService } from '../services/product-approval.service';
import { ApproveProductDto } from '../dto/approve-product.dto';
import { RejectProductDto } from '../dto/reject-product.dto';
import { BulkProductStatusChangeDto } from '../dto/bulk-product-status-change.dto';
import { PendingProductsQueryDto } from '../dto/pending-products-query.dto';

@ApiTags('🔐 Admin Products - Approval Workflow')
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller('admin/products')
export class ProductsAdminApprovalController {
  private readonly logger = new Logger(ProductsAdminApprovalController.name);

  constructor(
    private readonly productApprovalService: ProductApprovalService,
  ) {}

  /**
   * APPROVE PRODUCT
   *
   * Approves a pending product and makes it publicly available.
   * Requires admin permissions and validates Syrian market compliance.
   */
  @Post(':id/approve')
  @ApiOperation({
    summary: 'Approve product for publication',
    description:
      'Approves a product and makes it publicly available with full Syrian market compliance validation',
  })
  @ApiParam({
    name: 'id',
    description: 'Product ID to approve',
    type: 'integer',
    example: 123,
  })
  @ApiBody({
    type: ApproveProductDto,
    description: 'Optional approval notes',
    examples: {
      withNotes: {
        summary: 'Approval with notes',
        value: {
          notes:
            'Product meets all quality standards and Syrian market requirements',
        },
      },
      withoutNotes: {
        summary: 'Simple approval',
        value: {},
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Product approved successfully',
    schema: {
      example: {
        message: 'Product approved successfully',
        productId: 123,
        approvedAt: '2025-08-08T12:00:00.000Z',
        approvedBy: 456,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Product not ready for approval or validation failed',
    schema: {
      example: {
        message:
          'Syrian market compliance failed: Arabic name must be at least 2 characters',
        error: 'Bad Request',
        statusCode: 400,
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions to approve products',
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  async approveProduct(
    @Param('id', ParseIntPipe) productId: number,
    @CurrentUser() user: UserFromToken,
    @Body() approveDto: ApproveProductDto,
  ) {
    this.logger.log(`🎯 Admin ${user.id} approving product ${productId}`);

    await this.productApprovalService.approveProduct(
      productId,
      user as any,
      approveDto.notes,
    );

    return {
      message: 'Product approved successfully',
      productId,
      approvedAt: new Date(),
      approvedBy: user.id,
    };
  }

  /**
   * REJECT PRODUCT
   *
   * Rejects a product with mandatory reason and moves it back to draft status.
   * Vendor will be notified about the rejection with detailed feedback.
   */
  @Post(':id/reject')
  @ApiOperation({
    summary: 'Reject product with reason',
    description:
      'Rejects a product with mandatory reason and detailed feedback for improvement',
  })
  @ApiParam({
    name: 'id',
    description: 'Product ID to reject',
    type: 'integer',
    example: 123,
  })
  @ApiBody({
    type: RejectProductDto,
    description: 'Rejection reason and feedback',
    examples: {
      qualityIssues: {
        summary: 'Quality issues',
        value: {
          rejectionReason:
            'Product images do not meet quality standards. Please upload high-resolution images with white background and multiple angles.',
        },
      },
      complianceIssues: {
        summary: 'Compliance issues',
        value: {
          rejectionReason:
            'Arabic product name and description are required for Syrian market compliance.',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Product rejected successfully',
    schema: {
      example: {
        message: 'Product rejected successfully',
        productId: 123,
        rejectedAt: '2025-08-08T12:00:00.000Z',
        rejectedBy: 456,
        reason: 'Product images do not meet quality standards',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid rejection request or missing reason',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions to reject products',
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  async rejectProduct(
    @Param('id', ParseIntPipe) productId: number,
    @CurrentUser() user: UserFromToken,
    @Body() rejectDto: RejectProductDto,
  ) {
    this.logger.log(
      `❌ Admin ${user.id} rejecting product ${productId}: ${rejectDto.rejectionReason}`,
    );

    await this.productApprovalService.rejectProduct(
      productId,
      user as any,
      rejectDto.rejectionReason,
    );

    return {
      message: 'Product rejected successfully',
      productId,
      rejectedAt: new Date(),
      rejectedBy: user.id,
      reason: rejectDto.rejectionReason,
    };
  }

  /**
   * SUBMIT PRODUCT FOR APPROVAL
   *
   * Submits a draft product for admin review.
   * Validates product completeness before submission.
   */
  @Post(':id/submit')
  @ApiOperation({
    summary: 'Submit product for approval',
    description:
      'Submits a draft product for admin review with comprehensive validation',
  })
  @ApiParam({
    name: 'id',
    description: 'Product ID to submit for approval',
    type: 'integer',
    example: 123,
  })
  @ApiResponse({
    status: 200,
    description: 'Product submitted for approval successfully',
    schema: {
      example: {
        message: 'Product submitted for approval successfully',
        productId: 123,
        submittedAt: '2025-08-08T12:00:00.000Z',
        submittedBy: 456,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Product not ready for submission',
    schema: {
      example: {
        message:
          'Product not ready for approval: Arabic name is required for Syrian market',
        error: 'Bad Request',
        statusCode: 400,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  async submitForApproval(
    @Param('id', ParseIntPipe) productId: number,
    @CurrentUser() user: UserFromToken,
  ) {
    this.logger.log(
      `📤 User ${user.id} submitting product ${productId} for approval`,
    );

    await this.productApprovalService.submitForApproval(productId, user as any);

    return {
      message: 'Product submitted for approval successfully',
      productId,
      submittedAt: new Date(),
      submittedBy: user.id,
    };
  }

  /**
   * BULK STATUS CHANGE
   *
   * Changes approval status for multiple products simultaneously.
   * Supports bulk approval, rejection, and other status transitions.
   */
  @Post('bulk-status')
  @ApiOperation({
    summary: 'Bulk change product approval status',
    description:
      'Changes approval status for multiple products with comprehensive validation',
  })
  @ApiBody({
    type: BulkProductStatusChangeDto,
    description: 'Bulk status change configuration',
    examples: {
      bulkApproval: {
        summary: 'Bulk approval',
        value: {
          productIds: [1, 2, 3, 4, 5],
          newStatus: 'approved',
          reason: 'Bulk approval after quality review',
        },
      },
      bulkRejection: {
        summary: 'Bulk rejection',
        value: {
          productIds: [6, 7, 8],
          newStatus: 'rejected',
          reason: 'Products do not meet Syrian market requirements',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Bulk status change completed',
    schema: {
      example: {
        message: 'Bulk status change completed',
        results: {
          totalRequested: 5,
          successful: 4,
          failed: 1,
          skipped: 0,
          successfulIds: [1, 2, 3, 4],
          failedIds: [5],
          errors: [
            {
              productId: 5,
              error: 'Product not ready for approval',
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid bulk operation request',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions for bulk operations',
  })
  async bulkStatusChange(
    @CurrentUser() user: UserFromToken,
    @Body() bulkDto: BulkProductStatusChangeDto,
  ) {
    this.logger.log(
      `🔄 Admin ${user.id} performing bulk status change: ${bulkDto.productIds.length} products to ${bulkDto.newStatus}`,
    );

    const results = await this.productApprovalService.bulkStatusChange(
      bulkDto.productIds,
      bulkDto.newStatus as 'approved' | 'rejected' | 'suspended' | 'archived',
      user as any,
      bulkDto.reason,
    );

    return {
      message: 'Bulk status change completed',
      results,
    };
  }

  /**
   * GET PENDING PRODUCTS
   *
   * Retrieves products awaiting approval with advanced filtering and pagination.
   * Provides comprehensive admin view with all necessary details.
   */
  @Get('pending')
  @ApiOperation({
    summary: 'Get products pending approval',
    description:
      'Retrieves products awaiting approval with filtering, pagination, and admin details',
  })
  @ApiResponse({
    status: 200,
    description: 'Pending products retrieved successfully',
    schema: {
      example: {
        data: [
          {
            id: 123,
            nameEn: 'iPhone 14 Pro',
            nameAr: 'آيفون 14 برو',
            approvalStatus: 'pending',
            submittedAt: '2025-08-08T10:00:00.000Z',
            vendor: {
              id: 1,
              storeName: 'TechStore Syria',
            },
            category: {
              id: 1,
              nameEn: 'Smartphones',
              nameAr: 'الهواتف الذكية',
            },
          },
        ],
        pagination: {
          total: 25,
          page: 1,
          limit: 20,
          totalPages: 2,
          hasNext: true,
          hasPrev: false,
        },
        summary: {
          pendingCount: 15,
          draftCount: 8,
          rejectedCount: 2,
          oldestPending: '2025-08-07T15:30:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions to view pending products',
  })
  async getPendingProducts(
    @Query() queryDto: PendingProductsQueryDto,
    @CurrentUser() user: UserFromToken,
  ) {
    this.logger.log(`📋 Admin ${user.id} fetching pending products`);

    const result = await this.productApprovalService.getPendingProducts({
      page: queryDto.page,
      limit: queryDto.limit,
      status: queryDto.status,
      search: queryDto.search,
      categoryId: queryDto.categoryId,
      vendorId: queryDto.vendorId,
      sortBy: queryDto.sortBy,
      sortOrder: queryDto.sortOrder,
    });

    return result;
  }

  /**
   * GET APPROVAL STATISTICS
   *
   * Returns comprehensive approval workflow statistics for admin dashboard.
   * Includes trends, performance metrics, and actionable insights.
   */
  @Get('approval-stats')
  @ApiOperation({
    summary: 'Get product approval statistics',
    description:
      'Returns comprehensive approval workflow statistics and trends for admin dashboard',
  })
  @ApiResponse({
    status: 200,
    description: 'Approval statistics retrieved successfully',
    schema: {
      example: {
        overview: {
          pending: 15,
          approved: 1245,
          rejected: 23,
          total: 1283,
        },
        trends: {
          thisWeek: {
            submitted: 25,
            approved: 18,
            rejected: 3,
          },
          lastWeek: {
            submitted: 32,
            approved: 28,
            rejected: 2,
          },
        },
        performance: {
          averageApprovalTime: '2.5 days',
          approvalRate: 94.2,
          topRejectionReasons: [
            'Missing Arabic content',
            'Poor image quality',
            'Incomplete product information',
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions to view approval statistics',
  })
  async getApprovalStatistics(@CurrentUser() user: UserFromToken) {
    this.logger.log(`📊 Admin ${user.id} fetching approval statistics`);

    const [stats, trends] = await Promise.all([
      this.productApprovalService.getApprovalStatistics(),
      this.productApprovalService.getApprovalTrends(),
    ]);

    return {
      overview: stats,
      trends: {
        thisWeek: trends.thisWeek,
        lastWeek: trends.lastWeek,
      },
      performance: trends.performance,
    };
  }
}
