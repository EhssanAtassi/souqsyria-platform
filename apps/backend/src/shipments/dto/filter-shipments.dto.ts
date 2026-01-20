import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt } from 'class-validator';

export class FilterShipmentsDto {
  @ApiProperty({ required: false, example: 'delivered' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ required: false, example: 101 })
  @IsOptional()
  @IsInt()
  order_id?: number;

  @ApiProperty({ required: false, example: 2 })
  @IsOptional()
  @IsInt()
  shipping_company_id?: number;
}
