/**
 * @file review.interface.ts
 * @description Product review interfaces for review functionality
 * Maps to backend review API responses
 *
 * @swagger
 * components:
 *   schemas:
 *     ProductReview:
 *       type: object
 *       description: Individual product review with user information
 *     ReviewSummary:
 *       type: object
 *       description: Aggregated review statistics for a product
 *     CreateReviewDto:
 *       type: object
 *       description: Data transfer object for submitting a new review
 */

/**
 * @description Individual product review with user information
 * Includes rating, review text, pros/cons, and helpful count
 */
export interface ProductReview {
  /** @description Unique review identifier */
  id: number;

  /** @description Rating value from 1-5 stars */
  rating: number;

  /** @description Optional review title in English */
  titleEn?: string;

  /** @description Optional review title in Arabic */
  titleAr?: string;

  /** @description Optional review body in English */
  bodyEn?: string;

  /** @description Optional review body in Arabic */
  bodyAr?: string;

  /** @description List of product pros/advantages */
  pros?: string[];

  /** @description List of product cons/disadvantages */
  cons?: string[];

  /** @description Whether this is a verified purchase review */
  isVerifiedPurchase: boolean;

  /** @description Number of users who found this review helpful */
  helpfulCount: number;

  /** @description ISO timestamp of review creation */
  createdAt: string;

  /** @description Review author information */
  user: {
    /** @description User identifier */
    id: number;
    /** @description User's full name */
    fullName: string;
    /** @description Optional user avatar URL */
    avatar?: string;
  };
}

/**
 * @description Aggregated review statistics for a product
 * Contains average rating, total count, and distribution across star levels
 */
export interface ReviewSummary {
  /** @description Average rating from 0-5 (decimal value) */
  averageRating: number;

  /** @description Total number of approved reviews */
  totalReviews: number;

  /** @description Count of reviews per star level (1-5) */
  distribution: Record<number, number>;
}

/**
 * @description Data transfer object for submitting a new review
 * Required fields: rating. Optional: titles, bodies, pros/cons in both languages
 */
export interface CreateReviewDto {
  /** @description Rating value from 1-5 stars (required) */
  rating: number;

  /** @description Optional review title in English */
  titleEn?: string;

  /** @description Optional review title in Arabic */
  titleAr?: string;

  /** @description Optional review body in English */
  bodyEn?: string;

  /** @description Optional review body in Arabic */
  bodyAr?: string;

  /** @description Optional list of product pros */
  pros?: string[];

  /** @description Optional list of product cons */
  cons?: string[];
}

/**
 * @description Paginated list of reviews with metadata
 * Used by the review list endpoint
 */
export interface ReviewListResponse {
  /** @description Array of product reviews */
  data: ProductReview[];

  /** @description Pagination metadata */
  meta: {
    /** @description Total number of reviews matching the query */
    total: number;
    /** @description Current page number (1-indexed) */
    page: number;
    /** @description Number of reviews per page */
    limit: number;
    /** @description Total number of pages */
    totalPages: number;
  };
}
