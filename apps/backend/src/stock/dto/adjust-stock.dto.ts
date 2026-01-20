import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for adjusting stock (inbound or outbound) for a specific product in a specific warehouse.
 */
export class AdjustStockDto {
  @ApiProperty({ example: 101 })
  @IsInt()
  variant_id: number;

  @ApiProperty({ example: 5 })
  @IsInt()
  warehouse_id: number;

  @ApiProperty({ example: 20 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ enum: ['in', 'out'], example: 'in' })
  @IsEnum(['in', 'out'])
  type: 'in' | 'out';

  @ApiProperty({ example: 'Initial stock load', required: false })
  @IsOptional()
  @IsString()
  note?: string;
}
