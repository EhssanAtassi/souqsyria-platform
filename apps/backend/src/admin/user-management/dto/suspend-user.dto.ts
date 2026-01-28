/**
 * @file suspend-user.dto.ts
 * @description DTO for temporarily suspending user accounts with reason and duration.
 *
 * Suspension is a less severe disciplinary action than banning:
 * - User can still login (unlike banned users)
 * - Access to certain features may be restricted
 * - Can be temporary with auto-expiration
 * - Used for warnings or temporary restrictions
 *
 * Use Cases:
 * - First-time policy violations (before escalating to ban)
 * - Pending investigation (preserve evidence while limiting activity)
 * - Cooling-off period after disputes
 * - Account security concerns (suspicious activity)
 *
 * Example Usage:
 * ```typescript
 * // Suspend user for 7 days
 * POST /api/admin/users/42/suspend
 * {
 *   "reason": "Received multiple spam reports from buyers. Investigating claims before taking further action.",
 *   "duration": 7
 * }
 *
 * // Indefinite suspension
 * POST /api/admin/users/42/suspend
 * {
 *   "reason": "Account under investigation for potential fraud. Will remain suspended until investigation concludes."
 * }
 * ```
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, IsNotEmpty, IsInt, Min, Max, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * SuspendUserDto
 *
 * Data transfer object for suspending user accounts.
 * Requires mandatory reason and optional duration.
 *
 * Validation Rules:
 * - reason: Required, 10-500 characters
 * - duration: Optional, 1-365 days
 *
 * Suspension Workflow:
 * 1. Admin submits suspension with reason and optional duration
 * 2. Service validates user can be suspended
 * 3. User.isSuspended set to true
 * 4. User.banReason updated with suspension reason
 * 5. User.bannedUntil set to current time + duration (if provided)
 * 6. SecurityAuditLog entry created with action=USER_SUSPENDED
 * 7. Email notification sent to user with reason and duration
 *
 * Auto-expiration:
 * - If duration provided: Suspension expires automatically
 * - If no duration: Suspension is indefinite (manual unsuspend required)
 * - Implement a scheduled job to check and clear expired suspensions
 *
 * Effects of Suspension:
 * - User can login (unlike ban)
 * - Limited access to features (configurable per application)
 * - Cannot create new orders (example restriction)
 * - Cannot post reviews/comments (example restriction)
 * - Can view order history and account info (read-only)
 */
export class SuspendUserDto {
  /**
   * Detailed reason for suspending the user account.
   *
   * This field is mandatory and must contain a clear explanation.
   * Similar to ban reasons, but typically indicates:
   * - Temporary nature of the action
   * - Pending investigation
   * - First-time violation
   * - Warning before escalation
   *
   * Good suspension reasons:
   * - "Received multiple spam reports. Investigating claims. Suspended pending review."
   * - "Unusual account activity detected. Temporary suspension for security verification."
   * - "First violation of review policy. 7-day cooling period before escalation."
   * - "Dispute with vendor being investigated. Limited account access during resolution."
   *
   * The reason should:
   * - Explain why suspension is necessary
   * - Indicate if it's temporary or pending action
   * - Reference evidence if available
   * - Be professionally worded
   * - Provide context for duration (if applicable)
   *
   * Length constraints:
   * - Minimum: 10 characters (prevents vague reasons)
   * - Maximum: 500 characters (keeps it concise)
   *
   * Storage:
   * - Stored in user.banReason field (shared with ban reason)
   * - To differentiate: Check user.isSuspended vs user.isBanned
   * - Logged to SecurityAuditLog.metadata with action=USER_SUSPENDED
   *
   * @example "Received multiple spam reports from buyers. Investigating claims before taking further action. Account suspended for 7 days pending review."
   */
  @ApiProperty({
    description: 'Detailed reason for suspending the user (10-500 characters, specific and factual)',
    example:
      'Received multiple spam reports from buyers. Investigating claims before taking further action. Account suspended for 7 days pending review.',
    minLength: 10,
    maxLength: 500,
    type: 'string',
  })
  @IsNotEmpty({ message: 'Suspension reason is required' })
  @IsString({ message: 'Suspension reason must be a string' })
  @MinLength(10, {
    message: 'Suspension reason must be at least 10 characters (provide specific details)',
  })
  @MaxLength(500, {
    message: 'Suspension reason cannot exceed 500 characters (keep it concise)',
  })
  reason: string;

  /**
   * Duration of suspension in days (optional).
   *
   * If provided:
   * - Suspension will automatically expire after specified days
   * - user.bannedUntil = current date + duration days
   * - A scheduled job should check and auto-unsuspend expired users
   *
   * If omitted:
   * - Suspension is indefinite
   * - Requires manual unsuspend action
   * - user.bannedUntil = null
   *
   * Common durations:
   * - 1 day: Very minor violations, quick cooldown
   * - 3 days: Minor violations, first warning
   * - 7 days: Moderate violations, pending investigation
   * - 14 days: Serious violations, last warning before ban
   * - 30+ days: Very serious violations, alternative to permanent ban
   *
   * Maximum: 365 days (1 year)
   * Rationale: Suspensions longer than 1 year should be bans
   *
   * Implementation considerations:
   * - Store as Date: user.bannedUntil = new Date(Date.now() + duration * 24 * 60 * 60 * 1000)
   * - Create cron job to check expired suspensions daily
   * - Consider notification to user 24 hours before expiration
   * - Log auto-unsuspend actions to audit trail
   *
   * @example 7
   * @default undefined (indefinite suspension)
   */
  @ApiPropertyOptional({
    description: 'Duration of suspension in days (1-365). If omitted, suspension is indefinite.',
    example: 7,
    minimum: 1,
    maximum: 365,
    type: 'integer',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Duration must be an integer' })
  @Min(1, { message: 'Duration must be at least 1 day' })
  @Max(365, {
    message: 'Duration cannot exceed 365 days (use ban for longer restrictions)',
  })
  duration?: number;
}
