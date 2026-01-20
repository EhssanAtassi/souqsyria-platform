import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsPositive } from 'class-validator';

export class RefundPaymentDto {
  @ApiProperty({ example: 9876 })
  @IsNumber()
  paymentTransactionId: number;

  @ApiProperty({ example: 5000 })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({ example: 'Customer returned the item', required: false })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({
    description: 'Refund method',
    enum: ['wallet', 'manual', 'card'],
  })
  @IsOptional()
  @IsString()
  method: 'wallet' | 'manual' | 'card';
}
