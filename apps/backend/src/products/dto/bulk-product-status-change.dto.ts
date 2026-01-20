/**
 * @file bulk-product-status-change.dto.ts
 * @description DTO for bulk product status changes
 *
 * @author SouqSyria Development Team
 * @since 2025-08-08
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  ArrayMinSize,
} from 'class-validator';

/**
 * DTO for bulk product status changes
 */
export class BulkProductStatusChangeDto {
  /**
   * Array of product IDs to update
   */
  @ApiProperty({
    description: 'Array of product IDs to change status for',
    example: [1, 2, 3, 4, 5],
    type: [Number],
    minItems: 1,
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one product ID is required' })
  @IsNumber({}, { each: true, message: 'All product IDs must be numbers' })
  productIds: number[];

  /**
   * New status to apply to all products
   */
  @ApiProperty({
    description: 'New approval status to apply to all selected products',
    example: 'approved',
    enum: ['draft', 'pending', 'approved', 'rejected', 'suspended', 'archived'],
  })
  @IsNotEmpty()
  @IsEnum(
    ['draft', 'pending', 'approved', 'rejected', 'suspended', 'archived'],
    {
      message:
        'Status must be one of: draft, pending, approved, rejected, suspended, archived',
    },
  )
  newStatus:
    | 'draft'
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'suspended'
    | 'archived';

  /**
   * Optional reason for status change (required for rejection)
   */
  @ApiPropertyOptional({
    description: 'Reason for status change (mandatory for rejection)',
    example: 'Bulk approval after quality review',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Reason cannot exceed 500 characters' })
  reason?: string;
}
