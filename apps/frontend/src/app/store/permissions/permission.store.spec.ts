import { TestBed } from '@angular/core/testing';
import { PermissionStore } from './permission.store';
import { Role } from './permission.model';

/**
 * Permission Store Unit Tests
 *
 * Tests the Akita store for permission state management.
 *
 * Test Coverage:
 * - Initial state initialization
 * - Loading state management
 * - Error state management
 * - Permission updates
 * - State reset on logout
 * - Timestamp updates
 *
 * @group unit
 * @group store
 */
describe('PermissionStore', () => {
  let store: PermissionStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PermissionStore],
    });

    store = TestBed.inject(PermissionStore);
  });

  afterEach(() => {
    // Reset store after each test
    store.reset();
  });

  /**
   * Initialization Tests
   */
  describe('Initialization', () => {
    it('should be created', () => {
      expect(store).toBeTruthy();
    });

    it('should initialize with default empty state', () => {
      const state = store.getValue();

      expect(state.permissions).toEqual([]);
      expect(state.roles).toEqual([]);
      expect(state.loading).toBe(false);
      expect(state.loaded).toBe(false);
      expect(state.error).toBeNull();
      expect(state.lastFetched).toBeNull();
    });

    it('should have resettable configuration', () => {
      // Update state
      store.update({
        permissions: ['test_permission'],
        loaded: true,
      });

      // Reset
      store.reset();

      // Should return to initial state
      const state = store.getValue();
      expect(state.permissions).toEqual([]);
      expect(state.loaded).toBe(false);
    });
  });

  /**
   * Loading State Tests
   */
  describe('Loading State', () => {
    it('should set loading to true', () => {
      store.setLoading(true);

      const state = store.getValue();
      expect(state.loading).toBe(true);
    });

    it('should set loading to false', () => {
      store.setLoading(true);
      store.setLoading(false);

      const state = store.getValue();
      expect(state.loading).toBe(false);
    });

    it('should clear error when setting loading to true', () => {
      // Set error first
      store.setError('Test error');
      expect(store.getValue().error).toBe('Test error');

      // Set loading should clear error
      store.setLoading(true);
      expect(store.getValue().error).toBeNull();
    });

    it('should preserve error when setting loading to false', () => {
      store.setError('Test error');
      store.setLoading(false);

      const state = store.getValue();
      expect(state.error).toBe('Test error');
    });
  });

  /**
   * Error State Tests
   */
  describe('Error State', () => {
    it('should set error message', () => {
      const errorMessage = 'Failed to load permissions';
      store.setError(errorMessage);

      const state = store.getValue();
      expect(state.error).toBe(errorMessage);
      expect(state.loading).toBe(false);
    });

    it('should stop loading when error occurs', () => {
      store.setLoading(true);
      store.setError('Error occurred');

      const state = store.getValue();
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Error occurred');
    });

    it('should allow multiple error updates', () => {
      store.setError('First error');
      expect(store.getValue().error).toBe('First error');

      store.setError('Second error');
      expect(store.getValue().error).toBe('Second error');
    });
  });

  /**
   * Permission Update Tests
   */
  describe('Permission Updates', () => {
    it('should set permissions and roles', () => {
      const permissions = ['manage_users', 'view_products'];
      const roles: Role[] = [
        { id: 1, name: 'admin', description: 'Administrator' },
      ];

      store.setPermissions(permissions, roles);

      const state = store.getValue();
      expect(state.permissions).toEqual(permissions);
      expect(state.roles).toEqual(roles);
      expect(state.loaded).toBe(true);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.lastFetched).toBeTruthy();
    });

    it('should update lastFetched timestamp', () => {
      const beforeTime = Date.now();

      store.setPermissions(['test'], []);

      const afterTime = Date.now();
      const state = store.getValue();

      expect(state.lastFetched).toBeGreaterThanOrEqual(beforeTime);
      expect(state.lastFetched).toBeLessThanOrEqual(afterTime);
    });

    it('should clear error when setting permissions', () => {
      store.setError('Previous error');
      store.setPermissions(['test'], []);

      const state = store.getValue();
      expect(state.error).toBeNull();
    });

    it('should handle empty permissions', () => {
      store.setPermissions([], []);

      const state = store.getValue();
      expect(state.permissions).toEqual([]);
      expect(state.loaded).toBe(true);
    });

    it('should handle multiple roles', () => {
      const roles: Role[] = [
        { id: 1, name: 'seller', description: 'Seller' },
        { id: 2, name: 'admin', description: 'Admin' },
      ];

      store.setPermissions(['test'], roles);

      const state = store.getValue();
      expect(state.roles.length).toBe(2);
      expect(state.roles).toEqual(roles);
    });
  });

  /**
   * State Reset Tests
   */
  describe('State Reset', () => {
    it('should clear all permissions', () => {
      // Set up state
      store.setPermissions(['test'], [{ id: 1, name: 'admin', description: 'Admin' }]);

      // Clear
      store.clearPermissions();

      // Should be back to initial state
      const state = store.getValue();
      expect(state.permissions).toEqual([]);
      expect(state.roles).toEqual([]);
      expect(state.loaded).toBe(false);
      expect(state.lastFetched).toBeNull();
    });

    it('should clear errors on reset', () => {
      store.setError('Test error');
      store.clearPermissions();

      const state = store.getValue();
      expect(state.error).toBeNull();
    });

    it('should stop loading on reset', () => {
      store.setLoading(true);
      store.clearPermissions();

      const state = store.getValue();
      expect(state.loading).toBe(false);
    });
  });

  /**
   * Timestamp Update Tests
   */
  describe('Timestamp Updates', () => {
    it('should update lastFetched timestamp', () => {
      const beforeTime = Date.now();

      store.updateLastFetched();

      const afterTime = Date.now();
      const state = store.getValue();

      expect(state.lastFetched).toBeGreaterThanOrEqual(beforeTime);
      expect(state.lastFetched).toBeLessThanOrEqual(afterTime);
    });

    it('should preserve other state when updating timestamp', () => {
      store.setPermissions(['test'], []);
      const permissions = store.getValue().permissions;

      store.updateLastFetched();

      const state = store.getValue();
      expect(state.permissions).toEqual(permissions);
      expect(state.loaded).toBe(true);
    });
  });

  /**
   * Integration Tests
   */
  describe('State Flow Integration', () => {
    it('should handle complete fetch flow', () => {
      // Start loading
      store.setLoading(true);
      expect(store.getValue().loading).toBe(true);

      // Set permissions (success)
      const permissions = ['manage_users'];
      const roles: Role[] = [{ id: 1, name: 'admin', description: 'Admin' }];
      store.setPermissions(permissions, roles);

      const state = store.getValue();
      expect(state.loading).toBe(false);
      expect(state.loaded).toBe(true);
      expect(state.permissions).toEqual(permissions);
      expect(state.roles).toEqual(roles);
      expect(state.error).toBeNull();
    });

    it('should handle error flow', () => {
      // Start loading
      store.setLoading(true);

      // Error occurs
      store.setError('Network error');

      const state = store.getValue();
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Network error');
      expect(state.loaded).toBe(false);
    });

    it('should handle refresh flow', () => {
      // Initial load
      store.setPermissions(['permission1'], []);

      // Refresh
      store.setLoading(true);
      store.setPermissions(['permission1', 'permission2'], []);

      const state = store.getValue();
      expect(state.permissions.length).toBe(2);
      expect(state.loaded).toBe(true);
    });

    it('should handle logout flow', () => {
      // User logged in with permissions
      store.setPermissions(['manage_users'], [{ id: 1, name: 'admin', description: 'Admin' }]);

      // User logs out
      store.clearPermissions();

      // State should be clean
      const state = store.getValue();
      expect(state.permissions).toEqual([]);
      expect(state.roles).toEqual([]);
      expect(state.loaded).toBe(false);
    });
  });
});
