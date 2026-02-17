/**
 * @file reviews.service.ts
 * @description Service layer for product reviews management
 *
 * Features:
 * - Paginated review listing with sorting
 * - Review summary with average rating and distribution
 * - Review submission with auto-pending status
 * - Helpfulness voting
 * - Admin moderation (approve/reject)
 * - Optimized queries with aggregations
 *
 * @author SouqSyria Development Team
 * @since 2026-02-16
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductReviewEntity } from '../entities/product-review.entity';
import { ProductEntity } from '../../entities/product.entity';
import { CreateReviewDto } from '../dto/create-review.dto';
import { GetReviewsDto } from '../dto/get-reviews.dto';

/**
 * Review Summary Response Interface
 *
 * Provides aggregated review statistics for a product
 */
export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

/**
 * Reviews Service
 *
 * Handles all review-related business logic including:
 * - Public review browsing with pagination and sorting
 * - Review summary calculations with rating distribution
 * - Review submission with validation
 * - Helpfulness voting
 * - Admin moderation workflow
 */
@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(
    @InjectRepository(ProductReviewEntity)
    private readonly reviewRepo: Repository<ProductReviewEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepo: Repository<ProductEntity>,
  ) {}

  /**
   * GET REVIEWS BY PRODUCT
   *
   * Retrieves paginated list of approved reviews for a specific product.
   * Only approved reviews are returned to public users.
   *
   * @param productSlug - Product slug identifier
   * @param dto - Pagination and sorting options
   * @returns Paginated review list with user information
   */
  async getReviewsByProduct(productSlug: string, dto: GetReviewsDto) {
    this.logger.log(
      `📝 Getting reviews for product: ${productSlug} (page: ${dto.page}, limit: ${dto.limit}, sort: ${dto.sortBy})`,
    );

    // Resolve product by slug
    const product = await this.productRepo.findOne({
      where: { slug: productSlug },
      select: ['id', 'slug', 'nameEn', 'nameAr'],
    });

    if (!product) {
      throw new NotFoundException(
        `Product with slug "${productSlug}" not found`,
      );
    }

    const page = dto.page || 1;
    const limit = Math.min(dto.limit || 10, 50);
    const skip = (page - 1) * limit;

    // Build query for approved reviews only
    const query = this.reviewRepo
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.user', 'user')
      .where('review.productId = :productId', { productId: product.id })
      .andWhere('review.status = :status', { status: 'approved' });

    // Apply sorting
    switch (dto.sortBy) {
      case 'highest':
        query.orderBy('review.rating', 'DESC');
        query.addOrderBy('review.createdAt', 'DESC');
        break;
      case 'lowest':
        query.orderBy('review.rating', 'ASC');
        query.addOrderBy('review.createdAt', 'DESC');
        break;
      case 'helpful':
        query.orderBy('review.helpfulCount', 'DESC');
        query.addOrderBy('review.createdAt', 'DESC');
        break;
      case 'newest':
      default:
        query.orderBy('review.createdAt', 'DESC');
        break;
    }

    // Execute with pagination
    const [reviews, total] = await query
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    this.logger.log(
      `✅ Found ${total} approved reviews for product ${productSlug}`,
    );

    return {
      data: reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        titleEn: review.titleEn,
        titleAr: review.titleAr,
        bodyEn: review.bodyEn,
        bodyAr: review.bodyAr,
        pros: review.pros,
        cons: review.cons,
        isVerifiedPurchase: review.isVerifiedPurchase,
        helpfulCount: review.helpfulCount,
        createdAt: review.createdAt,
        user: {
          id: review.user.id,
          fullName: review.user.fullName,
          avatar: review.user.avatar,
        },
      })),
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * GET REVIEW SUMMARY
   *
   * Calculates aggregate review statistics for a product including:
   * - Average rating (rounded to 1 decimal place)
   * - Total number of approved reviews
   * - Distribution of reviews across 1-5 stars
   *
   * Uses raw SQL aggregation for optimal performance.
   *
   * @param productSlug - Product slug identifier
   * @returns Review summary with average rating and distribution
   */
  async getReviewSummary(productSlug: string): Promise<ReviewSummary> {
    this.logger.log(
      `📊 Calculating review summary for product: ${productSlug}`,
    );

    // Resolve product by slug
    const product = await this.productRepo.findOne({
      where: { slug: productSlug },
      select: ['id'],
    });

    if (!product) {
      throw new NotFoundException(
        `Product with slug "${productSlug}" not found`,
      );
    }

    // Get total reviews and average rating using aggregation
    const stats = await this.reviewRepo
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'avgRating')
      .addSelect('COUNT(*)', 'totalReviews')
      .where('review.productId = :productId', { productId: product.id })
      .andWhere('review.status = :status', { status: 'approved' })
      .getRawOne();

    // Get rating distribution (count of reviews per star rating)
    const distribution = await this.reviewRepo
      .createQueryBuilder('review')
      .select('review.rating', 'rating')
      .addSelect('COUNT(*)', 'count')
      .where('review.productId = :productId', { productId: product.id })
      .andWhere('review.status = :status', { status: 'approved' })
      .groupBy('review.rating')
      .getRawMany();

    // Initialize distribution object with zeros
    const distributionMap: {
      1: number;
      2: number;
      3: number;
      4: number;
      5: number;
    } = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    // Populate distribution from query results
    distribution.forEach((row) => {
      const rating = row.rating as 1 | 2 | 3 | 4 | 5;
      distributionMap[rating] = parseInt(row.count, 10);
    });

    const averageRating = stats.avgRating
      ? Math.round(parseFloat(stats.avgRating) * 10) / 10
      : 0;
    const totalReviews = parseInt(stats.totalReviews, 10) || 0;

    this.logger.log(
      `✅ Review summary: ${totalReviews} reviews, average ${averageRating} stars`,
    );

    return {
      averageRating,
      totalReviews,
      distribution: distributionMap,
    };
  }

  /**
   * CREATE REVIEW
   *
   * Submits a new product review from an authenticated user.
   * Reviews are created with 'pending' status awaiting moderation.
   *
   * Validation:
   * - Product must exist
   * - User cannot review the same product twice
   * - Rating must be 1-5 (enforced by DTO)
   *
   * @param productSlug - Product slug identifier
   * @param userId - ID of authenticated user submitting review
   * @param dto - Review content and rating
   * @returns Newly created review entity
   */
  async createReview(
    productSlug: string,
    userId: number,
    dto: CreateReviewDto,
  ): Promise<ProductReviewEntity> {
    this.logger.log(
      `📝 Creating review for product: ${productSlug}, user: ${userId}, rating: ${dto.rating}`,
    );

    // Resolve product by slug
    const product = await this.productRepo.findOne({
      where: { slug: productSlug },
      select: ['id', 'nameEn', 'nameAr'],
    });

    if (!product) {
      throw new NotFoundException(
        `Product with slug "${productSlug}" not found`,
      );
    }

    // Check if user already reviewed this product
    const existingReview = await this.reviewRepo.findOne({
      where: {
        productId: product.id,
        userId: userId,
      },
    });

    if (existingReview) {
      throw new BadRequestException(
        'You have already submitted a review for this product',
      );
    }

    // TODO: Check if user has purchased this product to set isVerifiedPurchase
    // This requires integration with the orders module
    // For now, default to false
    const isVerifiedPurchase = false;

    // Create new review with pending status
    const review = this.reviewRepo.create({
      productId: product.id,
      userId: userId,
      rating: dto.rating,
      titleEn: dto.titleEn,
      titleAr: dto.titleAr,
      bodyEn: dto.bodyEn,
      bodyAr: dto.bodyAr,
      pros: dto.pros,
      cons: dto.cons,
      isVerifiedPurchase: isVerifiedPurchase,
      status: 'pending',
      helpfulCount: 0,
    });

    await this.reviewRepo.save(review);

    this.logger.log(
      `✅ Review created successfully (ID: ${review.id}, status: pending)`,
    );

    return review;
  }

  /**
   * MARK HELPFUL
   *
   * Increments the helpfulness counter for a review.
   * This allows users to vote reviews as helpful without authentication.
   *
   * Security:
   * - Rate limiting enforced at controller level (30 votes/minute via @Throttle decorator)
   * - Current MVP implementation allows voting without de-duplication
   *
   * TODO: Future enhancement - implement IP-based or user-based de-duplication
   * Options for Phase 2:
   * 1. Track votes in review_helpful_votes table (reviewId, userId?, ipAddress, timestamp)
   * 2. Use Redis cache for IP-based tracking (key: `review:${reviewId}:vote:${ip}`, TTL: 24h)
   * 3. For authenticated users, track in votes table with userId
   *
   * @param reviewId - Review ID to mark as helpful
   * @returns Updated review entity
   */
  async markHelpful(reviewId: number): Promise<ProductReviewEntity> {
    this.logger.log(`👍 Marking review ${reviewId} as helpful`);

    const review = await this.reviewRepo.findOne({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException(`Review with ID ${reviewId} not found`);
    }

    // TODO: Check for duplicate votes when de-duplication is implemented
    // Example: const hasVoted = await this.checkVote(reviewId, ipAddress);
    // if (hasVoted) throw new BadRequestException('You have already voted on this review');

    // Increment helpful count
    review.helpfulCount += 1;
    await this.reviewRepo.save(review);

    this.logger.log(
      `✅ Review ${reviewId} marked as helpful (total: ${review.helpfulCount})`,
    );

    return review;
  }

  /**
   * MODERATE REVIEW (Admin Only)
   *
   * Approves or rejects a pending review.
   * Only reviews in 'pending' status can be moderated.
   *
   * @param reviewId - Review ID to moderate
   * @param status - New status ('approved' or 'rejected')
   * @returns Updated review entity
   */
  async moderateReview(
    reviewId: number,
    status: 'approved' | 'rejected',
  ): Promise<ProductReviewEntity> {
    this.logger.log(`🔍 Moderating review ${reviewId} → ${status}`);

    const review = await this.reviewRepo.findOne({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException(`Review with ID ${reviewId} not found`);
    }

    if (review.status !== 'pending') {
      throw new BadRequestException(
        `Review is already ${review.status}. Only pending reviews can be moderated.`,
      );
    }

    // Update review status
    review.status = status;
    await this.reviewRepo.save(review);

    this.logger.log(`✅ Review ${reviewId} status updated to ${status}`);

    return review;
  }
}
