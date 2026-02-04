import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetStockAlertsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  warehouse_id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  variant_id?: number;

  @ApiPropertyOptional({ enum: ['low_stock', 'critical_stock'] })
  @IsOptional()
  @IsEnum(['low_stock', 'critical_stock'])
  type?: 'low_stock' | 'critical_stock';

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  limit?: number;
}
