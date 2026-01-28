import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlSegment, UrlTree, GuardResult } from '@angular/router';
import { Observable, of, delay, from, isObservable } from 'rxjs';
import { permissionGuard } from './permission.guard';
import { PermissionQuery } from '../../store/permissions/permission.query';

/**
 * Comprehensive test suite for permissionGuard functional guard.
 *
 * @description
 * This test suite verifies the permission guard's ability to:
 * - Check single and multiple permissions
 * - Handle AND/OR permission logic
 * - Perform smart redirects with query parameters
 * - Handle missing configuration gracefully
 * - Manage observable behavior and async operations
 *
 * Test Coverage:
 * - Single Permission Checking (5 cases)
 * - Multiple Permissions (4 cases)
 * - Permission Mode (3 cases)
 * - Smart Redirects (4 cases)
 * - Missing Configuration (2 cases)
 * - Observable Behavior (2 cases)
 * - Additional Edge Cases (4 cases)
 *
 * @totalTests 24 test cases
 * @targetCoverage >90%
 */
describe('permissionGuard', () => {
  let mockPermissionQuery: jasmine.SpyObj<PermissionQuery>;
  let mockRouter: jasmine.SpyObj<Router>;
  let route: ActivatedRouteSnapshot;
  let state: RouterStateSnapshot;

  /**
   * Configure TestBed with mock dependencies before each test.
   * Sets up spies for PermissionQuery and Router services.
   */
  beforeEach(() => {
    // Create spies for PermissionQuery service
    mockPermissionQuery = jasmine.createSpyObj('PermissionQuery', [
      'hasAllPermissions',
      'hasAnyPermission'
    ]);

    // Create spies for Router service
    mockRouter = jasmine.createSpyObj('Router', ['createUrlTree']);

    // Configure TestBed with mock providers
    TestBed.configureTestingModule({
      providers: [
        { provide: PermissionQuery, useValue: mockPermissionQuery },
        { provide: Router, useValue: mockRouter }
      ]
    });

    // Create mock ActivatedRouteSnapshot
    route = new ActivatedRouteSnapshot();
    route.data = {};
    route.url = [];
    // Use Object.defineProperty for read-only routeConfig property
    Object.defineProperty(route, 'routeConfig', {
      value: { path: 'test-route' },
      writable: true
    });

    // Create mock RouterStateSnapshot
    state = { url: '/test', root: route } as RouterStateSnapshot;
  });

  /**
   * Helper function to execute the functional guard in test context.
   *
   * @param routeData - Route data object containing permission configuration
   * @returns Observable of guard result (GuardResult includes boolean, UrlTree, RedirectCommand)
   */
  function executeGuard(routeData: any): Observable<GuardResult> {
    route.data = routeData;

    const result = TestBed.runInInjectionContext(() =>
      permissionGuard(route, state)
    );

    // Convert MaybeAsync<GuardResult> to Observable
    if (isObservable(result)) {
      return result as Observable<GuardResult>;
    } else if (result instanceof Promise) {
      return from(result) as Observable<GuardResult>;
    } else {
      return of(result) as Observable<GuardResult>;
    }
  }

  /**
   * Helper function to setup permission query mock to return specific result.
   *
   * @param mode - Permission check mode ('all' for AND logic, 'any' for OR logic)
   * @param result - The boolean result the mock should return
   */
  function mockPermissionCheck(mode: 'all' | 'any', result: boolean): void {
    const method = mode === 'all' ? 'hasAllPermissions' : 'hasAnyPermission';
    mockPermissionQuery[method].and.returnValue(of(result));
  }

  /**
   * Helper function to verify UrlTree was created with expected path and query params.
   *
   * @param path - Expected redirect path
   * @param queryParams - Expected query parameters object
   */
  function expectRedirect(path: string, queryParams: any): void {
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(
      [path],
      { queryParams }
    );
  }

  /**
   * Helper function to setup route URL segments.
   *
   * @param segments - Array of URL segment strings
   */
  function setupRouteUrl(segments: string[]): void {
    route.url = segments.map(segment => new UrlSegment(segment, {}));
  }

  // ========================================================================
  // 1. Single Permission Checking (5 cases)
  // ========================================================================

  describe('Single Permission Checking', () => {
    /**
     * Test that guard allows access when user has the required single permission.
     *
     * Scenario: User has 'manage_users' permission
     * Expected: Guard returns true
     */
    it('should allow access when user has required permission', (done) => {
      // Arrange: Setup route with single permission requirement
      const routeData = {
        requiredPermissions: ['manage_users']
      };
      mockPermissionCheck('all', true);

      // Act: Execute guard
      executeGuard(routeData).subscribe({
        next: (result) => {
          // Assert: Access should be granted
          expect(result).toBe(true);
          expect(mockPermissionQuery.hasAllPermissions).toHaveBeenCalledWith(['manage_users']);
          done();
        }
      });
    });

    /**
     * Test that guard denies access when user lacks the required permission.
     *
     * Scenario: User does not have 'manage_users' permission
     * Expected: Guard returns UrlTree to /unauthorized with query params
     */
    it('should deny access when user lacks required permission', (done) => {
      // Arrange: Setup route and mock permission check to return false
      const routeData = {
        requiredPermissions: ['manage_users']
      };
      setupRouteUrl(['admin', 'users']);
      mockPermissionCheck('all', false);

      const mockUrlTree = {} as UrlTree;
      mockRouter.createUrlTree.and.returnValue(mockUrlTree);

      // Act: Execute guard
      executeGuard(routeData).subscribe({
        next: (result) => {
          // Assert: Should redirect with proper query params
          expect(result).toBe(mockUrlTree);
          expectRedirect('/unauthorized', {
            returnUrl: 'admin/users',
            reason: 'insufficient_permissions',
            required: 'manage_users'
          });
          done();
        }
      });
    });

    /**
     * Test that guard handles string permission (not array).
     *
     * Scenario: requiredPermissions is a string 'manage_users' instead of array
     * Expected: Guard normalizes to array and checks permission correctly
     */
    it('should handle string permission (not array)', (done) => {
      // Arrange: Setup route with string permission instead of array
      const routeData = {
        requiredPermissions: 'manage_users' // String, not array
      };
      mockPermissionCheck('all', true);

      // Act: Execute guard
      executeGuard(routeData).subscribe({
        next: (result) => {
          // Assert: Guard should normalize string to array
          expect(result).toBe(true);
          expect(mockPermissionQuery.hasAllPermissions).toHaveBeenCalledWith(['manage_users']);
          done();
        }
      });
    });

    /**
     * Test that guard checks permission synchronously and emits only once.
     *
     * Scenario: Execute guard and verify observable completes after single emission
     * Expected: Observable emits once and completes (take(1) operator working)
     */
    it('should check permission synchronously and emit once', (done) => {
      // Arrange: Setup route and spy on next/complete
      const routeData = {
        requiredPermissions: ['manage_users']
      };
      mockPermissionCheck('all', true);

      let emissionCount = 0;

      // Act: Execute guard and count emissions
      executeGuard(routeData).subscribe({
        next: () => {
          emissionCount++;
          expect(emissionCount).toBe(1);
        },
        complete: () => {
          // Assert: Observable should complete after single emission
          expect(emissionCount).toBe(1);
          done();
        }
      });
    });

    /**
     * Test that guard logs permission grant to console.
     *
     * Scenario: User has required permission
     * Expected: console.log is called with success message
     */
    it('should log permission grant to console', (done) => {
      // Arrange: Spy on console.log
      spyOn(console, 'log');
      const routeData = {
        requiredPermissions: ['manage_users']
      };
      mockPermissionCheck('all', true);

      // Act: Execute guard
      executeGuard(routeData).subscribe({
        next: () => {
          // Assert: console.log should be called with success message
          expect(console.log).toHaveBeenCalledWith(
            '✅ Permission granted for route:',
            jasmine.objectContaining({
              path: 'test-route',
              permissions: ['manage_users'],
              mode: 'all'
            })
          );
          done();
        }
      });
    });
  });

  // ========================================================================
  // 2. Multiple Permissions (4 cases)
  // ========================================================================

  describe('Multiple Permissions', () => {
    /**
     * Test that guard allows access when user has ALL required permissions (AND logic).
     *
     * Scenario: User has both 'manage_users' AND 'view_users'
     * Expected: Guard returns true
     */
    it('should allow access when user has ALL required permissions (AND logic)', (done) => {
      // Arrange: Setup route with multiple permissions and 'all' mode
      const routeData = {
        requiredPermissions: ['manage_users', 'view_users'],
        permissionMode: 'all'
      };
      mockPermissionCheck('all', true);

      // Act: Execute guard
      executeGuard(routeData).subscribe({
        next: (result) => {
          // Assert: Access granted when all permissions present
          expect(result).toBe(true);
          expect(mockPermissionQuery.hasAllPermissions).toHaveBeenCalledWith(['manage_users', 'view_users']);
          done();
        }
      });
    });

    /**
     * Test that guard denies access when user lacks ANY required permission (AND logic).
     *
     * Scenario: User has 'manage_users' but not 'view_users'
     * Expected: Guard returns UrlTree to /unauthorized
     */
    it('should deny access when user lacks ANY required permission (AND logic)', (done) => {
      // Arrange: Setup route with AND logic, mock as missing one permission
      const routeData = {
        requiredPermissions: ['manage_users', 'view_users'],
        permissionMode: 'all'
      };
      setupRouteUrl(['admin', 'users']);
      mockPermissionCheck('all', false);

      const mockUrlTree = {} as UrlTree;
      mockRouter.createUrlTree.and.returnValue(mockUrlTree);

      // Act: Execute guard
      executeGuard(routeData).subscribe({
        next: (result) => {
          // Assert: Access denied when not all permissions present
          expect(result).toBe(mockUrlTree);
          expectRedirect('/unauthorized', {
            returnUrl: 'admin/users',
            reason: 'insufficient_permissions',
            required: 'manage_users,view_users'
          });
          done();
        }
      });
    });

    /**
     * Test that guard allows access when user has ANY required permission (OR logic).
     *
     * Scenario: User has 'manage_users' OR 'manage_roles' (at least one)
     * Expected: Guard returns true
     */
    it('should allow access when user has ANY required permission (OR logic)', (done) => {
      // Arrange: Setup route with 'any' permission mode
      const routeData = {
        requiredPermissions: ['manage_users', 'manage_roles'],
        permissionMode: 'any'
      };
      mockPermissionCheck('any', true);

      // Act: Execute guard
      executeGuard(routeData).subscribe({
        next: (result) => {
          // Assert: Access granted when at least one permission present
          expect(result).toBe(true);
          expect(mockPermissionQuery.hasAnyPermission).toHaveBeenCalledWith(['manage_users', 'manage_roles']);
          done();
        }
      });
    });

    /**
     * Test that guard denies access when user has NONE of the required permissions (OR logic).
     *
     * Scenario: User has neither 'manage_users' nor 'manage_roles'
     * Expected: Guard returns UrlTree to /unauthorized
     */
    it('should deny access when user has NONE of the required permissions (OR logic)', (done) => {
      // Arrange: Setup route with OR logic, mock as having no permissions
      const routeData = {
        requiredPermissions: ['manage_users', 'manage_roles'],
        permissionMode: 'any'
      };
      setupRouteUrl(['admin', 'roles']);
      mockPermissionCheck('any', false);

      const mockUrlTree = {} as UrlTree;
      mockRouter.createUrlTree.and.returnValue(mockUrlTree);

      // Act: Execute guard
      executeGuard(routeData).subscribe({
        next: (result) => {
          // Assert: Access denied when no permissions present
          expect(result).toBe(mockUrlTree);
          expectRedirect('/unauthorized', {
            returnUrl: 'admin/roles',
            reason: 'insufficient_permissions',
            required: 'manage_users,manage_roles'
          });
          done();
        }
      });
    });
  });

  // ========================================================================
  // 3. Permission Mode (3 cases)
  // ========================================================================

  describe('Permission Mode', () => {
    /**
     * Test that guard defaults to "all" mode when permissionMode not specified.
     *
     * Scenario: Route has requiredPermissions but no permissionMode
     * Expected: Guard uses hasAllPermissions (AND logic)
     */
    it('should default to "all" mode when permissionMode not specified', (done) => {
      // Arrange: Setup route without permissionMode
      const routeData = {
        requiredPermissions: ['perm1', 'perm2']
        // permissionMode is undefined
      };
      mockPermissionCheck('all', true);

      // Act: Execute guard
      executeGuard(routeData).subscribe({
        next: () => {
          // Assert: Should call hasAllPermissions, not hasAnyPermission
          expect(mockPermissionQuery.hasAllPermissions).toHaveBeenCalledWith(['perm1', 'perm2']);
          expect(mockPermissionQuery.hasAnyPermission).not.toHaveBeenCalled();
          done();
        }
      });
    });

    /**
     * Test that guard uses "any" mode when specified.
     *
     * Scenario: Route has permissionMode set to 'any'
     * Expected: Guard uses hasAnyPermission (OR logic)
     */
    it('should use "any" mode when specified', (done) => {
      // Arrange: Setup route with explicit 'any' mode
      const routeData = {
        requiredPermissions: ['perm1', 'perm2'],
        permissionMode: 'any'
      };
      mockPermissionCheck('any', true);

      // Act: Execute guard
      executeGuard(routeData).subscribe({
        next: () => {
          // Assert: Should call hasAnyPermission, not hasAllPermissions
          expect(mockPermissionQuery.hasAnyPermission).toHaveBeenCalledWith(['perm1', 'perm2']);
          expect(mockPermissionQuery.hasAllPermissions).not.toHaveBeenCalled();
          done();
        }
      });
    });

    /**
     * Test that guard uses "all" mode when explicitly specified.
     *
     * Scenario: Route has permissionMode explicitly set to 'all'
     * Expected: Guard uses hasAllPermissions (AND logic)
     */
    it('should use "all" mode when explicitly specified', (done) => {
      // Arrange: Setup route with explicit 'all' mode
      const routeData = {
        requiredPermissions: ['perm1', 'perm2'],
        permissionMode: 'all'
      };
      mockPermissionCheck('all', true);

      // Act: Execute guard
      executeGuard(routeData).subscribe({
        next: () => {
          // Assert: Should call hasAllPermissions
          expect(mockPermissionQuery.hasAllPermissions).toHaveBeenCalledWith(['perm1', 'perm2']);
          expect(mockPermissionQuery.hasAnyPermission).not.toHaveBeenCalled();
          done();
        }
      });
    });
  });

  // ========================================================================
  // 4. Smart Redirects (4 cases)
  // ========================================================================

  describe('Smart Redirects', () => {
    /**
     * Test that guard redirects to default /unauthorized when no redirectTo specified.
     *
     * Scenario: Route has no custom redirectTo path
     * Expected: Redirect to default '/unauthorized' path
     */
    it('should redirect to default /unauthorized when no redirectTo specified', (done) => {
      // Arrange: Setup route without redirectTo
      const routeData = {
        requiredPermissions: ['manage_users']
        // redirectTo is undefined
      };
      setupRouteUrl(['admin', 'users']);
      mockPermissionCheck('all', false);

      const mockUrlTree = {} as UrlTree;
      mockRouter.createUrlTree.and.returnValue(mockUrlTree);

      // Act: Execute guard
      executeGuard(routeData).subscribe({
        next: (result) => {
          // Assert: Should redirect to default /unauthorized
          expect(result).toBe(mockUrlTree);
          expect(mockRouter.createUrlTree).toHaveBeenCalledWith(
            ['/unauthorized'],
            jasmine.any(Object)
          );
          done();
        }
      });
    });

    /**
     * Test that guard redirects to custom path when redirectTo specified.
     *
     * Scenario: Route has custom redirectTo path '/admin/access-denied'
     * Expected: Redirect to custom path instead of default
     */
    it('should redirect to custom path when redirectTo specified', (done) => {
      // Arrange: Setup route with custom redirect path
      const routeData = {
        requiredPermissions: ['manage_users'],
        redirectTo: '/admin/access-denied'
      };
      setupRouteUrl(['admin', 'users']);
      mockPermissionCheck('all', false);

      const mockUrlTree = {} as UrlTree;
      mockRouter.createUrlTree.and.returnValue(mockUrlTree);

      // Act: Execute guard
      executeGuard(routeData).subscribe({
        next: (result) => {
          // Assert: Should redirect to custom path
          expect(result).toBe(mockUrlTree);
          expect(mockRouter.createUrlTree).toHaveBeenCalledWith(
            ['/admin/access-denied'],
            jasmine.any(Object)
          );
          done();
        }
      });
    });

    /**
     * Test that guard includes returnUrl query param with original route.
     *
     * Scenario: User tries to access /admin/users
     * Expected: Redirect includes returnUrl=admin/users
     */
    it('should include returnUrl query param with original route', (done) => {
      // Arrange: Setup route with URL segments
      const routeData = {
        requiredPermissions: ['manage_users']
      };
      setupRouteUrl(['admin', 'users']);
      mockPermissionCheck('all', false);

      const mockUrlTree = {} as UrlTree;
      mockRouter.createUrlTree.and.returnValue(mockUrlTree);

      // Act: Execute guard
      executeGuard(routeData).subscribe({
        next: () => {
          // Assert: returnUrl should be constructed from route.url
          expectRedirect('/unauthorized', jasmine.objectContaining({
            returnUrl: 'admin/users'
          }));
          done();
        }
      });
    });

    /**
     * Test that guard includes reason query param with "insufficient_permissions".
     *
     * Scenario: Access denied due to missing permissions
     * Expected: Redirect includes reason=insufficient_permissions
     */
    it('should include reason query param with "insufficient_permissions"', (done) => {
      // Arrange: Setup route and deny access
      const routeData = {
        requiredPermissions: ['manage_users']
      };
      setupRouteUrl(['admin', 'users']);
      mockPermissionCheck('all', false);

      const mockUrlTree = {} as UrlTree;
      mockRouter.createUrlTree.and.returnValue(mockUrlTree);

      // Act: Execute guard
      executeGuard(routeData).subscribe({
        next: () => {
          // Assert: reason should be 'insufficient_permissions'
          expectRedirect('/unauthorized', jasmine.objectContaining({
            reason: 'insufficient_permissions'
          }));
          done();
        }
      });
    });
  });

  // ========================================================================
  // 5. Missing Configuration (2 cases)
  // ========================================================================

  describe('Missing Configuration', () => {
    /**
     * Test that guard allows access when requiredPermissions is not specified.
     *
     * Scenario: Route has permissionGuard but no requiredPermissions in data
     * Expected: Guard returns true (allow access) and logs warning
     */
    it('should allow access when requiredPermissions is not specified', (done) => {
      // Arrange: Setup route without requiredPermissions
      spyOn(console, 'warn');
      const routeData = {}; // No requiredPermissions

      // Act: Execute guard
      executeGuard(routeData).subscribe({
        next: (result) => {
          // Assert: Should allow access and log warning
          expect(result).toBe(true);
          expect(console.warn).toHaveBeenCalled();
          done();
        }
      });
    });

    /**
     * Test that guard logs warning when guard used without requiredPermissions.
     *
     * Scenario: Guard is applied to route but requiredPermissions not configured
     * Expected: console.warn called with specific warning message
     */
    it('should log warning when guard used without requiredPermissions', (done) => {
      // Arrange: Spy on console.warn and setup route without permissions
      spyOn(console, 'warn');
      const routeData = {}; // No requiredPermissions

      // Act: Execute guard
      executeGuard(routeData).subscribe({
        next: () => {
          // Assert: Specific warning message should be logged
          expect(console.warn).toHaveBeenCalledWith(
            '⚠️ Route has permissionGuard but no requiredPermissions specified:',
            'test-route'
          );
          done();
        }
      });
    });
  });

  // ========================================================================
  // 6. Observable Behavior (2 cases)
  // ========================================================================

  describe('Observable Behavior', () => {
    /**
     * Test that guard completes observable after single emission.
     *
     * Scenario: Execute guard and monitor observable lifecycle
     * Expected: Observable completes after emitting result (not infinite)
     */
    it('should complete observable after single emission', (done) => {
      // Arrange: Setup route with permissions
      const routeData = {
        requiredPermissions: ['manage_users']
      };
      mockPermissionCheck('all', true);

      let completeCalled = false;

      // Act: Execute guard and monitor complete event
      executeGuard(routeData).subscribe({
        next: (result) => {
          expect(result).toBe(true);
        },
        complete: () => {
          // Assert: Complete should be called
          completeCalled = true;
          expect(completeCalled).toBe(true);
          done();
        }
      });
    });

    /**
     * Test that guard handles delayed permission query response.
     *
     * Scenario: PermissionQuery returns observable that emits after 100ms delay
     * Expected: Guard waits for permission check and returns correct result
     */
    it('should handle delayed permission query response', (done) => {
      // Arrange: Setup route and mock delayed response
      const routeData = {
        requiredPermissions: ['manage_users']
      };

      // Mock delayed observable (simulates async permission check)
      mockPermissionQuery.hasAllPermissions.and.returnValue(
        of(true).pipe(delay(100))
      );

      const startTime = Date.now();

      // Act: Execute guard
      executeGuard(routeData).subscribe({
        next: (result) => {
          // Assert: Result should arrive after delay
          const elapsed = Date.now() - startTime;
          expect(elapsed).toBeGreaterThanOrEqual(100);
          expect(result).toBe(true);
          done();
        }
      });
    });
  });

  // ========================================================================
  // 7. Additional Edge Cases (Bonus Coverage)
  // ========================================================================

  describe('Additional Edge Cases', () => {
    /**
     * Test that guard logs denial to console with proper details.
     *
     * Scenario: Access is denied
     * Expected: console.warn called with denial details
     */
    it('should log permission denial to console', (done) => {
      // Arrange: Spy on console.warn
      spyOn(console, 'warn');
      const routeData = {
        requiredPermissions: ['manage_users']
      };
      mockPermissionCheck('all', false);

      const mockUrlTree = {} as UrlTree;
      mockRouter.createUrlTree.and.returnValue(mockUrlTree);

      // Act: Execute guard
      executeGuard(routeData).subscribe({
        next: () => {
          // Assert: console.warn should be called with denial details
          expect(console.warn).toHaveBeenCalledWith(
            '❌ Permission denied for route:',
            jasmine.objectContaining({
              path: 'test-route',
              permissions: ['manage_users'],
              mode: 'all',
              reason: 'insufficient_permissions'
            })
          );
          done();
        }
      });
    });

    /**
     * Test that guard includes required permissions in query params.
     *
     * Scenario: Multiple permissions required for access
     * Expected: Redirect includes comma-separated list of required permissions
     */
    it('should include required permissions in redirect query params', (done) => {
      // Arrange: Setup route with multiple permissions
      const routeData = {
        requiredPermissions: ['manage_users', 'view_users', 'delete_users']
      };
      setupRouteUrl(['admin', 'users']);
      mockPermissionCheck('all', false);

      const mockUrlTree = {} as UrlTree;
      mockRouter.createUrlTree.and.returnValue(mockUrlTree);

      // Act: Execute guard
      executeGuard(routeData).subscribe({
        next: () => {
          // Assert: required param should contain comma-separated permissions
          expectRedirect('/unauthorized', jasmine.objectContaining({
            required: 'manage_users,view_users,delete_users'
          }));
          done();
        }
      });
    });

    /**
     * Test that guard handles empty URL segments.
     *
     * Scenario: Route has no URL segments
     * Expected: returnUrl should be empty string
     */
    it('should handle empty URL segments', (done) => {
      // Arrange: Setup route with empty URL
      const routeData = {
        requiredPermissions: ['manage_users']
      };
      route.url = []; // Empty URL segments
      mockPermissionCheck('all', false);

      const mockUrlTree = {} as UrlTree;
      mockRouter.createUrlTree.and.returnValue(mockUrlTree);

      // Act: Execute guard
      executeGuard(routeData).subscribe({
        next: () => {
          // Assert: returnUrl should be empty string
          expectRedirect('/unauthorized', jasmine.objectContaining({
            returnUrl: ''
          }));
          done();
        }
      });
    });

    /**
     * Test that guard does not call permission check when no permissions required.
     *
     * Scenario: Route has no requiredPermissions
     * Expected: PermissionQuery methods are never called
     */
    it('should not call permission check when no permissions required', (done) => {
      // Arrange: Setup route without permissions
      const routeData = {};
      spyOn(console, 'warn');

      // Act: Execute guard
      executeGuard(routeData).subscribe({
        next: (result) => {
          // Assert: Permission query methods should not be called
          expect(result).toBe(true);
          expect(mockPermissionQuery.hasAllPermissions).not.toHaveBeenCalled();
          expect(mockPermissionQuery.hasAnyPermission).not.toHaveBeenCalled();
          done();
        }
      });
    });
  });
});
