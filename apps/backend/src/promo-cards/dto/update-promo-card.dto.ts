/**
 * @file update-promo-card.dto.ts
 * @description Data Transfer Object for updating promotional cards
 *
 * @author SouqSyria Development Team
 * @since 2025-02-02
 */

import { PartialType } from '@nestjs/swagger';
import { CreatePromoCardDto } from './create-promo-card.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsIn } from 'class-validator';

/**
 * DTO for updating an existing promotional card
 *
 * Extends CreatePromoCardDto with all fields optional,
 * plus additional fields for status management
 */
export class UpdatePromoCardDto extends PartialType(CreatePromoCardDto) {
  @ApiProperty({
    description: 'Whether card is active and visible',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    description: 'Approval status',
    enum: ['draft', 'pending', 'approved', 'rejected'],
    example: 'approved',
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsIn(['draft', 'pending', 'approved', 'rejected'])
  approvalStatus?: 'draft' | 'pending' | 'approved' | 'rejected';
}
