/**
 * @file discovered-route.dto.ts
 * @description Response DTO for routes discovered via NestJS metadata scanning.
 * 
 * Contains comprehensive information about each discovered route including:
 * - Route details (path, method, controller)
 * - Mapping status (is it already mapped?)
 * - Public status (has @Public() decorator?)
 * - Suggested permission name (based on naming conventions)
 * - Current permission (if already mapped)
 * 
 * Used by the route discovery API to present mapping opportunities to administrators.
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Response DTO representing a discovered API route
 * 
 * This DTO provides full context about a route discovered through
 * NestJS metadata scanning, enabling administrators to understand:
 * - What routes exist in the application
 * - Which routes are already secured with permissions
 * - Which routes need permission mappings
 * - What permission names are suggested by convention
 * 
 * The discovery process:
 * 1. Scans all registered NestJS controllers
 * 2. Extracts route metadata (path, method, handler)
 * 3. Checks for @Public() decorator
 * 4. Queries database for existing mappings
 * 5. Generates suggested permission names
 * 6. Populates this DTO with comprehensive data
 */
export class DiscoveredRouteDto {
  /**
   * API endpoint path
   * 
   * Normalized Express route pattern with parameters.
   * Examples:
   * - "/api/admin/products"
   * - "/api/admin/products/:id"
   * - "/api/vendors/:vendorId/products/:productId"
   * 
   * @example "/api/admin/products/:id"
   */
  @ApiProperty({
    description: 'API endpoint path (Express route pattern)',
    example: '/api/admin/products/:id',
  })
  path: string;

  /**
   * HTTP method
   * 
   * Standard HTTP methods used for this route.
   * Each method typically represents different permission levels:
   * - GET: View/read permissions
   * - POST: Create permissions
   * - PUT/PATCH: Edit/update permissions
   * - DELETE: Delete permissions
   * 
   * @example "GET"
   */
  @ApiProperty({
    description: 'HTTP method',
    example: 'GET',
    enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  })
  method: string;

  /**
   * Name of the NestJS controller class
   * 
   * Identifies which controller handles this route.
   * Used to understand the context and resource being controlled.
   * 
   * Naming Convention:
   * - Typically ends with "Controller"
   * - Singular resource names (ProductsController, not ProductController)
   * - Reflects the resource type (OrdersController, UsersController)
   * 
   * @example "ProductsController"
   */
  @ApiProperty({
    description: 'Controller class name',
    example: 'ProductsController',
  })
  controllerName: string;

  /**
   * Name of the route handler method
   * 
   * The actual method in the controller that handles this route.
   * Method names often follow conventions that map to permissions:
   * - findAll, findOne, search → view permission
   * - create, add → create permission
   * - update, patch, edit → edit permission
   * - remove, delete → delete permission
   * 
   * Used by auto-mapping algorithm to suggest permission names.
   * 
   * @example "findOne"
   */
  @ApiProperty({
    description: 'Handler method name in the controller',
    example: 'findOne',
  })
  handlerName: string;

  /**
   * Whether route has @Public() decorator
   * 
   * Public routes bypass authentication and permission checks.
   * True indicates:
   * - No JWT required
   * - No permission check performed
   * - Open to anonymous access
   * - Should not be mapped to permissions
   * 
   * Use Cases for Public Routes:
   * - Health checks, status endpoints
   * - Authentication endpoints (login, register)
   * - Public product listings
   * - Documentation pages
   * 
   * @example false
   */
  @ApiProperty({
    description: 'Whether route has @Public() decorator (no auth required)',
    example: false,
    type: 'boolean',
  })
  isPublic: boolean;

  /**
   * Whether route is already mapped to a permission
   * 
   * Indicates if this route exists in the Route table with a permission link.
   * 
   * True: Route has existing mapping (see currentPermission for details)
   * False: Route needs mapping (see suggestedPermission for recommendation)
   * 
   * Mapping Status Workflow:
   * - Unmapped routes (false) appear in "unmapped routes" endpoint
   * - Mapped routes (true) show current permission in discovery results
   * - Auto-mapping can update unmapped routes to mapped
   * 
   * @example true
   */
  @ApiProperty({
    description:
      'Whether route already exists in Route table with permission mapping',
    example: true,
    type: 'boolean',
  })
  isMapped: boolean;

  /**
   * Suggested permission name based on naming conventions
   * 
   * Auto-generated permission name following the pattern: {action}_{resource}
   * 
   * Generation Algorithm:
   * 1. Extract resource from controller name (ProductsController → products)
   * 2. Map handler name to action:
   *    - findAll, findOne, search → view
   *    - create, add → create
   *    - update, patch, edit → edit
   *    - remove, delete → delete
   *    - Custom methods → extract verb (e.g., banUser → ban_users)
   * 3. Combine: action_resource (e.g., view_products, create_orders)
   * 
   * Examples:
   * - ProductsController.findAll() → "view_products"
   * - OrdersController.create() → "create_orders"
   * - UsersController.banUser() → "ban_users"
   * - VendorsController.approveVerification() → "approve_verification_vendors"
   * 
   * @example "view_products"
   */
  @ApiProperty({
    description:
      'Auto-generated permission name based on naming conventions (action_resource)',
    example: 'view_products',
  })
  suggestedPermission: string;

  /**
   * Current permission name (if route is already mapped)
   * 
   * Shows the actual permission currently linked to this route in the database.
   * Only present when isMapped = true.
   * 
   * Comparison Use Case:
   * - Compare currentPermission vs. suggestedPermission
   * - Identify mismatches or manual overrides
   * - Detect routes that deviate from naming conventions
   * 
   * @example "manage_products"
   */
  @ApiPropertyOptional({
    description:
      'Current permission name (only present if route is already mapped)',
    example: 'manage_products',
    type: 'string',
    nullable: true,
  })
  currentPermission?: string;

  /**
   * Database ID of the route mapping (if exists)
   * 
   * Primary key of the Route entity in the database.
   * Only present when isMapped = true.
   * 
   * Use Cases:
   * - Update existing mapping (PUT /admin/routes/:id/permission)
   * - Delete existing mapping (DELETE /admin/routes/:id/permission)
   * - Reference in audit logs
   * 
   * @example 42
   */
  @ApiPropertyOptional({
    description:
      'Database ID of the route mapping (only present if already mapped)',
    example: 42,
    type: 'integer',
    nullable: true,
  })
  routeId?: number;
}
