/**
 * @file attribute-response.dto.ts
 * @description Response DTO for attribute data with localization support
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttributeType } from '../entities/attribute-types.enum';
import { AttributeValueResponseDto } from './attribute-value-response.dto';

export class AttributeResponseDto {
  @ApiProperty({
    description: 'Unique attribute identifier',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Attribute name in English',
    example: 'Color',
  })
  nameEn: string;

  @ApiProperty({
    description: 'Attribute name in Arabic',
    example: 'اللون',
  })
  nameAr: string;

  @ApiProperty({
    description: 'Localized attribute name (based on request language)',
    example: 'Color',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Attribute description in English',
    example: 'Product color options for customer selection',
  })
  descriptionEn?: string;

  @ApiPropertyOptional({
    description: 'Attribute description in Arabic',
    example: 'خيارات ألوان المنتج لاختيار العميل',
  })
  descriptionAr?: string;

  @ApiPropertyOptional({
    description: 'Localized attribute description',
    example: 'Product color options for customer selection',
  })
  description?: string;

  @ApiProperty({
    description: 'Type of attribute input',
    enum: AttributeType,
    example: AttributeType.SELECT,
  })
  type: AttributeType;

  @ApiProperty({
    description: 'Display order in forms',
    example: 1,
  })
  displayOrder: number;

  @ApiProperty({
    description: 'Required for product creation',
    example: true,
  })
  isRequired: boolean;

  @ApiProperty({
    description: 'Show in product filters',
    example: true,
  })
  isFilterable: boolean;

  @ApiProperty({
    description: 'Include in product search',
    example: true,
  })
  isSearchable: boolean;

  @ApiProperty({
    description: 'Active status',
    example: true,
  })
  isActive: boolean;

  @ApiPropertyOptional({
    description: 'Validation rules for the attribute',
    example: { minLength: 1, maxLength: 50 },
  })
  validationRules?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
    customValidation?: string;
  };

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2025-01-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2025-01-15T14:20:00Z',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Admin user who created this attribute',
    example: 1,
  })
  createdBy?: number;

  @ApiPropertyOptional({
    description: 'Admin user who last updated this attribute',
    example: 2,
  })
  updatedBy?: number;

  @ApiPropertyOptional({
    description: 'Attribute values (if requested)',
    type: [AttributeValueResponseDto],
  })
  values?: AttributeValueResponseDto[];

  @ApiPropertyOptional({
    description: 'Count of active values',
    example: 5,
  })
  valuesCount?: number;
}
