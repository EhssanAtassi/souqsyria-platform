import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for transferring stock from one warehouse to another.
 */
export class TransferStockDto {
  @ApiProperty({ example: 101 })
  @IsInt()
  variant_id: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  from_warehouse_id: number;

  @ApiProperty({ example: 2 })
  @IsInt()
  to_warehouse_id: number;

  @ApiProperty({ example: 15 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 'Rebalancing between locations', required: false })
  @IsOptional()
  @IsString()
  note?: string;
}
