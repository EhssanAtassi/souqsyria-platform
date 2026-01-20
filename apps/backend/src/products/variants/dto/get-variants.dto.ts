/**
 * @file get-variants.dto.ts
 * @description Optional filters for listing product variants.
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBooleanString } from 'class-validator';

export class GetProductVariantsDto {
  @ApiPropertyOptional({
    description: 'Filter only active variants',
    example: true,
  })
  @IsOptional()
  @IsBooleanString()
  isActive?: string; // must be string because of query string nature
}
