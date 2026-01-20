/**
 * @file create-permission.dto.ts
 * @description DTO for creating a new permission.
 */
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePermissionDto {
  @ApiProperty({
    example: 'manage_products',
    description: 'Unique permission name',
  })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'Allows managing all products in the system',
    required: false,
  })
  @IsString()
  description?: string;
}
