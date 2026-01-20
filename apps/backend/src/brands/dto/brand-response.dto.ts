/**
 * @file brand-response.dto.ts
 * @description Standardized response DTO for brand data with optional relations
 */
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';

export class BrandResponseDto {
  @ApiProperty({ example: 1, description: 'Brand ID' })
  @Expose()
  id: number;

  @ApiProperty({ example: 'Samsung', description: 'Brand name in English' })
  @Expose()
  name: string;

  @ApiProperty({ example: 'سامسونغ', description: 'Brand name in Arabic' })
  @Expose()
  nameAr?: string;

  @ApiProperty({ example: 'samsung', description: 'SEO-friendly slug' })
  @Expose()
  slug: string;

  @ApiProperty({
    example: 'Leading technology company',
    description: 'Brand description in English',
  })
  @Expose()
  descriptionEn?: string;

  @ApiProperty({
    example: 'شركة تقنية رائدة',
    description: 'Brand description in Arabic',
  })
  @Expose()
  descriptionAr?: string;

  @ApiProperty({
    example: 'https://cdn.souqsyria.com/brands/samsung-logo.png',
    description: 'Brand logo URL',
  })
  @Expose()
  logoUrl?: string;

  @ApiProperty({ example: true, description: 'Whether brand is active' })
  @Expose()
  isActive: boolean;

  @ApiProperty({ example: 'South Korea', description: 'Country of origin' })
  @Expose()
  countryOfOrigin?: string;

  // === VERIFICATION & STATUS ===
  @ApiProperty({ example: true, description: 'Whether brand is verified' })
  @Expose()
  isVerified: boolean;

  @ApiProperty({
    example: 'verified',
    description: 'Verification status',
    enum: ['unverified', 'pending', 'verified', 'rejected', 'revoked'],
  })
  @Expose()
  verificationStatus: string;

  @ApiProperty({
    example: 'official',
    description: 'Type of verification',
    enum: ['official', 'authorized', 'unverified'],
  })
  @Expose()
  verificationType: string;

  @ApiProperty({
    example: 'approved',
    description: 'Approval status',
    enum: ['draft', 'pending', 'approved', 'rejected', 'suspended', 'archived'],
  })
  @Expose()
  approvalStatus: string;

  @ApiProperty({ example: 'TM123456789', description: 'Trademark number' })
  @Expose()
  trademarkNumber?: string;

  // === ANALYTICS & PERFORMANCE ===
  @ApiProperty({
    example: 150,
    description: 'Number of products from this brand',
  })
  @Expose()
  productCount: number;

  @ApiProperty({ example: 85.5, description: 'Brand popularity score (0-100)' })
  @Expose()
  @Transform(({ value }) => (value ? parseFloat(value).toFixed(1) : 0))
  popularityScore: number;

  @ApiProperty({ example: 1250000.5, description: 'Total sales in SYP' })
  @Expose()
  @Transform(({ value }) => (value ? parseFloat(value).toFixed(2) : 0))
  totalSalesSyp: number;

  @ApiProperty({ example: 5420, description: 'Total page views' })
  @Expose()
  viewCount: number;

  @ApiProperty({
    example: '2024-06-04T10:30:00Z',
    description: 'Last activity timestamp',
  })
  @Expose()
  lastActivityAt?: Date;

  // === AUDIT FIELDS ===
  @ApiProperty({ example: 1, description: 'ID of user who created this brand' })
  @Expose()
  createdBy?: number;

  @ApiProperty({
    example: 2,
    description: 'ID of user who last updated this brand',
  })
  @Expose()
  updatedBy?: number;

  @ApiProperty({
    example: 3,
    description: 'ID of admin who approved this brand',
  })
  @Expose()
  approvedBy?: number;

  @ApiProperty({
    example: '2024-06-04T08:00:00Z',
    description: 'When brand was approved',
  })
  @Expose()
  approvedAt?: Date;

  // === ENTERPRISE FIELDS ===
  @ApiProperty({ example: 1, description: 'Tenant ID' })
  @Expose()
  tenantId?: number;

  @ApiProperty({ example: 'ORG123', description: 'Organization ID' })
  @Expose()
  organizationId?: string;

  // === TIMESTAMPS ===
  @ApiProperty({
    example: '2024-01-15T09:00:00Z',
    description: 'When brand was created',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    example: '2024-06-04T14:30:00Z',
    description: 'When brand was last updated',
  })
  @Expose()
  updatedAt: Date;

  // === COMPUTED FIELDS ===
  @ApiProperty({
    example: 'Samsung',
    description: 'Display name based on language preference',
  })
  @Expose()
  displayName: string;

  @ApiProperty({
    example: 'Leading technology company',
    description: 'Display description based on language preference',
  })
  @Expose()
  displayDescription: string;

  @ApiProperty({
    example: true,
    description: 'Whether brand is publicly visible',
  })
  @Expose()
  isPublic: boolean;

  @ApiProperty({
    example: true,
    description: 'Whether brand can be edited',
  })
  @Expose()
  canBeEdited: boolean;

  @ApiProperty({
    example: false,
    description: 'Whether brand is from Syria',
  })
  @Expose()
  isSyrian: boolean;
}
