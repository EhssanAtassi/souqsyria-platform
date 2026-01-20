import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class BulkStatusChangeDto {
  @ApiProperty({
    description: 'Array of category IDs to update',
    example: [1, 2, 3, 4, 5],
    type: [Number],
    minItems: 1,
    maxItems: 50,
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one category ID is required' })
  @ArrayMaxSize(50, {
    message: 'Cannot update more than 50 categories at once',
  })
  @IsNotEmpty({ each: true })
  categoryIds: number[];

  @ApiProperty({
    description: 'New approval status to set',
    enum: ['draft', 'pending', 'approved', 'rejected', 'suspended', 'archived'],
    example: 'approved',
  })
  @IsNotEmpty()
  @IsIn(['draft', 'pending', 'approved', 'rejected', 'suspended', 'archived'])
  newStatus:
    | 'draft'
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'suspended'
    | 'archived';

  @ApiProperty({
    description: 'Reason for status change (required for rejection)',
    example: 'Bulk approval after review meeting',
    required: false,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({
    description: 'Whether to activate categories when approving',
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  autoActivate?: boolean = true;
}
