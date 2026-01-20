/**
 * @file create-attribute.dto.ts
 * @description DTO for creating new product attributes with validation
 */
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsArray,
  IsObject,
  IsInt,
  Min,
  Max,
  Length,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttributeType } from '../entities/attribute-types.enum';
import { CreateAttributeValueDto } from './create-attribute-value.dto';

export class CreateAttributeDto {
  @ApiProperty({
    description: 'Attribute name in English',
    example: 'Color',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @Length(2, 100, { message: 'English name must be between 2-100 characters' })
  nameEn: string;

  @ApiProperty({
    description: 'Attribute name in Arabic',
    example: 'اللون',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @Length(2, 100, { message: 'Arabic name must be between 2-100 characters' })
  nameAr: string;

  @ApiPropertyOptional({
    description: 'Attribute description in English',
    example: 'Product color options for customer selection',
  })
  @IsOptional()
  @IsString()
  @Length(0, 500, { message: 'English description must be max 500 characters' })
  descriptionEn?: string;

  @ApiPropertyOptional({
    description: 'Attribute description in Arabic',
    example: 'خيارات ألوان المنتج لاختيار العميل',
  })
  @IsOptional()
  @IsString()
  @Length(0, 500, { message: 'Arabic description must be max 500 characters' })
  descriptionAr?: string;

  @ApiProperty({
    description: 'Type of attribute input',
    enum: AttributeType,
    example: AttributeType.SELECT,
  })
  @IsEnum(AttributeType, { message: 'Invalid attribute type' })
  type: AttributeType;

  @ApiPropertyOptional({
    description: 'Display order in forms (0 = first)',
    example: 1,
    minimum: 0,
    maximum: 999,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(999)
  displayOrder?: number = 0;

  @ApiPropertyOptional({
    description: 'Required for product creation',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean = false;

  @ApiPropertyOptional({
    description: 'Show in product filters',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isFilterable?: boolean = true;

  @ApiPropertyOptional({
    description: 'Include in product search',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isSearchable?: boolean = true;

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

  @ApiPropertyOptional({
    description: 'Initial attribute values to create',
    type: [CreateAttributeValueDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAttributeValueDto)
  values?: CreateAttributeValueDto[];
}
