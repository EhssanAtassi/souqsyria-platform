import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, throwError, of, forkJoin } from 'rxjs';
import {
  catchError,
  tap,
  map,
  switchMap,
  finalize,
  debounceTime,
  distinctUntilChanged
} from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouteManagementStore, ViewMode } from './route-management.store';
import { RouteManagementQuery } from './route-management.query';
import { RouteDataService } from '../services/route-data.service';
import {
  Route,
  RouteFilter,
  QueryRoutesDto,
  RoutePermissionMapping,
  AutoMappingResult,
  AutoMappingSuggestion,
  RouteTreeNode,
  filtersToQueryDto
} from '../models';
import { buildRouteTree } from '../utils/route-tree-builder.utils';

/**
 * Orchestrator service for route management
 * Coordinates between store, query, and data service
 * Implements business logic and optimistic updates
 */
@Injectable()
export class RouteManagementService {
  private readonly store = inject(RouteManagementStore);
  private readonly query = inject(RouteManagementQuery);
  private readonly dataService = inject(RouteDataService);
  private readonly snackBar = inject(MatSnackBar);

  constructor() {
    // Auto-refresh when filters change (debounced)
    this.query.filters$
      .pipe(
        debounceTime(300),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        takeUntilDestroyed()
      )
      .subscribe(filters => {
        const page = this.query.getValue().pagination.page;
        const limit = this.query.getValue().pagination.limit;
        this.fetchRoutes(filtersToQueryDto(filters, page, limit)).subscribe();
      });
  }

  // ============================================================================
  // Discovery & Fetching
  // ============================================================================

  /**
   * Trigger route discovery from NestJS metadata
   * Scans all controllers and creates/updates routes
   * @returns Observable that completes when discovery finishes
   */
  discoverRoutes(): Observable<void> {
    this.store.setLoading(true);

    return this.dataService.discoverRoutes().pipe(
      tap(response => {
        if (response.success && response.data) {
          this.store.set(response.data);
          this.store.updateCacheTimestamp();
          this.showSuccess(`Discovered ${response.data.length} routes`);
        }
      }),
      map(() => void 0),
      catchError(error => {
        this.showError('Failed to discover routes', error);
        return throwError(() => error);
      }),
      finalize(() => this.store.setLoading(false))
    );
  }

  /**
   * Fetch routes with optional filtering and pagination
   * @param params Query parameters
   * @returns Observable that completes when fetch finishes
   */
  fetchRoutes(params?: QueryRoutesDto): Observable<void> {
    // Check cache validity
    if (!params && this.query.isCacheValid()) {
      return of(void 0);
    }

    this.store.setLoading(true);

    return this.dataService.getRoutes(params).pipe(
      tap(response => {
        this.store.set(response.data);
        this.store.updatePagination(response.pagination);
        this.store.updateCacheTimestamp();
      }),
      switchMap(() => this.fetchCoverageStats()),
      map(() => void 0),
      catchError(error => {
        this.showError('Failed to fetch routes', error);
        return throwError(() => error);
      }),
      finalize(() => this.store.setLoading(false))
    );
  }

  /**
   * Refresh routes (force fetch ignoring cache)
   * @returns Observable that completes when refresh finishes
   */
  refreshRoutes(): Observable<void> {
    this.store.invalidateCache();
    const filters = this.query.getValue().filters;
    const page = this.query.getValue().pagination.page;
    const limit = this.query.getValue().pagination.limit;
    return this.fetchRoutes(filtersToQueryDto(filters, page, limit));
  }

  // ============================================================================
  // Permission Linking (Optimistic Updates)
  // ============================================================================

  /**
   * Link a permission to a route with optimistic update
   * @param routeId Route to link
   * @param permissionId Permission to assign
   * @returns Observable that completes when operation finishes
   */
  linkPermission(routeId: string, permissionId: string): Observable<void> {
    const route = this.query.getEntity(routeId);
    if (!route) {
      return throwError(() => new Error('Route not found'));
    }

    // Store original state for rollback
    const originalPermissionId = route.permissionId;
    const originalIsPublic = route.isPublic;

    // Optimistic update
    this.store.update(routeId, {
      permissionId,
      isPublic: false
    });
    this.store.setOperationLoading(routeId, true);

    return this.dataService.linkPermission({ routeId, permissionId }).pipe(
      tap(() => {
        this.showSuccess('Permission linked successfully');
        this.store.invalidateCache();
      }),
      switchMap(() => this.fetchCoverageStats()),
      map(() => void 0),
      catchError(error => {
        // Rollback on error
        this.store.update(routeId, {
          permissionId: originalPermissionId,
          isPublic: originalIsPublic
        });
        this.showError('Failed to link permission', error);
        return throwError(() => error);
      }),
      finalize(() => this.store.setOperationLoading(routeId, false))
    );
  }

