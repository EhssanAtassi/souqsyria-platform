/**
 * @file create-product-price.dto.ts
 * @description DTO for setting initial price + commission.
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsEnum,
  IsOptional,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';

export class CreateProductPriceDto {
  @ApiProperty({ example: 199.99 })
  @IsNumber()
  @Min(0)
  basePrice: number;

  @ApiProperty({
    example: 0.1,
    description: 'Platform commission as a decimal (0.15 = 15%)',
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  commissionRate: number;

  @ApiProperty({ enum: ['SYP', 'USD', 'TRY'], default: 'SYP' })
  @IsEnum(['SYP', 'USD', 'TRY'])
  currency: 'SYP' | 'USD' | 'TRY';

  @ApiProperty({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}
