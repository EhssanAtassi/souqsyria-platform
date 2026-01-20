/**
 * @file pagination.dto.ts
 * @description Common pagination DTO for API responses
 *
 * Provides standardized pagination parameters for API endpoints
 *
 * @author SouqSyria Development Team
 * @since 2025-08-10
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsPositive, Min, Max } from 'class-validator';

/**
 * Pagination DTO for query parameters
 */
export class PaginationDto {
  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    minimum: 1,
    default: 1,
    example: 1,
  })
  @Type(() => Number)
  @IsOptional()
  @IsPositive()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    minimum: 1,
    maximum: 100,
    default: 10,
    example: 10,
  })
  @Type(() => Number)
  @IsOptional()
  @IsPositive()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

/**
 * Pagination metadata for responses
 */
export class PaginationMetadata {
  @ApiPropertyOptional({ description: 'Current page number', example: 1 })
  page: number;

  @ApiPropertyOptional({ description: 'Items per page', example: 10 })
  limit: number;

  @ApiPropertyOptional({ description: 'Total number of items', example: 100 })
  totalItems: number;

  @ApiPropertyOptional({ description: 'Total number of pages', example: 10 })
  totalPages: number;

  @ApiPropertyOptional({
    description: 'Whether there is a next page',
    example: true,
  })
  hasNextPage: boolean;

  @ApiPropertyOptional({
    description: 'Whether there is a previous page',
    example: false,
  })
  hasPreviousPage: boolean;
}

/**
 * Generic paginated response
 */
export class PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMetadata;
}

/**
 * Helper function to create pagination metadata
 */
export function createPaginationMetadata(
  page: number,
  limit: number,
  totalItems: number,
): PaginationMetadata {
  const totalPages = Math.ceil(totalItems / limit);

  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}
