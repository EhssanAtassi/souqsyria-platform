/**
 * @file guest-session.dto.ts
 * @description Guest Session DTOs for SouqSyria E-commerce Platform
 *
 * VALIDATION RULES:
 * - Device metadata must be a valid JSON object
 * - Session responses include ID, expiration, and status
 * - Swagger decorators for comprehensive API documentation
 *
 * USE CASES:
 * - POST /auth/guest-session/init - Create new guest session
 * - GET /auth/guest-session/validate - Validate existing session
 *
 * @author SouqSyria Development Team
 * @since 2026-02-15
 * @version 1.0.0
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsOptional } from 'class-validator';

/**
 * Guest Session Status Enum
 *
 * Represents the lifecycle states of a guest session:
 * - ACTIVE: Session is valid and can be used
 * - EXPIRED: Session has exceeded 30-day limit (not in grace period)
 * - CONVERTED: Session was converted to authenticated user account
 */
export enum GuestSessionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CONVERTED = 'converted',
}

/**
 * CreateGuestSessionDto
 *
 * DTO for creating a new guest session with optional device metadata.
 * Used when initializing a guest browsing session for anonymous users.
 */
export class CreateGuestSessionDto {
  /**
   * Device and browser metadata for fingerprinting
   *
   * Optional JSON object containing:
   * - userAgent: Browser user agent string
   * - platform: Operating system platform
   * - language: Browser language preference
   * - screenResolution: Screen dimensions (e.g., "1920x1080")
   * - timezone: User's timezone offset
   * - cookiesEnabled: Whether cookies are enabled
   *
   * Used for security (fraud detection) and analytics.
   */
  @ApiProperty({
    description:
      'Device fingerprint metadata for security and analytics tracking',
    example: {
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      platform: 'Win32',
      language: 'en-US',
      screenResolution: '1920x1080',
      timezone: 'Asia/Damascus',
      cookiesEnabled: true,
    },
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: {
    userAgent?: string;
    platform?: string;
    language?: string;
    screenResolution?: string;
    timezone?: string;
    cookiesEnabled?: boolean;
  };
}

/**
 * GuestSessionDto
 *
 * Response DTO for guest session operations.
 * Returns session information to the client after creation or validation.
 *
 * NOTE: This is a RESPONSE DTO - validation decorators are not needed.
 * Validation only applies to REQUEST DTOs processed by ValidationPipe.
 */
export class GuestSessionDto {
  /**
   * Unique session identifier (UUID)
   *
   * This ID is stored in HTTP-only cookie as 'guest_session_id'.
   * The actual session token is SHA256 hashed for security.
   */
  @ApiProperty({
    description: 'Unique session identifier (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
    type: String,
  })
  sessionId: string;

  /**
   * Session expiration timestamp
   *
   * UTC datetime when session will expire (30 days from last activity).
   * Sessions have sliding expiration - renewed on every request.
   */
  @ApiProperty({
    description:
      'Session expiration timestamp (UTC) - 30 days from last activity',
    example: '2026-03-17T12:00:00.000Z',
    type: Date,
  })
  expiresAt: Date;

  /**
   * Device and browser metadata
   *
   * Contains device fingerprint information collected during session creation.
   * Used for security analysis and user experience optimization.
   */
  @ApiProperty({
    description: 'Device fingerprint metadata',
    example: {
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      platform: 'Win32',
      language: 'en-US',
    },
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  /**
   * Session lifecycle status
   *
   * - active: Session is valid and can be used
   * - expired: Session has exceeded 30-day limit (not in grace period)
   * - converted: Session was converted to authenticated user account
   */
  @ApiProperty({
    description: 'Session lifecycle status',
    enum: GuestSessionStatus,
    example: GuestSessionStatus.ACTIVE,
    type: String,
  })
  status: GuestSessionStatus;

  /**
   * Session validation flag
   *
   * True if session is currently valid and usable.
   * False if session is expired or corrupted.
   */
  @ApiProperty({
    description: 'Whether the session is currently valid',
    example: true,
    type: Boolean,
  })
  isValid: boolean;

  /**
   * Cart association indicator
   *
   * True if this guest session has an associated shopping cart.
   * Used to determine if cart data should be preserved on conversion.
   */
  @ApiProperty({
    description: 'Whether the session has an associated cart',
    example: false,
    type: Boolean,
    required: false,
  })
  @IsOptional()
  hasCart?: boolean;
}

/**
 * GuestSessionValidationDto
 *
 * Response DTO for session validation endpoint.
 * Provides detailed session status information.
 *
 * NOTE: This is a RESPONSE DTO - validation decorators are not needed.
 */
export class GuestSessionValidationDto {
  /**
   * Session existence flag
   *
   * True if session was found in database.
   * False if session cookie references non-existent session.
   */
  @ApiProperty({
    description: 'Whether the session exists in the database',
    example: true,
    type: Boolean,
  })
  exists: boolean;

  /**
   * Session validity flag
   *
   * True if session exists and is not expired.
   * False if session is expired or doesn't exist.
   */
  @ApiProperty({
    description: 'Whether the session is valid and not expired',
    example: true,
    type: Boolean,
  })
  isValid: boolean;

  /**
   * Expiration timestamp
   *
   * When the session will expire (if valid).
   * Null if session doesn't exist.
   */
  @ApiProperty({
    description: 'Session expiration timestamp (UTC)',
    example: '2026-03-17T12:00:00.000Z',
    type: Date,
    required: false,
  })
  @IsOptional()
  expiresAt?: Date;

  /**
   * Current session status
   *
   * Lifecycle state of the session.
   * Null if session doesn't exist.
   */
  @ApiProperty({
    description: 'Current session lifecycle status',
    enum: GuestSessionStatus,
    example: GuestSessionStatus.ACTIVE,
    required: false,
  })
  status?: GuestSessionStatus;
}
