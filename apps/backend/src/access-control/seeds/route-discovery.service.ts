/**
 * @file route-discovery.service.ts
 * @description Service for discovering all NestJS routes using reflection and mapping them to permissions
 * 
 * @swagger
 * @tags Route Discovery
 */

import { Injectable, Logger, Type } from '@nestjs/common';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { PATH_METADATA, METHOD_METADATA } from '@nestjs/common/constants';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';
import { PERMISSIONS_KEY } from '../../common/decorators/permission.decorator';

/**
 * Interface representing a discovered route with metadata
 */
export interface DiscoveredRoute {
  /**
   * Full route path (e.g., '/api/products/:id')
   */
  path: string;

  /**
   * HTTP method (GET, POST, PUT, PATCH, DELETE, etc.)
   */
  method: string;

  /**
   * Controller class name (e.g., 'ProductsController')
   */
  controllerName: string;

  /**
   * Handler method name (e.g., 'findAll', 'create')
   */
  handlerName: string;

  /**
   * Whether the route is marked as public (no authentication)
   */
  isPublic: boolean;

  /**
   * Explicitly defined permissions via @RequirePermission decorator
   */
  explicitPermissions: string[];

  /**
   * Auto-generated permission based on naming conventions
   */
  suggestedPermission: string | null;

  /**
   * Resource name extracted from controller (e.g., 'products')
   */
  resource: string;
}

/**
 * Result of route discovery and mapping operation
 */
export interface RouteDiscoveryResult {
  /**
   * Total number of routes discovered
   */
  totalRoutes: number;

  /**
   * Number of public routes (no permission needed)
   */
  publicRoutes: number;

  /**
   * Number of routes with explicit permissions
   */
  explicitlyMapped: number;

  /**
   * Number of routes auto-mapped by convention
   */
  autoMapped: number;

  /**
   * Number of routes that couldn't be mapped
   */
  unmapped: number;

  /**
   * All discovered routes with their metadata
   */
  routes: DiscoveredRoute[];

  /**
   * Routes that couldn't be mapped to permissions
   */
  unmappedRoutes: DiscoveredRoute[];
}

/**
 * Service for discovering and analyzing all routes in the NestJS application
 * 
 * Uses NestJS reflection APIs to:
 * - Find all controllers and their route handlers
 * - Extract route metadata (path, method, decorators)
 * - Auto-map routes to permissions using naming conventions
 * - Identify public routes that don't require authentication
 * 
 * @example
 * ```typescript
 * const result = await routeDiscoveryService.discoverAllRoutes();
 * console.log(`Discovered ${result.totalRoutes} routes`);
 * console.log(`Unmapped: ${result.unmapped}`);
 * ```
 */
