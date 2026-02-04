import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGlobalCommissionDto {
  @IsNumber()
  @ApiProperty({ example: 7.5, description: 'Default commission percentage' })
  percentage: number;

  @IsOptional()
  @IsString()
  @ApiProperty({
    required: false,
    description: 'Optional note or reason for setting this commission',
  })
  note?: string;
}
