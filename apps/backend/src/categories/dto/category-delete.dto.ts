/**
 * @file category-delete.dto.ts
 * @description DTOs for category deletion operations
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class DeleteCategoryDto {
  @ApiPropertyOptional({
    example: false,
    description: 'Whether to cascade delete all child categories',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  cascade?: boolean = false;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether to move children to parent category',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  moveChildrenToParent?: boolean = false;

  @ApiPropertyOptional({
    example: 'Category no longer needed',
    description: 'Reason for deletion (for audit trail)',
  })
  @IsOptional()
  deletionReason?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Force deletion even if category has products',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  forceDelete?: boolean = false;
}

export class CategoryDeleteResult {
  @ApiProperty({
    example: true,
    description: 'Whether deletion was successful',
  })
  success: boolean;

  @ApiProperty({
    example: 'Category "Old Electronics" deleted successfully',
    description: 'Human-readable message',
  })
  message: string;

  @ApiProperty({
    example: [1, 2, 3],
    description: 'IDs of categories that were affected by the deletion',
  })
  affectedCategories: number[];

  @ApiProperty({
    example: [4, 5],
    description: 'IDs of child categories that were moved',
  })
  movedChildren: number[];

  @ApiProperty({
    example: 245,
    description: 'Time taken for deletion operation in milliseconds',
  })
  processingTimeMs: number;

  @ApiPropertyOptional({
    example: {
      productsCount: 0,
      childrenHandled: 2,
      metricsUpdated: true,
    },
    description: 'Additional details about the deletion',
  })
  details?: {
    productsCount: number;
    childrenHandled: number;
    metricsUpdated: boolean;
    cacheCleared?: boolean;
  };
}

export class CategoryRestoreResult {
  @ApiProperty({
    example: true,
    description: 'Whether restoration was successful',
  })
  success: boolean;

  @ApiProperty({
    example: 'Category "Electronics" restored successfully',
    description: 'Human-readable message',
  })
  message: string;

  @ApiProperty({
    example: 1,
    description: 'ID of the restored category',
  })
  categoryId: number;

  @ApiProperty({
    example: 245,
    description: 'Time taken for restoration in milliseconds',
  })
  processingTimeMs: number;

  @ApiPropertyOptional({
    example: {
      hierarchyRecalculated: true,
      metricsUpdated: true,
      childrenCount: 3,
    },
    description: 'Additional details about the restoration',
  })
  details?: {
    hierarchyRecalculated: boolean;
    metricsUpdated: boolean;
    childrenCount: number;
  };
}
