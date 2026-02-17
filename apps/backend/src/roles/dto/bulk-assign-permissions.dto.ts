/**
 * @file bulk-assign-permissions.dto.ts
 * @description DTO for bulk assigning permissions to a role.
 * Replaces all existing role permissions with the provided list.
 * Validates that all permission IDs exist in the database.
 *
 * @example
 * {
 *   "permissionIds": [1, 2, 3, 15, 20]
 * }
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayMinSize, IsInt } from 'class-validator';

/**
 * BulkAssignPermissionsDto
 *
 * Used for replacing all role permissions with a new set of permissions.
 * This operation is atomic - either all permissions are assigned or none.
 *
 * Security considerations:
 * - All permission IDs must exist in the database (validated in service)
 * - Cannot assign permissions to system roles (isDefault=true)
 * - Requires 'manage_roles' permission
 * - Audit logged via SecurityAuditService
 *
 * Performance:
 * - Uses transaction for atomicity
 * - Bulk operations for efficiency
 * - Target: <200ms for typical payloads (50 permissions)
 */
export class BulkAssignPermissionsDto {
  /**
   * Array of permission IDs to assign to the role.
   * Must contain at least 1 permission (roles cannot be empty).
   * All IDs must reference existing permissions in the database.
   *
   * @example [1, 2, 3, 15, 20, 25]
   */
  @ApiProperty({
    description:
      'Array of permission IDs to assign to the role. Replaces all existing permissions.',
    example: [1, 2, 3, 15, 20, 25],
    type: [Number],
    isArray: true,
    minItems: 1,
  })
  @IsArray({
    message: 'permissionIds must be an array of permission IDs',
  })
  @ArrayMinSize(1, {
    message: 'At least one permission must be assigned to the role',
  })
  @IsInt({
    each: true,
    message: 'Each permission ID must be an integer',
  })
  permissionIds: number[];
}
