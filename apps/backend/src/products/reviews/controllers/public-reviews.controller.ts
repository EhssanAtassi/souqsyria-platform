/**
 * @file public-reviews.controller.ts
 * @description Public-facing controller for product reviews
 *
 * Endpoints:
 * - GET /products/:slug/reviews - Paginated review list (public)
 * - GET /products/:slug/reviews/summary - Review summary statistics (public)
 * - POST /products/:slug/reviews - Submit new review (authenticated)
 * - POST /products/reviews/:id/helpful - Mark review as helpful (public)
 *
 * @author SouqSyria Development Team
 * @since 2026-02-16
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ReviewsService } from '../services/reviews.service';
import { CreateReviewDto } from '../dto/create-review.dto';
import { GetReviewsDto } from '../dto/get-reviews.dto';
import { Public } from '../../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';

/**
 * Public Reviews Controller
 *
 * Handles customer-facing review endpoints.
 * Most endpoints are public except review submission which requires authentication.
 *
 * IMPORTANT: Route order matters!
 * - /products/:slug/reviews/summary must come BEFORE /products/reviews/:id/helpful
 * - Parameterized routes like :id must be declared LAST
 */
@ApiTags('📝 Product Reviews')
@Controller('products')
export class PublicReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  /**
   * GET /products/:slug/reviews/summary
   * Review summary statistics endpoint
   *
   * NOTE: This MUST be defined BEFORE the :id route to avoid conflicts
   */
  @Get(':slug/reviews/summary')
  @Public()
  @ApiOperation({
    summary: 'Get review summary for a product',
    description: `
      Retrieves aggregated review statistics for a product including:
      • Average rating (1-5 stars, rounded to 1 decimal)
      • Total number of approved reviews
      • Rating distribution (count of 1-star, 2-star, 3-star, 4-star, 5-star reviews)

      Use Cases:
      • Product detail page - display overall rating
      • Product cards - show star rating badge
      • Review section header - show summary before review list
    `,
  })
  @ApiParam({
    name: 'slug',
    description: 'Product slug identifier',
    example: 'damascus-steel-chef-knife',
  })
  @ApiResponse({
    status: 200,
    description: 'Review summary retrieved successfully',
    schema: {
      example: {
        averageRating: 4.3,
        totalReviews: 42,
        distribution: {
          1: 2,
          2: 3,
          3: 8,
          4: 15,
          5: 14,
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
    schema: {
      example: {
        message: 'Product with slug "invalid-slug" not found',
        error: 'Not Found',
        statusCode: 404,
      },
    },
  })
  async getReviewSummary(@Param('slug') slug: string) {
    return await this.reviewsService.getReviewSummary(slug);
  }

  /**
   * GET /products/:slug/reviews
   * Paginated review list endpoint (public access)
   */
  @Get(':slug/reviews')
  @Public()
  @ApiOperation({
    summary: 'Get paginated reviews for a product',
    description: `
      Retrieves paginated list of approved product reviews.
      Only approved reviews are visible to public users.

      Features:
      • Pagination with page and limit controls
      • Multiple sort options (newest, highest, lowest, helpful)
      • User information included (name and avatar)
      • Verified purchase badge
      • Helpfulness vote count
      • Bilingual support (English and Arabic)

      Use Cases:
      • Product detail page - display customer reviews
      • Review carousel - show recent reviews
      • Review filtering - sort by rating or helpfulness
    `,
  })
  @ApiParam({
    name: 'slug',
    description: 'Product slug identifier',
    example: 'damascus-steel-chef-knife',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Page number (1-indexed, default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
    description: 'Items per page (default: 10, max: 50)',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['newest', 'highest', 'lowest', 'helpful'],
    example: 'newest',
    description: 'Sort order: newest (default), highest, lowest, helpful',
  })
  @ApiResponse({
    status: 200,
    description: 'Reviews retrieved successfully',
    schema: {
      example: {
        data: [
          {
            id: 123,
            rating: 5,
            titleEn: 'Excellent product quality!',
            titleAr: 'جودة منتج ممتازة!',
            bodyEn:
              'I purchased this product two weeks ago and I am very satisfied.',
            bodyAr: 'اشتريت هذا المنتج قبل أسبوعين وأنا راضٍ جدًا.',
            pros: ['Great quality', 'Fast shipping'],
            cons: ['Limited color options'],
            isVerifiedPurchase: true,
            helpfulCount: 15,
            createdAt: '2026-02-01T10:30:00.000Z',
            user: {
              id: 456,
              fullName: 'Ahmed Hassan',
              avatar: 'https://example.com/avatars/ahmed.jpg',
            },
          },
        ],
        meta: {
          total: 42,
          page: 1,
          limit: 10,
          totalPages: 5,
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  async getReviews(@Param('slug') slug: string, @Query() dto: GetReviewsDto) {
    return await this.reviewsService.getReviewsByProduct(slug, dto);
  }

  /**
   * POST /products/:slug/reviews
   * Submit new review endpoint (requires authentication)
   *
   * Rate Limit: 5 reviews per hour to prevent spam submission
   */
  @Post(':slug/reviews')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 3600000 } }) // 5 per hour
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Submit a new product review',
    description: `
      Creates a new product review from an authenticated user.
      Reviews are submitted with 'pending' status and require admin moderation before appearing publicly.

      Validation:
      • User must be authenticated
      • Rating is required (1-5 stars)
      • User cannot review the same product twice
      • Text fields are optional

      Review Status:
      • New reviews start as 'pending'
      • Admin must approve before public visibility
      • Users can see their own pending reviews

      Use Cases:
      • Product detail page - customer review form
      • Post-purchase flow - encourage review submission
      • My reviews page - view submission status
    `,
  })
  @ApiParam({
    name: 'slug',
    description: 'Product slug identifier',
    example: 'damascus-steel-chef-knife',
  })
  @ApiResponse({
    status: 201,
    description: 'Review submitted successfully (pending moderation)',
    schema: {
      example: {
        id: 789,
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
        status: 'pending',
        createdAt: '2026-02-16T15:30:00.000Z',
        updatedAt: '2026-02-16T15:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or duplicate review',
    schema: {
      example: {
        message: 'You have already submitted a review for this product',
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
    status: 404,
    description: 'Product not found',
  })
  async createReview(
    @Param('slug') slug: string,
    @Body() dto: CreateReviewDto,
    @Req() req: any,
  ) {
    const userId = req.user.id;
    return await this.reviewsService.createReview(slug, userId, dto);
  }

  /**
   * POST /products/reviews/:id/helpful
   * Mark review as helpful endpoint (public access)
   *
   * NOTE: This route uses /products/reviews/:id (not /products/:slug/reviews/:id)
   * to avoid slug/id parameter confusion
   *
   * Rate Limit: 30 votes per minute to prevent vote manipulation
   */
  @Post('reviews/:id/helpful')
  @Public()
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 per minute
  @ApiOperation({
    summary: 'Mark a review as helpful',
    description: `
      Increments the helpfulness counter for a review.
      Allows users to vote reviews as helpful without requiring authentication.

      Current Implementation:
      • No authentication required
      • Unlimited voting (future: track by user/IP to prevent duplicates)
      • Increments helpful_count by 1

      Use Cases:
      • Product detail page - "Was this review helpful?" button
      • Review sorting - sort by most helpful
      • Community engagement - highlight useful reviews
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Review ID',
    example: 123,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Review marked as helpful',
    schema: {
      example: {
        id: 123,
        helpfulCount: 16,
        message: 'Review marked as helpful',
      },
    },
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
  async markHelpful(@Param('id') id: number) {
    const review = await this.reviewsService.markHelpful(+id);
    return {
      id: review.id,
      helpfulCount: review.helpfulCount,
      message: 'Review marked as helpful',
    };
  }
}
