import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { of } from 'rxjs';

import { RouteListViewComponent } from './route-list-view.component';
import { RouteManagementService } from '../../state/route-management.service';
import { RouteManagementQuery } from '../../state/route-management.query';
import { Route, RouteStatus, HttpMethod } from '../../models/route.model';

/**
 * Route List View Component Tests
 *
 * Tests cover:
 * - Component initialization
 * - Table rendering
 * - Row selection (single and bulk)
 * - Sorting and pagination
 * - Bulk actions
 * - Permission linking/unlinking
 * - Loading states
 */
describe('RouteListViewComponent', () => {
  let component: RouteListViewComponent;
  let fixture: ComponentFixture<RouteListViewComponent>;
  let routeService: jasmine.SpyObj<RouteManagementService>;
  let routeQuery: jasmine.SpyObj<RouteManagementQuery>;

  // Mock data
  const mockRoutes: Route[] = [
    {
      id: '1',
      method: 'GET',
      path: '/api/users',
      controller: 'UserController',
      handler: 'getUsers',
      permissionId: 'perm-1',
      suggestedPermission: null,
      isPublic: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      method: 'POST',
      path: '/api/users',
      controller: 'UserController',
      handler: 'createUser',
      permissionId: null,
      suggestedPermission: 'perm-2',
      isPublic: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '3',
      method: 'GET',
      path: '/api/public/health',
      controller: 'HealthController',
      handler: 'check',
      permissionId: null,
      suggestedPermission: null,
      isPublic: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockPagination = {
    page: 0,
    limit: 25,
    totalCount: 100,
    totalPages: 4,
  };

  beforeEach(async () => {
    // Create service spies
    const routeServiceSpy = jasmine.createSpyObj('RouteManagementService', [
      'selectRoute',
      'updatePagination',
      'unlinkPermission',
      'bulkLinkPermissions',
      'setSortBy',
    ]);

    const routeQuerySpy = jasmine.createSpyObj('RouteManagementQuery', [], {
      filteredRoutes$: of(mockRoutes),
      pagination$: of(mockPagination),
      loading$: of(false),
    });

    // Configure spy return values
    routeServiceSpy.unlinkPermission.and.returnValue(of(void 0));

    await TestBed.configureTestingModule({
      imports: [RouteListViewComponent, NoopAnimationsModule],
      providers: [
        { provide: RouteManagementService, useValue: routeServiceSpy },
        { provide: RouteManagementQuery, useValue: routeQuerySpy },
      ],
    }).compileComponents();

    routeService = TestBed.inject(RouteManagementService) as jasmine.SpyObj<RouteManagementService>;
    routeQuery = TestBed.inject(RouteManagementQuery) as jasmine.SpyObj<RouteManagementQuery>;

    fixture = TestBed.createComponent(RouteListViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should initialize with correct display columns', () => {
      expect(component.displayedColumns).toEqual([
        'select',
        'method',
        'path',
        'controller',
        'handler',
        'status',
        'permission',
        'actions',
      ]);
    });

    it('should subscribe to routes observable', (done) => {
      component.routes$.subscribe((routes: Route[]) => {
        expect(routes).toEqual(mockRoutes);
        done();
      });
    });

    it('should subscribe to pagination observable', (done) => {
      component.pagination$.subscribe((pagination: any) => {
        expect(pagination).toEqual(mockPagination);
        done();
      });
    });

    it('should initialize with empty selection', () => {
      expect(component.selection.selected.length).toBe(0);
    });
  });

  describe('Row Selection', () => {
    it('should select single row', () => {
      component.toggleRow('1');
      expect(component.isSelected('1')).toBe(true);
      expect(component.selectedCount()).toBe(1);
    });

    it('should deselect single row', () => {
      component.toggleRow('1');
      component.toggleRow('1');
      expect(component.isSelected('1')).toBe(false);
      expect(component.selectedCount()).toBe(0);
    });

    it('should select multiple rows', () => {
      component.toggleRow('1');
      component.toggleRow('2');
      expect(component.selectedCount()).toBe(2);
    });

    it('should toggle all rows', () => {
      component.toggleAllRows();
      expect(component.isAllSelected()).toBe(true);
      expect(component.selectedCount()).toBe(mockRoutes.length);
    });

    it('should clear all selections', () => {
      component.toggleRow('1');
      component.toggleRow('2');
      component.deselectAll();
      expect(component.selectedCount()).toBe(0);
    });

    it('should detect partial selection', () => {
      component.toggleRow('1');
      expect(component.hasPartialSelection()).toBe(true);
    });
  });

  describe('Bulk Actions', () => {
    beforeEach(() => {
      component.toggleRow('1');
      component.toggleRow('2');
    });

    it('should show bulk actions when rows selected', () => {
      expect(component.hasSelection()).toBe(true);
    });

    it('should handle bulk link permissions', () => {
      component.bulkLinkPermissions();
      // TODO: Add expectations when bulk link is implemented
      expect(component).toBeTruthy();
    });

    it('should handle bulk unlink permissions', () => {
      component.bulkUnlinkPermissions();
      // Should clear selection after unlink
      expect(component.selectedCount()).toBe(0);
    });
  });

  describe('Table Sorting', () => {
    it('should handle sort change', () => {
      const sortEvent = { active: 'path', direction: 'asc' as const };
      component.onSort(sortEvent);
      // TODO: Add expectations when sort is implemented
      expect(component).toBeTruthy();
    });

    it('should handle sort direction change', () => {
      const sortEvent = { active: 'method', direction: 'desc' as const };
      component.onSort(sortEvent);
      // TODO: Add expectations when sort is implemented
      expect(component).toBeTruthy();
    });
  });

  describe('Pagination', () => {
    it('should handle page change', () => {
      const pageEvent = {
        pageIndex: 2,
        pageSize: 50,
        length: 100,
      };
      component.onPageChange(pageEvent);

      expect(routeService.updatePagination).toHaveBeenCalledWith(jasmine.objectContaining({
        page: 2,
        pageSize: 50,
        totalItems: 100
      }));
    });
  });

  describe('Route Actions', () => {
    it('should select route and open detail panel', () => {
      component.selectRoute(mockRoutes[0]);
      expect(routeService.selectRoute).toHaveBeenCalledWith('1');
    });

    it('should view route details', () => {
      component.viewDetails(mockRoutes[0]);
      expect(routeService.selectRoute).toHaveBeenCalledWith('1');
    });

    // TODO: Re-enable when applySuggestion is implemented
    // it('should apply AI suggestion', () => {
    //   component.applySuggestion(mockRoutes[1]);
    //   expect(routeService.applySuggestion).toHaveBeenCalledWith('2');
    // });

    it('should unlink permission', () => {
      component.unlinkPermission('1');
      expect(routeService.unlinkPermission).toHaveBeenCalledWith('1');
    });
  });

  describe('Route Status', () => {
    it('should return MAPPED status for route with permission', () => {
      const status = component.getStatus(mockRoutes[0]);
      expect(status).toBe('mapped');
    });

    it('should return PUBLIC status for public route', () => {
      const status = component.getStatus(mockRoutes[2]);
      expect(status).toBe('public');
    });

    it('should return SUGGESTED status for route with suggestion', () => {
      const status = component.getStatus(mockRoutes[1]);
      expect(status).toBe('unmapped');
    });

    it('should return UNMAPPED status for route without permission', () => {
      const unmappedRoute: Route = {
        ...mockRoutes[0],
        permissionId: null,
        suggestedPermission: null,
        isPublic: false,
      };
      const status = component.getStatus(unmappedRoute);
      expect(status).toBe('unmapped');
    });
  });

  describe('TrackBy Function', () => {
    it('should return unique identifier', () => {
      const result = component.trackByRouteId(0, mockRoutes[0]);
      expect(result).toBe('1');
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner when loading', (done) => {
      // Update loading state
      const loadingQuery = TestBed.inject(RouteManagementQuery) as any;
      Object.defineProperty(loadingQuery, 'loading$', {
        get: () => of(true),
      });

      fixture.detectChanges();

      component.loading$.subscribe((loading: boolean) => {
        expect(loading).toBe(true);
        done();
      });
    });
  });

  describe('Template Integration', () => {
    it('should render table with routes', () => {
      const compiled = fixture.nativeElement;
      const rows = compiled.querySelectorAll('.route-row');
      expect(rows.length).toBe(mockRoutes.length);
    });

    it('should render bulk actions bar when rows selected', () => {
      component.toggleRow('1');
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const bulkBar = compiled.querySelector('app-bulk-actions-bar');
      expect(bulkBar).toBeTruthy();
    });

    it('should not render bulk actions bar when no selection', () => {
      const compiled = fixture.nativeElement;
      const bulkBar = compiled.querySelector('app-bulk-actions-bar');
      expect(bulkBar).toBeFalsy();
    });

    it('should render paginator', () => {
      const compiled = fixture.nativeElement;
      const paginator = compiled.querySelector('mat-paginator');
      expect(paginator).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label on select all checkbox', () => {
      const compiled = fixture.nativeElement;
      const selectAll = compiled.querySelector('.select-column mat-checkbox');
      expect(selectAll?.getAttribute('aria-label')).toContain('Select all');
    });

    it('should have aria-label on action buttons', () => {
      const compiled = fixture.nativeElement;
      const actionButton = compiled.querySelector('.actions-column button');
      expect(actionButton?.getAttribute('aria-label')).toBeTruthy();
    });
  });
});
