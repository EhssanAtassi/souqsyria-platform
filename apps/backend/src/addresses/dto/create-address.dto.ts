import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsPhoneNumber,
  IsNumber,
  IsLatitude,
  IsLongitude,
  IsEnum,
  Length,
  MaxLength,
} from 'class-validator';

export enum AddressType {
  SHIPPING = 'shipping',
  BILLING = 'billing',
}

export class CreateAddressDto {
  @ApiProperty({
    example: 'Home',
    description: 'Label for the address (e.g. Home, Office)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  label?: string;

  @ApiProperty({ enum: AddressType, default: AddressType.SHIPPING })
  @IsEnum(AddressType)
  @IsOptional()
  addressType?: AddressType;

  @ApiProperty({ example: 1, description: 'Country ID' })
  @IsNotEmpty()
  @IsNumber()
  countryId: number;

  @ApiProperty({ example: 2, description: 'Region/State ID', required: false })
  @IsOptional()
  @IsNumber()
  regionId?: number;

  @ApiProperty({ example: 17, description: 'City ID', required: false })
  @IsOptional()
  @IsNumber()
  cityId?: number;

  @ApiProperty({
    example: 'Al-Sinaa Street, Building 12',
    description: 'Main address line',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(128)
  addressLine1: string;

  @ApiProperty({ example: 'Apt 5, Floor 3', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  addressLine2?: string;

  @ApiProperty({ example: '60100', required: false })
  @IsOptional()
  @IsString()
  @Length(3, 16)
  postalCode?: string;

  @ApiProperty({
    example: '+963991234567',
    description: 'Contact phone for delivery',
  })
  @IsNotEmpty()
  @IsPhoneNumber()
  phone: string;

  @ApiProperty({ example: 'Ring the bell', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  notes?: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  isDefault?: boolean;

  @ApiProperty({ example: 35.6598, required: false, description: 'Latitude' })
  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @ApiProperty({ example: 36.6689, required: false, description: 'Longitude' })
  @IsOptional()
  @IsLongitude()
  longitude?: number;
}
