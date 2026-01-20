/**
 * @file update-refund.dto.ts
 * @description Update Syrian Refund DTO
 *
 * FEATURES:
 * - Partial updates for Syrian refund entities
 * - Banking information updates with validation
 * - Status-aware field validation
 * - Administrative notes and metadata updates
 *
 * @author SouqSyria Development Team
 * @since 2025-08-10
 * @version 2.0.0 - Enterprise Edition
 */

import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsString, Length, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

import { CreateRefundDto } from './create-refund.dto';

export class UpdateRefundDto extends PartialType(CreateRefundDto) {
  @ApiPropertyOptional({
    description: 'Administrative notes (admin only)',
    example: 'Updated banking details verified by finance team',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString({ message: 'Admin notes must be a string' })
  @Length(0, 2000, { message: 'Admin notes must not exceed 2000 characters' })
  adminNotes?: string;

  @ApiPropertyOptional({
    description: 'Mark if documents are completed (admin only)',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'Required documents completed must be boolean' })
  requiredDocumentsCompleted?: boolean;

  @ApiPropertyOptional({
    description: 'Document verification notes (admin only)',
    example: 'All required documents received and verified',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString({ message: 'Document verification notes must be a string' })
  @Length(0, 1000, {
    message: 'Document verification notes must not exceed 1000 characters',
  })
  documentsVerificationNotes?: string;
}
