/**
 * @file validate-coupon.dto.ts
 * @description DTO for validating coupon codes
 *
 * @author SouqSyria Development Team
 * @since 2025-08-16
 */

import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsPositive,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ValidateCouponDto {
  @ApiProperty({
    description: 'Coupon code to validate',
    example: 'SYRIA2025',
  })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({
    description: 'Order amount in SYP',
    example: 75000,
  })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  order_amount: number;

  @ApiPropertyOptional({
    description: 'User ID applying the coupon',
    example: 123,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  user_id?: number;

  @ApiPropertyOptional({
    description: 'Category ID of products in order',
    example: 5,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  category_id?: number;

  @ApiPropertyOptional({
    description: 'Vendor ID of products in order',
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  vendor_id?: number;
}
