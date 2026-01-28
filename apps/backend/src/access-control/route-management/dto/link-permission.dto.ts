/**
 * @file link-permission.dto.ts
 * @description DTO for linking an existing route to a permission.
 * 
 * Used when updating route mappings to associate a different permission
 * or when initially linking a permission to an unmapped route.
 * 
 * @example
 * {
 *   "permissionId": 5
 * }
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

/**
 * DTO for linking a permission to an existing route
 * 
 * This DTO is used to:
 * - Associate a permission with an existing unmapped route
 * - Change the permission requirement for an already-mapped route
 * - Re-link a route after unlinking its previous permission
 * 
 * Use Cases:
 * 1. Initial Setup: Link discovered routes to appropriate permissions
 * 2. Permission Changes: Update security requirements for specific endpoints
 * 3. Access Control Updates: Adjust permission granularity as system evolves
 * 
 * The service layer validates:
 * - Route exists in the database
 * - Permission ID exists in permissions table
 * - No circular dependencies or conflicts
 */
export class LinkPermissionDto {
  /**
   * ID of the permission to link to the route
   * 
   * Must reference an existing permission in the permissions table.
   * This permission will become the requirement for accessing the route.
   * 
   * When linking a permission:
   * - Previous permission link (if any) is replaced
   * - Route becomes protected immediately (guard enforces permission)
   * - All users without this permission lose access to the route
   * - Security audit log records the permission change
   * 
   * @example 5
   */
  @ApiProperty({
    description:
      'ID of the permission to link to the route (must exist in permissions table)',
    example: 5,
    type: 'integer',
    minimum: 1,
  })
  @IsInt()
  @IsPositive()
  permissionId: number;
}
