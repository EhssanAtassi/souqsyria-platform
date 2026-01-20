/**
 * @file bulk-assign-permissions.dto.ts
 * @description DTO for bulk assigning multiple permissions to a role
 * @location src/access-control/dto/role-permission/bulk-assign-permissions.dto.ts
 */
import { IsInt, IsArray, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BulkAssignPermissionsDto {
  @ApiProperty({ example: 1, description: 'Role ID to assign permissions to' })
  @IsInt()
  roleId: number;

  @ApiProperty({
    example: [1, 2, 3, 4],
    description: 'Array of permission IDs to assign',
  })
  @IsArray()
  @IsInt({ each: true })
  permissionIds: number[];

  @ApiProperty({
    example: false,
    description: 'Whether to replace existing permissions or add to them',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  replaceExisting?: boolean = false;
}
