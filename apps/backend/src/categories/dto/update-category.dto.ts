/**
 * @file update-category.dto.ts
 * @description Enhanced DTO for updating categories with validation and business rules
 */
import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateCategoryDto } from './create-category.dto';
import { IsEnum, IsOptional, IsString, Length } from 'class-validator';

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {
  /**
   * Additional fields specific to updates
   */

  @ApiPropertyOptional({
    example: 'approved',
    enum: ['draft', 'pending', 'approved', 'rejected', 'suspended', 'archived'],
    description: 'Update approval status (admin only)',
  })
  @IsOptional()
  @IsEnum(['draft', 'pending', 'approved', 'rejected', 'suspended', 'archived'])
  approvalStatus?:
    | 'draft'
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'suspended'
    | 'archived';

  @ApiPropertyOptional({
    example: 'Category name needs to be more descriptive',
    description: 'Reason for rejection (required when rejecting)',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  rejectionReason?: string;

  @ApiPropertyOptional({
    example: null,
    description: 'Set to null to move category to root level',
  })
  @IsOptional()
  parentId?: number | null; // Allow null to move to root

  @ApiPropertyOptional({
    example: true,
    description: 'Force update even if validation warnings exist',
  })
  @IsOptional()
  forceUpdate?: boolean;
  // Add this after the existing properties
  @ApiPropertyOptional({
    example: 'Category approved with minor suggestions',
    description: 'Admin notes for approval/rejection',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  notes?: string;
}
