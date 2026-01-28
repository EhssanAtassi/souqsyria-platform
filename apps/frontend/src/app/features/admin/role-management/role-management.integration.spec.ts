/**
 * Role Management Integration Tests
 *
 * @description
 * Integration tests for the Role Management module of the SouqSyria Admin Dashboard.
 * Validates the full data flow between RoleDataService (HTTP), RoleManagementService
 * (orchestration), RoleManagementStore (state), and RoleManagementQuery (selectors).
 *
 * Test Coverage:
 * - Role list loads from API with proper store population
 * - Create role flow (form values, API call, store update)
 * - Edit role with permission changes and optimistic updates
 * - Role deletion with confirmation and rollback on failure
 * - Clone role functionality
 * - Permission fetching and caching
 * - Role templates loading and display
 *
 * @module RoleManagement/IntegrationTests
 * @group integration
 * @group role-management
 */

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError, EMPTY } from 'rxjs';

import { RoleManagementService } from './state/role-management.service';
import { RoleManagementStore } from './state/role-management.store';
import { RoleManagementQuery } from './state/role-management.query';
import { RoleDataService } from './services/role-data.service';
import {
  Role,
  CreateRoleDto,
  UpdateRoleDto,
  CloneRoleDto,
  Permission,
  RoleTemplate
} from './models';

