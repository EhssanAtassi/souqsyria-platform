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
import { IsString, IsOptional, IsInt, Min, Max, IsEnum, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Product sort order options for category search
 *
 * Supported sorting strategies:
 * - newest: Recently added products first (default)
 * - price_asc: Lowest price first
 * - price_desc: Highest price first
 * - popularity: Most viewed products first
 * - rating: Highest rated products first
 */
export enum ProductSortBy {
  NEWEST = 'newest',
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  POPULARITY = 'popularity',
  RATING = 'rating',
}

/**
 * Search Within Category Query Parameters
 *
 * Used for GET /api/categories/:id/products endpoint
 * Provides flexible search with pagination, sorting, and price filtering for products in a specific category
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

  /**
   * Sort order for product results
   * Controls the order in which products are returned
   *
   * Options:
   * - newest: Most recently added products first (createdAt DESC)
   * - price_asc: Lowest price first (basePrice ASC)
   * - price_desc: Highest price first (basePrice DESC)
   * - popularity: Most viewed products first (viewCount DESC)
   * - rating: Highest rated products first (averageRating DESC)
   */
  @ApiProperty({
    description: 'Sort order for product results',
    required: false,
    enum: ProductSortBy,
    default: ProductSortBy.NEWEST,
    example: ProductSortBy.PRICE_ASC,
    enumName: 'ProductSortBy',
  })
  @IsEnum(ProductSortBy)
  @IsOptional()
  sortBy?: ProductSortBy = ProductSortBy.NEWEST;

  /**
   * Minimum price filter (inclusive)
   * Filters products with basePrice >= minPrice
   * Must be greater than or equal to 0
   * If provided with maxPrice, must be <= maxPrice
   */
  @ApiProperty({
    description: 'Minimum price filter in SYP (inclusive)',
    required: false,
    type: Number,
    minimum: 0,
    example: 10000,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  minPrice?: number;

  /**
   * Maximum price filter (inclusive)
   * Filters products with basePrice <= maxPrice
   * Must be greater than or equal to 0
   * If provided with minPrice, must be >= minPrice
   */
  @ApiProperty({
    description: 'Maximum price filter in SYP (inclusive)',
    required: false,
    type: Number,
    minimum: 0,
    example: 50000,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxPrice?: number;
}
