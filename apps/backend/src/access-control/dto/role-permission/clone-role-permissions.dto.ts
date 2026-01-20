/**
 * @file clone-role-permissions.dto.ts
 * @description DTO for cloning permissions from one role to another
 * @location src/access-control/dto/role-permission/clone-role-permissions.dto.ts
 */
import { IsInt, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CloneRolePermissionsDto {
  @ApiProperty({
    example: 1,
    description: 'Source role ID to copy permissions from',
  })
  @IsInt()
  sourceRoleId: number;

  @ApiProperty({
    example: 2,
    description: 'Target role ID to copy permissions to',
  })
  @IsInt()
  targetRoleId: number;

  @ApiProperty({
    example: false,
    description: 'Whether to replace existing permissions in target role',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  replaceExisting?: boolean = false;
}
