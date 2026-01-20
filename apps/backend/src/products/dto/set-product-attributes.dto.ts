import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Single attribute-value pair (e.g. Color = Red)
 */
export class ProductAttributeInput {
  @ApiProperty({ example: 1, description: 'ID of the attribute (e.g. Color)' })
  @IsInt()
  attribute_id: number;

  @ApiProperty({ example: 4, description: 'ID of the value (e.g. Red)' })
  @IsInt()
  value_id: number;
}

/**
 * Full payload for setting product attributes
 */
export class SetProductAttributesDto {
  @ApiProperty({
    type: [ProductAttributeInput],
    description: 'List of attribute-value pairs to assign to a product',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductAttributeInput)
  attributes: ProductAttributeInput[];
}
