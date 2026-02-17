/**
 * @file get-reviews.dto.ts
 * @description DTO for filtering and paginating product reviews
 *
 * Supports:
 * - Pagination (page and limit)
 * - Sorting by newest, highest rating, lowest rating, or most helpful
 *
 * @author SouqSyria Development Team
 * @since 2026-02-16
 */

import { IsOptional, IsInt, Min, Max, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * Get Reviews Query DTO
 *
 * Query parameters for fetching paginated product reviews with sorting options
 */
export class GetReviewsDto {
  /**
   * Page number (1-indexed)
   * Default: 1
   */
  @ApiProperty({
    description: 'Page number for pagination (1-indexed)',
    example: 1,
    minimum: 1,
    required: false,
    default: 1,
  })
  @IsOptional()
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  @Type(() => Number)
  page?: number = 1;

  /**
   * Number of items per page
   * Default: 10, Maximum: 50
   */
  @ApiProperty({
    description: 'Number of reviews per page',
    example: 10,
    minimum: 1,
    maximum: 50,
    required: false,
    default: 10,
  })
  @IsOptional()
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(50, { message: 'Limit cannot exceed 50' })
  @Type(() => Number)
  limit?: number = 10;

  /**
   * Sort order for reviews
   * - newest: Most recent reviews first (default)
   * - highest: Highest rated reviews first (5 stars → 1 star)
   * - lowest: Lowest rated reviews first (1 star → 5 stars)
   * - helpful: Most helpful reviews first (by helpful_count)
   */
  @ApiProperty({
    description: 'Sort order for reviews',
    enum: ['newest', 'highest', 'lowest', 'helpful'],
    example: 'newest',
    required: false,
    default: 'newest',
  })
  @IsOptional()
  @IsIn(['newest', 'highest', 'lowest', 'helpful'], {
    message: 'Sort must be one of: newest, highest, lowest, helpful',
  })
  sortBy?: 'newest' | 'highest' | 'lowest' | 'helpful' = 'newest';
}
