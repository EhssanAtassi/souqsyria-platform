import { HttpMethod, RouteReference } from './route.model';

/**
 * Overall route coverage statistics
 * Provides high-level metrics about permission mapping completeness
 */
export interface CoverageStats {
  /**
   * Total number of routes in the system
   */
  totalRoutes: number;

  /**
   * Number of routes with assigned permissions
   */
  mappedRoutes: number;

  /**
   * Number of routes without permissions (not public)
   */
  unmappedRoutes: number;

  /**
   * Number of routes marked as public access
   */
  publicRoutes: number;

  /**
   * Percentage of routes with coverage (mapped + public)
   * Calculated as: ((mappedRoutes + publicRoutes) / totalRoutes) * 100
   */
  coveragePercentage: number;

  /**
   * Last time coverage was calculated
   */
  lastUpdated: Date | null;
}

/**
 * Permission-specific coverage details
 * Shows which permissions protect which routes
 */
export interface PermissionCoverageItem {
  /**
   * Permission unique identifier
   */
  permissionId: string;

  /**
   * Permission name/code
   */
  permissionName: string;

  /**
   * Number of routes protected by this permission
   */
  routeCount: number;

  /**
   * List of routes using this permission
   */
  routes: RouteReference[];
}

/**
 * Controller-specific coverage metrics
 * Groups coverage by NestJS controller
 */
export interface ControllerCoverage {
  /**
   * Controller name
   */
  controller: string;

  /**
   * Total routes in this controller
   */
  totalRoutes: number;

  /**
   * Number of mapped routes
   */
  mappedRoutes: number;

  /**
   * Number of public routes
   */
  publicRoutes: number;

  /**
   * Number of unmapped routes
   */
  unmappedRoutes: number;

  /**
   * Coverage percentage for this controller
   */
  coveragePercentage: number;

  /**
   * List of routes in this controller
   */
  routes: RouteReference[];
}

/**
 * Method-specific coverage breakdown
 * Analyzes coverage by HTTP method
 */
export interface MethodCoverage {
  /**
   * HTTP method
   */
  method: HttpMethod;

  /**
   * Total routes using this method
   */
  totalRoutes: number;

  /**
   * Number of mapped routes
   */
  mappedRoutes: number;

  /**
   * Number of public routes
   */
  publicRoutes: number;

  /**
   * Number of unmapped routes
   */
  unmappedRoutes: number;

  /**
   * Coverage percentage for this method
   */
  coveragePercentage: number;
}

/**
 * Time-series coverage data point
 * Used for trend visualization
 */
export interface CoverageTrend {
  /**
   * Timestamp of measurement
   */
  timestamp: Date;

  /**
   * Coverage percentage at this time
   */
  coveragePercentage: number;

  /**
   * Number of mapped routes
   */
  mappedRoutes: number;

  /**
   * Number of unmapped routes
   */
  unmappedRoutes: number;

  /**
   * Total routes at this time
   */
  totalRoutes: number;
}

/**
 * Default coverage stats for initial state
 */
export const DEFAULT_COVERAGE_STATS: CoverageStats = {
  totalRoutes: 0,
  mappedRoutes: 0,
  unmappedRoutes: 0,
  publicRoutes: 0,
  coveragePercentage: 0,
  lastUpdated: null
};

/**
 * Calculate coverage percentage from stats
 * @param mapped Number of mapped routes
 * @param publicRoutes Number of public routes
 * @param total Total number of routes
 * @returns Coverage percentage (0-100)
 */
export function calculateCoveragePercentage(
  mapped: number,
  publicRoutes: number,
  total: number
): number {
  if (total === 0) return 0;
  return Math.round(((mapped + publicRoutes) / total) * 100);
}

/**
 * Determine coverage health status
 * @param percentage Coverage percentage
 * @returns Health status classification
 */
export function getCoverageHealth(percentage: number): 'excellent' | 'good' | 'fair' | 'poor' {
  if (percentage >= 90) return 'excellent';
  if (percentage >= 75) return 'good';
  if (percentage >= 50) return 'fair';
  return 'poor';
}
