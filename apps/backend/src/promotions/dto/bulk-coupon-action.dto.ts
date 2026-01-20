import { IsArray, IsEnum, ArrayNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum BulkAction {
  ACTIVATE = 'activate',
  DEACTIVATE = 'deactivate',
  DELETE = 'delete',
}

export class BulkCouponActionDto {
  @ApiProperty({ description: 'Array of coupon IDs to perform action on' })
  @IsArray()
  @ArrayNotEmpty()
  coupon_ids: number[];

  @ApiProperty({ enum: BulkAction, description: 'Action to perform' })
  @IsEnum(BulkAction)
  action: BulkAction;
}
