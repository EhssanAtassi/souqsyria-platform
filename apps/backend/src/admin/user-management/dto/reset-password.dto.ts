/**
 * @file reset-password.dto.ts
 * @description DTO for administrative password resets with strong password requirements.
 *
 * This endpoint allows administrators to reset user passwords directly,
 * bypassing the normal forgot-password flow. This should be used:
 * - When user has lost access to their email
 * - For emergency account recovery
 * - After security incidents
 * - For testing/support purposes
 *
 * Security Considerations:
 * - Requires manage_users permission
 * - All password resets are logged to SecurityAuditLog
 * - User should receive email notification about password change
 * - Consider forcing password change on next login
 * - Original password is not readable (bcrypt hashed)
 *
 * Example Usage:
 * ```typescript
 * // Reset user password
 * POST /api/admin/users/42/reset-password
 * {
 *   "newPassword": "SecureP@ssw0rd123!"
 * }
 * ```
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, Matches, IsNotEmpty } from 'class-validator';

/**
 * ResetPasswordDto
 *
 * Data transfer object for administrative password resets.
 * Enforces strong password requirements to maintain security.
 *
 * Password Requirements:
 * - Length: 8-100 characters
 * - Must contain: uppercase, lowercase, number, special character
 * - Cannot be common passwords (implement in service layer)
 * - Cannot match previous passwords (implement in service layer)
 *
 * Strong Password Pattern:
 * - At least one uppercase letter (A-Z)
 * - At least one lowercase letter (a-z)
 * - At least one digit (0-9)
 * - At least one special character (!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`)
 * - Minimum 8 characters total
 *
 * Reset Workflow:
 * 1. Admin submits new password
 * 2. Validate password strength (DTO validation)
 * 3. Hash password with bcrypt (10+ rounds)
 * 4. Update user.passwordHash
 * 5. Update user.passwordChangedAt = new Date()
 * 6. Invalidate all existing user sessions (optional but recommended)
 * 7. Log to SecurityAuditLog with action=PASSWORD_RESET
 * 8. Send email notification to user
 * 9. Optionally: Set flag requiring password change on next login
 */
export class ResetPasswordDto {
  /**
   * The new password for the user account.
   *
   * Password Strength Requirements:
   * - Minimum Length: 8 characters
   * - Maximum Length: 100 characters
   * - Must contain at least one uppercase letter (A-Z)
   * - Must contain at least one lowercase letter (a-z)
   * - Must contain at least one digit (0-9)
   * - Must contain at least one special character
   *
   * Special Characters Allowed:
   * ! @ # $ % ^ & * ( ) _ + - = [ ] { } ; ' : " \ | , . < > / ? ~ `
   *
   * Password Validation Examples:
   * ✅ Valid:
   * - "SecureP@ssw0rd"
   * - "MyP@ssw0rd123!"
   * - "C0mpl3x!Pass"
   * - "Str0ng&Secure#2024"
   *
   * ❌ Invalid:
   * - "password" (no uppercase, no special char, no number)
   * - "PASSWORD123" (no lowercase, no special char)
   * - "Pass123" (too short, no special char)
   * - "SimplePassword" (no number, no special char)
   *
   * Additional Security Measures (implement in service):
   * - Check against common password lists (e.g., rockyou.txt top 10k)
   * - Prevent password reuse (check against previous 5 passwords)
   * - Rate limit password reset attempts per admin
   * - Alert security team for suspicious patterns
   *
   * Hashing:
   * - Use bcrypt with cost factor 10-12
   * - Example: await bcrypt.hash(newPassword, 12)
   * - Store in user.passwordHash field
   *
   * User Notification:
   * After password reset, send email containing:
   * - Confirmation that password was changed
   * - Time of change
   * - Admin who performed the change (for audit)
   * - Instructions to contact support if not authorized
   * - Link to change password if compromised
   *
   * Session Management:
   * Consider invalidating all existing user sessions:
   * - Prevents attacker from using stolen sessions
   * - Forces user to login with new password
   * - Implement by clearing refresh tokens or incrementing session version
   *
   * Best Practices for Admins:
   * - Use temporary passwords that users must change on login
   * - Communicate new password securely (not via email)
   * - Document reason for password reset
   * - Consider requiring 2FA for password resets
   *
   * @example "SecureP@ssw0rd123!"
   */
  @ApiProperty({
    description:
      'New password (8-100 chars, must contain uppercase, lowercase, number, and special character)',
    example: 'SecureP@ssw0rd123!',
    minLength: 8,
    maxLength: 100,
    type: 'string',
    format: 'password',
  })
  @IsNotEmpty({ message: 'Password is required' })
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(100, { message: 'Password cannot exceed 100 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`])/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  newPassword: string;
}
