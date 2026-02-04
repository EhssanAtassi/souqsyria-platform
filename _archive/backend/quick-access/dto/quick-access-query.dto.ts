/**
 * @file quick-access-query.dto.ts
 * @description Query DTO for filtering and paginating Quick Access items
 *
 * @author SouqSyria Development Team
 * @since 2026-02-01
 * @version 1.0.0
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsInt, Min, Max, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * QuickAccessQueryDto
 *
 * @description Query parameters for filtering promotional cards.
 * Used primarily by admin endpoints for managing content.
 *
 * @swagger
 * components:
 *   schemas:
 *     QuickAccessQueryDto:
 *       type: object
 *       properties:
 *         isActive:
 *           type: boolean
 *           description: Filter by active status
 *         badgeClass:
 *           type: string
 *           description: Filter by badge class
 *         limit:
 *           type: integer
 *           description: Maximum number of items to return
 *         offset:
 *           type: integer
 *           description: Number of items to skip
 *         includeDeleted:
 *           type: boolean
 *           description: Include soft-deleted items (admin only)
 */
export class QuickAccessQueryDto {
  /**
   * Filter by active status
   * @example true
   */
  @ApiProperty({
    description: 'Filter by active status',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;

  /**
   * Filter by badge class
   * @example "badge-gold"
   */
  @ApiProperty({
    description: 'Filter by badge class',
    example: 'badge-gold',
    required: false,
    enum: ['badge-gold', 'badge-blue', 'badge-green', 'badge-purple', 'badge-orange', 'badge-red', 'badge-teal', 'badge-pink'],
  })
  @IsOptional()
  @IsString()
  badgeClass?: string;

  /**
   * Maximum number of items to return
   * @example 20
   */
  @ApiProperty({
    description: 'Maximum number of items to return',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 20;

  /**
   * Number of items to skip
   * @example 0
   */
  @ApiProperty({
    description: 'Number of items to skip for pagination',
    example: 0,
    minimum: 0,
    default: 0,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Transform(({ value }) => parseInt(value, 10))
  offset?: number = 0;

  /**
   * Include soft-deleted items (admin only)
   * @example false
   */
  @ApiProperty({
    description: 'Include soft-deleted items (admin only)',
    example: false,
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeDeleted?: boolean = false;
}