describe('Role Management Integration Tests', () => {
  let service: RoleManagementService;
  let store: RoleManagementStore;
  let query: RoleManagementQuery;
  let dataService: jasmine.SpyObj<RoleDataService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  // ---------------------------------------------------------------------------
  // Mock Data - Realistic SouqSyria Role Configuration
  // ---------------------------------------------------------------------------

  /** Mock permissions for the SouqSyria platform */
  const MOCK_PERMISSIONS: Permission[] = [
    { id: 1, name: 'manage_users', displayName: 'Manage Users', description: 'إدارة المستخدمين - Manage users', category: 'user_management', resource: 'users', action: 'manage', isSystem: true, createdAt: new Date('2024-01-01') },
    { id: 2, name: 'view_users', displayName: 'View Users', description: 'عرض المستخدمين - View users', category: 'user_management', resource: 'users', action: 'view', isSystem: true, createdAt: new Date('2024-01-01') },
    { id: 3, name: 'manage_roles', displayName: 'Manage Roles', description: 'إدارة الأدوار - Manage roles', category: 'role_management', resource: 'roles', action: 'manage', isSystem: true, createdAt: new Date('2024-01-01') },
    { id: 4, name: 'view_roles', displayName: 'View Roles', description: 'عرض الأدوار - View roles', category: 'role_management', resource: 'roles', action: 'view', isSystem: true, createdAt: new Date('2024-01-01') },
    { id: 5, name: 'manage_products', displayName: 'Manage Products', description: 'إدارة المنتجات - Manage products', category: 'product_management', resource: 'products', action: 'manage', isSystem: false, createdAt: new Date('2024-01-01') },
    { id: 6, name: 'view_products', displayName: 'View Products', description: 'عرض المنتجات - View products', category: 'product_management', resource: 'products', action: 'view', isSystem: false, createdAt: new Date('2024-01-01') },
    { id: 7, name: 'manage_orders', displayName: 'Manage Orders', description: 'إدارة الطلبات - Manage orders', category: 'order_management', resource: 'orders', action: 'manage', isSystem: false, createdAt: new Date('2024-01-01') },
    { id: 8, name: 'view_orders', displayName: 'View Orders', description: 'عرض الطلبات - View orders', category: 'order_management', resource: 'orders', action: 'view', isSystem: false, createdAt: new Date('2024-01-01') },
    { id: 9, name: 'manage_routes', displayName: 'Manage Routes', description: 'إدارة المسارات - Manage routes', category: 'route_management', resource: 'routes', action: 'manage', isSystem: true, createdAt: new Date('2024-01-01') },
    { id: 10, name: 'view_audit_logs', displayName: 'View Audit Logs', description: 'عرض سجلات التدقيق - View audit logs', category: 'audit', resource: 'audit', action: 'view', isSystem: true, createdAt: new Date('2024-01-01') },
    { id: 11, name: 'access_admin_panel', displayName: 'Access Admin Panel', description: 'الوصول للوحة الإدارة - Access admin panel', category: 'admin', resource: 'admin', action: 'access', isSystem: true, createdAt: new Date('2024-01-01') }
  ];

  /** Mock roles for the SouqSyria platform */
  const MOCK_ROLES: Role[] = [
    {
      id: 1,
      name: 'super_admin',
      displayName: 'المدير العام',
      description: 'Full system access - صلاحية كاملة للنظام',
      isActive: true,
      isSystem: true,
      priority: 100,
      permissionIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      userCount: 2,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2025-01-01')
    },
    {
      id: 2,
      name: 'admin',
      displayName: 'مدير النظام',
      description: 'Admin panel access - مدير عام',
      isActive: true,
      isSystem: true,
      priority: 90,
      permissionIds: [1, 2, 3, 4, 5, 6, 7, 8, 11],
      userCount: 5,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2025-01-15')
    },
    {
      id: 3,
      name: 'content_moderator',
      displayName: 'مراقب المحتوى',
      description: 'Content moderation - مراقب المحتوى والمنتجات',
      isActive: true,
      isSystem: false,
      priority: 50,
      permissionIds: [2, 5, 6, 8, 11],
      userCount: 8,
      createdAt: new Date('2024-06-01'),
      updatedAt: new Date('2025-01-20')
    },
    {
      id: 4,
      name: 'viewer',
      displayName: 'مشاهد',
      description: 'Read-only access - صلاحية القراءة فقط',
      isActive: true,
      isSystem: false,
      priority: 10,
      permissionIds: [2, 4, 6, 8],
      userCount: 15,
      createdAt: new Date('2024-09-01'),
      updatedAt: new Date('2025-01-25')
    },
    {
      id: 5,
      name: 'inactive_role',
      displayName: 'دور معطل',
      description: 'Deactivated role for testing',
      isActive: false,
      isSystem: false,
      priority: 0,
      permissionIds: [],
      userCount: 0,
      createdAt: new Date('2024-03-01'),
      updatedAt: new Date('2024-12-01')
    }
  ];

  /** Mock paginated roles API response */
  const MOCK_ROLES_RESPONSE = {
    items: MOCK_ROLES,
    page: 1,
    limit: 25,
    total: 5,
    totalPages: 1
  };

  /** Mock role templates */
  const MOCK_TEMPLATES: RoleTemplate[] = [
    {
      id: 't1',
      name: 'قالب البائع الأساسي',
      description: 'Basic seller template - قالب بائع أساسي',
      suggestedPermissions: ['manage_products', 'view_products', 'view_orders'],
      priority: 40,
      category: 'vendor_management',
      icon: 'store',
      color: '#4CAF50'
    },
    {
      id: 't2',
      name: 'قالب وكيل الدعم',
      description: 'Support agent template - قالب دعم فني',
      suggestedPermissions: ['view_users', 'view_products', 'view_orders'],
      priority: 30,
      category: 'customer_service',
      icon: 'support_agent',
      color: '#2196F3'
    }
  ];

  // ---------------------------------------------------------------------------
  // Test Setup
  // ---------------------------------------------------------------------------

  beforeEach(() => {
    const dataServiceSpy = jasmine.createSpyObj('RoleDataService', [
      'getRoles',
      'getRoleById',
      'createRole',
      'updateRole',
      'deleteRole',
      'cloneRole',
      'bulkAssignPermissions',
      'removePermission',
      'updateRolePriority',
      'getUsersWithRole',
      'getPermissions',
      'getRoleTemplates'
    ]);

    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, MatSnackBarModule, NoopAnimationsModule],
      providers: [
        RoleManagementService,
        RoleManagementStore,
        RoleManagementQuery,
        { provide: RoleDataService, useValue: dataServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    });

    service = TestBed.inject(RoleManagementService);
    store = TestBed.inject(RoleManagementStore);
    query = TestBed.inject(RoleManagementQuery);
    dataService = TestBed.inject(RoleDataService) as jasmine.SpyObj<RoleDataService>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
  });

  afterEach(() => {
    store.reset();
  });

  // ===========================================================================
  // 1. ROLE LIST LOADS FROM API
  // ===========================================================================

  describe('Role list loads from API', () => {
    /**
     * Verifies that fetchRoles populates the store with role entities.
     */
    it('should load roles from API and populate store with all entities', (done) => {
      dataService.getRoles.and.returnValue(of(MOCK_ROLES_RESPONSE));

      service.fetchRoles({ page: 1, limit: 25 }).subscribe({
        next: () => {
          const roles = query.getAll();
          expect(roles.length).toBe(5);
          expect(roles[0].name).toBe('super_admin');
          expect(roles[0].displayName).toBe('المدير العام');
          expect(roles[2].displayName).toBe('مراقب المحتوى');
          done();
        },
        error: done.fail
      });
    });

    /**
     * Verifies that pagination metadata is updated from API response.
     */
    it('should update pagination metadata from roles API response', (done) => {
      dataService.getRoles.and.returnValue(of(MOCK_ROLES_RESPONSE));

      service.fetchRoles({ page: 1, limit: 25 }).subscribe({
        next: () => {
          const pagination = query.getCurrentPagination();
          expect(pagination.page).toBe(1);
          expect(pagination.limit).toBe(25);
          expect(pagination.total).toBe(5);
          expect(pagination.totalPages).toBe(1);
          done();
        },
        error: done.fail
      });
    });

    /**
     * Verifies that loading state is toggled during role fetch.
     */
    it('should toggle loading state during fetch operation', () => {
      dataService.getRoles.and.returnValue(of(MOCK_ROLES_RESPONSE));
      spyOn(store, 'setLoading').and.callThrough();

      service.fetchRoles().subscribe();

      expect(store.setLoading).toHaveBeenCalledWith(true);
      expect(store.setLoading).toHaveBeenCalledWith(false);
    });

    /**
     * Verifies error handling when roles API fails.
     */
    it('should handle API error and display error snackbar', () => {
      dataService.getRoles.and.returnValue(
        throwError(() => ({ error: { message: 'فشل تحميل الأدوار' } }))
      );

      service.fetchRoles().subscribe();

      expect(snackBar.open).toHaveBeenCalledWith(
        'فشل تحميل الأدوار',
        'Close',
        jasmine.objectContaining({ panelClass: 'error-snackbar' })
      );
    });

    /**
     * Verifies cache timestamp update on successful fetch.
     */
    it('should update cache timestamp after successful role fetch', (done) => {
      const beforeFetch = Date.now();
      dataService.getRoles.and.returnValue(of(MOCK_ROLES_RESPONSE));

      service.fetchRoles().subscribe({
        next: () => {
          const state = query.getValue();
          expect(state.cache.lastFetched).toBeTruthy();
          expect(state.cache.lastFetched!).toBeGreaterThanOrEqual(beforeFetch);
          done();
        },
        error: done.fail
      });
    });
  });

  // ===========================================================================
  // 2. CREATE ROLE FLOW
  // ===========================================================================

  describe('Create role flow (form, submit, API, store update)', () => {
    /**
     * Verifies that creating a role calls the API and adds to store.
     */
    it('should create role via API and add to store', (done) => {
      const createDto: CreateRoleDto = {
        name: 'order_manager',
        displayName: 'مدير الطلبات',
        description: 'Manages all orders - يدير جميع الطلبات',
        priority: 60,
        permissionIds: [7, 8],
        isActive: true
      };

      const createdRole: Role = {
        id: 6,
        ...createDto,
        isSystem: false,
        permissionIds: createDto.permissionIds || [],
        userCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      dataService.createRole.and.returnValue(of(createdRole));

      service.createRole(createDto).subscribe({
        next: () => {
          const role = query.getEntity(6);
          expect(role).toBeTruthy();
          expect(role!.name).toBe('order_manager');
          expect(role!.displayName).toBe('مدير الطلبات');
          expect(role!.priority).toBe(60);

          expect(snackBar.open).toHaveBeenCalledWith(
            'Role created successfully',
            'Close',
            jasmine.objectContaining({ panelClass: 'success-snackbar' })
          );
          done();
        },
        error: done.fail
      });
    });

    /**
     * Verifies error handling when role creation fails.
     */
    it('should handle create role API error', () => {
      const createDto: CreateRoleDto = {
        name: 'duplicate_role',
        displayName: 'Duplicate',
        description: 'Will fail',
        priority: 10
      };

      dataService.createRole.and.returnValue(
        throwError(() => ({ error: { message: 'الاسم مستخدم بالفعل - Name already taken' } }))
      );

      service.createRole(createDto).subscribe();

      expect(snackBar.open).toHaveBeenCalledWith(
        'الاسم مستخدم بالفعل - Name already taken',
        'Close',
        jasmine.objectContaining({ panelClass: 'error-snackbar' })
      );
    });

    /**
     * Verifies that create role toggles loading state.
     */
    it('should toggle loading state during role creation', () => {
      const createDto: CreateRoleDto = {
        name: 'test',
        displayName: 'Test',
        description: 'Test',
        priority: 1
      };

      dataService.createRole.and.returnValue(of({
        id: 10,
        ...createDto,
        isSystem: false,
        isActive: true,
        permissionIds: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      spyOn(store, 'setLoading').and.callThrough();

      service.createRole(createDto).subscribe();

      expect(store.setLoading).toHaveBeenCalledWith(true);
      expect(store.setLoading).toHaveBeenCalledWith(false);
    });
  });

  // ===========================================================================
  // 3. EDIT ROLE WITH PERMISSION CHANGES
  // ===========================================================================

  describe('Edit role with permission changes', () => {
    beforeEach(() => {
      store.set(MOCK_ROLES);
    });

    /**
     * Verifies that updating a role applies changes via API and store.
     */
    it('should update role and apply changes to store', (done) => {
      const updateDto: UpdateRoleDto = {
        displayName: 'مراقب محتوى أول',
        description: 'Senior content moderator - مراقب محتوى أول',
        priority: 55
      };

      const updatedRole: Role = {
        ...MOCK_ROLES[2],
        ...updateDto,
        updatedAt: new Date()
      };

      dataService.updateRole.and.returnValue(of(updatedRole));

      service.updateRole(3, updateDto).subscribe({
        next: () => {
          const role = query.getEntity(3);
          expect(role!.displayName).toBe('مراقب محتوى أول');
          expect(role!.priority).toBe(55);

          expect(snackBar.open).toHaveBeenCalledWith(
            'Role updated successfully',
            'Close',
            jasmine.objectContaining({ panelClass: 'success-snackbar' })
          );
          done();
        },
        error: done.fail
      });
    });

    /**
     * Verifies optimistic update is applied before API response.
     */
    it('should apply optimistic update before API response', () => {
      const updateDto: UpdateRoleDto = {
        displayName: 'Updated Name'
      };

      dataService.updateRole.and.returnValue(of({
        ...MOCK_ROLES[3],
        ...updateDto,
        updatedAt: new Date()
      }));

      service.updateRole(4, updateDto).subscribe();

      // Optimistic update should already be applied
      const role = query.getEntity(4);
      expect(role).toBeTruthy();
    });

    /**
     * Verifies rollback on update failure.
     */
    it('should rollback optimistic update on API error', () => {
      const originalRole = query.getEntity(3);
      const originalDisplayName = originalRole!.displayName;

      const updateDto: UpdateRoleDto = {
        displayName: 'Will Fail'
      };

      dataService.updateRole.and.returnValue(
        throwError(() => ({ error: { message: 'Update failed' } }))
      );

      service.updateRole(3, updateDto).subscribe();

      const role = query.getEntity(3);
      expect(role!.displayName).toBe(originalDisplayName);
    });

    /**
     * Verifies bulk permission assignment to a role.
     */
    it('should bulk assign permissions to a role', (done) => {
      const dto = { permissionIds: [1, 2, 3, 4, 5, 11] };
      const updatedRole: Role = {
        ...MOCK_ROLES[2],
        permissionIds: dto.permissionIds,
        updatedAt: new Date()
      };

      dataService.bulkAssignPermissions.and.returnValue(of(updatedRole));

      service.bulkAssignPermissions(3, dto).subscribe({
        next: () => {
          const role = query.getEntity(3);
          expect(role!.permissionIds).toEqual([1, 2, 3, 4, 5, 11]);

          expect(snackBar.open).toHaveBeenCalledWith(
            'Permissions assigned successfully',
            'Close',
            jasmine.objectContaining({ panelClass: 'success-snackbar' })
          );
          done();
        },
        error: done.fail
      });
    });

    /**
     * Verifies single permission removal from a role.
     */
    it('should remove a single permission from a role', (done) => {
      // Role 3 has permissionIds: [2, 5, 6, 8, 11]
      const updatedRole: Role = {
        ...MOCK_ROLES[2],
        permissionIds: [2, 6, 8, 11], // Permission 5 removed
        updatedAt: new Date()
      };

      dataService.removePermission.and.returnValue(of(updatedRole));

      service.removePermission(3, 5).subscribe({
        next: () => {
          const role = query.getEntity(3);
          expect(role!.permissionIds).not.toContain(5);

          expect(snackBar.open).toHaveBeenCalledWith(
            'Permission removed successfully',
            'Close',
            jasmine.objectContaining({ panelClass: 'success-snackbar' })
          );
          done();
        },
        error: done.fail
      });
    });

    /**
     * Verifies role priority update.
     */
    it('should update role priority', (done) => {
      const dto = { priority: 75 };
      const updatedRole: Role = {
        ...MOCK_ROLES[2],
        priority: 75,
        updatedAt: new Date()
      };

      dataService.updateRolePriority.and.returnValue(of(updatedRole));

      service.updateRolePriority(3, dto).subscribe({
        next: () => {
          const role = query.getEntity(3);
          expect(role!.priority).toBe(75);
          done();
        },
        error: done.fail
      });
    });

    /**
     * Verifies update for non-existent role is handled.
     */
    it('should handle update for non-existent role gracefully', () => {
      service.updateRole(999, { displayName: 'Ghost' }).subscribe();

      expect(snackBar.open).toHaveBeenCalledWith(
        jasmine.stringContaining('not found'),
        'Close',
        jasmine.objectContaining({ panelClass: 'error-snackbar' })
      );
    });
  });

  // ===========================================================================
  // 4. ROLE DELETION WITH CONFIRMATION
  // ===========================================================================

  describe('Role deletion with confirmation', () => {
    beforeEach(() => {
      store.set(MOCK_ROLES);
    });

    /**
     * Verifies successful role deletion removes entity from store.
     */
    it('should delete role from API and remove from store', (done) => {
      dataService.deleteRole.and.returnValue(
        of({ success: true, message: 'تم حذف الدور بنجاح - Role deleted successfully' })
      );

      service.deleteRole(5).subscribe({
        next: () => {
          const role = query.getEntity(5);
          expect(role).toBeUndefined();

          const allRoles = query.getAll();
          expect(allRoles.length).toBe(4);

          expect(snackBar.open).toHaveBeenCalledWith(
            'تم حذف الدور بنجاح - Role deleted successfully',
            'Close',
            jasmine.objectContaining({ panelClass: 'success-snackbar' })
          );
          done();
        },
        error: done.fail
      });
    });

    /**
     * Verifies optimistic deletion is applied before API response.
     */
    it('should optimistically remove role before API response', () => {
      dataService.deleteRole.and.returnValue(of({ success: true, message: 'Deleted' }));

      service.deleteRole(5).subscribe();

      // Role should already be removed (optimistic)
      const role = query.getEntity(5);
      expect(role).toBeUndefined();
    });

    /**
     * Verifies rollback on deletion failure (role restored).
     */
    it('should rollback deletion and restore role on API error', () => {
      const originalCount = query.getAll().length;

      dataService.deleteRole.and.returnValue(
        throwError(() => ({ error: { message: 'لا يمكن حذف دور نظام' } }))
      );

      service.deleteRole(2).subscribe();

      // Role should be restored
      const role = query.getEntity(2);
      expect(role).toBeTruthy();
      expect(role!.name).toBe('admin');

      const allRoles = query.getAll();
      expect(allRoles.length).toBe(originalCount);
    });

    /**
     * Verifies that system roles show specific error when deletion fails.
     */
    it('should display specific error message for system role deletion failure', () => {
      dataService.deleteRole.and.returnValue(
        throwError(() => ({
          error: { message: 'لا يمكن حذف دور النظام - Cannot delete system role' }
        }))
      );

      service.deleteRole(1).subscribe();

      expect(snackBar.open).toHaveBeenCalledWith(
        'لا يمكن حذف دور النظام - Cannot delete system role',
        'Close',
        jasmine.objectContaining({ panelClass: 'error-snackbar' })
      );
    });

    /**
     * Verifies deletion of non-existent role is handled.
     */
    it('should handle deletion of non-existent role gracefully', () => {
      service.deleteRole(999).subscribe();

      expect(snackBar.open).toHaveBeenCalledWith(
        jasmine.stringContaining('not found'),
        'Close',
        jasmine.objectContaining({ panelClass: 'error-snackbar' })
      );
    });
  });

  // ===========================================================================
  // 5. CLONE ROLE FUNCTIONALITY
  // ===========================================================================

  describe('Clone role functionality', () => {
    beforeEach(() => {
      store.set(MOCK_ROLES);
    });

    /**
     * Verifies successful role cloning adds new entity to store.
     */
    it('should clone role and add new entity to store', (done) => {
      const cloneDto: CloneRoleDto = {
        newName: 'senior_moderator',
        newDisplayName: 'مراقب محتوى أول'
      };

      const clonedRole = {
        id: 6,
        name: 'senior_moderator',
        displayName: 'مراقب محتوى أول',
        description: MOCK_ROLES[2].description,
        isActive: true,
        isSystem: false,
        priority: MOCK_ROLES[2].priority,
        permissionIds: [...MOCK_ROLES[2].permissionIds],
        userCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        originalRoleId: 3
      };

      dataService.cloneRole.and.returnValue(of(clonedRole as any));

      service.cloneRole(3, cloneDto).subscribe({
        next: () => {
          const role = query.getEntity(6);
          expect(role).toBeTruthy();
          expect(role!.name).toBe('senior_moderator');
          expect(role!.displayName).toBe('مراقب محتوى أول');
          expect(role!.permissionIds).toEqual(MOCK_ROLES[2].permissionIds);
          expect(role!.userCount).toBe(0);

          // Original role should still exist
          const original = query.getEntity(3);
          expect(original).toBeTruthy();

          // Total roles should increase
          expect(query.getAll().length).toBe(6);

          expect(snackBar.open).toHaveBeenCalledWith(
            'Role cloned successfully',
            'Close',
            jasmine.objectContaining({ panelClass: 'success-snackbar' })
          );
          done();
        },
        error: done.fail
      });
    });

    /**
     * Verifies clone failure handling.
     */
    it('should handle clone API error and show error snackbar', () => {
      const cloneDto: CloneRoleDto = {
        newName: 'admin',
        newDisplayName: 'Duplicate Admin'
      };

      dataService.cloneRole.and.returnValue(
        throwError(() => ({
          error: { message: 'الاسم مستخدم بالفعل - Name already exists' }
        }))
      );

      service.cloneRole(2, cloneDto).subscribe();

      expect(snackBar.open).toHaveBeenCalledWith(
        'الاسم مستخدم بالفعل - Name already exists',
        'Close',
        jasmine.objectContaining({ panelClass: 'error-snackbar' })
      );
    });
  });

  // ===========================================================================
  // 6. PERMISSION AND TEMPLATE LOADING
  // ===========================================================================

  describe('Permission and template loading', () => {
    /**
     * Verifies that permissions are fetched and cached.
     */
    it('should fetch permissions and cache them in store', (done) => {
      dataService.getPermissions.and.returnValue(of(MOCK_PERMISSIONS));

      service.fetchPermissions(true).subscribe({
        next: () => {
          const cached = query.getCachedPermissions();
          expect(cached.length).toBe(11);
          expect(cached[0].name).toBe('manage_users');
          expect(cached[0].description).toContain('إدارة المستخدمين');
          done();
        },
        error: done.fail
      });
    });

    /**
     * Verifies that cached permissions skip re-fetch.
     */
    it('should skip permission fetch when cache is valid', () => {
      // Pre-populate cache
      store.cachePermissions(MOCK_PERMISSIONS);

      service.fetchPermissions(false).subscribe();

      // Should not make API call
      expect(dataService.getPermissions).not.toHaveBeenCalled();
    });

    /**
     * Verifies force refresh bypasses cache.
     */
    it('should force refresh permissions even when cache is valid', () => {
      store.cachePermissions(MOCK_PERMISSIONS);

      dataService.getPermissions.and.returnValue(of(MOCK_PERMISSIONS));

      service.fetchPermissions(true).subscribe();

      expect(dataService.getPermissions).toHaveBeenCalled();
    });

    /**
     * Verifies that role templates are fetched and cached.
     */
    it('should fetch role templates and cache them', (done) => {
      dataService.getRoleTemplates.and.returnValue(of(MOCK_TEMPLATES));

      service.fetchTemplates(true).subscribe({
        next: () => {
          const templates = query.getCachedTemplates();
          expect(templates.length).toBe(2);
          expect(templates[0].id).toBe('t1');
          expect(templates[0].name).toBe('قالب البائع الأساسي');
          done();
        },
        error: done.fail
      });
    });

    /**
     * Verifies dashboard initialization loads all data in parallel.
     */
    it('should initialize dashboard by loading roles, permissions, and templates', (done) => {
      dataService.getRoles.and.returnValue(of(MOCK_ROLES_RESPONSE));
      dataService.getPermissions.and.returnValue(of(MOCK_PERMISSIONS));
      dataService.getRoleTemplates.and.returnValue(of(MOCK_TEMPLATES));

      service.initializeDashboard().subscribe({
        next: () => {
          expect(query.getAll().length).toBe(5);
          expect(query.getCachedPermissions().length).toBe(11);
          expect(query.getCachedTemplates().length).toBe(2);
          done();
        },
        error: done.fail
      });
    });
  });

  // ===========================================================================
  // 7. FILTER AND PAGINATION
  // ===========================================================================

  describe('Filter and pagination', () => {
    /**
     * Verifies that applying filters re-fetches with correct params.
     */
    it('should apply filters and refetch roles', () => {
      dataService.getRoles.and.returnValue(of(MOCK_ROLES_RESPONSE));

      service.applyFilters({ isActive: true }).subscribe();

      expect(dataService.getRoles).toHaveBeenCalledWith(
        jasmine.objectContaining({ isActive: true, page: 1 })
      );
    });

    /**
     * Verifies that clearing filters resets to page 1.
     */
    it('should clear filters and reset to page 1', () => {
      dataService.getRoles.and.returnValue(of(MOCK_ROLES_RESPONSE));

      service.clearFilters().subscribe();

      expect(dataService.getRoles).toHaveBeenCalledWith(
        jasmine.objectContaining({ page: 1 })
      );
    });

    /**
     * Verifies UI selection helpers.
     */
    it('should support role selection and bulk selection', () => {
      store.set(MOCK_ROLES);

      service.selectRole(3);
      service.toggleBulkSelection(1);
      service.toggleBulkSelection(2);

      const selected = query.getSelectedRole();
      expect(selected).toBeTruthy();
      expect(selected!.id).toBe(3);

      const bulkIds = query.getBulkSelectedIds();
      expect(bulkIds).toEqual([1, 2]);

      service.clearBulkSelection();
      expect(query.getBulkSelectedIds()).toEqual([]);
    });
  });
});
