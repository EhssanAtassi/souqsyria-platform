import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, IsOptional, IsBoolean } from 'class-validator';

/**
 * DTO for bulk update of status fields (isActive, isPublished, etc.)
 */
export class BulkProductStatusDto {
  @ApiProperty({ type: [Number] })
  @IsArray()
  @IsInt({ each: true })
  ids: number[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
