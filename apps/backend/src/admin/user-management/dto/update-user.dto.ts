/**
 * @file update-user.dto.ts
 * @description DTO for updating user profile information by administrators.
 *
 * This DTO allows selective updates to user accounts:
 * - Email address modification
 * - Email verification status
 * - Ban status
 * - Suspension status
 *
 * Security Considerations:
 * - Admins cannot modify their own ban/suspension status (enforced in service layer)
 * - Email changes should trigger verification emails (implement in service)
 * - All changes are logged to SecurityAuditLog
 *
 * Example Usage:
 * ```typescript
 * // Ban a user
 * PUT /api/admin/users/42
 * { "isBanned": true }
 *
 * // Update email and verify
 * PUT /api/admin/users/42
 * { "email": "newemail@example.com", "isVerified": true }
 * ```
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEmail, IsBoolean } from 'class-validator';

/**
 * UpdateUserDto
 *
 * Data transfer object for updating user account details.
 * All fields are optional to allow partial updates.
 *
 * Validation Rules:
 * - email: Must be valid email format
 * - isVerified: Boolean only
 * - isBanned: Boolean only
 * - isSuspended: Boolean only
 *
 * Note: This DTO does NOT include password updates.
 * Password resets use a separate endpoint (ResetPasswordDto).
 */
export class UpdateUserDto {
  /**
   * User's email address.
   *
   * When updating email:
   * 1. Validate format (RFC 5322 compliant)
   * 2. Check for uniqueness (no duplicate emails)
   * 3. Consider setting isVerified=false and sending verification email
   * 4. Log the change to SecurityAuditLog
   *
   * Email is used for:
   * - Login credentials
   * - Password reset requests
   * - System notifications
   * - Order confirmations
   *
   * @example "john.doe@example.com"
   */
  @ApiPropertyOptional({
    description: 'User email address (must be unique and valid format)',
    example: 'john.doe@example.com',
    type: 'string',
    format: 'email',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email?: string;

  /**
   * Email verification status.
   *
   * Controls whether user has verified ownership of email address.
   *
   * Effects:
   * - isVerified=true: User can access all features
   * - isVerified=false: May have limited access (e.g., cannot make purchases)
   *
   * Use cases:
   * - Admin manually verifying a user's email
   * - Resetting verification after email change
   * - Testing scenarios
   *
   * Security Note:
   * Manually setting isVerified=true bypasses normal verification flow.
   * Only do this with valid reason (e.g., user lost access to email).
   *
   * @example true
   * @default false
   */
  @ApiPropertyOptional({
    description: 'Email verification status (true if email is verified)',
    example: true,
    type: 'boolean',
  })
  @IsOptional()
  @IsBoolean({ message: 'isVerified must be a boolean' })
  isVerified?: boolean;

  /**
   * Account ban status.
   *
   * When isBanned=true:
   * - User cannot login
   * - Existing sessions are invalidated
   * - Access to all endpoints is blocked
   * - User sees "Account banned" message
   *
   * Banning workflow:
   * 1. Use dedicated ban endpoint (POST /users/:id/ban) with reason
   * 2. That endpoint sets isBanned=true AND logs to audit trail
   * 3. This field exists for direct updates if needed
   *
   * To unban: Use POST /users/:id/unban or set isBanned=false
   *
   * Security Constraints:
   * - Cannot ban yourself (enforced in service)
   * - Cannot ban higher-privilege users (enforced in service)
   *
   * @example false
   * @default false
   */
  @ApiPropertyOptional({
    description: 'Account ban status (true if user is banned from the platform)',
    example: false,
    type: 'boolean',
  })
  @IsOptional()
  @IsBoolean({ message: 'isBanned must be a boolean' })
  isBanned?: boolean;

  /**
   * Account suspension status.
   *
   * When isSuspended=true:
   * - User can still login (unlike banned)
   * - Access to certain features may be restricted
   * - Used for temporary disciplinary actions
   * - Less severe than ban
   *
   * Suspension workflow:
   * 1. Use dedicated suspend endpoint (POST /users/:id/suspend) with reason and duration
   * 2. That endpoint sets isSuspended=true AND logs to audit trail
   * 3. This field exists for direct updates if needed
   *
   * To unsuspend: Use POST /users/:id/unsuspend or set isSuspended=false
   *
   * Difference from ban:
   * - Suspended users can view content but not interact
   * - Banned users cannot login at all
   *
   * @example false
   * @default false
   */
  @ApiPropertyOptional({
    description: 'Account suspension status (true if user is temporarily suspended)',
    example: false,
    type: 'boolean',
  })
  @IsOptional()
  @IsBoolean({ message: 'isSuspended must be a boolean' })
  isSuspended?: boolean;
}
