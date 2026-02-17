/**
 * @file route-management.controller.ts
 * @description Controller for route-permission mapping management API.
 *
 * Provides 8 comprehensive endpoints for managing route-permission mappings:
 * 1. GET /discovery - Discover all application routes
 * 2. GET /unmapped - Get routes without permission mappings
 * 3. POST /bulk-create - Create multiple mappings at once
 * 4. PUT /:id/permission - Link permission to existing route
 * 5. DELETE /:id/permission - Unlink permission from route
 * 6. GET /by-permission/:id - Get routes by permission
 * 7. POST /generate-mappings - Auto-generate mappings
 * 8. GET /stats - Get mapping statistics
 *
 * Security:
 * - All endpoints require 'manage_routes' permission
 * - JWT authentication required
 * - Full audit logging via SecurityAuditService
 *
 * @author SouqSyria Security Team
 * @version 1.0.0
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
// NOTE: JwtAuthGuard and PermissionsGuard are global APP_GUARDs (see app.module.ts)
// No explicit @UseGuards needed - guards run automatically on all routes
import { RouteManagementService } from './services/route-management.service';
import { BulkCreateMappingDto } from './dto/bulk-create-mapping.dto';
import { LinkPermissionDto } from './dto/link-permission.dto';
import { AutoMappingOptionsDto } from './dto/auto-mapping-options.dto';
import { DiscoveredRouteDto } from './dto/discovered-route.dto';
import { MappingStatisticsDto } from './dto/mapping-statistics.dto';
import { AutoMappingResultDto } from './dto/auto-mapping-result.dto';

/**
 * Controller for route-permission mapping management
 *
 * This controller orchestrates the route-permission mapping system,
 * enabling administrators to:
 * - Discover all application routes via metadata scanning
 * - Create manual or automated route-permission mappings
 * - Monitor mapping coverage and security posture
 * - Link/unlink permissions dynamically
 *
 * All operations require 'manage_routes' permission and are fully audited.
 *
 * Workflow:
 * 1. GET /discovery to see all routes
 * 2. GET /unmapped to identify security gaps
 * 3. POST /generate-mappings?dryRun=true to preview auto-mapping
 * 4. POST /generate-mappings to execute auto-mapping
 * 5. PUT /:id/permission for manual adjustments
 * 6. GET /stats to verify coverage
 */
@ApiTags('Admin - Route Management')
@ApiBearerAuth()
// Guards applied globally via APP_GUARD - see app.module.ts
@Controller('admin/routes')
export class RouteManagementController {
  constructor(
    private readonly routeManagementService: RouteManagementService,
  ) {}

  /**
   * Endpoint 1: Discover All Routes
   *
   * Scans the entire application for registered routes and returns
   * comprehensive metadata including mapping status, suggested permissions,
   * and public route detection.
   *
   * Use Cases:
   * - Initial system audit
   * - Security review
   * - Understanding API surface area
   * - Identifying unmapped routes
   *
   * Performance: <1000ms for typical application (50-200 routes)
   *
   * @returns Array of discovered routes with full metadata
   */
  @Get('discovery')
  @ApiOperation({
    summary: 'Discover all application routes',
    description:
      'Scans NestJS controllers to discover all registered routes with their mapping status, ' +
      'suggested permissions, and public route detection. Provides complete API inventory for security management.',
  })
  @ApiResponse({
    status: 200,
    description: 'Routes discovered successfully',
    type: [DiscoveredRouteDto],
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Missing manage_routes permission',
  })
  async discoverRoutes(): Promise<DiscoveredRouteDto[]> {
    return this.routeManagementService.discoverAllRoutes();
  }

  /**
   * Endpoint 2: Get Unmapped Routes
   *
   * Returns routes that:
   * - Do NOT have @Public() decorator
   * - Are NOT yet mapped to permissions in database
   *
   * These routes represent security gaps that need administrator attention.
   *
   * Use Cases:
   * - Identify routes needing permission assignment
   * - Security gap analysis
   * - Post-deployment checks
   * - Compliance audits
   *
   * Performance: <200ms
   *
   * @returns Array of unmapped routes (excluding public routes)
   */
  @Get('unmapped')
  @ApiOperation({
    summary: 'Get routes without permission mappings',
    description:
      'Returns routes that lack permission mappings (excluding public routes). ' +
      'These routes require attention to ensure proper access control.',
  })
  @ApiResponse({
    status: 200,
    description: 'Unmapped routes retrieved successfully',
    type: [DiscoveredRouteDto],
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Missing manage_routes permission',
  })
  async getUnmappedRoutes(): Promise<DiscoveredRouteDto[]> {
    return this.routeManagementService.getUnmappedRoutes();
  }

