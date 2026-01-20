/**
 * @file pending-products-query.dto.ts
 * @description DTO for querying pending products with filters
 *
 * @author SouqSyria Development Team
 * @since 2025-08-08
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsEnum,
  IsString,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for querying pending products with pagination and filters
 */
export class PendingProductsQueryDto {
  /**
   * Page number for pagination
   */
  @ApiPropertyOptional({
    description: 'Page number (starts from 1)',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  /**
   * Number of items per page
   */
  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  /**
   * Filter by approval status
   */
  @ApiPropertyOptional({
    description: 'Filter by specific approval status',
    example: 'pending',
    enum: ['draft', 'pending', 'approved', 'rejected', 'suspended', 'archived'],
  })
  @IsOptional()
  @IsEnum(['draft', 'pending', 'approved', 'rejected', 'suspended', 'archived'])
  status?:
    | 'draft'
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'suspended'
    | 'archived';

  /**
   * Sort by field
   */
  @ApiPropertyOptional({
    description: 'Field to sort by',
    example: 'createdAt',
    enum: ['createdAt', 'updatedAt', 'nameEn', 'nameAr', 'approvalStatus'],
    default: 'createdAt',
  })
  @IsOptional()
  @IsEnum(['createdAt', 'updatedAt', 'nameEn', 'nameAr', 'approvalStatus'])
  sortBy?: 'createdAt' | 'updatedAt' | 'nameEn' | 'nameAr' | 'approvalStatus';

  /**
   * Sort order
   */
  @ApiPropertyOptional({
    description: 'Sort order',
    example: 'DESC',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC';

  /**
   * Search term for product name
   */
  @ApiPropertyOptional({
    description: 'Search term to filter products by name (English or Arabic)',
    example: 'iPhone',
  })
  @IsOptional()
  @IsString()
  search?: string;

  /**
   * Filter by category ID
   */
  @ApiPropertyOptional({
    description: 'Filter products by category ID',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  categoryId?: number;

  /**
   * Filter by vendor ID
   */
  @ApiPropertyOptional({
    description: 'Filter products by vendor ID',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  vendorId?: number;
}
