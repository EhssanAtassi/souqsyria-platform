// src/commissions/dto/create-vendor-commission.dto.ts

import { IsNumber, IsOptional, IsString, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * CreateVendorCommissionDto
 * -----------------------------------------------
 * This DTO is used by admins to assign or update
 * a commission percentage for a specific vendor.
 *
 * Vendor-level rules take priority over category/global rates.
 *
 * Example use case:
 * POST /api/admin/commissions/vendor
 * {
 *   "vendor_id": 102,
 *   "percentage": 8,
 *   "note": "Top-seller preferred rate"
 * }
 */
export class CreateVendorCommissionDto {
  /**
   * ID of the vendor (from vendors table)
   */
  @IsInt()
  @ApiProperty({ example: 102, description: 'Target vendor ID' })
  vendor_id: number;

  /**
   * Commission percentage to assign to the vendor
   */
  @IsNumber()
  @ApiProperty({
    example: 8,
    description: 'Commission percentage for this vendor',
  })
  percentage: number;

  /**
   * Optional reason or comment for the override
   */
  @IsOptional()
  @IsString()
  @ApiProperty({
    required: false,
    description: 'Reason or comment for this rule',
  })
  note?: string;
}
