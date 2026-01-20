/**
 * @file track-analytics.dto.ts
 * @description DTOs for tracking hero banner analytics events
 *
 * @swagger
 * components:
 *   schemas:
 *     TrackImpressionDto:
 *       type: object
 *       description: DTO for tracking banner impressions
 *
 * @author SouqSyria Development Team
 * @since 2025-10-07
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  IsOptional,
  IsUUID,
  IsDateString,
  IsEnum,
  IsObject,
} from 'class-validator';

/**
 * Track Impression DTO
 *
 * Records banner view/impression events
 */
export class TrackImpressionDto {
  @ApiProperty({
    description: 'Banner ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  bannerId: string;

  @ApiProperty({
    description: 'Position in carousel (0-based index)',
    example: 0,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  position: number;

  @ApiPropertyOptional({
    description: 'How the impression occurred',
    enum: ['auto', 'manual', 'keyboard'],
    example: 'auto',
  })
  @IsEnum(['auto', 'manual', 'keyboard'])
  @IsOptional()
  method?: 'auto' | 'manual' | 'keyboard';

  @ApiPropertyOptional({
    description: 'User session ID for tracking',
    example: 'session-abc123',
  })
  @IsString()
  @IsOptional()
  sessionId?: string;

  @ApiPropertyOptional({
    description: 'User IP address (anonymized)',
    example: '192.168.1.1',
  })
  @IsString()
  @IsOptional()
  ipAddress?: string;

  @ApiPropertyOptional({
    description: 'User agent string',
  })
  @IsString()
  @IsOptional()
  userAgent?: string;

  @ApiProperty({
    description: 'Timestamp of the impression (ISO 8601)',
    example: '2024-01-15T10:30:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  timestamp: Date;
}

/**
 * Track Click DTO
 *
 * Records banner click events
 */
export class TrackClickDto {
  @ApiProperty({
    description: 'Banner ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  bannerId: string;

  @ApiProperty({
    description: 'Position in carousel (0-based index)',
    example: 0,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  position: number;

  @ApiProperty({
    description: 'Target URL that was clicked',
    example: '/category/damascus-steel',
  })
  @IsString()
  @IsNotEmpty()
  targetUrl: string;

  @ApiPropertyOptional({
    description: 'User session ID for tracking',
    example: 'session-abc123',
  })
  @IsString()
  @IsOptional()
  sessionId?: string;

  @ApiPropertyOptional({
    description: 'User IP address (anonymized)',
    example: '192.168.1.1',
  })
  @IsString()
  @IsOptional()
  ipAddress?: string;

  @ApiPropertyOptional({
    description: 'User agent string',
  })
  @IsString()
  @IsOptional()
  userAgent?: string;

  @ApiProperty({
    description: 'Timestamp of the click (ISO 8601)',
    example: '2024-01-15T10:30:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  timestamp: Date;
}

/**
 * Track CTA Click DTO
 *
 * Records CTA button click events
 */
export class TrackCTAClickDto {
  @ApiProperty({
    description: 'Banner ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  bannerId: string;

  @ApiProperty({
    description: 'CTA button text that was clicked',
    example: 'Shop Damascus Steel',
  })
  @IsString()
  @IsNotEmpty()
  ctaText: string;

  @ApiProperty({
    description: 'Position in carousel (0-based index)',
    example: 0,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  position: number;

  @ApiPropertyOptional({
    description: 'CTA type or variant',
    example: 'primary',
  })
  @IsString()
  @IsOptional()
  ctaType?: string;

  @ApiPropertyOptional({
    description: 'User session ID for tracking',
    example: 'session-abc123',
  })
  @IsString()
  @IsOptional()
  sessionId?: string;

  @ApiPropertyOptional({
    description: 'User IP address (anonymized)',
    example: '192.168.1.1',
  })
  @IsString()
  @IsOptional()
  ipAddress?: string;

  @ApiPropertyOptional({
    description: 'User agent string',
  })
  @IsString()
  @IsOptional()
  userAgent?: string;

  @ApiProperty({
    description: 'Timestamp of the CTA click (ISO 8601)',
    example: '2024-01-15T10:30:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  timestamp: Date;
}

/**
 * Track Conversion DTO
 *
 * Records conversion events attributed to banner
 */
export class TrackConversionDto {
  @ApiProperty({
    description: 'Banner ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  bannerId: string;

  @ApiProperty({
    description: 'Order ID associated with conversion',
    example: 'ORDER-2024-001234',
  })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({
    description: 'Revenue amount in SYP',
    example: 150000,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  revenueAmount: number;

  @ApiPropertyOptional({
    description: 'User session ID for attribution',
    example: 'session-abc123',
  })
  @IsString()
  @IsOptional()
  sessionId?: string;

  @ApiProperty({
    description: 'Timestamp of the conversion (ISO 8601)',
    example: '2024-01-15T10:30:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  timestamp: Date;
}

/**
 * Banner Analytics Response DTO
 *
 * Returns aggregated analytics for a banner
 */
export class BannerAnalyticsResponseDto {
  @ApiProperty({ description: 'Banner ID' })
  bannerId: string;

  @ApiProperty({ description: 'Total impressions' })
  impressions: number;

  @ApiProperty({ description: 'Total clicks' })
  clicks: number;

  @ApiProperty({ description: 'Click-through rate percentage' })
  clickThroughRate: number;

  @ApiProperty({ description: 'Total conversions' })
  conversions: number;

  @ApiProperty({ description: 'Conversion rate percentage' })
  conversionRate: number;

  @ApiProperty({ description: 'Total revenue in SYP' })
  revenue: number;

  @ApiProperty({ description: 'Average revenue per impression' })
  revenuePerImpression: number;

  @ApiProperty({ description: 'Average revenue per click' })
  revenuePerClick: number;

  @ApiProperty({ description: 'Performance score (0-100)' })
  performanceScore: number;

  @ApiProperty({ description: 'Last analytics update timestamp' })
  lastUpdated: Date;
}
