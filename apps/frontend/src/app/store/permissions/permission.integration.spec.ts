/**
 * Permission Store Integration Tests
 *
 * @description
 * Comprehensive integration tests for the Permission Store layer (Service + Store + Query).
 * Validates the full data flow from HTTP API response to reactive store state,
 * including caching, invalidation, and permission checking logic.
 *
 * Test Coverage:
 * - Fetching permissions from API on login
 * - Permission cache invalidation after TTL expiry
 * - hasPermission(), hasAnyPermission(), hasAllPermissions() query methods
 * - Permission refresh after role change
 * - Mock HttpClient responses with HttpClientTestingModule
 * - Error handling for all HTTP status codes
 * - Synchronous permission checks for route guards
 *
 * @module PermissionStore/IntegrationTests
 * @group integration
 * @group permissions
 */

import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { first } from 'rxjs/operators';

import { PermissionService } from './permission.service';
import { PermissionStore } from './permission.store';
import { PermissionQuery } from './permission.query';
import {
  PermissionsResponse,
  UserWithRoles,
  Role,
  Permission,
  RolePermission
} from './permission.model';

describe('PermissionStore Integration Tests', () => {
  let service: PermissionService;
  let store: PermissionStore;
  let query: PermissionQuery;
  let httpMock: HttpTestingController;

  // ---------------------------------------------------------------------------
  // Mock Data - Realistic SouqSyria Platform Data (Arabic + English)
  // ---------------------------------------------------------------------------

  /** Mock admin permissions for a SouqSyria super admin */
  const MOCK_ADMIN_PERMISSIONS: string[] = [
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

  /** Mock seller permissions for a SouqSyria merchant (بائع) */
  const MOCK_SELLER_PERMISSIONS: string[] = [
    'view_products',
    'create_products',
    'edit_products',
    'view_orders',
    'manage_own_store'
  ];

  /** Mock admin role with full role permissions */
  const MOCK_ADMIN_ROLE: Role = {
    id: 1,
    name: 'admin',
    description: 'مدير النظام - System Administrator',
    rolePermissions: MOCK_ADMIN_PERMISSIONS.map((name, index) => ({
      permission: {
        id: index + 1,
        name,
        description: `Permission: ${name}`,
        resource: name.split('_').slice(1).join('_'),
        action: name.split('_')[0],
        isSystem: false
      }
    }))
  };

  /** Mock seller role for merchant users */
  const MOCK_SELLER_ROLE: Role = {
    id: 2,
    name: 'seller',
    description: 'بائع - Seller/Merchant',
    rolePermissions: MOCK_SELLER_PERMISSIONS.map((name, index) => ({
      permission: {
        id: 100 + index,
        name,
        description: `Permission: ${name}`,
        resource: name.split('_').slice(1).join('_'),
        action: name.split('_')[0],
        isSystem: false
      }
    }))
  };

  /** Mock successful API response for admin */
  const MOCK_ADMIN_API_RESPONSE: PermissionsResponse = {
    permissions: MOCK_ADMIN_PERMISSIONS,
    roles: [MOCK_ADMIN_ROLE]
  };

  /** Mock successful API response for seller */
  const MOCK_SELLER_API_RESPONSE: PermissionsResponse = {
    permissions: MOCK_SELLER_PERMISSIONS,
    roles: [MOCK_SELLER_ROLE]
  };

  /** Mock user with multiple roles */
  const MOCK_USER_WITH_ROLES: UserWithRoles = {
    id: 42,
    email: 'ahmad@souqsyria.com',
    role: MOCK_SELLER_ROLE,
    assignedRole: MOCK_ADMIN_ROLE,
    rolePermissions: [
      ...MOCK_SELLER_ROLE.rolePermissions!,
      ...MOCK_ADMIN_ROLE.rolePermissions!
    ]
  };

  // ---------------------------------------------------------------------------
  // Test Setup and Teardown
  // ---------------------------------------------------------------------------

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PermissionService, PermissionStore, PermissionQuery]
    });

    service = TestBed.inject(PermissionService);
    store = TestBed.inject(PermissionStore);
    query = TestBed.inject(PermissionQuery);
    httpMock = TestBed.inject(HttpTestingController);

    // Mock localStorage for getCurrentUserId
    spyOn(localStorage, 'getItem').and.returnValue(
      JSON.stringify({ id: 42, email: 'ahmad@souqsyria.com' })
    );
  });

  afterEach(() => {
    httpMock.verify();
    store.reset();
  });

  // ===========================================================================
  // 1. FETCH PERMISSIONS ON LOGIN
  // ===========================================================================

  describe('Fetching permissions from API on login', () => {
    /**
     * Verifies that the service correctly fetches admin permissions from the API
     * and populates the Akita store with all permission names.
     */
    it('should fetch admin permissions and populate store with all permission names', (done) => {
      const userId = 42;

      service.fetchUserPermissions(userId).subscribe({
        next: () => {
          const state = query.getValue();
          expect(state.permissions).toEqual(MOCK_ADMIN_PERMISSIONS);
          expect(state.permissions.length).toBe(11);
          expect(state.loaded).toBe(true);
          expect(state.loading).toBe(false);
          expect(state.error).toBeNull();
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`/api/admin/users/${userId}/permissions`);
      expect(req.request.method).toBe('GET');
      req.flush(MOCK_ADMIN_API_RESPONSE);
    });

    /**
     * Verifies that roles are stored along with permission names.
     */
    it('should store role objects alongside permissions', (done) => {
      const userId = 42;

      service.fetchUserPermissions(userId).subscribe({
        next: () => {
          const state = query.getValue();
          expect(state.roles.length).toBe(1);
          expect(state.roles[0].name).toBe('admin');
          expect(state.roles[0].description).toContain('مدير النظام');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`/api/admin/users/${userId}/permissions`);
      req.flush(MOCK_ADMIN_API_RESPONSE);
    });

    /**
     * Verifies that the store correctly handles API responses without roles.
     */
    it('should handle API response without roles array', (done) => {
      const userId = 42;
      const noRolesResponse: PermissionsResponse = {
        permissions: ['view_products']
      };

      service.fetchUserPermissions(userId).subscribe({
        next: () => {
          const state = query.getValue();
          expect(state.permissions).toEqual(['view_products']);
          expect(state.roles).toEqual([]);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`/api/admin/users/${userId}/permissions`);
      req.flush(noRolesResponse);
    });

    /**
     * Verifies that the loading state is set to true before the HTTP request.
     */
    it('should set loading state to true before HTTP request', () => {
      const userId = 42;
      spyOn(store, 'setLoading').and.callThrough();

      service.fetchUserPermissions(userId).subscribe();

      expect(store.setLoading).toHaveBeenCalledWith(true);

      const req = httpMock.expectOne(`/api/admin/users/${userId}/permissions`);
      req.flush(MOCK_ADMIN_API_RESPONSE);
    });

    /**
     * Verifies that lastFetched timestamp is updated after successful fetch.
     */
    it('should update lastFetched timestamp on success', (done) => {
      const userId = 42;
      const beforeFetch = Date.now();

      service.fetchUserPermissions(userId).subscribe({
        next: () => {
          const lastFetched = query.getLastFetched();
          expect(lastFetched).toBeTruthy();
          expect(lastFetched!).toBeGreaterThanOrEqual(beforeFetch);
          expect(lastFetched!).toBeLessThanOrEqual(Date.now());
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`/api/admin/users/${userId}/permissions`);
      req.flush(MOCK_ADMIN_API_RESPONSE);
    });

    /**
     * Verifies that fetchUserWithRoles extracts permissions from nested role objects.
     */
    it('should extract permissions from user roles via fetchUserWithRoles', (done) => {
      const userId = 42;

      service.fetchUserWithRoles(userId).subscribe({
        next: () => {
          const permissions = query.getAllPermissions();
          // Should contain permissions from both seller and admin roles (deduplicated)
          expect(permissions).toContain('manage_users');
          expect(permissions).toContain('view_products');
          expect(permissions).toContain('manage_own_store');

          const roles = query.getAllRoles();
          expect(roles.length).toBe(2);
          expect(roles.map(r => r.name)).toContain('seller');
          expect(roles.map(r => r.name)).toContain('admin');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`/api/admin/users/${userId}`);
      req.flush(MOCK_USER_WITH_ROLES);
    });

    /**
     * Verifies that setPermissions directly populates the store without HTTP call.
     */
    it('should set permissions directly without HTTP call', () => {
      service.setPermissions(['manage_users', 'view_products'], [MOCK_ADMIN_ROLE]);

      const state = query.getValue();
      expect(state.permissions).toEqual(['manage_users', 'view_products']);
      expect(state.roles[0].name).toBe('admin');
      expect(state.loaded).toBe(true);
    });
  });

  // ===========================================================================
  // 2. PERMISSION CACHE INVALIDATION
  // ===========================================================================

  describe('Permission cache invalidation', () => {
    /**
     * Verifies that newly initialized store is considered stale.
     */
    it('should report permissions as stale when store is fresh (never fetched)', () => {
      expect(service.arePermissionsStale()).toBe(true);
    });

    /**
     * Verifies that recently fetched permissions are not stale.
     */
    it('should report permissions as fresh after successful fetch', (done) => {
      service.fetchUserPermissions(42).subscribe({
        next: () => {
          expect(service.arePermissionsStale()).toBe(false);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne('/api/admin/users/42/permissions');
      req.flush(MOCK_ADMIN_API_RESPONSE);
    });

    /**
     * Verifies that permissions become stale after the 5-minute cache TTL.
     */
    it('should report permissions as stale after 5-minute cache TTL expires', () => {
      // Manually set permissions with an old timestamp
      store.setPermissions(MOCK_ADMIN_PERMISSIONS, [MOCK_ADMIN_ROLE]);
      store.update({ lastFetched: Date.now() - (6 * 60 * 1000) }); // 6 minutes ago

      expect(service.arePermissionsStale()).toBe(true);
    });

    /**
     * Verifies that clearPermissions resets store to empty state.
     */
    it('should clear all permissions on logout', () => {
      // Populate store
      store.setPermissions(MOCK_ADMIN_PERMISSIONS, [MOCK_ADMIN_ROLE]);
      expect(query.isLoaded()).toBe(true);

      // Clear on logout
      service.clearPermissions();

      const state = query.getValue();
      expect(state.permissions).toEqual([]);
      expect(state.roles).toEqual([]);
      expect(state.loaded).toBe(false);
      expect(state.lastFetched).toBeNull();
    });

    /**
     * Verifies ensureFreshPermissions skips HTTP call when cache is valid.
     */
    it('should skip HTTP request if permissions are fresh (cache valid)', (done) => {
      // Set fresh permissions
      store.setPermissions(MOCK_ADMIN_PERMISSIONS, [MOCK_ADMIN_ROLE]);

      service.ensureFreshPermissions().subscribe({
        next: () => {
          // No HTTP request should be made
          done();
        },
        error: done.fail
      });

      httpMock.expectNone(req => /\/api\/admin\/users/.test(req.url));
    });

    /**
     * Verifies ensureFreshPermissions triggers HTTP call when cache is stale.
     */
    it('should fetch permissions from API if cache is stale', (done) => {
      // Set stale permissions
      store.setPermissions(MOCK_SELLER_PERMISSIONS, [MOCK_SELLER_ROLE]);
      store.update({ lastFetched: Date.now() - (6 * 60 * 1000) });

      service.ensureFreshPermissions().subscribe({
        next: () => {
          const permissions = query.getAllPermissions();
          expect(permissions).toEqual(MOCK_ADMIN_PERMISSIONS);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(r => /\/api\/admin\/users\/\d+\/permissions/.test(r.url));
      req.flush(MOCK_ADMIN_API_RESPONSE);
    });
  });

  // ===========================================================================
  // 3. PERMISSION CHECK QUERIES (hasPermission, hasAnyPermission, hasAllPermissions)
  // ===========================================================================

  describe('Permission check queries', () => {
    beforeEach(() => {
      // Pre-populate store with admin permissions
      store.setPermissions(MOCK_ADMIN_PERMISSIONS, [MOCK_ADMIN_ROLE]);
    });

    /**
     * Verifies that hasPermission() returns true for a permission the user has.
     */
    it('should return true from hasPermission() for a permission the user has', (done) => {
      query.hasPermission('manage_users').pipe(first()).subscribe(result => {
        expect(result).toBe(true);
        done();
      });
    });

    /**
     * Verifies that hasPermission() returns false for a permission the user lacks.
     */
    it('should return false from hasPermission() for a permission the user lacks', (done) => {
      query.hasPermission('delete_everything').pipe(first()).subscribe(result => {
        expect(result).toBe(false);
        done();
      });
    });

    /**
     * Verifies that hasAnyPermission() returns true when at least one permission matches.
     */
    it('should return true from hasAnyPermission() when at least one matches (OR logic)', (done) => {
      query.hasAnyPermission(['delete_everything', 'manage_users']).pipe(first()).subscribe(result => {
        expect(result).toBe(true);
        done();
      });
    });

    /**
     * Verifies that hasAnyPermission() returns false when none of the permissions match.
     */
    it('should return false from hasAnyPermission() when none match', (done) => {
      query.hasAnyPermission(['fly_to_moon', 'delete_everything']).pipe(first()).subscribe(result => {
        expect(result).toBe(false);
        done();
      });
    });

    /**
     * Verifies that hasAllPermissions() returns true when all permissions match.
     */
    it('should return true from hasAllPermissions() when all match (AND logic)', (done) => {
      query.hasAllPermissions(['manage_users', 'view_users', 'access_admin_panel'])
        .pipe(first())
        .subscribe(result => {
          expect(result).toBe(true);
          done();
        });
    });

    /**
     * Verifies that hasAllPermissions() returns false when any permission is missing.
     */
    it('should return false from hasAllPermissions() when any is missing', (done) => {
      query.hasAllPermissions(['manage_users', 'fly_to_moon'])
        .pipe(first())
        .subscribe(result => {
          expect(result).toBe(false);
          done();
        });
    });

    /**
     * Verifies that hasPermissionSync() works for synchronous guard checks.
     */
    it('should support synchronous permission check via hasPermissionSync()', () => {
      expect(query.hasPermissionSync('manage_roles')).toBe(true);
      expect(query.hasPermissionSync('nonexistent_permission')).toBe(false);
    });

    /**
     * Verifies getPermissionsByResource filters permissions by resource suffix.
     */
    it('should filter permissions by resource via getPermissionsByResource()', (done) => {
      query.getPermissionsByResource('users').pipe(first()).subscribe(permissions => {
        expect(permissions).toContain('manage_users');
        expect(permissions).toContain('view_users');
        expect(permissions).not.toContain('manage_products');
        done();
      });
    });

    /**
     * Verifies getPermissionsByAction filters permissions by action prefix.
     */
    it('should filter permissions by action via getPermissionsByAction()', (done) => {
      query.getPermissionsByAction('manage').pipe(first()).subscribe(permissions => {
        expect(permissions).toContain('manage_users');
        expect(permissions).toContain('manage_roles');
        expect(permissions).toContain('manage_products');
        expect(permissions).not.toContain('view_users');
        done();
      });
    });

    /**
     * Verifies hasRole() checks role membership.
     */
    it('should check role membership via hasRole()', (done) => {
      query.hasRole('admin').pipe(first()).subscribe(result => {
        expect(result).toBe(true);
        done();
      });
    });

    /**
     * Verifies hasRole() returns false for missing roles.
     */
    it('should return false from hasRole() for a role the user does not have', (done) => {
      query.hasRole('super_admin').pipe(first()).subscribe(result => {
        expect(result).toBe(false);
        done();
      });
    });

    /**
     * Verifies hasRoleSync() for synchronous role checks in guards.
     */
    it('should support synchronous role check via hasRoleSync()', () => {
      expect(query.hasRoleSync('admin')).toBe(true);
      expect(query.hasRoleSync('customer')).toBe(false);
    });
  });

  // ===========================================================================
  // 4. PERMISSION REFRESH AFTER ROLE CHANGE
  // ===========================================================================

  describe('Permission refresh after role change', () => {
    /**
     * Verifies that refreshPermissions() re-fetches from API and updates store.
     */
    it('should force refresh permissions from API', (done) => {
      // Start with seller permissions
      store.setPermissions(MOCK_SELLER_PERMISSIONS, [MOCK_SELLER_ROLE]);
      expect(query.hasPermissionSync('manage_users')).toBe(false);

      // Refresh after role upgrade
      service.refreshPermissions().subscribe({
        next: () => {
          expect(query.hasPermissionSync('manage_users')).toBe(true);
          expect(query.getAllPermissions()).toEqual(MOCK_ADMIN_PERMISSIONS);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(r => /\/api\/admin\/users\/\d+\/permissions/.test(r.url));
      req.flush(MOCK_ADMIN_API_RESPONSE);
    });

    /**
     * Verifies that refreshPermissions handles missing user gracefully.
     */
    it('should handle refresh when no user is logged in', (done) => {
      (localStorage.getItem as jasmine.Spy).and.returnValue(null);

      service.refreshPermissions().subscribe({
        next: () => {
          // Should complete without HTTP request
          done();
        },
        error: done.fail
      });

      httpMock.expectNone(r => /\/api\/admin\/users/.test(r.url));
    });

    /**
     * Verifies the full lifecycle: login -> use -> role change -> refresh -> logout.
     */
    it('should support complete permission lifecycle: login, use, refresh, logout', (done) => {
      const userId = 42;

      // Step 1: Login - fetch seller permissions
      service.fetchUserPermissions(userId).subscribe({
        next: () => {
          expect(query.hasPermissionSync('view_products')).toBe(true);
          expect(query.hasPermissionSync('manage_users')).toBe(false);

          // Step 2: Role upgraded to admin - refresh
          service.refreshPermissions().subscribe({
            next: () => {
              expect(query.hasPermissionSync('manage_users')).toBe(true);
              expect(query.hasPermissionSync('access_admin_panel')).toBe(true);

              // Step 3: Logout
              service.clearPermissions();
              expect(query.isLoaded()).toBe(false);
              expect(query.getAllPermissions()).toEqual([]);
              expect(query.getAllRoles()).toEqual([]);

              done();
            },
            error: done.fail
          });

          const refreshReq = httpMock.expectOne(
            r => /\/api\/admin\/users\/\d+\/permissions/.test(r.url)
          );
          refreshReq.flush(MOCK_ADMIN_API_RESPONSE);
        },
        error: done.fail
      });

      const loginReq = httpMock.expectOne(`/api/admin/users/${userId}/permissions`);
      loginReq.flush(MOCK_SELLER_API_RESPONSE);
    });
  });

  // ===========================================================================
  // 5. ERROR HANDLING
  // ===========================================================================

  describe('Error handling', () => {
    /**
     * Verifies correct error message for 401 Unauthorized.
     */
    it('should set "Unauthorized" error for 401 response', (done) => {
      service.fetchUserPermissions(42).subscribe({
        error: (error) => {
          expect(error.status).toBe(401);
          const state = query.getValue();
          expect(state.error).toContain('Unauthorized');
          expect(state.loading).toBe(false);
          done();
        }
      });

      // Initial + 3 retries = 4 requests
      for (let i = 0; i < 4; i++) {
        const req = httpMock.expectOne('/api/admin/users/42/permissions');
        req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
      }
    });

    /**
     * Verifies correct error message for 403 Forbidden.
     */
    it('should set "Forbidden" error for 403 response', (done) => {
      service.fetchUserPermissions(42).subscribe({
        error: (error) => {
          expect(error.status).toBe(403);
          const state = query.getValue();
          expect(state.error).toContain('Forbidden');
          done();
        }
      });

      for (let i = 0; i < 4; i++) {
        const req = httpMock.expectOne('/api/admin/users/42/permissions');
        req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
      }
    });

    /**
     * Verifies correct error message for 404 Not Found.
     */
    it('should set "not found" error for 404 response', (done) => {
      service.fetchUserPermissions(999).subscribe({
        error: (error) => {
          expect(error.status).toBe(404);
          const state = query.getValue();
          expect(state.error).toContain('not found');
          done();
        }
      });

      for (let i = 0; i < 4; i++) {
        const req = httpMock.expectOne('/api/admin/users/999/permissions');
        req.flush('Not found', { status: 404, statusText: 'Not Found' });
      }
    });

    /**
     * Verifies correct error message for 500 Server Error.
     */
    it('should set "Server error" for 500 response', (done) => {
      service.fetchUserPermissions(42).subscribe({
        error: () => {
          const state = query.getValue();
          expect(state.error).toContain('Server error');
          done();
        }
      });

      for (let i = 0; i < 4; i++) {
        const req = httpMock.expectOne('/api/admin/users/42/permissions');
        req.flush('Error', { status: 500, statusText: 'Internal Server Error' });
      }
    });

    /**
     * Verifies that retry logic attempts 3 retries (4 total requests).
     */
    it('should retry 3 times before failing (4 total attempts)', (done) => {
      let requestCount = 0;

      service.fetchUserPermissions(42).subscribe({
        error: () => {
          expect(requestCount).toBe(4);
          done();
        }
      });

      for (let i = 0; i < 4; i++) {
        const req = httpMock.expectOne('/api/admin/users/42/permissions');
        requestCount++;
        req.flush('Error', { status: 500, statusText: 'Internal Server Error' });
      }
    });

    /**
     * Verifies that a successful retry recovers the request.
     */
    it('should succeed on retry after initial failure', (done) => {
      service.fetchUserPermissions(42).subscribe({
        next: () => {
          expect(query.getAllPermissions()).toEqual(MOCK_ADMIN_PERMISSIONS);
          done();
        },
        error: done.fail
      });

      // First 2 fail
      for (let i = 0; i < 2; i++) {
        const req = httpMock.expectOne('/api/admin/users/42/permissions');
        req.flush('Error', { status: 500, statusText: 'Internal Server Error' });
      }

      // Third succeeds
      const successReq = httpMock.expectOne('/api/admin/users/42/permissions');
      successReq.flush(MOCK_ADMIN_API_RESPONSE);
    });

    /**
     * Verifies that network errors are handled gracefully.
     */
    it('should handle network errors gracefully', (done) => {
      service.fetchUserPermissions(42).subscribe({
        error: () => {
          const state = query.getValue();
          expect(state.error).toBeTruthy();
          expect(state.loading).toBe(false);
          done();
        }
      });

      for (let i = 0; i < 4; i++) {
        const req = httpMock.expectOne('/api/admin/users/42/permissions');
        req.error(new ProgressEvent('error'));
      }
    });

    /**
     * Verifies custom error message from API response body.
     */
    it('should use API error message when available', (done) => {
      service.fetchUserPermissions(42).subscribe({
        error: () => {
          const state = query.getValue();
          expect(state.error).toBe('حساب المستخدم غير مفعل');
          done();
        }
      });

      for (let i = 0; i < 4; i++) {
        const req = httpMock.expectOne('/api/admin/users/42/permissions');
        req.flush(
          { message: 'حساب المستخدم غير مفعل' },
          { status: 400, statusText: 'Bad Request' }
        );
      }
    });
  });

  // ===========================================================================
  // 6. REACTIVE OBSERVABLE BEHAVIOR
  // ===========================================================================

  describe('Reactive observable behavior', () => {
    /**
     * Verifies that loading$ observable emits correct sequence.
     */
    it('should emit loading state changes via loading$ observable', (done) => {
      const loadingStates: boolean[] = [];

      query.loading$.subscribe(loading => {
        loadingStates.push(loading);

        // Initial false + true (start) + false (end) = 3 emissions
        if (loadingStates.length === 3) {
          expect(loadingStates).toEqual([false, true, false]);
          done();
        }
      });

      service.fetchUserPermissions(42).subscribe();

      const req = httpMock.expectOne('/api/admin/users/42/permissions');
      req.flush(MOCK_ADMIN_API_RESPONSE);
    });

    /**
     * Verifies that permissions$ observable reacts to store updates.
     */
    it('should emit permission changes via permissions$ observable', (done) => {
      const emittedPermissions: string[][] = [];

      query.permissions$.subscribe(permissions => {
        emittedPermissions.push([...permissions]);

        if (emittedPermissions.length === 2) {
          expect(emittedPermissions[0]).toEqual([]);
          expect(emittedPermissions[1]).toEqual(MOCK_ADMIN_PERMISSIONS);
          done();
        }
      });

      service.fetchUserPermissions(42).subscribe();

      const req = httpMock.expectOne('/api/admin/users/42/permissions');
      req.flush(MOCK_ADMIN_API_RESPONSE);
    });

    /**
     * Verifies that route access check works reactively.
     */
    it('should check route access via canAccessRoute()', (done) => {
      store.setPermissions(MOCK_ADMIN_PERMISSIONS, [MOCK_ADMIN_ROLE]);

      query.canAccessRoute('/admin').pipe(first()).subscribe(canAccess => {
        expect(canAccess).toBe(true);
        done();
      });
    });

    /**
     * Verifies that route access is denied for missing permissions.
     */
    it('should deny route access when permissions are missing', (done) => {
      store.setPermissions(['view_products'], [MOCK_SELLER_ROLE]);

      query.canAccessRoute('/users').pipe(first()).subscribe(canAccess => {
        // Seller does not have 'view_users' or 'manage_users'
        expect(canAccess).toBe(false);
        done();
      });
    });
  });
});
