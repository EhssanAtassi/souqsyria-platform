import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * @description DTO for creating a new role
 */
export class CreateRoleDto {
  @ApiProperty({ example: 'admin' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'Platform administrator', required: false })
  @IsOptional()
  @IsString()
  description?: string;
  @IsOptional()
  @ApiProperty({ example: false, required: false })
  isDefault?: boolean;
}
