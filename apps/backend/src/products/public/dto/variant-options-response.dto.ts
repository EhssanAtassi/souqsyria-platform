/**
 * @file variant-options-response.dto.ts
 * @description DTOs for public variant and variant-options API responses
 * Used by PublicVariantsController for GET /products/:productId/variants
 * and GET /products/:productId/variant-options
 */
import { ApiProperty } from '@nestjs/swagger';

/**
 * @description Single variant response with stock status and pricing
 */
export class VariantResponseDto {
  @ApiProperty({ description: 'Variant ID', example: 201 })
  id: number;

  @ApiProperty({
    description: 'Stock Keeping Unit',
    example: 'SGS24-128GB-BLACK',
    nullable: true,
  })
  sku: string | null;

  @ApiProperty({
    description: 'Derived display name from variant data',
    example: 'Black / 128GB',
  })
  name: string;

  @ApiProperty({
    description: 'Variant price in base currency',
    example: 2750000,
  })
  price: number;

  @ApiProperty({
    description: 'Total stock quantity across all warehouses',
    example: 25,
  })
  stockQuantity: number;

  @ApiProperty({
    description:
      'Computed stock status: in_stock (>5), low_stock (1-5), out_of_stock (0)',
    enum: ['in_stock', 'low_stock', 'out_of_stock'],
    example: 'in_stock',
  })
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';

  @ApiProperty({
    description: 'Variant-specific image URL',
    example: 'https://example.com/variant.jpg',
    nullable: true,
  })
  imageUrl: string | null;

  @ApiProperty({
    description: 'Key-value map of variant attributes',
    example: { Color: 'Black', Storage: '128GB' },
  })
  variantData: Record<string, string>;
}

/**
 * @description A single option value within a variant option group
 */
export class VariantOptionValueDto {
  @ApiProperty({ description: 'English value name', example: 'Red' })
  value: string;

  @ApiProperty({
    description: 'Arabic value name',
    example: 'أحمر',
    nullable: true,
  })
  valueAr: string | null;

  @ApiProperty({
    description: 'Hex color code for color-type attributes',
    example: '#FF0000',
    nullable: true,
  })
  colorHex: string | null;

  @ApiProperty({ description: 'Display order for sorting', example: 1 })
  displayOrder: number;
}

/**
 * @description A group of variant options for a single attribute (e.g., all Color values)
 */
export class VariantOptionGroupDto {
  @ApiProperty({ description: 'English option group name', example: 'Color' })
  optionName: string;

  @ApiProperty({
    description: 'Arabic option group name',
    example: 'اللون',
    nullable: true,
  })
  optionNameAr: string | null;

  @ApiProperty({
    description: 'Attribute type for rendering (color renders swatches)',
    example: 'color',
  })
  type: string;

  @ApiProperty({
    description: 'Available values for this option group',
    type: [VariantOptionValueDto],
  })
  values: VariantOptionValueDto[];
}
