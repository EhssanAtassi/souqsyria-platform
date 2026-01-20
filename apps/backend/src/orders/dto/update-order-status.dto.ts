import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateOrderStatusDto {
  @ApiProperty({ example: 432 })
  @IsString()
  order_id: string;

  @ApiProperty({
    example: 'shipped',
    enum: [
      'pending',
      'confirmed',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
      'returned',
      'refunded',
    ],
  })
  @IsString()
  new_status: string;

  @ApiProperty({
    required: false,
    example: 'Customer confirmed address by phone',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
