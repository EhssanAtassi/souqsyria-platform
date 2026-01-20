// src/categories/dto/approve-category.dto.ts
/**
 * @file approve-category.dto.ts
 * @description DTO for category approval operations
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ApproveCategoryDto {
  @ApiProperty({
    description: 'Optional approval notes or comments from admin',
    example: 'Category approved - meets Syrian market guidelines',
    required: false,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Approval notes cannot exceed 500 characters' })
  approvalNotes?: string;

  @ApiProperty({
    description: 'Whether to automatically activate the category upon approval',
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  autoActivate?: boolean = true;
}
