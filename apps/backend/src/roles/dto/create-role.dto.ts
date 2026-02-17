import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
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

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  isDefault?: boolean;

  @ApiProperty({
    example: 50,
    required: false,
    description: 'Role priority (0-100, higher = more important)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  priority?: number;
}
