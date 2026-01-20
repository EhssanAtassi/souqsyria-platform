/**
 * @file SyncCartRequest.dto.ts
 * @description DTO for cart synchronization requests in SouqSyria E-commerce Platform
 *
 * PURPOSE:
 * - Validate cart sync requests from client (Angular/mobile)
 * - Handle multi-device cart synchronization
 * - Support offline-to-online cart reconciliation
 * - Enable conflict resolution with version tracking
 *
 * USAGE:
 * - POST /cart/sync endpoint
 * - Client sends current cart state with version
 * - Server resolves conflicts and returns updated cart
 *
 * @author SouqSyria Development Team
 * @since 2025-11-12
 * @version 1.0.0
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  Max,
  ValidateNested,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Cart Item DTO for sync request
 * Represents a single item in the cart to be synchronized
 */
export class SyncCartItemDto {
  /**
   * Product variant ID
   * References the specific product variant in the catalog
   */
  @ApiProperty({
    description: 'Product variant ID',
    example: 123,
    type: Number,
  })
  @IsInt()
  @Min(1)
  variantId: number;

  /**
   * Quantity of this item in cart
   * Must be between 1 and 50 per Syrian market business rules
   */
  @ApiProperty({
    description: 'Quantity of item in cart (1-50)',
    example: 2,
    minimum: 1,
    maximum: 50,
  })
  @IsInt()
  @Min(1, { message: 'Quantity must be at least 1' })
  @Max(50, { message: 'Maximum quantity per item is 50' })
  quantity: number;

  /**
   * Price at which item was added to cart
   * Used for price locking feature (7-day price guarantee)
   */
  @ApiProperty({
    description:
      'Price when item was added to cart (for price lock feature)',
    example: 125000,
    type: Number,
  })
  @IsNumber()
  @Min(0)
  priceAtAdd: number;

  /**
   * Timestamp when item was added to cart
   * Used for conflict resolution and price lock expiration
   */
  @ApiProperty({
    description:
      'ISO 8601 timestamp when item was added to cart',
    example: '2025-11-12T10:30:00.000Z',
    type: String,
  })
  @IsDateString()
  addedAt: string;

  /**
   * Optional: Campaign/promotion code
   * Tracks marketing attribution for analytics
   */
  @ApiProperty({
    description:
      'Campaign code if item was added via promotion',
    example: 'ramadan_sale_2025',
    required: false,
  })
  @IsOptional()
  @IsString()
  addedFromCampaign?: string;
}

/**
 * Sync Cart Request DTO
 * Main request body for cart synchronization endpoint
 */
export class SyncCartRequest {
  /**
   * Array of cart items to synchronize
   * Maximum 100 items per cart (business rule)
   */
  @ApiProperty({
    description:
      'Array of cart items to synchronize (max 100 items)',
    type: [SyncCartItemDto],
    example: [
      {
        variantId: 123,
        quantity: 2,
        priceAtAdd: 125000,
        addedAt: '2025-11-12T10:30:00.000Z',
      },
      {
        variantId: 456,
        quantity: 1,
        priceAtAdd: 80000,
        addedAt: '2025-11-12T11:45:00.000Z',
        addedFromCampaign: 'eid_special',
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncCartItemDto)
  items: SyncCartItemDto[];

  /**
   * Client cart version number
   * Used for optimistic locking and conflict detection
   */
  @ApiProperty({
    description:
      'Client cart version for conflict detection (optimistic locking)',
    example: 5,
    type: Number,
  })
  @IsInt()
  @Min(0)
  clientVersion: number;

  /**
   * Client timestamp of last cart modification
   * Used for conflict resolution (last-write-wins strategy)
   */
  @ApiProperty({
    description:
      'ISO 8601 timestamp of last client cart modification',
    example: '2025-11-12T12:00:00.000Z',
    type: String,
  })
  @IsDateString()
  clientTimestamp: string;

  /**
   * Optional: Guest session ID if syncing guest cart
   * Required if user is not authenticated
   */
  @ApiProperty({
    description: 'Guest session ID (required for guest users)',
    example: 'a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  guestSessionId?: string;

  /**
   * Optional: User ID if syncing authenticated cart
   * Required if user is authenticated
   */
  @ApiProperty({
    description: 'User ID (required for authenticated users)',
    example: 789,
    required: false,
  })
  @IsOptional()
  @IsInt()
  userId?: number;

  /**
   * Optional: Idempotency key for preventing duplicate syncs
   * Recommended for retry scenarios and offline-to-online reconciliation
   * Should be a client-generated UUID v4 string
   */
  @ApiProperty({
    description:
      'Idempotency key to prevent duplicate sync operations (UUID v4 format recommended)',
    example: 'a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6',
    required: false,
  })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;

  /**
   * Optional: Currency code
   * Defaults to SYP (Syrian Pound) if not specified
   */
  @ApiProperty({
    description: 'Currency code (defaults to SYP)',
    example: 'SYP',
    default: 'SYP',
    required: false,
  })
  @IsOptional()
  @IsString()
  currency?: string;
}
