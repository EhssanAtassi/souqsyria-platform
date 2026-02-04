/**
 * @file attribute-value-response.dto.ts
 * @description Response DTO for attribute value data with localization support
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AttributeValueResponseDto {
  @ApiProperty({
    description: 'Unique attribute value identifier',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Parent attribute identifier',
    example: 1,
  })
  attributeId: number;

  @ApiProperty({
    description: 'Value in English',
    example: 'Red',
  })
  valueEn: string;

  @ApiProperty({
    description: 'Value in Arabic',
    example: 'أحمر',
  })
  valueAr: string;

  @ApiProperty({
    description: 'Localized value (based on request language)',
    example: 'Red',
  })
  value: string;

  @ApiProperty({
    description: 'Display order in dropdowns and filters',
    example: 1,
  })
  displayOrder: number;

  @ApiProperty({
    description: 'Active status',
    example: true,
  })
  isActive: boolean;

  @ApiPropertyOptional({
    description: 'Hex color code for color attributes',
    example: '#FF0000',
  })
  colorHex?: string;

  @ApiPropertyOptional({
    description: 'Icon/image URL for visual representation',
    example: 'https://cdn.souqsyria.com/icons/red-color.png',
  })
  iconUrl?: string;

  @ApiPropertyOptional({
    description: 'CSS class for custom styling',
    example: 'color-red',
  })
  cssClass?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata for the value',
    example: {
      price_modifier: 5.5,
      weight: 0.1,
      sku_suffix: 'RED',
    },
  })
  metadata?: {
    weight?: number;
    price_modifier?: number;
    sku_suffix?: string;
    stock_impact?: number;
    custom_fields?: Record<string, any>;
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
    description: 'Admin user who created this value',
    example: 1,
  })
  createdBy?: number;

  @ApiPropertyOptional({
    description: 'Admin user who last updated this value',
    example: 2,
  })
  updatedBy?: number;

  // Computed helper properties
  @ApiPropertyOptional({
    description: 'Whether this value represents a color',
    example: true,
  })
  isColor?: boolean;

  @ApiPropertyOptional({
    description: 'Whether this value has an icon',
    example: false,
  })
  hasIcon?: boolean;

  @ApiPropertyOptional({
    description: 'Price modification amount',
    example: 5.5,
  })
  priceModifier?: number;
}
