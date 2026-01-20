/**
 * @file adjust-stock.dto.ts
 * @description DTO for adjusting stock of a product variant manually.
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class AdjustStockDto {
  @ApiProperty({ example: 1, description: 'Warehouse ID to adjust stock in' })
  @IsInt()
  warehouseId: number;

  @ApiProperty({ example: 5, description: 'Number of units to adjust' })
  @IsInt()
  quantity: number;

  @ApiProperty({
    example: 'in',
    enum: ['in', 'out'],
    description: 'Stock movement type',
  })
  @IsEnum(['in', 'out'])
  type: 'in' | 'out';

  @ApiProperty({ required: false, example: 'Manual stock correction' })
  @IsOptional()
  @IsString()
  note?: string;
}
