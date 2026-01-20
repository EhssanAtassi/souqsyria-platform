import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class ConfirmDeliveryDto {
  @ApiProperty({ example: 301 })
  @IsInt()
  shipment_id: number;

  @ApiProperty({ example: 'signature', enum: ['signature', 'photo', 'otp'] })
  @IsString()
  proof_type: 'signature' | 'photo' | 'otp';

  @ApiProperty({ example: 'Signed by customer at door' })
  @IsOptional()
  @IsString()
  proof_data?: string;
}
