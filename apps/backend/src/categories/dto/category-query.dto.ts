/**
 * @file category-query.dto.ts
 * @description DTO for category search, filtering, and pagination
 */
import {
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

export enum CategorySortBy {
  NAME = 'nameEn',
  SORT_ORDER = 'sortOrder',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  POPULARITY = 'popularityScore',
  PRODUCT_COUNT = 'productCount',
  VIEW_COUNT = 'viewCount',
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export enum ApprovalStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
  ARCHIVED = 'archived',
}

export class CategoryQueryDto {
  @ApiPropertyOptional({
    example: 'electronics',
    description: 'Search term for category names and descriptions',
    minLength: 2,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  search?: string;

  @ApiPropertyOptional({
    enum: ApprovalStatus,
    description: 'Filter by approval status',
    example: ApprovalStatus.APPROVED,
  })
  @IsOptional()
  @IsEnum(ApprovalStatus)
  approvalStatus?: ApprovalStatus;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by featured status',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isFeatured?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by show in navigation status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  showInNav?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by parent category ID (null for root categories)',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  parentId?: number | null;

  @ApiPropertyOptional({
    description: 'Filter by hierarchy depth level',
    example: 0,
    minimum: 0,
    maximum: 4,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(4)
  depthLevel?: number;

  @ApiPropertyOptional({
    description: 'Filter by minimum product count',
    example: 1,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minProductCount?: number;

  @ApiPropertyOptional({
    description: 'Filter by maximum product count',
    example: 1000,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxProductCount?: number;

  @ApiPropertyOptional({
    description: 'Language preference for response',
    enum: ['en', 'ar'],
    example: 'en',
    default: 'en',
  })
  @IsOptional()
  @IsEnum(['en', 'ar'])
  language?: 'en' | 'ar' = 'en';

  // Pagination
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

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
  limit?: number = 20;

  // Sorting
  @ApiPropertyOptional({
    enum: CategorySortBy,
    description: 'Field to sort by',
    example: CategorySortBy.SORT_ORDER,
    default: CategorySortBy.SORT_ORDER,
  })
  @IsOptional()
  @IsEnum(CategorySortBy)
  sortBy?: CategorySortBy = CategorySortBy.SORT_ORDER;

  @ApiPropertyOptional({
    enum: SortOrder,
    description: 'Sort order direction',
    example: SortOrder.ASC,
    default: SortOrder.ASC,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.ASC;

  // Advanced filters
  @ApiPropertyOptional({
    description: 'Filter by tenant ID',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  tenantId?: number;

  @ApiPropertyOptional({
    description: 'Include deleted categories in results',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  includeDeleted?: boolean = false;

  @ApiPropertyOptional({
    description: 'Include hierarchy relationships in response',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  includeHierarchy?: boolean = true;
}
