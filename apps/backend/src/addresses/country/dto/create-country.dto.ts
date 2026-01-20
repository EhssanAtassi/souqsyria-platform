import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CreateCountryDto {
  @ApiProperty({ example: 'SY', description: 'ISO country code (2 letters)' })
  @IsString()
  @Length(2, 2)
  code: string;

  @ApiProperty({ example: 'Syria', description: 'Country name' })
  @IsString()
  @Length(2, 64)
  name: string;
}
