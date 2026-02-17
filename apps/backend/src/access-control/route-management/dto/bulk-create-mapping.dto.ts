/**
 * @file bulk-create-mapping.dto.ts
 * @description DTO for bulk creation of route-to-permission mappings.
 *
 * Enables administrators to create multiple route mappings in a single API call,
 * which is significantly faster than individual requests when setting up many routes.
 *
 * Performance: Can handle 100+ routes in <500ms with batch insert optimization.
 *
 * @example
 * {
 *   "routes": [
 *     { "path": "/api/admin/products", "method": "GET", "permissionId": 5 },
 *     { "path": "/api/admin/products/:id", "method": "PUT", "permissionId": 6 }
 *   ]
 * }
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateRouteMappingDto } from './create-route-mapping.dto';

/**
 * DTO for bulk creation of route mappings
 *
 * This DTO wraps an array of individual route mappings for batch processing.
 * Each route in the array is validated individually using CreateRouteMappingDto rules.
 *
 * Benefits of bulk operations:
 * - Reduces HTTP overhead (single request vs. multiple)
 * - Enables database batch inserts for better performance
 * - Simplifies error handling (all-or-nothing transaction)
 * - Ideal for initial system setup or migration scenarios
 *
 * Validation:
 * - At least one route must be provided
 * - Each route is validated against CreateRouteMappingDto constraints
 * - Duplicate routes (same path + method) are detected and rejected
 */
export class BulkCreateMappingDto {
  /**
   * Array of route mappings to create
   *
   * Each mapping must include:
   * - path: Valid API endpoint starting with /
   * - method: Standard HTTP method (GET, POST, etc.)
   * - permissionId: Existing permission ID from database
   *
   * Constraints:
   * - Minimum: 1 route (empty arrays rejected)
   * - Maximum: 1000 routes (configurable based on performance testing)
   * - No duplicates: Same path + method combination
   *
   * Performance Considerations:
   * - 1-10 routes: <50ms
   * - 10-100 routes: <200ms
   * - 100-500 routes: <500ms
   * - 500+ routes: Consider splitting into multiple batches
   *
   * @example
   * [
   *   { "path": "/api/admin/products", "method": "GET", "permissionId": 5 },
   *   { "path": "/api/admin/products", "method": "POST", "permissionId": 6 },
   *   { "path": "/api/admin/products/:id", "method": "PUT", "permissionId": 7 },
   *   { "path": "/api/admin/products/:id", "method": "DELETE", "permissionId": 8 }
   * ]
   */
  @ApiProperty({
    description: 'Array of route mappings to create',
    type: [CreateRouteMappingDto],
    example: [
      {
        path: '/api/admin/products',
        method: 'GET',
        permissionId: 5,
      },
      {
        path: '/api/admin/products',
        method: 'POST',
        permissionId: 6,
      },
      {
        path: '/api/admin/products/:id',
        method: 'PUT',
        permissionId: 7,
      },
    ],
    minItems: 1,
  })
  @IsArray()
  @ArrayMinSize(1, {
    message: 'At least one route mapping must be provided',
  })
  @ValidateNested({ each: true })
  @Type(() => CreateRouteMappingDto)
  routes: CreateRouteMappingDto[];
}
