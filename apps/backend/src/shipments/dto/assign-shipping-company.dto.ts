import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class AssignShippingCompanyDto {
  @ApiProperty({ example: 301 })
  @IsInt()
  shipment_id: number;

  @ApiProperty({ example: 2 })
  @IsInt()
  shipping_company_id: number;
}