  /**
   * Remove permission from a route with optimistic update
   * @param routeId Route to unlink
   * @returns Observable that completes when operation finishes
   */
  unlinkPermission(routeId: string): Observable<void> {
    const route = this.query.getEntity(routeId);
    if (!route) {
      return throwError(() => new Error('Route not found'));
    }

    // Store original state for rollback
    const originalPermissionId = route.permissionId;

    // Optimistic update
    this.store.update(routeId, { permissionId: null });
    this.store.setOperationLoading(routeId, true);

    return this.dataService.unlinkPermission(routeId).pipe(
      tap(() => {
        this.showSuccess('Permission unlinked successfully');
        this.store.invalidateCache();
      }),
      switchMap(() => this.fetchCoverageStats()),
      map(() => void 0),
      catchError(error => {
        // Rollback on error
        this.store.update(routeId, { permissionId: originalPermissionId });
        this.showError('Failed to unlink permission', error);
        return throwError(() => error);
      }),
      finalize(() => this.store.setOperationLoading(routeId, false))
    );
  }

  /**
   * Bulk link permissions to multiple routes
   * @param mappings Array of route-permission mappings
   * @returns Observable that completes when operation finishes
   */
  bulkLinkPermissions(mappings: RoutePermissionMapping[]): Observable<void> {
    this.store.setLoading(true);

    // Store original state for rollback
    const originalStates = mappings.map(m => ({
      routeId: m.routeId,
      original: this.query.getEntity(m.routeId)
    }));

    // Optimistic updates
    mappings.forEach(mapping => {
      this.store.update(mapping.routeId, {
        permissionId: mapping.permissionId,
        isPublic: false
      });
    });

    return this.dataService.bulkLinkPermissions(mappings).pipe(
      tap(response => {
        if (response.success) {
          this.showSuccess(`Successfully linked ${response.data.created} permissions`);
          this.store.invalidateCache();
        }
      }),
      switchMap(() => forkJoin([
        this.refreshRoutes(),
        this.fetchCoverageStats()
      ])),
      map(() => void 0),
      catchError(error => {
        // Rollback on error
        originalStates.forEach(({ routeId, original }) => {
          if (original) {
            this.store.update(routeId, {
              permissionId: original.permissionId,
              isPublic: original.isPublic
            });
          }
        });
        this.showError('Failed to bulk link permissions', error);
        return throwError(() => error);
      }),
      finalize(() => this.store.setLoading(false))
    );
  }

  // ============================================================================
  // Auto-Mapping
  // ============================================================================

  /**
   * Generate auto-mapping suggestions using AI
   * @returns Observable with auto-mapping results
   */
  generateAutoMappings(): Observable<AutoMappingResult> {
    this.store.setLoading(true);

    return this.dataService.generateAutoMappings().pipe(
      map(response => response.data),
      tap(result => {
        this.showSuccess(`Generated ${result.totalSuggestions} suggestions`);
      }),
      catchError(error => {
        this.showError('Failed to generate auto-mappings', error);
        return throwError(() => error);
      }),
      finalize(() => this.store.setLoading(false))
    );
  }

  /**
   * Apply approved auto-mapping suggestions
   * @param suggestions Approved suggestions to apply
   * @returns Observable that completes when operation finishes
   */
  applyAutoMappings(suggestions: AutoMappingSuggestion[]): Observable<void> {
    const approvedSuggestions = suggestions.filter(s => s.approved);

    if (approvedSuggestions.length === 0) {
      this.showWarning('No suggestions approved');
      return of(void 0);
    }

    const mappings: RoutePermissionMapping[] = approvedSuggestions.map(s => ({
      routeId: s.routeId,
      permissionId: s.suggestedPermission.id
    }));

    return this.bulkLinkPermissions(mappings);
  }

  // ============================================================================
  // Coverage & Statistics
  // ============================================================================

  /**
   * Fetch coverage statistics
   * @returns Observable that completes when fetch finishes
   */
  fetchCoverageStats(): Observable<void> {
    return this.dataService.getCoverageStats().pipe(
      tap(response => {
        if (response.success) {
          this.store.updateCoverage(response.data);
        }
      }),
      map(() => void 0),
      catchError(error => {
        console.error('Failed to fetch coverage stats:', error);
        return of(void 0); // Don't fail main operation
      })
    );
  }

  /**
   * Fetch permission coverage details
   * @returns Observable that completes when fetch finishes
   */
  fetchPermissionCoverage(): Observable<void> {
    return this.dataService.getPermissionCoverage().pipe(
      tap(response => {
        if (response.success) {
          this.store.cachePermissionCoverage(response.data);
        }
      }),
      map(() => void 0),
      catchError(error => {
        this.showError('Failed to fetch permission coverage', error);
        return throwError(() => error);
      })
    );
  }

  // ============================================================================
  // Filters & Pagination
  // ============================================================================

  /**
   * Update filter configuration
   * Triggers automatic data refresh (debounced)
   * @param filters Partial filter updates
   */
  updateFilters(filters: Partial<RouteFilter>): void {
    this.store.updateFilters(filters);
    // Reset to page 1 when filters change
    this.store.setPage(1);
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.store.resetFilters();
    this.store.setPage(1);
  }

