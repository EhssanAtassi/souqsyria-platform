/**
 * @file review.service.ts
 * @description Service for managing product reviews
 * Handles fetching, submitting, and marking reviews as helpful
 *
 * @swagger
 * tags:
 *   - name: ReviewService
 *     description: Product review operations
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  ProductReview,
  ReviewSummary,
  CreateReviewDto,
  ReviewListResponse,
} from '../models/review.interface';

/**
 * @description Service for product review operations
 * Provides methods to fetch reviews, submit new reviews, and mark reviews as helpful
 *
 * @swagger
 * components:
 *   schemas:
 *     ReviewService:
 *       type: object
 *       description: Service for product review management
 */
@Injectable({ providedIn: 'root' })
export class ReviewService {
  /** @description HTTP client for API requests */
  private readonly http = inject(HttpClient);

  /** @description Base API URL for product endpoints */
  private readonly apiUrl = environment.productApiUrl;

  /**
   * @description Fetches paginated reviews for a product
   * Supports sorting by newest, highest rating, lowest rating, and most helpful
   *
   * @param slug - Product slug identifier
   * @param page - Page number (1-indexed)
   * @param limit - Number of reviews per page
   * @param sortBy - Sort order: 'newest' | 'highest_rating' | 'lowest_rating' | 'most_helpful'
   * @returns Observable of paginated review list
   *
   * @swagger
   * /products/{slug}/reviews:
   *   get:
   *     summary: Get paginated product reviews
   *     parameters:
   *       - name: slug
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *       - name: page
   *         in: query
   *         schema:
   *           type: integer
   *           default: 1
   *       - name: limit
   *         in: query
   *         schema:
   *           type: integer
   *           default: 10
   *       - name: sortBy
   *         in: query
   *         schema:
   *           type: string
   *           enum: [newest, highest_rating, lowest_rating, most_helpful]
   *     responses:
   *       200:
   *         description: Paginated review list
   */
  getReviews(
    slug: string,
    page = 1,
    limit = 10,
    sortBy: 'newest' | 'highest_rating' | 'lowest_rating' | 'most_helpful' = 'newest'
  ): Observable<ReviewListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('sortBy', sortBy);

    return this.http.get<ReviewListResponse>(
      `${this.apiUrl}/${slug}/reviews`,
      { params }
    );
  }

  /**
   * @description Fetches aggregated review statistics for a product
   * Returns average rating, total count, and star distribution
   *
   * @param slug - Product slug identifier
   * @returns Observable of review summary statistics
   *
   * @swagger
   * /products/{slug}/reviews/summary:
   *   get:
   *     summary: Get review summary statistics
   *     parameters:
   *       - name: slug
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Review summary with averages and distribution
   */
  getReviewSummary(slug: string): Observable<ReviewSummary> {
    return this.http.get<ReviewSummary>(
      `${this.apiUrl}/${slug}/reviews/summary`
    );
  }

  /**
   * @description Submits a new product review
   * Requires authentication. Review will be pending approval.
   *
   * @param slug - Product slug identifier
   * @param dto - Review data (rating, titles, bodies, pros/cons)
   * @returns Observable of created review
   *
   * @swagger
   * /products/{slug}/reviews:
   *   post:
   *     summary: Submit a new product review
   *     parameters:
   *       - name: slug
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateReviewDto'
   *     responses:
   *       201:
   *         description: Review submitted successfully
   *       401:
   *         description: Unauthorized - login required
   */
  submitReview(slug: string, dto: CreateReviewDto): Observable<ProductReview> {
    return this.http.post<ProductReview>(
      `${this.apiUrl}/${slug}/reviews`,
      dto
    );
  }

  /**
   * @description Marks a review as helpful
   * Increments the helpful count for the specified review
   *
   * @param reviewId - Review identifier
   * @returns Observable with updated helpful count
   *
   * @swagger
   * /products/reviews/{id}/helpful:
   *   post:
   *     summary: Mark review as helpful
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Helpful count updated
   */
  markHelpful(reviewId: number): Observable<{ helpfulCount: number }> {
    return this.http.post<{ helpfulCount: number }>(
      `${this.apiUrl}/reviews/${reviewId}/helpful`,
      {}
    );
  }
}
