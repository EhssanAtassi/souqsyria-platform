import { inject } from '@angular/core';
import { Router, CanActivateFn, UrlTree, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { PermissionQuery } from '../../store/permissions/permission.query';

/**
 * Permission guard that checks if user has required permissions before allowing route access.
 *
 * This guard integrates with the Akita PermissionQuery to verify user permissions before
 * navigation. It supports both single and multiple permission checks with AND/OR logic.
 *
 * @description
 * The guard reads permission requirements from route data and checks them against the
 * current user's permissions. If access is denied, it redirects to an unauthorized page
 * with context about the attempted access.
 *
 * @usage
 * Configure in route definitions:
 * ```typescript
 * {
 *   path: 'admin/users',
 *   component: UserListComponent,
 *   canActivate: [permissionGuard],
 *   data: {
 *     requiredPermissions: ['manage_users'],
 *     permissionMode: 'all', // 'all' or 'any'
 *     redirectTo: '/unauthorized'
 *   }
 * }
 * ```
 *
 * @example Single permission check
 * ```typescript
 * data: { requiredPermissions: 'manage_users' }
 * ```
 *
 * @example Multiple permissions (all required - AND logic)
 * ```typescript
 * data: {
 *   requiredPermissions: ['manage_users', 'view_users'],
 *   permissionMode: 'all'
 * }
 * ```
 *
 * @example Multiple permissions (any required - OR logic)
 * ```typescript
 * data: {
 *   requiredPermissions: ['manage_users', 'manage_roles'],
 *   permissionMode: 'any'
 * }
 * ```
 *
 * @param route - The activated route snapshot containing permission requirements
 * @returns Observable<boolean | UrlTree> - true if access allowed, UrlTree for redirect if denied
 *
 * @remarks
 * - Returns true if no permissions are specified (with console warning)
 * - Logs all permission checks to console for debugging
 * - Includes returnUrl and reason in redirect query params
 * - Uses take(1) to prevent memory leaks from subscriptions
 *
 * @see {@link PermissionQuery} for permission checking logic
 * @see {@link UnauthorizedComponent} for the denied access page
 */
export const permissionGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot
): Observable<boolean | UrlTree> => {
  const permissionQuery = inject(PermissionQuery);
  const router = inject(Router);

  // Extract permission configuration from route data
  const requiredPermissions = route.data['requiredPermissions'];
  const permissionMode = route.data['permissionMode'] || 'all';
  const redirectTo = route.data['redirectTo'] || '/unauthorized';

  // If no permissions specified, allow access but log warning
  if (!requiredPermissions) {
    console.warn(
      '⚠️ Route has permissionGuard but no requiredPermissions specified:',
      route.routeConfig?.path
    );
    return of(true);
  }

  // Normalize permissions to array format
  const permissions = Array.isArray(requiredPermissions)
    ? requiredPermissions
    : [requiredPermissions];

  // Select appropriate permission check based on mode
  const checkPermissions$ = permissionMode === 'any'
    ? permissionQuery.hasAnyPermission(permissions)
    : permissionQuery.hasAllPermissions(permissions);

  // Execute permission check and handle result
  return checkPermissions$.pipe(
    take(1), // Prevent memory leaks by completing after first emission
    map(hasPermission => {
      if (hasPermission) {
        console.log('✅ Permission granted for route:', {
          path: route.routeConfig?.path,
          permissions,
          mode: permissionMode
        });
        return true;
      } else {
        console.warn('❌ Permission denied for route:', {
          path: route.routeConfig?.path,
          permissions,
          mode: permissionMode,
          reason: 'insufficient_permissions'
        });

        // Build redirect URL with context
        return router.createUrlTree([redirectTo], {
          queryParams: {
            returnUrl: route.url.join('/'),
            reason: 'insufficient_permissions',
            required: permissions.join(',')
          }
        });
      }
    })
  );
};
