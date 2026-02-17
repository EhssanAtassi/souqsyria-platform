/**
 * @file track-analytics.dto.ts
 * @description DTOs for tracking promo card analytics
 *
 * @author SouqSyria Development Team
 * @since 2025-02-02
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  Min,
  IsIn,
  IsUUID,
} from 'class-validator';

/**
 * DTO for tracking promo card impressions
 */
export class TrackImpressionDto {
  @ApiProperty({
    description: 'Promo card UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID(4)
  cardId: string;

  @ApiProperty({
    description: 'Session ID for tracking',
    example: 'sess_abc123',
    required: false,
  })
  @IsString()
  @IsOptional()
  sessionId?: string;

  @ApiProperty({
    description: 'User ID if authenticated',
    example: 'usr_xyz789',
    required: false,
  })
  @IsString()
  @IsOptional()
  userId?: string;
}

/**
 * DTO for tracking promo card clicks
 */
export class TrackClickDto {
  @ApiProperty({
    description: 'Promo card UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID(4)
  cardId: string;

  @ApiProperty({
    description: 'Session ID for tracking',
    example: 'sess_abc123',
    required: false,
  })
  @IsString()
  @IsOptional()
  sessionId?: string;

  @ApiProperty({
    description: 'User ID if authenticated',
    example: 'usr_xyz789',
    required: false,
  })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiProperty({
    description: 'Target URL that was clicked',
    example: '/category/summer-collection',
    required: false,
  })
  @IsString()
  @IsOptional()
  targetUrl?: string;
}

/**
 * DTO for querying promo cards with filters
 */
export class QueryPromoCardsDto {
  @ApiProperty({
    description: 'Filter by active status',
    example: true,
    required: false,
  })
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    description: 'Filter by approval status',
    enum: ['draft', 'pending', 'approved', 'rejected'],
    required: false,
  })
  @IsString()
  @IsOptional()
  approvalStatus?: 'draft' | 'pending' | 'approved' | 'rejected';

  @ApiProperty({
    description: 'Filter by position',
    enum: [1, 2],
    required: false,
  })
  @IsInt()
  @IsOptional()
  position?: 1 | 2;

  @ApiProperty({
    description: 'Page number for pagination',
    example: 1,
    default: 1,
    required: false,
  })
  @IsInt()
  @IsOptional()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
    default: 10,
    required: false,
  })
  @IsInt()
  @IsOptional()
  @Min(1)
  limit?: number = 10;

  @ApiProperty({
    description: 'Sort field - must be one of the allowed column names',
    example: 'createdAt',
    default: 'createdAt',
    required: false,
    enum: [
      'createdAt',
      'updatedAt',
      'position',
      'impressions',
      'clicks',
      'titleEn',
    ],
  })
  @IsString()
  @IsOptional()
  @IsIn([
    'createdAt',
    'updatedAt',
    'position',
    'impressions',
    'clicks',
    'titleEn',
  ])
  sortBy?: string = 'createdAt';

  @ApiProperty({
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    example: 'DESC',
    default: 'DESC',
    required: false,
  })
  @IsString()
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

/**
 * Pagination metadata DTO
 */
export class PaginationMetaDto {
  @ApiProperty({ description: 'Current page number' })
  currentPage: number;

  @ApiProperty({ description: 'Items per page' })
  itemsPerPage: number;

  @ApiProperty({ description: 'Total number of items' })
  totalItems: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;

  @ApiProperty({ description: 'Whether there is a next page' })
  hasNextPage: boolean;

  @ApiProperty({ description: 'Whether there is a previous page' })
  hasPreviousPage: boolean;
}

/**
 * Paginated response DTO
 */
export class PaginatedPromoCardsResponseDto<T> {
  @ApiProperty({ description: 'Array of promo cards' })
  data: T[];

  @ApiProperty({ description: 'Pagination metadata' })
  meta: PaginationMetaDto;
}
