/**
 * @file create-recent-search.dto.ts
 * @description DTO for saving a recent search query to user history.
 *
 * Sent by the frontend when a user submits a search from the header search bar.
 * The backend deduplicates entries and updates timestamps for repeat queries.
 *
 * @swagger
 * components:
 *   schemas:
 *     CreateRecentSearchDto:
 *       type: object
 *       required:
 *         - query
 *       properties:
 *         query:
 *           type: string
 *           description: Search query text to save
 *           minLength: 1
 *           maxLength: 200
 *         categoryContext:
 *           type: string
 *           description: Category slug if search was filtered
 *         resultCount:
 *           type: number
 *           description: Number of results returned
 *
 * @author SouqSyria Development Team
 * @since 2026-02-01
 * @version 1.0.0
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Create Recent Search DTO
 *
 * Validates the request body when saving a search to user history.
 * Query text is trimmed and lowercased by the service for deduplication.
 *
 * @example
 * POST /search/recent
 * { "query": "damascus soap", "categoryContext": "beauty", "resultCount": 24 }
 */
export class CreateRecentSearchDto {
  /**
   * The search query text to save.
   * Will be trimmed and lowercased before storage.
   */
  @ApiProperty({
    description: 'Search query text to save to history',
    example: 'damascus soap',
    minLength: 1,
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  query: string;

  /**
   * Optional category context for the search.
   * Stores which category filter was active during the search.
   */
  @ApiPropertyOptional({
    description: 'Category slug if search was filtered by category',
    example: 'beauty',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  categoryContext?: string;

  /**
   * Optional result count from the search.
   * Displayed as a hint in the recent searches dropdown.
   */
  @ApiPropertyOptional({
    description: 'Number of results returned for this search',
    example: 24,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  resultCount?: number;
}
