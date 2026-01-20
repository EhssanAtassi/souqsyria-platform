import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { AddressType } from './create-address.dto';

export class SetDefaultAddressDto {
  @ApiProperty({
    enum: AddressType,
    description: 'Address type to set as default',
  })
  @IsNotEmpty()
  @IsEnum(AddressType)
  addressType: AddressType;
}
