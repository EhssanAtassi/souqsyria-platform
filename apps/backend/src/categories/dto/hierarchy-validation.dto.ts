/**
 * @file hierarchy-validation.dto.ts
 * @description DTOs for category hierarchy validation and operations
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Category } from '../entities/category.entity';

export class HierarchyValidationResult {
  @ApiProperty({
    type: () => Category,
    nullable: true,
    description: 'Parent category entity (null for root categories)',
  })
  parent: Category | null;

  @ApiProperty({
    example: 1,
    description: 'Calculated depth level for the new category',
  })
  depthLevel: number;

  @ApiProperty({
    example: 'Electronics/Smartphones',
    description: 'Calculated category path',
  })
  categoryPath: string;

  @ApiProperty({
    example: true,
    description: 'Whether the hierarchy validation passed',
  })
  isValid: boolean;

  @ApiProperty({
    example: false,
    description: 'Whether maximum depth limit would be reached',
  })
  maxDepthReached: boolean;

  @ApiPropertyOptional({
    example: ['Parent category is not approved'],
    description: 'Validation error messages if any',
  })
  validationErrors?: string[];

  @ApiPropertyOptional({
    example: ['This will be the 5th level in hierarchy'],
    description: 'Validation warnings',
  })
  warnings?: string[];
}

/**
 * DTO for hierarchy movement validation
 */
export class HierarchyMoveValidationDto {
  @ApiProperty({
    example: 1,
    description: 'Category ID being moved',
  })
  categoryId: number;

  @ApiProperty({
    example: 2,
    nullable: true,
    description: 'New parent category ID (null for root level)',
  })
  newParentId: number | null;

  @ApiProperty({
    example: true,
    description: 'Whether the move is valid',
  })
  isValidMove: boolean;

  @ApiProperty({
    example: false,
    description: 'Whether this move would create a circular hierarchy',
  })
  wouldCreateCircular: boolean;

  @ApiProperty({
    example: false,
    description: 'Whether this move would exceed maximum depth',
  })
  wouldExceedMaxDepth: boolean;

  @ApiProperty({
    example: 2,
    description: 'New depth level after the move',
  })
  newDepthLevel: number;

  @ApiProperty({
    example: 'Electronics/Smartphones/iPhone',
    description: 'New category path after the move',
  })
  newCategoryPath: string;

  @ApiProperty({
    example: 5,
    description: 'Number of descendant categories that would be affected',
  })
  affectedDescendantsCount: number;

  @ApiPropertyOptional({
    example: ['Cannot move to a child of itself'],
    description: 'Validation error messages',
  })
  errors?: string[];

  @ApiPropertyOptional({
    example: ['This move will affect 5 child categories'],
    description: 'Important warnings about the move',
  })
  warnings?: string[];
}
