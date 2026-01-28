import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PermissionService } from './permission.service';
import { PermissionStore } from './permission.store';
import { PermissionQuery } from './permission.query';
import { PermissionsResponse, UserWithRoles, Role, Permission } from './permission.model';

/**
 * Permission Service Unit Tests
 *
 * Tests HTTP integration and business logic.
 *
 * Test Coverage:
 * - HTTP requests (success/failure)
 * - Retry logic
 * - Error handling
 * - Cache staleness
 * - State updates
 * - Integration with store
 *
 * @group unit
 * @group service
 * @group http
 */
describe('PermissionService', () => {
  let service: PermissionService;
  let store: PermissionStore;
  let query: PermissionQuery;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PermissionService, PermissionStore, PermissionQuery],
    });

    service = TestBed.inject(PermissionService);
    store = TestBed.inject(PermissionStore);
    query = TestBed.inject(PermissionQuery);
    httpMock = TestBed.inject(HttpTestingController);

    // Mock localStorage for getCurrentUserId
    spyOn(localStorage, 'getItem').and.returnValue(
      JSON.stringify({ id: 1, email: 'test@example.com' })
    );
  });

  afterEach(() => {
    httpMock.verify(); // Verify no outstanding requests
    store.reset();
  });

  /**
   * Fetch Permissions Tests
   */
  describe('fetchUserPermissions()', () => {
    it('should fetch permissions successfully', (done) => {
      const userId = 1;
      const mockResponse: PermissionsResponse = {
        permissions: ['manage_users', 'view_products'],
        roles: [{ id: 1, name: 'admin', description: 'Admin' }],
      };

      // Set loading state should be called
      spyOn(store, 'setLoading');
      spyOn(store, 'setPermissions');

      service.fetchUserPermissions(userId).subscribe({
        next: () => {
          expect(store.setLoading).toHaveBeenCalledWith(true);
          expect(store.setPermissions).toHaveBeenCalledWith(
            mockResponse.permissions,
            mockResponse.roles || []
          );
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne(`/api/admin/users/${userId}/permissions`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle permissions without roles', (done) => {
      const userId = 1;
      const mockResponse: PermissionsResponse = {
        permissions: ['view_products'],
      };

      service.fetchUserPermissions(userId).subscribe({
        next: () => {
          const state = query.getValue();
          expect(state.permissions).toEqual(mockResponse.permissions);
          expect(state.roles).toEqual([]);
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne(`/api/admin/users/${userId}/permissions`);
      req.flush(mockResponse);
    });

    it('should update store with loaded state', (done) => {
      const userId = 1;
      const mockResponse: PermissionsResponse = {
        permissions: ['test'],
      };

      service.fetchUserPermissions(userId).subscribe({
        next: () => {
          const state = query.getValue();
          expect(state.loaded).toBe(true);
          expect(state.loading).toBe(false);
          expect(state.error).toBeNull();
          expect(state.lastFetched).toBeTruthy();
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne(`/api/admin/users/${userId}/permissions`);
      req.flush(mockResponse);
    });
  });

  /**
   * Error Handling Tests
   */
  describe('Error Handling', () => {
    it('should handle 404 error', (done) => {
      const userId = 999;

      service.fetchUserPermissions(userId).subscribe({
        next: () => done.fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
          const state = query.getValue();
          expect(state.error).toContain('not found');
          expect(state.loading).toBe(false);
          done();
        },
      });

      // Expect 4 requests (initial + 3 retries)
      for (let i = 0; i < 4; i++) {
        const req = httpMock.expectOne(`/api/admin/users/${userId}/permissions`);
        req.flush('Not found', { status: 404, statusText: 'Not Found' });
      }
    });

    it('should handle 401 unauthorized error', (done) => {
      const userId = 1;

      service.fetchUserPermissions(userId).subscribe({
        next: () => done.fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(401);
          const state = query.getValue();
          expect(state.error).toContain('Unauthorized');
          done();
        },
      });

      for (let i = 0; i < 4; i++) {
        const req = httpMock.expectOne(`/api/admin/users/${userId}/permissions`);
        req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
      }
    });

    it('should handle 500 server error', (done) => {
      const userId = 1;

      service.fetchUserPermissions(userId).subscribe({
        next: () => done.fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
          const state = query.getValue();
          expect(state.error).toContain('Server error');
          done();
        },
      });

      for (let i = 0; i < 4; i++) {
        const req = httpMock.expectOne(`/api/admin/users/${userId}/permissions`);
        req.flush('Internal error', { status: 500, statusText: 'Internal Server Error' });
      }
    });

    it('should handle network error', (done) => {
      const userId = 1;

      service.fetchUserPermissions(userId).subscribe({
        next: () => done.fail('Should have failed'),
        error: (error) => {
          expect(error).toBeTruthy();
          const state = query.getValue();
          expect(state.error).toBeTruthy();
          done();
        },
      });

      for (let i = 0; i < 4; i++) {
        const req = httpMock.expectOne(`/api/admin/users/${userId}/permissions`);
        req.error(new ProgressEvent('error'));
      }
    });
  });

  /**
   * Retry Logic Tests
   */
  describe('Retry Logic', () => {
    it('should retry 3 times on failure', (done) => {
      const userId = 1;
      let requestCount = 0;

      service.fetchUserPermissions(userId).subscribe({
        next: () => done.fail('Should have failed'),
        error: () => {
          expect(requestCount).toBe(4); // Initial + 3 retries
          done();
        },
      });

      // Handle initial request + 3 retries
      for (let i = 0; i < 4; i++) {
        const req = httpMock.expectOne(`/api/admin/users/${userId}/permissions`);
        requestCount++;
        req.flush('Error', { status: 500, statusText: 'Internal Server Error' });
      }
    });

    it('should succeed on retry', (done) => {
      const userId = 1;
      const mockResponse: PermissionsResponse = {
        permissions: ['test'],
      };

      service.fetchUserPermissions(userId).subscribe({
        next: () => {
          const state = query.getValue();
          expect(state.permissions).toEqual(mockResponse.permissions);
          done();
        },
        error: done.fail,
      });

      // First 2 requests fail
      for (let i = 0; i < 2; i++) {
        const req = httpMock.expectOne(`/api/admin/users/${userId}/permissions`);
        req.flush('Error', { status: 500, statusText: 'Internal Server Error' });
      }

      // Third request succeeds
      const req = httpMock.expectOne(`/api/admin/users/${userId}/permissions`);
      req.flush(mockResponse);
    });
  });

  /**
   * Fetch User with Roles Tests
   */
  describe('fetchUserWithRoles()', () => {
    it('should extract permissions from user roles', (done) => {
      const userId = 1;
      const mockUser: UserWithRoles = {
        id: 1,
        email: 'test@example.com',
        role: {
          id: 1,
          name: 'seller',
          description: 'Seller',
          rolePermissions: [
            {
              permission: {
                id: 1,
                name: 'view_products',
                description: 'View products',
                isSystem: false,
              },
            },
          ],
        },
        assignedRole: {
          id: 2,
          name: 'admin',
          description: 'Admin',
          rolePermissions: [
            {
              permission: {
                id: 2,
                name: 'manage_users',
                description: 'Manage users',
                isSystem: false,
              },
            },
          ],
        },
      };

      service.fetchUserWithRoles(userId).subscribe({
        next: () => {
          const state = query.getValue();
          expect(state.permissions).toContain('view_products');
          expect(state.permissions).toContain('manage_users');
          expect(state.roles.length).toBe(2);
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne(`/api/admin/users/${userId}`);
      req.flush(mockUser);
    });

    it('should handle user with no assigned role', (done) => {
      const userId = 1;
      const mockUser: UserWithRoles = {
        id: 1,
        email: 'test@example.com',
        role: {
          id: 1,
          name: 'customer',
          description: 'Customer',
          rolePermissions: [
            {
              permission: {
                id: 1,
                name: 'view_products',
                description: 'View products',
                isSystem: false,
              },
            },
          ],
        },
      };

      service.fetchUserWithRoles(userId).subscribe({
        next: () => {
          const state = query.getValue();
          expect(state.permissions).toEqual(['view_products']);
          expect(state.roles.length).toBe(1);
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne(`/api/admin/users/${userId}`);
      req.flush(mockUser);
    });
  });

  /**
   * Cache Management Tests
   */
  describe('Cache Management', () => {
    it('should detect stale permissions', () => {
      // New store should be stale (never fetched)
      expect(service.arePermissionsStale()).toBe(true);

      // After fetching
      store.setPermissions(['test'], []);
      expect(service.arePermissionsStale()).toBe(false);
    });

    it('should detect expired cache', () => {
      // Set permissions with old timestamp
      store.setPermissions(['test'], []);
      store.update({ lastFetched: Date.now() - 6 * 60 * 1000 }); // 6 minutes ago

      expect(service.arePermissionsStale()).toBe(true);
    });

    it('ensureFreshPermissions should fetch if not loaded', (done) => {
      service.ensureFreshPermissions().subscribe({
        next: () => {
          expect(query.isLoaded()).toBe(true);
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne(req => /\/api\/admin\/users\/\d+\/permissions/.test(req.url));
      req.flush({ permissions: ['test'] });
    });

    it('ensureFreshPermissions should skip if fresh', (done) => {
      // Set fresh permissions
      store.setPermissions(['test'], []);

      service.ensureFreshPermissions().subscribe({
        next: () => {
          // Should complete without HTTP request
          done();
        },
        error: done.fail,
      });

      // Verify no HTTP request was made
      httpMock.expectNone(req => /\/api\/admin\/users/.test(req.url));
    });

    it('ensureFreshPermissions should refresh if stale', (done) => {
      // Set stale permissions
      store.setPermissions(['test'], []);
      store.update({ lastFetched: Date.now() - 6 * 60 * 1000 });

      service.ensureFreshPermissions().subscribe({
        next: () => {
          expect(query.isLoaded()).toBe(true);
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne(req => /\/api\/admin\/users\/\d+\/permissions/.test(req.url));
      req.flush({ permissions: ['refreshed'] });
    });
  });

  /**
   * Manual Permission Setting Tests
   */
  describe('setPermissions()', () => {
    it('should set permissions directly', () => {
      const permissions = ['manage_users'];
      const roles: Role[] = [{ id: 1, name: 'admin', description: 'Admin' }];

      service.setPermissions(permissions, roles);

      const state = query.getValue();
      expect(state.permissions).toEqual(permissions);
      expect(state.roles).toEqual(roles);
      expect(state.loaded).toBe(true);
    });

    it('should update timestamp when setting manually', () => {
      const beforeTime = Date.now();

      service.setPermissions(['test'], []);

      const afterTime = Date.now();
      const lastFetched = query.getLastFetched();

      expect(lastFetched).toBeGreaterThanOrEqual(beforeTime);
      expect(lastFetched).toBeLessThanOrEqual(afterTime);
    });
  });

  /**
   * Clear Permissions Tests
   */
  describe('clearPermissions()', () => {
    it('should clear all permissions', () => {
      // Set up state
      store.setPermissions(['test'], [{ id: 1, name: 'admin', description: 'Admin' }]);

      // Clear
      service.clearPermissions();

      // Verify
      const state = query.getValue();
      expect(state.permissions).toEqual([]);
      expect(state.roles).toEqual([]);
      expect(state.loaded).toBe(false);
    });
  });

  /**
   * Refresh Permissions Tests
   */
  describe('refreshPermissions()', () => {
    it('should force re-fetch permissions', (done) => {
      const mockResponse: PermissionsResponse = {
        permissions: ['refreshed'],
      };

      service.refreshPermissions().subscribe({
        next: () => {
          const state = query.getValue();
          expect(state.permissions).toEqual(['refreshed']);
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne(req => /\/api\/admin\/users\/\d+\/permissions/.test(req.url));
      req.flush(mockResponse);
    });

    it('should handle refresh without user ID', (done) => {
      // Mock no user
      (localStorage.getItem as jasmine.Spy).and.returnValue(null);

      service.refreshPermissions().subscribe({
        next: () => {
          // Should complete without HTTP request
          done();
        },
        error: done.fail,
      });

      httpMock.expectNone(req => /\/api\/admin\/users/.test(req.url));
    });
  });

  /**
   * Integration Tests
   */
  describe('Integration', () => {
    it('should handle complete flow: fetch -> use -> refresh -> clear', (done) => {
      const userId = 1;

      // 1. Fetch
      service.fetchUserPermissions(userId).subscribe({
        next: () => {
          expect(query.isLoaded()).toBe(true);
          expect(query.hasPermissionSync('initial')).toBe(true);

          // 2. Refresh
          service.refreshPermissions().subscribe({
            next: () => {
              expect(query.hasPermissionSync('refreshed')).toBe(true);

              // 3. Clear
              service.clearPermissions();
              expect(query.isLoaded()).toBe(false);
              expect(query.getAllPermissions()).toEqual([]);

              done();
            },
          });

          const refreshReq = httpMock.expectOne(req => /\/api\/admin\/users\/\d+\/permissions/.test(req.url));
          refreshReq.flush({ permissions: ['refreshed'] });
        },
      });

      const initialReq = httpMock.expectOne(`/api/admin/users/${userId}/permissions`);
      initialReq.flush({ permissions: ['initial'] });
    });
  });
});
