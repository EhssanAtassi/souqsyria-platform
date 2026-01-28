import { Route, RouteTreeNode } from '../models';

/**
 * Build hierarchical route tree grouped by controller
 * Converts flat route array into nested tree structure for visualization
 *
 * @param routes Flat array of routes
 * @param config Optional configuration for tree building
 * @returns Array of root-level controller nodes with nested route children
 */
export function buildRouteTree(
  routes: Route[],
  config?: {
    expandAll?: boolean;
    sortByCoverage?: boolean;
  }
): RouteTreeNode[] {
  const expandAll = config?.expandAll ?? false;
  const sortByCoverage = config?.sortByCoverage ?? false;

  // Group routes by controller
  const routesByController = groupRoutesByController(routes);

  // Build controller nodes
  const controllerNodes: RouteTreeNode[] = [];

  routesByController.forEach((controllerRoutes, controllerName) => {
    const mappedCount = controllerRoutes.filter(r => r.permissionId).length;
    const publicCount = controllerRoutes.filter(r => r.isPublic).length;
    const totalCount = controllerRoutes.length;
    const coveragePercentage = calculateCoverage(mappedCount, publicCount, totalCount);

    const controllerNode: RouteTreeNode = {
      id: `controller:${controllerName}`,
      label: controllerName,
      type: 'controller',
      level: 0,
      expanded: expandAll,
      children: [],
      parentId: null,
      controller: controllerName,
      routeCount: totalCount,
      mappedCount,
      coveragePercentage
    };

    // Build route child nodes
    controllerNode.children = controllerRoutes.map(route =>
      createRouteNode(route, controllerNode.id)
    );

    controllerNodes.push(controllerNode);
  });

  // Sort controllers
  if (sortByCoverage) {
    controllerNodes.sort((a, b) => {
      // Sort by coverage ascending (show lowest coverage first)
      return (a.coveragePercentage || 0) - (b.coveragePercentage || 0);
    });
  } else {
    // Sort alphabetically by name
    controllerNodes.sort((a, b) => a.label.localeCompare(b.label));
  }

  return controllerNodes;
}

/**
 * Create a route tree node from a route entity
 * @param route Route entity
 * @param parentId Parent controller node ID
 * @returns Route tree node
 */
function createRouteNode(route: Route, parentId: string): RouteTreeNode {
  return {
    id: `route:${route.id}`,
    label: `[${route.method}] ${route.path}`,
    type: 'route',
    level: 1,
    expanded: false, // Routes are leaf nodes, no children
    children: [],
    parentId,
    route,
    permissionId: route.permissionId,
    isPublic: route.isPublic
  };
}

/**
 * Group routes by controller name
 * @param routes Flat route array
 * @returns Map of controller name to routes
 */
function groupRoutesByController(routes: Route[]): Map<string, Route[]> {
  const grouped = new Map<string, Route[]>();

  routes.forEach(route => {
    const existing = grouped.get(route.controller) || [];
    grouped.set(route.controller, [...existing, route]);
  });

  // Sort routes within each controller by path
  grouped.forEach((controllerRoutes, controller) => {
    controllerRoutes.sort((a, b) => {
      // Sort by method first, then by path
      if (a.method !== b.method) {
        return methodOrder(a.method) - methodOrder(b.method);
      }
      return a.path.localeCompare(b.path);
    });
    grouped.set(controller, controllerRoutes);
  });

  return grouped;
}

/**
 * Get sort order for HTTP methods
 * @param method HTTP method
 * @returns Sort order number
 */
function methodOrder(method: string): number {
  const order: Record<string, number> = {
    GET: 1,
    POST: 2,
    PUT: 3,
    PATCH: 4,
    DELETE: 5
  };
  return order[method] || 999;
}

/**
 * Calculate coverage percentage
 * @param mapped Number of mapped routes
 * @param publicRoutes Number of public routes
 * @param total Total routes
 * @returns Coverage percentage (0-100)
 */
