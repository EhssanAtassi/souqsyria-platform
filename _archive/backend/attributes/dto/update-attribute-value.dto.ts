/**
 * @file update-attribute-value.dto.ts
 * @description DTO for updating existing attribute values with partial validation
 */
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  Max,
  Length,
  IsHexColor,
  IsUrl,
  IsObject,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAttributeValueDto {
  @ApiPropertyOptional({
    description: 'Value in English',
    example: 'Red',
    minLength: 1,
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @Length(1, 200, { message: 'English value must be between 1-200 characters' })
  valueEn?: string;

  @ApiPropertyOptional({
    description: 'Value in Arabic',
    example: 'أحمر',
    minLength: 1,
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @Length(1, 200, { message: 'Arabic value must be between 1-200 characters' })
  valueAr?: string;

  @ApiPropertyOptional({
    description: 'Display order (0 = first)',
    minimum: 0,
    maximum: 999,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(999)
  displayOrder?: number;

  @ApiPropertyOptional({
    description: 'Active status',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Hex color code for color attributes',
    example: '#FF0000',
  })
  @IsOptional()
  @IsHexColor({ message: 'Invalid hex color format' })
  colorHex?: string;

  @ApiPropertyOptional({
    description: 'Icon/image URL for visual representation',
    example: 'https://cdn.souqsyria.com/icons/red-color.png',
  })
  @IsOptional()
  @IsUrl({}, { message: 'Invalid icon URL format' })
  iconUrl?: string;

  @ApiPropertyOptional({
    description: 'CSS class for custom styling',
    example: 'color-red',
  })
  @IsOptional()
  @IsString()
  @Length(1, 50, { message: 'CSS class must be 1-50 characters' })
  cssClass?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata for the value',
    example: { price_modifier: 5.5, weight: 0.1 },
  })
  @IsOptional()
  @IsObject()
  metadata?: {
    weight?: number;
    price_modifier?: number;
    sku_suffix?: string;
    stock_impact?: number;
    custom_fields?: Record<string, any>;
  };
}
