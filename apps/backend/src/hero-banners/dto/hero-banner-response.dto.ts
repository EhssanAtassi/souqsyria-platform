/**
 * @file hero-banner-response.dto.ts
 * @description Response DTOs for hero banner API endpoints
 *
 * @swagger
 * components:
 *   schemas:
 *     HeroBannerResponseDto:
 *       type: object
 *       description: Complete hero banner data for API responses
 *
 * @author SouqSyria Development Team
 * @since 2025-10-07
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Transform } from 'class-transformer';

/**
 * Complete Hero Banner Response DTO
 *
 * Used for detailed banner information in API responses
 */
export class HeroBannerResponseDto {
  @ApiProperty({ description: 'Banner unique identifier' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Banner name (English)' })
  @Expose()
  nameEn: string;

  @ApiProperty({ description: 'Banner name (Arabic)' })
  @Expose()
  nameAr: string;

  @ApiProperty({ description: 'Headline (English)' })
  @Expose()
  headlineEn: string;

  @ApiProperty({ description: 'Headline (Arabic)' })
  @Expose()
  headlineAr: string;

  @ApiPropertyOptional({ description: 'Subheadline (English)' })
  @Expose()
  subheadlineEn?: string;

  @ApiPropertyOptional({ description: 'Subheadline (Arabic)' })
  @Expose()
  subheadlineAr?: string;

  @ApiProperty({ description: 'Desktop image URL' })
  @Expose()
  imageUrlDesktop: string;

  @ApiPropertyOptional({ description: 'Tablet image URL' })
  @Expose()
  imageUrlTablet?: string;

  @ApiPropertyOptional({ description: 'Mobile image URL' })
  @Expose()
  imageUrlMobile?: string;

  @ApiProperty({ description: 'Image alt text (English)' })
  @Expose()
  imageAltEn: string;

  @ApiProperty({ description: 'Image alt text (Arabic)' })
  @Expose()
  imageAltAr: string;

  @ApiProperty({ description: 'CTA button text (English)' })
  @Expose()
  ctaTextEn: string;

  @ApiProperty({ description: 'CTA button text (Arabic)' })
  @Expose()
  ctaTextAr: string;

  @ApiProperty({ description: 'CTA button variant' })
  @Expose()
  ctaVariant: string;

  @ApiProperty({ description: 'CTA button size' })
  @Expose()
  ctaSize: string;

  @ApiProperty({ description: 'CTA button color' })
  @Expose()
  ctaColor: string;

  @ApiPropertyOptional({ description: 'CTA icon' })
  @Expose()
  ctaIcon?: string;

  @ApiProperty({ description: 'CTA icon position' })
  @Expose()
  ctaIconPosition: string;

  @ApiProperty({ description: 'CTA visibility' })
  @Expose()
  ctaVisible: boolean;

  @ApiProperty({ description: 'Target route type' })
  @Expose()
  targetType: string;

  @ApiProperty({ description: 'Target URL' })
  @Expose()
  targetUrl: string;

  @ApiPropertyOptional({ description: 'Tracking source' })
  @Expose()
  trackingSource?: string;

  @ApiPropertyOptional({ description: 'Tracking medium' })
  @Expose()
  trackingMedium?: string;

  @ApiPropertyOptional({ description: 'Tracking campaign' })
  @Expose()
  trackingCampaign?: string;

  @ApiProperty({ description: 'Text color' })
  @Expose()
  textColor: string;

  @ApiPropertyOptional({ description: 'Overlay color' })
  @Expose()
  overlayColor?: string;

  @ApiProperty({ description: 'Overlay opacity' })
  @Expose()
  overlayOpacity: number;

  @ApiProperty({ description: 'Content alignment' })
  @Expose()
  contentAlignment: string;

  @ApiProperty({ description: 'Content vertical alignment' })
  @Expose()
  contentVerticalAlignment: string;

  @ApiProperty({ description: 'Banner type' })
  @Expose()
  type: string;

  @ApiProperty({ description: 'Display priority' })
  @Expose()
  priority: number;

  @ApiProperty({ description: 'Schedule start date' })
  @Expose()
  scheduleStart: Date;

  @ApiProperty({ description: 'Schedule end date' })
  @Expose()
  scheduleEnd: Date;

  @ApiProperty({ description: 'Timezone' })
  @Expose()
  timezone: string;

  @ApiProperty({ description: 'Total impressions' })
  @Expose()
  impressions: number;

  @ApiProperty({ description: 'Total clicks' })
  @Expose()
  clicks: number;

  @ApiProperty({ description: 'Click-through rate percentage' })
  @Expose()
  clickThroughRate: number;

  @ApiProperty({ description: 'Total conversions' })
  @Expose()
  conversions: number;

  @ApiProperty({ description: 'Conversion rate percentage' })
  @Expose()
  conversionRate: number;

  @ApiProperty({ description: 'Revenue in SYP' })
  @Expose()
  revenue: number;

  @ApiPropertyOptional({ description: 'Analytics last updated' })
  @Expose()
  analyticsUpdatedAt?: Date;

  @ApiPropertyOptional({ description: 'Syrian region' })
  @Expose()
  syrianRegion?: string;

  @ApiPropertyOptional({ description: 'Syrian specialties' })
  @Expose()
  syrianSpecialties?: string[];

  @ApiPropertyOptional({ description: 'Cultural context (English)' })
  @Expose()
  culturalContextEn?: string;

  @ApiPropertyOptional({ description: 'Cultural context (Arabic)' })
  @Expose()
  culturalContextAr?: string;

  @ApiProperty({ description: 'UNESCO recognition' })
  @Expose()
  unescoRecognition: boolean;

  @ApiPropertyOptional({ description: 'Artisan name (English)' })
  @Expose()
  artisanNameEn?: string;

  @ApiPropertyOptional({ description: 'Artisan name (Arabic)' })
  @Expose()
  artisanNameAr?: string;

  @ApiPropertyOptional({ description: 'Artisan bio (English)' })
  @Expose()
  artisanBioEn?: string;

  @ApiPropertyOptional({ description: 'Artisan bio (Arabic)' })
  @Expose()
  artisanBioAr?: string;

  @ApiPropertyOptional({ description: 'Artisan location' })
  @Expose()
  artisanLocation?: string;

  @ApiPropertyOptional({ description: 'Artisan experience years' })
  @Expose()
  artisanExperience?: number;

  @ApiProperty({ description: 'Approval status' })
  @Expose()
  approvalStatus: string;

  @ApiPropertyOptional({ description: 'Approved by user ID' })
  @Expose()
  approvedBy?: number;

  @ApiPropertyOptional({ description: 'Approval timestamp' })
  @Expose()
  approvedAt?: Date;

  @ApiPropertyOptional({ description: 'Rejection reason' })
  @Expose()
  rejectionReason?: string;

  @ApiProperty({ description: 'Active status' })
  @Expose()
  isActive: boolean;

  @ApiPropertyOptional({ description: 'Created by user ID' })
  @Expose()
  createdBy?: number;

  @ApiPropertyOptional({ description: 'Updated by user ID' })
  @Expose()
  updatedBy?: number;

  @ApiProperty({ description: 'Version number' })
  @Expose()
  version: number;

  @ApiPropertyOptional({ description: 'Tags' })
  @Expose()
  tags?: string[];

  @ApiProperty({ description: 'Creation timestamp' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @Expose()
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Deletion timestamp' })
  @Expose()
  deletedAt?: Date;
}

/**
 * Simplified Hero Banner Response for Public API
 *
 * Excludes sensitive admin fields and internal metadata
 */
export class HeroBannerPublicResponseDto {
  @ApiProperty({ description: 'Banner unique identifier' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Banner name (English)' })
  @Expose()
  nameEn: string;

  @ApiProperty({ description: 'Banner name (Arabic)' })
  @Expose()
  nameAr: string;

  @ApiProperty({ description: 'Headline (English)' })
  @Expose()
  headlineEn: string;

  @ApiProperty({ description: 'Headline (Arabic)' })
  @Expose()
  headlineAr: string;

  @ApiPropertyOptional({ description: 'Subheadline (English)' })
  @Expose()
  subheadlineEn?: string;

  @ApiPropertyOptional({ description: 'Subheadline (Arabic)' })
  @Expose()
  subheadlineAr?: string;

  @ApiProperty({ description: 'Desktop image URL' })
  @Expose()
  imageUrlDesktop: string;

  @ApiPropertyOptional({ description: 'Tablet image URL' })
  @Expose()
  imageUrlTablet?: string;

  @ApiPropertyOptional({ description: 'Mobile image URL' })
  @Expose()
  imageUrlMobile?: string;

  @ApiProperty({ description: 'Image alt text (English)' })
  @Expose()
  imageAltEn: string;

  @ApiProperty({ description: 'Image alt text (Arabic)' })
  @Expose()
  imageAltAr: string;

  @ApiProperty({ description: 'CTA button text (English)' })
  @Expose()
  ctaTextEn: string;

  @ApiProperty({ description: 'CTA button text (Arabic)' })
  @Expose()
  ctaTextAr: string;

  @ApiProperty({ description: 'CTA button variant' })
  @Expose()
  ctaVariant: string;

  @ApiProperty({ description: 'CTA button size' })
  @Expose()
  ctaSize: string;

  @ApiProperty({ description: 'CTA button color' })
  @Expose()
  ctaColor: string;

  @ApiPropertyOptional({ description: 'CTA icon' })
  @Expose()
  ctaIcon?: string;

  @ApiProperty({ description: 'CTA icon position' })
  @Expose()
  ctaIconPosition: string;

  @ApiProperty({ description: 'CTA visibility' })
  @Expose()
  ctaVisible: boolean;

  @ApiProperty({ description: 'Target route type' })
  @Expose()
  targetType: string;

  @ApiProperty({ description: 'Target URL' })
  @Expose()
  targetUrl: string;

  @ApiProperty({ description: 'Text color' })
  @Expose()
  textColor: string;

  @ApiPropertyOptional({ description: 'Overlay color' })
  @Expose()
  overlayColor?: string;

  @ApiProperty({ description: 'Overlay opacity' })
  @Expose()
  overlayOpacity: number;

  @ApiProperty({ description: 'Content alignment' })
  @Expose()
  contentAlignment: string;

  @ApiProperty({ description: 'Content vertical alignment' })
  @Expose()
  contentVerticalAlignment: string;

  @ApiProperty({ description: 'Banner type' })
  @Expose()
  type: string;

  @ApiPropertyOptional({ description: 'Syrian region' })
  @Expose()
  syrianRegion?: string;

  @ApiPropertyOptional({ description: 'Syrian specialties' })
  @Expose()
  syrianSpecialties?: string[];

  @ApiPropertyOptional({ description: 'Cultural context (English)' })
  @Expose()
  culturalContextEn?: string;

  @ApiPropertyOptional({ description: 'Cultural context (Arabic)' })
  @Expose()
  culturalContextAr?: string;

  @ApiProperty({ description: 'UNESCO recognition' })
  @Expose()
  unescoRecognition: boolean;

  @ApiPropertyOptional({ description: 'Artisan name (English)' })
  @Expose()
  artisanNameEn?: string;

  @ApiPropertyOptional({ description: 'Artisan name (Arabic)' })
  @Expose()
  artisanNameAr?: string;

  @ApiPropertyOptional({ description: 'Artisan bio (English)' })
  @Expose()
  artisanBioEn?: string;

  @ApiPropertyOptional({ description: 'Artisan bio (Arabic)' })
  @Expose()
  artisanBioAr?: string;

  @ApiPropertyOptional({ description: 'Artisan location' })
  @Expose()
  artisanLocation?: string;

  @ApiPropertyOptional({ description: 'Artisan experience years' })
  @Expose()
  artisanExperience?: number;

  @ApiPropertyOptional({ description: 'Tags' })
  @Expose()
  tags?: string[];

  // Exclude sensitive fields
  @Exclude()
  impressions: number;

  @Exclude()
  clicks: number;

  @Exclude()
  clickThroughRate: number;

  @Exclude()
  conversions: number;

  @Exclude()
  conversionRate: number;

  @Exclude()
  revenue: number;

  @Exclude()
  approvalStatus: string;

  @Exclude()
  approvedBy: number;

  @Exclude()
  approvedAt: Date;

  @Exclude()
  rejectionReason: string;

  @Exclude()
  createdBy: number;

  @Exclude()
  updatedBy: number;

  @Exclude()
  version: number;

  @Exclude()
  createdAt: Date;

  @Exclude()
  updatedAt: Date;

  @Exclude()
  deletedAt: Date;
}

/**
 * Hero Banner List Item DTO
 *
 * Lightweight version for list endpoints
 */
export class HeroBannerListItemDto {
  @ApiProperty({ description: 'Banner unique identifier' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Banner name (English)' })
  @Expose()
  nameEn: string;

  @ApiProperty({ description: 'Banner name (Arabic)' })
  @Expose()
  nameAr: string;

  @ApiProperty({ description: 'Banner type' })
  @Expose()
  type: string;

  @ApiProperty({ description: 'Display priority' })
  @Expose()
  priority: number;

  @ApiProperty({ description: 'Schedule start date' })
  @Expose()
  scheduleStart: Date;

  @ApiProperty({ description: 'Schedule end date' })
  @Expose()
  scheduleEnd: Date;

  @ApiProperty({ description: 'Approval status' })
  @Expose()
  approvalStatus: string;

  @ApiProperty({ description: 'Active status' })
  @Expose()
  isActive: boolean;

  @ApiProperty({ description: 'Total impressions' })
  @Expose()
  impressions: number;

  @ApiProperty({ description: 'Total clicks' })
  @Expose()
  clicks: number;

  @ApiProperty({ description: 'Click-through rate percentage' })
  @Expose()
  clickThroughRate: number;

  @ApiProperty({ description: 'Creation timestamp' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @Expose()
  updatedAt: Date;
}
