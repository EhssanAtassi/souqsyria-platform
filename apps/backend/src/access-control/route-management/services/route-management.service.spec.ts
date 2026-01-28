/**
 * @file route-management.service.spec.ts
 * @description Unit tests for RouteManagementService
 * 
 * Tests cover:
 * - Route discovery integration
 * - CRUD operations for route mappings
 * - Bulk creation with validation
 * - Permission linking/unlinking
 * - Auto-mapping with various options
 * - Statistics calculation
 * - Error handling and validation
 * 
 * @author SouqSyria Testing Team
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { RouteManagementService } from './route-management.service';
import { RouteDiscoveryService } from './route-discovery.service';
import { SecurityAuditService } from '../../security-audit/security-audit.service';
import { Route } from '../../entities/route.entity';
import { Permission } from '../../entities/permission.entity';

/**
 * Mock repository factory
 * Creates a mock repository with common TypeORM methods
 */
const createMockRepository = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
});

describe('RouteManagementService', () => {
  let service: RouteManagementService;
  let routeRepository: jest.Mocked<Repository<Route>>;
  let permissionRepository: jest.Mocked<Repository<Permission>>;
  let routeDiscoveryService: jest.Mocked<RouteDiscoveryService>;
  let securityAuditService: jest.Mocked<SecurityAuditService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RouteManagementService,
        {
          provide: getRepositoryToken(Route),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Permission),
          useValue: createMockRepository(),
        },
        {
          provide: RouteDiscoveryService,
          useValue: {
            discoverRoutes: jest.fn(),
          },
        },
        {
          provide: SecurityAuditService,
          useValue: {
            logPermissionCheck: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<RouteManagementService>(RouteManagementService);
    routeRepository = module.get(getRepositoryToken(Route));
    permissionRepository = module.get(getRepositoryToken(Permission));
    routeDiscoveryService = module.get(RouteDiscoveryService);
    securityAuditService = module.get(SecurityAuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Test Suite: Route Discovery
   */
  describe('discoverAllRoutes', () => {
    it('should discover all routes via RouteDiscoveryService', async () => {
      // Arrange
      const mockDiscoveredRoutes = [
        {
          path: '/api/admin/products',
          method: 'GET',
          controllerName: 'ProductsController',
          handlerName: 'findAll',
          isPublic: false,
          isMapped: true,
          suggestedPermission: 'view_products',
          currentPermission: 'view_products',
          routeId: 1,
        },
      ];

      routeDiscoveryService.discoverRoutes.mockResolvedValue(
        mockDiscoveredRoutes,
      );

      // Act
      const result = await service.discoverAllRoutes();

      // Assert
      expect(routeDiscoveryService.discoverRoutes).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockDiscoveredRoutes);
    });
  });

  /**
   * Test Suite: Get Unmapped Routes
   */
  describe('getUnmappedRoutes', () => {
    it('should return only unmapped non-public routes', async () => {
      // Arrange
      const mockDiscoveredRoutes = [
        {
          path: '/api/admin/products',
          method: 'GET',
          controllerName: 'ProductsController',
          handlerName: 'findAll',
          isPublic: false,
          isMapped: true, // Mapped - should be excluded
          suggestedPermission: 'view_products',
        },
        {
          path: '/api/admin/analytics',
          method: 'GET',
          controllerName: 'AnalyticsController',
          handlerName: 'getDashboard',
          isPublic: false,
          isMapped: false, // Unmapped - should be included
          suggestedPermission: 'view_analytics',
        },
        {
          path: '/api/health',
          method: 'GET',
          controllerName: 'HealthController',
          handlerName: 'check',
          isPublic: true, // Public - should be excluded
          isMapped: false,
          suggestedPermission: 'health',
        },
      ];

      routeDiscoveryService.discoverRoutes.mockResolvedValue(
        mockDiscoveredRoutes,
      );

      // Act
      const result = await service.getUnmappedRoutes();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].path).toBe('/api/admin/analytics');
      expect(result[0].isMapped).toBe(false);
      expect(result[0].isPublic).toBe(false);
    });

    it('should return empty array when all routes are mapped or public', async () => {
      // Arrange
      const mockDiscoveredRoutes = [
        {
          path: '/api/admin/products',
          method: 'GET',
          controllerName: 'ProductsController',
          handlerName: 'findAll',
          isPublic: false,
          isMapped: true,
          suggestedPermission: 'view_products',
        },
        {
          path: '/api/health',
          method: 'GET',
          controllerName: 'HealthController',
          handlerName: 'check',
          isPublic: true,
          isMapped: false,
          suggestedPermission: 'health',
        },
      ];

      routeDiscoveryService.discoverRoutes.mockResolvedValue(
        mockDiscoveredRoutes,
      );

      // Act
      const result = await service.getUnmappedRoutes();

      // Assert
      expect(result).toHaveLength(0);
    });
  });

  /**
   * Test Suite: Create Route Mapping
   */
  describe('createRouteMapping', () => {
    it('should create route mapping successfully', async () => {
      // Arrange
      const createDto = {
        path: '/api/admin/products',
        method: 'GET',
        permissionId: 5,
      };
      const mockPermission = {
        id: 5,
        name: 'view_products',
      };
      const mockRoute = {
        id: 1,
        path: '/api/admin/products',
        method: 'GET',
        permission: mockPermission,
      };
      const userId = 1;

      permissionRepository.findOne.mockResolvedValue(
        mockPermission as Permission,
      );
      routeRepository.findOne.mockResolvedValue(null); // No existing route
      routeRepository.create.mockReturnValue(mockRoute as Route);
      routeRepository.save.mockResolvedValue(mockRoute as Route);

      // Act
      const result = await service.createRouteMapping(createDto, userId);

      // Assert
      expect(permissionRepository.findOne).toHaveBeenCalledWith({
        where: { id: 5 },
      });
      expect(routeRepository.findOne).toHaveBeenCalledWith({
        where: { path: '/api/admin/products', method: 'GET' },
      });
      expect(routeRepository.create).toHaveBeenCalledWith({
        path: '/api/admin/products',
        method: 'GET',
        permission: mockPermission,
      });
      expect(routeRepository.save).toHaveBeenCalledWith(mockRoute);
      expect(result).toEqual(mockRoute);
      expect(securityAuditService.logPermissionCheck).toHaveBeenCalled();
    });

    it('should throw NotFoundException when permission does not exist', async () => {
      // Arrange
      const createDto = {
        path: '/api/admin/products',
        method: 'GET',
        permissionId: 999,
      };
      const userId = 1;

      permissionRepository.findOne.mockResolvedValue(null); // Permission not found

      // Act & Assert
      await expect(
        service.createRouteMapping(createDto, userId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.createRouteMapping(createDto, userId),
      ).rejects.toThrow('Permission with ID 999 not found');
    });

    it('should throw ConflictException when route mapping already exists', async () => {
      // Arrange
      const createDto = {
        path: '/api/admin/products',
        method: 'GET',
        permissionId: 5,
      };
      const mockPermission = {
        id: 5,
        name: 'view_products',
      };
      const existingRoute = {
        id: 1,
        path: '/api/admin/products',
        method: 'GET',
      };
      const userId = 1;

      permissionRepository.findOne.mockResolvedValue(
        mockPermission as Permission,
      );
      routeRepository.findOne.mockResolvedValue(existingRoute as Route); // Existing route found

      // Act & Assert
      await expect(
        service.createRouteMapping(createDto, userId),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.createRouteMapping(createDto, userId),
      ).rejects.toThrow(
        'Route mapping already exists for GET /api/admin/products',
      );
    });
  });

  /**
   * Test Suite: Link Permission to Route
   */
  describe('linkRouteToPermission', () => {
    it('should link permission to route successfully', async () => {
      // Arrange
      const routeId = 1;
      const permissionId = 5;
      const userId = 1;

      const mockRoute = {
        id: 1,
        path: '/api/admin/products',
        method: 'GET',
        permission: null,
      };

      const mockPermission = {
        id: 5,
        name: 'view_products',
      };

      const updatedRoute = {
        ...mockRoute,
        permission: mockPermission,
      };

      routeRepository.findOne.mockResolvedValue(mockRoute as Route);
      permissionRepository.findOne.mockResolvedValue(
        mockPermission as Permission,
      );
      routeRepository.save.mockResolvedValue(updatedRoute as Route);

      // Act
      const result = await service.linkRouteToPermission(
        routeId,
        permissionId,
        userId,
      );

      // Assert
      expect(routeRepository.findOne).toHaveBeenCalledWith({
        where: { id: routeId },
        relations: ['permission'],
      });
      expect(permissionRepository.findOne).toHaveBeenCalledWith({
        where: { id: permissionId },
      });
      expect(result.permission).toEqual(mockPermission);
      expect(securityAuditService.logPermissionCheck).toHaveBeenCalled();
    });

    it('should throw NotFoundException when route does not exist', async () => {
      // Arrange
      const routeId = 999;
      const permissionId = 5;
      const userId = 1;

      routeRepository.findOne.mockResolvedValue(null); // Route not found

      // Act & Assert
      await expect(
        service.linkRouteToPermission(routeId, permissionId, userId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.linkRouteToPermission(routeId, permissionId, userId),
      ).rejects.toThrow('Route with ID 999 not found');
    });

    it('should throw NotFoundException when permission does not exist', async () => {
      // Arrange
      const routeId = 1;
      const permissionId = 999;
      const userId = 1;

      const mockRoute = {
        id: 1,
        path: '/api/admin/products',
        method: 'GET',
      };

      routeRepository.findOne.mockResolvedValue(mockRoute as Route);
      permissionRepository.findOne.mockResolvedValue(null); // Permission not found

      // Act & Assert
      await expect(
        service.linkRouteToPermission(routeId, permissionId, userId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.linkRouteToPermission(routeId, permissionId, userId),
      ).rejects.toThrow('Permission with ID 999 not found');
    });
  });

  /**
   * Test Suite: Unlink Permission from Route
   */
  describe('unlinkRouteFromPermission', () => {
    it('should unlink permission from route successfully', async () => {
      // Arrange
      const routeId = 1;
      const userId = 1;

      const mockRoute = {
        id: 1,
        path: '/api/admin/products',
        method: 'GET',
        permission: {
          id: 5,
          name: 'view_products',
        },
      };

      routeRepository.findOne.mockResolvedValue(mockRoute as Route);
      routeRepository.save.mockResolvedValue({
        ...mockRoute,
        permission: null,
      } as Route);

      // Act
      await service.unlinkRouteFromPermission(routeId, userId);

      // Assert
      expect(routeRepository.findOne).toHaveBeenCalledWith({
        where: { id: routeId },
        relations: ['permission'],
      });
      expect(routeRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          permission: null,
        }),
      );
      expect(securityAuditService.logPermissionCheck).toHaveBeenCalled();
    });

    it('should throw NotFoundException when route does not exist', async () => {
      // Arrange
      const routeId = 999;
      const userId = 1;

      routeRepository.findOne.mockResolvedValue(null); // Route not found

      // Act & Assert
      await expect(
        service.unlinkRouteFromPermission(routeId, userId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.unlinkRouteFromPermission(routeId, userId),
      ).rejects.toThrow('Route with ID 999 not found');
    });
  });

  /**
   * Test Suite: Get Routes by Permission
   */
  describe('getRoutesByPermission', () => {
    it('should return routes for a specific permission', async () => {
      // Arrange
      const permissionId = 5;
      const mockPermission = {
        id: 5,
        name: 'view_products',
      };
      const mockRoutes = [
        {
          id: 1,
          path: '/api/admin/products',
          method: 'GET',
          permission: mockPermission,
        },
        {
          id: 2,
          path: '/api/admin/products/:id',
          method: 'GET',
          permission: mockPermission,
        },
      ];

      permissionRepository.findOne.mockResolvedValue(
        mockPermission as Permission,
      );
      routeRepository.find.mockResolvedValue(mockRoutes as Route[]);

      // Act
      const result = await service.getRoutesByPermission(permissionId);

      // Assert
      expect(permissionRepository.findOne).toHaveBeenCalledWith({
        where: { id: permissionId },
      });
      expect(routeRepository.find).toHaveBeenCalledWith({
        where: { permission: { id: permissionId } },
        relations: ['permission'],
      });
      expect(result).toEqual(mockRoutes);
      expect(result).toHaveLength(2);
    });

    it('should throw NotFoundException when permission does not exist', async () => {
      // Arrange
      const permissionId = 999;

      permissionRepository.findOne.mockResolvedValue(null); // Permission not found

      // Act & Assert
      await expect(service.getRoutesByPermission(permissionId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getRoutesByPermission(permissionId)).rejects.toThrow(
        'Permission with ID 999 not found',
      );
    });
  });

  /**
   * Test Suite: Calculate Mapping Statistics
   */
  describe('getMappingStatistics', () => {
    it('should calculate mapping statistics correctly', async () => {
      // Arrange
      const mockDiscoveredRoutes = [
        {
          path: '/api/admin/products',
          method: 'GET',
          controllerName: 'ProductsController',
          handlerName: 'findAll',
          isPublic: false,
          isMapped: true,
          suggestedPermission: 'view_products',
        },
        {
          path: '/api/admin/products',
          method: 'POST',
          controllerName: 'ProductsController',
          handlerName: 'create',
          isPublic: false,
          isMapped: true,
          suggestedPermission: 'create_products',
        },
        {
          path: '/api/admin/analytics',
          method: 'GET',
          controllerName: 'AnalyticsController',
          handlerName: 'getDashboard',
          isPublic: false,
          isMapped: false,
          suggestedPermission: 'view_analytics',
        },
        {
          path: '/api/health',
          method: 'GET',
          controllerName: 'HealthController',
          handlerName: 'check',
          isPublic: true,
          isMapped: false,
          suggestedPermission: 'health',
        },
      ];

      routeDiscoveryService.discoverRoutes.mockResolvedValue(
        mockDiscoveredRoutes,
      );

      // Act
      const result = await service.getMappingStatistics();

      // Assert
      expect(result.total).toBe(4);
      expect(result.mapped).toBe(2);
      expect(result.unmapped).toBe(1);
      expect(result.public).toBe(1);
      expect(result.byMethod).toEqual({ GET: 3, POST: 1 });
      expect(result.byController).toEqual({
        ProductsController: 2,
        AnalyticsController: 1,
        HealthController: 1,
      });
      // Coverage: 2 mapped / (4 total - 1 public) * 100 = 66.67%
      expect(result.coveragePercentage).toBeCloseTo(66.67, 1);
    });
  });

  /**
   * Test Suite: Validate Route Uniqueness
   */
  describe('validateRouteUnique', () => {
    it('should return true when route does not exist', async () => {
      // Arrange
      const path = '/api/admin/products';
      const method = 'GET';

      routeRepository.findOne.mockResolvedValue(null); // Route not found

      // Act
      const result = await service.validateRouteUnique(path, method);

      // Assert
      expect(result).toBe(true);
      expect(routeRepository.findOne).toHaveBeenCalledWith({
        where: { path, method },
      });
    });

    it('should return false when route already exists', async () => {
      // Arrange
      const path = '/api/admin/products';
      const method = 'GET';
      const existingRoute = {
        id: 1,
        path,
        method,
      };

      routeRepository.findOne.mockResolvedValue(existingRoute as Route);

      // Act
      const result = await service.validateRouteUnique(path, method);

      // Assert
      expect(result).toBe(false);
      expect(routeRepository.findOne).toHaveBeenCalledWith({
        where: { path, method },
      });
    });
  });
});
