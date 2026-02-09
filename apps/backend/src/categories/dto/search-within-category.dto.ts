/**
 * @file search-within-category.dto.ts
 * @description DTO for searching products within a specific category
 *
 * SPRINT: S3 Categories (SS-CAT-006)
 * FEATURE: Search within category endpoint
 *
 * This DTO validates query parameters for searching products within a category:
 * - Optional text search across product names and descriptions
 * - Pagination support with page and limit
 * - Returns only active, published, and approved products
 *
 * @author SouqSyria Development Team
 * @since 2026-02-09
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Search Within Category Query Parameters
 *
 * Used for GET /api/categories/:id/products endpoint
 * Provides flexible search with pagination for products in a specific category
 */
export class SearchWithinCategoryDto {
  /**
   * Optional search keyword for filtering products
   * Searches across product nameEn, nameAr, and descriptions
   * Case-insensitive partial matching using MySQL LIKE
   */
  @ApiProperty({
    description:
      'Search keyword for filtering products by name or description (case-insensitive)',
    required: false,
    type: String,
    example: 'damascus steel',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  search?: string;

  /**
   * Page number for pagination
   * Starts from 1 (not 0-indexed)
   * Used to calculate OFFSET in database queries
   */
  @ApiProperty({
    description: 'Page number for pagination (starts from 1)',
    required: false,
    type: Number,
    default: 1,
    minimum: 1,
    example: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  /**
   * Number of items per page
   * Maximum allowed is 100 to prevent performance issues
   * Default is 20 for optimal mobile experience
   */
  @ApiProperty({
    description: 'Number of items per page (max: 100)',
    required: false,
    type: Number,
    default: 20,
    minimum: 1,
    maximum: 100,
    example: 20,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;
}
