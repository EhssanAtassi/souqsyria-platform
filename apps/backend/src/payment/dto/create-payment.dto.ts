import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsString,
  IsOptional,
  IsPositive,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '../entities/payment-transaction.entity';

/**
 * Payment details DTO for method-specific information
 */
export class PaymentDetailsDto {
  @ApiProperty({
    example: '+963912345678',
    required: false,
    description: 'Phone number for cash on delivery',
  })
  @IsOptional()
  @IsString()
  cod_phone?: string;

  @ApiProperty({
    example: 'syriatel_cash',
    required: false,
    description: 'Payment provider for mobile payments',
  })
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiProperty({
    example: 'TXN123456789',
    required: false,
    description: 'Transaction ID from payment provider',
  })
  @IsOptional()
  @IsString()
  transaction_id?: string;

  @ApiProperty({
    example: 'ACCT123456',
    required: false,
    description: 'Account number for bank transfers',
  })
  @IsOptional()
  @IsString()
  account_number?: string;
}

export class CreatePaymentDto {
  @ApiProperty({
    example: 12345,
    description: 'Order ID to associate with payment',
  })
  @IsNumber()
  orderId: number;

  @ApiProperty({
    enum: PaymentMethod,
    example: PaymentMethod.CARD,
    description: 'Payment method to use',
  })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiProperty({ example: 10000.0, description: 'Payment amount' })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({ example: 'SYP', description: 'ISO currency code' })
  @IsString()
  currency: string;

  @ApiProperty({
    example: 'web',
    required: false,
    description: 'Channel where payment was initiated',
  })
  @IsOptional()
  @IsString()
  channel?: string;

  @ApiProperty({
    type: PaymentDetailsDto,
    required: false,
    description: 'Method-specific payment details',
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => PaymentDetailsDto)
  payment_details?: PaymentDetailsDto;
}
