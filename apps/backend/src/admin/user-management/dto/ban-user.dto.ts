/**
 * @file ban-user.dto.ts
 * @description DTO for banning user accounts with mandatory reason tracking.
 *
 * This DTO enforces accountability by requiring administrators to provide
 * a detailed reason for banning a user. This is critical for:
 * - Legal compliance (user can request reason for ban)
 * - Audit trails and incident investigation
 * - Admin accountability and oversight
 * - Dispute resolution
 *
 * Example Usage:
 * ```typescript
 * // Ban a user for terms violation
 * POST /api/admin/users/42/ban
 * {
 *   "reason": "Repeatedly violated community guidelines by posting spam content in product reviews. Final warning issued on 2024-01-15."
 * }
 * ```
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, IsNotEmpty } from 'class-validator';

/**
 * BanUserDto
 *
 * Data transfer object for banning user accounts.
 * Requires mandatory reason field for audit and compliance.
 *
 * Validation Rules:
 * - reason: Required, 10-500 characters
 * - reason: Must provide meaningful explanation (enforced by length)
 *
 * Ban Workflow:
 * 1. Admin submits ban with reason
 * 2. Service validates user can be banned (not self, not higher privilege)
 * 3. User.isBanned set to true
 * 4. User.banReason set to provided reason
 * 5. SecurityAuditLog entry created with action=USER_BANNED
 * 6. All active user sessions invalidated
 * 7. Email notification sent to user (optional)
 *
 * Effects of Ban:
 * - User cannot login (blocked at authentication)
 * - All API requests return 403 Forbidden
 * - User sees "Account banned: [reason]" message
 * - Shopping cart and wishlist preserved (for potential appeal)
 * - Orders remain in system for fulfillment
 *
 * To Unban:
 * POST /api/admin/users/:id/unban
 * (Sets isBanned=false, clears banReason, logs to audit)
 */
export class BanUserDto {
  /**
   * Detailed reason for banning the user account.
   *
   * This field is mandatory and must contain a clear, specific explanation.
   * Good reasons include:
   * - "Posted fraudulent product listings (Product IDs: 123, 456, 789)"
   * - "Engaged in abusive behavior towards support staff (Ticket #45678)"
   * - "Attempted payment fraud with stolen credit cards (Transaction IDs: TX-123, TX-456)"
   * - "Violated terms of service by selling prohibited items"
   *
   * Bad reasons (too vague):
   * - "Bad user"
   * - "Violated ToS"
   * - "Banned"
   *
   * The reason should:
   * - Be specific and detailed
   * - Reference evidence (ticket IDs, transaction IDs, etc.)
   * - Be professionally worded
   * - Be factual, not emotional
   * - Include date of incident if relevant
   *
   * Length constraints:
   * - Minimum: 10 characters (prevents lazy/vague reasons)
   * - Maximum: 500 characters (keeps it concise)
   *
   * Legal considerations:
   * - User may request reason under GDPR/data protection laws
   * - Reason may be used in dispute resolution
   * - Avoid defamatory language
   * - Stick to facts and policy violations
   *
   * Storage:
   * - Stored in user.banReason field
   * - Also logged to SecurityAuditLog.metadata
   * - Visible to admins in user management interface
   * - May be shown to banned user on login attempt
   *
   * @example "Repeatedly violated community guidelines by posting spam content in product reviews. Final warning issued on 2024-01-15. Continued violations after 3-day suspension."
   */
  @ApiProperty({
    description: 'Detailed reason for banning the user (10-500 characters, specific and factual)',
    example:
      'Repeatedly violated community guidelines by posting spam content in product reviews. Final warning issued on 2024-01-15.',
    minLength: 10,
    maxLength: 500,
    type: 'string',
  })
  @IsNotEmpty({ message: 'Ban reason is required' })
  @IsString({ message: 'Ban reason must be a string' })
  @MinLength(10, {
    message: 'Ban reason must be at least 10 characters (provide specific details)',
  })
  @MaxLength(500, {
    message: 'Ban reason cannot exceed 500 characters (keep it concise)',
  })
  reason: string;
}
