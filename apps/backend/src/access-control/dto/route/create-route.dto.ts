/**
 * @file create-route.dto.ts
 * @description DTO for creating new route entries linked to permissions.
 */
import { IsString, IsOptional, IsEnum, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRouteDto {
  @ApiProperty({ example: '/admin/products', description: 'Route path' })
  @IsString()
  path: string;

  @ApiProperty({ example: 'POST', description: 'HTTP Method' })
  @IsEnum(['GET', 'POST', 'PUT', 'DELETE'])
  method: string;

  @ApiProperty({ example: 1, description: 'Permission ID', required: false })
  @IsOptional()
  @IsInt()
  permissionId?: number;
}
