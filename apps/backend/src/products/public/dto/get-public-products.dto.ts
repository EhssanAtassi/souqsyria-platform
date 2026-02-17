import {
  IsOptional,
  IsInt,
  IsString,
  IsEnum,
  Min,
  Max,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  Validate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Custom validator to ensure minPrice is less than or equal to maxPrice.
 * Validates cross-field constraint when both price bounds are provided.
 *
 * @class IsPriceRangeValid
 * @implements {ValidatorConstraintInterface}
 */
@ValidatorConstraint({ name: 'isPriceRangeValid', async: false })
export class IsPriceRangeValid implements ValidatorConstraintInterface {
  /**
   * Validates that minPrice <= maxPrice when both are provided.
   *
   * @param {any} _ - The value being validated (unused for class-level validation)
   * @param {ValidationArguments} args - Validation arguments containing the DTO object
   * @returns {boolean} True if validation passes, false otherwise
   */
  validate(_: any, args: ValidationArguments): boolean {
    const obj = args.object as GetPublicProductsDto;
    // Only validate if both minPrice and maxPrice are provided
    if (obj.minPrice !== undefined && obj.maxPrice !== undefined) {
      return obj.minPrice <= obj.maxPrice;
    }
    // If only one or neither is provided, validation passes
    return true;
  }

  /**
   * Returns the error message when validation fails.
   *
   * @returns {string} The error message
   */
  defaultMessage(): string {
    return 'minPrice must be less than or equal to maxPrice';
  }
}

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
   * Filter products by multiple brand IDs.
   * Comma-separated list of brand IDs (e.g., "1,2,5").
   * Returns products matching any of the specified brands.
   *
   * @example "1,2,5"
   */
  @ApiPropertyOptional({
    description: 'Comma-separated brand IDs to filter by',
    example: '1,2,5',
    type: String,
  })
  @IsOptional()
  @IsString()
  brandIds?: string;

  /**
   * Minimum average rating filter (1-5 stars).
   * Returns products with average rating >= minRating.
   *
   * @example 4
   */
  @ApiPropertyOptional({
    description: 'Minimum average rating filter (1-5)',
    example: 4,
    minimum: 1,
    maximum: 5,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  minRating?: number;

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
   * Must be greater than or equal to minPrice when both are provided.
   *
   * @example 500000
   */
  @ApiPropertyOptional({
    description:
      'Maximum price in SYP (inclusive). Must be >= minPrice when both are provided.',
    example: 500000,
    minimum: 0,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Validate(IsPriceRangeValid)
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
   * - popularity: Sort by sales count (best sellers first)
   *
   * @default undefined (uses newest)
   * @example "price_asc"
   */
  @ApiPropertyOptional({
    description: 'Sort order for results',
    enum: ['price_asc', 'price_desc', 'newest', 'rating', 'popularity'],
    example: 'price_asc',
  })
  @IsOptional()
  @IsEnum(['price_asc', 'price_desc', 'newest', 'rating', 'popularity'])
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'rating' | 'popularity';
}
