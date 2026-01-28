import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import {
  Route,
  RouteFilter,
  CoverageStats,
  RouteTreeNode,
  PermissionCoverageItem,
  DEFAULT_ROUTE_FILTER,
  DEFAULT_COVERAGE_STATS,
  createDefaultPaginationMeta,
  PaginationMeta
} from '../models';

/**
 * View mode for route visualization
 * - list: Standard table view
 * - tree: Hierarchical controller tree view
 * - matrix: Permission-route matrix view
 */
export type ViewMode = 'list' | 'tree' | 'matrix';

/**
 * UI state for route management interface
 */
export interface RouteManagementUIState {
  /**
   * Global loading indicator for main operations
   */
  loading: boolean;

  /**
   * Per-route operation loading state
   * Key: routeId, Value: loading status
   */
  operationLoading: Record<string, boolean>;

  /**
   * Currently selected route ID for detail view
   */
  selectedRouteId: string | null;

  /**
   * Bulk selected route IDs for batch operations
   */
  bulkSelectedIds: string[];

  /**
   * Current visualization mode
   */
  viewMode: ViewMode;

  /**
   * Whether bulk selection mode is active
   */
  bulkSelectionMode: boolean;
}

/**
 * Cache state for expensive computed data
 */
export interface RouteManagementCache {
  /**
   * Timestamp of last successful data fetch (ms)
   */
  lastFetched: number | null;

  /**
   * Cache time-to-live in milliseconds
   * @default 300000 (5 minutes)
   */
  ttl: number;

  /**
   * Cached hierarchical route tree
   */
  routeTree: RouteTreeNode[] | null;

  /**
   * Cached permission coverage data
   */
  permissionCoverage: PermissionCoverageItem[] | null;

  /**
   * Cache invalidation flag
   */
  isStale: boolean;
}

/**
 * Complete state interface for route management
 * Extends Akita EntityState with domain-specific properties
 */
export interface RouteManagementState extends EntityState<Route, string> {
  /**
   * UI interaction state
   */
  ui: RouteManagementUIState;

  /**
   * Active filter configuration
   */
  filters: RouteFilter;

  /**
   * Pagination metadata
   */
  pagination: PaginationMeta;

  /**
   * Coverage statistics
   */
  coverage: CoverageStats;

  /**
   * Cached computed data
   */
  cache: RouteManagementCache;
}

/**
 * Initial state configuration
 */
function createInitialState(): Partial<RouteManagementState> {
  return {
    ui: {
      loading: false,
      operationLoading: {},
      selectedRouteId: null,
      bulkSelectedIds: [],
      viewMode: 'list',
      bulkSelectionMode: false
    },
    filters: { ...DEFAULT_ROUTE_FILTER },
    pagination: createDefaultPaginationMeta(),
    coverage: { ...DEFAULT_COVERAGE_STATS },
    cache: {
      lastFetched: null,
      ttl: 300000, // 5 minutes
      routeTree: null,
      permissionCoverage: null,
      isStale: false
    }
  };
}

/**
 * Akita entity store for route management
 * Manages route entities and related state
 */
@Injectable()
@StoreConfig({ name: 'route-management', idKey: 'id' })
export class RouteManagementStore extends EntityStore<RouteManagementState> {
  constructor() {
    super(createInitialState());
  }

  // ============================================================================
  // UI State Mutations
  // ============================================================================

  /**
   * Set global loading state
   * @param loading Loading status
   */
  override setLoading(loading: boolean): void {
    this.update(state => ({
      ui: { ...state.ui, loading }
    }));
  }

  /**
   * Set loading state for specific route operation
   * @param routeId Route being operated on
   * @param loading Loading status
   */
  setOperationLoading(routeId: string, loading: boolean): void {
    this.update(state => ({
      ui: {
        ...state.ui,
        operationLoading: {
          ...state.ui.operationLoading,
          [routeId]: loading
        }
      }
    }));
  }

  /**
   * Clear all operation loading states
   */
  clearOperationLoading(): void {
    this.update(state => ({
      ui: { ...state.ui, operationLoading: {} }
    }));
  }

  /**
   * Set selected route for detail view
   * @param routeId Route ID to select (null to deselect)
   */
  setSelectedRoute(routeId: string | null): void {
    this.update(state => ({
      ui: { ...state.ui, selectedRouteId: routeId }
    }));
  }

  /**
   * Set bulk selected routes
   * @param routeIds Array of selected route IDs
   */
  setBulkSelection(routeIds: string[]): void {
    this.update(state => ({
      ui: { ...state.ui, bulkSelectedIds: routeIds }
    }));
  }

  /**
   * Add route to bulk selection
   * @param routeId Route ID to add
   */
  addToBulkSelection(routeId: string): void {
    this.update(state => ({
      ui: {
        ...state.ui,
        bulkSelectedIds: [...new Set([...state.ui.bulkSelectedIds, routeId])]
      }
    }));
  }

