/**
 * @file query-hero-banners.dto.ts
 * @description DTOs for querying and filtering hero banners
 *
 * @swagger
 * components:
 *   schemas:
 *     QueryHeroBannersDto:
 *       type: object
 *       description: Query parameters for filtering hero banners
 *
 * @author SouqSyria Development Team
 * @since 2025-10-07
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsEnum,
  IsBoolean,
  IsInt,
  Min,
  Max,
  IsDateString,
  IsString,
  IsArray,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

/**
 * Query Hero Banners DTO
 *
 * Supports filtering, sorting, and pagination
 */
export class QueryHeroBannersDto {
  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by approval status',
    enum: ['draft', 'pending', 'approved', 'rejected', 'suspended', 'archived'],
    example: 'approved',
  })
  @IsEnum(['draft', 'pending', 'approved', 'rejected', 'suspended', 'archived'])
  @IsOptional()
  approvalStatus?:
    | 'draft'
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'suspended'
    | 'archived';

  @ApiPropertyOptional({
    description: 'Filter by banner type',
    enum: [
      'product_spotlight',
      'seasonal',
      'flash_sale',
      'brand_story',
      'cultural',
    ],
    example: 'product_spotlight',
  })
  @IsEnum([
    'product_spotlight',
    'seasonal',
    'flash_sale',
    'brand_story',
    'cultural',
  ])
  @IsOptional()
  type?:
    | 'product_spotlight'
    | 'seasonal'
    | 'flash_sale'
    | 'brand_story'
    | 'cultural';

  @ApiPropertyOptional({
    description: 'Filter banners active at this date (ISO 8601)',
    example: '2024-01-15T10:30:00.000Z',
  })
  @IsDateString()
  @IsOptional()
  activeAt?: Date;

  @ApiPropertyOptional({
    description: 'Filter by Syrian region',
    example: 'damascus',
  })
  @IsString()
  @IsOptional()
  syrianRegion?: string;

  @ApiPropertyOptional({
    description: 'Filter by UNESCO recognition',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  unescoRecognition?: boolean;

  @ApiPropertyOptional({
    description: 'Search in name, headline, or tags',
    example: 'damascus steel',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by tags (comma-separated)',
    example: 'damascus-steel,heritage',
  })
  @IsString()
  @IsOptional()
  tags?: string;

  @ApiPropertyOptional({
    description: 'Minimum priority',
    example: 5,
    minimum: 1,
  })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  minPriority?: number;

  @ApiPropertyOptional({
    description: 'Maximum priority',
    example: 10,
    maximum: 100,
  })
  @IsInt()
  @IsOptional()
  @Max(100)
  @Type(() => Number)
  maxPriority?: number;

  @ApiPropertyOptional({
    description: 'Sort field',
    enum: [
      'priority',
      'scheduleStart',
      'scheduleEnd',
      'impressions',
      'clicks',
      'ctr',
      'createdAt',
      'updatedAt',
    ],
    example: 'priority',
    default: 'priority',
  })
  @IsEnum([
    'priority',
    'scheduleStart',
    'scheduleEnd',
    'impressions',
    'clicks',
    'ctr',
    'createdAt',
    'updatedAt',
  ])
  @IsOptional()
  sortBy?:
    | 'priority'
    | 'scheduleStart'
    | 'scheduleEnd'
    | 'impressions'
    | 'clicks'
    | 'ctr'
    | 'createdAt'
    | 'updatedAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    example: 'DESC',
    default: 'DESC',
  })
  @IsEnum(['ASC', 'DESC'])
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC';

  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Include soft-deleted records',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  includeDeleted?: boolean;
}

/**
 * Paginated Response Metadata
 */
export class PaginationMetaDto {
  @ApiPropertyOptional({ description: 'Current page number' })
  currentPage: number;

  @ApiPropertyOptional({ description: 'Items per page' })
  itemsPerPage: number;

  @ApiPropertyOptional({ description: 'Total items count' })
  totalItems: number;

  @ApiPropertyOptional({ description: 'Total pages count' })
  totalPages: number;

  @ApiPropertyOptional({ description: 'Has next page' })
  hasNextPage: boolean;

  @ApiPropertyOptional({ description: 'Has previous page' })
  hasPreviousPage: boolean;
}

/**
 * Paginated Hero Banners Response
 */
export class PaginatedHeroBannersResponseDto<T> {
  @ApiPropertyOptional({ description: 'Array of hero banners', isArray: true })
  data: T[];

  @ApiPropertyOptional({
    description: 'Pagination metadata',
    type: PaginationMetaDto,
  })
  meta: PaginationMetaDto;
}
