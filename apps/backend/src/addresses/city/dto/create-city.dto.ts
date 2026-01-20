import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, Length } from 'class-validator';

export class CreateCityDto {
  @ApiProperty({ example: 1, description: 'Country ID' })
  @IsNumber()
  countryId: number;

  @ApiProperty({ example: 2, description: 'Region ID', required: false })
  @IsNumber()
  regionId?: number;

  @ApiProperty({ example: 'Homs', description: 'City name' })
  @IsString()
  @Length(2, 64)
  name: string;
}
