import { HttpMethod, RouteStatus } from './route.model';

/**
 * Client-side filter state for route list
 * Used by the UI components to filter displayed routes
 */
export interface RouteFilter {
  /**
   * Filter by HTTP method
   * 'ALL' shows all methods
   */
  method: HttpMethod | 'ALL';

  /**
   * Filter by mapping status
   * 'all' shows all statuses
   */
  status: RouteStatus | 'all';

  /**
   * Filter by controller name
   * null shows all controllers
   */
  controller: string | null;

  /**
   * Filter by assigned permission
   * null shows all permissions
   */
  permissionId: string | null;

  /**
   * Search term for fuzzy matching on path, controller, or handler
   * Empty string shows all routes
   */
  searchTerm: string;
}

/**
 * Query parameters for paginated route fetching from API
 * Maps to backend QueryRoutesDto
 */
export interface QueryRoutesDto {
  /**
   * Filter by specific HTTP method
   */
  method?: HttpMethod;

  /**
   * Filter by mapping status
   */
  status?: RouteStatus;

  /**
   * Filter by controller name
   */
  controller?: string;

  /**
   * Filter by assigned permission ID
   */
  permissionId?: string;

  /**
   * Search term for path, controller, or handler
   */
  search?: string;

  /**
   * Page number (1-based)
   * @default 1
   */
  page?: number;

  /**
   * Number of items per page
   * @default 50
   */
  limit?: number;

  /**
   * Field to sort by
   * @default 'path'
   */
  sortBy?: string;

  /**
   * Sort direction
   * @default 'ASC'
   */
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * Default filter state for initial load
 */
export const DEFAULT_ROUTE_FILTER: RouteFilter = {
  method: 'ALL',
  status: 'all',
  controller: null,
  permissionId: null,
  searchTerm: ''
};

/**
 * Helper function to check if filters are in default state
 * @param filters Current filter configuration
 * @returns True if all filters are at default values
 */
export function hasActiveFilters(filters: RouteFilter): boolean {
  return (
    filters.method !== DEFAULT_ROUTE_FILTER.method ||
    filters.status !== DEFAULT_ROUTE_FILTER.status ||
    filters.controller !== DEFAULT_ROUTE_FILTER.controller ||
    filters.permissionId !== DEFAULT_ROUTE_FILTER.permissionId ||
    filters.searchTerm !== DEFAULT_ROUTE_FILTER.searchTerm
  );
}

/**
 * Convert client-side filters to API query parameters
 * @param filters UI filter state
 * @param page Current page number
 * @param limit Items per page
 * @returns API-compatible query DTO
 */
export function filtersToQueryDto(
  filters: RouteFilter,
  page: number = 1,
  limit: number = 50
): QueryRoutesDto {
  const dto: QueryRoutesDto = {
    page,
    limit
  };

  if (filters.method !== 'ALL') {
    dto.method = filters.method;
  }

  if (filters.status !== 'all') {
    dto.status = filters.status;
  }

  if (filters.controller) {
    dto.controller = filters.controller;
  }

  if (filters.permissionId) {
    dto.permissionId = filters.permissionId;
  }

  if (filters.searchTerm.trim()) {
    dto.search = filters.searchTerm.trim();
  }

  return dto;
}
