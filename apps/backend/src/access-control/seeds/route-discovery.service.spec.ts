/**
 * @file route-discovery.service.spec.ts
 * @description Unit tests for RouteDiscoveryService
 * 
 * @swagger
 * @tags Route Discovery Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';
import { RouteDiscoveryService } from './route-discovery.service';
import { Controller, Get, Post, Patch, Delete } from '@nestjs/common';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';
import { PERMISSIONS_KEY } from '../../common/decorators/permission.decorator';

/**
 * Mock controller for testing
 */
@Controller('test-products')
class TestProductsController {
  @Get()
  findAll() {}

  @Get(':id')
  findOne() {}

  @Post()
  create() {}

  @Patch(':id')
  update() {}

  @Delete(':id')
  remove() {}
}

describe('RouteDiscoveryService', () => {
  let service: RouteDiscoveryService;
  let discoveryService: DiscoveryService;
  let metadataScanner: MetadataScanner;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RouteDiscoveryService,
        {
          provide: DiscoveryService,
          useValue: {
            getControllers: jest.fn(),
          },
        },
        {
          provide: MetadataScanner,
          useValue: {
            getAllMethodNames: jest.fn(),
          },
        },
        {
          provide: Reflector,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RouteDiscoveryService>(RouteDiscoveryService);
    discoveryService = module.get<DiscoveryService>(DiscoveryService);
    metadataScanner = module.get<MetadataScanner>(MetadataScanner);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('discoverAllRoutes', () => {
    it('should discover routes from controllers', async () => {
      // Mock controller wrapper
      const mockControllerWrapper = {
        metatype: TestProductsController,
        instance: new TestProductsController(),
      };

      jest
        .spyOn(discoveryService, 'getControllers')
        .mockReturnValue([mockControllerWrapper] as any);

      jest
        .spyOn(metadataScanner, 'getAllMethodNames')
        .mockReturnValue(['findAll', 'findOne', 'create', 'update', 'remove']);

      // Mock reflector to return HTTP methods
      jest.spyOn(reflector, 'get').mockImplementation((key: any, target: any) => {
        if (key === 'method') {
          const methodName = target.name;
          if (methodName === 'findAll' || methodName === 'findOne') return 'GET';
          if (methodName === 'create') return 'POST';
          if (methodName === 'update') return 'PATCH';
          if (methodName === 'remove') return 'DELETE';
        }
        if (key === 'path') {
          const methodName = target.name;
          if (methodName === 'findOne' || methodName === 'update' || methodName === 'remove') {
            return ':id';
          }
          return '';
        }
        return undefined;
      });

      const result = await service.discoverAllRoutes();

      expect(result).toBeDefined();
      expect(result.totalRoutes).toBeGreaterThan(0);
    });
  });

  describe('extractResourceName', () => {
    it('should extract resource name from controller', () => {
      const testCases = [
        { input: 'ProductsController', expected: 'products' },
        { input: 'AdminUsersController', expected: 'users' },
        { input: 'UserManagementController', expected: 'user-management' },
        { input: 'SyrianKycController', expected: 'kyc' },
        { input: 'PublicProductsController', expected: 'products' },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = (service as any).extractResourceName(input);
        expect(result).toBe(expected);
      });
    });
  });

  describe('generatePermissionName', () => {
    it('should generate permission for view operations', () => {
      const viewMethods = ['findAll', 'getAll', 'index', 'list', 'findOne', 'getById'];
      
      viewMethods.forEach((method) => {
        const result = (service as any).generatePermissionName(method, 'products');
        expect(result).toBe('view_products');
      });
    });

    it('should generate permission for create operations', () => {
      const createMethods = ['create', 'store', 'add', 'insert'];
      
      createMethods.forEach((method) => {
        const result = (service as any).generatePermissionName(method, 'products');
        expect(result).toBe('create_products');
      });
    });

    it('should generate permission for update operations', () => {
      const updateMethods = ['update', 'patch', 'edit', 'modify'];
      
      updateMethods.forEach((method) => {
        const result = (service as any).generatePermissionName(method, 'products');
        expect(result).toBe('edit_products');
      });
    });

    it('should generate permission for delete operations', () => {
      const deleteMethods = ['remove', 'delete', 'destroy'];
      
      deleteMethods.forEach((method) => {
        const result = (service as any).generatePermissionName(method, 'products');
        expect(result).toBe('delete_products');
      });
    });

    it('should generate permission for approval operations', () => {
      const result = (service as any).generatePermissionName('approve', 'products');
      expect(result).toBe('approve_products');
    });

    it('should generate permission for rejection operations', () => {
      const result = (service as any).generatePermissionName('reject', 'products');
      expect(result).toBe('reject_products');
    });

    it('should generate permission for bulk operations', () => {
      const result = (service as any).generatePermissionName('bulkUpdate', 'products');
      expect(result).toBe('bulk_edit_products');
    });

    it('should generate permission for import operations', () => {
      const result = (service as any).generatePermissionName('import', 'products');
      expect(result).toBe('import_products');
    });

    it('should generate permission for export operations', () => {
      const result = (service as any).generatePermissionName('export', 'products');
      expect(result).toBe('export_products');
    });

    it('should return null for unknown method names', () => {
      const result = (service as any).generatePermissionName('unknownMethod', 'products');
      expect(result).toBeNull();
    });
  });

  describe('groupRoutesByResource', () => {
    it('should group routes by resource name', () => {
      const mockRoutes = [
        { resource: 'products', path: '/api/products', method: 'GET' } as any,
        { resource: 'products', path: '/api/products/:id', method: 'GET' } as any,
        { resource: 'users', path: '/api/users', method: 'GET' } as any,
        { resource: 'users', path: '/api/users/:id', method: 'GET' } as any,
      ];

      const grouped = service.groupRoutesByResource(mockRoutes);

      expect(grouped.size).toBe(2);
      expect(grouped.get('products')).toHaveLength(2);
      expect(grouped.get('users')).toHaveLength(2);
    });
  });

  describe('validatePermissions', () => {
    it('should identify missing permissions', () => {
      const mockRoutes = [
        {
          isPublic: false,
          explicitPermissions: ['view_products'],
          suggestedPermission: null,
        } as any,
        {
          isPublic: false,
          explicitPermissions: [],
          suggestedPermission: 'create_products',
        } as any,
        {
          isPublic: true,
          explicitPermissions: [],
          suggestedPermission: null,
        } as any,
      ];

      const existingPermissions = new Set(['view_products']);

      const missing = service.validatePermissions(mockRoutes, existingPermissions);

      expect(missing).toContain('create_products');
      expect(missing).not.toContain('view_products');
    });

    it('should skip public routes in validation', () => {
      const mockRoutes = [
        {
          isPublic: true,
          explicitPermissions: [],
          suggestedPermission: 'some_permission',
        } as any,
      ];

      const existingPermissions = new Set<string>();

      const missing = service.validatePermissions(mockRoutes, existingPermissions);

      expect(missing).toHaveLength(0);
    });
  });

  describe('buildFullPath', () => {
    it('should build correct full path', () => {
      const testCases = [
        { controller: 'products', method: '', expected: '/api/products' },
        { controller: 'products', method: ':id', expected: '/api/products/:id' },
        { controller: 'admin/users', method: '', expected: '/api/admin/users' },
        { controller: '/products/', method: '/:id/', expected: '/api/products/:id' },
      ];

      testCases.forEach(({ controller, method, expected }) => {
        const result = (service as any).buildFullPath(controller, method);
        expect(result).toBe(expected);
      });
    });
  });
});
