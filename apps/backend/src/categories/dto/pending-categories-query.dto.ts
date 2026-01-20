import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class PendingCategoriesQueryDto {
  @ApiProperty({
    description: 'Filter by specific approval status',
    enum: ['draft', 'pending', 'rejected'],
    required: false,
    example: 'pending',
  })
  @IsOptional()
  @IsIn(['draft', 'pending', 'rejected'])
  status?: 'draft' | 'pending' | 'rejected';

  @ApiProperty({
    description: 'Page number for pagination',
    example: 1,
    default: 1,
    minimum: 1,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Items per page (max 100)',
    example: 20,
    default: 20,
    minimum: 1,
    maximum: 100,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiProperty({
    description: 'Sort by field',
    enum: ['createdAt', 'updatedAt', 'nameEn'],
    default: 'createdAt',
    required: false,
  })
  @IsOptional()
  @IsIn(['createdAt', 'updatedAt', 'nameEn'])
  sortBy?: string = 'createdAt';

  @ApiProperty({
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
    required: false,
  })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
