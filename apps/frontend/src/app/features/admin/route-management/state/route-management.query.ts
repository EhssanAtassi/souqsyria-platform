import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  RouteManagementState,
  RouteManagementStore,
  ViewMode
} from './route-management.store';
import {
  Route,
  RouteFilter,
  RouteStatus,
  CoverageStats,
  PaginationMeta,
  RouteTreeNode,
  PermissionCoverageItem,
  HttpMethod
} from '../models';

/**
 * Akita query service for route management
 * Provides observable selectors and computed state
 */
@Injectable()
export class RouteManagementQuery extends QueryEntity<RouteManagementState> {
  constructor(protected override store: RouteManagementStore) {
    super(store);
  }

  // ============================================================================
  // Basic Entity Selectors
  // ============================================================================

  /**
   * Select all routes
   */
  routes$ = this.selectAll();

  /**
   * Select total route count
   */
  routeCount$ = this.selectCount();

  /**
   * Select currently active/selected route
   * Using selectActive with MultiActiveState always returns array, so we need to map to single route
   */
  selectedRoute$: Observable<Route | undefined> = (this.selectActive() as Observable<Route | Route[]>).pipe(
    map((routes: Route | Route[]) => Array.isArray(routes) ? routes[0] : routes)
  );

  /**
   * Select route by ID
   * @param id Route identifier
   * @returns Observable with route or undefined
   */
  getRouteById$(id: string): Observable<Route | undefined> {
    return this.selectEntity(id);
  }

  // ============================================================================
  // UI State Selectors
  // ============================================================================

  /**
   * Select global loading state
   */
  loading$ = this.select(state => state.ui.loading);

  /**
   * Select per-route operation loading states
   */
  operationLoading$ = this.select(state => state.ui.operationLoading);

  /**
   * Select selected route ID
   */
  selectedRouteId$ = this.select(state => state.ui.selectedRouteId);

  /**
   * Select bulk selected route IDs
   */
  bulkSelectedIds$ = this.select(state => state.ui.bulkSelectedIds);

  /**
   * Select whether bulk selection is active
   */
  hasBulkSelection$: Observable<boolean> = this.select(
    state => state.ui.bulkSelectedIds.length > 0
  );

  /**
   * Select count of bulk selected routes
   */
  bulkSelectionCount$ = this.select(
    state => state.ui.bulkSelectedIds.length
  );

  /**
   * Select current view mode
   */
  viewMode$ = this.select(state => state.ui.viewMode);

  /**
   * Select bulk selection mode status
   */
  bulkSelectionMode$ = this.select(state => state.ui.bulkSelectionMode);

  /**
   * Check if specific route is being operated on
   * @param routeId Route identifier
   * @returns Observable with loading state
   */
  isRouteLoading$(routeId: string): Observable<boolean> {
    return this.select(state => state.ui.operationLoading[routeId] || false);
  }

  // ============================================================================
  // Filter & Pagination Selectors
  // ============================================================================

  /**
   * Select current filter configuration
   */
  filters$ = this.select(state => state.filters);

  /**
   * Select pagination metadata
   */
  pagination$ = this.select(state => state.pagination);

  /**
   * Check if any non-default filters are active
   */
  hasActiveFilters$: Observable<boolean> = this.select(state => state.filters).pipe(
    map(filters => this.hasActiveFilters(filters))
  );

  /**
   * Select current page number
   */
  currentPage$ = this.select(state => state.pagination.page);

  /**
   * Select page size
   */
  pageSize$ = this.select(state => state.pagination.limit);

  /**
   * Select total count across all pages
   */
  totalCount$ = this.select(state => state.pagination.totalCount);

  /**
   * Check if next page exists
   */
  hasNextPage$ = this.select(state => state.pagination.hasNextPage);

  /**
   * Check if previous page exists
   */
  hasPrevPage$ = this.select(state => state.pagination.hasPrevPage);

  // ============================================================================
  // Coverage Selectors
  // ============================================================================

  /**
   * Select full coverage statistics
   */
  coverage$ = this.select(state => state.coverage);

  /**
   * Select coverage percentage only
   */
  coveragePercentage$ = this.select(state => state.coverage.coveragePercentage);

  /**
   * Select mapped route count
   */
  mappedCount$ = this.select(state => state.coverage.mappedRoutes);

  /**
   * Select unmapped route count
   */
  unmappedCount$ = this.select(state => state.coverage.unmappedRoutes);

  /**
   * Select public route count
   */
  publicCount$ = this.select(state => state.coverage.publicRoutes);

  // ============================================================================
  // Cache Selectors
  // ============================================================================

  /**
   * Select cached route tree
   */
  routeTree$ = this.select(state => state.cache.routeTree);

  /**
   * Select cached permission coverage
   */
  permissionCoverage$ = this.select(state => state.cache.permissionCoverage);

  /**
   * Check if cache is valid
   */
  isCacheValid$: Observable<boolean> = this.select(state => state.cache).pipe(
    map(cache => {
      if (cache.isStale) return false;
      if (cache.lastFetched === null) return false;
      const age = Date.now() - cache.lastFetched;
      return age < cache.ttl;
    })
  );

  /**
   * Select cache age in milliseconds
   */
  cacheAge$: Observable<number | null> = this.select(state => state.cache).pipe(
    map(cache => {
      if (cache.lastFetched === null) return null;
      return Date.now() - cache.lastFetched;
    })
  );

  // ============================================================================
  // Filtered Data Selectors
  // ============================================================================

  /**
   * Select routes filtered by current filter configuration
   */
  filteredRoutes$: Observable<Route[]> = combineLatest([
    this.selectAll(),
    this.filters$
  ]).pipe(
    map(([routes, filters]) => this.applyFilters(routes, filters))
  );

