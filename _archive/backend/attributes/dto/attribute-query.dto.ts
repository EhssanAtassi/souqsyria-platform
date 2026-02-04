/**
 * @file attribute-query.dto.ts
 * @description DTO for querying and filtering attributes with pagination
 */
import {
  IsOptional,
  IsString,
  IsBoolean,
  IsEnum,
  IsInt,
  Min,
  Max,
  Length,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AttributeType } from '../entities';

export class AttributeQueryDto {
  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page (max 100)',
    example: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Search in names and descriptions',
    example: 'color',
    minLength: 1,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(1, 100, { message: 'Search term must be 1-100 characters' })
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by attribute type',
    enum: AttributeType,
    example: AttributeType.SELECT,
  })
  @IsOptional()
  @IsEnum(AttributeType, { message: 'Invalid attribute type' })
  type?: AttributeType;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Show only filterable attributes',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isFilterable?: boolean;

  @ApiPropertyOptional({
    description: 'Show only required attributes',
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({
    description: 'Sort by field',
    example: 'displayOrder',
    enum: [
      'id',
      'nameEn',
      'nameAr',
      'type',
      'displayOrder',
      'createdAt',
      'updatedAt',
    ],
  })
  @IsOptional()
  @IsString()
  @IsEnum([
    'id',
    'nameEn',
    'nameAr',
    'type',
    'displayOrder',
    'createdAt',
    'updatedAt',
  ])
  sortBy?: string = 'displayOrder';

  @ApiPropertyOptional({
    description: 'Sort direction',
    example: 'ASC',
    enum: ['ASC', 'DESC'],
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'], { message: 'Sort order must be ASC or DESC' })
  sortOrder?: 'ASC' | 'DESC' = 'ASC';

  @ApiPropertyOptional({
    description: 'Include attribute values in response',
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  includeValues?: boolean = false;

  @ApiPropertyOptional({
    description: 'Language for localized responses',
    example: 'en',
    enum: ['en', 'ar'],
  })
  @IsOptional()
  @IsEnum(['en', 'ar'], { message: 'Language must be en or ar' })
  language?: 'en' | 'ar' = 'en';
}
