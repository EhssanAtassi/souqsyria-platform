/**
 * @file refund-workflow-action.dto.ts
 * @description Refund Workflow Action DTO
 *
 * FEATURES:
 * - Workflow transition actions with validation
 * - Administrative notes and reasoning
 * - External reference tracking
 * - Action-specific validation
 *
 * @author SouqSyria Development Team
 * @since 2025-08-10
 * @version 2.0.0 - Enterprise Edition
 */

import { IsOptional, IsString, Length, IsNotEmpty } from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';

export class RefundWorkflowActionDto {
  @ApiPropertyOptional({
    description: 'Administrative notes or reason for the action',
    example: 'All documents verified and banking details confirmed',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  @Length(0, 2000, { message: 'Notes must not exceed 2000 characters' })
  notes?: string;

  @ApiPropertyOptional({
    description: 'External reference ID from banking system or payment gateway',
    example: 'TXN_CBS_20250810_ABC123',
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: 'External reference ID must be a string' })
  @Length(0, 100, {
    message: 'External reference ID must not exceed 100 characters',
  })
  externalReferenceId?: string;
}
