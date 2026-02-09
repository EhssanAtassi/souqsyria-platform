/**
 * @file login.dto.ts
 * @description Request body validation for user login.
 * Supports email/password authentication with optional remember-me flag
 * for extended session persistence (30-day refresh tokens).
 */
import { IsEmail, IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  /** @description User email address for authentication */
  @IsEmail()
  email: string;

  /** @description User password for authentication */
  @IsString()
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
