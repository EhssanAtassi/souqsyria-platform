/**
 * @file create-manufacturer.dto.ts
 * @description DTO for creating a new manufacturer.
 */
import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateManufacturerDto {
  @ApiProperty({ example: 'Apple', description: 'ManufacturerEntity name' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Leading tech company', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: 'https://cdn.example.com/apple-logo.png',
    required: false,
  })
  @IsOptional()
  @IsString()
  logoUrl?: string;
}
