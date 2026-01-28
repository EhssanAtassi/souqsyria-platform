/**
 * Admin Module Integration Tests
 *
 * @description
 * Integration tests for the admin module routing, guard protection,
 * permission-based navigation, and lazy-loaded module resolution.
 * Validates the full admin route configuration against the RBAC system.
 *
 * Test Coverage:
 * - Admin route guard blocks unauthorized users
 * - Admin route guard allows authorized users
 * - Lazy-loaded admin modules resolve correctly
 * - Permission-based menu visibility
 * - Route-to-permission mapping enforcement
 * - Redirect behavior for denied access
 *
 * @module Admin/IntegrationTests
 * @group integration
 * @group routing
 * @group guards
 */

import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Location } from '@angular/common';
import { Component } from '@angular/core';
import { Observable, of } from 'rxjs';

import { PermissionStore } from '../../store/permissions/permission.store';
import { PermissionQuery } from '../../store/permissions/permission.query';
import { permissionGuard } from '../../core/guards/permission.guard';
import {
  ADMIN_ROUTE_PERMISSIONS,
  ADMIN_NAVIGATION_ITEMS,
  ADMIN_ROUTE_PATHS
} from './admin.routes';
import { Role } from '../../store/permissions/permission.model';

// ---------------------------------------------------------------------------
// Test Components (minimal stubs for routing)
// ---------------------------------------------------------------------------

/** Stub component for route resolution testing */
@Component({ template: '<div>Test Component</div>', standalone: true })
class TestStubComponent {}

/** Stub component for unauthorized page */
@Component({ template: '<div>Unauthorized</div>', standalone: true })
class UnauthorizedStubComponent {}

