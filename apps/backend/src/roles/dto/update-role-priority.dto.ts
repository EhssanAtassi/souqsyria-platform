/**
 * @file update-role-priority.dto.ts
 * @description DTO for updating role priority in the hierarchy.
 * Priority determines precedence when permission conflicts occur.
 * Higher priority = higher precedence.
 *
 * @example
 * {
 *   "priority": 50
 * }
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

/**
 * UpdateRolePriorityDto
 *
 * Used for updating the priority value of a role in the role hierarchy.
 * Priority affects conflict resolution when users have multiple roles.
 *
 * Priority Guidelines:
 * - 0-9: Basic user roles (Buyer, Customer)
 * - 10-49: Vendor and business roles
 * - 50-99: Staff and department roles
 * - 100-499: Administrator roles
 * - 500-999: Super administrator roles
 * - 1000+: System roles (reserved)
 *
 * Security considerations:
 * - Cannot set priority on system roles (isDefault=true)
 * - Priority conflicts should be monitored
 * - Requires 'manage_roles' permission
 * - Audit logged via SecurityAuditService
 *
 * Performance:
 * - Simple update operation
 * - Target: <50ms
 */
export class UpdateRolePriorityDto {
  /**
   * Priority value for the role.
   * Must be a non-negative integer.
   * Higher values indicate higher priority in the role hierarchy.
   *
   * Recommended ranges:
   * - 0-9: Basic user roles
   * - 10-49: Business roles
   * - 50-99: Staff roles
   * - 100-499: Admin roles
   * - 500+: Super admin roles
   *
   * @minimum 0
   * @example 50
   */
  @ApiProperty({
    description:
      'Priority value for role hierarchy. Higher values = higher priority. Must be >= 0.',
    example: 50,
    type: Number,
    minimum: 0,
  })
  @IsInt({
    message: 'Priority must be an integer',
  })
  @Min(0, {
    message: 'Priority must be greater than or equal to 0',
  })
  priority: number;
}
