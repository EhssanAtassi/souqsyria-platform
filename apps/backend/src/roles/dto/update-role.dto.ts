import { PartialType } from '@nestjs/mapped-types';
import { CreateRoleDto } from './create-role.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

/**
 * @description DTO for updating an existing role
 */
export class UpdateRoleDto extends PartialType(CreateRoleDto) {
  @ApiPropertyOptional({ example: 'Updated role description' })
  @IsOptional()
  @IsString()
  description?: string;
  @IsOptional()
  @ApiProperty({ example: false, required: false })
  isDefault?: boolean;
}
