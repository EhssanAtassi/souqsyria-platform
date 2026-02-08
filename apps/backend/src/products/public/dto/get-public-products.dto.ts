import { IsOptional, IsInt, IsString, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Data Transfer Object for public product catalog browsing.
 *
 * Supports comprehensive filtering, pagination, and sorting for customer-facing product listings.
 * All filters are optional and can be combined for advanced product discovery.
 *
 * @example
 * // Basic pagination
 * { page: 1, limit: 20 }
 *
 * // Filter by category with price range
 * { categoryId: 5, minPrice: 100000, maxPrice: 500000, page: 1, limit: 20 }
 *
 * // Search with sorting
 * { search: "Damascus Steel", sortBy: "price_asc", page: 1, limit: 20 }
 */
export class GetPublicProductsDto {
  /**
   * Search query to filter products by name (English or Arabic).
   * Performs partial match on product names.
   *
   * @example "Damascus Steel"
   * @example "سكين"
   */
  @ApiPropertyOptional({
    description: 'Search query for product name (English or Arabic)',
    example: 'Damascus Steel',
  })
  @IsOptional()
  @IsString()
  search?: string;

  /**
   * Filter products by category ID.
   * Returns all products in the specified category.
   *
   * @example 1
   */
  @ApiPropertyOptional({
    description: 'Filter by category ID',
    example: 1,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoryId?: number;

  /**
   * Filter products by manufacturer ID.
   * Returns all products from the specified manufacturer.
   *
   * @example 2
   */
  @ApiPropertyOptional({
    description: 'Filter by manufacturer ID',
    example: 2,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  manufacturerId?: number;

  /**
   * Minimum price filter in SYP (Syrian Pounds).
   * Returns products with final price >= minPrice.
   *
   * @example 50000
   */
  @ApiPropertyOptional({
    description: 'Minimum price in SYP (inclusive)',
    example: 50000,
    minimum: 0,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minPrice?: number;

  /**
   * Maximum price filter in SYP (Syrian Pounds).
   * Returns products with final price <= maxPrice.
   *
   * @example 500000
   */
  @ApiPropertyOptional({
    description: 'Maximum price in SYP (inclusive)',
    example: 500000,
    minimum: 0,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxPrice?: number;

  /**
   * Page number for pagination (1-indexed).
   * Must be a positive integer >= 1.
   *
   * @default 1
   * @example 2
   */
  @ApiPropertyOptional({
    description: 'Page number for pagination (1-indexed)',
    example: 1,
    minimum: 1,
    default: 1,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  /**
   * Number of items per page.
   * Must be between 1 and 100 to prevent excessive data transfer.
   *
   * @default 20
   * @example 20
   */
  @ApiPropertyOptional({
    description: 'Number of items per page (max: 100)',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  /**
   * Sort order for product results.
   * - price_asc: Sort by price (lowest first)
   * - price_desc: Sort by price (highest first)
   * - newest: Sort by creation date (newest first) - DEFAULT
   * - rating: Sort by rating (highest first) - currently same as newest
   *
   * @default undefined (uses newest)
   * @example "price_asc"
   */
  @ApiPropertyOptional({
    description: 'Sort order for results',
    enum: ['price_asc', 'price_desc', 'newest', 'rating'],
    example: 'price_asc',
  })
  @IsOptional()
  @IsEnum(['price_asc', 'price_desc', 'newest', 'rating'])
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'rating';
}
