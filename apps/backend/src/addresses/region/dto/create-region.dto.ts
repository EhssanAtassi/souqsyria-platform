import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, Length } from 'class-validator';

export class CreateRegionDto {
  @ApiProperty({ example: 1, description: 'Country ID' })
  @IsNumber()
  countryId: number;

  @ApiProperty({ example: 'Damascus', description: 'Region/State name' })
  @IsString()
  @Length(2, 64)
  name: string;

  @ApiProperty({ example: 'DAM', required: false })
  @IsString()
  @Length(0, 8)
  code?: string;
}
