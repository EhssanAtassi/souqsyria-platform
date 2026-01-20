import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional } from 'class-validator';

export class ConfirmPaymentDto {
  @ApiProperty({ example: 9876 })
  @IsNumber()
  paymentTransactionId: number;

  @ApiPropertyOptional({ example: 'abc123-transaction-ref' })
  @IsOptional()
  @IsString()
  gatewayTransactionId?: string;

  @ApiPropertyOptional({
    type: 'object',
    description: 'Gateway response JSON',
    additionalProperties: true, // <--- FIX: allows arbitrary object
  })
  @IsOptional()
  gatewayResponse?: any;
}
