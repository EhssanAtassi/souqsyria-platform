/**
 * @file update-product-price.dto.ts
 * @description DTO for updating price or commission.
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsEnum,
  IsOptional,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';

export class UpdateProductPriceDto {
  @ApiPropertyOptional({ example: 199.99 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  basePrice?: number;

  @ApiPropertyOptional({ example: 0.15 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  commissionRate?: number;

  @ApiPropertyOptional({ enum: ['SYP', 'USD', 'TRY'] })
  @IsOptional()
  @IsEnum(['SYP', 'USD', 'TRY'])
  currency?: 'SYP' | 'USD' | 'TRY';

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
