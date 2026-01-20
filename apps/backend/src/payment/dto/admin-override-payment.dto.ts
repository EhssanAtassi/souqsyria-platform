import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsEnum, IsString, IsOptional } from 'class-validator';
import { PaymentStatus } from '../entities/payment-transaction.entity';

export class AdminOverridePaymentDto {
  @ApiProperty({ example: 9876 })
  @IsNumber()
  paymentTransactionId: number;

  @ApiProperty({ enum: PaymentStatus, example: PaymentStatus.PAID })
  @IsEnum(PaymentStatus)
  status: PaymentStatus;

  @ApiProperty({
    example: 'Manual override due to reconciliation',
    required: false,
  })
  @IsOptional()
  @IsString()
  comment?: string;
}
