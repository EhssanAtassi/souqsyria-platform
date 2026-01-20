import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, IsOptional } from 'class-validator';

export class CreateShipmentDto {
  @ApiProperty({ example: 221 })
  @IsInt()
  order_id: number;

  @ApiProperty({ type: [Number], example: [1001, 1002] })
  @IsArray()
  order_item_ids: number[];

  @ApiProperty({ example: 2 })
  @IsInt()
  shipping_company_id: number;

  @ApiProperty({ example: '2024-05-12T18:00:00Z', required: false })
  @IsOptional()
  estimated_delivery_at?: string;
}
