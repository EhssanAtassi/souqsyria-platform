// src/commissions/dto/create-product-commission.dto.ts

import { IsNumber, IsOptional, IsString, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * CreateProductCommissionDto
 * -----------------------------------------------
 * Used to assign a custom commission percentage to a specific product.
 * This override takes the highest priority during commission resolution.
 *
 * Example use case:
 * POST /api/admin/commissions/product
 * {
 *   "product_id": 145678,
 *   "percentage": 9.5,
 *   "note": "High-margin item - promotional override"
 * }
 */
export class CreateProductCommissionDto {
  @IsInt()
  @ApiProperty({ example: 145678, description: 'Target product ID' })
  product_id: number;

  @IsNumber()
  @ApiProperty({
    example: 9.5,
    description: 'Commission percentage for this product',
  })
  percentage: number;

  @IsOptional()
  @IsString()
  @ApiProperty({
    required: false,
    description: 'Optional override reason or comment',
  })
  note?: string;
}
