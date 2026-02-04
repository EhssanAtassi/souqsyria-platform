/**
 * @file search-suggestions-query.dto.ts
 * @description DTO for search suggestions/autocomplete query parameters.
 *
 * Used by the header search bar to fetch real-time autocomplete suggestions
 * as the user types. Supports filtering by category and language.
 *
 * @swagger
 * components:
 *   schemas:
 *     SearchSuggestionsQueryDto:
 *       type: object
 *       required:
 *         - q
 *       properties:
 *         q:
 *           type: string
 *           description: Search query text (minimum 2 characters)
 *           minLength: 2
 *           maxLength: 100
 *         category:
 *           type: string
 *           description: Optional category slug to filter suggestions
 *         language:
 *           type: string
 *           enum: [en, ar]
 *           description: Language for results
 *         limit:
 *           type: number
 *           description: Maximum number of suggestions to return
 *           default: 8
 *
 * @author SouqSyria Development Team
 * @since 2026-02-01
 * @version 1.0.0
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Search Suggestions Query DTO
 *
 * Validates query parameters for the GET /search/suggestions endpoint.
 * Designed for real-time autocomplete with minimum 2 characters.
 *
 * @example
 * GET /search/suggestions?q=damas&category=food-spices&language=en&limit=5
 */
export class SearchSuggestionsQueryDto {
  /**
   * The search query text to generate suggestions for.
   * Minimum 2 characters to reduce noise and improve relevance.
   */
  @ApiProperty({
    description: 'Search query text (minimum 2 characters)',
    example: 'damas',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  q: string;

  /**
   * Optional category slug to narrow down suggestions.
   * When provided, only products/categories within this category are suggested.
   */
  @ApiPropertyOptional({
    description: 'Category slug to filter suggestions',
    example: 'food-spices',
  })
  @IsOptional()
  @IsString()
  category?: string;

  /**
   * Language preference for suggestion results.
   * Determines which name fields (nameEn/nameAr) are returned.
   * Defaults to 'en' if not specified.
   */
  @ApiPropertyOptional({
    description: 'Language for results (en or ar)',
    enum: ['en', 'ar'],
    default: 'en',
    example: 'en',
  })
  @IsOptional()
  @IsEnum(['en', 'ar'])
  language?: 'en' | 'ar' = 'en';

  /**
   * Maximum number of suggestions to return.
   * Capped at 15 to prevent excessive payload size.
   * Default: 8 (matches prototype dropdown height).
   */
  @ApiPropertyOptional({
    description: 'Maximum number of suggestions (1-15)',
    default: 8,
    minimum: 1,
    maximum: 15,
    example: 8,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(15)
  @Type(() => Number)
  limit?: number = 8;
}
