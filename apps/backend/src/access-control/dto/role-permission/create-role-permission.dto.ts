/**
 * @file create-role-permission.dto.ts
 * @description DTO for assigning permissions to roles.
 */
import { IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRolePermissionDto {
  @ApiProperty({ example: 1, description: 'Role ID' })
  @IsInt()
  roleId: number;

  @ApiProperty({ example: 5, description: 'Permission ID' })
  @IsInt()
  permissionId: number;
}
