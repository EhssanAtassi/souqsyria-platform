/**
 * @file event-tracking.dto.ts
 * @description Data Transfer Objects for Event Tracking API
 *
 * @author SouqSyria Development Team
 * @since 2026-01-22
 * @version 1.0.0
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
  IsObject,
  Min,
  Max,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { EventType } from '../entities/user-event.entity';

/**
 * Track Event DTO
 * Used by frontend to send event tracking data
 */
export class TrackBIEventDto {
  @ApiProperty({
    description: 'Type of event being tracked',
    enum: EventType,
    example: EventType.PRODUCT_VIEW,
  })
  @IsEnum(EventType)
  eventType: EventType;

  @ApiPropertyOptional({
    description: 'Current page URL',
    example: '/products/wireless-headphones-123',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  pageUrl?: string;

  @ApiPropertyOptional({
    description: 'Human-readable page title',
    example: 'Wireless Headphones - SouqSyria',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  pageTitle?: string;

  @ApiPropertyOptional({
    description: 'Previous page URL (for navigation flow)',
    example: '/search?q=headphones',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  previousPageUrl?: string;

  @ApiPropertyOptional({
    description: 'Product ID for product-related events',
    example: 123,
  })
  @IsOptional()
  @IsNumber()
  productId?: number;

  @ApiPropertyOptional({
    description: 'Product SKU',
    example: 'WH-1000XM4-BLK',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  productSku?: string;

  @ApiPropertyOptional({
    description: 'Product name',
    example: 'Sony WH-1000XM4 Wireless Headphones',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  productName?: string;

  @ApiPropertyOptional({
    description: 'Product category',
    example: 'Electronics > Audio > Headphones',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  productCategory?: string;

  @ApiPropertyOptional({
    description: 'Product price at time of event',
    example: 349.99,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  productPrice?: number;

  @ApiPropertyOptional({
    description: 'Quantity for cart events',
    example: 2,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional({
    description: 'Total cart value',
    example: 699.98,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cartValue?: number;

  @ApiPropertyOptional({
    description: 'Search query text',
    example: 'wireless noise cancelling headphones',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  searchQuery?: string;

  @ApiPropertyOptional({
    description: 'Number of search results returned',
    example: 24,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  searchResultsCount?: number;

  @ApiPropertyOptional({
    description: 'Category ID',
    example: 5,
  })
  @IsOptional()
  @IsNumber()
  categoryId?: number;

  @ApiPropertyOptional({
    description: 'Category name',
    example: 'Electronics',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  categoryName?: string;

  @ApiPropertyOptional({
    description: 'Brand ID',
    example: 12,
  })
  @IsOptional()
  @IsNumber()
  brandId?: number;

  @ApiPropertyOptional({
    description: 'Brand name',
    example: 'Sony',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  brandName?: string;

  @ApiPropertyOptional({
    description: 'Order ID for conversion events',
    example: 789,
  })
  @IsOptional()
  @IsNumber()
  orderId?: number;

  @ApiPropertyOptional({
    description: 'Total order value',
    example: 699.98,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  orderValue?: number;

  @ApiPropertyOptional({
    description: 'Applied coupon code',
    example: 'SUMMER2024',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  couponCode?: string;

  @ApiPropertyOptional({
    description: 'Discount amount applied',
    example: 69.99,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @ApiPropertyOptional({
    description: 'Event duration in milliseconds (for video plays, page time, etc)',
    example: 45000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  eventDurationMs?: number;

  @ApiPropertyOptional({
    description: 'Percentage of page scrolled (0-100)',
    example: 75,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  scrollDepth?: number;

  @ApiPropertyOptional({
    description: 'Position of clicked element in list',
    example: 3,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  clickPosition?: number;

  @ApiPropertyOptional({
    description: 'Applied filter values',
    example: { price: { min: 200, max: 500 }, brand: ['Sony', 'Bose'] },
  })
  @IsOptional()
  @IsObject()
  filterValues?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Applied sort order',
    example: 'price_asc',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  sortOrder?: string;

  @ApiPropertyOptional({
    description: 'Error message for error events',
    example: 'Payment gateway timeout',
  })
  @IsOptional()
  @IsString()
  errorMessage?: string;

  @ApiPropertyOptional({
    description: 'Error code for debugging',
    example: 'PAY_TIMEOUT_001',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  errorCode?: string;

  @ApiPropertyOptional({
    description: 'A/B test variant identifier',
    example: 'variant_b',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  abTestVariant?: string;

  @ApiPropertyOptional({
    description: 'Additional event metadata',
    example: { experiment_id: 'exp_001', button_color: 'red' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Client-side timestamp when event occurred',
    example: '2024-01-22T10:30:00Z',
  })
  @IsOptional()
  @IsDateString()
  clientTimestamp?: Date;
}

/**
 * Analytics Query DTO
 * Used for querying analytics data with filters
 */
export class AnalyticsQueryDto {
  @ApiProperty({
    description: 'Start date for analytics query',
    example: '2024-01-01',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'End date for analytics query',
    example: '2024-01-31',
  })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({
    description: 'Filter by user ID',
    example: 123,
  })
  @IsOptional()
  @IsNumber()
  userId?: number;

  @ApiPropertyOptional({
    description: 'Filter by device type',
    enum: ['mobile', 'tablet', 'desktop'],
    example: 'mobile',
  })
  @IsOptional()
  @IsString()
  deviceType?: 'mobile' | 'tablet' | 'desktop';

  @ApiPropertyOptional({
    description: 'Filter by referrer source',
    example: 'google.com',
  })
  @IsOptional()
  @IsString()
  referrerSource?: string;
}

/**
 * Session Summary Response DTO
 */
export class SessionSummaryDto {
  @ApiProperty({ description: 'Session ID', example: 12345 })
  id: number;

  @ApiProperty({ description: 'Session token', example: 'abc123...' })
  sessionToken: string;

  @ApiProperty({ description: 'Session status', example: 'active' })
  status: string;

  @ApiProperty({ description: 'Session started at', example: '2024-01-22T10:00:00Z' })
  startedAt: Date;

  @ApiPropertyOptional({ description: 'Session ended at', example: '2024-01-22T10:45:00Z' })
  endedAt?: Date;

  @ApiProperty({ description: 'Session duration in seconds', example: 2700 })
  durationSeconds: number;

  @ApiProperty({ description: 'Number of events tracked', example: 25 })
  eventsCount: number;

  @ApiProperty({ description: 'Number of pages viewed', example: 8 })
  pageViews: number;

  @ApiProperty({ description: 'Number of products viewed', example: 5 })
  productsViewed: number;

  @ApiProperty({ description: 'Number of items added to cart', example: 2 })
  cartAdditions: number;

  @ApiProperty({ description: 'Total cart value', example: 699.98 })
  cartValue: number;

  @ApiPropertyOptional({ description: 'Order ID if converted', example: 789 })
  orderId?: number;

  @ApiPropertyOptional({ description: 'Order value if converted', example: 699.98 })
  orderValue?: number;
}
