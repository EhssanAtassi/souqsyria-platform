/**
 * 📥 FilterOrdersDto
 *
 * Supports admin filtering of orders by status, user, or date range.
 */

import { IsOptional, IsString, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FilterOrdersDto {
  @ApiProperty({ required: false, example: 'pending' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ required: false, example: 108 })
  @IsOptional()
  @IsInt()
  user_id?: number;

  @ApiProperty({ required: false, example: '2024-01-01' })
  @IsOptional()
  @IsString()
  from?: string;

  @ApiProperty({ required: false, example: '2024-12-31' })
  @IsOptional()
  @IsString()
  to?: string;
}
