/**
 * @file category-move-result.dto.ts
 * @description DTO for category hierarchy move operation results
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CategoryMoveResult {
  @ApiProperty({
    example: true,
    description: 'Whether the move operation was successful',
  })
  success: boolean;

  @ApiProperty({
    example: 1,
    description: 'ID of the category that was moved',
  })
  categoryId: number;

  @ApiPropertyOptional({
    example: 2,
    description: 'Previous parent category ID',
  })
  oldParentId?: number;

  @ApiProperty({
    example: 3,
    nullable: true,
    description: 'New parent category ID (null for root level)',
  })
  newParentId: number | null;

  @ApiProperty({
    example: 1,
    description: 'Previous depth level',
  })
  oldDepthLevel: number;

  @ApiProperty({
    example: 2,
    description: 'New depth level after move',
  })
  newDepthLevel: number;

  @ApiProperty({
    example: [4, 5, 6],
    description: 'Array of descendant category IDs that were updated',
  })
  updatedDescendants: number[];

  @ApiProperty({
    example: 245,
    description: 'Time taken to complete the move operation in milliseconds',
  })
  processingTimeMs: number;

  @ApiProperty({
    example: 'Category "Smartphones" moved to "Electronics" successfully',
    description: 'Human-readable success message',
  })
  message: string;

  @ApiPropertyOptional({
    example: {
      oldPath: 'Electronics/Mobile/Smartphones',
      newPath: 'Electronics/Smartphones',
      affectedChildren: 3,
      metricsUpdated: true,
    },
    description: 'Additional details about the move operation',
  })
  details?: {
    oldPath: string;
    newPath: string;
    affectedChildren: number;
    metricsUpdated: boolean;
    cacheCleared?: boolean;
    parentMetricsUpdated?: boolean;
  };

  @ApiPropertyOptional({
    example: ['Child categories will inherit new approval constraints'],
    description: 'Important information about side effects of the move',
  })
  sideEffects?: string[];
}

/**
 * Bulk category move result for moving multiple categories
 */
export class BulkCategoryMoveResult {
  @ApiProperty({
    example: 5,
    description: 'Number of categories successfully moved',
  })
  successCount: number;

  @ApiProperty({
    example: 1,
    description: 'Number of categories that failed to move',
  })
  failureCount: number;

  @ApiProperty({
    type: [CategoryMoveResult],
    description: 'Results for each successful move operation',
  })
  successfulMoves: CategoryMoveResult[];

  @ApiProperty({
    example: [
      {
        categoryId: 7,
        error: 'Cannot move category: would create circular hierarchy',
        reason: 'CIRCULAR_HIERARCHY',
      },
    ],
    description: 'Details about failed move operations',
  })
  failures: Array<{
    categoryId: number;
    error: string;
    reason: string;
  }>;

  @ApiProperty({
    example: 1250,
    description: 'Total time taken for all move operations in milliseconds',
  })
  totalProcessingTimeMs: number;

  @ApiProperty({
    example: 'Bulk move completed: 5 successful, 1 failed',
    description: 'Summary message for the bulk operation',
  })
  summary: string;
}
