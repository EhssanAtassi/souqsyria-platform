/**
 * @file assign-roles.dto.ts
 * @description DTO for assigning or updating user roles in the SouqSyria platform.
 *
 * The platform uses a dual-role system:
 * 1. Business Role (roleId): The user's primary role (buyer, vendor, etc.)
 * 2. Assigned Role (assignedRoleId): Administrative/staff role (admin, support, marketing)
 *
 * This allows users to:
 * - Be a vendor (business role) AND a support agent (assigned role)
 * - Have separate permission sets for each role type
 * - Maintain role separation for security and auditing
 *
 * Example Usage:
 * ```typescript
 * // Make a user an admin
 * PUT /api/admin/users/42/roles
 * { "assignedRoleId": 5 }
 *
 * // Change business role from buyer to vendor
 * PUT /api/admin/users/42/roles
 * { "roleId": 3 }
 *
 * // Assign both roles at once
 * PUT /api/admin/users/42/roles
 * { "roleId": 3, "assignedRoleId": 5 }
 * ```
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * AssignRolesDto
 *
 * Data transfer object for modifying user role assignments.
 * Both fields are optional to allow updating either role independently.
 *
 * Validation Rules:
 * - roleId: Must be a positive integer
 * - assignedRoleId: Must be a positive integer
 * - At least one field should be provided (enforced in service layer)
 *
 * Security Considerations:
 * - Verify role exists before assignment
 * - Check admin has permission to assign the role
 * - Cannot remove own admin role (prevents lockout)
 * - Log all role changes to SecurityAuditLog
 */
export class AssignRolesDto {
  /**
   * Primary business role ID.
   *
   * This is the user's main role in the platform:
   * - Buyer: Regular customer browsing and purchasing
   * - Vendor: Seller managing products and orders
   * - Other business-specific roles
   *
   * Stored in: user.role (ManyToOne relation)
   *
   * Effects of changing business role:
   * - Changes user's primary permissions
   * - May affect dashboard access
   * - Impacts what entities user can create/manage
   * - Affects commission calculations for vendors
   *
   * Example role IDs (from your seeding):
   * - 1: Buyer
   * - 2: Vendor
   * - 3: Supplier
   *
   * Implementation notes:
   * - Validate roleId exists in roles table
   * - Check role.type === 'business' (if type field is used)
   * - Update user.role relation
   * - Log change to audit trail
   *
   * @example 3
   */
  @ApiPropertyOptional({
    description: 'Primary business role ID (e.g., buyer, vendor)',
    example: 3,
    type: 'integer',
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'roleId must be an integer' })
  @Min(1, { message: 'roleId must be at least 1' })
  roleId?: number;

  /**
   * Assigned administrative/staff role ID.
   *
   * This is the user's secondary role for administrative tasks:
   * - Admin: Full system access
   * - Support: Customer service functions
   * - Marketing: Campaign management
   * - Accounting: Financial operations
   * - Moderator: Content moderation
   *
   * Stored in: user.assignedRole (ManyToOne relation)
   *
   * Effects of assigning staff role:
   * - Grants access to admin panel
   * - Adds administrative permissions
   * - Does not replace business role (additive)
   * - User inherits permissions from BOTH roles
   *
   * Example assigned role IDs (from your seeding):
   * - 4: Admin
   * - 5: Support
   * - 6: Marketing
   * - 7: Accounting
   *
   * Permission calculation:
   * effectivePermissions = businessRolePermissions ∪ assignedRolePermissions
   *
   * Security constraints:
   * - Only admins can assign admin roles
   * - Cannot remove your own admin role (prevents lockout)
   * - Cannot assign role with higher privileges than you have
   *
   * To remove assigned role: Set to null (handle in service layer)
   *
   * Implementation notes:
   * - Validate assignedRoleId exists in roles table
   * - Check role.type === 'admin' (if type field is used)
   * - Update user.assignedRole relation
   * - Log change to audit trail
   *
   * @example 5
   */
  @ApiPropertyOptional({
    description: 'Assigned administrative/staff role ID (e.g., admin, support, marketing)',
    example: 5,
    type: 'integer',
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'assignedRoleId must be an integer' })
  @Min(1, { message: 'assignedRoleId must be at least 1' })
  assignedRoleId?: number;
}
