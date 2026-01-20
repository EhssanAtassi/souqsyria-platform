import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsEnum,
  IsArray,
} from 'class-validator';
import { RefundMethod } from '../enums/refund-method.enum';

/**
 * DTO for buyers or admins to initiate a refund request.
 * Sent to the RefundService to create a new refund transaction.
 */
export class RefundRequestDto {
  @ApiProperty({ example: 101, description: 'ID of the related order' })
  @IsInt()
  order_id: number;

  @ApiProperty({
    example: 302,
    description: 'ID of the original payment transaction',
  })
  @IsInt()
  payment_transaction_id: number;

  @ApiProperty({
    example: 15000.0,
    description: 'Refund amount in SYP or selected currency',
  })
  @IsNumber()
  amount: number;

  @ApiProperty({
    example: 'item_damaged',
    description: 'Internal code representing refund reason',
    required: false,
  })
  @IsOptional()
  @IsString()
  reason_code?: string;

  @ApiProperty({
    example: ['https://cdn.com/image1.jpg'],
    description: 'Optional evidence for refund (image URLs)',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  evidence?: string[];

  @ApiProperty({
    enum: RefundMethod,
    example: RefundMethod.MANUAL,
    description: 'Refund method to use (wallet/manual/card)',
  })
  @IsEnum(RefundMethod)
  method: RefundMethod;

  @ApiProperty({
    example: 'Customer provided photos of damaged product.',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
