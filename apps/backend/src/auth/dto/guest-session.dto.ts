/**
 * @file guest-session.dto.ts
 * @description DTOs for Guest Session Management (SS-AUTH-009)
 *
 * Provides data transfer objects for guest session creation, validation, and response mapping.
 */

import { IsOptional, IsObject, IsString, IsUUID, IsEnum, IsInt, IsDate } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * Device fingerprint metadata for session tracking
 */
export class DeviceFingerprintDto {
  @ApiPropertyOptional({
    description: 'User agent string from browser',
    example: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
  })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiPropertyOptional({
    description: 'Platform identifier',
    example: 'macOS',
  })
  @IsOptional()
  @IsString()
  platform?: string;

  @ApiPropertyOptional({
    description: 'Preferred language',
    example: 'ar-SY',
  })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({
    description: 'Screen resolution',
    example: '1920x1080',
  })
  @IsOptional()
  @IsString()
  screenResolution?: string;

  @ApiPropertyOptional({
    description: 'Timezone offset',
    example: 'Asia/Damascus',
  })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({
    description: 'Whether cookies are enabled',
    example: true,
  })
  @IsOptional()
  cookiesEnabled?: boolean;
}

/**
 * DTO for creating a new guest session
 */
export class CreateGuestSessionDto {
  @ApiPropertyOptional({
    description: 'Device fingerprint metadata for security and analytics',
    type: DeviceFingerprintDto,
  })
  @IsOptional()
  @IsObject()
  @Type(() => DeviceFingerprintDto)
  deviceFingerprint?: DeviceFingerprintDto;

  @ApiPropertyOptional({
    description: 'Client IP address (auto-extracted from request)',
    example: '192.168.1.100',
  })
  @IsOptional()
  @IsString()
  ipAddress?: string;
}

/**
 * DTO for guest session response
 */
export class GuestSessionDto {
  @ApiProperty({
    description: 'Unique session identifier (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  id: string;

  @ApiProperty({
    description: 'SHA256 hashed session token (stored in cookie)',
    example: 'a3f5b2c1d4e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2',
  })
  @IsString()
  sessionToken: string;

  @ApiProperty({
    description: 'Session status',
    enum: ['active', 'expired', 'converted'],
    example: 'active',
  })
  @IsEnum(['active', 'expired', 'converted'])
  status: 'active' | 'expired' | 'converted';

  @ApiProperty({
    description: 'Whether session has expired',
    example: false,
  })
  isExpired: boolean;

  @ApiProperty({
    description: 'Whether session is within 7-day grace period',
    example: false,
  })
  isInGracePeriod: boolean;

  @ApiProperty({
    description: 'Last activity timestamp',
    example: '2026-02-15T10:30:00Z',
  })
  @IsDate()
  @Type(() => Date)
  lastActivityAt: Date;

  @ApiProperty({
    description: 'Session expiration timestamp (30 days from last activity)',
    example: '2026-03-17T10:30:00Z',
  })
  @IsDate()
  @Type(() => Date)
  expiresAt: Date;

  @ApiPropertyOptional({
    description: 'Client IP address',
    example: '192.168.1.100',
  })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional({
    description: 'Device fingerprint metadata',
    type: DeviceFingerprintDto,
  })
  @IsOptional()
  @IsObject()
  deviceFingerprint?: DeviceFingerprintDto;

  @ApiProperty({
    description: 'Whether session has an associated cart',
    example: true,
  })
  hasCart: boolean;

  @ApiPropertyOptional({
    description: 'User ID if session was converted to registered user',
    example: 12345,
  })
  @IsOptional()
  @IsInt()
  convertedUserId?: number;
}

/**
 * DTO for associating a cart with guest session
 */
export class AssociateCartDto {
  @ApiProperty({
    description: 'Cart ID to associate with session',
    example: 789,
  })
  @IsInt()
  cartId: number;
}

/**
 * DTO for guest session validation response
 */
export class ValidateGuestSessionDto {
  @ApiProperty({
    description: 'Whether the session is valid',
    example: true,
  })
  isValid: boolean;

  @ApiProperty({
    description: 'Validation message',
    example: 'Session is active and valid',
  })
  @IsString()
  message: string;

  @ApiPropertyOptional({
    description: 'Guest session details if valid',
    type: GuestSessionDto,
  })
  @IsOptional()
  session?: GuestSessionDto;
}
