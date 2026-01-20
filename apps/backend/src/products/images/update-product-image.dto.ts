import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class UpdateProductImageDto {
  @ApiProperty({ example: 1, description: 'Sort order (0 = main image)' })
  @IsInt()
  @Min(0)
  sortOrder: number;
}
