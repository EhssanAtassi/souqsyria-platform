/**
 * @file update-attribute.dto.ts
 * @description DTO for updating existing attributes with partial validation
 */
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsInt,
  Min,
  Max,
  Length,
  IsObject,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AttributeType } from '../entities';

export class UpdateAttributeDto {
  @ApiPropertyOptional({
    description: 'Attribute name in English',
    example: 'Color',
    minLength: 2,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(2, 100, { message: 'English name must be between 2-100 characters' })
  nameEn?: string;

  @ApiPropertyOptional({
    description: 'Attribute name in Arabic',
    example: 'اللون',
    minLength: 2,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(2, 100, { message: 'Arabic name must be between 2-100 characters' })
  nameAr?: string;

  @ApiPropertyOptional({
    description: 'Description in English',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500, { message: 'English description must be max 500 characters' })
  descriptionEn?: string;

  @ApiPropertyOptional({
    description: 'Description in Arabic',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500, { message: 'Arabic description must be max 500 characters' })
  descriptionAr?: string;

  @ApiPropertyOptional({
    description: 'Type of attribute input',
    enum: AttributeType,
  })
  @IsOptional()
  @IsEnum(AttributeType, { message: 'Invalid attribute type' })
  type?: AttributeType;

  @ApiPropertyOptional({
    description: 'Display order in forms',
    minimum: 0,
    maximum: 999,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(999)
  displayOrder?: number;

  @ApiPropertyOptional({
    description: 'Required for product creation',
  })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({
    description: 'Show in product filters',
  })
  @IsOptional()
  @IsBoolean()
  isFilterable?: boolean;

  @ApiPropertyOptional({
    description: 'Include in product search',
  })
  @IsOptional()
  @IsBoolean()
  isSearchable?: boolean;

  @ApiPropertyOptional({
    description: 'Active status',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Validation rules for the attribute',
    example: { minLength: 1, maxLength: 50 },
  })
  @IsOptional()
  @IsObject()
  validationRules?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
    customValidation?: string;
  };
}
