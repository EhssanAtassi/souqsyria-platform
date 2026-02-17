/**
 * @file auto-mapping-result.dto.ts
 * @description Response DTO for auto-generation of route-permission mappings.
 *
 * Provides detailed feedback about the auto-mapping operation including:
 * - Success counts (how many mappings created)
 * - Skip counts (routes that were skipped and why)
 * - Failure counts (errors encountered)
 * - Detailed error messages for troubleshooting
 * - List of successfully created mappings
 *
 * Supports both dry-run preview and actual execution modes.
 */

import { ApiProperty } from '@nestjs/swagger';

/**
 * Individual mapping details in the result
 *
 * Represents a single route-permission mapping that was created
 * or would be created (in dry-run mode).
 */
class CreatedMappingDetail {
  /**
   * API endpoint path that was mapped
   * @example "/api/admin/products"
   */
  @ApiProperty({
    description: 'API endpoint path',
    example: '/api/admin/products',
  })
  path: string;

  /**
   * HTTP method that was mapped
   * @example "GET"
   */
  @ApiProperty({
    description: 'HTTP method',
    example: 'GET',
  })
  method: string;

  /**
   * Permission name that was linked
   * @example "view_products"
   */
  @ApiProperty({
    description: 'Permission name linked to this route',
    example: 'view_products',
  })
  permission: string;
}

/**
 * Error details for failed mapping attempts
 *
 * Provides context about why a specific route mapping failed,
 * enabling administrators to troubleshoot issues.
 */
class MappingErrorDetail {
  /**
   * Route identifier (path + method)
   * @example "GET /api/admin/products"
   */
  @ApiProperty({
    description: 'Route that failed (method + path)',
    example: 'GET /api/admin/products',
  })
  route: string;

  /**
   * Error message explaining the failure
   * @example "Permission 'view_products' not found in database"
   */
  @ApiProperty({
    description: 'Reason for failure',
    example: "Permission 'view_products' not found in database",
  })
  error: string;
}

/**
 * Response DTO for auto-mapping operation results
 *
 * This DTO provides comprehensive feedback about the auto-mapping process,
 * whether executed as a dry-run preview or actual database operation.
 *
 * The auto-mapping process:
 * 1. Discovers all routes via metadata scanning
 * 2. Generates suggested permission names
 * 3. Validates permission existence in database
 * 4. Creates mappings (or previews them in dry-run mode)
 * 5. Tracks successes, skips, and failures
 * 6. Returns detailed results in this DTO
 *
 * Use Cases:
 * - Preview mappings before execution (dryRun=true)
 * - Review what was created after execution (dryRun=false)
 * - Identify missing permissions that need to be created
 * - Troubleshoot mapping failures
 * - Audit auto-mapping operations
 */
export class AutoMappingResultDto {
  /**
   * Number of route mappings successfully created
   *
   * In dry-run mode:
   * - Indicates how many mappings WOULD be created
   * - No actual database changes occur
   *
   * In execution mode:
   * - Indicates actual mappings created in database
   * - These routes are now protected by permissions
   *
   * @example 45
   */
  @ApiProperty({
    description:
      'Number of mappings created (or would be created in dry-run mode)',
    example: 45,
    type: 'integer',
  })
  created: number;

  /**
   * Number of routes that were skipped during auto-mapping
   *
   * Routes are skipped when:
   * - They already have existing mappings (if skipExisting=true)
   * - They have @Public() decorator (public routes don't need permissions)
   * - They match exclusion patterns
   *
   * Skipped routes are not errors - they're intentionally ignored based on options.
   *
   * @example 12
   */
  @ApiProperty({
    description: 'Number of routes skipped (already mapped or public routes)',
    example: 12,
    type: 'integer',
  })
  skipped: number;

  /**
   * Number of routes that failed to map
   *
   * Common failure reasons:
   * - Suggested permission doesn't exist in database
   * - Duplicate route mapping detected
   * - Database constraint violations
   * - Invalid route format
   *
   * See errors array for detailed failure information.
   *
   * Failed routes remain unmapped and require manual intervention:
   * - Create missing permissions manually
   * - Fix data issues
   * - Run auto-mapping again
   *
   * @example 3
   */
  @ApiProperty({
    description: 'Number of routes that failed to map (see errors array)',
    example: 3,
    type: 'integer',
  })
  failed: number;

  /**
   * Detailed error information for failed mappings
   *
   * Each error includes:
   * - route: Identifier of the failing route (e.g., "GET /api/admin/products")
   * - error: Specific error message explaining the failure
   *
   * Common Error Patterns:
   *
   * 1. Missing Permission:
   *    "Permission 'view_products' not found in database"
   *    → Solution: Create the permission or use createMissingPermissions=true
   *
   * 2. Duplicate Mapping:
   *    "Route mapping already exists for GET /api/admin/products"
   *    → Solution: Use skipExisting=true or delete existing mapping
   *
   * 3. Invalid Permission ID:
   *    "Permission ID 999 does not exist"
   *    → Solution: Verify permission data integrity
   *
   * Troubleshooting Workflow:
   * - Review errors array
   * - Address each error (create permissions, fix data)
   * - Re-run auto-mapping
   * - Verify failed count decreases
   *
   * @example [{ "route": "GET /api/admin/analytics", "error": "Permission 'view_analytics' not found" }]
   */
  @ApiProperty({
    description: 'Detailed error information for each failed mapping',
    type: [MappingErrorDetail],
    example: [
      {
        route: 'GET /api/admin/analytics',
        error: "Permission 'view_analytics' not found in database",
      },
      {
        route: 'POST /api/admin/reports/generate',
        error: "Permission 'generate_reports' not found in database",
      },
    ],
  })
  errors: Array<{ route: string; error: string }>;

  /**
   * List of successfully created mappings
   *
   * Each entry shows:
   * - path: API endpoint path
   * - method: HTTP method
   * - permission: Permission name that was linked
   *
   * In dry-run mode:
   * - Shows what WOULD be created
   * - Useful for preview and validation
   *
   * In execution mode:
   * - Shows what WAS actually created
   * - Useful for audit trails
   *
   * Use Cases:
   * - Verify correct permission assignments
   * - Review naming convention adherence
   * - Audit trail for security compliance
   * - Documentation of security mappings
   *
   * @example [{ "path": "/api/admin/products", "method": "GET", "permission": "view_products" }]
   */
  @ApiProperty({
    description:
      'List of successfully created mappings with details (preview in dry-run, actual in execution)',
    type: [CreatedMappingDetail],
    example: [
      {
        path: '/api/admin/products',
        method: 'GET',
        permission: 'view_products',
      },
      {
        path: '/api/admin/products',
        method: 'POST',
        permission: 'create_products',
      },
      {
        path: '/api/admin/products/:id',
        method: 'PUT',
        permission: 'edit_products',
      },
    ],
  })
  createdMappings: Array<{
    path: string;
    method: string;
    permission: string;
  }>;
}
