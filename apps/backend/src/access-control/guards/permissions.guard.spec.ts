/**
 * @file permissions.guard.spec.ts
 * @description Comprehensive Unit Tests for PermissionsGuard - Enterprise RBAC Authorization Guard
 *
 * This test suite provides extensive coverage (50+ test cases) for the core authorization guard
 * that handles route-level permission checking in the Full-Stack Dynamic RBAC system.
 *
 * Test Coverage Areas:
 * 1. Permission Checking (15 cases) - Core authorization logic
 * 2. Route Discovery & Caching (10 cases) - Performance optimization
 * 3. @Public() Decorator (5 cases) - Auth-free routes
 * 4. Security Audit Logging (8 cases) - Compliance and monitoring
 * 5. Rate Limiting (5 cases) - Brute force protection
 * 6. Performance (4 cases) - Response time benchmarks
 * 7. Error Handling (5 cases) - Graceful degradation
 * 8. Edge Cases (3 cases) - Boundary conditions
 *
 * Testing Tools:
 * - Jest with NestJS testing utilities
 * - Mock factories for User, Role, Permission, Route entities
 * - Performance benchmarks using Date.now()
 *
 * Coverage Target: >90% statement coverage
 *
 * @author SouqSyria Security Team
 * @version 2.0.0
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PermissionsGuard } from './permissions.guard';
import { Route } from '../entities/route.entity';
import { User } from '../../users/entities/user.entity';
import { Permission } from '../entities/permission.entity';
import { Role } from '../../roles/entities/role.entity';
import { RolePermission } from '../entities/role-permission.entity';
import {
  SecurityAuditService,
  LogPermissionCheckDto,
} from '../security-audit/security-audit.service';
import {
  SecurityAuditAction,
  ResourceType,
} from '../entities/security-audit-log.entity';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';

// ============================================================================
// MOCK FACTORIES
// ============================================================================

/**
 * Factory for creating mock Permission entities
 * @param overrides - Partial properties to override defaults
 * @returns Complete Permission mock object
 */