  /**
   * Select only unmapped routes (no permission, not public)
   */
  unmappedRoutes$: Observable<Route[]> = this.selectAll({
    filterBy: route => !route.permissionId && !route.isPublic
  });

  /**
   * Select only public routes
   */
  publicRoutes$: Observable<Route[]> = this.selectAll({
    filterBy: route => route.isPublic === true
  });

  /**
   * Select only mapped routes (has permission)
   */
  mappedRoutes$: Observable<Route[]> = this.selectAll({
    filterBy: route => !!route.permissionId
  });

  /**
   * Select routes grouped by status
   */
  routesByStatus$: Observable<Record<RouteStatus, Route[]>> = this.selectAll().pipe(
    map(routes => ({
      mapped: routes.filter(r => !!r.permissionId),
      unmapped: routes.filter(r => !r.permissionId && !r.isPublic),
      public: routes.filter(r => r.isPublic)
    }))
  );

  /**
   * Select routes grouped by controller
   */
  routesByController$: Observable<Map<string, Route[]>> = this.selectAll().pipe(
    map(routes => {
      const grouped = new Map<string, Route[]>();
      routes.forEach(route => {
        const existing = grouped.get(route.controller) || [];
        grouped.set(route.controller, [...existing, route]);
      });
      return grouped;
    })
  );

  /**
   * Select routes grouped by HTTP method
   */
  routesByMethod$: Observable<Map<HttpMethod, Route[]>> = this.selectAll().pipe(
    map(routes => {
      const grouped = new Map<HttpMethod, Route[]>();
      routes.forEach(route => {
        const existing = grouped.get(route.method) || [];
        grouped.set(route.method, [...existing, route]);
      });
      return grouped;
    })
  );

  /**
   * Select unique controller names
   */
  controllers$: Observable<string[]> = this.selectAll().pipe(
    map(routes => {
      const controllers = new Set(routes.map(r => r.controller));
      return Array.from(controllers).sort();
    })
  );

  // ============================================================================
  // Bulk Selection Selectors
  // ============================================================================

  /**
   * Select bulk selected routes (full entities)
   */
  bulkSelectedRoutes$: Observable<Route[]> = combineLatest([
    this.selectAll(),
    this.bulkSelectedIds$
  ]).pipe(
    map(([routes, ids]) => routes.filter(r => ids.includes(r.id)))
  );

  /**
   * Check if all visible routes are selected
   */
  allVisibleSelected$: Observable<boolean> = combineLatest([
    this.filteredRoutes$,
    this.bulkSelectedIds$
  ]).pipe(
    map(([routes, ids]) => {
      if (routes.length === 0) return false;
      return routes.every(r => ids.includes(r.id));
    })
  );

  /**
   * Check if some (but not all) visible routes are selected
   */
  someVisibleSelected$: Observable<boolean> = combineLatest([
    this.filteredRoutes$,
    this.bulkSelectedIds$,
    this.allVisibleSelected$
  ]).pipe(
    map(([routes, ids, allSelected]) => {
      if (allSelected || routes.length === 0) return false;
      return routes.some(r => ids.includes(r.id));
    })
  );

  // ============================================================================
  // Snapshot Getters (Non-Observable)
  // ============================================================================

  /**
   * Get current route status
   * @param route Route to check
   * @returns Status classification
   */
  getRouteStatus(route: Route): RouteStatus {
    if (route.isPublic) return 'public';
    if (route.permissionId) return 'mapped';
    return 'unmapped';
  }

  /**
   * Check if route is in bulk selection
   * @param routeId Route identifier
   * @returns True if selected
   */
  isRouteSelected(routeId: string): boolean {
    return this.getValue().ui.bulkSelectedIds.includes(routeId);
  }

  /**
   * Get operation loading state for route
   * @param routeId Route identifier
   * @returns True if operation in progress
   */
  getOperationLoading(routeId: string): boolean {
    return this.getValue().ui.operationLoading[routeId] || false;
  }

  /**
   * Get current view mode
   * @returns Active view mode
   */
  getViewMode(): ViewMode {
    return this.getValue().ui.viewMode;
  }

  /**
   * Check if cache is currently valid
   * @returns True if cache can be used
   */
  isCacheValid(): boolean {
    const cache = this.getValue().cache;
    if (cache.isStale) return false;
    if (cache.lastFetched === null) return false;
    const age = Date.now() - cache.lastFetched;
    return age < cache.ttl;
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Apply filters to route array
   * @param routes Routes to filter
   * @param filters Filter configuration
   * @returns Filtered routes
   */
  private applyFilters(routes: Route[], filters: RouteFilter): Route[] {
    let filtered = routes;

    // Filter by HTTP method
    if (filters.method !== 'ALL') {
      filtered = filtered.filter(r => r.method === filters.method);
    }

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(r => {
        const status = this.getRouteStatus(r);
        return status === filters.status;
      });
    }

    // Filter by controller
    if (filters.controller) {
      filtered = filtered.filter(r => r.controller === filters.controller);
    }

    // Filter by permission
    if (filters.permissionId) {
      filtered = filtered.filter(r => r.permissionId === filters.permissionId);
    }

    // Filter by search term (path, controller, handler)
    if (filters.searchTerm.trim()) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.path.toLowerCase().includes(searchLower) ||
        r.controller.toLowerCase().includes(searchLower) ||
        r.handler.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }

  /**
   * Check if filters are in default state
   * @param filters Filter configuration
   * @returns True if any non-default filter is active
   */
  private hasActiveFilters(filters: RouteFilter): boolean {
    return (
      filters.method !== 'ALL' ||
      filters.status !== 'all' ||
      filters.controller !== null ||
      filters.permissionId !== null ||
      filters.searchTerm.trim().length > 0
    );
  }
}
