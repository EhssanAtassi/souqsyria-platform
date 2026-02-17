/**
 * @file login.dto.ts
 * @description Request body validation for user login.
 * Supports email/password authentication with optional remember-me flag
 * for extended session persistence (30-day refresh tokens).
 */
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  /** @description User email address for authentication */
  @ApiProperty({
    description: 'User email address',
    example: 'user@souqsyria.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  /** @description User password (minimum 8 characters) */
  @ApiProperty({
    description: 'User password',
    example: 'securePass123',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  /**
   * @description When true, extends refresh token expiry from 7 days to 30 days.
   * The flag is persisted on the refresh token entity so that token rotation
   * preserves the extended session lifetime.
   */
  @ApiPropertyOptional({
    description: 'Stay logged in for 30 days (extends refresh token expiry)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}
