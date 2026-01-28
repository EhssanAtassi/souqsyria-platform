import { Route } from './route.model';

/**
 * Node type in the hierarchical route tree
 * - controller: Represents a NestJS controller (parent node)
 * - route: Represents an individual API route (leaf node)
 */
export type RouteTreeNodeType = 'controller' | 'route';

/**
 * Hierarchical tree node for organizing routes by controller
 * Used for tree view visualization
 */
export interface RouteTreeNode {
  /**
   * Unique identifier for this node
   * Format: 'controller:{name}' or 'route:{id}'
   */
  id: string;

  /**
   * Display label for the node
   */
  label: string;

  /**
   * Node type classification
   */
  type: RouteTreeNodeType;

  /**
   * Depth level in tree (0 = root)
   */
  level: number;

  /**
   * Whether node is expanded in UI
   */
  expanded: boolean;

  /**
   * Child nodes (routes for controller, empty for route)
   */
  children: RouteTreeNode[];

  /**
   * Parent node ID (null for root-level controllers)
   */
  parentId: string | null;

  // Controller-specific properties
  /**
   * Controller name (only for controller nodes)
   */
  controller?: string;

  /**
   * Total routes in this controller
   */
  routeCount?: number;

  /**
   * Number of mapped routes in controller
   */
  mappedCount?: number;

  /**
   * Coverage percentage for controller
   */
  coveragePercentage?: number;

  // Route-specific properties
  /**
   * Full route data (only for route nodes)
   */
  route?: Route;

  /**
   * Quick access to permission ID
   */
  permissionId?: string | null;

  /**
   * Quick access to public flag
   */
  isPublic?: boolean;
}

/**
 * Tree view configuration options
 */
export interface RouteTreeConfig {
  /**
   * Initially expand all controllers
   * @default false
   */
  expandAll: boolean;

  /**
   * Show only controllers with unmapped routes
   * @default false
   */
  showOnlyUnmapped: boolean;

  /**
   * Group public routes separately
   * @default false
   */
  groupPublicRoutes: boolean;

  /**
   * Sort controllers by coverage (lowest first)
   * @default false
   */
  sortByCoverage: boolean;
}

/**
 * Tree node selection state
 */
export interface TreeNodeSelection {
  /**
   * Currently selected node ID
   */
  selectedNodeId: string | null;

  /**
   * Type of selected node
   */
  selectedNodeType: RouteTreeNodeType | null;

  /**
   * Bulk selected route IDs
   */
  bulkSelectedRouteIds: string[];
}

/**
 * Tree statistics for summary display
 */
export interface TreeStats {
  /**
   * Total number of controllers
   */
  totalControllers: number;

  /**
   * Total number of routes
   */
  totalRoutes: number;

  /**
   * Controllers with 100% coverage
   */
  fullyCoveredControllers: number;

  /**
   * Controllers with 0% coverage
   */
  uncoveredControllers: number;

  /**
   * Average coverage across all controllers
   */
  averageCoverage: number;
}

/**
 * Default tree configuration
 */
export const DEFAULT_TREE_CONFIG: RouteTreeConfig = {
  expandAll: false,
  showOnlyUnmapped: false,
  groupPublicRoutes: false,
  sortByCoverage: false
};

/**
 * Helper to check if a node is a controller
 * @param node Tree node to check
 * @returns True if node represents a controller
 */
export function isControllerNode(node: RouteTreeNode): boolean {
  return node.type === 'controller';
}

/**
 * Helper to check if a node is a route
 * @param node Tree node to check
 * @returns True if node represents a route
 */
export function isRouteNode(node: RouteTreeNode): boolean {
  return node.type === 'route';
}

/**
 * Helper to get route status badge color
 * @param node Route tree node
 * @returns Material color for status badge
 */
export function getNodeStatusColor(node: RouteTreeNode): 'success' | 'warn' | 'accent' | undefined {
  if (node.type === 'controller') {
    if (node.coveragePercentage === 100) return 'success';
    if (node.coveragePercentage === 0) return 'warn';
    return 'accent';
  }

  if (node.isPublic) return 'accent';
  if (node.permissionId) return 'success';
  return 'warn';
}

/**
 * Flatten tree structure to array
 * @param nodes Tree nodes to flatten
 * @param includeCollapsed Whether to include children of collapsed nodes
 * @returns Flat array of visible nodes
 */
export function flattenTree(
  nodes: RouteTreeNode[],
  includeCollapsed: boolean = false
): RouteTreeNode[] {
  const result: RouteTreeNode[] = [];

  function traverse(node: RouteTreeNode) {
    result.push(node);
    if (includeCollapsed || node.expanded) {
      node.children.forEach(traverse);
    }
  }

  nodes.forEach(traverse);
  return result;
}
