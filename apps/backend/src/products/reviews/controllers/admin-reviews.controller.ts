/**
 * @file admin-reviews.controller.ts
 * @description Admin controller for review moderation
 *
 * Endpoints:
 * - PATCH /admin/reviews/:id/approve - Approve pending review
 * - PATCH /admin/reviews/:id/reject - Reject pending review
 *
 * All endpoints require admin authentication and permissions.
 *
 * @author SouqSyria Development Team
 * @since 2026-02-16
 */

import { Controller, Patch, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ReviewsService } from '../services/reviews.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../access-control/guards/permissions.guard';

/**
 * Admin Reviews Controller
 *
 * Handles review moderation workflow for administrators.
 * All endpoints require authentication and admin permissions.
 *
 * Moderation Workflow:
 * 1. User submits review (status: pending)
 * 2. Admin reviews content
 * 3. Admin approves (public visibility) or rejects (hidden)
 */
@ApiTags('🔐 Admin - Review Moderation')
@Controller('admin/reviews')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class AdminReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  /**
   * PATCH /admin/reviews/:id/approve
   * Approve a pending review
   */
  @Patch(':id/approve')
  @ApiOperation({
    summary: 'Approve a pending product review',
    description: `
      Approves a pending review, making it visible to public users.
      Only reviews with 'pending' status can be approved.

      Workflow:
      • Admin reviews pending review content
      • Admin approves if content meets quality standards
      • Review status changes from 'pending' to 'approved'
      • Review becomes visible on product page
      • Product rating/summary statistics are updated

      Permissions Required:
      • Admin role
      • review:moderate permission (or equivalent)

      Use Cases:
      • Admin moderation dashboard
      • Bulk review approval
      • Manual content moderation
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Review ID to approve',
    example: 123,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Review approved successfully',
    schema: {
      example: {
        id: 123,
        productId: 1,
        userId: 456,
        rating: 5,
        titleEn: 'Excellent product quality!',
        titleAr: 'جودة منتج ممتازة!',
        bodyEn:
          'I purchased this product two weeks ago and I am very satisfied.',
        bodyAr: 'اشتريت هذا المنتج قبل أسبوعين وأنا راضٍ جدًا.',
        pros: ['Great quality', 'Fast shipping'],
        cons: ['Limited color options'],
        isVerifiedPurchase: false,
        helpfulCount: 0,
        status: 'approved',
        createdAt: '2026-02-16T15:30:00.000Z',
        updatedAt: '2026-02-16T16:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Review is not in pending status',
    schema: {
      example: {
        message:
          'Review is already approved. Only pending reviews can be moderated.',
        error: 'Bad Request',
        statusCode: 400,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - authentication required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Review not found',
    schema: {
      example: {
        message: 'Review with ID 123 not found',
        error: 'Not Found',
        statusCode: 404,
      },
    },
  })
  async approveReview(@Param('id') id: number) {
    return await this.reviewsService.moderateReview(+id, 'approved');
  }

  /**
   * PATCH /admin/reviews/:id/reject
   * Reject a pending review
   */
  @Patch(':id/reject')
  @ApiOperation({
    summary: 'Reject a pending product review',
    description: `
      Rejects a pending review, preventing it from being displayed publicly.
      Only reviews with 'pending' status can be rejected.

      Workflow:
      • Admin reviews pending review content
      • Admin rejects if content violates policies or quality standards
      • Review status changes from 'pending' to 'rejected'
      • Review remains hidden from product page
      • User can see their rejected review in their account

      Common Rejection Reasons:
      • Offensive or inappropriate language
      • Spam or promotional content
      • Off-topic or irrelevant review
      • Duplicate submission
      • Violation of review guidelines

      Permissions Required:
      • Admin role
      • review:moderate permission (or equivalent)

      Use Cases:
      • Content moderation
      • Policy enforcement
      • Quality control
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Review ID to reject',
    example: 124,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Review rejected successfully',
    schema: {
      example: {
        id: 124,
        productId: 1,
        userId: 789,
        rating: 1,
        titleEn: 'Spam content',
        titleAr: null,
        bodyEn: 'Check out my website for better products...',
        bodyAr: null,
        pros: null,
        cons: null,
        isVerifiedPurchase: false,
        helpfulCount: 0,
        status: 'rejected',
        createdAt: '2026-02-16T14:00:00.000Z',
        updatedAt: '2026-02-16T16:05:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Review is not in pending status',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - authentication required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Review not found',
  })
  async rejectReview(@Param('id') id: number) {
    return await this.reviewsService.moderateReview(+id, 'rejected');
  }
}
