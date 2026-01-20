import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt } from 'class-validator';
import { ShipmentStatus } from './shipment-status.enum';

export class UpdateShipmentStatusDto {
  @ApiProperty({ example: 301 })
  @IsInt()
  shipment_id: number;

  @ApiProperty({
    enum: ShipmentStatus,
    example: ShipmentStatus.OUT_FOR_DELIVERY,
  })
  @IsEnum(ShipmentStatus)
  new_status: ShipmentStatus;
}
