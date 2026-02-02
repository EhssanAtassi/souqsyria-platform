/**
 * @file promo-card-response.dto.ts
 * @description Response DTOs for promotional cards
 *
 * @author SouqSyria Development Team
 * @since 2025-02-02
 */

import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

/**
 * Public response DTO for promotional cards
 *
 * Exposes only fields needed for frontend display,
 * excluding sensitive internal data
 */
export class PromoCardPublicResponseDto {
  @ApiProperty({ description: 'Promo card UUID' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Card title in English' })
  @Expose()
  titleEn: string;

  @ApiProperty({ description: 'Card title in Arabic' })
  @Expose()
  titleAr: string;

  @ApiProperty({ description: 'Card description in English', nullable: true })
  @Expose()
  descriptionEn: string;

  @ApiProperty({ description: 'Card description in Arabic', nullable: true })
  @Expose()
  descriptionAr: string;

  @ApiProperty({ description: 'Card image URL' })
  @Expose()
  imageUrl: string;

  @ApiProperty({ description: 'Target link URL', nullable: true })
  @Expose()
  linkUrl: string;

  @ApiProperty({ description: 'Card position (1 or 2)', enum: [1, 2] })
  @Expose()
  position: 1 | 2;

  @ApiProperty({ description: 'Badge text in English', nullable: true })
  @Expose()
  badgeTextEn: string;

  @ApiProperty({ description: 'Badge text in Arabic', nullable: true })
  @Expose()
  badgeTextAr: string;

  @ApiProperty({ description: 'Badge CSS class', nullable: true })
  @Expose()
  badgeClass: string;
}

/**
 * Admin response DTO for promotional cards
 *
 * Includes all fields including analytics and audit data
 */
export class PromoCardAdminResponseDto extends PromoCardPublicResponseDto {
  @ApiProperty({ description: 'Whether card is active' })
  @Expose()
  isActive: boolean;

  @ApiProperty({
    description: 'Approval status',
    enum: ['draft', 'pending', 'approved', 'rejected'],
  })
  @Expose()
  approvalStatus: string;

  @ApiProperty({ description: 'Campaign start date', nullable: true })
  @Expose()
  startDate: Date;

  @ApiProperty({ description: 'Campaign end date', nullable: true })
  @Expose()
  endDate: Date;

  @ApiProperty({ description: 'Total impressions' })
  @Expose()
  impressions: number;

  @ApiProperty({ description: 'Total clicks' })
  @Expose()
  clicks: number;

  @ApiProperty({ description: 'Click-through rate percentage' })
  @Expose()
  clickThroughRate: number;

  @ApiProperty({ description: 'Performance score (0-100)' })
  @Expose()
  performanceScore: number;

  @ApiProperty({ description: 'Created by user ID', nullable: true })
  @Expose()
  createdBy: string;

  @ApiProperty({ description: 'Updated by user ID', nullable: true })
  @Expose()
  updatedBy: string;

  @ApiProperty({ description: 'Creation timestamp' })
  @Expose()
  @Type(() => Date)
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @Expose()
  @Type(() => Date)
  updatedAt: Date;

  @ApiProperty({ description: 'Soft delete timestamp', nullable: true })
  @Expose()
  @Type(() => Date)
  deletedAt: Date;
}

/**
 * Analytics response DTO for promotional cards
 */
export class PromoCardAnalyticsDto {
  @ApiProperty({ description: 'Promo card UUID' })
  @Expose()
  cardId: string;

  @ApiProperty({ description: 'Total impressions' })
  @Expose()
  impressions: number;

  @ApiProperty({ description: 'Total clicks' })
  @Expose()
  clicks: number;

  @ApiProperty({ description: 'Click-through rate percentage' })
  @Expose()
  clickThroughRate: number;

  @ApiProperty({ description: 'Performance score (0-100)' })
  @Expose()
  performanceScore: number;

  @ApiProperty({ description: 'Days active' })
  @Expose()
  daysActive: number;

  @ApiProperty({ description: 'Last updated timestamp' })
  @Expose()
  @Type(() => Date)
  lastUpdated: Date;
}
