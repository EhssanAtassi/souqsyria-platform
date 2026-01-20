// src/commissions/dto/create-membership-discount.dto.ts

import { IsInt, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * CreateMembershipDiscountDto
 * -----------------------------------------------
 * DTO used by admins to assign a commission discount to a vendor membership tier.
 *
 * Example:
 * POST /api/admin/commissions/membership
 * {
 *   "membership_id": 3,
 *   "percentage": 2.5,
 *   "note": "Gold tier vendors get 2.5% discount"
 * }
 */
export class CreateMembershipDiscountDto {
  @IsInt()
  @ApiProperty({ example: 3, description: 'Membership ID (e.g., Gold = 3)' })
  membership_id: number;

  @IsNumber()
  @ApiProperty({
    example: 2.5,
    description: 'Discount to subtract from commission (e.g. 2.5)',
  })
  percentage: number;

  @IsOptional()
  @IsString()
  @ApiProperty({
    required: false,
    description: 'Optional admin note or reason',
  })
  note?: string;
}