@Injectable()
export class RouteDiscoveryService {
  private readonly logger = new Logger(RouteDiscoveryService.name);

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    private readonly reflector: Reflector,
  ) {}

  /**
   * Discovers all routes in the application with their metadata
   * 
   * Process:
   * 1. Find all controller classes using DiscoveryService
   * 2. Scan each controller for route handler methods
   * 3. Extract metadata (path, method, decorators)
   * 4. Auto-map to permissions using conventions
   * 5. Generate comprehensive report
   * 
   * @returns Promise<RouteDiscoveryResult> - Complete discovery results
   */
  async discoverAllRoutes(): Promise<RouteDiscoveryResult> {
    this.logger.log('🔍 Starting route discovery...');

    const routes: DiscoveredRoute[] = [];

    // Get all controllers from the application
    const controllers = this.discoveryService
      .getControllers()
      .filter((wrapper: InstanceWrapper) => wrapper.metatype && wrapper.instance);

    this.logger.debug(`Found ${controllers.length} controllers`);

    // Process each controller
    for (const controllerWrapper of controllers) {
      const { metatype: controller, instance } = controllerWrapper;

      if (!controller || !instance) {
        continue;
      }

      // Get controller-level route prefix
      const controllerPath = this.getControllerPath(controller as Type<any>);
      const controllerName = controller.name;

      this.logger.debug(`Scanning controller: ${controllerName} (${controllerPath})`);

      // Scan all methods in the controller
      const methodNames = this.metadataScanner.getAllMethodNames(
        Object.getPrototypeOf(instance),
      );

      for (const methodName of methodNames) {
        try {
          const method = instance[methodName];
          const route = this.extractRouteMetadata(
            controller as Type<any>,
            controllerPath,
            controllerName,
            methodName,
            method,
          );

          if (route) {
            routes.push(route);
          }
        } catch (error) {
          this.logger.warn(
            `Failed to extract metadata for ${controllerName}.${methodName}: ${error.message}`,
          );
        }
      }
    }

    // Generate statistics
    const result = this.generateDiscoveryResult(routes);

    this.logger.log(`✅ Route discovery completed: ${result.totalRoutes} routes found`);
    this.logDiscoveryStats(result);

    return result;
  }

  /**
   * Extracts metadata for a single route handler method
   * 
   * @param controller - Controller class
   * @param controllerPath - Controller base path
   * @param controllerName - Controller class name
   * @param methodName - Handler method name
   * @param method - Handler method function
   * @returns DiscoveredRoute | null
   */
  private extractRouteMetadata(
    controller: Type<any>,
    controllerPath: string,
    controllerName: string,
    methodName: string,
    method: Function,
  ): DiscoveredRoute | null {
    // Get HTTP method (GET, POST, etc.)
    const httpMethod = this.reflector.get<string>(METHOD_METADATA, method);
    if (!httpMethod) {
      // Not a route handler (likely a helper method)
      return null;
    }

    // Get route path
    const routePath = this.reflector.get<string>(PATH_METADATA, method) || '';
    const fullPath = this.buildFullPath(controllerPath, routePath);

    // Check if route is public
    const isPublic =
      this.reflector.get<boolean>(IS_PUBLIC_KEY, method) ||
      this.reflector.get<boolean>(IS_PUBLIC_KEY, controller) ||
      false;

    // Get explicit permissions from decorator
    const explicitPermissions =
      this.reflector.get<string[]>(PERMISSIONS_KEY, method) || [];

    // Extract resource name from controller
    const resource = this.extractResourceName(controllerName);

    // Auto-generate suggested permission
    const suggestedPermission = isPublic
      ? null
      : this.generatePermissionName(methodName, resource);

    return {
      path: fullPath,
      method: httpMethod.toUpperCase(),
      controllerName,
      handlerName: methodName,
      isPublic,
      explicitPermissions,
      suggestedPermission,
      resource,
    };
  }

  /**
   * Gets the base path for a controller from its @Controller decorator
   * 
   * @param controller - Controller class
   * @returns string - Controller path (e.g., 'products', 'admin/users')
   */
  private getControllerPath(controller: Type<any>): string {
    const path = this.reflector.get<string>(PATH_METADATA, controller) || '';
    return path.startsWith('/') ? path.slice(1) : path;
  }

  /**
   * Builds the full route path combining controller and method paths
   * 
   * @param controllerPath - Base controller path
   * @param methodPath - Method-specific path
   * @returns string - Full path (e.g., '/api/products/:id')
   */
  private buildFullPath(controllerPath: string, methodPath: string): string {
    const segments = [controllerPath, methodPath]
      .filter(Boolean)
      .map((seg) => seg.replace(/^\/|\/$/g, ''));

    return '/api/' + segments.join('/');
  }

  /**
   * Extracts resource name from controller class name
   * 
   * Conventions:
   * - ProductsController → products
   * - AdminUsersController → users (removes 'admin' prefix)
   * - UserManagementController → user-management
   * 
   * @param controllerName - Controller class name
   * @returns string - Resource name
   */
  private extractResourceName(controllerName: string): string {
    let name = controllerName.replace(/Controller$/i, '');

    // Remove common prefixes
    name = name.replace(/^(Admin|Public|Api|Syrian)/i, '');

    // Convert PascalCase to kebab-case
    name = name
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .toLowerCase();

    return name;
  }

  /**
   * Generates a permission name based on method name and resource
   * 
   * Mapping conventions:
   * - findAll, getAll, index → view_{resource}
   * - findOne, getById, show → view_{resource}
   * - create, store, add → create_{resource}
   * - update, patch, edit → edit_{resource}
   * - remove, delete, destroy → delete_{resource}
   * - approve → approve_{resource}
   * - reject → reject_{resource}
   * - bulk* → bulk_edit_{resource}
   * 
   * @param methodName - Handler method name
   * @param resource - Resource name
   * @returns string | null - Generated permission name
   */
  private generatePermissionName(
    methodName: string,
    resource: string,
  ): string | null {
    const method = methodName.toLowerCase();

    // View/Read operations
    if (/^(find|get|show|index|list|search|query|view)/.test(method)) {
      return `view_${resource}`;
    }

    // Create operations
    if (/^(create|store|add|insert|new)/.test(method)) {
      return `create_${resource}`;
    }

    // Update operations
    if (/^(update|patch|edit|modify|change)/.test(method)) {
      return `edit_${resource}`;
    }

    // Delete operations
    if (/^(remove|delete|destroy|drop)/.test(method)) {
      return `delete_${resource}`;
    }

    // Approval operations
    if (/^approve/.test(method)) {
      return `approve_${resource}`;
    }

    // Rejection operations
    if (/^reject/.test(method)) {
      return `reject_${resource}`;
    }

    // Bulk operations
    if (/^bulk/.test(method)) {
      return `bulk_edit_${resource}`;
    }

    // Import/Export operations
    if (/^import/.test(method)) {
      return `import_${resource}`;
    }

    if (/^export/.test(method)) {
      return `export_${resource}`;
    }

    // Process operations
    if (/^process/.test(method)) {
      return `process_${resource}`;
    }

    // Manage operations
    if (/^manage/.test(method)) {
      return `manage_${resource}`;
    }

    // Ban/Unban operations
    if (/^ban/.test(method)) {
      return `ban_${resource}`;
    }

    if (/^unban/.test(method)) {
      return `unban_${resource}`;
    }

    // Verify operations
    if (/^verify/.test(method)) {
      return `verify_${resource}`;
    }

    // Couldn't auto-map
    return null;
  }

  /**
   * Generates comprehensive discovery result with statistics
   * 
   * @param routes - All discovered routes
   * @returns RouteDiscoveryResult
   */
  private generateDiscoveryResult(
    routes: DiscoveredRoute[],
  ): RouteDiscoveryResult {
    const publicRoutes = routes.filter((r) => r.isPublic).length;
    const explicitlyMapped = routes.filter(
      (r) => !r.isPublic && r.explicitPermissions.length > 0,
    ).length;
    const autoMapped = routes.filter(
      (r) =>
        !r.isPublic &&
        r.explicitPermissions.length === 0 &&
        r.suggestedPermission !== null,
    ).length;
    const unmappedRoutes = routes.filter(
      (r) =>
        !r.isPublic &&
        r.explicitPermissions.length === 0 &&
        r.suggestedPermission === null,
    );

    return {
      totalRoutes: routes.length,
      publicRoutes,
      explicitlyMapped,
      autoMapped,
      unmapped: unmappedRoutes.length,
      routes,
      unmappedRoutes,
    };
  }

  /**
   * Logs comprehensive discovery statistics
   * 
   * @param result - Discovery result to log
   */
  private logDiscoveryStats(result: RouteDiscoveryResult): void {
    this.logger.log('📊 Route Discovery Statistics:');
    this.logger.log(`   └── Total Routes: ${result.totalRoutes}`);
    this.logger.log(`   └── Public Routes: ${result.publicRoutes}`);
    this.logger.log(`   └── Explicitly Mapped: ${result.explicitlyMapped}`);
    this.logger.log(`   └── Auto-Mapped: ${result.autoMapped}`);
    this.logger.log(`   └── Unmapped: ${result.unmapped}`);

    if (result.unmapped > 0) {
      this.logger.warn(`⚠️  ${result.unmapped} routes could not be auto-mapped:`);
      result.unmappedRoutes.forEach((route) => {
        this.logger.warn(
          `   - ${route.method} ${route.path} (${route.controllerName}.${route.handlerName})`,
        );
      });
    }
  }

  /**
   * Gets routes grouped by resource for easier analysis
   * 
   * @param routes - Discovered routes
   * @returns Map<string, DiscoveredRoute[]> - Routes grouped by resource
   */
  groupRoutesByResource(
    routes: DiscoveredRoute[],
  ): Map<string, DiscoveredRoute[]> {
    const grouped = new Map<string, DiscoveredRoute[]>();

    for (const route of routes) {
      const existing = grouped.get(route.resource) || [];
      existing.push(route);
      grouped.set(route.resource, existing);
    }

    return grouped;
  }

  /**
   * Validates that all routes have corresponding permissions in the system
   * 
   * @param routes - Discovered routes
   * @param existingPermissions - Set of existing permission names
   * @returns Array of missing permission names
   */
  validatePermissions(
    routes: DiscoveredRoute[],
    existingPermissions: Set<string>,
  ): string[] {
    const missingPermissions = new Set<string>();

    for (const route of routes) {
      if (route.isPublic) {
        continue;
      }

      // Check explicit permissions
      for (const permission of route.explicitPermissions) {
        if (!existingPermissions.has(permission)) {
          missingPermissions.add(permission);
        }
      }

      // Check suggested permission
      if (
        route.explicitPermissions.length === 0 &&
        route.suggestedPermission &&
        !existingPermissions.has(route.suggestedPermission)
      ) {
        missingPermissions.add(route.suggestedPermission);
      }
    }

    return Array.from(missingPermissions);
  }
}
