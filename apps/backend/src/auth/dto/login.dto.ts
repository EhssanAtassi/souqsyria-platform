/**
 * @file login.dto.ts
 * @description Request body validation for user login.
 */
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  /** @description User email address */
  @ApiProperty({ description: 'User email address', example: 'user@souqsyria.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  /** @description User password (minimum 8 characters) */
  @ApiProperty({ description: 'User password', example: 'securePass123', minLength: 8 })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}
