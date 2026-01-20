/**
 * @file reject-product.dto.ts
 * @description DTO for product rejection requests
 *
 * @author SouqSyria Development Team
 * @since 2025-08-08
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * DTO for rejecting a product
 */
export class RejectProductDto {
  /**
   * Mandatory reason for product rejection
   */
  @ApiProperty({
    description: 'Mandatory reason for rejecting the product',
    example:
      'Product images do not meet quality standards. Please upload high-resolution images with white background.',
    minLength: 10,
    maxLength: 500,
  })
  @IsNotEmpty({ message: 'Rejection reason is required' })
  @IsString()
  @MinLength(10, { message: 'Rejection reason must be at least 10 characters' })
  @MaxLength(500, { message: 'Rejection reason cannot exceed 500 characters' })
  rejectionReason: string;
}
