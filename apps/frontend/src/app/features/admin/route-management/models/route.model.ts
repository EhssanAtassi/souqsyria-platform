import { Permission } from '../../role-management/models';

/**
 * HTTP methods supported by the API routes
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/**
 * Route mapping status classification
 * - mapped: Route has an associated permission
 * - unmapped: Route has no permission assigned
 * - public: Route is publicly accessible without authentication
 */
export type RouteStatus = 'mapped' | 'unmapped' | 'public';

/**
 * Core route entity representing an API endpoint
 */
export interface Route {
  /**
   * Unique identifier for the route
   */
  id: string;

  /**
   * API path pattern (e.g., '/api/users/:id')
   */
  path: string;

  /**
   * HTTP method for this endpoint
   */
  method: HttpMethod;

  /**
   * NestJS controller name that handles this route
   */
  controller: string;

  /**
   * Handler method name within the controller
   */
  handler: string;

  /**
   * Associated permission ID (null if unmapped or public)
   */
  permissionId: string | null;

  /**
   * Populated permission object (via JOIN query)
   */
  permission?: Permission;

  /**
   * Whether this route is publicly accessible without authentication
   */
  isPublic: boolean;

  /**
   * AI-suggested permission name based on naming conventions
   */
  suggestedPermission: string | null;

  /**
   * Record creation timestamp
   */
  createdAt: Date;

  /**
   * Last update timestamp
   */
  updatedAt: Date;
}

/**
 * Data transfer object for creating route-permission mappings
 */
export interface RoutePermissionMapping {
  /**
   * Route to map
   */
  routeId: string;

  /**
   * Permission to assign
   */
  permissionId: string;

  /**
   * User who created this mapping
   */
  createdBy?: number;

  /**
   * Mapping creation timestamp
   */
  createdAt?: Date;
}

/**
 * Data transfer object for creating a new route
 */
export interface CreateRouteDto {
  /**
   * API path pattern
   */
  path: string;

  /**
   * HTTP method
   */
  method: HttpMethod;

  /**
   * Controller name
   */
  controller: string;

  /**
   * Handler method name
   */
  handler: string;

  /**
   * Optional permission ID to assign immediately
   */
  permissionId?: string;

  /**
   * Whether route is publicly accessible
   * @default false
   */
  isPublic?: boolean;
}

/**
 * Data transfer object for updating an existing route
 */
export interface UpdateRouteDto {
  /**
   * New permission ID (null to unmap)
   */
  permissionId?: string | null;

  /**
   * Update public access flag
   */
  isPublic?: boolean;
}

/**
 * Data transfer object for linking a permission to a route
 */
export interface LinkPermissionDto {
  /**
   * Route to link
   */
  routeId: string;

  /**
   * Permission to assign
   */
  permissionId: string;
}

/**
 * Simple route summary for nested data structures
 */
export interface RouteReference {
  /**
   * Route identifier
   */
  id: string;

  /**
   * API path
   */
  path: string;

  /**
   * HTTP method
   */
  method: HttpMethod;
}

/**
 * Detailed route information with additional metadata
 */
export interface RouteDetail extends Route {
  /**
   * Number of requests to this endpoint (if available)
   */
  requestCount?: number;

  /**
   * Last time this route was accessed
   */
  lastAccessed?: Date;

  /**
   * Whether this route has security vulnerabilities
   */
  hasSecurityIssues?: boolean;
}
