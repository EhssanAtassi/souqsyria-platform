/**
 * @file recent-search-query.dto.ts
 * @description DTO for querying recent search history with pagination.
 *
 * Used by the header search bar to retrieve the user's recent searches
 * for display in the autocomplete dropdown.
 *
 * @swagger
 * components:
 *   schemas:
 *     RecentSearchQueryDto:
 *       type: object
 *       properties:
 *         limit:
 *           type: number
 *           description: Maximum number of recent searches to return
 *           default: 5
 *         language:
 *           type: string
 *           enum: [en, ar]
 *           description: Language preference
 *
 * @author SouqSyria Development Team
 * @since 2026-02-01
 * @version 1.0.0
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Recent Search Query DTO
 *
 * Validates query parameters for GET /search/recent endpoint.
 * Returns most recent searches first, limited by the limit parameter.
 *
 * @example
 * GET /search/recent?limit=5&language=ar
 */
export class RecentSearchQueryDto {
  /**
   * Maximum number of recent searches to return.
   * Default: 5 (matches prototype dropdown height).
   * Maximum: 20 (storage limit per user).
   */
  @ApiPropertyOptional({
    description: 'Maximum number of recent searches to return (1-20)',
    default: 5,
    minimum: 1,
    maximum: 20,
    example: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  @Type(() => Number)
  limit?: number = 5;

  /**
   * Language preference for UI labels.
   * Doesn't filter results (queries are stored in original language),
   * but may be used by the frontend for display formatting.
   */
  @ApiPropertyOptional({
    description: 'Language preference for display',
    enum: ['en', 'ar'],
    default: 'en',
    example: 'en',
  })
  @IsOptional()
  @IsEnum(['en', 'ar'])
  language?: 'en' | 'ar' = 'en';
}