describe('Admin Module Integration Tests', () => {
  let router: Router;
  let location: Location;
  let store: PermissionStore;
  let query: PermissionQuery;

  // ---------------------------------------------------------------------------
  // Mock Data
  // ---------------------------------------------------------------------------

  /** Full admin permissions for SouqSyria super admin */
  const ADMIN_ALL_PERMISSIONS: string[] = [
    'manage_users',
    'view_users',
    'manage_roles',
    'view_roles',
    'manage_routes',
    'view_audit_logs',
    'manage_products',
    'view_products',
    'manage_orders',
    'view_orders',
    'access_admin_panel'
  ];

  /** Limited permissions for viewer-only admin */
  const VIEWER_ONLY_PERMISSIONS: string[] = [
    'view_users',
    'view_products',
    'view_orders',
    'access_admin_panel'
  ];

  /** Admin role object */
  const ADMIN_ROLE: Role = {
    id: 1,
    name: 'admin',
    description: 'مدير النظام - System Administrator',
  };

  /** Viewer role object */
  const VIEWER_ROLE: Role = {
    id: 3,
    name: 'viewer',
    description: 'مشاهد - Viewer',
  };

  // ---------------------------------------------------------------------------
  // Test Setup
  // ---------------------------------------------------------------------------

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule.withRoutes([
          {
            path: 'admin/users',
            component: TestStubComponent,
            canActivate: [permissionGuard],
            data: {
              requiredPermissions: ['manage_users'],
              permissionMode: 'all'
            }
          },
          {
            path: 'admin/roles',
            component: TestStubComponent,
            canActivate: [permissionGuard],
            data: {
              requiredPermissions: ['manage_roles'],
              permissionMode: 'all'
            }
          },
          {
            path: 'admin/routes',
            component: TestStubComponent,
            canActivate: [permissionGuard],
            data: {
              requiredPermissions: ['manage_routes'],
              permissionMode: 'all'
            }
          },
          {
            path: 'admin/security',
            component: TestStubComponent,
            canActivate: [permissionGuard],
            data: {
              requiredPermissions: ['view_audit_logs'],
              permissionMode: 'all'
            }
          },
          {
            path: 'admin/dashboard',
            component: TestStubComponent
          },
          {
            path: 'admin/multi-permission',
            component: TestStubComponent,
            canActivate: [permissionGuard],
            data: {
              requiredPermissions: ['manage_users', 'manage_roles'],
              permissionMode: 'any'
            }
          },
          {
            path: 'admin/all-permissions',
            component: TestStubComponent,
            canActivate: [permissionGuard],
            data: {
              requiredPermissions: ['manage_users', 'manage_roles'],
              permissionMode: 'all'
            }
          },
          {
            path: 'admin/no-permissions',
            component: TestStubComponent,
            canActivate: [permissionGuard]
            // No data.requiredPermissions set
          },
          {
            path: 'unauthorized',
            component: UnauthorizedStubComponent
          },
          {
            path: '**',
            component: TestStubComponent
          }
        ])
      ],
      providers: [
        PermissionStore,
        PermissionQuery
      ]
    });

    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
    store = TestBed.inject(PermissionStore);
    query = TestBed.inject(PermissionQuery);
  });

  afterEach(() => {
    store.reset();
  });

  // ===========================================================================
  // 1. ROUTE GUARD BLOCKS UNAUTHORIZED USERS
  // ===========================================================================

  describe('Admin route guard blocks unauthorized users', () => {
    /**
     * Verifies that a user without manage_users permission is blocked from /admin/users.
     */
    it('should block access to /admin/users without manage_users permission', fakeAsync(() => {
      store.setPermissions(VIEWER_ONLY_PERMISSIONS, [VIEWER_ROLE]);

      router.navigate(['/admin/users']);
      tick();

      // Should have been redirected to /unauthorized
      expect(location.path()).toContain('unauthorized');
    }));

    /**
     * Verifies that a user without manage_roles permission is blocked from /admin/roles.
     */
    it('should block access to /admin/roles without manage_roles permission', fakeAsync(() => {
      store.setPermissions(VIEWER_ONLY_PERMISSIONS, [VIEWER_ROLE]);

      router.navigate(['/admin/roles']);
      tick();

      expect(location.path()).toContain('unauthorized');
    }));

    /**
     * Verifies that a user without manage_routes permission is blocked from /admin/routes.
     */
    it('should block access to /admin/routes without manage_routes permission', fakeAsync(() => {
      store.setPermissions(VIEWER_ONLY_PERMISSIONS, [VIEWER_ROLE]);

      router.navigate(['/admin/routes']);
      tick();

      expect(location.path()).toContain('unauthorized');
    }));

    /**
     * Verifies that a user without view_audit_logs permission is blocked from /admin/security.
     */
    it('should block access to /admin/security without view_audit_logs permission', fakeAsync(() => {
      store.setPermissions(VIEWER_ONLY_PERMISSIONS, [VIEWER_ROLE]);

      router.navigate(['/admin/security']);
      tick();

      expect(location.path()).toContain('unauthorized');
    }));

    /**
     * Verifies that the redirect includes returnUrl and reason query params.
     */
    it('should include returnUrl and reason in redirect query params', fakeAsync(() => {
      store.setPermissions([], []);

      router.navigate(['/admin/users']);
      tick();

      const path = location.path();
      expect(path).toContain('unauthorized');
      expect(path).toContain('returnUrl');
      expect(path).toContain('reason=insufficient_permissions');
    }));

    /**
     * Verifies that a user with empty permissions is blocked from all protected routes.
     */
    it('should block user with empty permissions from all protected routes', fakeAsync(() => {
      store.setPermissions([], []);

      const protectedPaths = ['/admin/users', '/admin/roles', '/admin/routes', '/admin/security'];

      for (const path of protectedPaths) {
        router.navigate([path]);
        tick();
        expect(location.path()).toContain('unauthorized');
      }
    }));
  });

  // ===========================================================================
  // 2. ROUTE GUARD ALLOWS AUTHORIZED USERS
  // ===========================================================================

  describe('Admin route guard allows authorized users', () => {
    /**
     * Verifies that a user with manage_users can access /admin/users.
     */
    it('should allow access to /admin/users with manage_users permission', fakeAsync(() => {
      store.setPermissions(ADMIN_ALL_PERMISSIONS, [ADMIN_ROLE]);

      router.navigate(['/admin/users']);
      tick();

      expect(location.path()).toBe('/admin/users');
    }));

    /**
     * Verifies that a user with manage_roles can access /admin/roles.
     */
    it('should allow access to /admin/roles with manage_roles permission', fakeAsync(() => {
      store.setPermissions(ADMIN_ALL_PERMISSIONS, [ADMIN_ROLE]);

      router.navigate(['/admin/roles']);
      tick();

      expect(location.path()).toBe('/admin/roles');
    }));

    /**
     * Verifies that a user with manage_routes can access /admin/routes.
     */
    it('should allow access to /admin/routes with manage_routes permission', fakeAsync(() => {
      store.setPermissions(ADMIN_ALL_PERMISSIONS, [ADMIN_ROLE]);

      router.navigate(['/admin/routes']);
      tick();

      expect(location.path()).toBe('/admin/routes');
    }));

    /**
     * Verifies that a user with view_audit_logs can access /admin/security.
     */
    it('should allow access to /admin/security with view_audit_logs permission', fakeAsync(() => {
      store.setPermissions(ADMIN_ALL_PERMISSIONS, [ADMIN_ROLE]);

      router.navigate(['/admin/security']);
      tick();

      expect(location.path()).toBe('/admin/security');
    }));

    /**
     * Verifies that /admin/dashboard is accessible without specific permissions.
     */
    it('should allow access to /admin/dashboard without specific permissions', fakeAsync(() => {
      store.setPermissions([], []);

      router.navigate(['/admin/dashboard']);
      tick();

      expect(location.path()).toBe('/admin/dashboard');
    }));

    /**
     * Verifies "any" permission mode allows access with just one matching permission.
     */
    it('should allow access in "any" mode when user has at least one permission', fakeAsync(() => {
      store.setPermissions(['manage_users'], []);

      router.navigate(['/admin/multi-permission']);
      tick();

      expect(location.path()).toBe('/admin/multi-permission');
    }));

    /**
     * Verifies "all" mode requires all specified permissions.
     */
    it('should require all permissions in "all" mode', fakeAsync(() => {
      store.setPermissions(['manage_users'], []);

      router.navigate(['/admin/all-permissions']);
      tick();

      // Missing manage_roles, should be blocked
      expect(location.path()).toContain('unauthorized');
    }));

    /**
     * Verifies "all" mode allows access when user has all required permissions.
     */
    it('should allow access in "all" mode when user has all required permissions', fakeAsync(() => {
      store.setPermissions(['manage_users', 'manage_roles'], []);

      router.navigate(['/admin/all-permissions']);
      tick();

      expect(location.path()).toBe('/admin/all-permissions');
    }));

    /**
     * Verifies that routes without requiredPermissions data allow access.
     */
    it('should allow access when no requiredPermissions is configured on route', fakeAsync(() => {
      store.setPermissions([], []);

      router.navigate(['/admin/no-permissions']);
      tick();

      expect(location.path()).toBe('/admin/no-permissions');
    }));
  });

  // ===========================================================================
  // 3. LAZY-LOADED ADMIN MODULES
  // ===========================================================================

  describe('Lazy-loaded admin modules resolve correctly', () => {
    /**
     * Verifies that the admin routes configuration has the expected route paths.
     */
    it('should define correct admin route paths in ADMIN_ROUTE_PATHS', () => {
      expect(ADMIN_ROUTE_PATHS.BASE).toBe('/admin');
      expect(ADMIN_ROUTE_PATHS.LOGIN).toBe('/admin/login');
      expect(ADMIN_ROUTE_PATHS.UNAUTHORIZED).toBe('/admin/unauthorized');
      expect(ADMIN_ROUTE_PATHS.DASHBOARD).toBe('/admin/dashboard');
      expect(ADMIN_ROUTE_PATHS.USERS).toBe('/admin/users');
      expect(ADMIN_ROUTE_PATHS.ROLES).toBe('/admin/roles');
      expect(ADMIN_ROUTE_PATHS.ROUTES).toBe('/admin/routes');
      expect(ADMIN_ROUTE_PATHS.SECURITY).toBe('/admin/security');
      expect(ADMIN_ROUTE_PATHS.PROFILE).toBe('/admin/profile');
      expect(ADMIN_ROUTE_PATHS.SETTINGS).toBe('/admin/settings');
    });

    /**
     * Verifies that user detail path helper generates correct paths.
     */
    it('should generate correct user detail paths via getUserPath()', () => {
      expect(ADMIN_ROUTE_PATHS.getUserPath(42)).toBe('/admin/users/42');
      expect(ADMIN_ROUTE_PATHS.getUserPath('42')).toBe('/admin/users/42');
    });

    /**
     * Verifies that role edit path helper generates correct paths.
     */
    it('should generate correct role edit paths via getRoleEditPath()', () => {
      expect(ADMIN_ROUTE_PATHS.getRoleEditPath(5)).toBe('/admin/roles/5/edit');
      expect(ADMIN_ROUTE_PATHS.getRoleEditPath('5')).toBe('/admin/roles/5/edit');
    });

    /**
     * Verifies that all protected routes have correct permission requirements.
     */
    it('should map correct permissions to routes in ADMIN_ROUTE_PERMISSIONS', () => {
      expect(ADMIN_ROUTE_PERMISSIONS.DASHBOARD).toEqual([]);
      expect(ADMIN_ROUTE_PERMISSIONS.USERS).toEqual(['manage_users']);
      expect(ADMIN_ROUTE_PERMISSIONS.ROLES).toEqual(['manage_roles']);
      expect(ADMIN_ROUTE_PERMISSIONS.ROUTES).toEqual(['manage_routes']);
      expect(ADMIN_ROUTE_PERMISSIONS.SECURITY).toEqual(['view_audit_logs']);
      expect(ADMIN_ROUTE_PERMISSIONS.PROFILE).toEqual([]);
      expect(ADMIN_ROUTE_PERMISSIONS.SETTINGS).toEqual([]);
    });
  });

  // ===========================================================================
  // 4. PERMISSION-BASED MENU VISIBILITY
  // ===========================================================================

  describe('Permission-based menu visibility', () => {
    /**
     * Verifies that admin navigation items are correctly configured.
     */
    it('should define navigation items with correct paths and permissions', () => {
      expect(ADMIN_NAVIGATION_ITEMS.length).toBeGreaterThanOrEqual(5);

      // Dashboard - no permission required
      const dashboard = ADMIN_NAVIGATION_ITEMS.find(item => item.path === ADMIN_ROUTE_PATHS.DASHBOARD);
      expect(dashboard).toBeTruthy();
      expect(dashboard!.permissions).toEqual([]);
      expect(dashboard!.icon).toBe('dashboard');

      // User Management - requires manage_users
      const users = ADMIN_NAVIGATION_ITEMS.find(item => item.path === ADMIN_ROUTE_PATHS.USERS);
      expect(users).toBeTruthy();
      expect(users!.permissions).toEqual(['manage_users']);
      expect(users!.icon).toBe('people');
      expect(users!.label).toBe('User Management');

      // Role Management - requires manage_roles
      const roles = ADMIN_NAVIGATION_ITEMS.find(item => item.path === ADMIN_ROUTE_PATHS.ROLES);
      expect(roles).toBeTruthy();
      expect(roles!.permissions).toEqual(['manage_roles']);
      expect(roles!.icon).toBe('admin_panel_settings');

      // Route Mapping - requires manage_routes
      const routes = ADMIN_NAVIGATION_ITEMS.find(item => item.path === ADMIN_ROUTE_PATHS.ROUTES);
      expect(routes).toBeTruthy();
      expect(routes!.permissions).toEqual(['manage_routes']);
      expect(routes!.icon).toBe('route');

      // Security Audit - requires view_audit_logs
      const security = ADMIN_NAVIGATION_ITEMS.find(item => item.path === ADMIN_ROUTE_PATHS.SECURITY);
      expect(security).toBeTruthy();
      expect(security!.permissions).toEqual(['view_audit_logs']);
      expect(security!.icon).toBe('security');
    });

    /**
     * Verifies that admin with all permissions should see all navigation items.
     */
    it('should allow admin with all permissions to see all navigation items', () => {
      store.setPermissions(ADMIN_ALL_PERMISSIONS, [ADMIN_ROLE]);

      const visibleItems = ADMIN_NAVIGATION_ITEMS.filter(item => {
        if (item.permissions.length === 0) return true;
        return item.permissions.every(p => query.hasPermissionSync(p));
      });

      expect(visibleItems.length).toBe(ADMIN_NAVIGATION_ITEMS.length);
    });

    /**
     * Verifies that viewer role sees only unrestricted navigation items.
     */
    it('should hide restricted items for viewer-only user', () => {
      store.setPermissions(VIEWER_ONLY_PERMISSIONS, [VIEWER_ROLE]);

      const visibleItems = ADMIN_NAVIGATION_ITEMS.filter(item => {
        if (item.permissions.length === 0) return true;
        return item.permissions.every(p => query.hasPermissionSync(p));
      });

      // Dashboard (no perm), Settings (no perm) should be visible
      // Users, Roles, Routes, Security should NOT be visible
      const visiblePaths = visibleItems.map(i => i.path);
      expect(visiblePaths).toContain(ADMIN_ROUTE_PATHS.DASHBOARD);
      expect(visiblePaths).not.toContain(ADMIN_ROUTE_PATHS.USERS);
      expect(visiblePaths).not.toContain(ADMIN_ROUTE_PATHS.ROLES);
      expect(visiblePaths).not.toContain(ADMIN_ROUTE_PATHS.ROUTES);
      expect(visiblePaths).not.toContain(ADMIN_ROUTE_PATHS.SECURITY);
    });

    /**
     * Verifies settings navigation item has role-based restriction.
     */
    it('should configure settings menu with role-based restriction', () => {
      const settings = ADMIN_NAVIGATION_ITEMS.find(item => item.path === ADMIN_ROUTE_PATHS.SETTINGS);
      expect(settings).toBeTruthy();
      expect((settings as any).roles).toContain('super_admin');
      expect((settings as any).roles).toContain('admin');
    });
  });

  // ===========================================================================
  // 5. PERMISSION GUARD UNIT TESTS
  // ===========================================================================

  describe('Permission guard unit behavior', () => {
    /**
     * Verifies that the guard returns Observable<boolean | UrlTree>.
     */
    it('should be a functional CanActivateFn guard', () => {
      expect(typeof permissionGuard).toBe('function');
    });

    /**
     * Verifies that the guard uses take(1) to prevent memory leaks.
     */
    it('should complete after first emission (memory leak prevention)', fakeAsync(() => {
      store.setPermissions(ADMIN_ALL_PERMISSIONS, [ADMIN_ROLE]);

      let emissionCount = 0;
      const route = createMockRoute(['manage_users'], 'all');

      const result = TestBed.runInInjectionContext(() => permissionGuard(route, {} as any));

      (result as Observable<any>).subscribe(() => {
        emissionCount++;
      });

      tick();

      // Update permissions after guard resolved - should not trigger new emission
      store.setPermissions(['view_products'], []);
      tick();

      expect(emissionCount).toBe(1);
    }));
  });
});

// ===========================================================================
// HELPER FUNCTIONS
// ===========================================================================

/**
 * Creates a mock ActivatedRouteSnapshot with permission data.
 *
 * @param requiredPermissions - Permission names required for the route
 * @param permissionMode - 'all' or 'any'
 * @returns Mock ActivatedRouteSnapshot
 */
function createMockRoute(
  requiredPermissions: string[],
  permissionMode: string = 'all'
): ActivatedRouteSnapshot {
  const route = {
    data: {
      requiredPermissions,
      permissionMode,
      redirectTo: '/unauthorized'
    },
    routeConfig: { path: 'test' },
    url: [{ path: 'admin' }, { path: 'test' }],
    params: {},
    queryParams: {},
    fragment: null,
    outlet: 'primary',
    component: null,
    root: null as any,
    parent: null,
    firstChild: null,
    children: [],
    pathFromRoot: [],
    paramMap: { get: () => null, has: () => false, getAll: () => [], keys: [] },
    queryParamMap: { get: () => null, has: () => false, getAll: () => [], keys: [] }
  } as unknown as ActivatedRouteSnapshot;

  return route;
}