  /**
   * Endpoint 3: Bulk Create Route Mappings
   *
   * Creates multiple route-permission mappings in a single operation.
   * Much faster than individual requests for batch setup scenarios.
   *
   * Features:
   * - Validates all permissions exist
   * - Detects and skips duplicates
   * - Returns detailed success/failure report
   * - Atomic transaction (all-or-nothing optional)
   *
   * Performance: <500ms for 100 routes
   *
   * Use Cases:
   * - Initial system setup
   * - Migration from another system
   * - Bulk permission changes
   * - Automated provisioning
   *
   * @param dto - Bulk creation request with array of route mappings
   * @param req - Request object for user identification
   * @returns Detailed results with created/skipped/failed counts
   */
  @Post('bulk-create')
  @ApiOperation({
    summary: 'Bulk create multiple route mappings',
    description:
      'Creates multiple route-permission mappings in a single efficient operation. ' +
      'Validates permissions, detects duplicates, and provides detailed success/failure reporting.',
  })
  @ApiResponse({
    status: 201,
    description: 'Bulk creation completed (see results for details)',
    schema: {
      type: 'object',
      properties: {
        created: { type: 'number', example: 45 },
        skipped: { type: 'number', example: 3 },
        failed: { type: 'number', example: 2 },
        errors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              route: { type: 'string', example: 'GET /api/admin/products' },
              error: { type: 'string', example: 'Permission not found' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid route mapping data',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Missing manage_routes permission',
  })
  async bulkCreateMappings(@Body() dto: BulkCreateMappingDto, @Req() req: any) {
    const userId = req.user?.id || 0;
    return this.routeManagementService.bulkCreateMappings(dto, userId);
  }

  /**
   * Endpoint 4: Link Permission to Route
   *
   * Associates an existing permission with an existing route.
   * Replaces any previous permission link.
   *
   * Use Cases:
   * - Initial permission assignment
   * - Changing permission requirements
   * - Fixing incorrectly mapped routes
   * - Security policy updates
   *
   * Performance: <100ms
   *
   * Security Impact:
   * - Route becomes protected immediately
   * - Users without new permission lose access
   * - Old permission no longer grants access
   *
   * @param id - Route ID to update
   * @param dto - Permission ID to link
   * @param req - Request object for user identification
   * @returns Updated route entity with linked permission
   */
  @Put(':id/permission')
  @ApiOperation({
    summary: 'Link permission to existing route',
    description:
      'Associates a permission with an existing route mapping. Replaces any previous permission link. ' +
      'Route becomes immediately protected by the new permission.',
  })
  @ApiParam({
    name: 'id',
    type: 'integer',
    description: 'Route ID',
    example: 42,
  })
  @ApiResponse({
    status: 200,
    description: 'Permission linked successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 42 },
        path: { type: 'string', example: '/api/admin/products' },
        method: { type: 'string', example: 'GET' },
        permission: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 5 },
            name: { type: 'string', example: 'view_products' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Route or permission does not exist',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Missing manage_routes permission',
  })
  async linkPermission(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: LinkPermissionDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id || 0;
    return this.routeManagementService.linkRouteToPermission(
      id,
      dto.permissionId,
      userId,
    );
  }

  /**
   * Endpoint 5: Unlink Permission from Route
   *
   * Removes permission association from a route, making it effectively public
   * (accessible without permission checks, but still requires authentication).
   *
   * Use Cases:
   * - Making route public
   * - Removing incorrect mappings
   * - Temporary access opening
   * - Migration scenarios
   *
   * Performance: <100ms
   *
   * Security Warning:
   * - Route becomes accessible to all authenticated users
   * - Use @Public() decorator for truly public routes instead
   * - Consider security implications before unlinking
   *
   * @param id - Route ID to unlink
   * @param req - Request object for user identification
   */
  @Delete(':id/permission')
  @ApiOperation({
    summary: 'Unlink permission from route (make route public)',
    description:
      'Removes permission association from route. Route becomes accessible without permission checks. ' +
      'Use cautiously - consider @Public() decorator for truly public routes instead.',
  })
  @ApiParam({
    name: 'id',
    type: 'integer',
    description: 'Route ID',
    example: 42,
  })
  @ApiResponse({
    status: 200,
    description: 'Permission unlinked successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Route does not exist',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Missing manage_routes permission',
  })
  async unlinkPermission(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    const userId = req.user?.id || 0;
    return this.routeManagementService.unlinkRouteFromPermission(id, userId);
  }

  /**
   * Endpoint 6: Get Routes by Permission
   *
   * Returns all routes that require a specific permission.
   * Useful for understanding permission scope and impact analysis.
   *
   * Use Cases:
   * - Understanding permission scope
   * - Impact analysis before permission changes
   * - Documentation generation
   * - Security audits
   *
   * Performance: <200ms
   *
   * @param id - Permission ID to query
   * @returns Array of routes protected by this permission
   */
  @Get('by-permission/:id')
  @ApiOperation({
    summary: 'Get all routes protected by specific permission',
    description:
      'Returns all routes that require the specified permission. ' +
      'Useful for understanding permission scope and impact analysis.',
  })
  @ApiParam({
    name: 'id',
    type: 'integer',
    description: 'Permission ID',
    example: 5,
  })
  @ApiResponse({
    status: 200,
    description: 'Routes retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 42 },
          path: { type: 'string', example: '/api/admin/products' },
          method: { type: 'string', example: 'GET' },
          permission: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 5 },
              name: { type: 'string', example: 'view_products' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Permission does not exist',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Missing manage_routes permission',
  })
  async getRoutesByPermission(@Param('id', ParseIntPipe) id: number) {
    return this.routeManagementService.getRoutesByPermission(id);
  }

  /**
   * Endpoint 7: Auto-Generate Route Mappings
   *
   * Automatically creates route-permission mappings based on:
   * - Discovered routes via metadata scanning
   * - Naming convention suggestions (action_resource pattern)
   * - Existing permissions in database
   *
   * Features:
   * - Dry run mode for safe preview (dryRun=true)
   * - Skip existing mappings option (skipExisting=true)
   * - Auto-create missing permissions (createMissingPermissions=true)
   * - Detailed success/failure reporting
   *
   * Performance: <1500ms for typical application
   *
   * Workflow:
   * 1. Run with dryRun=true to preview
   * 2. Review suggested mappings
   * 3. Create any missing permissions manually
   * 4. Run with dryRun=false to execute
   * 5. Review results and fix failures
   * 6. Verify with GET /stats
   *
   * @param options - Configuration options (query parameters)
   * @param req - Request object for user identification
   * @returns Detailed results of auto-mapping operation
   */
  @Post('generate-mappings')
  @ApiOperation({
    summary: 'Auto-generate route-permission mappings',
    description:
      'Automatically creates route-permission mappings based on naming conventions. ' +
      'Supports dry-run mode for safe preview before execution. ' +
      'Matches discovered routes with existing permissions using smart naming patterns.',
  })
  @ApiQuery({
    name: 'dryRun',
    required: false,
    type: 'boolean',
    description: 'Preview mode - analyze without creating mappings',
    example: true,
  })
  @ApiQuery({
    name: 'skipExisting',
    required: false,
    type: 'boolean',
    description: 'Skip routes that already have mappings',
    example: true,
  })
  @ApiQuery({
    name: 'createMissingPermissions',
    required: false,
    type: 'boolean',
    description: 'Auto-create missing permissions (use cautiously)',
    example: false,
  })
  @ApiResponse({
    status: 201,
    description: 'Auto-mapping completed (see results for details)',
    type: AutoMappingResultDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Missing manage_routes permission',
  })
  async autoGenerateMappings(
    @Query() options: AutoMappingOptionsDto,
    @Req() req: any,
  ): Promise<AutoMappingResultDto> {
    const userId = req.user?.id || 0;
    return this.routeManagementService.autoGenerateMappings(options, userId);
  }

  /**
   * Endpoint 8: Get Mapping Statistics
   *
   * Returns comprehensive statistics about route-permission mappings:
   * - Total routes discovered
   * - Mapped vs. unmapped counts
   * - Public route count
   * - Coverage percentage (key security metric)
   * - Distribution by HTTP method
   * - Distribution by controller
   *
   * Use Cases:
   * - Security dashboards
   * - Compliance reporting
   * - Monitoring coverage after deployments
   * - Identifying high-risk areas
   *
   * Performance: <100ms (uses aggregation)
   *
   * Target Coverage: 95%+ for production systems
   *
   * @returns Statistics DTO with comprehensive metrics
   */
  @Get('stats')
  @ApiOperation({
    summary: 'Get route mapping statistics',
    description:
      'Returns comprehensive statistics about route-permission mappings including ' +
      'total counts, coverage percentage, and breakdowns by method and controller. ' +
      'Key metric for monitoring security posture.',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics calculated successfully',
    type: MappingStatisticsDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Missing manage_routes permission',
  })
  async getMappingStatistics(): Promise<MappingStatisticsDto> {
    return this.routeManagementService.getMappingStatistics();
  }
}
