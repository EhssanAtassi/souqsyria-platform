/**
 * @file filter-brand.dto.ts
 * @description DTO for filtering and searching brands with pagination
 */
import {
  IsOptional,
  IsString,
  IsEnum,
  IsBoolean,
  IsInt,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class FilterBrandDto {
  @ApiProperty({
    example: 'samsung',
    description: 'Search in brand name (English and Arabic)',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    example: 'approved',
    description: 'Filter by approval status',
    enum: ['draft', 'pending', 'approved', 'rejected', 'suspended', 'archived'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['draft', 'pending', 'approved', 'rejected', 'suspended', 'archived'])
  approvalStatus?:
    | 'draft'
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'suspended'
    | 'archived';

  @ApiProperty({
    example: 'verified',
    description: 'Filter by verification status',
    enum: ['unverified', 'pending', 'verified', 'rejected', 'revoked'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['unverified', 'pending', 'verified', 'rejected', 'revoked'])
  verificationStatus?:
    | 'unverified'
    | 'pending'
    | 'verified'
    | 'rejected'
    | 'revoked';

  @ApiProperty({
    example: true,
    description: 'Filter by active status',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    example: true,
    description: 'Filter by verification status',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isVerified?: boolean;

  @ApiProperty({
    example: 'Syria',
    description: 'Filter by country of origin',
    required: false,
  })
  @IsOptional()
  @IsString()
  countryOfOrigin?: string;

  @ApiProperty({
    example: 'official',
    description: 'Filter by verification type',
    enum: ['official', 'authorized', 'unverified'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['official', 'authorized', 'unverified'])
  verificationType?: 'official' | 'authorized' | 'unverified';

  @ApiProperty({
    example: 1,
    description: 'Filter by tenant ID (multi-tenant support)',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  tenantId?: number;

  @ApiProperty({
    example: 'ORG123',
    description: 'Filter by organization ID',
    required: false,
  })
  @IsOptional()
  @IsString()
  organizationId?: string;

  // === DATE RANGE FILTERS ===
  @ApiProperty({
    example: '2024-01-01',
    description: 'Filter brands created after this date',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  createdAfter?: string;

  @ApiProperty({
    example: '2024-12-31',
    description: 'Filter brands created before this date',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  createdBefore?: string;

  // === PAGINATION ===
  @ApiProperty({
    example: 1,
    description: 'Page number for pagination',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    example: 20,
    description: 'Number of items per page',
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  // === SORTING ===
  @ApiProperty({
    example: 'name',
    description: 'Field to sort by',
    enum: ['name', 'createdAt', 'updatedAt', 'popularityScore', 'productCount'],
    default: 'name',
  })
  @IsOptional()
  @IsEnum(['name', 'createdAt', 'updatedAt', 'popularityScore', 'productCount'])
  sortBy?:
    | 'name'
    | 'createdAt'
    | 'updatedAt'
    | 'popularityScore'
    | 'productCount' = 'name';

  @ApiProperty({
    example: 'ASC',
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    default: 'ASC',
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'ASC';

  // === LANGUAGE PREFERENCE ===
  @ApiProperty({
    example: 'en',
    description: 'Language preference for names and descriptions',
    enum: ['en', 'ar'],
    default: 'en',
  })
  @IsOptional()
  @IsEnum(['en', 'ar'])
  language?: 'en' | 'ar' = 'en';
}
