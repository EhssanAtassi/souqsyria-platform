/**
 * @file reorder-quick-access.dto.ts
 * @description DTO for reordering Quick Access items
 *
 * @author SouqSyria Development Team
 * @since 2026-02-01
 * @version 1.0.0
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID, ArrayMinSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * ReorderItemDto
 *
 * @description Individual item in the reorder request
 */
class ReorderItemDto {
  /**
   * ID of the item to reorder
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  @ApiProperty({
    description: 'ID of the item to reorder',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  id: string;

  /**
   * New display order
   * @example 1
   */
  @ApiProperty({
    description: 'New display order',
    example: 1,
  })
  displayOrder: number;
}

/**
 * ReorderQuickAccessDto
 *
 * @description DTO for batch updating display order of promotional cards.
 * Used by admin to drag-and-drop reorder items.
 *
 * @swagger
 * components:
 *   schemas:
 *     ReorderQuickAccessDto:
 *       type: object
 *       required:
 *         - items
 *       properties:
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *               displayOrder:
 *                 type: integer
 */
export class ReorderQuickAccessDto {
  /**
   * Array of items with their new display orders
   */
  @ApiProperty({
    description: 'Array of items with their new display orders',
    type: [ReorderItemDto],
    example: [
      { id: '550e8400-e29b-41d4-a716-446655440000', displayOrder: 0 },
      { id: '550e8400-e29b-41d4-a716-446655440001', displayOrder: 1 },
      { id: '550e8400-e29b-41d4-a716-446655440002', displayOrder: 2 },
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReorderItemDto)
  items: ReorderItemDto[];
}