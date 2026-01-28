/**
 * @file permission.decorator.ts
 * @description Decorator to explicitly define permission requirements for routes
 * 
 * @swagger
 * @tags Authorization Decorators
 * 
 * @example
 * ```typescript
 * @Controller('products')
 * export class ProductsController {
 *   @RequirePermission('view_products')
 *   @Get()
 *   async findAll() {
 *     // This route requires 'view_products' permission
 *   }
 * 
 *   @RequirePermission('create_products', 'manage_inventory')
 *   @Post()
 *   async create(@Body() dto: CreateProductDto) {
 *     // This route requires BOTH permissions
 *   }
 * }
 * ```
 */

import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key for storing required permissions
 * Used by the PermissionsGuard to check user permissions
 */
export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator to explicitly define permission requirements for a route
 * 
 * When multiple permissions are provided, ALL must be satisfied (AND logic)
 * For OR logic, use separate route handlers or implement custom guard logic
 * 
 * This decorator is used by:
 * - Route discovery service to map routes to permissions
 * - Permissions guard to enforce access control
 * - Swagger documentation to show required permissions
 * 
 * @param permissions - One or more permission names required to access the route
 * @returns MethodDecorator
 * 
 * @example
 * ```typescript
 * // Single permission
 * @RequirePermission('delete_products')
 * @Delete(':id')
 * async remove(@Param('id') id: string) {}
 * 
 * // Multiple permissions (AND logic)
 * @RequirePermission('edit_products', 'manage_inventory')
 * @Patch(':id')
 * async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {}
 * ```
 */
export const RequirePermission = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
