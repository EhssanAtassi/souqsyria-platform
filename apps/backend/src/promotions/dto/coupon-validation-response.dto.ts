/**
 * @file coupon-validation-response.dto.ts
 * @description Response DTO for coupon validation results
 *
 * @author SouqSyria Development Team
 * @since 2025-08-16
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CouponValidationResponseDto {
  @ApiProperty({ description: 'Whether coupon is valid' })
  is_valid: boolean;

  @ApiPropertyOptional({ description: 'Calculated discount amount in SYP' })
  discount_amount?: number;

  @ApiPropertyOptional({ description: 'Final order amount after discount' })
  final_amount?: number;

  @ApiPropertyOptional({ description: 'Error message if invalid' })
  error_message?: string;

  @ApiPropertyOptional({ description: 'Error code for programmatic handling' })
  error_code?: string;

  @ApiProperty({ description: 'Coupon code that was validated' })
  coupon_code: string;
}
