/**
 * @file track-general-event.dto.ts
 * @description DTO for tracking general analytics events (products, categories, banners)
 *
 * Reuses the existing hero_analytics table structure but supports tracking
 * events for products, categories, and banners through optional IDs.
 *
 * @author SouqSyria Development Team
 * @since 2025-10-08
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
  IsObject,
  IsUUID,
} from 'class-validator';

/**
 * General Event Tracking DTO
 *
 * Supports tracking analytics events for:
 * - Hero banners (banner_id)
 * - Products (product_id)
 * - Categories (category_id)
 */
export class TrackGeneralEventDto {
  @ApiProperty({
    description: 'Type of analytics event',
    enum: ['impression', 'click', 'cta_click'],
    example: 'impression',
  })
  @IsEnum(['impression', 'click', 'cta_click'])
  event_type: 'impression' | 'click' | 'cta_click';

  @ApiProperty({
    description: 'Hero banner UUID (optional)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsString()
  banner_id?: string;

  @ApiProperty({
    description: 'Product ID (optional)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  product_id?: number;

  @ApiProperty({
    description: 'Category ID (optional)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  category_id?: number;

  @ApiProperty({
    description: 'User session ID for tracking',
    example: 'session_abc123',
  })
  @IsString()
  session_id: string;

  @ApiProperty({
    description: 'Additional metadata (device type, viewport, position, etc.)',
    example: {
      position: 0,
      device_type: 'desktop',
      viewport_width: 1920,
    },
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: any;
}