  /**
   * Update pagination
   * @param page Page number to load
   * @param limit Optional page size
   */
  updatePagination(page: number, limit?: number): void {
    if (limit) {
      this.store.setPageSize(limit);
    }
    this.store.setPage(page);

    const filters = this.query.getValue().filters;
    const pageSize = limit || this.query.getValue().pagination.limit;
    this.fetchRoutes(filtersToQueryDto(filters, page, pageSize)).subscribe();
  }

  // ============================================================================
  // Selection Management
  // ============================================================================

  /**
   * Select a route for detail view
   * @param routeId Route ID to select (null to deselect)
   */
  selectRoute(routeId: string | null): void {
    this.store.setSelectedRoute(routeId);
    if (routeId) {
      this.store.setActive(routeId);
    }
  }

  /**
   * Toggle route in bulk selection
   * @param routeId Route ID to toggle
   */
  toggleBulkSelection(routeId: string): void {
    const isSelected = this.query.isRouteSelected(routeId);
    if (isSelected) {
      this.store.removeFromBulkSelection(routeId);
    } else {
      this.store.addToBulkSelection(routeId);
    }
  }

  /**
   * Select all visible routes in current filter/page
   */
  selectAll(): void {
    const visibleRoutes = this.query.getValue().ids as string[];
    this.store.setBulkSelection(visibleRoutes);
  }

  /**
   * Deselect all routes
   */
  deselectAll(): void {
    this.store.clearBulkSelection();
  }

  /**
   * Toggle bulk selection mode
   * @param enabled Whether to enable bulk selection
   */
  setBulkSelectionMode(enabled: boolean): void {
    this.store.setBulkSelectionMode(enabled);
  }

  // ============================================================================
  // View Mode Management
  // ============================================================================

  /**
   * Change visualization mode
   * @param mode View mode to activate
   */
  setViewMode(mode: ViewMode): void {
    this.store.setViewMode(mode);

    // Build tree if switching to tree view and not cached
    if (mode === 'tree' && !this.query.getValue().cache.routeTree) {
      this.buildRouteTree().subscribe();
    }
  }

  // ============================================================================
  // Tree Building
  // ============================================================================

  /**
   * Build hierarchical route tree grouped by controller
   * @returns Observable with tree structure
   */
  buildRouteTree(): Observable<RouteTreeNode[]> {
    const routes = this.query.getAll();
    const tree = buildRouteTree(routes);
    this.store.cacheRouteTree(tree);
    return of(tree);
  }

  /**
   * Toggle expansion state of a tree node
   * @param nodeId Node identifier
   */
  toggleNodeExpansion(nodeId: string): void {
    const tree = this.query.getValue().cache.routeTree;
    if (!tree) return;

    const node = this.findNodeById(tree, nodeId);
    if (node) {
      this.store.updateTreeNodeExpansion(nodeId, !node.expanded);
    }
  }

  /**
   * Find a node in the tree by ID
   * @param nodes Tree to search
   * @param nodeId Node ID to find
   * @returns Found node or null
   */
  private findNodeById(nodes: RouteTreeNode[], nodeId: string): RouteTreeNode | null {
    for (const node of nodes) {
      if (node.id === nodeId) return node;
      if (node.children.length > 0) {
        const found = this.findNodeById(node.children, nodeId);
        if (found) return found;
      }
    }
    return null;
  }

  // ============================================================================
  // Export
  // ============================================================================

  /**
   * Export route configuration to file
   * @param format Export format
   * @returns Observable that completes when export finishes
   */
  exportConfiguration(format: 'json' | 'csv'): Observable<void> {
    return this.dataService.exportConfiguration(format).pipe(
      tap(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `routes-${Date.now()}.${format}`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.showSuccess(`Exported routes as ${format.toUpperCase()}`);
      }),
      map(() => void 0),
      catchError(error => {
        this.showError('Failed to export routes', error);
        return throwError(() => error);
      })
    );
  }

  // ============================================================================
  // Cache Management
  // ============================================================================

  /**
   * Check if cache is valid
   * @returns True if cache can be used
   */
  isCacheValid(): boolean {
    return this.query.isCacheValid();
  }

  /**
   * Invalidate cache (force refresh on next fetch)
   */
  invalidateCache(): void {
    this.store.invalidateCache();
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.store.clearCache();
  }

  // ============================================================================
  // Notification Helpers
  // ============================================================================

  /**
   * Show success message
   * @param message Success message
   */
  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  /**
   * Show error message
   * @param message Error message
   * @param error Optional error object
   */
  private showError(message: string, error?: any): void {
    const errorMsg = error?.message || message;
    this.snackBar.open(errorMsg, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  /**
   * Show warning message
   * @param message Warning message
   */
  private showWarning(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 4000,
      panelClass: ['warning-snackbar']
    });
  }
}
