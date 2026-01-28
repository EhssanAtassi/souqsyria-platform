/**
 * @file mapping-statistics.dto.ts
 * @description Response DTO providing statistics about route-permission mappings.
 * 
 * Offers administrators a high-level view of:
 * - How many routes exist vs. how many are mapped
 * - Coverage percentage (security posture indicator)
 * - Breakdown by HTTP method and controller
 * - Public vs. protected route counts
 * 
 * Used for security dashboards and compliance reporting.
 */

import { ApiProperty } from '@nestjs/swagger';

/**
 * Response DTO with comprehensive route mapping statistics
 * 
 * This DTO provides a complete overview of the route security posture,
 * enabling administrators to:
 * - Track mapping completeness (coverage percentage)
 * - Identify gaps in security coverage (unmapped routes)
 * - Understand distribution across HTTP methods
 * - Monitor controller-level security patterns
 * 
 * Use Cases:
 * - Security dashboards showing coverage metrics
 * - Compliance reports demonstrating access control
 * - Monitoring after deployments (detect new unmapped routes)
 * - Planning permission assignment strategies
 */
export class MappingStatisticsDto {
  /**
   * Total number of routes discovered in the application
   * 
   * Includes all routes from all controllers, regardless of:
   * - Mapping status (mapped or unmapped)
   * - Public status (public or protected)
   * - HTTP method
   * 
   * Calculated by scanning all registered NestJS controllers
   * and extracting route metadata from decorators.
   * 
   * @example 127
   */
  @ApiProperty({
    description: 'Total number of routes discovered in the application',
    example: 127,
    type: 'integer',
  })
  total: number;

  /**
   * Number of routes with permission mappings
   * 
   * Count of routes that have been explicitly mapped to permissions
   * in the Route table. These routes are protected by the PermissionsGuard.
   * 
   * Calculation:
   * - Routes with route.permission !== null
   * - Excludes public routes (those with @Public() decorator)
   * 
   * @example 98
   */
  @ApiProperty({
    description: 'Number of routes mapped to permissions',
    example: 98,
    type: 'integer',
  })
  mapped: number;

  /**
   * Number of routes without permission mappings
   * 
   * Count of routes that exist in the application but are not
   * yet mapped to permissions in the Route table.
   * 
   * These routes are effectively public (accessible to all authenticated users)
   * until explicitly mapped to a permission.
   * 
   * Recommendation:
   * - Keep unmapped count as low as possible
   * - Regularly review and map new routes
   * - Use auto-mapping to reduce unmapped count
   * 
   * @example 15
   */
  @ApiProperty({
    description: 'Number of routes not yet mapped to permissions',
    example: 15,
    type: 'integer',
  })
  unmapped: number;

  /**
   * Number of routes marked as public with @Public() decorator
   * 
   * Count of routes that bypass authentication and authorization entirely.
   * These routes are intentionally unsecured for public access.
   * 
   * Common Public Routes:
   * - Health checks (/health, /status)
   * - Authentication endpoints (/auth/login, /auth/register)
   * - Public product listings (/public/products)
   * - API documentation (/api/docs)
   * 
   * Security Review:
   * - Regularly audit public routes
   * - Ensure only appropriate routes are public
   * - Consider rate limiting on public endpoints
   * 
   * @example 14
   */
  @ApiProperty({
    description: 'Number of routes marked as public (have @Public() decorator)',
    example: 14,
    type: 'integer',
  })
  public: number;

  /**
   * Breakdown of routes by HTTP method
   * 
   * Distribution showing how many routes exist for each HTTP method.
   * Useful for understanding API composition and security patterns.
   * 
   * Typical Patterns:
   * - GET: Usually highest count (read operations)
   * - POST: Create operations
   * - PUT/PATCH: Update operations (PUT often higher)
   * - DELETE: Remove operations (usually lowest count)
   * 
   * Security Insight:
   * - Ensure destructive methods (DELETE) have stricter permissions
   * - Monitor POST/PUT/DELETE for proper authentication
   * - GET endpoints may have broader access
   * 
   * @example { "GET": 52, "POST": 28, "PUT": 23, "PATCH": 8, "DELETE": 16 }
   */
  @ApiProperty({
    description: 'Number of routes grouped by HTTP method',
    example: {
      GET: 52,
      POST: 28,
      PUT: 23,
      PATCH: 8,
      DELETE: 16,
    },
    type: 'object',
    additionalProperties: {
      type: 'integer',
    },
  })
  byMethod: Record<string, number>;

  /**
   * Breakdown of routes by controller
   * 
   * Distribution showing how many routes each controller exposes.
   * Helps identify:
   * - Controllers with many endpoints (may need review)
   * - Resource distribution across controllers
   * - Controllers that need permission mapping attention
   * 
   * Format: { "ControllerName": route_count }
   * 
   * Use Cases:
   * - Identify large controllers that may benefit from splitting
   * - Focus mapping efforts on high-route-count controllers
   * - Understand API surface area by resource type
   * 
   * @example { "ProductsController": 12, "OrdersController": 15, "UsersController": 18 }
   */
  @ApiProperty({
    description: 'Number of routes grouped by controller',
    example: {
      ProductsController: 12,
      OrdersController: 15,
      UsersController: 18,
      VendorsController: 10,
      AdminDashboardController: 8,
    },
    type: 'object',
    additionalProperties: {
      type: 'integer',
    },
  })
  byController: Record<string, number>;

  /**
   * Percentage of routes that are mapped to permissions
   * 
   * Key security metric indicating overall access control coverage.
   * Calculated as: (mapped / (total - public)) * 100
   * 
   * Excludes public routes from calculation since they're intentionally unsecured.
   * 
   * Coverage Guidelines:
   * - 0-50%: Critical - Significant security gaps
   * - 50-75%: Warning - Needs improvement
   * - 75-90%: Good - Most routes protected
   * - 90-100%: Excellent - Comprehensive security
   * 
   * Target: Aim for 95%+ coverage
   * 
   * @example 87.5
   */
  @ApiProperty({
    description:
      'Percentage of non-public routes that are mapped to permissions',
    example: 87.5,
    type: 'number',
    minimum: 0,
    maximum: 100,
  })
  coveragePercentage: number;
}
