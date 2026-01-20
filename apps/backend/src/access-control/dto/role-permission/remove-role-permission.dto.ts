/**
 * @file remove-role-permission.dto.ts
 * @description DTO for removing role-permission assignments
 * @location src/access-control/dto/role-permission/remove-role-permission.dto.ts
 */
import { IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RemoveRolePermissionDto {
  @ApiProperty({ example: 1, description: 'Role ID' })
  @IsInt()
  roleId: number;

  @ApiProperty({ example: 5, description: 'Permission ID' })
  @IsInt()
  permissionId: number;
}
