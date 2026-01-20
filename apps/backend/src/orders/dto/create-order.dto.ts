import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsString,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderItemDto {
  @ApiProperty({ example: 101 })
  @IsInt()
  variant_id: number;

  @ApiProperty({ example: 2 })
  @IsInt()
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({ type: [CreateOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @ApiProperty({ example: 'card', enum: ['card', 'cod', 'invoice'] })
  @IsString()
  payment_method: string;

  @ApiProperty({ required: false, example: 'Please deliver after 6pm' })
  @IsOptional()
  @IsString()
  buyer_note?: string;

  @ApiProperty({ required: false, example: 'Happy Birthday!' })
  @IsOptional()
  @IsString()
  gift_message?: string;
}
