/**
 * @file approve-product.dto.ts
 * @description DTO for product approval requests
 *
 * @author SouqSyria Development Team
 * @since 2025-08-08
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * DTO for approving a product
 */
export class ApproveProductDto {
  /**
   * Optional approval notes from admin
   */
  @ApiPropertyOptional({
    description: 'Optional notes from admin about the approval',
    example: 'Product meets all quality standards for Syrian market',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Approval notes cannot exceed 500 characters' })
  notes?: string;
}
