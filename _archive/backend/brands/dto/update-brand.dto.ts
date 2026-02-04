/**
 * @file update-brand.dto.ts
 * @description Enhanced DTO for updating brands with partial field support
 */
import { PartialType, ApiProperty } from '@nestjs/swagger';
import { CreateBrandDto } from './create-brand.dto';
import {
  IsOptional,
  IsEnum,
  IsBoolean,
  IsString,
  Length,
} from 'class-validator';

export class UpdateBrandDto extends PartialType(CreateBrandDto) {
  @ApiProperty({
    example: true,
    description: 'Whether the brand is active',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    example: 'approved',
    description: 'Brand approval status (admin only)',
    enum: ['draft', 'pending', 'approved', 'rejected', 'suspended', 'archived'],
    required: false,
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

  @ApiProperty({
    example: 'Brand does not meet verification requirements',
    description: 'Reason for rejection (admin only)',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  rejectionReason?: string;

  @ApiProperty({
    example: 'verified',
    description: 'Brand verification status (admin only)',
    enum: ['unverified', 'pending', 'verified', 'rejected', 'revoked'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['unverified', 'pending', 'verified', 'rejected', 'revoked'])
  verificationStatus?:
    | 'unverified'
    | 'pending'
    | 'verified'
    | 'rejected'
    | 'revoked';

  @ApiProperty({
    example: false,
    description: 'Whether the brand is officially verified',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  @ApiProperty({
    example: 'ORG123',
    description: 'Organization ID for multi-tenant support',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  organizationId?: string;

  @ApiProperty({
    example: 1,
    description: 'Tenant ID for multi-tenant support',
    required: false,
  })
  @IsOptional()
  tenantId?: number;
}
