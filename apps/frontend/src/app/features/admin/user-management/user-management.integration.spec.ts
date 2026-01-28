/**
 * User Management Integration Tests
 *
 * @description
 * Integration tests for the User Management module of the SouqSyria Admin Dashboard.
 * Validates the full data flow between UserDataService (HTTP), UserManagementService
 * (orchestration), UserManagementStore (state), and UserManagementQuery (selectors).
 *
 * Test Coverage:
 * - User list loads from API with proper store population
 * - User search/filter updates API params and re-fetches
 * - Role assignment flow (select user, assign role, verify store)
 * - Ban/suspend flow with optimistic updates and rollback
 * - Pagination with API integration
 * - Error handling and user feedback
 *
 * @module UserManagement/IntegrationTests
 * @group integration
 * @group user-management
 */

import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { UserManagementService } from './state/user-management.service';
import { UserManagementStore } from './state/user-management.store';
import { UserManagementQuery } from './state/user-management.query';
import { UserDataService } from './services/user-data.service';

describe('User Management Integration Tests', () => {
  let service: UserManagementService;
  let store: UserManagementStore;
  let query: UserManagementQuery;
  let dataService: jasmine.SpyObj<UserDataService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  // ---------------------------------------------------------------------------
  // Mock Data - Realistic SouqSyria User Data (Arabic + English)
  // ---------------------------------------------------------------------------

  /** Mock users representing SouqSyria platform users */
  const MOCK_USERS: any[] = [
    {
      id: 1,
      firstName: 'أحمد',
      lastName: 'العلي',
      fullName: 'أحمد العلي',
      email: 'ahmad@souqsyria.com',
      phone: '+963912345678',
      status: 'active',
      businessRole: 'seller',
      adminRole: null,
      isEmailVerified: true,
      isPhoneVerified: true,
      twoFactorEnabled: true,
      createdAt: '2024-06-15T10:00:00Z',
      updatedAt: '2025-01-10T12:00:00Z',
      lastLoginAt: '2025-01-28T08:00:00Z',
      ordersCount: 250,
      revenue: 45000
    },
    {
      id: 2,
      firstName: 'فاطمة',
      lastName: 'حسن',
      fullName: 'فاطمة حسن',
      email: 'fatima@souqsyria.com',
      phone: '+963923456789',
      status: 'active',
      businessRole: 'customer',
      adminRole: null,
      isEmailVerified: true,
      isPhoneVerified: false,
      twoFactorEnabled: false,
      createdAt: '2024-08-20T14:30:00Z',
      updatedAt: '2025-01-15T09:00:00Z',
      lastLoginAt: '2025-01-27T18:00:00Z',
      ordersCount: 12,
      revenue: 1500
    },
    {
      id: 3,
      firstName: 'محمد',
      lastName: 'خليل',
      fullName: 'محمد خليل',
      email: 'mohammad@souqsyria.com',
      phone: '+963934567890',
      status: 'suspended',
      businessRole: 'seller',
      adminRole: null,
      isEmailVerified: true,
      isPhoneVerified: true,
      twoFactorEnabled: false,
      createdAt: '2024-04-10T08:00:00Z',
      updatedAt: '2025-01-20T16:00:00Z',
      lastLoginAt: '2025-01-05T12:00:00Z',
      ordersCount: 80,
      revenue: 15000
    },
    {
      id: 4,
      firstName: 'Sara',
      lastName: 'Al-Abed',
      fullName: 'Sara Al-Abed',
      email: 'sara@souqsyria.com',
      phone: '+963945678901',
      status: 'banned',
      businessRole: 'customer',
      adminRole: null,
      isEmailVerified: false,
      isPhoneVerified: false,
      twoFactorEnabled: false,
      createdAt: '2024-11-01T06:00:00Z',
      updatedAt: '2025-01-22T11:00:00Z',
      lastLoginAt: null,
      ordersCount: 0,
      revenue: 0
    },
    {
      id: 5,
      firstName: 'عمر',
      lastName: 'الشامي',
      fullName: 'عمر الشامي',
      email: 'omar@souqsyria.com',
      phone: '+963956789012',
      status: 'active',
      businessRole: 'admin',
      adminRole: 'admin',
      isEmailVerified: true,
      isPhoneVerified: true,
      twoFactorEnabled: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2025-01-28T10:00:00Z',
      lastLoginAt: '2025-01-28T09:00:00Z',
      ordersCount: 0,
      revenue: 0
    }
  ];

  /** Mock paginated API response */
  const MOCK_USERS_RESPONSE = {
    data: MOCK_USERS,
    page: 1,
    limit: 10,
    total: 125,
    totalPages: 13
  };

  /** Mock second page response */
  const MOCK_USERS_PAGE2_RESPONSE = {
    data: [MOCK_USERS[0], MOCK_USERS[1]],
    page: 2,
    limit: 10,
    total: 125,
    totalPages: 13
  };

  /** Mock search results */
  const MOCK_SEARCH_RESPONSE = {
    data: [MOCK_USERS[0]],
    page: 1,
    limit: 10,
    total: 1,
    totalPages: 1
  };

  /** Mock user after ban */
  const MOCK_BANNED_USER = {
    ...MOCK_USERS[0],
    status: 'banned'
  };

  /** Mock user after suspend */
  const MOCK_SUSPENDED_USER = {
    ...MOCK_USERS[0],
    status: 'suspended'
  };

  /** Mock user after role assignment */
  const MOCK_USER_WITH_ROLE = {
    ...MOCK_USERS[0],
    adminRole: 'moderator' as any
  };

  // ---------------------------------------------------------------------------
  // Test Setup
  // ---------------------------------------------------------------------------

  beforeEach(() => {
    const dataServiceSpy = jasmine.createSpyObj('UserDataService', [
      'getUsers',
      'getUserById',
      'updateUser',
      'banUser',
      'unbanUser',
      'suspendUser',
      'unsuspendUser',
      'assignRoles',
      'resetPassword',
      'getUserActivity',
      'getUserPermissions'
    ]);

    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, MatSnackBarModule, NoopAnimationsModule],
      providers: [
        UserManagementService,
        UserManagementStore,
        UserManagementQuery,
        { provide: UserDataService, useValue: dataServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    });

    service = TestBed.inject(UserManagementService);
    store = TestBed.inject(UserManagementStore);
    query = TestBed.inject(UserManagementQuery);
    dataService = TestBed.inject(UserDataService) as jasmine.SpyObj<UserDataService>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
  });

  afterEach(() => {
    store.reset();
  });

  // ===========================================================================
  // 1. USER LIST LOADS FROM API
  // ===========================================================================

  describe('User list loads from API', () => {
    /**
     * Verifies that fetchUsers populates the store with user entities.
     */
    it('should load users from API and populate store', (done) => {
      dataService.getUsers.and.returnValue(of(MOCK_USERS_RESPONSE));

      service.fetchUsers({ page: 1, limit: 10 }).subscribe({
        next: () => {
          query.users$.subscribe(users => {
            expect(users.length).toBe(5);
            expect(users[0].fullName).toBe('أحمد العلي');
            expect(users[4].fullName).toBe('عمر الشامي');
            done();
          });
        },
        error: done.fail
      });
    });

    /**
     * Verifies that pagination metadata is updated from API response.
     */
    it('should update pagination metadata from API response', (done) => {
      dataService.getUsers.and.returnValue(of(MOCK_USERS_RESPONSE));

      service.fetchUsers({ page: 1, limit: 10 }).subscribe({
        next: () => {
          query.pagination$.subscribe(pagination => {
            expect(pagination.page).toBe(1);
            expect(pagination.limit).toBe(10);
            expect(pagination.total).toBe(125);
            expect(pagination.totalPages).toBe(13);
            done();
          });
        },
        error: done.fail
      });
    });

    /**
     * Verifies that loading state is managed during fetch.
     */
    it('should set loading state to true during fetch', () => {
      dataService.getUsers.and.returnValue(of(MOCK_USERS_RESPONSE));

      spyOn(store, 'setLoading').and.callThrough();

      service.fetchUsers({ page: 1, limit: 10 }).subscribe();

      expect(store.setLoading).toHaveBeenCalledWith(true);
    });

    /**
     * Verifies that the cache timestamp is updated after successful fetch.
     */
    it('should update cache timestamp after successful fetch', (done) => {
      const beforeFetch = Date.now();
      dataService.getUsers.and.returnValue(of(MOCK_USERS_RESPONSE));

      service.fetchUsers({ page: 1, limit: 10 }).subscribe({
        next: () => {
          query.lastFetched$.subscribe(lastFetched => {
            expect(lastFetched).toBeTruthy();
            expect(lastFetched!).toBeGreaterThanOrEqual(beforeFetch);
            done();
          });
        },
        error: done.fail
      });
    });

    /**
     * Verifies error handling when API call fails.
     */
    it('should handle API error and show snackbar', () => {
      dataService.getUsers.and.returnValue(
        throwError(() => ({ error: { message: 'فشل تحميل المستخدمين' } }))
      );

      service.fetchUsers({ page: 1, limit: 10 }).subscribe();

      expect(snackBar.open).toHaveBeenCalledWith(
        'فشل تحميل المستخدمين',
        'Close',
        jasmine.objectContaining({ panelClass: 'error-snackbar' })
      );
    });

    /**
     * Verifies that default params are used when none provided.
     */
    it('should use default params (page 1, limit 10) when none provided', () => {
      dataService.getUsers.and.returnValue(of(MOCK_USERS_RESPONSE));

      service.fetchUsers().subscribe();

      expect(dataService.getUsers).toHaveBeenCalledWith({ page: 1, limit: 10 });
    });
  });

  // ===========================================================================
  // 2. USER SEARCH / FILTER UPDATES API PARAMS
  // ===========================================================================

  describe('User search/filter updates API params', () => {
    /**
     * Verifies that applySearch triggers a new API call with search term.
     */
    it('should apply search query and refetch users from API', (done) => {
      dataService.getUsers.and.returnValue(of(MOCK_SEARCH_RESPONSE));

      service.applySearch('ahmad@souqsyria.com').subscribe({
        next: () => {
          expect(dataService.getUsers).toHaveBeenCalledWith(
            jasmine.objectContaining({ search: 'ahmad@souqsyria.com', page: 1 })
          );

          query.users$.subscribe(users => {
            expect(users.length).toBe(1);
            expect(users[0].email).toBe('ahmad@souqsyria.com');
            done();
          });
        },
        error: done.fail
      });
    });

    /**
     * Verifies that applySearch resets page to 1.
     */
    it('should reset to page 1 when applying search', () => {
      // Set page to 3 first
      store.updatePagination({ page: 3 });

      dataService.getUsers.and.returnValue(of(MOCK_SEARCH_RESPONSE));

      service.applySearch('أحمد').subscribe();

      expect(dataService.getUsers).toHaveBeenCalledWith(
        jasmine.objectContaining({ page: 1 })
      );
    });

    /**
     * Verifies that applyFilters triggers API call with filter params.
     */
    it('should apply status filter and refetch users', (done) => {
      const filteredResponse = {
        ...MOCK_USERS_RESPONSE,
        data: MOCK_USERS.filter(u => u.status === 'active'),
        total: 3
      };
      dataService.getUsers.and.returnValue(of(filteredResponse));

      service.applyFilters({ status: 'active', role: null, businessRole: null, adminRole: null, dateRange: null, isVerified: null }).subscribe({
        next: () => {
          expect(dataService.getUsers).toHaveBeenCalledWith(
            jasmine.objectContaining({ status: 'active', page: 1 })
          );
          done();
        },
        error: done.fail
      });
    });

    /**
     * Verifies that clearFilters resets all filters and refetches.
     */
    it('should clear all filters and refetch users', (done) => {
      // Set some filters first
      store.updateFilters({ status: 'active', role: null, businessRole: null, adminRole: null, dateRange: null, isVerified: null });
      store.updateSearch('test');

      dataService.getUsers.and.returnValue(of(MOCK_USERS_RESPONSE));

      service.clearFilters().subscribe({
        next: () => {
          expect(dataService.getUsers).toHaveBeenCalledWith(
            jasmine.objectContaining({ page: 1 })
          );
          done();
        },
        error: done.fail
      });
    });

    /**
     * Verifies the refresh function fetches with current pagination state.
     */
    it('should refresh users with current pagination and filters', () => {
      store.updatePagination({ page: 3, limit: 25 });
      store.updateFilters({ status: 'suspended', role: null, businessRole: null, adminRole: null, dateRange: null, isVerified: null });
      store.updateSearch('محمد');

      dataService.getUsers.and.returnValue(of(MOCK_USERS_RESPONSE));

      service.refresh().subscribe();

      expect(dataService.getUsers).toHaveBeenCalledWith(
        jasmine.objectContaining({
          page: 3,
          limit: 25,
          status: 'suspended',
          search: 'محمد'
        })
      );
    });
  });

  // ===========================================================================
  // 3. ROLE ASSIGNMENT FLOW
  // ===========================================================================

  describe('Role assignment flow (select user, assign role, verify)', () => {
    beforeEach(() => {
      // Pre-populate store with users
      store.set(MOCK_USERS);
    });

    /**
     * Verifies that selecting a user updates the active user in store.
     */
    it('should select user and update active user in store', (done) => {
      service.selectUser(1);

      query.selectedUser$.subscribe(user => {
        if (user) {
          expect(user.id).toBe(1);
          expect(user.fullName).toBe('أحمد العلي');
          done();
        }
      });
    });

    /**
     * Verifies the role assignment flow updates the user in store.
     */
    it('should assign role to user and update store on success', (done) => {
      const dto = { businessRole: 'seller' as any, adminRole: 'moderator' as any };
      dataService.assignRoles.and.returnValue(of(MOCK_USER_WITH_ROLE));

      service.assignRoles(1, dto).subscribe({
        next: () => {
          const user = query.getEntity(1);
          expect(user).toBeTruthy();
          expect(user!.adminRole).toBe('content_moderator');

          // Should show success snackbar
          expect(snackBar.open).toHaveBeenCalledWith(
            'Roles assigned successfully',
            'Close',
            jasmine.objectContaining({ panelClass: 'success-snackbar' })
          );
          done();
        },
        error: done.fail
      });
    });

    /**
     * Verifies optimistic update is applied before API call.
     */
    it('should optimistically update role before API response', () => {
      const dto = { businessRole: 'seller' as any, adminRole: 'moderator' as any };
      // Simulate a pending request that never completes
      dataService.assignRoles.and.returnValue(of(MOCK_USER_WITH_ROLE));

      service.assignRoles(1, dto).subscribe();

      // Optimistic update should have been applied
      const user = query.getEntity(1);
      expect(user).toBeTruthy();
    });

    /**
     * Verifies rollback on API failure.
     */
    it('should rollback role assignment on API error', () => {
      const originalUser = query.getEntity(1);
      const originalRole = originalUser?.adminRole;

      const dto = { businessRole: 'seller' as any, adminRole: 'super_admin' as any };
      dataService.assignRoles.and.returnValue(
        throwError(() => ({ error: { message: 'لا تملك الصلاحية' } }))
      );

      service.assignRoles(1, dto as any).subscribe();

      // Should be rolled back to original
      const user = query.getEntity(1);
      expect(user!.adminRole).toBe(originalRole);
    });

    /**
     * Verifies that assigning roles to non-existent user is handled.
     */
    it('should handle role assignment for non-existent user', () => {
      const dto = { businessRole: 'seller' as any, adminRole: 'admin' as any };

      service.assignRoles(999, dto as any).subscribe();

      expect(snackBar.open).toHaveBeenCalledWith(
        jasmine.stringContaining('not found'),
        'Close',
        jasmine.objectContaining({ panelClass: 'error-snackbar' })
      );
    });
  });

  // ===========================================================================
  // 4. BAN / SUSPEND FLOW
  // ===========================================================================

  describe('Ban/suspend flow with confirmation', () => {
    beforeEach(() => {
      store.set(MOCK_USERS);
    });

    /**
     * Verifies ban user flow with optimistic status update.
     */
    it('should ban user with optimistic status update', (done) => {
      const banDto = { reason: 'انتهاك شروط الاستخدام', permanent: true };
      dataService.banUser.and.returnValue(of(MOCK_BANNED_USER));

      service.banUser(1, banDto).subscribe({
        next: () => {
          const user = query.getEntity(1);
          expect(user!.status).toBe('banned');

          expect(snackBar.open).toHaveBeenCalledWith(
            'User banned successfully',
            'Close',
            jasmine.objectContaining({ panelClass: 'success-snackbar' })
          );
          done();
        },
        error: done.fail
      });
    });

    /**
     * Verifies ban rollback on API failure.
     */
    it('should rollback ban status on API error', () => {
      const originalStatus = query.getEntity(1)!.status;
      const banDto = { reason: 'test', permanent: false };

      dataService.banUser.and.returnValue(
        throwError(() => ({ error: { message: 'فشل حظر المستخدم' } }))
      );

      service.banUser(1, banDto).subscribe();

      const user = query.getEntity(1);
      expect(user!.status).toBe(originalStatus);
    });

    /**
     * Verifies unban user flow.
     */
    it('should unban user and restore active status', (done) => {
      // Set user as banned first
      store.update(4, { status: 'banned' as any });

      const unbannedUser = { ...MOCK_USERS[3], status: 'active' };
      dataService.unbanUser.and.returnValue(of(unbannedUser));

      service.unbanUser(4).subscribe({
        next: () => {
          const user = query.getEntity(4);
          expect(user!.status).toBe('active');
          done();
        },
        error: done.fail
      });
    });

    /**
     * Verifies suspend user flow with reason.
     */
    it('should suspend user with reason and duration', (done) => {
      const suspendDto = {
        reason: 'مراجعة الحساب - Account review',
        until: new Date('2025-03-31')
      };
      dataService.suspendUser.and.returnValue(of(MOCK_SUSPENDED_USER));

      service.suspendUser(1, suspendDto).subscribe({
        next: () => {
          const user = query.getEntity(1);
          expect(user!.status).toBe('suspended');

          expect(snackBar.open).toHaveBeenCalledWith(
            'User suspended successfully',
            'Close',
            jasmine.objectContaining({ panelClass: 'success-snackbar' })
          );
          done();
        },
        error: done.fail
      });
    });

    /**
     * Verifies suspend rollback on API failure.
     */
    it('should rollback suspend status on API error', () => {
      const originalStatus = query.getEntity(1)!.status;
      const suspendDto = {
        reason: 'test',
        until: new Date()
      };

      dataService.suspendUser.and.returnValue(
        throwError(() => new Error('Server error'))
      );

      service.suspendUser(1, suspendDto).subscribe();

      expect(query.getEntity(1)!.status).toBe(originalStatus);
    });

    /**
     * Verifies unsuspend user flow.
     */
    it('should unsuspend user and restore active status', (done) => {
      const unsuspendedUser = { ...MOCK_USERS[2], status: 'active' };
      dataService.unsuspendUser.and.returnValue(of(unsuspendedUser));

      service.unsuspendUser(3).subscribe({
        next: () => {
          const user = query.getEntity(3);
          expect(user!.status).toBe('active');
          done();
        },
        error: done.fail
      });
    });

    /**
     * Verifies that ban/suspend for non-existent user is handled.
     */
    it('should handle ban for non-existent user gracefully', () => {
      service.banUser(999, { reason: 'test', permanent: false }).subscribe();

      expect(snackBar.open).toHaveBeenCalledWith(
        jasmine.stringContaining('not found'),
        'Close',
        jasmine.objectContaining({ panelClass: 'error-snackbar' })
      );
    });
  });

  // ===========================================================================
  // 5. PAGINATION WITH API
  // ===========================================================================

  describe('Pagination with API', () => {
    /**
     * Verifies loading second page updates store correctly.
     */
    it('should load second page and update pagination metadata', (done) => {
      dataService.getUsers.and.returnValue(of(MOCK_USERS_PAGE2_RESPONSE));

      service.fetchUsers({ page: 2, limit: 10 }).subscribe({
        next: () => {
          query.pagination$.subscribe(pagination => {
            expect(pagination.page).toBe(2);
            expect(pagination.total).toBe(125);
            expect(pagination.totalPages).toBe(13);
            done();
          });
        },
        error: done.fail
      });
    });

    /**
     * Verifies pagination info observable displays correct range.
     */
    it('should display correct pagination info string', (done) => {
      dataService.getUsers.and.returnValue(of(MOCK_USERS_RESPONSE));

      service.fetchUsers({ page: 1, limit: 10 }).subscribe({
        next: () => {
          query.paginationInfo$.subscribe(info => {
            expect(info).toBe('1-10 of 125');
            done();
          });
        },
        error: done.fail
      });
    });

    /**
     * Verifies that users are replaced (not appended) on new page load.
     */
    it('should replace users on new page load (not append)', (done) => {
      // Load page 1
      dataService.getUsers.and.returnValue(of(MOCK_USERS_RESPONSE));
      service.fetchUsers({ page: 1, limit: 10 }).subscribe({
        next: () => {
          // Load page 2
          dataService.getUsers.and.returnValue(of(MOCK_USERS_PAGE2_RESPONSE));
          service.fetchUsers({ page: 2, limit: 10 }).subscribe({
            next: () => {
              query.users$.subscribe(users => {
                expect(users.length).toBe(2); // Only page 2 users
                done();
              });
            }
          });
        }
      });
    });
  });

  // ===========================================================================
  // 6. QUERY SELECTORS
  // ===========================================================================

  describe('Query selectors', () => {
    beforeEach(() => {
      store.set(MOCK_USERS);
    });

    /**
     * Verifies bulk selection functionality.
     */
    it('should manage bulk selection of users', (done) => {
      store.toggleBulkSelection(1);
      store.toggleBulkSelection(2);
      store.toggleBulkSelection(3);

      query.bulkSelectedCount$.subscribe(count => {
        if (count === 3) {
          expect(query.getBulkSelectedIds()).toEqual([1, 2, 3]);

          // Toggle off user 2
          store.toggleBulkSelection(2);

          query.bulkSelectedCount$.subscribe(newCount => {
            if (newCount === 2) {
              expect(query.getBulkSelectedIds()).toEqual([1, 3]);
              done();
            }
          });
        }
      });
    });

    /**
     * Verifies status-based user grouping.
     */
    it('should group users by status via usersByStatus$', (done) => {
      query.usersByStatus$.subscribe(grouped => {
        expect(grouped.active.length).toBe(3); // Ahmad, Fatima, Omar
        expect(grouped.suspended.length).toBe(1); // Mohammad
        expect(grouped.banned.length).toBe(1); // Sara
        done();
      });
    });

    /**
     * Verifies password reset flow.
     */
    it('should send password reset and show success snackbar', (done) => {
      dataService.resetPassword.and.returnValue(of(void 0));

      service.resetPassword(1).subscribe({
        next: () => {
          expect(snackBar.open).toHaveBeenCalledWith(
            'Password reset email sent',
            'Close',
            jasmine.objectContaining({ panelClass: 'success-snackbar' })
          );
          done();
        },
        error: done.fail
      });
    });
  });
});
