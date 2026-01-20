/**
 * @file update-product-status.dto.ts
 * @description Used to toggle isActive / isPublished flags
 */
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateProductStatusDto {
  @ApiPropertyOptional({ description: 'Activate / deactivate product' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Show / hide product to users' })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
