/**
 * @file MergeCartRequest.dto.ts
 * @description DTO for cart merge requests in SouqSyria E-commerce Platform
 *
 * PURPOSE:
 * - Validate cart merge requests when guest user logs in
 * - Combine guest cart with existing user cart
 * - Handle cart migration from guest session to user account
 * - Support seamless authentication flow without losing cart
 *
 * BUSINESS RULES:
 * - Guest cart + User cart merged intelligently
 * - Duplicate items: quantities are combined
 * - Maximum 100 items per cart enforced
 * - If merge exceeds limit, prioritize newer items
 * - Guest session marked as 'converted' after merge
 *
 * USAGE:
 * - POST /cart/merge endpoint
 * - Triggered automatically on user login with guest cart
 * - Can be triggered manually via frontend cart merge button
 *
 * @author SouqSyria Development Team
 * @since 2025-11-12
 * @version 1.0.0
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsEnum, IsString } from 'class-validator';

/**
 * Merge strategy options
 * Defines how to handle conflicts when merging carts
 */
export enum MergeStrategy {
  /**
   * COMBINE: Add quantities for duplicate items
   * Default strategy - most user-friendly
   */
  COMBINE = 'combine',

  /**
   * KEEP_USER: Prioritize user cart, discard guest items if conflict
   * Conservative approach - preserves authenticated user's choices
   */
  KEEP_USER = 'keep_user',

  /**
   * KEEP_GUEST: Prioritize guest cart, replace user items if conflict
   * Optimistic approach - assumes latest (guest) choices are most relevant
   */
  KEEP_GUEST = 'keep_guest',

  /**
   * NEWER: Keep item with most recent addedAt timestamp
   * Time-based conflict resolution
   */
  NEWER = 'newer',
}

/**
 * Merge Cart Request DTO
 * Request body for merging guest cart into user cart on login
 */
export class MergeCartRequest {
  /**
   * Guest session ID to merge from
   * Identifies the guest cart to be merged
   */
  @ApiProperty({
    description: 'Guest session ID containing cart to merge',
    example: 'a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6',
    type: String,
  })
  @IsUUID('4', { message: 'Invalid guest session ID format' })
  guestSessionId: string;

  /**
   * Merge strategy
   * Optional: Defaults to COMBINE (most user-friendly)
   */
  @ApiProperty({
    description: 'Strategy for handling duplicate items during merge',
    enum: MergeStrategy,
    default: MergeStrategy.COMBINE,
    example: MergeStrategy.COMBINE,
    required: false,
  })
  @IsOptional()
  @IsEnum(MergeStrategy, {
    message: 'Invalid merge strategy',
  })
  strategy?: MergeStrategy;

  /**
   * Optional: Idempotency key for preventing duplicate merge operations
   * Recommended for retry scenarios to prevent double-merging
   * Should be a client-generated UUID v4 string
   */
  @ApiProperty({
    description:
      'Idempotency key to prevent duplicate merge operations (UUID v4 format recommended)',
    example: 'b2c3d4e5-f6g7-48h9-i0j1-k2l3m4n5o6p7',
    required: false,
  })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}

/**
 * Merge Cart Response DTO
 * Response returned after successful cart merge
 */
export class MergeCartResponse {
  /**
   * Success status
   */
  @ApiProperty({
    description: 'Whether merge was successful',
    example: true,
  })
  success: boolean;

  /**
   * Merged cart ID
   */
  @ApiProperty({
    description: 'ID of the merged user cart',
    example: 123,
  })
  cartId: number;

  /**
   * Total items in merged cart
   */
  @ApiProperty({
    description: 'Total number of items after merge',
    example: 8,
  })
  totalItems: number;

  /**
   * Items added from guest cart
   */
  @ApiProperty({
    description: 'Number of new items added from guest cart',
    example: 3,
  })
  itemsAdded: number;

  /**
   * Items with combined quantities
   */
  @ApiProperty({
    description: 'Number of items where quantities were combined',
    example: 2,
  })
  itemsCombined: number;

  /**
   * Items skipped due to limit
   */
  @ApiProperty({
    description: 'Number of items skipped (would exceed 100-item limit)',
    example: 0,
  })
  itemsSkipped: number;

  /**
   * Warnings or informational messages
   */
  @ApiProperty({
    description: 'Array of warning/info messages about merge',
    example: [
      '2 items had quantities combined',
      'Guest session marked as converted',
    ],
    type: [String],
  })
  messages: string[];

  /**
   * Guest session conversion status
   */
  @ApiProperty({
    description: 'Whether guest session was marked as converted',
    example: true,
  })
  guestSessionConverted: boolean;
}
