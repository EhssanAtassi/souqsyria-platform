/**
 * @file bulk-refund-action.dto.ts
 * @description Bulk Refund Action DTO
 *
 * FEATURES:
 * - Bulk operations on multiple refunds
 * - Action validation and constraints
 * - Batch processing with error handling
 * - Performance optimized operations
 *
 * @author SouqSyria Development Team
 * @since 2025-08-10
 * @version 2.0.0 - Enterprise Edition
 */

import {
  IsNotEmpty,
  IsArray,
  IsEnum,
  IsString,
  IsOptional,
  ArrayNotEmpty,
  ArrayMaxSize,
  Length,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum BulkRefundAction {
  APPROVE = 'approve',
  REJECT = 'reject',
  START_PROCESSING = 'start_processing',
  ESCALATE = 'escalate',
  MARK_URGENT = 'mark_urgent',
  UNMARK_URGENT = 'unmark_urgent',
  UPDATE_PRIORITY = 'update_priority',
  EXPORT = 'export',
}

export class BulkRefundActionDto {
  @ApiProperty({
    description: 'Array of refund IDs to perform action on',
    example: [12345, 12346, 12347],
    isArray: true,
    type: 'number',
  })
  @IsArray({ message: 'Refund IDs must be an array' })
  @ArrayNotEmpty({ message: 'At least one refund ID is required' })
  @ArrayMaxSize(100, { message: 'Maximum 100 refund IDs allowed per batch' })
  refundIds: number[];

  @ApiProperty({
    description: 'Bulk action to perform',
    enum: BulkRefundAction,
    example: BulkRefundAction.APPROVE,
  })
  @IsEnum(BulkRefundAction, { message: 'Invalid bulk action' })
  @IsNotEmpty({ message: 'Action is required' })
  action: BulkRefundAction;

  @ApiPropertyOptional({
    description: 'Reason or notes for the bulk action',
    example: 'Batch approval of verified product defect refunds',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString({ message: 'Reason must be a string' })
  @Length(0, 1000, { message: 'Reason must not exceed 1000 characters' })
  reason?: string;

  @ApiPropertyOptional({
    description: 'New priority level (for UPDATE_PRIORITY action)',
    enum: ['low', 'normal', 'high', 'urgent'],
    example: 'high',
  })
  @IsOptional()
  @IsEnum(['low', 'normal', 'high', 'urgent'], {
    message: 'Priority level must be low, normal, high, or urgent',
  })
  newPriorityLevel?: 'low' | 'normal' | 'high' | 'urgent';
}
