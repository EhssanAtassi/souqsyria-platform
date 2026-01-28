/**
 * @file create-route-mapping.dto.ts
 * @description DTO for creating a single route-to-permission mapping.
 * 
 * Used when manually creating route mappings through the API.
 * Validates that the route path follows REST conventions and that the permission exists.
 * 
 * @example
 * {
 *   "path": "/api/admin/products",
 *   "method": "GET",
 *   "permissionId": 5
 * }
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  IsPositive,
  IsIn,
  Matches,
  IsNotEmpty,
} from 'class-validator';

/**
 * DTO for creating a route-to-permission mapping
 * 
 * This DTO is used when administrators manually create mappings between
 * API routes and permissions. It ensures data integrity by validating:
 * - Path format (must start with /)
 * - HTTP method validity
 * - Permission ID existence
 */
export class CreateRouteMappingDto {
  /**
   * API endpoint path
   * 
   * Must start with a forward slash and follow REST conventions.
   * Supports route parameters using Express syntax (e.g., /api/products/:id)
   * 
   * Valid Examples:
   * - "/api/admin/products"
   * - "/api/admin/users/:id"
   * - "/api/vendors/:vendorId/products"
   * 
   * Invalid Examples:
   * - "api/products" (missing leading slash)
   * - "/api/products?" (query parameters not allowed)
   * 
   * @example "/api/admin/products"
   */
  @ApiProperty({
    description: 'API endpoint path (must start with /)',
    example: '/api/admin/products',
    pattern: '^/.*$',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\/.*$/, {
    message: 'Path must start with a forward slash (/)',
  })
  path: string;

  /**
   * HTTP method for this route
   * 
   * Standard HTTP methods used in REST APIs.
   * Each method represents a different operation:
   * - GET: Retrieve data (read)
   * - POST: Create new resources
   * - PUT: Update entire resources (full replacement)
   * - PATCH: Partially update resources
   * - DELETE: Remove resources
   * - OPTIONS: CORS preflight requests
   * - HEAD: Get headers only (no body)
   * 
   * @example "GET"
   */
  @ApiProperty({
    description: 'HTTP method',
    example: 'GET',
    enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'], {
    message:
      'Method must be one of: GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD',
  })
  method: string;

  /**
   * ID of the permission required to access this route
   * 
   * Must reference an existing permission in the permissions table.
   * The service layer will validate that this permission ID exists
   * before creating the route mapping.
   * 
   * @example 5
   */
  @ApiProperty({
    description: 'ID of the permission required for this route',
    example: 5,
    type: 'integer',
    minimum: 1,
  })
  @IsInt()
  @IsPositive()
  permissionId: number;
}
