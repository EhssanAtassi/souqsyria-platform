import { TestBed } from '@angular/core/testing';
import { PermissionStore } from './permission.store';
import { PermissionQuery } from './permission.query';
import { Role } from './permission.model';
import { firstValueFrom } from 'rxjs';

/**
 * Permission Query Unit Tests
 *
 * Tests reactive queries for permission state.
 *
 * Test Coverage:
 * - Observable selectors
 * - Single permission checks
 * - Multiple permission checks (ANY/ALL)
 * - Resource filtering
 * - Action filtering
 * - Role checks
 * - Route access checks
 * - Synchronous methods
 *
 * @group unit
 * @group query
 */
describe('PermissionQuery', () => {
  let store: PermissionStore;
  let query: PermissionQuery;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PermissionStore, PermissionQuery],
    });

    store = TestBed.inject(PermissionStore);
    query = TestBed.inject(PermissionQuery);
  });

  afterEach(() => {
    store.reset();
  });

  /**
   * Observable Selector Tests
   */
  describe('Observable Selectors', () => {
    it('should select permissions', async () => {
      const permissions = ['manage_users', 'view_products'];
      store.setPermissions(permissions, []);

      const result = await firstValueFrom(query.permissions$);
      expect(result).toEqual(permissions);
    });

    it('should select roles', async () => {
      const roles: Role[] = [
        { id: 1, name: 'admin', description: 'Admin' },
      ];
      store.setPermissions([], roles);

      const result = await firstValueFrom(query.roles$);
      expect(result).toEqual(roles);
    });

    it('should select loading state', async () => {
      store.setLoading(true);

      const result = await firstValueFrom(query.loading$);
      expect(result).toBe(true);
    });

    it('should select loaded state', async () => {
      store.setPermissions([], []);

      const result = await firstValueFrom(query.loaded$);
      expect(result).toBe(true);
    });

    it('should select error state', async () => {
      const error = 'Test error';
      store.setError(error);

      const result = await firstValueFrom(query.error$);
      expect(result).toBe(error);
    });
  });

  /**
   * Single Permission Check Tests
   */
  describe('hasPermission()', () => {
    it('should return true when user has permission', async () => {
      store.setPermissions(['manage_users'], []);

      const result = await firstValueFrom(query.hasPermission('manage_users'));
      expect(result).toBe(true);
    });

    it('should return false when user does not have permission', async () => {
      store.setPermissions(['view_products'], []);

      const result = await firstValueFrom(query.hasPermission('manage_users'));
      expect(result).toBe(false);
    });

    it('should return false for empty permissions', async () => {
      store.setPermissions([], []);

      const result = await firstValueFrom(query.hasPermission('manage_users'));
      expect(result).toBe(false);
    });

    it('should handle permission name case sensitivity', async () => {
      store.setPermissions(['manage_users'], []);

      const result = await firstValueFrom(query.hasPermission('MANAGE_USERS'));
      expect(result).toBe(false); // Should be case-sensitive
    });
  });

  /**
   * Multiple Permission Checks (ANY Logic)
   */
  describe('hasAnyPermission()', () => {
    it('should return true when user has one of the permissions', async () => {
      store.setPermissions(['view_products'], []);

      const result = await firstValueFrom(
        query.hasAnyPermission(['manage_users', 'view_products'])
      );
      expect(result).toBe(true);
    });

    it('should return true when user has all permissions', async () => {
      store.setPermissions(['manage_users', 'view_products'], []);

      const result = await firstValueFrom(
        query.hasAnyPermission(['manage_users', 'view_products'])
      );
      expect(result).toBe(true);
    });

    it('should return false when user has none of the permissions', async () => {
      store.setPermissions(['view_orders'], []);

      const result = await firstValueFrom(
        query.hasAnyPermission(['manage_users', 'view_products'])
      );
      expect(result).toBe(false);
    });

    it('should return false for empty check list', async () => {
      store.setPermissions(['manage_users'], []);

      const result = await firstValueFrom(query.hasAnyPermission([]));
      expect(result).toBe(false);
    });

    it('should return false when user has no permissions', async () => {
      store.setPermissions([], []);

      const result = await firstValueFrom(
        query.hasAnyPermission(['manage_users'])
      );
      expect(result).toBe(false);
    });
  });

  /**
   * Multiple Permission Checks (ALL Logic)
   */
  describe('hasAllPermissions()', () => {
    it('should return true when user has all permissions', async () => {
      store.setPermissions(['manage_users', 'view_products', 'edit_products'], []);

      const result = await firstValueFrom(
        query.hasAllPermissions(['manage_users', 'view_products'])
      );
      expect(result).toBe(true);
    });

    it('should return false when user has only some permissions', async () => {
      store.setPermissions(['view_products'], []);

      const result = await firstValueFrom(
        query.hasAllPermissions(['manage_users', 'view_products'])
      );
      expect(result).toBe(false);
    });

    it('should return false when user has none of the permissions', async () => {
      store.setPermissions(['view_orders'], []);

      const result = await firstValueFrom(
        query.hasAllPermissions(['manage_users', 'view_products'])
      );
      expect(result).toBe(false);
    });

    it('should return true for empty check list', async () => {
      store.setPermissions(['manage_users'], []);

      const result = await firstValueFrom(query.hasAllPermissions([]));
      expect(result).toBe(true); // No requirements = satisfied
    });

    it('should return false when user has no permissions', async () => {
      store.setPermissions([], []);

      const result = await firstValueFrom(
        query.hasAllPermissions(['manage_users'])
      );
      expect(result).toBe(false);
    });
  });

  /**
   * Resource Filtering Tests
   */
  describe('getPermissionsByResource()', () => {
    it('should filter permissions by resource', async () => {
      store.setPermissions([
        'view_products',
        'edit_products',
        'delete_products',
        'view_users',
        'manage_orders',
      ], []);

      const result = await firstValueFrom(
        query.getPermissionsByResource('products')
      );

      expect(result).toEqual([
        'view_products',
        'edit_products',
        'delete_products',
      ]);
    });

    it('should return empty array when no permissions match', async () => {
      store.setPermissions(['view_users', 'manage_orders'], []);

      const result = await firstValueFrom(
        query.getPermissionsByResource('products')
      );

      expect(result).toEqual([]);
    });

    it('should handle empty permissions', async () => {
      store.setPermissions([], []);

      const result = await firstValueFrom(
        query.getPermissionsByResource('products')
      );

      expect(result).toEqual([]);
    });
  });

  /**
   * Action Filtering Tests
   */
  describe('getPermissionsByAction()', () => {
    it('should filter permissions by action', async () => {
      store.setPermissions([
        'view_products',
        'view_users',
        'view_orders',
        'edit_products',
        'manage_users',
      ], []);

      const result = await firstValueFrom(
        query.getPermissionsByAction('view')
      );

      expect(result).toEqual([
        'view_products',
        'view_users',
        'view_orders',
      ]);
    });

    it('should return empty array when no permissions match', async () => {
      store.setPermissions(['manage_users', 'edit_products'], []);

      const result = await firstValueFrom(
        query.getPermissionsByAction('delete')
      );

      expect(result).toEqual([]);
    });

    it('should handle empty permissions', async () => {
      store.setPermissions([], []);

      const result = await firstValueFrom(
        query.getPermissionsByAction('view')
      );

      expect(result).toEqual([]);
    });
  });

  /**
   * Role Check Tests
   */
  describe('hasRole()', () => {
    it('should return true when user has role', async () => {
      const roles: Role[] = [
        { id: 1, name: 'admin', description: 'Admin' },
      ];
      store.setPermissions([], roles);

      const result = await firstValueFrom(query.hasRole('admin'));
      expect(result).toBe(true);
    });

    it('should return false when user does not have role', async () => {
      const roles: Role[] = [
        { id: 1, name: 'seller', description: 'Seller' },
      ];
      store.setPermissions([], roles);

      const result = await firstValueFrom(query.hasRole('admin'));
      expect(result).toBe(false);
    });

    it('should return false when user has no roles', async () => {
      store.setPermissions([], []);

      const result = await firstValueFrom(query.hasRole('admin'));
      expect(result).toBe(false);
    });

    it('should check multiple roles', async () => {
      const roles: Role[] = [
        { id: 1, name: 'seller', description: 'Seller' },
        { id: 2, name: 'admin', description: 'Admin' },
      ];
      store.setPermissions([], roles);

      const hasAdmin = await firstValueFrom(query.hasRole('admin'));
      const hasSeller = await firstValueFrom(query.hasRole('seller'));
      const hasCustomer = await firstValueFrom(query.hasRole('customer'));

      expect(hasAdmin).toBe(true);
      expect(hasSeller).toBe(true);
      expect(hasCustomer).toBe(false);
    });
  });

  /**
   * Route Access Tests
   */
  describe('canAccessRoute()', () => {
    it('should allow access to admin route with admin_panel permission', async () => {
      store.setPermissions(['admin_panel'], []);

      const result = await firstValueFrom(query.canAccessRoute('/admin'));
      expect(result).toBe(true);
    });

    it('should allow access to admin route with manage_users permission', async () => {
      store.setPermissions(['manage_users'], []);

      const result = await firstValueFrom(query.canAccessRoute('/admin'));
      expect(result).toBe(true);
    });

    it('should deny access to admin route without required permissions', async () => {
      store.setPermissions(['view_products'], []);

      const result = await firstValueFrom(query.canAccessRoute('/admin'));
      expect(result).toBe(false);
    });

    it('should allow access to public routes', async () => {
      store.setPermissions([], []);

      const result = await firstValueFrom(query.canAccessRoute('/public'));
      expect(result).toBe(true);
    });
  });

  /**
   * Synchronous Method Tests
   */
  describe('Synchronous Methods', () => {
    it('hasPermissionSync should return correct value', () => {
      store.setPermissions(['manage_users'], []);

      expect(query.hasPermissionSync('manage_users')).toBe(true);
      expect(query.hasPermissionSync('view_products')).toBe(false);
    });

    it('hasRoleSync should return correct value', () => {
      const roles: Role[] = [
        { id: 1, name: 'admin', description: 'Admin' },
      ];
      store.setPermissions([], roles);

      expect(query.hasRoleSync('admin')).toBe(true);
      expect(query.hasRoleSync('seller')).toBe(false);
    });

    it('getAllPermissions should return permissions array', () => {
      const permissions = ['manage_users', 'view_products'];
      store.setPermissions(permissions, []);

      expect(query.getAllPermissions()).toEqual(permissions);
    });

    it('getAllRoles should return roles array', () => {
      const roles: Role[] = [
        { id: 1, name: 'admin', description: 'Admin' },
      ];
      store.setPermissions([], roles);

      expect(query.getAllRoles()).toEqual(roles);
    });

    it('isLoading should return loading state', () => {
      store.setLoading(true);
      expect(query.isLoading()).toBe(true);

      store.setLoading(false);
      expect(query.isLoading()).toBe(false);
    });

    it('isLoaded should return loaded state', () => {
      expect(query.isLoaded()).toBe(false);

      store.setPermissions([], []);
      expect(query.isLoaded()).toBe(true);
    });

    it('getError should return error message', () => {
      const error = 'Test error';
      store.setError(error);

      expect(query.getError()).toBe(error);
    });

    it('getLastFetched should return timestamp', () => {
      expect(query.getLastFetched()).toBeNull();

      store.setPermissions([], []);
      expect(query.getLastFetched()).toBeGreaterThan(0);
    });
  });

  /**
   * Performance Tests
   */
  describe('Performance', () => {
    it('should handle large permission sets efficiently', async () => {
      // Generate 200 permissions
      const permissions = Array.from({ length: 200 }, (_, i) => `permission_${i}`);
      store.setPermissions(permissions, []);

      const startTime = performance.now();
      const result = await firstValueFrom(query.hasPermission('permission_100'));
      const endTime = performance.now();

      expect(result).toBe(true);
      expect(endTime - startTime).toBeLessThan(10); // Should complete in <10ms
    });

    it('should cache observable results', async () => {
      store.setPermissions(['manage_users'], []);

      const obs$ = query.hasPermission('manage_users');

      // Multiple subscriptions should get cached result
      const result1 = await firstValueFrom(obs$);
      const result2 = await firstValueFrom(obs$);

      expect(result1).toBe(result2);
    });
  });
});