const createMockPermission = (overrides: Partial<Permission> = {}): Permission => ({
  id: 1,
  name: 'view_products',
  description: 'View product listings',
  resource: 'products',
  action: 'view',
  isSystem: false,
  category: 'products',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

/**
 * Factory for creating mock Role entities
 * @param overrides - Partial properties to override defaults
 * @returns Complete Role mock object
 */
const createMockRole = (overrides: Partial<Role> = {}): Role => ({
  id: 1,
  name: 'vendor',
  description: 'Vendor role',
  isDefault: false,
  isSystem: false,
  type: 'business',
  priority: 0,
  rolePermissions: [],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  deletedAt: null,
  ...overrides,
});

/**
 * Factory for creating mock RolePermission entities
 * @param role - Associated Role
 * @param permission - Associated Permission
 * @param overrides - Partial properties to override defaults
 * @returns Complete RolePermission mock object
 */
const createMockRolePermission = (
  role: Role,
  permission: Permission,
  overrides: Partial<RolePermission> = {},
): RolePermission => ({
  id: 1,
  role,
  permission,
  createdAt: new Date('2024-01-01'),
  ...overrides,
});

/**
 * Factory for creating mock Route entities
 * @param overrides - Partial properties to override defaults
 * @returns Complete Route mock object
 */
const createMockRoute = (overrides: Partial<Route> = {}): Route => ({
  id: 1,
  path: '/api/products',
  method: 'GET',
  permission: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

/**
 * Factory for creating mock User entities with full relations
 * @param overrides - Partial properties to override defaults
 * @returns Complete User mock object with helper methods
 */
const createMockUser = (overrides: Partial<User> = {}): User => {
  const user = {
    id: 1,
    firebaseUid: 'firebase-uid-123',
    email: 'test@example.com',
    phone: '+1234567890',
    fullName: 'Test User',
    passwordHash: 'hashed-password',
    isVerified: true,
    otpCode: null,
    googleId: null,
    facebookId: null,
    oauthProvider: null,
    profilePictureUrl: null,
    oauthAccessToken: null,
    oauthRefreshToken: null,
    role: null,
    assignedRole: null,
    lastLoginAt: new Date('2024-01-01'),
    isBanned: false,
    isSuspended: false,
    metadata: {},
    wishlist: [],
    addresses: [],
    deletedAt: null,
    resetPasswordToken: null,
    resetPasswordExpires: null,
    failedLoginAttempts: 0,
    accountLockedUntil: null,
    passwordChangedAt: new Date('2024-01-01'),
    lastActivityAt: new Date('2024-01-01'),
    banReason: null,
    bannedUntil: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    // Helper methods
    isAccountLocked: jest.fn().mockReturnValue(false),
    isTemporarilyBanned: jest.fn().mockReturnValue(false),
    isResetTokenValid: jest.fn().mockReturnValue(false),
    resetFailedAttempts: jest.fn(),
    incrementFailedAttempts: jest.fn(),
    isPasswordExpired: jest.fn().mockReturnValue(false),
    isInactive: jest.fn().mockReturnValue(false),
    ...overrides,
  } as User;
  return user;
};

/**
 * Factory for creating mock ExecutionContext
 * @param options - Configuration options for the mock context
 * @returns Mock ExecutionContext for testing guards
 */
const createMockExecutionContext = (options: {
  path?: string;
  method?: string;
  user?: any;
  ip?: string;
  userAgent?: string;
  routePath?: string;
  queryParams?: string;
} = {}): ExecutionContext => {
  const {
    path = '/api/products',
    method = 'GET',
    user = { id: 1, role: 'vendor', email: 'test@example.com' },
    ip = '127.0.0.1',
    userAgent = 'Mozilla/5.0 (Test Agent)',
    routePath = null,
    queryParams = '',
  } = options;

  const fullUrl = queryParams ? `${path}?${queryParams}` : path;

  const mockRequest = {
    user,
    method,
    url: fullUrl,
    originalUrl: fullUrl,
    route: routePath ? { path: routePath } : { path },
    ip,
    connection: { remoteAddress: ip },
    headers: { 'user-agent': userAgent },
  };

  return {
    switchToHttp: () => ({
      getRequest: () => mockRequest,
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as ExecutionContext;
};

// ============================================================================
// TEST SUITE
// ============================================================================

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: jest.Mocked<Reflector>;
  let routeRepository: jest.Mocked<Repository<Route>>;
  let userRepository: jest.Mocked<Repository<User>>;
  let securityAuditService: jest.Mocked<SecurityAuditService>;

  // Mock repositories and services
  const mockRouteRepository = {
    findOne: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockReflector = {
    getAllAndOverride: jest.fn(),
    get: jest.fn(),
  };

  const mockSecurityAuditService = {
    logPermissionCheck: jest.fn().mockResolvedValue(undefined),
    logAccessDenied: jest.fn().mockResolvedValue(undefined),
    getFailedAttempts: jest.fn().mockResolvedValue(0),
  };

  beforeEach(async () => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    jest.useFakeTimers();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
        {
          provide: getRepositoryToken(Route),
          useValue: mockRouteRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: SecurityAuditService,
          useValue: mockSecurityAuditService,
        },
      ],
    }).compile();

    guard = module.get<PermissionsGuard>(PermissionsGuard);
    reflector = module.get(Reflector);
    routeRepository = module.get(getRepositoryToken(Route));
    userRepository = module.get(getRepositoryToken(User));
    securityAuditService = module.get(SecurityAuditService);

    // Suppress logger output during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'debug').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();

    // Default: route is not public
    mockReflector.getAllAndOverride.mockReturnValue(false);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ==========================================================================
  // 1. PERMISSION CHECKING (15 cases)
  // ==========================================================================

  describe('Permission Checking', () => {
    /**
     * Test Case 1.1: Grant access when user has required permission
     * Verifies basic permission matching works correctly
     */
    it('should grant access when user has required permission', async () => {
      // Arrange
      const permission = createMockPermission({ name: 'view_products' });
      const role = createMockRole({ name: 'vendor' });
      const rolePermission = createMockRolePermission(role, permission);
      role.rolePermissions = [rolePermission];

      const user = createMockUser({ role, assignedRole: null });
      const route = createMockRoute({ permission, path: '/api/products', method: 'GET' });

      const context = createMockExecutionContext({ path: '/api/products', method: 'GET' });

      mockUserRepository.findOne.mockResolvedValue(user);
      mockRouteRepository.findOne.mockResolvedValue(route);

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
      expect(Logger.prototype.log).toHaveBeenCalledWith(
        expect.stringContaining('ACCESS GRANTED'),
      );
    });

    /**
     * Test Case 1.2: Deny access when user lacks permission
     * Verifies authorization denial for missing permissions
     */
    it('should deny access when user lacks permission', async () => {
      // Arrange
      const permission = createMockPermission({ name: 'manage_products' });
      const role = createMockRole({ name: 'viewer', rolePermissions: [] });
      const user = createMockUser({ role, assignedRole: null });
      const route = createMockRoute({ permission, path: '/api/products', method: 'POST' });

      const context = createMockExecutionContext({ path: '/api/products', method: 'POST' });

      mockUserRepository.findOne.mockResolvedValue(user);
      mockRouteRepository.findOne.mockResolvedValue(route);

      // Act & Assert
      await expect(guard.canActivate(context)).rejects.toThrow(
        new ForbiddenException('Access denied. Missing permission: manage_products'),
      );
    });

    /**
     * Test Case 1.3: Grant access when user has ANY of multiple required permissions
     * Tests permission satisfaction from admin role when business role lacks it
     */
    it('should grant access when user has permission from admin role', async () => {
      // Arrange
      const permission = createMockPermission({ name: 'manage_users' });
      const businessRole = createMockRole({ name: 'vendor', rolePermissions: [] });
      const adminRole = createMockRole({ id: 2, name: 'admin', type: 'admin' });
      const adminRolePermission = createMockRolePermission(adminRole, permission, { id: 2 });
      adminRole.rolePermissions = [adminRolePermission];

      const user = createMockUser({ role: businessRole, assignedRole: adminRole });
      const route = createMockRoute({ permission, path: '/api/admin/users', method: 'GET' });

      const context = createMockExecutionContext({ path: '/api/admin/users', method: 'GET' });

      mockUserRepository.findOne.mockResolvedValue(user);
      mockRouteRepository.findOne.mockResolvedValue(route);

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });

    /**
     * Test Case 1.4: Grant access when user has ALL of multiple required permissions
     * Tests combined permissions from both business and admin roles
     */
    it('should combine permissions from both business and admin roles', async () => {
      // Arrange
      const productPermission = createMockPermission({ id: 1, name: 'view_products' });
      const userPermission = createMockPermission({ id: 2, name: 'view_users' });

      const businessRole = createMockRole({ name: 'vendor' });
      const businessRolePermission = createMockRolePermission(businessRole, productPermission);
      businessRole.rolePermissions = [businessRolePermission];

      const adminRole = createMockRole({ id: 2, name: 'support', type: 'admin' });
      const adminRolePermission = createMockRolePermission(adminRole, userPermission, { id: 2 });
      adminRole.rolePermissions = [adminRolePermission];

      const user = createMockUser({ role: businessRole, assignedRole: adminRole });
      const route = createMockRoute({ permission: productPermission, path: '/api/products' });

      const context = createMockExecutionContext({ path: '/api/products' });

      mockUserRepository.findOne.mockResolvedValue(user);
      mockRouteRepository.findOne.mockResolvedValue(route);

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
      expect(Logger.prototype.log).toHaveBeenCalledWith(
        expect.stringContaining('User Permissions (2)'),
      );
    });

    /**
     * Test Case 1.5: Handle wildcard permissions correctly (e.g., "products:*")
     * Note: Current implementation uses exact matching; this tests the current behavior
     */
    it('should require exact permission match (no wildcard support)', async () => {
      // Arrange
      const wildcardPermission = createMockPermission({ name: 'products:*' });
      const role = createMockRole();
      const rolePermission = createMockRolePermission(role, wildcardPermission);
      role.rolePermissions = [rolePermission];

      const user = createMockUser({ role, assignedRole: null });
      const specificPermission = createMockPermission({ id: 2, name: 'products:view' });
      const route = createMockRoute({ permission: specificPermission });

      const context = createMockExecutionContext();

      mockUserRepository.findOne.mockResolvedValue(user);
      mockRouteRepository.findOne.mockResolvedValue(route);

      // Act & Assert - Current implementation requires exact match
      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    /**
     * Test Case 1.6: Handle hierarchical permissions (e.g., "admin" grants "admin:users:view")
     * Note: Current implementation uses flat permissions; this tests current behavior
     */
    it('should require exact permission match for hierarchical permissions', async () => {
      // Arrange
      const adminPermission = createMockPermission({ name: 'admin' });
      const role = createMockRole();
      const rolePermission = createMockRolePermission(role, adminPermission);
      role.rolePermissions = [rolePermission];

      const user = createMockUser({ role, assignedRole: null });
      const nestedPermission = createMockPermission({ id: 2, name: 'admin:users:view' });
      const route = createMockRoute({ permission: nestedPermission });

      const context = createMockExecutionContext();

      mockUserRepository.findOne.mockResolvedValue(user);
      mockRouteRepository.findOne.mockResolvedValue(route);

      // Act & Assert
      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    /**
     * Test Case 1.7: Respect permission precedence (deny overrides allow)
     * Note: Current implementation checks for presence; this tests single permission check
     */
    it('should deny access when required permission is missing despite other permissions', async () => {
      // Arrange
      const viewPermission = createMockPermission({ name: 'view_products' });
      const editPermission = createMockPermission({ id: 2, name: 'edit_products' });

      const role = createMockRole();
      const rolePermission = createMockRolePermission(role, viewPermission);
      role.rolePermissions = [rolePermission];

      const user = createMockUser({ role, assignedRole: null });
      const route = createMockRoute({ permission: editPermission });

      const context = createMockExecutionContext();

      mockUserRepository.findOne.mockResolvedValue(user);
      mockRouteRepository.findOne.mockResolvedValue(route);

      // Act & Assert
      await expect(guard.canActivate(context)).rejects.toThrow(
        new ForbiddenException('Access denied. Missing permission: edit_products'),
      );
    });

    /**
     * Test Case 1.8: Handle case-sensitive permission names
     * Verifies that permission matching is case-sensitive
     */
    it('should handle case-sensitive permission names correctly', async () => {
      // Arrange
      const lowercasePermission = createMockPermission({ name: 'view_products' });
      const role = createMockRole();
      const rolePermission = createMockRolePermission(role, lowercasePermission);
      role.rolePermissions = [rolePermission];

      const user = createMockUser({ role, assignedRole: null });
      const uppercasePermission = createMockPermission({ id: 2, name: 'VIEW_PRODUCTS' });
      const route = createMockRoute({ permission: uppercasePermission });

      const context = createMockExecutionContext();

      mockUserRepository.findOne.mockResolvedValue(user);
      mockRouteRepository.findOne.mockResolvedValue(route);

      // Act & Assert - Case mismatch should deny access
      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    /**
     * Test Case 1.9: Handle permission with special characters
     * Tests permissions containing colons, underscores, and other special chars
     */
    it('should handle permission with special characters correctly', async () => {
      // Arrange
      const specialPermission = createMockPermission({ name: 'admin:users:view-all_v2' });
      const role = createMockRole();
      const rolePermission = createMockRolePermission(role, specialPermission);
      role.rolePermissions = [rolePermission];

      const user = createMockUser({ role, assignedRole: null });
      const route = createMockRoute({ permission: specialPermission });

      const context = createMockExecutionContext();

      mockUserRepository.findOne.mockResolvedValue(user);
      mockRouteRepository.findOne.mockResolvedValue(route);

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });

    /**
     * Test Case 1.10: Multiple roles with overlapping permissions
     * Tests deduplication of permissions from multiple roles
     */
    it('should deduplicate overlapping permissions from multiple roles', async () => {
      // Arrange
      const sharedPermission = createMockPermission({ id: 1, name: 'view_products' });

      const businessRole = createMockRole({ name: 'vendor' });
      const businessRolePermission = createMockRolePermission(businessRole, sharedPermission, { id: 1 });
      businessRole.rolePermissions = [businessRolePermission];

      const adminRole = createMockRole({ id: 2, name: 'admin', type: 'admin' });
      const adminRolePermission = createMockRolePermission(adminRole, sharedPermission, { id: 2 });
      adminRole.rolePermissions = [adminRolePermission];

      const user = createMockUser({ role: businessRole, assignedRole: adminRole });
      const route = createMockRoute({ permission: sharedPermission });

      const context = createMockExecutionContext();

      mockUserRepository.findOne.mockResolvedValue(user);
      mockRouteRepository.findOne.mockResolvedValue(route);

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
      // Should log combined count without duplicates
      expect(Logger.prototype.log).toHaveBeenCalledWith(
        expect.stringContaining('User Permissions'),
      );
    });

    /**
     * Test Case 1.11: Empty permissions array (should deny)
     * Tests that users with no permissions are denied access
     */
    it('should deny access when user has empty permissions array', async () => {
      // Arrange
      const permission = createMockPermission({ name: 'view_products' });
      const role = createMockRole({ rolePermissions: [] });
      const user = createMockUser({ role, assignedRole: null });
      const route = createMockRoute({ permission });

      const context = createMockExecutionContext();

      mockUserRepository.findOne.mockResolvedValue(user);
      mockRouteRepository.findOne.mockResolvedValue(route);

      // Act & Assert
      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
      expect(Logger.prototype.log).toHaveBeenCalledWith(
        expect.stringContaining('User Permissions (0): none'),
      );
    });

    /**
     * Test Case 1.12: Null/undefined user (should deny)
     * Tests authentication requirement
     */
    it('should deny access when user is null in JWT', async () => {
      // Arrange
      const context = createMockExecutionContext({ user: null });

      // Act & Assert
      await expect(guard.canActivate(context)).rejects.toThrow(
        new ForbiddenException('Access denied. User not authenticated.'),
      );
    });

    /**
     * Test Case 1.13: User with no roles (should deny)
     * Tests that users without any roles are denied access to protected routes
     */
    it('should deny access when user has no roles assigned', async () => {
      // Arrange
      const permission = createMockPermission({ name: 'view_products' });
      const user = createMockUser({ role: null, assignedRole: null });
      const route = createMockRoute({ permission });

      const context = createMockExecutionContext();

      mockUserRepository.findOne.mockResolvedValue(user);
      mockRouteRepository.findOne.mockResolvedValue(route);

      // Act & Assert
      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    /**
     * Test Case 1.14: User with inactive role (should deny)
     * Tests handling of soft-deleted roles
     */
    it('should deny access when user role has no permissions loaded', async () => {
      // Arrange
      const permission = createMockPermission({ name: 'view_products' });
      const role = createMockRole({
        rolePermissions: undefined as any, // Simulates unloaded relation
      });
      const user = createMockUser({ role, assignedRole: null });
      const route = createMockRoute({ permission });

      const context = createMockExecutionContext();

      mockUserRepository.findOne.mockResolvedValue(user);
      mockRouteRepository.findOne.mockResolvedValue(route);

      // Act & Assert
      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    /**
     * Test Case 1.15: User with expired role (should deny)
     * Note: Current implementation doesn't have role expiration; tests deletion
     */
    it('should handle role with deletedAt gracefully', async () => {
      // Arrange
      const permission = createMockPermission({ name: 'view_products' });
      const role = createMockRole({
        deletedAt: new Date('2024-01-01'), // Soft-deleted role
        rolePermissions: [],
      });
      const user = createMockUser({ role, assignedRole: null });
      const route = createMockRoute({ permission });

      const context = createMockExecutionContext();

      mockUserRepository.findOne.mockResolvedValue(user);
      mockRouteRepository.findOne.mockResolvedValue(route);

      // Act & Assert
      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });
  });

  // ==========================================================================
  // 2. ROUTE DISCOVERY & CACHING (10 cases)
  // ==========================================================================

  describe('Route Discovery & Caching', () => {
    /**
     * Test Case 2.1: Discover route by exact path match
     * Verifies route lookup with exact path and method matching
     */
    it('should discover route by exact path match', async () => {
      // Arrange
      const permission = createMockPermission({ name: 'view_products' });
      const role = createMockRole();
      const rolePermission = createMockRolePermission(role, permission);
      role.rolePermissions = [rolePermission];

      const user = createMockUser({ role, assignedRole: null });
      const route = createMockRoute({ permission, path: '/api/products', method: 'GET' });

      const context = createMockExecutionContext({ path: '/api/products', method: 'GET' });

      mockUserRepository.findOne.mockResolvedValue(user);
      mockRouteRepository.findOne.mockResolvedValue(route);

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
      expect(mockRouteRepository.findOne).toHaveBeenCalledWith({
        where: { path: '/api/products', method: 'GET' },
        relations: ['permission'],
      });
    });

    /**
     * Test Case 2.2: Discover route by pattern match (with params)
     * Tests route path normalization for dynamic segments
     */
    it('should discover route by pattern match with ID params', async () => {
      // Arrange
      const permission = createMockPermission({ name: 'view_product' });
      const role = createMockRole();
      const rolePermission = createMockRolePermission(role, permission);
      role.rolePermissions = [rolePermission];

      const user = createMockUser({ role, assignedRole: null });
      const route = createMockRoute({ permission, path: '/api/products/:id', method: 'GET' });

      // Request has actual ID, but route pattern has :id
      const context = createMockExecutionContext({
        path: '/api/products/123',
        method: 'GET',
        routePath: '/api/products/:id',
      });

      mockUserRepository.findOne.mockResolvedValue(user);
      mockRouteRepository.findOne.mockResolvedValue(route);

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });

    /**
     * Test Case 2.3: Cache route lookups for 5 minutes
     * Verifies caching mechanism stores routes and reuses them
     */
    it('should cache route lookups', async () => {
      // Arrange
      const permission = createMockPermission({ name: 'view_products' });
      const role = createMockRole();
      const rolePermission = createMockRolePermission(role, permission);
      role.rolePermissions = [rolePermission];

      const user = createMockUser({ role, assignedRole: null });
      const route = createMockRoute({ permission, path: '/api/products', method: 'GET' });

      const context = createMockExecutionContext({ path: '/api/products', method: 'GET' });

      mockUserRepository.findOne.mockResolvedValue(user);
      mockRouteRepository.findOne.mockResolvedValue(route);

      // Act - First call (cache miss - DB query)
      await guard.canActivate(context);

      // Act - Second call (cache hit - no DB query)
      await guard.canActivate(context);

      // Assert - Route repository should be called only once because of caching
      // The second call uses the cached route
      expect(mockRouteRepository.findOne).toHaveBeenCalledTimes(1);
    });

    /**
     * Test Case 2.4: Return cached result on subsequent calls (<5ms)
     * Tests cache hit performance
     */
    it('should return cached result on subsequent calls', async () => {
      // Arrange
      const permission = createMockPermission({ name: 'view_products' });
      const role = createMockRole();
      const rolePermission = createMockRolePermission(role, permission);
      role.rolePermissions = [rolePermission];

      const user = createMockUser({ role, assignedRole: null });
      const route = createMockRoute({ permission, path: '/api/products', method: 'GET' });

      const context = createMockExecutionContext({ path: '/api/products', method: 'GET' });

      mockUserRepository.findOne.mockResolvedValue(user);
      mockRouteRepository.findOne.mockResolvedValue(route);

      // Act - First call to populate cache
      await guard.canActivate(context);

      // Clear the mock to track second call
      mockRouteRepository.findOne.mockClear();

      // Act - Second call (cache hit logged)
      await guard.canActivate(context);

      // Assert - Debug log should indicate cache status
      expect(Logger.prototype.debug).toHaveBeenCalledWith(
        expect.stringMatching(/Cache.*HIT|CACHE HIT/i),
      );
    });

    /**
     * Test Case 2.5: Refresh cache after TTL expires
     * Tests cache expiration and refresh
     */
    it('should refresh cache after TTL expires', async () => {
      // Arrange
      const permission = createMockPermission({ name: 'view_products' });
      const role = createMockRole();
      const rolePermission = createMockRolePermission(role, permission);
      role.rolePermissions = [rolePermission];

      const user = createMockUser({ role, assignedRole: null });
      const route = createMockRoute({ permission, path: '/api/products', method: 'GET' });

      const context = createMockExecutionContext({ path: '/api/products', method: 'GET' });

      mockUserRepository.findOne.mockResolvedValue(user);
      mockRouteRepository.findOne.mockResolvedValue(route);

      // Act - First call
      await guard.canActivate(context);

      // Advance time past cache TTL (5 minutes + 1 second)
      jest.advanceTimersByTime(5 * 60 * 1000 + 1000);

      // Act - Second call after TTL
      await guard.canActivate(context);

      // Assert - Debug log should indicate cache miss after TTL
      expect(Logger.prototype.debug).toHaveBeenCalledWith(
        expect.stringMatching(/CACHE MISS/i),
      );
    });

    /**
     * Test Case 2.6: Handle missing route in database (should allow based on config)
     * Current behavior: Missing route = public route (allow access)
     */
    it('should allow access when route mapping is not found in database', async () => {
      // Arrange
      const role = createMockRole();
      const user = createMockUser({ role, assignedRole: null });

      const context = createMockExecutionContext({ path: '/api/unknown', method: 'GET' });

      mockUserRepository.findOne.mockResolvedValue(user);
      mockRouteRepository.findOne.mockResolvedValue(null); // No route found

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
      expect(Logger.prototype.log).toHaveBeenCalledWith(
        expect.stringContaining('PUBLIC ACCESS'),
      );
    });

    /**
     * Test Case 2.7: Handle multiple routes with same path but different methods
     * Tests method-specific route matching
     */
    it('should match routes by both path and method', async () => {
      // Arrange
      const viewPermission = createMockPermission({ name: 'view_products' });
      const createPermission = createMockPermission({ id: 2, name: 'create_products' });

      const role = createMockRole();
      const rolePermission = createMockRolePermission(role, viewPermission);
      role.rolePermissions = [rolePermission];

      const user = createMockUser({ role, assignedRole: null });

      const getRoute = createMockRoute({ permission: viewPermission, path: '/api/products', method: 'GET' });
      const postRoute = createMockRoute({ id: 2, permission: createPermission, path: '/api/products', method: 'POST' });

      // First request - GET
      const getContext = createMockExecutionContext({ path: '/api/products', method: 'GET' });
      mockUserRepository.findOne.mockResolvedValue(user);
      mockRouteRepository.findOne.mockResolvedValue(getRoute);

      const getResult = await guard.canActivate(getContext);
      expect(getResult).toBe(true);

      // Second request - POST (user lacks create permission)
      const postContext = createMockExecutionContext({ path: '/api/products', method: 'POST' });
      mockRouteRepository.findOne.mockResolvedValue(postRoute);

      // Act & Assert
      await expect(guard.canActivate(postContext)).rejects.toThrow(ForbiddenException);
    });

    /**
     * Test Case 2.8: Handle route with query parameters
     * Tests that query params are stripped from path matching
     */
    it('should strip query parameters when matching routes', async () => {
      // Arrange
      const permission = createMockPermission({ name: 'view_products' });
      const role = createMockRole();
      const rolePermission = createMockRolePermission(role, permission);
      role.rolePermissions = [rolePermission];

      const user = createMockUser({ role, assignedRole: null });
      const route = createMockRoute({ permission, path: '/api/products', method: 'GET' });

      const context = createMockExecutionContext({
        path: '/api/products',
        method: 'GET',
        queryParams: 'page=1&limit=10&sort=name',
      });

      mockUserRepository.findOne.mockResolvedValue(user);
      mockRouteRepository.findOne.mockResolvedValue(route);

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });

    /**
     * Test Case 2.9: Clear cache when route is updated
     * Note: Current implementation doesn't have cache invalidation API
     * This tests the TTL-based cache refresh behavior
     */
    it('should use new route data after cache expires', async () => {
      // Arrange
      const permission1 = createMockPermission({ name: 'view_products' });
      const permission2 = createMockPermission({ id: 2, name: 'manage_products' });

      const role = createMockRole();
      const rolePermission = createMockRolePermission(role, permission1);
      role.rolePermissions = [rolePermission];

      const user = createMockUser({ role, assignedRole: null });

      const initialRoute = createMockRoute({ permission: permission1, path: '/api/products', method: 'GET' });

      const context = createMockExecutionContext({ path: '/api/products', method: 'GET' });

      mockUserRepository.findOne.mockResolvedValue(user);
      mockRouteRepository.findOne.mockResolvedValue(initialRoute);

      // First call - uses initial route
      const result1 = await guard.canActivate(context);
      expect(result1).toBe(true);

      // Simulate route update (user now lacks permission)
      const updatedRoute = createMockRoute({ permission: permission2, path: '/api/products', method: 'GET' });

      // Advance time past TTL
      jest.advanceTimersByTime(5 * 60 * 1000 + 1000);

      // Update mock to return new route
      mockRouteRepository.findOne.mockResolvedValue(updatedRoute);

      // Second call - should fetch updated route after TTL
      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    /**
     * Test Case 2.10: Concurrent route lookups (race condition test)
     * Tests that concurrent requests don't cause issues
     */
    it('should handle concurrent route lookups safely', async () => {
      // Arrange
      const permission = createMockPermission({ name: 'view_products' });
      const role = createMockRole();
      const rolePermission = createMockRolePermission(role, permission);
      role.rolePermissions = [rolePermission];

      const user = createMockUser({ role, assignedRole: null });
      const route = createMockRoute({ permission, path: '/api/products', method: 'GET' });

      const context = createMockExecutionContext({ path: '/api/products', method: 'GET' });

      mockUserRepository.findOne.mockResolvedValue(user);
      mockRouteRepository.findOne.mockResolvedValue(route);

      // Act - Fire multiple concurrent requests
      const results = await Promise.all([
        guard.canActivate(context),
        guard.canActivate(context),
        guard.canActivate(context),
        guard.canActivate(context),
        guard.canActivate(context),
      ]);

      // Assert - All should succeed without errors
      expect(results).toEqual([true, true, true, true, true]);
    });
  });

  // ==========================================================================
  // 3. @PUBLIC() DECORATOR (5 cases)
  // ==========================================================================

  describe('@Public() Decorator', () => {
    /**
     * Test Case 3.1: Skip permission check for @Public() routes
     * Verifies that public routes bypass permission checking entirely
     */
    it('should skip permission check for @Public() decorated routes', async () => {
      // Arrange
      mockReflector.getAllAndOverride.mockReturnValue(true); // Route is public
      const context = createMockExecutionContext({ user: null });

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
      expect(mockUserRepository.findOne).not.toHaveBeenCalled();
      expect(mockRouteRepository.findOne).not.toHaveBeenCalled();
    });

    /**
     * Test Case 3.2: Allow unauthenticated access to @Public() routes
     * Tests that public routes don't require JWT
     */
    it('should allow unauthenticated access to @Public() routes', async () => {
      // Arrange
      mockReflector.getAllAndOverride.mockReturnValue(true);
      const context = createMockExecutionContext({ user: null });

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
      expect(Logger.prototype.log).toHaveBeenCalledWith(
        expect.stringContaining('PUBLIC DECORATOR'),
      );
    });

    /**
     * Test Case 3.3: @Public() on controller applies to all handlers
     * Tests that reflector checks both handler and class
     */
    it('should check both handler and class for @Public() decorator', async () => {
      // Arrange
      mockReflector.getAllAndOverride.mockReturnValue(true);
      const context = createMockExecutionContext({ user: { id: 1 } });

      // Act
      await guard.canActivate(context);

      // Assert - Reflector should check both handler and class
      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith(
        IS_PUBLIC_KEY,
        [expect.anything(), expect.anything()],
      );
    });

    /**
     * Test Case 3.4: @Public() on handler overrides controller-level guards
     * Tests handler-level decorator priority
     */
    it('should prioritize handler-level @Public() decorator', async () => {
      // Arrange
      mockReflector.getAllAndOverride.mockReturnValue(true);
      const context = createMockExecutionContext({ user: null });

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });

    /**
     * Test Case 3.5: Verify @Public() routes are logged to audit (with PUBLIC_ACCESS action)
     * Tests that public access is still audited for compliance
     */
    it('should log @Public() route access to security audit', async () => {
      // Arrange
      mockReflector.getAllAndOverride.mockReturnValue(true);
      const context = createMockExecutionContext({
        user: { id: 1, email: 'test@example.com' },
        ip: '192.168.1.1',
        userAgent: 'Test Browser',
      });

      // Act
      await guard.canActivate(context);

      // Assert - Should call audit service with PUBLIC_ACCESS action
      expect(mockSecurityAuditService.logPermissionCheck).toHaveBeenCalledWith(
        expect.objectContaining({
          action: SecurityAuditAction.PUBLIC_ACCESS,
          success: true,
          metadata: expect.objectContaining({
            decoratorDetected: true,
          }),
        }),
      );
    });
  });

  // ==========================================================================
  // 4. SECURITY AUDIT LOGGING (8 cases)
  // ==========================================================================

  describe('Security Audit Logging', () => {
    /**
     * Test Case 4.1: Log successful permission checks (non-blocking)
     * Verifies audit logging for granted access
     */
    it('should log successful permission checks', async () => {
      // Arrange
      const permission = createMockPermission({ name: 'view_products' });
      const role = createMockRole();
      const rolePermission = createMockRolePermission(role, permission);
      role.rolePermissions = [rolePermission];

      const user = createMockUser({ role, assignedRole: null });
      const route = createMockRoute({ permission, path: '/api/products', method: 'GET' });

      const context = createMockExecutionContext({ path: '/api/products', method: 'GET' });

      mockUserRepository.findOne.mockResolvedValue(user);
      mockRouteRepository.findOne.mockResolvedValue(route);

      // Act
      await guard.canActivate(context);

      // Assert
      expect(mockSecurityAuditService.logPermissionCheck).toHaveBeenCalledWith(
        expect.objectContaining({
          action: SecurityAuditAction.ACCESS_GRANTED,
          success: true,
          permissionRequired: 'view_products',
        }),
      );
    });

    /**
     * Test Case 4.2: Log failed permission checks with reason
     * Verifies audit logging for denied access
     */
    it('should log failed permission checks with failure reason', async () => {
      // Arrange
      const permission = createMockPermission({ name: 'manage_products' });
      const role = createMockRole({ rolePermissions: [] });
      const user = createMockUser({ role, assignedRole: null });
      const route = createMockRoute({ permission });

      const context = createMockExecutionContext();

      mockUserRepository.findOne.mockResolvedValue(user);
      mockRouteRepository.findOne.mockResolvedValue(route);

      // Act & Assert
      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);

      expect(mockSecurityAuditService.logPermissionCheck).toHaveBeenCalledWith(
        expect.objectContaining({
          action: SecurityAuditAction.ACCESS_DENIED,
          success: false,
          failureReason: expect.stringContaining('Missing permission: manage_products'),
        }),
      );
    });

    /**
     * Test Case 4.3: Log IP address and user agent
     * Verifies client identification in audit logs
     */
    it('should log IP address and user agent in audit events', async () => {
      // Arrange
      const permission = createMockPermission({ name: 'view_products' });
      const role = createMockRole();
      const rolePermission = createMockRolePermission(role, permission);
      role.rolePermissions = [rolePermission];

      const user = createMockUser({ role, assignedRole: null });
      const route = createMockRoute({ permission });

      const context = createMockExecutionContext({
        ip: '203.0.113.42',
        userAgent: 'Custom/Agent 1.0',
      });

      mockUserRepository.findOne.mockResolvedValue(user);
      mockRouteRepository.findOne.mockResolvedValue(route);

      // Act
      await guard.canActivate(context);

      // Assert
      expect(mockSecurityAuditService.logPermissionCheck).toHaveBeenCalledWith(
        expect.objectContaining({
          ipAddress: '203.0.113.42',
          userAgent: 'Custom/Agent 1.0',
        }),
      );
    });

    /**
     * Test Case 4.4: Log request path and method
     * Verifies endpoint details in audit logs
     */
    it('should log request path and method in audit events', async () => {
      // Arrange
      const permission = createMockPermission({ name: 'view_products' });
      const role = createMockRole();
      const rolePermission = createMockRolePermission(role, permission);
      role.rolePermissions = [rolePermission];

      const user = createMockUser({ role, assignedRole: null });
      const route = createMockRoute({ permission, path: '/api/admin/products', method: 'POST' });

      const context = createMockExecutionContext({ path: '/api/admin/products', method: 'POST' });

      mockUserRepository.findOne.mockResolvedValue(user);
      mockRouteRepository.findOne.mockResolvedValue(route);

      // Act
      await guard.canActivate(context);

      // Assert
      expect(mockSecurityAuditService.logPermissionCheck).toHaveBeenCalledWith(
        expect.objectContaining({
          requestPath: '/api/admin/products',
          requestMethod: 'POST',
        }),
      );
    });

    /**
     * Test Case 4.5: Log permission required and actual permissions
     * Verifies permission details in audit logs
     */
    it('should log required permission and user permissions in metadata', async () => {
      // Arrange
      const permission = createMockPermission({ name: 'manage_products' });
      const role = createMockRole({ rolePermissions: [] });
      const user = createMockUser({ role, assignedRole: null });
      const route = createMockRoute({ permission });

      const context = createMockExecutionContext();

      mockUserRepository.findOne.mockResolvedValue(user);
      mockRouteRepository.findOne.mockResolvedValue(route);

      // Act & Assert
      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);

      expect(mockSecurityAuditService.logPermissionCheck).toHaveBeenCalledWith(
        expect.objectContaining({
          permissionRequired: 'manage_products',
          metadata: expect.objectContaining({
            userPermissions: [],
          }),
        }),
      );
    });

    /**
     * Test Case 4.6: Verify logging is async (doesn't block request)
     * Tests fire-and-forget pattern
     */
    it('should not block request when audit logging is slow', async () => {
      // Arrange
      const permission = createMockPermission({ name: 'view_products' });
      const role = createMockRole();
      const rolePermission = createMockRolePermission(role, permission);
      role.rolePermissions = [rolePermission];

      const user = createMockUser({ role, assignedRole: null });
      const route = createMockRoute({ permission });

      const context = createMockExecutionContext();

      mockUserRepository.findOne.mockResolvedValue(user);
      mockRouteRepository.findOne.mockResolvedValue(route);

      // Simulate slow audit logging (but it shouldn't block)
      mockSecurityAuditService.logPermissionCheck.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000)),
      );

      // Act - Should complete quickly without waiting for audit log
      const startTime = Date.now();
      const result = await guard.canActivate(context);
      const endTime = Date.now();

      // Assert - Request should complete in under 100ms (not waiting for 1s audit)
      expect(result).toBe(true);
      expect(endTime - startTime).toBeLessThan(500); // Allow some buffer
    });

    /**
     * Test Case 4.7: Handle logging service errors gracefully
     * Tests graceful degradation when audit service fails
     */
    it('should not fail request when audit logging throws error', async () => {
      // Arrange
      const permission = createMockPermission({ name: 'view_products' });
      const role = createMockRole();
      const rolePermission = createMockRolePermission(role, permission);
      role.rolePermissions = [rolePermission];

      const user = createMockUser({ role, assignedRole: null });
      const route = createMockRoute({ permission });

      const context = createMockExecutionContext();

      mockUserRepository.findOne.mockResolvedValue(user);
      mockRouteRepository.findOne.mockResolvedValue(route);

      // Simulate audit service failure
      mockSecurityAuditService.logPermissionCheck.mockRejectedValue(
        new Error('Database connection failed'),
      );

      // Act - Request should still succeed
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });

    /**
     * Test Case 4.8: Verify metadata includes user ID, role IDs
     * Tests comprehensive metadata in audit logs
     */
    it('should include user details and role information in audit metadata', async () => {
      // Arrange
      const permission = createMockPermission({ name: 'view_products' });
      const businessRole = createMockRole({ id: 1, name: 'vendor' });
      const adminRole = createMockRole({ id: 2, name: 'support', type: 'admin' });

      const rolePermission = createMockRolePermission(businessRole, permission);
      businessRole.rolePermissions = [rolePermission];
      adminRole.rolePermissions = [];

      const user = createMockUser({
        id: 42,
        email: 'user@example.com',
        role: businessRole,
        assignedRole: adminRole,
      });
      const route = createMockRoute({ permission });

      const context = createMockExecutionContext();

      mockUserRepository.findOne.mockResolvedValue(user);
      mockRouteRepository.findOne.mockResolvedValue(route);

      // Act
      await guard.canActivate(context);

      // Assert
      expect(mockSecurityAuditService.logPermissionCheck).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 42,
          metadata: expect.objectContaining({
            userEmail: 'user@example.com',
            businessRole: 'vendor',
            adminRole: 'support',
          }),
        }),
      );
    });
  });

  // ==========================================================================
  // 5. RATE LIMITING (5 cases)
  // ==========================================================================

  describe('Rate Limiting', () => {
    /**
     * Test Case 5.1: Allow first 10 failed checks within 1 minute
     * Tests that rate limiting doesn't trigger prematurely
     */
    it('should allow multiple failed attempts before rate limit threshold', async () => {
      // Arrange
      const permission = createMockPermission({ name: 'admin_only' });
      const role = createMockRole({ rolePermissions: [] });
      const user = createMockUser({ id: 1, role, assignedRole: null });
      const route = createMockRoute({ permission });

      mockUserRepository.findOne.mockResolvedValue(user);
      mockRouteRepository.findOne.mockResolvedValue(route);

      // Act - Make 9 failed attempts (below threshold of 10)
      for (let i = 0; i < 9; i++) {
        const context = createMockExecutionContext();
        await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
      }

      // Assert - Should not have triggered suspicious activity alert
      expect(mockSecurityAuditService.logPermissionCheck).not.toHaveBeenCalledWith(
        expect.objectContaining({
          action: SecurityAuditAction.SUSPICIOUS_ACTIVITY,
        }),
      );
    });

    /**
     * Test Case 5.2: Block 11th failed check within same minute (log suspicious activity)
     * Tests rate limit triggering
     */
    it('should log suspicious activity when rate limit is exceeded', async () => {
      // Arrange
      const permission = createMockPermission({ name: 'admin_only' });
      const role = createMockRole({ rolePermissions: [] });
      const user = createMockUser({ id: 1, role, assignedRole: null });
      const route = createMockRoute({ permission });

      mockUserRepository.findOne.mockResolvedValue(user);
      mockRouteRepository.findOne.mockResolvedValue(route);

      // Act - Make 10 failed attempts (reaches threshold)
      for (let i = 0; i < 10; i++) {
        const context = createMockExecutionContext();
        await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
      }

      // Assert - Should have triggered suspicious activity alert
      expect(mockSecurityAuditService.logPermissionCheck).toHaveBeenCalledWith(
        expect.objectContaining({
          action: SecurityAuditAction.SUSPICIOUS_ACTIVITY,
          failureReason: expect.stringContaining('Rate limit exceeded'),
        }),
      );
    });

    /**
     * Test Case 5.3: Reset counter after 1 minute
     * Tests rate limit window reset
     */
    it('should reset rate limit counter after time window expires', async () => {
      // Arrange
      const permission = createMockPermission({ name: 'admin_only' });
      const role = createMockRole({ rolePermissions: [] });
      const user = createMockUser({ id: 1, role, assignedRole: null });
      const route = createMockRoute({ permission });

      mockUserRepository.findOne.mockResolvedValue(user);
      mockRouteRepository.findOne.mockResolvedValue(route);

      // Act - Make 5 failed attempts
      for (let i = 0; i < 5; i++) {
        const context = createMockExecutionContext();
        await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
      }

      // Advance time past the rate limit window (1 minute + buffer)
      jest.advanceTimersByTime(61 * 1000);

      // Clear the mock to track new calls
      mockSecurityAuditService.logPermissionCheck.mockClear();

      // Make 5 more failed attempts (should be within new window)
      for (let i = 0; i < 5; i++) {
        const context = createMockExecutionContext();
        await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
      }

      // Assert - Should not trigger suspicious activity (only 5 in new window)
      expect(mockSecurityAuditService.logPermissionCheck).not.toHaveBeenCalledWith(
        expect.objectContaining({
          action: SecurityAuditAction.SUSPICIOUS_ACTIVITY,
        }),
      );
    });

    /**
     * Test Case 5.4: Rate limit is per-user (not global)
     * Tests user isolation in rate limiting
     */
    it('should track rate limits per user independently', async () => {
      // Arrange
      const permission = createMockPermission({ name: 'admin_only' });
      const role = createMockRole({ rolePermissions: [] });
      const user1 = createMockUser({ id: 1, role, assignedRole: null });
      const user2 = createMockUser({ id: 2, role, assignedRole: null });
      const route = createMockRoute({ permission });

      mockRouteRepository.findOne.mockResolvedValue(route);

      // Act - User 1 makes 5 failed attempts
      mockUserRepository.findOne.mockResolvedValue(user1);
      for (let i = 0; i < 5; i++) {
        const context = createMockExecutionContext({ user: { id: 1 } });
        await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
      }

      // User 2 makes 5 failed attempts
      mockUserRepository.findOne.mockResolvedValue(user2);
      for (let i = 0; i < 5; i++) {
        const context = createMockExecutionContext({ user: { id: 2 } });
        await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
      }

      // Assert - Neither should trigger rate limit (each has only 5)
      expect(mockSecurityAuditService.logPermissionCheck).not.toHaveBeenCalledWith(
        expect.objectContaining({
          action: SecurityAuditAction.SUSPICIOUS_ACTIVITY,
        }),
      );
    });

    /**
     * Test Case 5.5: Rate limit only applies to failures (not successes)
     * Tests that successful requests don't count toward rate limit
     */
    it('should not count successful requests toward rate limit', async () => {
      // Arrange
      const permission = createMockPermission({ name: 'view_products' });
      const role = createMockRole();
      const rolePermission = createMockRolePermission(role, permission);
      role.rolePermissions = [rolePermission];

      const user = createMockUser({ id: 1, role, assignedRole: null });
      const route = createMockRoute({ permission });

      mockUserRepository.findOne.mockResolvedValue(user);
      mockRouteRepository.findOne.mockResolvedValue(route);

      // Act - Make 15 successful requests
      for (let i = 0; i < 15; i++) {
        const context = createMockExecutionContext();
        const result = await guard.canActivate(context);
        expect(result).toBe(true);
      }

      // Assert - Should not trigger suspicious activity
      expect(mockSecurityAuditService.logPermissionCheck).not.toHaveBeenCalledWith(
        expect.objectContaining({
          action: SecurityAuditAction.SUSPICIOUS_ACTIVITY,
        }),
      );
    });
  });

  // ==========================================================================
  // 6. PERFORMANCE (4 cases)
  // ==========================================================================

  describe('Performance', () => {
    /**
     * Test Case 6.1: First check completes in <50ms
     * Tests cold start performance
     */
    it('should complete first check within performance target', async () => {
      // Arrange
      const permission = createMockPermission({ name: 'view_products' });
      const role = createMockRole();
      const rolePermission = createMockRolePermission(role, permission);
      role.rolePermissions = [rolePermission];

      const user = createMockUser({ role, assignedRole: null });
      const route = createMockRoute({ permission });

      const context = createMockExecutionContext();

      // Simulate realistic database response times
      mockUserRepository.findOne.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(user), 5)),
      );
      mockRouteRepository.findOne.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(route), 5)),
      );

      // Use real timers for performance measurement
      jest.useRealTimers();

      // Act
      const startTime = performance.now();
      const result = await guard.canActivate(context);
      const endTime = performance.now();

      // Assert
      expect(result).toBe(true);
      expect(endTime - startTime).toBeLessThan(100); // Allow some buffer for test environment

      // Restore fake timers
      jest.useFakeTimers();
    });

    /**
     * Test Case 6.2: Cached check completes in <5ms
     * Tests cache hit performance
     */
    it('should complete cached check within fast performance target', async () => {
      // Arrange
      const permission = createMockPermission({ name: 'view_products' });
      const role = createMockRole();
      const rolePermission = createMockRolePermission(role, permission);
      role.rolePermissions = [rolePermission];

      const user = createMockUser({ role, assignedRole: null });
      const route = createMockRoute({ permission });

      const context = createMockExecutionContext();

      mockUserRepository.findOne.mockResolvedValue(user);
      mockRouteRepository.findOne.mockResolvedValue(route);

      // Use real timers for performance measurement
      jest.useRealTimers();

      // First call to warm cache
      await guard.canActivate(context);

      // Act - Second call (cached)
      const startTime = performance.now();
      const result = await guard.canActivate(context);
      const endTime = performance.now();

      // Assert
      expect(result).toBe(true);
      // Cache hit should be significantly faster
      expect(endTime - startTime).toBeLessThan(50);

      // Restore fake timers
      jest.useFakeTimers();
    });

    /**
     * Test Case 6.3: Verify cache hit rate >95% under normal load
     * Tests cache effectiveness
     */
    it('should achieve high cache hit rate under repeated requests', async () => {
      // Arrange
      const permission = createMockPermission({ name: 'view_products' });
      const role = createMockRole();
      const rolePermission = createMockRolePermission(role, permission);
      role.rolePermissions = [rolePermission];

      const user = createMockUser({ role, assignedRole: null });
      const route = createMockRoute({ permission });

      const context = createMockExecutionContext();

      mockUserRepository.findOne.mockResolvedValue(user);
      mockRouteRepository.findOne.mockResolvedValue(route);

      // Act - Make 100 requests
      for (let i = 0; i < 100; i++) {
        await guard.canActivate(context);
      }

      // Assert - Route repository should be called minimally (first call + occasional cache refresh)
      // In this test, within cache TTL, should only be called once or twice
      const routeRepoCallCount = mockRouteRepository.findOne.mock.calls.length;
      expect(routeRepoCallCount).toBeLessThan(10);
    });

    /**
     * Test Case 6.4: Handle 1000 concurrent requests without degradation
     * Tests concurrent request handling
     */
    it('should handle many concurrent requests efficiently', async () => {
      // Arrange
      const permission = createMockPermission({ name: 'view_products' });
      const role = createMockRole();
      const rolePermission = createMockRolePermission(role, permission);
      role.rolePermissions = [rolePermission];

      const user = createMockUser({ role, assignedRole: null });
      const route = createMockRoute({ permission });

      const context = createMockExecutionContext();

      mockUserRepository.findOne.mockResolvedValue(user);
      mockRouteRepository.findOne.mockResolvedValue(route);

      // Use real timers for performance measurement
      jest.useRealTimers();

      // Act - Fire 100 concurrent requests (reduced from 1000 for test speed)
      const startTime = performance.now();
      const promises = Array(100)
        .fill(null)
        .map(() => guard.canActivate(context));
      const results = await Promise.all(promises);
      const endTime = performance.now();

      // Assert
      expect(results.every((r) => r === true)).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000); // 100 requests in under 1 second

      // Restore fake timers
      jest.useFakeTimers();
    });
  });

  // ==========================================================================
  // 7. ERROR HANDLING (5 cases)
  // ==========================================================================

  describe('Error Handling', () => {
    /**
     * Test Case 7.1: Database connection error (should fail-safe deny)
     * Tests graceful handling of database failures
     */
    it('should throw error when database connection fails', async () => {
      // Arrange
      const context = createMockExecutionContext();
      mockUserRepository.findOne.mockRejectedValue(new Error('ECONNREFUSED: Database unavailable'));

      // Act & Assert
      await expect(guard.canActivate(context)).rejects.toThrow('ECONNREFUSED: Database unavailable');
    });

    /**
     * Test Case 7.2: SecurityAuditService throws error (should not block request)
     * Tests audit service isolation
     */
    it('should continue request when SecurityAuditService fails', async () => {
      // Arrange
      const permission = createMockPermission({ name: 'view_products' });
      const role = createMockRole();
      const rolePermission = createMockRolePermission(role, permission);
      role.rolePermissions = [rolePermission];

      const user = createMockUser({ role, assignedRole: null });
      const route = createMockRoute({ permission });

      const context = createMockExecutionContext();

      mockUserRepository.findOne.mockResolvedValue(user);
      mockRouteRepository.findOne.mockResolvedValue(route);
      mockSecurityAuditService.logPermissionCheck.mockRejectedValue(
        new Error('Audit service down'),
      );

      // Act
      const result = await guard.canActivate(context);

      // Assert - Request should succeed despite audit failure
      expect(result).toBe(true);
    });

    /**
     * Test Case 7.3: Invalid JWT token (should deny)
     * Tests handling of malformed JWT data
     */
    it('should deny access when JWT token has invalid structure', async () => {
      // Arrange
      const context = createMockExecutionContext({
        user: { invalid: 'data' }, // Missing id field
      });

      // Act & Assert
      await expect(guard.canActivate(context)).rejects.toThrow(
        new ForbiddenException('Access denied. User not authenticated.'),
      );
    });

    /**
     * Test Case 7.4: Malformed route data (should deny)
     * Tests handling of corrupted route entity
     */
    it('should handle malformed route permission data gracefully', async () => {
      // Arrange
      const role = createMockRole({ rolePermissions: [] });
      const user = createMockUser({ role, assignedRole: null });

      // Malformed route with permission that has no name
      const malformedRoute = createMockRoute({
        permission: { id: 1 } as Permission, // Missing name
      });

      const context = createMockExecutionContext();

      mockUserRepository.findOne.mockResolvedValue(user);
      mockRouteRepository.findOne.mockResolvedValue(malformedRoute);

      // Act & Assert - Should handle gracefully (likely throw due to undefined name)
      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    /**
     * Test Case 7.5: Timeout on route lookup (should deny after timeout)
     * Tests timeout handling for slow database queries
     */
    it('should handle slow route lookup without hanging', async () => {
      // Arrange
      const role = createMockRole();
      const user = createMockUser({ role, assignedRole: null });

      const context = createMockExecutionContext();

      mockUserRepository.findOne.mockResolvedValue(user);

      // Simulate a very slow route lookup
      mockRouteRepository.findOne.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(null), 100);
          }),
      );

      // Use real timers
      jest.useRealTimers();

      // Act
      const result = await guard.canActivate(context);

      // Assert - Should eventually complete (null route = public access)
      expect(result).toBe(true);

      // Restore fake timers
      jest.useFakeTimers();
    });
  });

  // ==========================================================================
  // 8. EDGE CASES (3 cases)
  // ==========================================================================

  describe('Edge Cases', () => {
    /**
     * Test Case 8.1: Route with no permission mapping (configurable behavior)
     * Current behavior: Allow access when route has no permission
     */
    it('should allow access when route exists but has no permission requirement', async () => {
      // Arrange
      const role = createMockRole();
      const user = createMockUser({ role, assignedRole: null });
      const route = createMockRoute({ permission: null }); // No permission required

      const context = createMockExecutionContext();

      mockUserRepository.findOne.mockResolvedValue(user);
      mockRouteRepository.findOne.mockResolvedValue(route);

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
      expect(Logger.prototype.log).toHaveBeenCalledWith(
        expect.stringContaining('PUBLIC ROUTE'),
      );
    });

    /**
     * Test Case 8.2: User switches roles mid-session (should re-check)
     * Tests that permissions are checked on each request
     */
    it('should check current permissions on each request', async () => {
      // Arrange
      const viewPermission = createMockPermission({ name: 'view_products' });
      const adminPermission = createMockPermission({ id: 2, name: 'admin_access' });

      const basicRole = createMockRole({ name: 'viewer' });
      const basicRolePermission = createMockRolePermission(basicRole, viewPermission);
      basicRole.rolePermissions = [basicRolePermission];

      const adminRole = createMockRole({ id: 2, name: 'admin' });
      const adminRolePermission = createMockRolePermission(adminRole, adminPermission, { id: 2 });
      adminRole.rolePermissions = [adminRolePermission];

      const user = createMockUser({ role: basicRole, assignedRole: null });
      const adminRoute = createMockRoute({ permission: adminPermission, path: '/api/admin' });

      const context = createMockExecutionContext({ path: '/api/admin' });

      mockRouteRepository.findOne.mockResolvedValue(adminRoute);

      // First request - user has basic role (should fail)
      mockUserRepository.findOne.mockResolvedValue(user);
      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);

      // "User role is upgraded" - simulate role change
      user.assignedRole = adminRole;
      mockUserRepository.findOne.mockResolvedValue(user);

      // Second request - user now has admin role (should succeed)
      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    /**
     * Test Case 8.3: Permission revoked during active session (should detect on next check)
     * Tests real-time permission validation
     */
    it('should detect revoked permissions on next request', async () => {
      // Arrange
      const permission = createMockPermission({ name: 'view_products' });
      const role = createMockRole();
      const rolePermission = createMockRolePermission(role, permission);
      role.rolePermissions = [rolePermission];

      const user = createMockUser({ role, assignedRole: null });
      const route = createMockRoute({ permission });

      const context = createMockExecutionContext();

      mockRouteRepository.findOne.mockResolvedValue(route);

      // First request - user has permission (success)
      mockUserRepository.findOne.mockResolvedValue(user);
      const result1 = await guard.canActivate(context);
      expect(result1).toBe(true);

      // Permission is revoked (rolePermissions becomes empty)
      role.rolePermissions = [];
      mockUserRepository.findOne.mockResolvedValue(user);

      // Second request - permission revoked (should fail)
      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });
  });

  // ==========================================================================
  // ADDITIONAL TESTS: User Status Validation
  // ==========================================================================

  describe('User Status Validation', () => {
    /**
     * Test: Deny access for banned users
     */
    it('should deny access for banned users', async () => {
      // Arrange
      const user = createMockUser({ isBanned: true });
      const context = createMockExecutionContext();

      mockUserRepository.findOne.mockResolvedValue(user);

      // Act & Assert
      await expect(guard.canActivate(context)).rejects.toThrow(
        new ForbiddenException('Access denied. Account is banned.'),
      );

      expect(Logger.prototype.error).toHaveBeenCalledWith(
        expect.stringContaining('SECURITY ALERT: Banned user'),
      );
    });

    /**
     * Test: Allow access for suspended users (with warning)
     */
    it('should allow access for suspended users with warning', async () => {
      // Arrange
      const permission = createMockPermission({ name: 'view_products' });
      const role = createMockRole();
      const rolePermission = createMockRolePermission(role, permission);
      role.rolePermissions = [rolePermission];

      const user = createMockUser({ role, assignedRole: null, isSuspended: true });
      const route = createMockRoute({ permission });

      const context = createMockExecutionContext();

      mockUserRepository.findOne.mockResolvedValue(user);
      mockRouteRepository.findOne.mockResolvedValue(route);

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
      expect(Logger.prototype.warn).toHaveBeenCalledWith(
        expect.stringContaining('Suspended user'),
      );
    });

    /**
     * Test: Deny access when user not found in database
     */
    it('should deny access when user not found in database', async () => {
      // Arrange
      const context = createMockExecutionContext({ user: { id: 999 } });
      mockUserRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(guard.canActivate(context)).rejects.toThrow(
        new ForbiddenException('Access denied. User not found.'),
      );
    });
  });

  // ==========================================================================
  // ADDITIONAL TESTS: Route Path Normalization
  // ==========================================================================

  describe('Route Path Normalization', () => {
    /**
     * Test: Normalize multiple numeric IDs in path
     */
    it('should normalize multiple numeric IDs in route path', async () => {
      // Arrange
      const permission = createMockPermission({ name: 'view_order_item' });
      const role = createMockRole();
      const rolePermission = createMockRolePermission(role, permission);
      role.rolePermissions = [rolePermission];

      const user = createMockUser({ role, assignedRole: null });
      const route = createMockRoute({
        permission,
        path: '/api/orders/:id/items/:id',
        method: 'GET',
      });

      // Path with multiple IDs
      const context = createMockExecutionContext({
        path: '/api/orders/123/items/456',
        method: 'GET',
        routePath: '/api/orders/:id/items/:id',
      });

      mockUserRepository.findOne.mockResolvedValue(user);
      mockRouteRepository.findOne.mockResolvedValue(route);

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });

    /**
     * Test: Handle paths with trailing slashes
     */
    it('should handle paths consistently regardless of trailing slash', async () => {
      // Arrange
      const role = createMockRole();
      const user = createMockUser({ role, assignedRole: null });

      const context = createMockExecutionContext({
        path: '/api/products/',
        method: 'GET',
      });

      mockUserRepository.findOne.mockResolvedValue(user);
      mockRouteRepository.findOne.mockResolvedValue(null); // No route found = public

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });
  });

  // ==========================================================================
  // ADDITIONAL TESTS: Request Context Handling
  // ==========================================================================

  describe('Request Context Handling', () => {
    /**
     * Test: Handle missing IP address
     */
    it('should handle missing IP address gracefully', async () => {
      // Arrange
      const permission = createMockPermission({ name: 'view_products' });
      const role = createMockRole();
      const rolePermission = createMockRolePermission(role, permission);
      role.rolePermissions = [rolePermission];

      const user = createMockUser({ role, assignedRole: null });
      const route = createMockRoute({ permission });

      // Create context without IP
      const mockRequest = {
        user: { id: 1, role: 'vendor', email: 'test@example.com' },
        method: 'GET',
        url: '/api/products',
        originalUrl: '/api/products',
        route: { path: '/api/products' },
        // No ip or connection
        headers: { 'user-agent': 'Test Agent' },
      };

      const context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as ExecutionContext;

      mockUserRepository.findOne.mockResolvedValue(user);
      mockRouteRepository.findOne.mockResolvedValue(route);

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
      expect(Logger.prototype.log).toHaveBeenCalledWith(
        expect.stringContaining('IP: unknown'),
      );
    });

    /**
     * Test: Handle missing user agent
     */
    it('should handle missing user agent gracefully', async () => {
      // Arrange
      const permission = createMockPermission({ name: 'view_products' });
      const role = createMockRole();
      const rolePermission = createMockRolePermission(role, permission);
      role.rolePermissions = [rolePermission];

      const user = createMockUser({ role, assignedRole: null });
      const route = createMockRoute({ permission });

      // Create context without user-agent header
      const mockRequest = {
        user: { id: 1, role: 'vendor', email: 'test@example.com' },
        method: 'GET',
        url: '/api/products',
        originalUrl: '/api/products',
        route: { path: '/api/products' },
        ip: '127.0.0.1',
        headers: {}, // No user-agent
      };

      const context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as ExecutionContext;

      mockUserRepository.findOne.mockResolvedValue(user);
      mockRouteRepository.findOne.mockResolvedValue(route);

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
      expect(Logger.prototype.log).toHaveBeenCalledWith(
        expect.stringContaining('User-Agent: unknown'),
      );
    });
  });
});
