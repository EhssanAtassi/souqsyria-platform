/**
 * @file role-permissions-query.dto.ts
 * @description DTO for querying role-permissions with filters and pagination
 * @location src/access-control/dto/role-permission/role-permissions-query.dto.ts
 */
import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class RolePermissionsQueryDto {
  @ApiProperty({
    example: 'manage',
    description: 'Search term for role or permission names',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    example: 1,
    description: 'Filter by specific role ID',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  roleId?: number;

  @ApiProperty({
    example: 1,
    description: 'Filter by specific permission ID',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  permissionId?: number;

  @ApiProperty({
    example: 1,
    description: 'Page number for pagination',
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    example: 20,
    description: 'Number of items per page',
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