function calculateCoverage(
  mapped: number,
  publicRoutes: number,
  total: number
): number {
  if (total === 0) return 0;
  return Math.round(((mapped + publicRoutes) / total) * 100);
}

/**
 * Expand or collapse all nodes in tree
 * @param nodes Tree nodes to modify
 * @param expanded New expanded state
 * @returns Modified tree
 */
export function setAllNodesExpanded(
  nodes: RouteTreeNode[],
  expanded: boolean
): RouteTreeNode[] {
  return nodes.map(node => ({
    ...node,
    expanded,
    children: setAllNodesExpanded(node.children, expanded)
  }));
}

/**
 * Find a node by ID in the tree
 * @param nodes Tree to search
 * @param nodeId Node ID to find
 * @returns Found node or null
 */
export function findNodeById(
  nodes: RouteTreeNode[],
  nodeId: string
): RouteTreeNode | null {
  for (const node of nodes) {
    if (node.id === nodeId) return node;
    if (node.children.length > 0) {
      const found = findNodeById(node.children, nodeId);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Update a specific node in the tree
 * @param nodes Tree to update
 * @param nodeId Node ID to update
 * @param updates Partial updates to apply
 * @returns Updated tree
 */
export function updateNode(
  nodes: RouteTreeNode[],
  nodeId: string,
  updates: Partial<RouteTreeNode>
): RouteTreeNode[] {
  return nodes.map(node => {
    if (node.id === nodeId) {
      return { ...node, ...updates };
    }
    if (node.children.length > 0) {
      return {
        ...node,
        children: updateNode(node.children, nodeId, updates)
      };
    }
    return node;
  });
}

/**
 * Flatten tree to array of nodes
 * @param nodes Tree to flatten
 * @param includeCollapsed Whether to include children of collapsed nodes
 * @returns Flat array
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

/**
 * Filter tree by controller coverage
 * @param nodes Tree to filter
 * @param minCoverage Minimum coverage percentage (0-100)
 * @param maxCoverage Maximum coverage percentage (0-100)
 * @returns Filtered tree
 */
export function filterTreeByCoverage(
  nodes: RouteTreeNode[],
  minCoverage: number = 0,
  maxCoverage: number = 100
): RouteTreeNode[] {
  return nodes.filter(node => {
    if (node.type !== 'controller') return true;
    const coverage = node.coveragePercentage || 0;
    return coverage >= minCoverage && coverage <= maxCoverage;
  });
}

/**
 * Filter tree to show only unmapped routes
 * @param nodes Tree to filter
 * @returns Filtered tree with only controllers containing unmapped routes
 */
export function filterTreeUnmappedOnly(
  nodes: RouteTreeNode[]
): RouteTreeNode[] {
  return nodes
    .map(node => {
      if (node.type === 'controller') {
        const unmappedChildren = node.children.filter(child => {
          return child.route && !child.route.permissionId && !child.route.isPublic;
        });

        if (unmappedChildren.length === 0) return null;

        return {
          ...node,
          children: unmappedChildren,
          routeCount: unmappedChildren.length
        };
      }
      return node;
    })
    .filter((node): node is RouteTreeNode => node !== null);
}

/**
 * Get tree statistics
 * @param nodes Tree to analyze
 * @returns Tree statistics
 */
export function getTreeStats(nodes: RouteTreeNode[]): {
  totalControllers: number;
  totalRoutes: number;
  fullyCoveredControllers: number;
  uncoveredControllers: number;
  averageCoverage: number;
} {
  const controllers = nodes.filter(n => n.type === 'controller');

  return {
    totalControllers: controllers.length,
    totalRoutes: controllers.reduce((sum, c) => sum + (c.routeCount || 0), 0),
    fullyCoveredControllers: controllers.filter(c => c.coveragePercentage === 100).length,
    uncoveredControllers: controllers.filter(c => c.coveragePercentage === 0).length,
    averageCoverage:
      controllers.length > 0
        ? Math.round(
            controllers.reduce((sum, c) => sum + (c.coveragePercentage || 0), 0) /
              controllers.length
          )
        : 0
  };
}
