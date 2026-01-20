import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsEnum, IsString } from 'class-validator';
import {
  PaymentMethod,
  PaymentStatus,
} from '../entities/payment-transaction.entity';

export class SearchPaymentsDto {
  @ApiPropertyOptional({ example: 12345 })
  @IsOptional()
  @IsNumber()
  orderId?: number;

  @ApiPropertyOptional({ enum: PaymentMethod })
  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod;

  @ApiPropertyOptional({ enum: PaymentStatus })
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @ApiPropertyOptional({ example: 'SYP' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({
    example: '2024-01-01',
    description: 'Created after date',
  })
  @IsOptional()
  @IsString()
  createdAfter?: string;

  @ApiPropertyOptional({
    example: '2024-01-31',
    description: 'Created before date',
  })
  @IsOptional()
  @IsString()
  createdBefore?: string;
}
