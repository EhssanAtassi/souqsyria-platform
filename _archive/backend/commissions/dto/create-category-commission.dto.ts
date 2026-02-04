// src/commissions/dto/create-category-commission.dto.ts

import { IsNumber, IsOptional, IsString, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * CreateCategoryCommissionDto
 * -----------------------------------------------
 * This DTO is used by admin users to assign or update a
 * commission percentage to a specific product category.
 *
 * Why it's necessary:
 * - Category-level commissions override global defaults
 * - Admins may want to promote or penalize specific categories
 * - Applies across all products under that category (unless overridden at product level)
 *
 * Example Use Case:
 * POST /api/admin/commissions/category
 * {
 *   "category_id": 12,
 *   "percentage": 6.5,
 *   "note": "Temporary Ramadan campaign rate"
 * }
 */
export class CreateCategoryCommissionDto {
  /**
   * The ID of the target category in the system.
   * This ID must match a valid record in the `categories` table.
   */
  @IsInt()
  @ApiProperty({ example: 12, description: 'Target category ID' })
  category_id: number;

  /**
   * The percentage commission to assign to the category.
   * If a product has no product-level or vendor-level override,
   * this rate will be used during commission resolution.
   *
   * Range recommendation: 0% to 30%
   */
  @IsNumber()
  @ApiProperty({
    example: 5.5,
    description: 'Commission percentage to assign to this category',
  })
  percentage: number;

  /**
   * Optional description or reason for this commission rule.
   * Stored in the database and displayed in the audit log.
   */
  @IsOptional()
  @IsString()
  @ApiProperty({
    required: false,
    description: 'Optional note explaining this override',
  })
  note?: string;
}