  /**
   * Remove route from bulk selection
   * @param routeId Route ID to remove
   */
  removeFromBulkSelection(routeId: string): void {
    this.update(state => ({
      ui: {
        ...state.ui,
        bulkSelectedIds: state.ui.bulkSelectedIds.filter(id => id !== routeId)
      }
    }));
  }

  /**
   * Clear all bulk selections
   */
  clearBulkSelection(): void {
    this.update(state => ({
      ui: { ...state.ui, bulkSelectedIds: [] }
    }));
  }

  /**
   * Toggle bulk selection mode
   * @param enabled Whether bulk selection is active
   */
  setBulkSelectionMode(enabled: boolean): void {
    this.update(state => ({
      ui: {
        ...state.ui,
        bulkSelectionMode: enabled,
        bulkSelectedIds: enabled ? state.ui.bulkSelectedIds : []
      }
    }));
  }

  /**
   * Set visualization mode
   * @param mode View mode to activate
   */
  setViewMode(mode: ViewMode): void {
    this.update(state => ({
      ui: { ...state.ui, viewMode: mode }
    }));
  }

  // ============================================================================
  // Filter Mutations
  // ============================================================================

  /**
   * Update filter configuration
   * @param filters Partial filter updates
   */
  updateFilters(filters: Partial<RouteFilter>): void {
    this.update(state => ({
      filters: { ...state.filters, ...filters }
    }));
  }

  /**
   * Reset filters to default values
   */
  resetFilters(): void {
    this.update({ filters: { ...DEFAULT_ROUTE_FILTER } });
  }

  // ============================================================================
  // Pagination Mutations
  // ============================================================================

  /**
   * Update pagination metadata
   * @param pagination Pagination data from API
   */
  updatePagination(pagination: PaginationMeta): void {
    this.update({ pagination });
  }

  /**
   * Set current page
   * @param page Page number
   */
  setPage(page: number): void {
    this.update(state => ({
      pagination: { ...state.pagination, page }
    }));
  }

  /**
   * Set page size
   * @param limit Items per page
   */
  setPageSize(limit: number): void {
    this.update(state => ({
      pagination: { ...state.pagination, limit, page: 1 }
    }));
  }

  // ============================================================================
  // Coverage Mutations
  // ============================================================================

  /**
   * Update coverage statistics
   * @param coverage Coverage data from API
   */
  updateCoverage(coverage: CoverageStats): void {
    this.update({ coverage });
  }

  // ============================================================================
  // Cache Mutations
  // ============================================================================

  /**
   * Update cache timestamp
   */
  updateCacheTimestamp(): void {
    this.update(state => ({
      cache: {
        ...state.cache,
        lastFetched: Date.now(),
        isStale: false
      }
    }));
  }

  /**
   * Mark cache as stale (needs refresh)
   */
  invalidateCache(): void {
    this.update(state => ({
      cache: { ...state.cache, isStale: true }
    }));
  }

  /**
   * Store route tree in cache
   * @param routeTree Computed tree structure
   */
  cacheRouteTree(routeTree: RouteTreeNode[]): void {
    this.update(state => ({
      cache: { ...state.cache, routeTree }
    }));
  }

  /**
   * Store permission coverage in cache
   * @param permissionCoverage Coverage data
   */
  cachePermissionCoverage(permissionCoverage: PermissionCoverageItem[]): void {
    this.update(state => ({
      cache: { ...state.cache, permissionCoverage }
    }));
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.update(state => ({
      cache: {
        ...state.cache,
        routeTree: null,
        permissionCoverage: null,
        lastFetched: null,
        isStale: false
      }
    }));
  }

  /**
   * Update a specific tree node's expanded state
   * @param nodeId Node identifier
   * @param expanded New expanded state
   */
  updateTreeNodeExpansion(nodeId: string, expanded: boolean): void {
    const tree = this.getValue().cache.routeTree;
    if (!tree) return;

    const updateNode = (nodes: RouteTreeNode[]): RouteTreeNode[] => {
      return nodes.map(node => {
        if (node.id === nodeId) {
          return { ...node, expanded };
        }
        if (node.children.length > 0) {
          return { ...node, children: updateNode(node.children) };
        }
        return node;
      });
    };

    this.cacheRouteTree(updateNode(tree));
  }

  // ============================================================================
  // Reset Operations
  // ============================================================================

  /**
   * Reset store to initial state
   */
  resetStore(): void {
    this.set(createInitialState());
  }

  /**
   * Reset only UI state
   */
  resetUIState(): void {
    this.update({
      ui: {
        loading: false,
        operationLoading: {},
        selectedRouteId: null,
        bulkSelectedIds: [],
        viewMode: 'list',
        bulkSelectionMode: false
      }
    });
  }
}
